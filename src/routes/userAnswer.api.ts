import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "@/libs/prisma";

const isValidPhoneNumber = (phoneNumber: unknown): phoneNumber is string => {
  return typeof phoneNumber === "string" && /^0[67]\d{8}$/.test(phoneNumber);
};

const isValidCodePostal = (codePostal: unknown): codePostal is string => {
  return typeof codePostal === "string" && /^\d{5}$/.test(codePostal);
};

const parseBirthdate = (birthdate: unknown): Date | null => {
  if (!(typeof birthdate === "string" || birthdate instanceof Date)) {
    return null;
  }

  const parsedDate = new Date(birthdate);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const sanitizeNamePart = (value: string): string => {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
};

const generateUsername = (
  lastName: unknown,
  firstName: unknown,
): string | null => {
  if (typeof lastName !== "string" || typeof firstName !== "string") {
    return null;
  }

  const username = `${sanitizeNamePart(lastName)}${sanitizeNamePart(firstName)}`;
  return username.length > 0 ? username : null;
};

const normalizeIds = (ids: unknown): number[] => {
  if (!Array.isArray(ids)) return [];

  const normalized = ids
    .map((id) => (typeof id === "string" ? Number.parseInt(id, 10) : id))
    .filter((id): id is number => Number.isInteger(id) && id > 0);

  return [...new Set(normalized)];
};

const normalizeOptionalId = (value: unknown): number | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const parsed =
    typeof value === "string" ? Number.parseInt(value, 10) : (value as number);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
};

const findInvalidSlotIdsForCollection = async (
  slotIds: number[],
  collectionId: number,
): Promise<number[]> => {
  if (slotIds.length === 0) return [];

  const existingSlots = await prisma.slot.findMany({
    where: { id: { in: slotIds }, collectionId },
    select: { id: true },
  });

  const existingIds = new Set(existingSlots.map((slot) => slot.id));
  return slotIds.filter((id) => !existingIds.has(id));
};

const findInvalidZoneIdsForCollection = async (
  zoneIds: number[],
  collectionId: number,
): Promise<number[]> => {
  if (zoneIds.length === 0) return [];

  const existingLinks = await prisma.collectionZone.findMany({
    where: {
      collectionId,
      zoneId: { in: zoneIds },
    },
    select: { zoneId: true },
  });

  const existingIds = new Set(existingLinks.map((link) => link.zoneId));
  return zoneIds.filter((id) => !existingIds.has(id));
};

type AnswerSelection = {
  slotId: number | null;
  zoneId: number | null;
};

const buildSelections = (
  slotIds: number[],
  zoneIds: number[],
  slotId: number | null | undefined,
  zoneId: number | null | undefined,
): AnswerSelection[] => {
  if (slotIds.length > 0 && zoneIds.length > 0) {
    return slotIds.flatMap((s) =>
      zoneIds.map((z) => ({ slotId: s, zoneId: z })),
    );
  }

  if (slotIds.length > 0) {
    return slotIds.map((s) => ({ slotId: s, zoneId: zoneId ?? null }));
  }

  if (zoneIds.length > 0) {
    return zoneIds.map((z) => ({ slotId: slotId ?? null, zoneId: z }));
  }

  return [{ slotId: slotId ?? null, zoneId: zoneId ?? null }];
};

const dedupeSelections = (selections: AnswerSelection[]): AnswerSelection[] => {
  const seen = new Set<string>();
  const output: AnswerSelection[] = [];

  for (const selection of selections) {
    const key = `${selection.slotId ?? "null"}:${selection.zoneId ?? "null"}`;
    if (!seen.has(key)) {
      seen.add(key);
      output.push(selection);
    }
  }

  return output;
};

const userAnswerInclude = {
  user: {
    select: {
      id: true,
      lastName: true,
      firstName: true,
      username: true,
      birthdate: true,
      codePostal: true,
      email: true,
      phoneNumber: true,
    },
  },
  collectionUser: {
    include: {
      collection: true,
    },
  },
  slot: true,
  zone: true,
} as const;

export const createUserAnswer = async (req: Request, res: Response) => {
  try {
    const {
      lastName,
      firstName,
      birthdate,
      codePostal,
      phoneNumber,
      email,
      slotIds,
      zoneIds,
      slotId,
      zoneId,
    } = req.body;

    const rawCollectionId = req.body.collectionId ?? req.body.collecteId;
    const parsedCollectionId = Number.parseInt(String(rawCollectionId), 10);

    const normalizedSlotIds = normalizeIds(slotIds);
    const normalizedZoneIds = normalizeIds(zoneIds);
    const normalizedSlotId = normalizeOptionalId(slotId);
    const normalizedZoneId = normalizeOptionalId(zoneId);

    if (
      !lastName ||
      !firstName ||
      !birthdate ||
      !codePostal ||
      !phoneNumber ||
      !rawCollectionId
    ) {
      return res.status(400).json({
        error:
          "lastName, firstName, birthdate, codePostal, phoneNumber, and collectionId are required",
      });
    }

    if (!Number.isInteger(parsedCollectionId) || parsedCollectionId <= 0) {
      return res.status(400).json({ error: "Invalid collectionId" });
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        error:
          "Invalid phoneNumber format. Expected 10 digits, starting with 06 or 07, with no spaces or special characters",
      });
    }

    if (!isValidCodePostal(codePostal)) {
      return res.status(400).json({
        error: "Invalid codePostal format. Expected exactly 5 digits",
      });
    }

    const parsedBirthdate = parseBirthdate(birthdate);
    if (!parsedBirthdate) {
      return res.status(400).json({
        error: "Invalid birthdate format. Expected a valid date",
      });
    }

    const username = generateUsername(lastName, firstName);
    if (!username) {
      return res.status(400).json({
        error:
          "Unable to generate username from lastName and firstName. Use latin letters a-z",
      });
    }

    const slotIdsToValidate = dedupeSelections(
      buildSelections(
        normalizedSlotIds,
        normalizedZoneIds,
        normalizedSlotId,
        normalizedZoneId,
      ),
    )
      .map((selection) => selection.slotId)
      .filter((id): id is number => typeof id === "number");

    const zoneIdsToValidate = dedupeSelections(
      buildSelections(
        normalizedSlotIds,
        normalizedZoneIds,
        normalizedSlotId,
        normalizedZoneId,
      ),
    )
      .map((selection) => selection.zoneId)
      .filter((id): id is number => typeof id === "number");

    const invalidSlotIds = await findInvalidSlotIdsForCollection(
      [...new Set(slotIdsToValidate)],
      parsedCollectionId,
    );
    if (invalidSlotIds.length > 0) {
      return res.status(400).json({
        error: "Some slotIds are invalid or do not belong to this collection",
        invalidSlotIds,
      });
    }

    const invalidZoneIds = await findInvalidZoneIdsForCollection(
      [...new Set(zoneIdsToValidate)],
      parsedCollectionId,
    );
    if (invalidZoneIds.length > 0) {
      return res.status(400).json({
        error: "Some zoneIds are invalid or do not belong to this collection",
        invalidZoneIds,
      });
    }

    let user = await prisma.user.findFirst({
      where: {
        phoneNumber,
        username,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          lastName,
          firstName,
          username,
          birthdate: parsedBirthdate,
          codePostal,
          email: email || null,
          phoneNumber,
          password: null,
          isAdmin: false,
          isActive: true,
          type: "newcomer",
        },
      });
    }

    await prisma.collectionUser.upsert({
      where: {
        collectionId_userId: {
          collectionId: parsedCollectionId,
          userId: user.id,
        },
      },
      update: {},
      create: {
        collectionId: parsedCollectionId,
        userId: user.id,
      },
    });

    const selections = dedupeSelections(
      buildSelections(
        normalizedSlotIds,
        normalizedZoneIds,
        normalizedSlotId,
        normalizedZoneId,
      ),
    );

    const existingAnswers = await prisma.userAnswer.findMany({
      where: {
        userId: user.id,
        collectionId: parsedCollectionId,
      },
      select: { id: true },
    });

    const savedAnswers = await prisma.$transaction(async (tx) => {
      if (existingAnswers.length > 0) {
        await tx.userAnswer.deleteMany({
          where: {
            userId: user.id,
            collectionId: parsedCollectionId,
          },
        });
      }

      return Promise.all(
        selections.map((selection) =>
          tx.userAnswer.create({
            data: {
              userId: user.id,
              collectionId: parsedCollectionId,
              slotId: selection.slotId,
              zoneId: selection.zoneId,
            },
            include: userAnswerInclude,
          }),
        ),
      );
    });

    const statusCode = existingAnswers.length > 0 ? 200 : 201;

    if (savedAnswers.length === 1) {
      return res.status(statusCode).json(savedAnswers[0]);
    }

    return res.status(statusCode).json({
      count: savedAnswers.length,
      items: savedAnswers,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: "Failed to create user answer" });
  }
};

export const updateUserAnswer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      lastName,
      firstName,
      birthdate,
      codePostal,
      phoneNumber,
      email,
      slotId,
      zoneId,
      slotIds,
      zoneIds,
    } = req.body;

    if (!lastName || !firstName || !birthdate || !codePostal || !phoneNumber) {
      return res.status(400).json({
        error:
          "lastName, firstName, birthdate, codePostal, and phoneNumber are required",
      });
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        error:
          "Invalid phoneNumber format. Expected 10 digits, starting with 06 or 07, with no spaces or special characters",
      });
    }

    if (!isValidCodePostal(codePostal)) {
      return res.status(400).json({
        error: "Invalid codePostal format. Expected exactly 5 digits",
      });
    }

    const parsedBirthdate = parseBirthdate(birthdate);
    if (!parsedBirthdate) {
      return res.status(400).json({
        error: "Invalid birthdate format. Expected a valid date",
      });
    }

    const username = generateUsername(lastName, firstName);
    if (!username) {
      return res.status(400).json({
        error:
          "Unable to generate username from lastName and firstName. Use latin letters a-z",
      });
    }

    const userAnswerId = Array.isArray(id)
      ? Number.parseInt(id[0], 10)
      : Number.parseInt(id, 10);

    const existingAnswer = await prisma.userAnswer.findUnique({
      where: { id: userAnswerId },
      include: { user: true },
    });

    if (!existingAnswer) {
      return res.status(404).json({ error: "UserAnswer not found" });
    }

    if (Array.isArray(slotIds) && normalizeIds(slotIds).length > 1) {
      return res.status(400).json({
        error:
          "Use slotId (single value) when updating one user answer. Create multiple user answers for multiple slots.",
      });
    }

    if (Array.isArray(zoneIds) && normalizeIds(zoneIds).length > 1) {
      return res.status(400).json({
        error:
          "Use zoneId (single value) when updating one user answer. Create multiple user answers for multiple zones.",
      });
    }

    const fallbackSlotId = normalizeIds(slotIds)[0];
    const fallbackZoneId = normalizeIds(zoneIds)[0];

    const normalizedSlotId =
      normalizeOptionalId(slotId) ?? fallbackSlotId ?? undefined;
    const normalizedZoneId =
      normalizeOptionalId(zoneId) ?? fallbackZoneId ?? undefined;

    if (normalizedSlotId !== undefined && normalizedSlotId !== null) {
      const invalidSlotIds = await findInvalidSlotIdsForCollection(
        [normalizedSlotId],
        existingAnswer.collectionId,
      );
      if (invalidSlotIds.length > 0) {
        return res.status(400).json({
          error: "slotId is invalid or does not belong to this collection",
          invalidSlotIds,
        });
      }
    }

    if (normalizedZoneId !== undefined && normalizedZoneId !== null) {
      const invalidZoneIds = await findInvalidZoneIdsForCollection(
        [normalizedZoneId],
        existingAnswer.collectionId,
      );
      if (invalidZoneIds.length > 0) {
        return res.status(400).json({
          error: "zoneId is invalid or does not belong to this collection",
          invalidZoneIds,
        });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingAnswer.user.id },
        data: {
          lastName,
          firstName,
          username,
          birthdate: parsedBirthdate,
          codePostal,
          phoneNumber,
          email: email || null,
        },
      });

      await tx.userAnswer.update({
        where: { id: userAnswerId },
        data: {
          ...(normalizedSlotId !== undefined && { slotId: normalizedSlotId }),
          ...(normalizedZoneId !== undefined && { zoneId: normalizedZoneId }),
        },
      });
    });

    const updatedAnswer = await prisma.userAnswer.findUnique({
      where: { id: userAnswerId },
      include: userAnswerInclude,
    });

    return res.json(updatedAnswer);
  } catch (error) {
    console.error(error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        error: "Email or phone number already exists",
      });
    }

    return res.status(400).json({ error: "Failed to update user answer" });
  }
};

export const getUserAnswerByCollectionId = async (
  req: Request,
  res: Response,
) => {
  try {
    const { collectionId } = req.params;
    const id = Array.isArray(collectionId) ? collectionId[0] : collectionId;

    const answers = await prisma.userAnswer.findMany({
      where: { collectionId: Number.parseInt(id, 10) },
      include: userAnswerInclude,
    });

    return res.json(answers);
  } catch (error) {
    return res.status(400).json({ error: "Failed to fetch user answers" });
  }
};

export const getUserAnswerById = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id)
      ? Number.parseInt(req.params.id[0], 10)
      : Number.parseInt(req.params.id, 10);

    const answer = await prisma.userAnswer.findUnique({
      where: { id },
      include: userAnswerInclude,
    });

    if (!answer) {
      return res.status(404).json({ error: "UserAnswer not found" });
    }

    return res.json(answer);
  } catch (error) {
    return res.status(400).json({ error: "Failed to fetch user answer" });
  }
};

export const deleteUserAnswer = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id)
      ? Number.parseInt(req.params.id[0], 10)
      : Number.parseInt(req.params.id, 10);

    await prisma.userAnswer.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    return res.status(400).json({ error: "Failed to delete user answer" });
  }
};

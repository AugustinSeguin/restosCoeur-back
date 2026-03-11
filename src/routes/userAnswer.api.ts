import { Request, Response } from "express";
import prisma from "@/libs/prisma";

const normalizeStoreSlotIds = (storeSlotIds: unknown): number[] => {
  if (!Array.isArray(storeSlotIds)) return [];

  const normalized = storeSlotIds
    .map((id) => (typeof id === "string" ? Number.parseInt(id, 10) : id))
    .filter((id): id is number => Number.isInteger(id) && id > 0);

  return [...new Set(normalized)];
};

const findMissingStoreSlotIds = async (
  storeSlotIds: number[],
): Promise<number[]> => {
  if (storeSlotIds.length === 0) return [];

  const existingSlots = await prisma.storeSlot.findMany({
    where: { id: { in: storeSlotIds } },
    select: { id: true },
  });

  const existingIds = new Set(existingSlots.map((slot) => slot.id));
  return storeSlotIds.filter((id) => !existingIds.has(id));
};

export const createUserAnswer = async (req: Request, res: Response) => {
  try {
    const {
      lastName,
      firstName,
      phoneNumber,
      email,
      collecteId,
      storeSlotIds,
    } = req.body;

    const normalizedStoreSlotIds = normalizeStoreSlotIds(storeSlotIds);

    // Validate required fields
    if (!lastName || !firstName || !phoneNumber || !collecteId) {
      return res.status(400).json({
        error: "lastName, firstName, phoneNumber, and collecteId are required",
      });
    }

    // Check if UserAnswer already exists for this collection and phone number
    const existingAnswer = await prisma.userAnswer.findFirst({
      where: {
        collecteId: Number.parseInt(collecteId),
        user: {
          phoneNumber: phoneNumber,
        },
      },
    });

    if (existingAnswer) {
      return res.status(409).json({
        error: `User with phone number ${phoneNumber} already answered this collection`,
      });
    }

    const missingStoreSlotIds = await findMissingStoreSlotIds(
      normalizedStoreSlotIds,
    );
    if (missingStoreSlotIds.length > 0) {
      return res.status(400).json({
        error: "Some storeSlotIds do not exist",
        missingStoreSlotIds,
      });
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        phoneNumber: phoneNumber,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          lastName,
          firstName,
          email: email || null,
          phoneNumber,
          password: null,
          isAdmin: false,
          isActive: true,
          type: "newcomer",
        },
      });
    }

    // Create UserAnswer with store slots
    const userAnswer = await prisma.userAnswer.create({
      data: {
        userId: user.id,
        collecteId: Number.parseInt(collecteId),
        storeSlots: {
          create: normalizedStoreSlotIds.map((slotId: number) => ({
            storeSlot: {
              connect: { id: slotId },
            },
          })),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            lastName: true,
            firstName: true,
            email: true,
            phoneNumber: true,
          },
        },
        collection: true,
        storeSlots: {
          include: {
            storeSlot: true,
          },
        },
      },
    });

    res.status(201).json(userAnswer);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Failed to create user answer" });
  }
};

export const updateUserAnswer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { lastName, firstName, phoneNumber, email, storeSlotIds } = req.body;

    const normalizedStoreSlotIds = normalizeStoreSlotIds(storeSlotIds);

    // Validate required fields
    if (!lastName || !firstName || !phoneNumber) {
      return res.status(400).json({
        error: "lastName, firstName, and phoneNumber are required",
      });
    }

    const userAnswerId = Array.isArray(id)
      ? Number.parseInt(id[0])
      : Number.parseInt(id);

    // Get the UserAnswer to find its user
    const existingAnswer = await prisma.userAnswer.findUnique({
      where: { id: userAnswerId },
      include: { user: true },
    });

    if (!existingAnswer) {
      return res.status(404).json({ error: "UserAnswer not found" });
    }

    const conflictingUser = await prisma.user.findFirst({
      where: {
        phoneNumber,
        NOT: { id: existingAnswer.user.id },
      },
      select: { id: true },
    });

    if (conflictingUser) {
      return res.status(409).json({
        error: `Phone number ${phoneNumber} is already used by another user`,
      });
    }

    const missingStoreSlotIds = await findMissingStoreSlotIds(
      normalizedStoreSlotIds,
    );
    if (missingStoreSlotIds.length > 0) {
      return res.status(400).json({
        error: "Some storeSlotIds do not exist",
        missingStoreSlotIds,
      });
    }

    await prisma.$transaction(async (tx) => {
      // Keep the linked user profile in sync with latest answer payload.
      await tx.user.update({
        where: { id: existingAnswer.user.id },
        data: {
          lastName,
          firstName,
          phoneNumber,
          email: email || null,
        },
      });

      await tx.userAnswerSlot.deleteMany({
        where: { userAnswerId },
      });

      if (normalizedStoreSlotIds.length > 0) {
        await tx.userAnswerSlot.createMany({
          data: normalizedStoreSlotIds.map((slotId: number) => ({
            userAnswerId,
            storeSlotId: slotId,
          })),
        });
      }
    });

    // Fetch updated UserAnswer
    const updatedAnswer = await prisma.userAnswer.findUnique({
      where: { id: userAnswerId },
      include: {
        user: {
          select: {
            id: true,
            lastName: true,
            firstName: true,
            email: true,
            phoneNumber: true,
          },
        },
        collection: true,
        storeSlots: {
          include: {
            storeSlot: true,
          },
        },
      },
    });

    res.json(updatedAnswer);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Failed to update user answer" });
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
      where: { collecteId: Number.parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            lastName: true,
            firstName: true,
            email: true,
            phoneNumber: true,
          },
        },
        collection: true,
        storeSlots: {
          include: {
            storeSlot: true,
          },
        },
      },
    });
    res.json(answers);
  } catch (error) {
    res.status(400).json({ error: "Failed to fetch user answers" });
  }
};

export const getUserAnswerById = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id)
      ? Number.parseInt(req.params.id[0])
      : Number.parseInt(req.params.id);
    const answer = await prisma.userAnswer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            lastName: true,
            firstName: true,
            email: true,
            phoneNumber: true,
          },
        },
        collection: true,
        storeSlots: {
          include: {
            storeSlot: true,
          },
        },
      },
    });

    if (!answer) {
      return res.status(404).json({ error: "UserAnswer not found" });
    }
    res.json(answer);
  } catch (error) {
    res.status(400).json({ error: "Failed to fetch user answer" });
  }
};

export const deleteUserAnswer = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id)
      ? Number.parseInt(req.params.id[0])
      : Number.parseInt(req.params.id);
    await prisma.userAnswer.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: "Failed to delete user answer" });
  }
};

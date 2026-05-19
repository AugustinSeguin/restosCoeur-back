import prisma from "@/libs/prisma";

export const normalizeOptionalId = (
  value: unknown,
): number | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const parsed =
    typeof value === "string" ? Number.parseInt(value, 10) : (value as number);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
};

export const findInvalidSlotIdsForCollection = async (
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

export const findInvalidZoneIdsForCollection = async (
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

export type AnswerSelection = {
  slotId: number | null;
  zoneId: number | null;
};

export const buildSelections = (
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

export const dedupeSelections = (
  selections: AnswerSelection[],
): AnswerSelection[] => {
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

export const userAnswerInclude = {
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

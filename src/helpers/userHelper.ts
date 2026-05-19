import prisma from "@/libs/prisma";

export const isValidPhoneNumber = (
  phoneNumber: unknown,
): phoneNumber is string => {
  return typeof phoneNumber === "string" && /^0[67]\d{8}$/.test(phoneNumber);
};

export const isValidCodePostal = (
  codePostal: unknown,
): codePostal is string => {
  return typeof codePostal === "string" && /^\d{5}$/.test(codePostal);
};

export const parseBirthdate = (birthdate: unknown): Date | null => {
  if (!(typeof birthdate === "string" || birthdate instanceof Date)) {
    return null;
  }

  const parsedDate = new Date(birthdate);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export const sanitizeNamePart = (value: string): string => {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
};

export const generateUsername = (
  lastName: unknown,
  firstName: unknown,
): string | null => {
  if (typeof lastName !== "string" || typeof firstName !== "string") {
    return null;
  }

  const username = `${sanitizeNamePart(lastName)}${sanitizeNamePart(firstName)}`;
  return username.length > 0 ? username : null;
};

export const normalizeIds = (ids: unknown): number[] => {
  if (!Array.isArray(ids)) return [];

  const normalized = ids
    .map((id) => (typeof id === "string" ? Number.parseInt(id, 10) : id))
    .filter((id): id is number => Number.isInteger(id) && id > 0);

  return [...new Set(normalized)];
};

export const findInvalidCollectionIds = async (
  collectionIds: number[],
): Promise<number[]> => {
  if (collectionIds.length === 0) return [];

  const existingCollections = await prisma.collection.findMany({
    where: { id: { in: collectionIds } },
    select: { id: true },
  });

  const existingIds = new Set(
    existingCollections.map((collection) => collection.id),
  );
  return collectionIds.filter((id) => !existingIds.has(id));
};

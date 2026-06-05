import prisma from "@/libs/prisma";

export const formatPhoneNumber = (phoneNumber: unknown): string | null => {
  if (typeof phoneNumber !== "string") {
    return null;
  }

  // Reject if contains spaces
  if (phoneNumber.includes(" ")) {
    return null;
  }

  // If already in +33 format with 9 digits (total 12 chars: +33xxxxxxxxx)
  if (/^\+33[67]\d{8}$/.test(phoneNumber)) {
    return phoneNumber;
  }

  // If in 0X format (10 digits), convert to +33
  if (/^0[67]\d{8}$/.test(phoneNumber)) {
    return `+33${phoneNumber.slice(1)}`;
  }

  // Invalid format
  return null;
};

export const isValidPhoneNumber = (
  phoneNumber: unknown,
): phoneNumber is string => {
  return (
    typeof phoneNumber === "string" &&
    (/^0[67]\d{8}$/.test(phoneNumber) || /^\+33[67]\d{8}$/.test(phoneNumber)) &&
    !phoneNumber.includes(" ")
  );
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

const normalizeSingleId = (value: unknown): number | null => {
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0 ? value : null;
  }

  return null;
};

export const normalizeIds = (ids: unknown): number[] => {
  const values = Array.isArray(ids) ? ids : [ids];

  const normalized = values
    .map(normalizeSingleId)
    .filter((id): id is number => id !== null);

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

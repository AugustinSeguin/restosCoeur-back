import ExcelJS from "exceljs";
import prisma from "@/libs/prisma";
import { UserType } from "@/models/user";

export const hhmmToMinutes = (value: string): number | null => {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
};

export const dateToMinutes = (value: Date): number =>
  value.getHours() * 60 + value.getMinutes();

export const normalizeIds = (ids: unknown): number[] => {
  if (!Array.isArray(ids)) return [];

  const normalized = ids
    .map((id) => (typeof id === "string" ? Number.parseInt(id, 10) : id))
    .filter((id): id is number => Number.isInteger(id) && id > 0);

  return [...new Set(normalized)];
};

export const findInvalidZoneIds = async (
  zoneIds: number[],
): Promise<number[]> => {
  if (zoneIds.length === 0) return [];

  const existingZones = await prisma.zone.findMany({
    where: { id: { in: zoneIds } },
    select: { id: true },
  });

  const existingIds = new Set(existingZones.map((zone) => zone.id));
  return zoneIds.filter((id) => !existingIds.has(id));
};

export const formatTime = (value: Date): string =>
  `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;

export const formatSlotLabel = (slot: {
  startAt: Date;
  endAt: Date;
}): string => {
  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(slot.startAt);

  return `${dateLabel} ${formatTime(slot.startAt)} - ${formatTime(slot.endAt)}`;
};

export const fitWorksheetColumns = (
  worksheet: ExcelJS.Worksheet,
  columnCount: number,
  minimumWidths: number[],
  maximumWidths: number[],
) => {
  for (let columnIndex = 1; columnIndex <= columnCount; columnIndex += 1) {
    let maxLength = 0;

    worksheet
      .getColumn(columnIndex)
      .eachCell({ includeEmpty: true }, (cell) => {
        const lines = (cell.text || "").split(/\r?\n/);
        const cellMaxLength = lines.reduce(
          (longest, line) => Math.max(longest, line.length),
          0,
        );

        maxLength = Math.max(maxLength, cellMaxLength);
      });

    const minimumWidth = minimumWidths[columnIndex - 1] ?? 12;
    const maximumWidth = maximumWidths[columnIndex - 1] ?? 40;
    worksheet.getColumn(columnIndex).width = Math.min(
      Math.max(maxLength + 2, minimumWidth),
      maximumWidth,
    );
  }
};

export const normalizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : String(value ?? "").trim();

export const stripDiacritics = (value: string): string =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const formatPlus33Phone = (digits: string): string =>
  `+33 ${digits[0]} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;

const normalizeSingleFrenchMobile = (value: string): string | null => {
  const compact = value.replace(/[^\d+]/g, "");

  const localMatch = /^0([67]\d{8})$/.exec(compact);
  if (localMatch) {
    return formatPlus33Phone(localMatch[1]);
  }

  const intlMatch = /^\+33([67]\d{8})$/.exec(compact);
  if (intlMatch) {
    return formatPlus33Phone(intlMatch[1]);
  }

  return null;
};

export const extractPreferredPhone = (value: string): string | null => {
  if (!value.trim()) return null;

  const pattern =
    /(?:\+33\s*[67](?:[\s.-]*\d{2}){4}|0[67](?:[\s.-]*\d{2}){4})/g;
  const matches = value.match(pattern) ?? [];
  const normalizedPhones = matches
    .map((match) => normalizeSingleFrenchMobile(match))
    .filter((phone): phone is string => phone !== null);

  if (normalizedPhones.length === 0) {
    return null;
  }

  const withPriority = normalizedPhones
    .map((phone) => ({
      phone,
      priority: phone.startsWith("+33 7") ? 1 : 2,
    }))
    .sort((left, right) => left.priority - right.priority);

  return withPriority[0].phone;
};

export const normalizeEmail = (value: string): string | null => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return null;
  return normalized;
};

export const mapImportedType = (value: string): UserType => {
  const normalized = stripDiacritics(value).toLowerCase();

  if (normalized.includes("regulier") || normalized.includes("permanent")) {
    return UserType.permanent;
  }

  if (normalized.includes("newcomer") || normalized.includes("nouveau")) {
    return UserType.newcomer;
  }

  return UserType.occasional;
};

export const buildImportUsername = (
  lastName: string,
  firstName: string,
): string => {
  const normalized = stripDiacritics(`${lastName}${firstName}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

  return normalized || "import-user";
};

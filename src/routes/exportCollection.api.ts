import { Request, Response } from "express";
import ExcelJS from "exceljs";
import path from "node:path";
import * as XLSX from "xlsx";
import prisma from "@/libs/prisma";
import {
  buildImportUsername,
  extractPreferredPhone,
  fitWorksheetColumns,
  formatSlotLabel,
  mapImportedType,
  normalizeEmail,
  normalizeText,
  stripDiacritics,
} from "@/helpers/collectionHelper";

type UploadRequest = Request & {
  file?: Express.Multer.File;
};

const ACCEPTED_EXCEL_EXTENSIONS = new Set([".xls", ".xlsx"]);
const ACCEPTED_EXCEL_MIME_TYPES = new Set([
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream",
]);

export const exportCollection = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const collectionId = Number.parseInt(id);

    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      include: {
        users: {
          include: {
            user: {
              include: {
                assignments: {
                  where: { collectionId },
                  include: { slot: true, store: true },
                },
              },
            },
            userAnswers: {
              where: { collectionId },
            },
          },
        },
        zones: {
          include: {
            zone: {
              include: {
                stores: true,
              },
            },
          },
        },
      },
    });

    if (!collection)
      return res.status(404).json({ error: "Collection not found" });

    const storesInCollection = collection.zones.flatMap((collectionZone) => {
      const zoneSummary = {
        id: collectionZone.zone.id,
        title: collectionZone.zone.title,
      };
      return collectionZone.zone.stores.map((store) => ({
        ...store,
        zone: zoneSummary,
      }));
    });

    const workbook = new ExcelJS.Workbook();

    // Create "Utilisateurs" worksheet with users and their slot assignments
    const allSlots = Array.from(
      new Set(
        collection.users
          .flatMap((cu) => cu.user.assignments)
          .filter((a) => a.slot)
          .map((a) => a.slotId),
      ),
    );

    const slotsByIdMap = new Map<
      number,
      { id: number; title: string; startAt: Date }
    >();
    collection.users.forEach((cu) => {
      cu.user.assignments.forEach((a) => {
        if (a.slot && !slotsByIdMap.has(a.slot.id)) {
          slotsByIdMap.set(a.slot.id, {
            id: a.slot.id,
            title: formatSlotLabel(a.slot),
            startAt: a.slot.startAt,
          });
        }
      });
    });

    const sortedSlots = Array.from(slotsByIdMap.values()).sort(
      (a, b) => a.startAt.getTime() - b.startAt.getTime(),
    );

    const utilisateursWorksheet = workbook.addWorksheet("Global");
    const columnCount = sortedSlots.length + 1;
    const titleRowIndex = 1;
    const headerRowIndex = 2;
    const firstDataRowIndex = 3;

    utilisateursWorksheet.mergeCells(
      titleRowIndex,
      1,
      titleRowIndex,
      columnCount,
    );
    utilisateursWorksheet.getCell(titleRowIndex, 1).value =
      "Récapitulatif global";
    utilisateursWorksheet.getCell(titleRowIndex, 1).font = {
      bold: true,
      size: 14,
      color: { argb: "FFFFFFFF" },
    };
    utilisateursWorksheet.getCell(titleRowIndex, 1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF8B1E1E" },
    };
    utilisateursWorksheet.getCell(titleRowIndex, 1).alignment = {
      vertical: "middle",
      horizontal: "center",
    };
    utilisateursWorksheet.getRow(titleRowIndex).height = 24;

    // Header: "Utilisateur" + slot labels
    const headers = ["Utilisateur", ...sortedSlots.map((slot) => slot.title)];
    headers.forEach((header, index) => {
      const cell = utilisateursWorksheet.getCell(headerRowIndex, index + 1);
      cell.value = header;
      cell.font = {
        bold: true,
        color: { argb: "FF7A1C1C" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFCEEEE" },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFD9C5C5" } },
        left: { style: "thin", color: { argb: "FFD9C5C5" } },
        bottom: { style: "thin", color: { argb: "FFD9C5C5" } },
        right: { style: "thin", color: { argb: "FFD9C5C5" } },
      };
    });

    // Sort users alphabetically
    const sortedUsers = collection.users
      .map((cu) => cu.user)
      .sort((a, b) => {
        const nameA = `${a.lastName || ""} ${a.firstName || ""}`.trim();
        const nameB = `${b.lastName || ""} ${b.firstName || ""}`.trim();
        return nameA.localeCompare(nameB, "fr");
      });

    let rowIndex = firstDataRowIndex;
    for (const user of sortedUsers) {
      // Column A: User name
      const userName = `${user.lastName || ""} ${user.firstName || ""}`.trim();
      const cell = utilisateursWorksheet.getCell(rowIndex, 1);
      cell.value = userName;
      cell.alignment = {
        vertical: "top",
        horizontal: "left",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
        left: { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } },
      };

      // Columns B+: Store title for each slot
      for (let slotIndex = 0; slotIndex < sortedSlots.length; slotIndex += 1) {
        const slot = sortedSlots[slotIndex];
        const assignment = user.assignments.find(
          (a) => a.collectionId === collectionId && a.slotId === slot.id,
        );

        const storeTitle = assignment?.store?.title || "";
        const storeCell = utilisateursWorksheet.getCell(
          rowIndex,
          slotIndex + 2,
        );
        storeCell.value = storeTitle;
        storeCell.alignment = {
          vertical: "top",
          horizontal: "left",
          wrapText: true,
        };
        storeCell.border = {
          top: { style: "thin", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } },
        };
      }

      if ((rowIndex - firstDataRowIndex) % 2 === 1) {
        for (
          let columnIndex = 1;
          columnIndex <= columnCount;
          columnIndex += 1
        ) {
          utilisateursWorksheet.getCell(rowIndex, columnIndex).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFAFAFA" },
          };
        }
      }

      rowIndex += 1;
    }

    fitWorksheetColumns(
      utilisateursWorksheet,
      columnCount,
      [20, ...Array(sortedSlots.length).fill(18)],
      [24, ...Array(sortedSlots.length).fill(24)],
    );

    utilisateursWorksheet.getRow(headerRowIndex).height = 22;
    utilisateursWorksheet.getRow(firstDataRowIndex).height = 20;
    utilisateursWorksheet.properties.defaultRowHeight = 20;
    utilisateursWorksheet.views = [{ state: "frozen", ySplit: 2 }];

    for (const store of storesInCollection) {
      const safeSheetName = `${store.title ?? "store"}_${store.id}`.slice(
        0,
        31,
      );
      const worksheet = workbook.addWorksheet(safeSheetName);

      const columnCount = 5;
      const titleRowIndex = 1;
      const headerRowIndex = 2;
      const firstDataRowIndex = 3;

      worksheet.mergeCells(titleRowIndex, 1, titleRowIndex, columnCount);
      worksheet.getCell(titleRowIndex, 1).value =
        store.title || `Store ${store.id}`;
      worksheet.getCell(titleRowIndex, 1).font = {
        bold: true,
        size: 14,
        color: { argb: "FFFFFFFF" },
      };
      worksheet.getCell(titleRowIndex, 1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF8B1E1E" },
      };
      worksheet.getCell(titleRowIndex, 1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      worksheet.getRow(titleRowIndex).height = 24;

      const headers = ["Nom", "Prénom", "Téléphone", "Type", "Créneaux"];
      headers.forEach((header, index) => {
        const cell = worksheet.getCell(headerRowIndex, index + 1);
        cell.value = header;
        cell.font = {
          bold: true,
          color: { argb: "FF7A1C1C" },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFCEEEE" },
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FFD9C5C5" } },
          left: { style: "thin", color: { argb: "FFD9C5C5" } },
          bottom: { style: "thin", color: { argb: "FFD9C5C5" } },
          right: { style: "thin", color: { argb: "FFD9C5C5" } },
        };
      });

      const usersMap = new Map<
        number,
        {
          user: (typeof collection.users)[number]["user"];
          assignments: (typeof collection.users)[number]["user"]["assignments"];
        }
      >();

      for (const collectionUser of collection.users) {
        const user = collectionUser.user;
        const userAssignments = (user.assignments || []).filter(
          (assignment) =>
            assignment.collectionId === collectionId &&
            assignment.storeId === store.id,
        );

        if (userAssignments.length > 0) {
          const existing = usersMap.get(user.id);
          if (existing) {
            existing.assignments.push(...userAssignments);
          } else {
            usersMap.set(user.id, {
              user,
              assignments: [...userAssignments],
            });
          }
        }
      }

      let rowIndex = firstDataRowIndex;
      const rows = Array.from(usersMap.values()).sort((left, right) => {
        const leftName =
          `${left.user.lastName || ""} ${left.user.firstName || ""}`.trim();
        const rightName =
          `${right.user.lastName || ""} ${right.user.firstName || ""}`.trim();

        return leftName.localeCompare(rightName, "fr");
      });

      for (const { user, assignments } of rows) {
        const uniqueSlotLabels = Array.from(
          new Map(
            assignments
              .filter((assignment) => assignment.slot)
              .sort((left, right) => {
                const leftStart = left.slot?.startAt?.getTime?.() ?? 0;
                const rightStart = right.slot?.startAt?.getTime?.() ?? 0;
                return leftStart - rightStart;
              })
              .map((assignment) => [
                assignment.slotId,
                formatSlotLabel(assignment.slot!),
              ]),
          ).values(),
        );

        const values = [
          user.lastName || "",
          user.firstName || "",
          user.phoneNumber || "",
          user.type || "",
          uniqueSlotLabels.join("\n"),
        ];

        values.forEach((value, columnIndex) => {
          const cell = worksheet.getCell(rowIndex, columnIndex + 1);
          cell.value = value;
          cell.alignment = {
            vertical: "top",
            horizontal: "left",
            wrapText: true,
          };
          cell.border = {
            top: { style: "thin", color: { argb: "FFE5E7EB" } },
            left: { style: "thin", color: { argb: "FFE5E7EB" } },
            bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
            right: { style: "thin", color: { argb: "FFE5E7EB" } },
          };
        });

        if ((rowIndex - firstDataRowIndex) % 2 === 1) {
          for (
            let columnIndex = 1;
            columnIndex <= columnCount;
            columnIndex += 1
          ) {
            worksheet.getCell(rowIndex, columnIndex).fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFAFAFA" },
            };
          }
        }

        rowIndex += 1;
      }

      if (rows.length === 0) {
        worksheet.mergeCells(
          firstDataRowIndex,
          1,
          firstDataRowIndex,
          columnCount,
        );
        worksheet.getCell(firstDataRowIndex, 1).value =
          "Aucun bénévole affecté";
        worksheet.getCell(firstDataRowIndex, 1).font = { italic: true };
        worksheet.getCell(firstDataRowIndex, 1).alignment = {
          vertical: "middle",
          horizontal: "center",
        };
      }

      fitWorksheetColumns(
        worksheet,
        columnCount,
        [16, 16, 18, 14, 28],
        [24, 24, 24, 18, 42],
      );

      worksheet.getRow(headerRowIndex).height = 22;
      worksheet.getRow(firstDataRowIndex).height = 20;
      worksheet.properties.defaultRowHeight = 20;
      worksheet.views = [{ state: "frozen", ySplit: 2 }];
    }

    const safeTitle = collection.title
      .replace(/[\\/\r\n\t\0\v\f"]/g, "-")
      .trim();
    const filename = `collection_${safeTitle || collection.id}_export.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const buffer = await workbook.xlsx.writeBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to export collection to Excel", error);
    res.status(400).json({
      error: "Failed to export collection to Excel",
      details: message,
    });
  }
};

export const importUsersByCollectionId = async (
  req: UploadRequest,
  res: Response,
) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const collectionId = Number.parseInt(id, 10);

    if (!Number.isInteger(collectionId) || collectionId <= 0) {
      return res.status(400).json({ error: "Invalid collection id" });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Aucun fichier Excel fourni.",
      });
    }

    const extension = path.extname(req.file.originalname).toLowerCase();
    if (!ACCEPTED_EXCEL_EXTENSIONS.has(extension)) {
      return res.status(400).json({
        success: false,
        message: "Le fichier doit etre au format .xlsx ou .xls.",
      });
    }

    if (!ACCEPTED_EXCEL_MIME_TYPES.has(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Le type MIME du fichier n'est pas accepte.",
      });
    }

    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      select: { id: true },
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    const workbook = XLSX.read(req.file.buffer, {
      type: "buffer",
      raw: false,
    });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return res.status(400).json({
        success: false,
        message: "Le fichier Excel est vide.",
      });
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      defval: "",
      raw: false,
      blankrows: false,
    });

    const headerRow = Array.isArray(rows[1]) ? rows[1] : rows[0];
    const normalizeHeader = (value: unknown): string =>
      stripDiacritics(normalizeText(value)).toLowerCase();

    const headerIndex = (candidateHeaders: string[]): number =>
      headerRow.findIndex((value) => {
        const normalized = normalizeHeader(value);
        return candidateHeaders.some((candidate) =>
          normalized.includes(candidate),
        );
      });

    const lastNameIndex = headerIndex(["nom"]);
    const firstNameIndex = headerIndex(["prenom"]);
    const typeIndex = headerIndex(["type d'engagement", "type"]);
    const emailIndex = headerIndex(["mail perso", "mail"]);
    const phoneIndex = headerIndex(["contact", "telephone", "téléphone"]);

    if (
      lastNameIndex < 0 ||
      firstNameIndex < 0 ||
      typeIndex < 0 ||
      emailIndex < 0 ||
      phoneIndex < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Le fichier Excel ne contient pas les colonnes attendues (Nom, Prénom, Type d'engagement, Mail Perso, Contact).",
      });
    }

    const summary = {
      processedRows: 0,
      skippedRows: 0,
      createdUsers: 0,
      existingUsers: 0,
      linkedUsers: 0,
    };

    for (let rowIndex = 2; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      if (!Array.isArray(row)) {
        continue;
      }

      const lastName = normalizeText(row[lastNameIndex]);
      const firstName = normalizeText(row[firstNameIndex]);
      const typeRaw = normalizeText(row[typeIndex]);
      const email = normalizeEmail(normalizeText(row[emailIndex]));
      const phone = extractPreferredPhone(normalizeText(row[phoneIndex]));

      if (!lastName && !firstName && !phone) {
        continue;
      }

      if (!phone) {
        summary.skippedRows += 1;
        continue;
      }

      summary.processedRows += 1;

      const userType = mapImportedType(typeRaw);

      const user = await prisma.$transaction(async (tx) => {
        const existingUser = await tx.user.findUnique({
          where: { phoneNumber: phone },
          select: { id: true },
        });

        if (existingUser) {
          summary.existingUsers += 1;

          const link = await tx.collectionUser.findUnique({
            where: {
              collectionId_userId: {
                collectionId,
                userId: existingUser.id,
              },
            },
            select: { userId: true },
          });

          if (!link) {
            await tx.collectionUser.create({
              data: {
                collectionId,
                userId: existingUser.id,
              },
            });
            summary.linkedUsers += 1;
          }

          return existingUser;
        }

        let safeEmail = email;
        if (safeEmail) {
          const emailAlreadyUsed = await tx.user.findUnique({
            where: { email: safeEmail },
            select: { id: true },
          });
          if (emailAlreadyUsed) {
            safeEmail = null;
          }
        }

        const createdUser = await tx.user.create({
          data: {
            lastName: lastName || "Inconnu",
            firstName: firstName || "Inconnu",
            username: buildImportUsername(
              lastName || "inconnu",
              firstName || "inconnu",
            ),
            birthdate: new Date("1970-01-01T00:00:00.000Z"),
            codePostal: "00000",
            email: safeEmail,
            phoneNumber: phone,
            isActive: true,
            isAdmin: false,
            type: userType,
          },
          select: { id: true },
        });

        await tx.collectionUser.create({
          data: {
            collectionId,
            userId: createdUser.id,
          },
        });

        summary.createdUsers += 1;
        summary.linkedUsers += 1;

        return createdUser;
      });

      void user;
    }

    return res.status(200).json({
      success: true,
      message: "Import des benevoles termine.",
      usersCount: summary.linkedUsers,
      ...summary,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to import users from Excel", error);
    return res.status(400).json({
      success: false,
      message: "Echec de l'import des benevoles.",
      details: message,
    });
  }
};

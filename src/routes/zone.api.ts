import { Request, Response } from "express";
import prisma from "@/libs/prisma";

const normalizeIds = (ids: unknown): number[] => {
  if (!Array.isArray(ids)) return [];

  const normalized = ids
    .map((id) => (typeof id === "string" ? Number.parseInt(id, 10) : id))
    .filter((id): id is number => Number.isInteger(id) && id > 0);

  return [...new Set(normalized)];
};

const findInvalidCollectionIds = async (
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

export const createZone = async (req: Request, res: Response) => {
  try {
    const { title, collectionIds } = req.body;
    const normalizedCollectionIds = normalizeIds(collectionIds);

    const invalidCollectionIds = await findInvalidCollectionIds(
      normalizedCollectionIds,
    );
    if (invalidCollectionIds.length > 0) {
      return res.status(400).json({
        error: "Some collectionIds are invalid or do not exist",
        invalidCollectionIds,
      });
    }

    const zone = await prisma.zone.create({
      data: {
        title,
        collections: {
          create: normalizedCollectionIds.map((collectionId) => ({
            collection: {
              connect: { id: collectionId },
            },
          })),
        },
      },
      include: {
        collections: {
          include: {
            collection: true,
          },
        },
      },
    });
    res.status(201).json(zone);
  } catch (error) {
    res.status(400).json({ error: "Failed to create zone" });
  }
};

export const updateZone = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { title, collectionIds } = req.body;
    const normalizedCollectionIds = normalizeIds(collectionIds);

    const invalidCollectionIds = await findInvalidCollectionIds(
      normalizedCollectionIds,
    );
    if (invalidCollectionIds.length > 0) {
      return res.status(400).json({
        error: "Some collectionIds are invalid or do not exist",
        invalidCollectionIds,
      });
    }

    const zone = await prisma.zone.update({
      where: { id: Number.parseInt(id) },
      data: {
        title,
        ...(Array.isArray(collectionIds) && {
          collections: {
            deleteMany: {},
            create: normalizedCollectionIds.map((collectionId) => ({
              collection: {
                connect: { id: collectionId },
              },
            })),
          },
        }),
      },
      include: {
        collections: {
          include: {
            collection: true,
          },
        },
      },
    });
    res.json(zone);
  } catch (error) {
    res.status(400).json({ error: "Failed to update zone" });
  }
};

export const deleteZone = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await prisma.zone.delete({
      where: { id: Number.parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: "Failed to delete zone" });
  }
};

export const getZoneById = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const zone = await prisma.zone.findUnique({
      where: { id: Number.parseInt(id) },
      include: {
        stores: true,
        collections: {
          include: {
            collection: true,
          },
        },
      },
    });
    if (!zone) return res.status(404).json({ error: "Zone not found" });
    res.json(zone);
  } catch (error) {
    res.status(400).json({ error: "Failed to fetch zone" });
  }
};

export const getAllZones = async (req: Request, res: Response) => {
  try {
    const zones = await prisma.zone.findMany({
      include: {
        stores: true,
        collections: {
          include: {
            collection: true,
          },
        },
      },
    });
    res.json(zones);
  } catch (error) {
    res.status(400).json({ error: "Failed to fetch zones" });
  }
};

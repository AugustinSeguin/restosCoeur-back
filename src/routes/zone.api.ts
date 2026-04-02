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

const findInvalidStoreIds = async (storeIds: number[]): Promise<number[]> => {
  if (storeIds.length === 0) return [];

  const existingStores = await prisma.store.findMany({
    where: { id: { in: storeIds } },
    select: { id: true },
  });

  const existingIds = new Set(existingStores.map((store) => store.id));
  return storeIds.filter((id) => !existingIds.has(id));
};

export const createZone = async (req: Request, res: Response) => {
  try {
    const { title, storeIds } = req.body;
    const normalizedStoreIds = normalizeIds(storeIds);

    const invalidStoreIds = await findInvalidStoreIds(normalizedStoreIds);
    if (invalidStoreIds.length > 0) {
      return res.status(400).json({
        error: "Some storeIds are invalid or do not exist",
        invalidStoreIds,
      });
    }

    const zone = await prisma.zone.create({
      data: {
        title,
      },
    });

    if (normalizedStoreIds.length > 0) {
      await prisma.store.updateMany({
        where: { id: { in: normalizedStoreIds } },
        data: { zoneId: zone.id },
      });
    }

    const createdZone = await prisma.zone.findUnique({
      where: { id: zone.id },
      include: {
        stores: true,
      },
    });

    res.status(201).json(createdZone);
  } catch (error) {
    res.status(400).json({ error: "Failed to create zone" });
  }
};

export const updateZone = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const zoneId = Number.parseInt(id, 10);

    if (!Number.isInteger(zoneId) || zoneId <= 0) {
      return res.status(400).json({ error: "Invalid zone id" });
    }

    const { title, storeIds } = req.body;
    const normalizedStoreIds = normalizeIds(storeIds);

    const invalidStoreIds = await findInvalidStoreIds(normalizedStoreIds);
    if (invalidStoreIds.length > 0) {
      return res.status(400).json({
        error: "Some storeIds are invalid or do not exist",
        invalidStoreIds,
      });
    }

    await prisma.zone.update({
      where: { id: zoneId },
      data: {
        title,
      },
    });

    // Detach all stores from this zone
    await prisma.store.updateMany({
      where: { zoneId },
      data: { zoneId: null },
    });

    // Attach new stores
    if (normalizedStoreIds.length > 0) {
      await prisma.store.updateMany({
        where: { id: { in: normalizedStoreIds } },
        data: { zoneId },
      });
    }

    const updatedZone = await prisma.zone.findUnique({
      where: { id: zoneId },
      include: {
        stores: true,
        collections: {
          include: {
            collection: true,
          },
        },
      },
    });

    res.json(updatedZone);
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
    const zones = await prisma.zone.findMany();
    res.json(zones);
  } catch (error) {
    res.status(400).json({ error: "Failed to fetch zones" });
  }
};

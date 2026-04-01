import { Request, Response } from "express";
import prisma from "@/libs/prisma";

export const createAssignment = async (req: Request, res: Response) => {
  try {
    const { userId, slotId, storeId, collectionId } = req.body;
    const assignment = await prisma.assignment.create({
      data: { userId, slotId, storeId, collectionId },
      include: { user: true, slot: true, store: true, collection: true },
    });
    res.status(201).json(assignment);
  } catch (error) {
    res.status(400).json({ error: "Failed to create assignment" });
  }
};

export const updateAssignment = async (req: Request, res: Response) => {
  try {
    const collectionId = Array.isArray(req.params.collectionId)
      ? req.params.collectionId[0]
      : req.params.collectionId;
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;
    const slotId = Array.isArray(req.params.slotId)
      ? req.params.slotId[0]
      : req.params.slotId;
    const storeId = Array.isArray(req.params.storeId)
      ? req.params.storeId[0]
      : req.params.storeId;
    const { newUserId, newSlotId, newStoreId, newCollectionId } = req.body;

    // Delete old, create new
    await prisma.assignment.delete({
      where: {
        userId_slotId_storeId_collectionId: {
          userId: Number.parseInt(userId),
          slotId: Number.parseInt(slotId),
          storeId: Number.parseInt(storeId),
          collectionId: Number.parseInt(collectionId),
        },
      },
    });

    const assignment = await prisma.assignment.create({
      data: {
        userId: newUserId,
        slotId: newSlotId,
        storeId: newStoreId,
        collectionId: newCollectionId,
      },
      include: { user: true, slot: true, store: true, collection: true },
    });
    res.json(assignment);
  } catch (error) {
    res.status(400).json({ error: "Failed to update assignment" });
  }
};

export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const collectionId = Array.isArray(req.params.collectionId)
      ? req.params.collectionId[0]
      : req.params.collectionId;
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;
    const slotId = Array.isArray(req.params.slotId)
      ? req.params.slotId[0]
      : req.params.slotId;
    const storeId = Array.isArray(req.params.storeId)
      ? req.params.storeId[0]
      : req.params.storeId;
    await prisma.assignment.delete({
      where: {
        userId_slotId_storeId_collectionId: {
          userId: Number.parseInt(userId),
          slotId: Number.parseInt(slotId),
          storeId: Number.parseInt(storeId),
          collectionId: Number.parseInt(collectionId),
        },
      },
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: "Failed to delete assignment" });
  }
};

export const getAssignmentsByCollectionId = async (
  req: Request,
  res: Response,
) => {
  try {
    const collectionId = Array.isArray(req.params.collectionId)
      ? req.params.collectionId[0]
      : req.params.collectionId;

    const assignments = await prisma.assignment.findMany({
      where: { collectionId: Number.parseInt(collectionId) },
      include: { user: true, slot: true, store: true, collection: true },
    });
    res.json(assignments);
  } catch (error) {
    res.status(400).json({ error: "Failed to fetch assignments" });
  }
};

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
  } catch {
    res.status(400).json({ error: "Failed to create assignment" });
  }
};

export const updateAssignment = async (req: Request, res: Response) => {
  try {
    const { userId, slotId, storeId, collectionId, newStoreId } = req.body;

    const assignment = await prisma.$transaction(async (tx) => {
      await tx.assignment.delete({
        where: {
          userId_slotId_storeId_collectionId: {
            userId: Number(userId),
            slotId: Number(slotId),
            storeId: Number(storeId),
            collectionId: Number(collectionId),
          },
        },
      });

      return tx.assignment.create({
        data: {
          userId: Number(userId),
          slotId: Number(slotId),
          storeId: Number(newStoreId),
          collectionId: Number(collectionId),
        },
        include: { user: true, slot: true, store: true, collection: true },
      });
    });

    res.json(assignment);
  } catch {
    res.status(400).json({ error: "Failed to update assignment" });
  }
};

export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const { userId, slotId, storeId, collectionId } = req.body;

    await prisma.assignment.delete({
      where: {
        userId_slotId_storeId_collectionId: {
          userId: Number(userId),
          slotId: Number(slotId),
          storeId: Number(storeId),
          collectionId: Number(collectionId),
        },
      },
    });
    res.status(204).send();
  } catch {
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
  } catch {
    res.status(400).json({ error: "Failed to fetch assignments" });
  }
};

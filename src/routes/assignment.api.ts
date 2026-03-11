import { Request, Response } from "express";
import prisma from "@/libs/prisma";

export const createAssignment = async (req: Request, res: Response) => {
  try {
    const { userId, storeSlotId } = req.body;
    const assignment = await prisma.assignment.create({
      data: { userId, storeSlotId },
      include: { user: true, storeSlot: true },
    });
    res.status(201).json(assignment);
  } catch (error) {
    res.status(400).json({ error: "Failed to create assignment" });
  }
};

export const updateAssignment = async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;
    const storeSlotId = Array.isArray(req.params.storeSlotId)
      ? req.params.storeSlotId[0]
      : req.params.storeSlotId;
    const { newUserId, newStoreSlotId } = req.body;

    // Delete old, create new
    await prisma.assignment.delete({
      where: {
        userId_storeSlotId: {
          userId: Number.parseInt(userId),
          storeSlotId: Number.parseInt(storeSlotId),
        },
      },
    });

    const assignment = await prisma.assignment.create({
      data: { userId: newUserId, storeSlotId: newStoreSlotId },
      include: { user: true, storeSlot: true },
    });
    res.json(assignment);
  } catch (error) {
    res.status(400).json({ error: "Failed to update assignment" });
  }
};

export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const userId = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;
    const storeSlotId = Array.isArray(req.params.storeSlotId)
      ? req.params.storeSlotId[0]
      : req.params.storeSlotId;
    await prisma.assignment.delete({
      where: {
        userId_storeSlotId: {
          userId: Number.parseInt(userId),
          storeSlotId: Number.parseInt(storeSlotId),
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

    // Get all zones in collection, then all stores in those zones, then all slots in those stores
    const assignments = await prisma.assignment.findMany({
      where: {
        storeSlot: {
          store: {
            zone: {
              collections: {
                some: {
                  collectionId: Number.parseInt(collectionId),
                },
              },
            },
          },
        },
      },
      include: { user: true, storeSlot: true },
    });
    res.json(assignments);
  } catch (error) {
    res.status(400).json({ error: "Failed to fetch assignments" });
  }
};

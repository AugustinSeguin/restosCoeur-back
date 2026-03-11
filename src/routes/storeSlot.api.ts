import { Request, Response } from "express";
import prisma from "@/libs/prisma";

export const createStoreSlot = async (req: Request, res: Response) => {
  try {
    const { startAt, endAt, storeId } = req.body;
    const slot = await prisma.storeSlot.create({
      data: {
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        storeId,
      },
    });
    res.status(201).json(slot);
  } catch (error) {
    res.status(400).json({ error: "Failed to create store slot" });
  }
};

export const updateStoreSlot = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { startAt, endAt, storeId } = req.body;
    const slot = await prisma.storeSlot.update({
      where: { id: Number.parseInt(id) },
      data: {
        startAt: startAt ? new Date(startAt) : undefined,
        endAt: endAt ? new Date(endAt) : undefined,
        storeId,
      },
    });
    res.json(slot);
  } catch (error) {
    res.status(400).json({ error: "Failed to update store slot" });
  }
};

export const deleteStoreSlot = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await prisma.storeSlot.delete({
      where: { id: Number.parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: "Failed to delete store slot" });
  }
};

export const getStoreSlotById = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const slot = await prisma.storeSlot.findUnique({
      where: { id: Number.parseInt(id) },
      include: { store: true, assignments: true },
    });
    if (!slot) return res.status(404).json({ error: "Store slot not found" });
    res.json(slot);
  } catch (error) {
    res.status(400).json({ error: "Failed to fetch store slot" });
  }
};

export const getAllStoreSlots = async (req: Request, res: Response) => {
  try {
    const slots = await prisma.storeSlot.findMany({
      include: { store: true, assignments: true },
    });
    res.json(slots);
  } catch (error) {
    res.status(400).json({ error: "Failed to fetch store slots" });
  }
};

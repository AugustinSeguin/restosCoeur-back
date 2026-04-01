import { Request, Response } from "express";
import prisma from "@/libs/prisma";

export const createSlot = async (req: Request, res: Response) => {
  try {
    const { startAt, endAt, collectionId } = req.body;
    const slot = await prisma.slot.create({
      data: {
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        collectionId,
      },
    });
    res.status(201).json(slot);
  } catch (error) {
    res.status(400).json({ error: "Failed to create slot" });
  }
};

export const updateSlot = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { startAt, endAt, collectionId } = req.body;
    const slot = await prisma.slot.update({
      where: { id: Number.parseInt(id) },
      data: {
        startAt: startAt ? new Date(startAt) : undefined,
        endAt: endAt ? new Date(endAt) : undefined,
        collectionId,
      },
    });
    res.json(slot);
  } catch (error) {
    res.status(400).json({ error: "Failed to update slot" });
  }
};

export const deleteSlot = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await prisma.slot.delete({
      where: { id: Number.parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: "Failed to delete slot" });
  }
};

export const getSlotById = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const slot = await prisma.slot.findUnique({
      where: { id: Number.parseInt(id) },
      include: { collection: true, assignments: true },
    });
    if (!slot) return res.status(404).json({ error: "Slot not found" });
    res.json(slot);
  } catch (error) {
    res.status(400).json({ error: "Failed to fetch slot" });
  }
};

export const getAllSlots = async (req: Request, res: Response) => {
  try {
    const slots = await prisma.slot.findMany({
      include: { collection: true, assignments: true },
    });
    res.json(slots);
  } catch (error) {
    res.status(400).json({ error: "Failed to fetch slots" });
  }
};

import { Request, Response } from "express";
import prisma from "@/libs/prisma";

export const createZone = async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    const zone = await prisma.zone.create({
      data: { title },
    });
    res.status(201).json(zone);
  } catch (error) {
    res.status(400).json({ error: "Failed to create zone" });
  }
};

export const updateZone = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { title } = req.body;
    const zone = await prisma.zone.update({
      where: { id: Number.parseInt(id) },
      data: { title },
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
      include: { stores: true, collections: true },
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
      include: { stores: true, collections: true },
    });
    res.json(zones);
  } catch (error) {
    res.status(400).json({ error: "Failed to fetch zones" });
  }
};

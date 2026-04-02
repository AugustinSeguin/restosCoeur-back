import { Request, Response } from "express";
import prisma from "@/libs/prisma";

const isValidTime = (value: unknown): value is string => {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
};

export const createStore = async (req: Request, res: Response) => {
  try {
    const {
      title,
      zoneId,
      openingTime,
      closingTime,
      isOpenSunday,
      minVolunteers,
      idealVolunteers,
    } = req.body;

    if (!isValidTime(openingTime) || !isValidTime(closingTime)) {
      return res.status(400).json({
        error: "Invalid openingTime/closingTime format. Expected HH:mm",
      });
    }

    if (typeof isOpenSunday !== "boolean") {
      return res.status(400).json({
        error: "isOpenSunday must be a boolean",
      });
    }

    const store = await prisma.store.create({
      data: {
        title,
        zoneId,
        openingTime,
        closingTime,
        isOpenSunday,
        minVolunteers,
        idealVolunteers,
      },
    });
    res.status(201).json(store);
  } catch (error) {
    res.status(400).json({ error: "Failed to create store" });
  }
};

export const updateStore = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const {
      title,
      zoneId,
      openingTime,
      closingTime,
      isOpenSunday,
      minVolunteers,
      idealVolunteers,
    } = req.body;

    if (!isValidTime(openingTime) || !isValidTime(closingTime)) {
      return res.status(400).json({
        error: "Invalid openingTime/closingTime format. Expected HH:mm",
      });
    }

    if (typeof isOpenSunday !== "boolean") {
      return res.status(400).json({
        error: "isOpenSunday must be a boolean",
      });
    }

    const store = await prisma.store.update({
      where: { id: Number.parseInt(id) },
      data: {
        title,
        zoneId,
        openingTime,
        closingTime,
        isOpenSunday,
        minVolunteers,
        idealVolunteers,
      },
    });
    res.json(store);
  } catch (error) {
    res.status(400).json({ error: "Failed to update store" });
  }
};

export const deleteStore = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await prisma.store.delete({
      where: { id: Number.parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: "Failed to delete store" });
  }
};

export const getStoreById = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const store = await prisma.store.findUnique({
      where: { id: Number.parseInt(id) },
      include: { zone: true },
    });
    if (!store) return res.status(404).json({ error: "Store not found" });
    res.json(store);
  } catch (error) {
    res.status(400).json({ error: "Failed to fetch store" });
  }
};

export const getAllStores = async (req: Request, res: Response) => {
  try {
    const stores = await prisma.store.findMany();
    res.json(stores);
  } catch (error) {
    res.status(400).json({ error: "Failed to fetch stores" });
  }
};

import { Request, Response } from "express";
import prisma from "@/libs/prisma";

export const createCollection = async (req: Request, res: Response) => {
  try {
    const { title, isActive, formUrl } = req.body;
    const collection = await prisma.collection.create({
      data: {
        title,
        isActive: isActive ?? true,
        formUrl,
      },
    });
    res.status(201).json(collection);
  } catch (error) {
    res.status(400).json({ error: "Failed to create collection" });
  }
};

export const updateCollection = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { title, isActive, formUrl } = req.body;
    const collection = await prisma.collection.update({
      where: { id: Number.parseInt(id) },
      data: { title, isActive, formUrl },
    });
    res.json(collection);
  } catch (error) {
    res.status(400).json({ error: "Failed to update collection" });
  }
};

export const getCollectionById = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const collection = await prisma.collection.findUnique({
      where: { id: Number.parseInt(id) },
      include: { zones: true },
    });
    if (!collection)
      return res.status(404).json({ error: "Collection not found" });
    res.json(collection);
  } catch (error) {
    res.status(400).json({ error: "Failed to fetch collection" });
  }
};

export const getAllCollections = async (req: Request, res: Response) => {
  try {
    const collections = await prisma.collection.findMany({
      include: { zones: true },
    });
    res.json(collections);
  } catch (error) {
    res.status(400).json({ error: "Failed to fetch collections" });
  }
};

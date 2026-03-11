import { Request, Response } from "express";
import prisma from "@/libs/prisma";
import bcrypt from "bcrypt";

const isValidPhoneNumber = (phoneNumber: unknown): phoneNumber is string => {
  return typeof phoneNumber === "string" && /^0[67]\d{8}$/.test(phoneNumber);
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const {
      lastName,
      firstName,
      email,
      phoneNumber,
      password,
      isActive,
      isAdmin,
      type,
    } = req.body;

    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        error:
          "Invalid phoneNumber format. Expected 10 digits, starting with 06 or 07, with no spaces or special characters",
      });
    }

    // Hash password if user is admin
    let hashedPassword: string | null = null;
    if (isAdmin && password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.create({
      data: {
        lastName,
        firstName,
        email: email || null,
        phoneNumber,
        password: hashedPassword,
        isActive: isActive ?? true,
        isAdmin: isAdmin ?? false,
        type,
      },
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: "Failed to create user" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const {
      lastName,
      firstName,
      email,
      phoneNumber,
      password,
      isActive,
      isAdmin,
      type,
    } = req.body;

    // Hash password if it's provided and user is admin
    let hashedPassword: string | null | undefined;
    if (password && isAdmin) {
      hashedPassword = await bcrypt.hash(password, 10);
    } else if (!isAdmin) {
      hashedPassword = null; // Set to null if user is not admin
    }

    const user = await prisma.user.update({
      where: { id: Number.parseInt(id) },
      data: {
        lastName,
        firstName,
        email: email || null,
        phoneNumber,
        ...(hashedPassword !== undefined && { password: hashedPassword }),
        isActive,
        isAdmin,
        type,
      },
    });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: "Failed to update user" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await prisma.user.delete({
      where: { id: Number.parseInt(id) },
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: "Failed to delete user" });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = await prisma.user.findUnique({
      where: { id: Number.parseInt(id) },
      include: { assignments: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: "Failed to fetch user" });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: { assignments: true },
    });
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: "Failed to fetch users" });
  }
};

import { Request, Response } from "express";
import prisma from "@/libs/prisma";
import bcrypt from "bcrypt";
import {
  findInvalidCollectionIds,
  generateUsername,
  isValidCodePostal,
  isValidPhoneNumber,
  normalizeIds,
  parseBirthdate,
} from "@/helpers/userHelper";

export const createUser = async (req: Request, res: Response) => {
  try {
    const {
      lastName,
      firstName,
      birthdate,
      codePostal,
      email,
      phoneNumber,
      password,
      isActive,
      isAdmin,
      type,
      collectionIds,
    } = req.body;

    const normalizedCollectionIds = normalizeIds(collectionIds);

    if (!lastName || !firstName || !phoneNumber || !birthdate || !codePostal) {
      return res.status(400).json({
        error:
          "lastName, firstName, phoneNumber, birthdate, and codePostal are required",
      });
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        error:
          "Invalid phoneNumber format. Expected 10 digits, starting with 06 or 07, with no spaces or special characters",
      });
    }

    if (!isValidCodePostal(codePostal)) {
      return res.status(400).json({
        error: "Invalid codePostal format. Expected exactly 5 digits",
      });
    }

    const parsedBirthdate = parseBirthdate(birthdate);
    if (!parsedBirthdate) {
      return res.status(400).json({
        error: "Invalid birthdate format. Expected a valid date",
      });
    }

    const username = generateUsername(lastName, firstName);
    if (!username) {
      return res.status(400).json({
        error:
          "Unable to generate username from lastName and firstName. Use latin letters a-z",
      });
    }

    const invalidCollectionIds = await findInvalidCollectionIds(
      normalizedCollectionIds,
    );
    if (invalidCollectionIds.length > 0) {
      return res.status(400).json({
        error: "Some collectionIds are invalid or do not exist",
        invalidCollectionIds,
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
        username,
        birthdate: parsedBirthdate,
        codePostal,
        email: email || null,
        phoneNumber,
        password: hashedPassword,
        isActive: isActive ?? true,
        isAdmin: isAdmin ?? false,
        type,
        collections: {
          create: normalizedCollectionIds.map((collectionId) => ({
            collection: {
              connect: { id: collectionId },
            },
          })),
        },
      },
      include: {
        collections: {
          include: {
            collection: true,
          },
        },
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
      birthdate,
      codePostal,
      email,
      phoneNumber,
      password,
      isActive,
      isAdmin,
      type,
      collectionIds,
    } = req.body;

    const normalizedCollectionIds = normalizeIds(collectionIds);

    if (!lastName || !firstName || !phoneNumber || !birthdate || !codePostal) {
      return res.status(400).json({
        error:
          "lastName, firstName, phoneNumber, birthdate, and codePostal are required",
      });
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        error:
          "Invalid phoneNumber format. Expected 10 digits, starting with 06 or 07, with no spaces or special characters",
      });
    }

    if (!isValidCodePostal(codePostal)) {
      return res.status(400).json({
        error: "Invalid codePostal format. Expected exactly 5 digits",
      });
    }

    const parsedBirthdate = parseBirthdate(birthdate);
    if (!parsedBirthdate) {
      return res.status(400).json({
        error: "Invalid birthdate format. Expected a valid date",
      });
    }

    const username = generateUsername(lastName, firstName);
    if (!username) {
      return res.status(400).json({
        error:
          "Unable to generate username from lastName and firstName. Use latin letters a-z",
      });
    }

    const invalidCollectionIds = await findInvalidCollectionIds(
      normalizedCollectionIds,
    );
    if (invalidCollectionIds.length > 0) {
      return res.status(400).json({
        error: "Some collectionIds are invalid or do not exist",
        invalidCollectionIds,
      });
    }

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
        username,
        birthdate: parsedBirthdate,
        codePostal,
        email: email || null,
        phoneNumber,
        ...(hashedPassword !== undefined && { password: hashedPassword }),
        isActive,
        isAdmin,
        type,
        ...(Array.isArray(collectionIds) && {
          collections: {
            deleteMany: {},
            create: normalizedCollectionIds.map((collectionId) => ({
              collection: {
                connect: { id: collectionId },
              },
            })),
          },
        }),
      },
      include: {
        collections: {
          include: {
            collection: true,
          },
        },
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
      include: {
        assignments: true,
        collections: {
          include: {
            collection: true,
          },
        },
      },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: "Failed to fetch user" });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: "Failed to fetch users" });
  }
};

export const getAdmins = async (req: Request, res: Response) => {
  try {
    const admins = await prisma.user.findMany({
      where: {
        isActive: true,
        isAdmin: true,
      },
    });

    res.json(admins);
  } catch (error) {
    res.status(400).json({ error: "Failed to fetch admins" });
  }
};

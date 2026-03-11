import { Request, Response } from "express";
import prisma from "@/libs/prisma";
import bcrypt from "bcrypt";
import { generateToken } from "@/middlewares/auth.middleware";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user by email
    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if password is set (admin users only)
    if (!user.password) {
      return res
        .status(401)
        .json({
          error:
            "This user account does not have password authentication enabled",
        });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        lastName: user.lastName,
        firstName: user.firstName,
        email: user.email,
        isAdmin: user.isAdmin,
        type: user.type,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to login" });
  }
};

export const logout = async (req: Request, res: Response) => {
  // JWT is stateless, so logout is just a client-side action
  // But we can send a success response
  res.json({ message: "Logged out successfully" });
};

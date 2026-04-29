import { NextFunction, Request, Response } from "express";

const API_KEY = process.env.API_KEY || "";

export const apiKeyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!API_KEY) {
    return res.status(500).json({ error: "API key is not configured" });
  }

  const apiKey = req.header("x-api-key");

  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: "Missing or invalid API key" });
  }

  next();
};

import "dotenv/config";
import express, { Request, Response } from "express";
import routes from "./routes/routes";

const app = express();
const PORT = process.env.PORT || 3000;

const cors = require("cors");
const frontendUrlsEnv =
  process.env.FRONTEND_URL ||
  "http://localhost:5173";
const allowedOrigins = frontendUrlsEnv.split(",").map((s: string) => s.trim());
console.log("Allowed CORS origins:", allowedOrigins);
app.use(
  cors({
    origin: (origin: string | undefined, callback: any) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
      return callback(new Error("CORS policy: Origin not allowed"));
    },
    credentials: true,
  }),
);
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "API is running" });
});

// API Routes
app.use("/api", routes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

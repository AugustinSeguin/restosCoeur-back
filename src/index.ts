import "dotenv/config";
import express, { Request, Response } from "express";
import routes from "./routes/routes";

const app = express();
const PORT = process.env.PORT || 3000;

const cors = require('cors');
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "API is running" });
});

// API Routes
app.use("/api", routes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

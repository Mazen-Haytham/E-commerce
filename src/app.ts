import dotenv from "dotenv";
import express from "express";
import type { Request, Response } from "express";
import morgan from "morgan";
import helmet from "helmet";

dotenv.config();

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/api/users", (req: Request, res: Response) => {
  return res.status(200).json({
    data: [
      {
        id: 1,
        name: "Mazen",
      },
    ],
  });
});

export default app;

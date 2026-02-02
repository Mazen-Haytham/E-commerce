import dotenv from "dotenv";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import helmet from "helmet";
import { userRouter } from "../UserModule/src/index.js";
import { sendError } from "./utils/sendError.js";
dotenv.config();

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
const logging = async (req: Request, res: Response, next: NextFunction) => {
  console.log(req.body);
  next();
};
app.use("/api/users", logging, userRouter);
app.use(sendError);
export default app;

import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import { userRouter } from "../Modules/User/src/index.js";
import { inventoryRouter } from "../Modules/Inventory/index.js";
import { authRouter } from "../Modules/Auth/index.js";
import { sendError } from "./utils/sendError.js";
dotenv.config();

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use("/api/users", userRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/auth", authRouter);
app.use(sendError);
export default app;

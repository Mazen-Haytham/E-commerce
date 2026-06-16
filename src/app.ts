import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import { userRouter } from "./Modules/User/src/index.js";
import { inventoryRouter } from "./Modules/Inventory/index.js";
import { authRouter } from "./Modules/Auth/index.js";
import { sendError } from "./utils/sendError.js";
import { productRouter } from "./Modules/Catalog/Product/index.js";
import { OrderRouter } from "./Modules/Orders/index.js";
import { categoryRouter } from "./Modules/Catalog/Category/index.js";
import { initMessaging } from "./messaging/index.js";

dotenv.config();

const app = express();

// Initialize RabbitMQ messaging
(async () => {
  try {
    await initMessaging();
    console.log("[App] RabbitMQ messaging initialized");
  } catch (err) {
    console.error("[App] Failed to initialize messaging:", err);
    process.exit(1);
  }
})();

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use("/api/users", userRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/auth", authRouter);
app.use("/api/catalog", productRouter);
app.use("/api/orders", OrderRouter);
app.use("/api/categories", categoryRouter);
app.use(sendError);
export default app;

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import { inventoryRouter } from "./index.js";
import { sendError } from "./utils/sendError.js";

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/inventory", inventoryRouter);

app.use(sendError);

const PORT = process.env.INVENTORY_SERVICE_PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Inventory service running on port ${PORT}`);
});

export default app;

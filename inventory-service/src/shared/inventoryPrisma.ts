import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/inventory-prisma/index.js";

const connectionString =
  process.env.INVENTORY_DATABASE_URL ||
  "postgresql://postgres:postgres@postgres:5432/inventory_db";

const adapter = new PrismaPg({ connectionString });
const inventoryPrisma = new PrismaClient({
  adapter,
  log: ["query", "info", "warn", "error"],
});

export { inventoryPrisma };

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/inventory-prisma/index.js";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@postgres:5432/ecommerce";

const adapter = new PrismaPg({ connectionString });
const inventoryPrisma = new PrismaClient({
  adapter,
  log: ["query", "info", "warn", "error"],
});

export { inventoryPrisma };

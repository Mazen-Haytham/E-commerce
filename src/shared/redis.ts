import * as RedisModule from "ioredis";

const Redis = (RedisModule as any).default ?? RedisModule;

export const redis = new Redis({
  host: process.env.REDIS_HOST || "redis",
  port: parseInt(process.env.REDIS_PORT || "6379"),
});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err: any) => {
  console.error("❌ Redis error:", err);
});

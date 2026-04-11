import * as RedisModule from "ioredis";

const Redis = (RedisModule as any).default ?? RedisModule;

export const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err:any) => {
  console.error("❌ Redis error:", err);
});


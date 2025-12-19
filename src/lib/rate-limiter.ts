"server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { parseServerActionResponse } from "./utils";
import { getAnonId } from "./anon-id";
import { auth } from "./auth";
import { headers } from "next/headers";

export const rateLimiter = new Ratelimit({
  redis: new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  }),
  limiter: Ratelimit.slidingWindow(10, "30 s"), // Allow 10 requests per 10 seconds
  analytics: true,
});

export const clientRateLimiter = new Ratelimit({
  redis: new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  }),
  limiter: Ratelimit.slidingWindow(50, "10 s"), // Allow 10 requests per 10 seconds
  analytics: true,
});

export const getClientId = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const userId = session?.user?.id;
  if (userId) return `user:${userId}`;
  return `anon:${await getAnonId()}`;
};

export const checkRateLimit = async (functionToRateLimit: string) => {
  const clientId = await getClientId();
  const prefix = process.env.PROJECT_PREFIX;
  const { success } = await rateLimiter.limit(
    `${prefix}:${clientId}:${functionToRateLimit}`
  );
  if (!success) {
    return parseServerActionResponse({
      status: "ERROR",
      error: "Too many requests, please try again later",
      data: null,
    });
  }
  return parseServerActionResponse({
    status: "SUCCESS",
    error: "",
    data: null,
  });
};

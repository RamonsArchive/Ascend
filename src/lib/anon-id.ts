import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE = "anon_id";

export async function getAnonId() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(COOKIE)?.value;
  if (existing) return existing;

  const anonId = crypto.randomUUID();

  cookieStore.set(COOKIE, anonId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return anonId;
}

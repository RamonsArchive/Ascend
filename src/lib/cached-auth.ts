"server-only";
import { cache } from "react";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";

// This ensures getSession is only called ONCE per request
export const getCachedSession = cache(async () => {
  return await auth.api.getSession({ headers: await headers() });
});

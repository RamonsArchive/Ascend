"use client";

import { useSearchParams } from "next/navigation";
import { signInWithGoogle } from "@/src/lib/auth-client";

export default function LoginPage() {
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") ?? "/app";

  return (
    <button onClick={() => signInWithGoogle(callbackUrl)}>
      Continue with Google
    </button>
  );
}

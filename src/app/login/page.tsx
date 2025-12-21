"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithGoogle, useSession } from "@/src/lib/auth-client";

export default function LoginPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  // Support both query styles:
  // - /login?next=/app/orgs/new
  // - /login?callbackUrl=/app
  const next = sp.get("next") ?? sp.get("callbackUrl") ?? "/app";

  useEffect(() => {
    if (session?.user?.id) {
      router.replace(next);
      return;
    }
    void signInWithGoogle(next);
  }, [next, router, session?.user?.id]);

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-2xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-4">
        <div className="text-white text-lg font-semibold">
          Redirecting to sign in…
        </div>
        <div className="text-white/70 text-sm leading-relaxed">
          If you’re not redirected automatically, tap below.
        </div>
        <button
          type="button"
          onClick={() => signInWithGoogle(next)}
          className="w-full max-w-sm px-5 py-3 rounded-2xl cursor-pointer bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90"
        >
          Continue with Google
        </button>
      </div>
    </section>
  );
}

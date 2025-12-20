"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { signInWithGoogle, useSession } from "@/src/lib/auth-client";

const DEFAULT_NEXT = "/organizations/create";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || DEFAULT_NEXT;
  const { data: session } = useSession();

  useEffect(() => {
    // If already logged in, just continue.
    if (session?.user?.id) {
      router.replace(next);
      return;
    }

    // Immediately kick off Google sign-in.
    void signInWithGoogle(next);
  }, [next, router, session?.user?.id]);

  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-2xl px-5 sm:px-10 md:px-18 py-10 md:py-14 gap-4">
        <div className="text-white text-lg font-semibold">
          Redirecting to sign in…
        </div>
        <div className="text-white/70 text-sm leading-relaxed">
          If you’re not redirected automatically, refresh the page.
        </div>
      </div>
    </section>
  );
}

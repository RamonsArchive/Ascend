"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, LogOut, Settings, User } from "lucide-react";
import { signInWithGoogle, signOut } from "../lib/auth-client";

type UserShape = {
  name: string | null;
  email: string | null;
  image: string | null;
};

type ProfileDropdownProps = {
  isSignedIn: boolean;
  onClose: () => void;
  refetch: () => void;
  user: UserShape;
  innerRef: React.RefObject<HTMLDivElement>;
};

export default function ProfileDropdown({
  isSignedIn,
  onClose,
  refetch,
  user,
  innerRef,
}: ProfileDropdownProps) {
  const pathname = usePathname();

  const handleGoogle = useCallback(async () => {
    onClose();
    await signInWithGoogle(pathname);
  }, [pathname, onClose]);

  const handleSignOut = useCallback(async () => {
    onClose();
    await signOut();
    await refetch();
  }, [onClose, refetch]);

  return (
    <div
      ref={innerRef}
      role="menu"
      className="absolute right-0 top-[48px] z-200 w-[288px] origin-top-right"
    >
      <div className="rounded-3xl bg-primary-950 border border-white/10 shadow-2xl overflow-hidden">
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="text-white font-semibold leading-tight truncate">
              {user.name ?? (isSignedIn ? "Signed in" : "Welcome")}
            </div>
            <div className="text-white/60 text-xs leading-tight truncate">
              {user.email ?? (isSignedIn ? "" : "Use your account to continue")}
            </div>
          </div>
        </div>

        <div className="px-3 py-3 flex flex-col gap-2">
          {isSignedIn ? (
            <>
              <Link
                href="/app/settings"
                onClick={onClose}
                className="w-full rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors px-4 py-3 text-sm text-white/90 flex items-center gap-3"
              >
                <Settings className="w-4 h-4 text-white/80" />
                Settings
              </Link>

              <div className="h-px bg-white/10 my-1" />

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors px-4 py-3 text-sm text-white/90 flex items-center gap-3 text-left"
              >
                <LogOut className="w-4 h-4 text-white/80" />
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleGoogle}
              className="w-full rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors px-4 py-3 text-sm text-white/90 flex items-center gap-3 text-left"
            >
              <LogIn className="w-4 h-4 text-white/80" />
              Continue with Google
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

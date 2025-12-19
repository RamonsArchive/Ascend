"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { UserIcon } from "lucide-react";
import { signInWithGoogle, signOut, getSession } from "../lib/auth-client";

type SessionResult = Awaited<ReturnType<typeof getSession>>;
type SessionData = SessionResult extends { data: infer D } ? D : never;

const ProfileAvatar = () => {
  const [session, setSession] = useState<SessionData>(null);

  const refreshSession = useCallback(async () => {
    try {
      const res = await getSession();
      setSession(res.data ?? null);
    } catch {
      setSession(null);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const userImage = useMemo(() => session?.user?.image ?? null, [session]);
  const userName = useMemo(() => session?.user?.name ?? null, [session]);
  const isSignedIn = !!session?.user;

  const handleClick = useCallback(async () => {
    console.log("handleClick", isSignedIn);
    if (isSignedIn) {
      await signOut();
      await refreshSession();
      return;
    }

    await signInWithGoogle();
  }, [isSignedIn, refreshSession]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isSignedIn ? "Account" : "Sign in"}
      className="w-[40px] h-[40px] rounded-full bg-secondary-500 flex-center cursor-pointer hover:bg-secondary-600 transition-colors duration-200 ease-in-out border-2 border-secondary-400/30 overflow-hidden"
    >
      {userImage ? (
        <Image
          src={userImage}
          alt={userName ? `${userName} avatar` : "User avatar"}
          width={40}
          height={40}
          className="w-full h-full object-cover"
        />
      ) : (
        <UserIcon className="w-4 h-4 text-white" />
      )}
    </button>
  );
};

export default ProfileAvatar;

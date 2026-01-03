"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { UserIcon } from "lucide-react";
import { useSession } from "../lib/auth-client";
import ProfileDropdown from "./ProfileDropdown";

type ProfileAvatarProps = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

export default function ProfileAvatar({ open, setOpen }: ProfileAvatarProps) {
  const { data: session, refetch } = useSession();
  const userImage = session?.user?.image ?? null;
  const userName = session?.user?.name ?? null;
  const isSignedIn = !!session?.user;

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;

      const inButton = !!buttonRef.current?.contains(target);
      const inDropdown = !!dropdownRef.current?.contains(target);

      // If you want to debug:
      // console.log({ inButton, inDropdown, dropdown: dropdownRef.current });

      if (!inButton && !inDropdown) setOpen(false);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpen]);

  return (
    <div className="relative z-999">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
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

      {open && (
        <ProfileDropdown
          ref={dropdownRef}
          isSignedIn={isSignedIn}
          onClose={() => setOpen(false)}
          refetch={refetch}
          user={{
            name: session?.user?.name ?? null,
            email: session?.user?.email ?? null,
            image: session?.user?.image ?? null,
          }}
        />
      )}
    </div>
  );
}

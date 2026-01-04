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

  // ✅ EXACT SAME pattern as SlidingMobileMenu
  const outerRef = useRef<HTMLDivElement>(null); // wrapper that contains button + dropdown
  const innerRef = useRef<HTMLDivElement>(null); // dropdown itself (or you can set to dropdown root)

  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent | TouchEvent) => {
      const innerClicked = innerRef.current?.contains(e.target as Node);
      const outerClicked = outerRef.current?.contains(e.target as Node);

      // click outside the whole avatar area => close
      if (!outerClicked) setOpen(false);

      // (optional) if you only want close when clicking outside dropdown but still within outer,
      // keep this off. Usually we DON'T close on outer clicks because that includes button.
      // if (outerClicked && !innerClicked) setOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen]);

  return (
    <div ref={outerRef} className="relative z-200">
      <button
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
          innerRef={innerRef as React.RefObject<HTMLDivElement>}
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

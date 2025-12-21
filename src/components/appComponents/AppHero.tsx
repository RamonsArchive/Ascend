import React from "react";
import Link from "next/link";

const AppHero = ({ userName }: { userName: string }) => {
  return (
    <section className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col w-full max-w-6xl px-5 sm:px-10 md:px-18 pt-10 md:pt-14 gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl md:text-5xl font-semibold text-white leading-tight">
            Welcome back{userName ? `, ${userName}` : ""}.
          </h1>
          <div className="text-sm md:text-lg text-white/70 leading-relaxed max-w-4xl">
            Pick an organization to manage events, members, and sponsors.
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/app/orgs"
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-primary-950 font-semibold text-sm md:text-base transition-opacity hover:opacity-90 text-center"
          >
            My organizations
          </Link>
          <Link
            href="/app/orgs/new"
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/90 font-semibold text-sm md:text-base transition-colors hover:bg-white/10 text-center"
          >
            Create organization
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AppHero;

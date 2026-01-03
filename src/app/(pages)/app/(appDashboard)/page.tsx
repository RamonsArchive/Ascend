import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { fetchAllUserOrganizations } from "@/src/actions/org_actions";
import AppHero from "@/src/components/appComponents/AppHero";
import AppOrganizationsSection from "@/src/components/appComponents/AppOrganizationsSection";
import type { OrgListItem } from "@/src/lib/global_types";
import Link from "next/link";

const AppPage = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect(`/login?next=/app`);
  }

  const organizations = await fetchAllUserOrganizations();
  if (organizations.status === "ERROR")
    return (
      <div className="relative w-full min-h-[calc(100vh-48px)]">
        <div className="absolute inset-0 pointer-events-none marketing-bg" />
        <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
          <div className="text-white text-xl font-semibold">Error</div>
          <div className="text-white/70 text-sm leading-relaxed">
            Failed to fetch organizations
          </div>
          <Link href="/" className="text-white/70 text-sm leading-relaxed">
            Back to home
          </Link>
        </div>
      </div>
    );

  const orgs = organizations.data as OrgListItem[];

  return (
    <div className="relative w-full min-h-[calc(100vh-48px)]">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <AppHero userName={session.user.name ?? ""} />
        <AppOrganizationsSection
          title="Your organizations"
          description="Jump into any org you manage. Create a new one when you’re ready."
          orgs={orgs}
          ctaHref="/app/orgs"
          ctaLabel="View all"
        />
      </div>
    </div>
  );
};
export default AppPage;

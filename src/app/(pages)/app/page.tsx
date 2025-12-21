import { auth } from "@/src/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getAllOrganizations } from "@/src/actions/org_actions";
import AppHero from "@/src/components/appComponents/AppHero";

const AppPage = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/app`);
  }

  const organizations = await getAllOrganizations();
  if (organizations.status === "ERROR")
    return <div>Error: {organizations.error}</div>;

  return (
    <div className="relative w-full">
      <div className="absolute inset-0 pointer-events-none marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <AppHero />
      </div>
    </div>
  );
};
export default AppPage;

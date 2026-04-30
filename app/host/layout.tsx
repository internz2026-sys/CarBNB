import Link from "next/link";
import { redirect } from "next/navigation";
import { UserMenu } from "@/components/layout/user-menu";
import { getCurrentHost } from "@/lib/current-host";
import { HostNav } from "./host-nav";

export default async function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentHost();

  // Proxy should have already bounced anonymous + non-host traffic, but be
  // defensive here in case someone renders a /host page outside a request.
  if (session.kind === "anonymous") redirect("/login?redirectTo=/host/dashboard");
  if (session.kind === "not-host") redirect("/");

  return (
    <div className="min-h-screen bg-surface pb-16 font-sans">
      <header className="sticky top-0 z-30 bg-[rgb(250_248_255_/_0.85)] shadow-[0_8px_24px_rgb(19_27_46_/_0.04)] backdrop-blur-lg">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
          <Link className="font-headline text-2xl font-black tracking-tight text-primary" href="/host/dashboard">
            DriveXP
          </Link>
          <HostNav verified={session.kind === "verified"} />
          <UserMenu
            fullName={session.owner.fullName}
            links={[
              { label: "Dashboard", href: "/host/dashboard" },
              { label: "My cars", href: "/host/cars" },
              { label: "My bookings", href: "/host/bookings" },
            ]}
            roleLabel="Host"
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-6">
        {children}
      </main>
    </div>
  );
}

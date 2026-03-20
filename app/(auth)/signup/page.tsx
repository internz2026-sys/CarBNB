import Link from "next/link";
import { CarFront } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { RoleSignupPanel, signupRoles } from "@/components/auth/role-signup-panel";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { callbackUrl } = await searchParams;
  const redirectUrl = typeof callbackUrl === "string" ? callbackUrl : undefined;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dae2ff_0%,#f2f3ff_40%,#faf8ff_100%)] px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <Link className="flex items-center gap-3" href="/">
            <div className="grid size-11 place-items-center rounded-full bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] text-on-primary shadow-[0_10px_24px_rgb(0_82_204_/_0.18)]">
              <CarFront className="size-5" />
            </div>
            <div>
              <div className="font-headline text-xl font-black tracking-tight text-primary">
                carBNB
              </div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-on-surface-variant">
                Account Sign-up
              </div>
            </div>
          </Link>

          <Link
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-full border-border bg-surface-container-lowest text-primary hover:bg-surface-container"
            )}
            href="/login"
          >
            Back to Log-in
          </Link>
        </div>

        <div className="mb-10 max-w-2xl">
          <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
            Join the marketplace
          </div>
          <h1 className="mt-4 font-headline text-4xl font-extrabold tracking-tight text-on-surface sm:text-5xl">
            Choose the account that fits your journey.
          </h1>
          <p className="mt-4 text-base leading-7 text-on-surface-variant">
            Hosts and customers move through different parts of the product, so we give
            each role its own sign-up path from the start.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {signupRoles.map((role) => (
            <RoleSignupPanel key={role.id} roleId={role.id} redirectUrl={redirectUrl} />
          ))}
        </div>
      </div>
    </div>
  );
}

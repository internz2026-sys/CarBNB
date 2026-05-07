import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck, UserRound } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { CompleteProfileForm } from "./complete-form";

// Lands here after Google OAuth for a user with no existing Owner / Customer
// row. The OAuth callback already routed away if a record existed; this page
// re-checks defensively and prompts for the role-specific fields the email/
// password signup flow normally captures inline (FLEET-only fields are the
// only blockers — fullName comes pre-filled from the Google identity).
export default async function CompleteProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; kind?: string }>;
}) {
  const { role: roleParam, kind: kindParam } = await searchParams;
  const role: "host" | "customer" =
    roleParam === "host" ? "host" : "customer";
  const kind: "INDIVIDUAL" | "FLEET" =
    kindParam === "FLEET" ? "FLEET" : "INDIVIDUAL";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    redirect("/login");
  }

  // If the user already has a domain row, the callback should have routed
  // them — but if they navigated here manually, send them home.
  const email = user.email.toLowerCase();
  const [admin, owner, customer] = await Promise.all([
    db.user.findUnique({ where: { email } }),
    db.owner.findUnique({ where: { email } }),
    db.customer.findUnique({ where: { email } }),
  ]);
  if (admin) redirect("/dashboard");
  if (owner) redirect("/host/dashboard");
  if (customer) redirect("/account");

  const fullNameDefault =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    "";

  const isHost = role === "host";
  const Icon = isHost ? ShieldCheck : UserRound;
  const badge = isHost
    ? kind === "FLEET"
      ? "Fleet Operator"
      : "Independent Car Owner"
    : "Customer";
  const title = isHost
    ? kind === "FLEET"
      ? "Finish your fleet operator profile"
      : "Finish your host profile"
    : "Finish your customer profile";
  const description = isHost
    ? "A few more details and your host account is ready. You can refine availability, photos, and listings from your dashboard."
    : "Confirm your details and start exploring the marketplace.";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dae2ff_0%,#f2f3ff_40%,#faf8ff_100%)] px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <Link className="flex items-center" href="/">
            <Image
              alt="DriveXP"
              className="h-10 w-auto"
              height={40}
              priority
              src="/driveXP-logo-wordmark.png"
              width={161}
            />
          </Link>
          <Link
            className={cn(
              buttonVariants({ variant: "outline" }),
              "rounded-full border-border bg-surface-container-lowest text-primary hover:bg-surface-container",
            )}
            href="/signup"
          >
            Back to Sign-up
          </Link>
        </div>

        <Card className="rounded-[2rem] border-none bg-surface-container-lowest shadow-[0_22px_50px_rgb(19_27_46_/_0.08)]">
          <CardHeader className="space-y-3 px-6 pb-3 pt-8 sm:px-8">
            <div className="grid size-14 place-items-center rounded-[1.25rem] bg-surface-container text-primary shadow-[0_8px_20px_rgb(19_27_46_/_0.05)]">
              <Icon className="size-7" />
            </div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
              {badge}
            </div>
            <CardTitle className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">
              {title}
            </CardTitle>
            <CardDescription className="text-sm leading-6 text-on-surface-variant">
              {description}
            </CardDescription>
            <p className="pt-1 text-xs text-on-surface-variant">
              Signed in as <span className="font-semibold">{user.email}</span>
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-8 sm:px-8">
            <CompleteProfileForm
              fullNameDefault={fullNameDefault}
              kind={kind}
              role={role}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

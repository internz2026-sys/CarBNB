import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, UserRound } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SignupForm } from "./signup-form";
import { HostSignupFlow } from "./host-signup-flow";

// Mirrors LOGIN_ERROR_MESSAGES on the login page, but the wording here
// nudges existing-account users toward the login page instead of a tab.
const SIGNUP_ERROR_MESSAGES: Record<string, string> = {
  oauth_failed:
    "Couldn't complete Google sign-in. Please try again, or sign up with email.",
  customer_exists:
    "This email is already registered as a customer. Please log in instead.",
  host_exists:
    "This email is already registered as a host. Please log in instead.",
  account_exists:
    "An account with this email already exists. Please log in instead.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? SIGNUP_ERROR_MESSAGES[error] : null;
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dae2ff_0%,#f2f3ff_40%,#faf8ff_100%)] px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-6xl">
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

        {errorMessage ? (
          <div className="mb-6 max-w-2xl rounded-[1rem] bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Host signup card — Tier 15 makes this a 2-step flow:
              first pick Independent vs Fleet, then fill out the form. */}
          <Card
            className="rounded-[2rem] border-none bg-surface-container-lowest shadow-[0_22px_50px_rgb(19_27_46_/_0.08)]"
            id="host"
          >
            <CardHeader className="space-y-3 px-6 pb-3 pt-8 sm:px-8">
              <div className="grid size-14 place-items-center rounded-[1.25rem] bg-surface-container text-primary shadow-[0_8px_20px_rgb(19_27_46_/_0.05)]">
                <ShieldCheck className="size-7" />
              </div>
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                Host Sign-up
              </div>
              <CardTitle className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">
                Create a car owner or fleet operator account
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-on-surface-variant">
                Set up your marketplace profile to list vehicles, manage schedules, and
                track payouts.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 pb-8 sm:px-8">
              <HostSignupFlow />
            </CardContent>
          </Card>

          {/* Customer signup card — unchanged from prior tiers. */}
          <Card
            className="rounded-[2rem] border-none bg-surface-container-lowest shadow-[0_22px_50px_rgb(19_27_46_/_0.08)]"
            id="customer"
          >
            <CardHeader className="space-y-3 px-6 pb-3 pt-8 sm:px-8">
              <div className="grid size-14 place-items-center rounded-[1.25rem] bg-surface-container text-primary shadow-[0_8px_20px_rgb(19_27_46_/_0.05)]">
                <UserRound className="size-7" />
              </div>
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                Customer Sign-up
              </div>
              <CardTitle className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">
                Create a customer account
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-on-surface-variant">
                Save favorite cars, manage your trips, and book curated vehicles with
                confidence.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 pb-8 sm:px-8">
              <SignupForm
                emailPlaceholder="traveler@drivexp.com"
                namePlaceholder="Jamie Cruz"
                role="customer"
                submitLabel="Create Customer Account"
              />
            </CardContent>
          </Card>
        </div>

        <p className="mt-10 text-center text-xs text-on-surface-variant">
          By creating an account, you agree to our{" "}
          <Link className="font-semibold text-primary hover:underline" href="/terms">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link className="font-semibold text-primary hover:underline" href="/privacy">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

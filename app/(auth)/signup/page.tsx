import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RegisterFlow } from "./register-flow";

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
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <Link className="flex items-center" href="/">
            <BrandLogo size={10} />
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

        <div className="mb-8">
          <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
            Join the marketplace
          </div>
          <h1 className="mt-4 font-headline text-4xl font-extrabold tracking-tight text-on-surface sm:text-5xl">
            Create your DriveXP account.
          </h1>
          <p className="mt-4 text-base leading-7 text-on-surface-variant">
            Pick how you'll use the marketplace — Renter, Independent host, or
            Registered Car Rental Operator — and we'll set up the right account.
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-6 rounded-[1rem] bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <Card className="rounded-[2rem] border-none bg-surface-container-lowest shadow-[0_22px_50px_rgb(19_27_46_/_0.08)]">
          <CardHeader className="space-y-2 px-6 pb-3 pt-8 sm:px-8">
            <CardTitle className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">
              Register
            </CardTitle>
            <CardDescription className="text-sm leading-6 text-on-surface-variant">
              Already have an account?{" "}
              <Link className="font-semibold text-primary hover:underline" href="/login">
                Log in
              </Link>
              .
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-8 sm:px-8">
            <RegisterFlow />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

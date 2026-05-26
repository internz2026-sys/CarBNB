import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

// Maps `?error=...` codes the OAuth callback emits when Google sign-in lands
// somewhere it can't proceed. With the unified login form there are no longer
// role tabs to mismatch against, so `customer_exists` / `host_exists` are
// unreachable from this page and have been removed.
const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  oauth_failed:
    "Couldn't complete Google sign-in. Please try again, or sign in with email.",
  no_account:
    "No account found for that email. Please sign up first.",
};

// searchParams is a Promise in Next.js 16, hence the async component.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    signedUp?: string;
    redirectTo?: string;
    error?: string;
  }>;
}) {
  const { signedUp, redirectTo, error } = await searchParams;
  const errorMessage = error ? LOGIN_ERROR_MESSAGES[error] : null;
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dae2ff_0%,#f2f3ff_40%,#faf8ff_100%)] px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden rounded-[2.25rem] bg-[linear-gradient(145deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] p-8 text-on-primary shadow-[0_22px_60px_rgb(0_82_204_/_0.2)] lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-full bg-white p-2 shadow-[0_8px_20px_rgb(0_0_0_/_0.18)]">
                <BrandLogo alt="" variant="icon" />
              </div>
              <div>
                <div className="font-headline text-2xl font-black tracking-tight">DriveXP</div>
                <div className="text-xs uppercase tracking-[0.24em] text-white/70">
                  Marketplace Access
                </div>
              </div>
            </div>

            <div className="mt-14 max-w-xl">
              <div className="inline-flex rounded-full bg-white/12 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-white/80">
                Welcome back
              </div>
              <h1 className="mt-6 font-headline text-5xl font-extrabold leading-[1.02] tracking-tight">
                One sign-in for hosts, renters, and operators.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-white/82">
                Use the email you signed up with — we'll route you to the right
                place automatically.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.5rem] bg-white/10 p-5 backdrop-blur-sm">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/68">
                Hosts
              </div>
              <p className="mt-2 text-sm leading-6 text-white/82">
                Listings, availability, bookings, accounting, and platform operations.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-white/10 p-5 backdrop-blur-sm">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/68">
                Renters
              </div>
              <p className="mt-2 text-sm leading-6 text-white/82">
                Saved cars, trip preferences, and a cleaner reservation experience.
              </p>
            </div>
          </div>
        </section>

        <Card className="my-auto w-full rounded-[2.25rem] border-none bg-surface-container-lowest shadow-[0_22px_60px_rgb(19_27_46_/_0.08)]">
          <CardHeader className="space-y-3 px-6 pb-3 pt-8 text-center sm:px-8">
            <div className="flex justify-center lg:hidden">
              <BrandLogo size={12} variant="icon" />
            </div>
            <CardTitle className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
              Sign in to DriveXP
            </CardTitle>
            <CardDescription className="mx-auto max-w-md text-sm leading-6 text-on-surface-variant">
              Enter your email and password — we'll take you to your dashboard.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-0 sm:px-8">
            {errorMessage ? (
              <div className="mb-4 rounded-[1rem] bg-red-50 p-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}
            {signedUp ? (
              <div className="mb-4 rounded-[1rem] bg-emerald-50 p-3 text-sm text-emerald-800">
                Account created. Check your email to confirm, then sign in below.
              </div>
            ) : null}

            <LoginForm redirectTo={redirectTo} />
          </CardContent>

          <CardFooter className="flex-col items-start gap-3 px-6 pb-8 pt-6 sm:px-8">
            <p className="w-full text-center text-sm text-on-surface-variant">
              Don't have an account?{" "}
              <Link
                className="font-semibold text-primary hover:underline"
                href="/signup"
              >
                Register now
              </Link>
            </p>
            <p className="w-full text-center text-xs text-on-surface-variant">
              DriveXP MVP Prototype Version 1.0.0
            </p>
            <p className="w-full text-center text-xs text-on-surface-variant">
              By signing in, you agree to our{" "}
              <Link className="font-semibold text-primary hover:underline" href="/terms">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link className="font-semibold text-primary hover:underline" href="/privacy">
                Privacy Policy
              </Link>
              .
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

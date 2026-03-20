import Link from "next/link";
import { CarFront, ShieldCheck, UserRound } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const roleContent = {
  host: {
    badge: "Host Portal",
    title: "Log in as a car owner or host",
    description:
      "Access listings, availability, bookings, and payout tools built for marketplace hosts.",
    emailLabel: "Host Email",
    emailPlaceholder: "host@carbnb.com",
    emailDefault: "host@carbnb.com",
    passwordId: "host-password",
    emailId: "host-email",
    signInHref: "/dashboard",
    signInLabel: "Enter Host Dashboard",
    signUpHref: "/signup#host",
    signUpLabel: "Create host account",
    icon: ShieldCheck,
  },
  customer: {
    badge: "Customer Access",
    title: "Log in as a customer",
    description:
      "Review saved cars, upcoming trips, and marketplace activity from one place.",
    emailLabel: "Customer Email",
    emailPlaceholder: "traveler@carbnb.com",
    emailDefault: "traveler@carbnb.com",
    passwordId: "customer-password",
    emailId: "customer-email",
    signInHref: "/",
    signInLabel: "Enter Marketplace",
    signUpHref: "/signup#customer",
    signUpLabel: "Create customer account",
    icon: UserRound,
  },
} as const;

type RoleKey = keyof typeof roleContent;

function RoleAuthPanel({ role }: { role: RoleKey }) {
  const config = roleContent[role];
  const Icon = config.icon;

  return (
    <div className="space-y-6 pt-6">
      <div className="rounded-[1.5rem] bg-surface-container p-4 shadow-[0_10px_28px_rgb(19_27_46_/_0.04)]">
        <div className="flex items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-[1rem] bg-surface-container-lowest text-primary shadow-[0_8px_20px_rgb(19_27_46_/_0.05)]">
            <Icon className="size-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
              {config.badge}
            </div>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              {config.description}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={config.emailId}>{config.emailLabel}</Label>
          <Input
            defaultValue={config.emailDefault}
            id={config.emailId}
            placeholder={config.emailPlaceholder}
            required
            type="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={config.passwordId}>Password</Label>
          <Input defaultValue="password123" id={config.passwordId} required type="password" />
        </div>
      </div>

      <div className="space-y-3">
        <Link className={cn(buttonVariants(), "w-full")} href={config.signInHref}>
          {config.signInLabel}
        </Link>
        <Link
          className={cn(
            buttonVariants({ variant: "outline" }),
            "w-full border-border bg-surface-container-lowest text-primary hover:bg-surface-container"
          )}
          href={config.signUpHref}
        >
          {config.signUpLabel}
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dae2ff_0%,#f2f3ff_40%,#faf8ff_100%)] px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden rounded-[2.25rem] bg-[linear-gradient(145deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] p-8 text-on-primary shadow-[0_22px_60px_rgb(0_82_204_/_0.2)] lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-full bg-white/14">
                <CarFront className="size-6" />
              </div>
              <div>
                <div className="font-headline text-2xl font-black tracking-tight">carBNB</div>
                <div className="text-xs uppercase tracking-[0.24em] text-white/70">
                  Marketplace Access
                </div>
              </div>
            </div>

            <div className="mt-14 max-w-xl">
              <div className="inline-flex rounded-full bg-white/12 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-white/80">
                Choose your portal
              </div>
              <h1 className="mt-6 font-headline text-5xl font-extrabold leading-[1.02] tracking-tight">
                One marketplace, two tailored ways to log in.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-white/82">
                Hosts manage the business of their vehicles while customers move through
                discovery, booking, and trip planning with a calmer flow.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.5rem] bg-white/10 p-5 backdrop-blur-sm">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/68">
                Host Access
              </div>
              <p className="mt-2 text-sm leading-6 text-white/82">
                Listings, availability, bookings, accounting, and platform operations.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-white/10 p-5 backdrop-blur-sm">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/68">
                Customer Access
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
              <div className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
                <CarFront className="size-7" />
              </div>
            </div>
            <CardTitle className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
              CarBnb Log-in
            </CardTitle>
            <CardDescription className="mx-auto max-w-md text-sm leading-6 text-on-surface-variant">
              Sign in with the experience that matches how you use the marketplace.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-0 sm:px-8">
            <Tabs className="gap-0" defaultValue="host">
              <TabsList className="grid h-13 w-full grid-cols-2 rounded-full bg-surface-container-highest p-1">
                <TabsTrigger
                  className="rounded-full border-none text-sm font-semibold text-on-surface-variant after:hidden data-active:bg-surface-container-lowest data-active:text-primary data-active:shadow-[0_8px_18px_rgb(19_27_46_/_0.06)]"
                  value="host"
                >
                  Car Owner / Host
                </TabsTrigger>
                <TabsTrigger
                  className="rounded-full border-none text-sm font-semibold text-on-surface-variant after:hidden data-active:bg-surface-container-lowest data-active:text-primary data-active:shadow-[0_8px_18px_rgb(19_27_46_/_0.06)]"
                  value="customer"
                >
                  Customer
                </TabsTrigger>
              </TabsList>

              <TabsContent className="focus-visible:outline-none focus-visible:ring-0" value="host">
                <RoleAuthPanel role="host" />
              </TabsContent>

              <TabsContent
                className="focus-visible:outline-none focus-visible:ring-0"
                value="customer"
              >
                <RoleAuthPanel role="customer" />
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex-col items-start gap-3 px-6 pb-8 pt-6 sm:px-8">
            <div className="rounded-[1.25rem] bg-surface-container-low p-4 text-sm leading-6 text-on-surface-variant">
              Need an account first? Use the sign-up actions above to create either a host
              account or a customer account.
            </div>
            <p className="w-full text-center text-xs text-on-surface-variant">
              CarBnb MVP Prototype Version 1.0.0
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

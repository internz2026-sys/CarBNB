import Link from "next/link";
import { CarFront, ShieldCheck, UserRound } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const signupRoles = [
  {
    id: "host",
    badge: "Host Sign-up",
    title: "Create a car owner or host account",
    description:
      "Set up your marketplace profile to list vehicles, manage schedules, and track payouts.",
    firstNamePlaceholder: "Alex",
    lastNamePlaceholder: "Rivera",
    emailPlaceholder: "host@carbnb.com",
    actionHref: "/dashboard",
    actionLabel: "Create Host Account",
    icon: ShieldCheck,
  },
  {
    id: "customer",
    badge: "Customer Sign-up",
    title: "Create a customer account",
    description:
      "Save favorite cars, manage your trips, and book curated vehicles with confidence.",
    firstNamePlaceholder: "Jamie",
    lastNamePlaceholder: "Cruz",
    emailPlaceholder: "traveler@carbnb.com",
    actionHref: "/",
    actionLabel: "Create Customer Account",
    icon: UserRound,
  },
] as const;

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
          {signupRoles.map((role) => {
            const Icon = role.icon;

            return (
              <Card
                className="rounded-[2rem] border-none bg-surface-container-lowest shadow-[0_22px_50px_rgb(19_27_46_/_0.08)]"
                id={role.id}
                key={role.id}
              >
                <CardHeader className="space-y-3 px-6 pb-3 pt-8 sm:px-8">
                  <div className="grid size-14 place-items-center rounded-[1.25rem] bg-surface-container text-primary shadow-[0_8px_20px_rgb(19_27_46_/_0.05)]">
                    <Icon className="size-7" />
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                    {role.badge}
                  </div>
                  <CardTitle className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">
                    {role.title}
                  </CardTitle>
                  <CardDescription className="text-sm leading-6 text-on-surface-variant">
                    {role.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 px-6 pb-8 sm:px-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${role.id}-first-name`}>First Name</Label>
                      <Input id={`${role.id}-first-name`} placeholder={role.firstNamePlaceholder} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${role.id}-last-name`}>Last Name</Label>
                      <Input id={`${role.id}-last-name`} placeholder={role.lastNamePlaceholder} />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-3 space-y-2">
                      <Label htmlFor={`${role.id}-birthday`}>Birthday</Label>
                      <Input id={`${role.id}-birthday`} type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${role.id}-age`}>Age</Label>
                      <Input id={`${role.id}-age`} type="number" min="18" max="120" placeholder="25" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${role.id}-email`}>Email</Label>
                    <Input
                      id={`${role.id}-email`}
                      placeholder={role.emailPlaceholder}
                      type="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${role.id}-password`}>Password</Label>
                    <Input id={`${role.id}-password`} type="password" />
                  </div>
                  <Link className={cn(buttonVariants(), "mt-2 w-full")} href={redirectUrl && role.id === "customer" ? redirectUrl : role.actionHref}>
                    {role.actionLabel}
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

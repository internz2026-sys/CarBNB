"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ShieldCheck, UserRound } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { loginAction, type AuthState } from "@/app/(auth)/actions";

const roleContent = {
  host: {
    badge: "Host Portal",
    description:
      "Access listings, availability, bookings, and payout tools built for marketplace hosts.",
    emailLabel: "Host Email",
    emailPlaceholder: "host@drivexp.com",
    passwordId: "host-password",
    emailId: "host-email",
    submitLabel: "Enter Host Dashboard",
    signUpHref: "/signup#host",
    signUpLabel: "Create host account",
    icon: ShieldCheck,
  },
  customer: {
    badge: "Customer Access",
    description:
      "Review saved cars, upcoming trips, and marketplace activity from one place.",
    emailLabel: "Customer Email",
    emailPlaceholder: "traveler@drivexp.com",
    passwordId: "customer-password",
    emailId: "customer-email",
    submitLabel: "Enter Marketplace",
    signUpHref: "/signup#customer",
    signUpLabel: "Create customer account",
    icon: UserRound,
  },
} as const;

export type RoleKey = keyof typeof roleContent;

export function LoginForm({ redirectTo, role }: { redirectTo?: string; role: RoleKey }) {
  const config = roleContent[role];
  const Icon = config.icon;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    loginAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-6 pt-6">
      <input name="selectedRole" type="hidden" value={role} />
      {redirectTo ? <input name="redirectTo" type="hidden" value={redirectTo} /> : null}
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
            defaultValue={state?.email ?? ""}
            id={config.emailId}
            name="email"
            placeholder={config.emailPlaceholder}
            required
            type="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={config.passwordId}>Password</Label>
          <Input id={config.passwordId} name="password" required type="password" />
        </div>
      </div>

      {state?.error ? (
        <div className="rounded-[1rem] bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <div className="space-y-3">
        <Button className="w-full" disabled={pending} type="submit">
          {pending ? "Signing in..." : config.submitLabel}
        </Button>
        <Link
          className={cn(
            buttonVariants({ variant: "outline" }),
            "w-full border-border bg-surface-container-lowest text-primary hover:bg-surface-container",
          )}
          href={config.signUpHref}
        >
          {config.signUpLabel}
        </Link>
      </div>
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { Building2, ChevronLeft, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupAction, type AuthState } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";

// Tier 15 onboarding: hosts pick a kind first (Independent vs Fleet) before
// seeing the signup form. The choice is locked at signup. Different kinds
// get slightly different forms — fleets need company name + business reg
// number alongside the contact person's details.

type HostKind = "INDIVIDUAL" | "FLEET";

const KINDS: Array<{
  value: HostKind;
  title: string;
  caption: string;
  Icon: typeof UserRound;
}> = [
  {
    value: "INDIVIDUAL",
    title: "Independent Car Owner",
    caption:
      "I have my own car and want to rent it out myself. I'll handle pickups, drop-offs, and customer messages.",
    Icon: UserRound,
  },
  {
    value: "FLEET",
    title: "Registered Car Rental Operator",
    caption:
      "I run a rental company and want to manage cars on behalf of multiple owners. I have a registered business.",
    Icon: Building2,
  },
];

export function HostSignupFlow() {
  const [kind, setKind] = useState<HostKind | null>(null);

  if (kind === null) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-on-surface-variant">
          Tell us a bit about yourself.
        </p>
        {KINDS.map(({ value, title, caption, Icon }) => (
          <button
            className="group flex w-full items-start gap-4 rounded-2xl border border-border bg-surface-container-lowest p-4 text-left transition hover:border-primary hover:bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary"
            key={value}
            onClick={() => setKind(value)}
            type="button"
          >
            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-on-primary">
              <Icon className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-headline text-base font-bold text-on-surface">
                {title}
              </h3>
              <p className="mt-1 text-xs leading-5 text-on-surface-variant">
                {caption}
              </p>
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <HostFormForKind kind={kind} onBack={() => setKind(null)} />
  );
}

function HostFormForKind({
  kind,
  onBack,
}: {
  kind: HostKind;
  onBack: () => void;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signupAction,
    null,
  );

  const isFleet = kind === "FLEET";
  const submitLabel = isFleet ? "Create Fleet Account" : "Create Host Account";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="role" value="host" />
      <input type="hidden" name="kind" value={kind} />

      <button
        className="-ml-1 inline-flex items-center gap-1 rounded-md text-xs font-semibold text-on-surface-variant transition hover:text-primary"
        onClick={onBack}
        type="button"
      >
        <ChevronLeft className="size-3.5" />
        Change account type
      </button>

      <div
        className={cn(
          "rounded-md px-3 py-2 text-xs font-semibold",
          isFleet
            ? "bg-tertiary-fixed text-on-tertiary-fixed-variant"
            : "bg-primary/10 text-primary",
        )}
      >
        {isFleet ? "Registered Car Rental Operator" : "Independent Car Owner"}
      </div>

      {isFleet ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="signup-companyName">Company Name</Label>
            <Input
              id="signup-companyName"
              name="companyName"
              placeholder="e.g. Acme Rentals Inc."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-businessRegNumber">Business Registration Number</Label>
            <Input
              id="signup-businessRegNumber"
              name="businessRegNumber"
              placeholder="DTI / SEC / BIR registration number"
              required
            />
          </div>
        </>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="signup-fullName">
          {isFleet ? "Contact Person — Full Name" : "Full Name"}
        </Label>
        <Input
          defaultValue={state?.email ? "" : ""}
          id="signup-fullName"
          name="fullName"
          placeholder={isFleet ? "e.g. Maria Santos" : "e.g. Alex Rivera"}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          defaultValue={state?.email ?? ""}
          id="signup-email"
          name="email"
          placeholder={isFleet ? "operations@acme-rentals.com" : "host@drivexp.com"}
          required
          type="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input id="signup-password" minLength={8} name="password" required type="password" />
      </div>

      {state?.error ? (
        <div className="rounded-[1rem] bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <Button className="mt-2 w-full" disabled={pending} type="submit">
        {pending ? "Creating account..." : submitLabel}
      </Button>
    </form>
  );
}

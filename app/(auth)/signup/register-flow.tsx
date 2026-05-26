"use client";

import { useState } from "react";
import { Building2, ShieldCheck, UserRound } from "lucide-react";
import { HostSignupForm, type HostKind } from "./host-signup-flow";
import { SignupForm } from "./signup-form";

// Unified signup chooser. Step 1: pick one of three accounts (Renter,
// Independent host, Fleet operator). Step 2: render the matching form, which
// owns the Terms + Privacy gate and submits to the right server action.
//
// The Renter card maps to role="customer" — DB tables and routes still use
// "customer" everywhere; "Renter" is only the user-facing word here.

type Choice =
  | { kind: "renter" }
  | { kind: "host"; hostKind: HostKind };

const OPTIONS: Array<{
  id: string;
  choice: Choice;
  title: string;
  caption: string;
  Icon: typeof UserRound;
}> = [
  {
    id: "renter",
    choice: { kind: "renter" },
    title: "Renter",
    caption:
      "I want to book and rent cars from hosts on the marketplace.",
    Icon: UserRound,
  },
  {
    id: "host-individual",
    choice: { kind: "host", hostKind: "INDIVIDUAL" },
    title: "Independent Car Owner",
    caption:
      "I own a car and want to rent it out myself. I'll handle pickups, drop-offs, and customer messages.",
    Icon: ShieldCheck,
  },
  {
    id: "host-fleet",
    choice: { kind: "host", hostKind: "FLEET" },
    title: "Registered Car Rental Operator",
    caption:
      "I run a rental company and want to manage cars on behalf of multiple owners. I have a registered business.",
    Icon: Building2,
  },
];

export function RegisterFlow() {
  const [choice, setChoice] = useState<Choice | null>(null);

  if (choice === null) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-on-surface-variant">
          What kind of account do you want to create?
        </p>
        {OPTIONS.map(({ id, choice: opt, title, caption, Icon }) => (
          <button
            className="group flex w-full items-start gap-4 rounded-2xl border border-border bg-surface-container-lowest p-4 text-left transition hover:border-primary hover:bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary"
            key={id}
            onClick={() => setChoice(opt)}
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

  if (choice.kind === "renter") {
    return (
      <SignupForm
        emailPlaceholder="traveler@drivexp.com"
        namePlaceholder="Jamie Cruz"
        onBack={() => setChoice(null)}
        role="customer"
        submitLabel="Create Renter Account"
      />
    );
  }

  return (
    <HostSignupForm kind={choice.hostKind} onBack={() => setChoice(null)} />
  );
}

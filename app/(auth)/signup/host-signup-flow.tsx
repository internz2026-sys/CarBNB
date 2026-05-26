"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupAction, type AuthState } from "@/app/(auth)/actions";
import { GoogleSignInButton } from "@/app/(auth)/google-sign-in-button";
import { cn } from "@/lib/utils";

// Tier 15 onboarding: hosts pick a kind (Independent vs Fleet) before seeing
// the signup form. The choice is locked at signup. Different kinds get
// slightly different forms — fleets need company name + business reg number
// alongside the contact person's details.
//
// The kind chooser used to live in this file as Step 1; the unified register
// page now does role+kind selection at the top level (Renter / Independent /
// Fleet), so this component only renders the form for an already-chosen kind.

export type HostKind = "INDIVIDUAL" | "FLEET";

export function HostSignupForm({
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
    <div className="space-y-4">
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

      <GoogleSignInButton intent="signup" kind={kind} role="host" />

      <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
        <span className="h-px flex-1 bg-border" />
        <span>or sign up with email</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="role" value="host" />
        <input type="hidden" name="kind" value={kind} />

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
              <Label htmlFor="signup-businessRegNumber">
                Business Registration Number
              </Label>
              <Input
                id="signup-businessRegNumber"
                name="businessRegNumber"
                placeholder="DTI / SEC / BIR registration number"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-serviceArea">Service Area</Label>
              <Input
                id="signup-serviceArea"
                name="serviceArea"
                placeholder="e.g. Makati · BGC · Metro Manila"
                required
              />
              <p className="text-xs text-on-surface-variant">
                Public — independent owners use this to pick a fleet near their
                car. Free-text city / area description. You can update this later
                from your profile.
              </p>
            </div>
          </>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="signup-fullName">
            {isFleet ? "Contact Person — Full Name" : "Full Name"}
          </Label>
          <Input
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

        <p className="text-center text-xs leading-5 text-on-surface-variant">
          By creating an account, you agree to DriveXP's{" "}
          <Link className="font-semibold text-primary hover:underline" href="/terms" target="_blank">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link className="font-semibold text-primary hover:underline" href="/privacy" target="_blank">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </div>
  );
}

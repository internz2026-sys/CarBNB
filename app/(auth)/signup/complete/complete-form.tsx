"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { completeProfileAction, type AuthState } from "@/app/(auth)/actions";

type Role = "host" | "customer";
type Kind = "INDIVIDUAL" | "FLEET";

export function CompleteProfileForm({
  role,
  kind,
  fullNameDefault,
}: {
  role: Role;
  kind: Kind;
  fullNameDefault: string;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    completeProfileAction,
    null,
  );

  const isFleet = role === "host" && kind === "FLEET";
  const submitLabel = isFleet
    ? "Create Fleet Account"
    : role === "host"
      ? "Create Host Account"
      : "Create Customer Account";
  const fullNameLabel = isFleet ? "Contact Person — Full Name" : "Full Name";

  return (
    <form action={formAction} className="space-y-4">
      <input name="role" type="hidden" value={role} />
      <input name="kind" type="hidden" value={kind} />

      <div
        className={cn(
          "rounded-md px-3 py-2 text-xs font-semibold",
          isFleet
            ? "bg-tertiary-fixed text-on-tertiary-fixed-variant"
            : "bg-primary/10 text-primary",
        )}
      >
        {isFleet
          ? "Registered Car Rental Operator"
          : role === "host"
            ? "Independent Car Owner"
            : "Customer Account"}
      </div>

      {isFleet ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="complete-companyName">Company Name</Label>
            <Input
              id="complete-companyName"
              name="companyName"
              placeholder="e.g. Acme Rentals Inc."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="complete-businessRegNumber">
              Business Registration Number
            </Label>
            <Input
              id="complete-businessRegNumber"
              name="businessRegNumber"
              placeholder="DTI / SEC / BIR registration number"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="complete-serviceArea">Service Area</Label>
            <Input
              id="complete-serviceArea"
              name="serviceArea"
              placeholder="e.g. Makati · BGC · Metro Manila"
              required
            />
            <p className="text-xs text-on-surface-variant">
              Public — independent owners use this to pick a fleet near their car.
              Free-text city / area description. You can update this later from
              your profile.
            </p>
          </div>
        </>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="complete-fullName">{fullNameLabel}</Label>
        <Input
          defaultValue={fullNameDefault}
          id="complete-fullName"
          name="fullName"
          placeholder={
            isFleet ? "e.g. Maria Santos" : role === "host" ? "e.g. Alex Rivera" : "e.g. Jamie Cruz"
          }
          required
        />
      </div>

      {state?.error ? (
        <div className="rounded-[1rem] bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <Button className="mt-2 w-full" disabled={pending} type="submit">
        {pending ? "Finalizing..." : submitLabel}
      </Button>
    </form>
  );
}

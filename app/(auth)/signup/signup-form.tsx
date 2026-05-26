"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupAction, type AuthState } from "@/app/(auth)/actions";
import { GoogleSignInButton } from "@/app/(auth)/google-sign-in-button";

type SignupRole = "host" | "customer";

// Renter (customer) signup form. Lives inside the RegisterFlow chooser, so it
// renders a "Change account type" back button alongside the form. Consent for
// the Terms + Privacy Policy is implicit — clicking either action (email
// submit or Google sign-up) accepts both, as is industry-standard practice
// for marketplace signup flows.
export function SignupForm({
  role,
  submitLabel,
  namePlaceholder,
  emailPlaceholder,
  onBack,
}: {
  role: SignupRole;
  submitLabel: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  onBack?: () => void;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signupAction,
    null,
  );

  return (
    <div className="space-y-4">
      {onBack ? (
        <button
          className="-ml-1 inline-flex items-center gap-1 rounded-md text-xs font-semibold text-on-surface-variant transition hover:text-primary"
          onClick={onBack}
          type="button"
        >
          <ChevronLeft className="size-3.5" />
          Change account type
        </button>
      ) : null}

      <GoogleSignInButton intent="signup" role={role} />

      <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
        <span className="h-px flex-1 bg-border" />
        <span>or sign up with email</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="role" value={role} />
        <div className="space-y-2">
          <Label htmlFor={`${role}-name`}>Full Name</Label>
          <Input
            id={`${role}-name`}
            name="fullName"
            placeholder={namePlaceholder}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${role}-email`}>Email</Label>
          <Input
            id={`${role}-email`}
            name="email"
            placeholder={emailPlaceholder}
            required
            type="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${role}-password`}>Password</Label>
          <Input
            id={`${role}-password`}
            name="password"
            required
            type="password"
            minLength={8}
          />
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

"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupAction, type AuthState } from "@/app/(auth)/actions";

type SignupRole = "host" | "customer";

export function SignupForm({
  role,
  submitLabel,
  namePlaceholder,
  emailPlaceholder,
}: {
  role: SignupRole;
  submitLabel: string;
  namePlaceholder: string;
  emailPlaceholder: string;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signupAction,
    null,
  );

  return (
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
    </form>
  );
}

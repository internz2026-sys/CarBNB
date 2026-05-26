"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type AuthState } from "@/app/(auth)/actions";
import { GoogleSignInButton } from "@/app/(auth)/google-sign-in-button";

// Unified login: one form for hosts, customers, and admins. Role is resolved
// from the database in `loginAction` (admin → /dashboard, owner →
// /host/dashboard, customer → /account), so the form carries no role hint.
// Google sign-in works the same way — the OAuth callback falls through to the
// DB-based router when no `role` query param is present.
export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    loginAction,
    null,
  );

  return (
    <div className="space-y-6 pt-6">
      <GoogleSignInButton intent="login" />

      <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
        <span className="h-px flex-1 bg-border" />
        <span>or sign in with email</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} className="space-y-6">
        {redirectTo ? <input name="redirectTo" type="hidden" value={redirectTo} /> : null}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              defaultValue={state?.email ?? ""}
              id="login-email"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input id="login-password" name="password" required type="password" />
          </div>
        </div>

        {state?.error ? (
          <div className="rounded-[1rem] bg-red-50 p-3 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        <Button className="w-full" disabled={pending} type="submit">
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
}

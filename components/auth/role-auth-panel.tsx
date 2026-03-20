"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserRound } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { loginWithEmailPassword } from "@/app/actions/auth";

export const roleContent = {
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

export type RoleKey = keyof typeof roleContent;

export function RoleAuthPanel({ role, redirectUrl }: { role: RoleKey; redirectUrl?: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const config = roleContent[role];
  const Icon = config.icon;

  const finalSignInHref = redirectUrl && role === "customer" ? redirectUrl : config.signInHref;
  const finalSignUpHref = redirectUrl && role === "customer"
    ? `/signup?callbackUrl=${encodeURIComponent(redirectUrl)}#${role}`
    : config.signUpHref;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      setError("Please enter both email and password.");
      setIsLoading(false);
      return;
    }

    const { error } = await loginWithEmailPassword(formData);

    if (error) {
      setError("Invalid login credentials.");
      setIsLoading(false);
      return;
    }

    // Set the legacy visual state so headers know which avatar to display
    document.cookie = `mock_role=${role}; path=/; max-age=86400`;
    router.push(finalSignInHref);
  };

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

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-error/10 p-3 text-sm font-medium text-error">
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor={config.emailId}>{config.emailLabel}</Label>
          <Input
            defaultValue={config.emailDefault}
            id={config.emailId}
            name="email"
            placeholder={config.emailPlaceholder}
            required
            type="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={config.passwordId}>Password</Label>
          <Input 
            defaultValue="password123" 
            id={config.passwordId} 
            name="password" 
            required 
            type="password" 
          />
        </div>

        <div className="space-y-3 pt-2">
          <button 
            type="submit" 
            className={cn(buttonVariants(), "w-full")}
            disabled={isLoading}
          >
            {isLoading ? "Authenticating..." : config.signInLabel}
          </button>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-outline-variant/30"></span>
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
              <span className="px-2 text-on-surface-variant backdrop-blur-sm bg-surface-container-lowest/80 text-muted-foreground">
                Or
              </span>
            </div>
          </div>
          
          <Link
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full border-border bg-surface-container-lowest text-primary hover:bg-surface-container"
            )}
            href={finalSignUpHref}
          >
            {config.signUpLabel}
          </Link>
        </div>
      </form>
    </div>
  );
}

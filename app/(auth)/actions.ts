"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/lib/db";
import { OwnerStatus } from "@/types";

export type AuthState = { error: string; email?: string } | null;

async function resolveRoleRedirect(email: string): Promise<string> {
  // Source of truth for role is the database, not auth metadata — auth
  // metadata can be spoofed by a client calling signUp directly with the
  // anon key. We check admin first, then host (Owner), then customer.
  const [admin, owner, customer] = await Promise.all([
    db.user.findUnique({ where: { email } }),
    db.owner.findUnique({ where: { email } }),
    db.customer.findUnique({ where: { email } }),
  ]);
  if (admin) return "/dashboard";
  if (owner) return "/host/dashboard";
  if (customer) return "/account";
  return "/";
}

// Only allow same-origin relative paths through. Rejects anything that
// could become an off-site redirect (absolute URLs, protocol-relative
// URLs, or back-navigation paths).
function sanitizeRedirectTo(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.startsWith("/login") || raw.startsWith("/signup")) return null;
  return raw;
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// Builds the absolute origin (protocol + host) for the current request so we
// can hand Supabase a same-origin `redirectTo`. Uses `x-forwarded-proto` when
// present (Vercel always sets it); falls back to http for localhost.
async function currentOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// Kicks off the Google OAuth flow. The `intent` (`login` | `signup`),
// `role` (`host` | `customer`), and optional `kind` (`INDIVIDUAL` | `FLEET`)
// flow through Google to `/auth/callback` so it can apply the right routing
// rules (tab-mismatch on login, role-collision on signup, completion form for
// brand-new users).
export async function signInWithGoogleAction(formData: FormData): Promise<void> {
  const intent = formData.get("intent");
  const role = formData.get("role");
  const kind = formData.get("kind");

  const callback = new URL("/auth/callback", await currentOrigin());
  if (typeof intent === "string") callback.searchParams.set("intent", intent);
  if (typeof role === "string") callback.searchParams.set("role", role);
  if (typeof kind === "string") callback.searchParams.set("kind", kind);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString() },
  });

  if (error || !data.url) {
    const target = intent === "signup" ? "/signup" : "/login";
    redirect(`${target}?error=oauth_failed`);
  }
  redirect(data.url);
}

export async function loginAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const selectedRole = formData.get("selectedRole");
  const redirectToRaw = formData.get("redirectTo");
  const redirectTo = sanitizeRedirectTo(
    typeof redirectToRaw === "string" ? redirectToRaw : null,
  );
  if (!email || !password) {
    return { error: "Email and password are required.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message, email };

  // Tab-mismatch validation: the login page has Host and Customer tabs. If
  // the user picked the wrong tab for their account, bail out cleanly.
  // Admins are excluded — they log in via whichever tab they happen to pick.
  if (selectedRole === "host" || selectedRole === "customer") {
    const [admin, owner, customer] = await Promise.all([
      db.user.findUnique({ where: { email } }),
      db.owner.findUnique({ where: { email } }),
      db.customer.findUnique({ where: { email } }),
    ]);
    if (!admin) {
      if (selectedRole === "host" && !owner) {
        await supabase.auth.signOut();
        return {
          error:
            "This email is registered as a customer account. Please use the Customer tab.",
          email,
        };
      }
      if (selectedRole === "customer" && !customer) {
        await supabase.auth.signOut();
        return {
          error:
            "This email is registered as a host account. Please use the Host tab.",
          email,
        };
      }
    }
  }

  // Explicit `redirectTo` wins (came from proxy.ts when the user was on a
  // guarded route); otherwise fall back to the default for their role.
  const destination = redirectTo ?? (await resolveRoleRedirect(email));
  redirect(destination);
}

type SignupRole = "host" | "customer";

export async function signupAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const role = formData.get("role") as SignupRole | null;
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  // Tier 15: hosts pick a kind (INDIVIDUAL | FLEET) before submitting. Locked
  // at signup. Customers don't pass a kind. Fleets get extra fields validated
  // and stored on the Owner row.
  const kindRaw = formData.get("kind");
  const kind = kindRaw === "FLEET" ? "FLEET" : "INDIVIDUAL";
  const companyName = String(formData.get("companyName") ?? "").trim();
  const businessRegNumber = String(formData.get("businessRegNumber") ?? "").trim();
  const serviceArea = String(formData.get("serviceArea") ?? "").trim();

  if (role !== "host" && role !== "customer") {
    return { error: "Invalid signup role." };
  }
  if (!fullName || !email || !password) {
    return { error: "All fields are required.", email };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters.", email };
  }
  if (role === "host" && kind === "FLEET") {
    if (!companyName || !businessRegNumber) {
      return {
        error: "Fleet operators must provide a company name and business registration number.",
        email,
      };
    }
    if (!serviceArea) {
      return {
        error: "Fleet operators must provide a service area so independent owners can find you.",
        email,
      };
    }
  }

  // Guard against collisions in our domain tables before hitting Supabase auth
  const [existingOwner, existingCustomer] = await Promise.all([
    db.owner.findUnique({ where: { email } }),
    db.customer.findUnique({ where: { email } }),
  ]);
  if (existingOwner || existingCustomer) {
    return { error: "An account with this email already exists.", email };
  }

  const supabase = await createClient();
  const { error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { fullName, signupRole: role, kind },
    },
  });
  if (authError) return { error: authError.message, email };

  if (role === "host") {
    await db.owner.create({
      data: {
        fullName,
        email,
        contactNumber: "",
        address: "",
        status: OwnerStatus.PENDING,
        kind,
        companyName: kind === "FLEET" ? companyName : null,
        businessRegNumber: kind === "FLEET" ? businessRegNumber : null,
        serviceArea: kind === "FLEET" ? serviceArea : null,
      },
    });
    redirect(
      kind === "FLEET" ? "/login?signedUp=fleet" : "/login?signedUp=host",
    );
  } else {
    await db.customer.create({
      data: {
        fullName,
        email,
        contactNumber: "",
      },
    });
    redirect("/login?signedUp=customer");
  }
}

// Completes the profile for a user who just signed up via Google OAuth. The
// Supabase session is already established (the OAuth callback exchanged the
// code) — this action only fills in the role-specific Owner/Customer row.
// Email comes from the authenticated session, never from the form, so a user
// can't claim a different identity.
export async function completeProfileAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const role = formData.get("role") as SignupRole | null;
  const fullName = String(formData.get("fullName") ?? "").trim();
  const kindRaw = formData.get("kind");
  const kind = kindRaw === "FLEET" ? "FLEET" : "INDIVIDUAL";
  const companyName = String(formData.get("companyName") ?? "").trim();
  const businessRegNumber = String(formData.get("businessRegNumber") ?? "").trim();
  const serviceArea = String(formData.get("serviceArea") ?? "").trim();

  if (role !== "host" && role !== "customer") {
    return { error: "Invalid signup role." };
  }
  if (!fullName) {
    return { error: "Full name is required." };
  }
  if (role === "host" && kind === "FLEET") {
    if (!companyName || !businessRegNumber) {
      return {
        error:
          "Fleet operators must provide a company name and business registration number.",
      };
    }
    if (!serviceArea) {
      return {
        error:
          "Fleet operators must provide a service area so independent owners can find you.",
      };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    redirect("/login");
  }
  const email = user.email.toLowerCase();

  // Re-check collisions server-side: the callback already routed away if a
  // record existed, but a race between two completion attempts on the same
  // tab would otherwise sneak through.
  const [existingOwner, existingCustomer] = await Promise.all([
    db.owner.findUnique({ where: { email } }),
    db.customer.findUnique({ where: { email } }),
  ]);
  if (existingOwner || existingCustomer) {
    return { error: "An account with this email already exists." };
  }

  if (role === "host") {
    await db.owner.create({
      data: {
        fullName,
        email,
        contactNumber: "",
        address: "",
        status: OwnerStatus.PENDING,
        kind,
        companyName: kind === "FLEET" ? companyName : null,
        businessRegNumber: kind === "FLEET" ? businessRegNumber : null,
        serviceArea: kind === "FLEET" ? serviceArea : null,
      },
    });
    redirect("/host/dashboard");
  } else {
    await db.customer.create({
      data: {
        fullName,
        email,
        contactNumber: "",
      },
    });
    redirect("/account");
  }
}

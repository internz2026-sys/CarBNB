"use server";

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

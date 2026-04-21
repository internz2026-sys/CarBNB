"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/lib/db";
import { OwnerStatus } from "@/types";

export type AuthState = { error: string } | null;

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
  if (owner) return "/"; // host dashboard not built yet — park at landing
  if (customer) return "/"; // customer account not built yet — park at landing
  return "/";
}

export async function loginAction(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  const destination = await resolveRoleRedirect(email);
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

  if (role !== "host" && role !== "customer") {
    return { error: "Invalid signup role." };
  }
  if (!fullName || !email || !password) {
    return { error: "All fields are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  // Guard against collisions in our domain tables before hitting Supabase auth
  const [existingOwner, existingCustomer] = await Promise.all([
    db.owner.findUnique({ where: { email } }),
    db.customer.findUnique({ where: { email } }),
  ]);
  if (existingOwner || existingCustomer) {
    return { error: "An account with this email already exists." };
  }

  const supabase = await createClient();
  const { error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { fullName, signupRole: role },
    },
  });
  if (authError) return { error: authError.message };

  if (role === "host") {
    await db.owner.create({
      data: {
        fullName,
        email,
        contactNumber: "",
        address: "",
        status: OwnerStatus.PENDING,
      },
    });
    redirect("/login?signedUp=host");
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

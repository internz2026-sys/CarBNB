import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/lib/db";

// OAuth callback for Supabase (Google sign-in flow). The provider redirects
// the user here with `?code=...` plus the `intent`/`role`/`kind` hints we
// originally appended to `redirectTo` in `signInWithGoogleAction`. We exchange
// the code for a session and route based on (a) what records already exist
// for the email and (b) the intent/role they came from.
//
// Wrong-tab on login mirrors the email/password tab-mismatch behavior in
// `loginAction`. Wrong-card on signup mirrors the email-collision behavior in
// `signupAction`. Implicit linking (same email across providers) is allowed —
// Supabase merges identities by default, and we just route to whatever
// Owner/Customer/User row already exists.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const { searchParams, origin } = url;
  const code = searchParams.get("code");
  const intent = searchParams.get("intent");
  const role = searchParams.get("role");
  const kind = searchParams.get("kind");
  const oauthError = searchParams.get("error_description") ?? searchParams.get("error");

  if (oauthError || !code) {
    const target = intent === "signup" ? "/signup" : "/login";
    return NextResponse.redirect(new URL(`${target}?error=oauth_failed`, origin));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user?.email) {
    const target = intent === "signup" ? "/signup" : "/login";
    return NextResponse.redirect(new URL(`${target}?error=oauth_failed`, origin));
  }

  const email = data.user.email.toLowerCase();
  const [admin, owner, customer] = await Promise.all([
    db.user.findUnique({ where: { email } }),
    db.owner.findUnique({ where: { email } }),
    db.customer.findUnique({ where: { email } }),
  ]);

  // Admin bypasses tab/role checks the same way it does in `loginAction`.
  if (admin) {
    return NextResponse.redirect(new URL("/dashboard", origin));
  }

  if (intent === "login") {
    if (role === "host") {
      if (owner) {
        return NextResponse.redirect(new URL("/host/dashboard", origin));
      }
      await supabase.auth.signOut();
      const code = customer ? "customer_exists" : "no_account";
      return NextResponse.redirect(new URL(`/login?error=${code}`, origin));
    }
    if (role === "customer") {
      if (customer) {
        return NextResponse.redirect(new URL("/account", origin));
      }
      await supabase.auth.signOut();
      const code = owner ? "host_exists" : "no_account";
      return NextResponse.redirect(new URL(`/login?error=${code}`, origin));
    }
    // No role hint on login — fall through to the generic post-auth router below.
  }

  if (intent === "signup") {
    if (owner || customer) {
      await supabase.auth.signOut();
      let errCode: string;
      if (role === "host" && customer) errCode = "customer_exists";
      else if (role === "customer" && owner) errCode = "host_exists";
      else errCode = "account_exists";
      return NextResponse.redirect(new URL(`/signup?error=${errCode}`, origin));
    }
    const completeUrl = new URL("/signup/complete", origin);
    if (role) completeUrl.searchParams.set("role", role);
    if (kind) completeUrl.searchParams.set("kind", kind);
    return NextResponse.redirect(completeUrl);
  }

  // Fallback — no intent (or unrecognized one). Route by whatever record exists.
  if (owner) return NextResponse.redirect(new URL("/host/dashboard", origin));
  if (customer) return NextResponse.redirect(new URL("/account", origin));
  return NextResponse.redirect(new URL("/signup", origin));
}

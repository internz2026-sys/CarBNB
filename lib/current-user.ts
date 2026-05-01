import "server-only";
import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";

export type Viewer =
  | { kind: "guest" }
  | { kind: "customer"; id: string; email: string; fullName: string }
  | { kind: "admin"; email: string; fullName: string | null }
  | { kind: "host"; id: string; email: string; fullName: string }
  | { kind: "authenticated-unknown"; email: string };

// Resolve the current viewer's role by looking them up in the DB — auth
// metadata can be spoofed, but DB rows are source of truth. Used by public
// server pages that want to tailor their header/CTAs to the viewer.
export async function getCurrentViewer(): Promise<Viewer> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { kind: "guest" };

  const [admin, owner, customer] = await Promise.all([
    db.user.findUnique({ where: { email: user.email } }),
    db.owner.findUnique({ where: { email: user.email } }),
    db.customer.findUnique({ where: { email: user.email } }),
  ]);

  if (admin) {
    return { kind: "admin", email: user.email, fullName: admin.name };
  }
  if (customer) {
    return {
      kind: "customer",
      id: customer.id,
      email: user.email,
      fullName: customer.fullName,
    };
  }
  if (owner) {
    return {
      kind: "host",
      id: owner.id,
      email: user.email,
      fullName: owner.fullName,
    };
  }
  return { kind: "authenticated-unknown", email: user.email };
}

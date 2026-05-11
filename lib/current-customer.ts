import "server-only";
import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { CustomerStatus } from "@/types";

type Customer = Awaited<ReturnType<typeof db.customer.findUnique>>;

// Tier 19 — mirrors lib/current-host.ts shape. Used by /account, the
// listing-detail booking CTA, and the booking creation gate to resolve the
// caller's customer state in a single helper. Status values are normalized
// to the CustomerStatus enum so callers can switch on a known set.
export type CustomerSession =
  | { kind: "anonymous" }
  | { kind: "not-customer"; email: string }
  | { kind: "pending"; email: string; customer: NonNullable<Customer> }
  | { kind: "rejected"; email: string; customer: NonNullable<Customer> }
  | { kind: "suspended"; email: string; customer: NonNullable<Customer> }
  | { kind: "verified"; email: string; customer: NonNullable<Customer> };

export async function getCurrentCustomer(): Promise<CustomerSession> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { kind: "anonymous" };

  const customer = await db.customer.findUnique({ where: { email: user.email } });
  if (!customer) return { kind: "not-customer", email: user.email };

  switch (customer.status) {
    case CustomerStatus.VERIFIED:
      return { kind: "verified", email: user.email, customer };
    case CustomerStatus.SUSPENDED:
      return { kind: "suspended", email: user.email, customer };
    case CustomerStatus.REJECTED:
      return { kind: "rejected", email: user.email, customer };
    default:
      // PENDING (canonical "Pending Verification") + the schema-default
      // "PENDING" string both fall through here. Either way, the customer
      // hasn't been admin-approved yet.
      return { kind: "pending", email: user.email, customer };
  }
}

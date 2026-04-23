import "server-only";
import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { OwnerStatus } from "@/types";

type Owner = Awaited<ReturnType<typeof db.owner.findUnique>>;

export type HostSession =
  | { kind: "anonymous" }
  | { kind: "not-host"; email: string }
  | { kind: "pending"; email: string; owner: NonNullable<Owner> }
  | { kind: "suspended"; email: string; owner: NonNullable<Owner> }
  | { kind: "verified"; email: string; owner: NonNullable<Owner> };

export async function getCurrentHost(): Promise<HostSession> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { kind: "anonymous" };

  const owner = await db.owner.findUnique({ where: { email: user.email } });
  if (!owner) return { kind: "not-host", email: user.email };

  if (owner.status === OwnerStatus.SUSPENDED) {
    return { kind: "suspended", email: user.email, owner };
  }
  if (owner.status === OwnerStatus.PENDING) {
    return { kind: "pending", email: user.email, owner };
  }
  return { kind: "verified", email: user.email, owner };
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { OwnerStatus } from "@/types";
import { getCurrentHost } from "@/lib/current-host";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BioForm } from "./bio-form";

export const dynamic = "force-dynamic";

export default async function HostProfilePage() {
  const session = await getCurrentHost();
  if (session.kind === "anonymous") redirect("/login?redirectTo=/host/profile");
  if (session.kind === "not-host") redirect("/");

  // Always fetch the latest row so the form pre-fills with whatever was
  // last saved (the session helper caches a snapshot).
  const owner = await db.owner.findUnique({
    where: { id: session.owner.id },
    select: { id: true, fullName: true, status: true, bio: true },
  });
  if (!owner) redirect("/");

  const isVerified = owner.status === OwnerStatus.VERIFIED;

  return (
    <div className="max-w-3xl mx-auto pb-10 space-y-6">
      <div>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
          Profile
        </h1>
        <p className="mt-2 text-base text-on-surface-variant">
          What renters see on your public host page.
        </p>
      </div>

      {isVerified ? (
        <div className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-800">
          Your profile is live at{" "}
          <Link
            className="inline-flex items-center gap-1 font-semibold underline"
            href={`/hosts/${owner.id}`}
            target="_blank"
          >
            /hosts/{owner.id}
            <ExternalLink className="size-3" />
          </Link>
          .
        </div>
      ) : (
        <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-800">
          Your public profile goes live once an admin verifies your host account. You can
          fill out your bio in the meantime.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Name
            </p>
            <p className="font-medium text-on-surface">{owner.fullName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Status
            </p>
            <p className="font-medium text-on-surface">{owner.status}</p>
          </div>
        </CardContent>
      </Card>

      <BioForm initialBio={owner.bio ?? ""} />
    </div>
  );
}

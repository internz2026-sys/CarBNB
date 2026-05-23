import { redirect } from "next/navigation";
import { MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentHost } from "@/lib/current-host";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OnboardingLocationForm } from "./onboarding-location-form";

export const dynamic = "force-dynamic";

// Tier 22 — required onboarding gate (FLEET map pin only). The proxy bounces
// any FLEET host with an unset latitude/longitude here before they can reach
// the rest of /host/*. This page is the one /host route the gate exempts, so
// it must self-guard against everyone the gate would never send:
//   - individual hosts (nothing to pin)
//   - fleets that already dropped a pin (onboarding done)
//   - suspended hosts (the gate skips them; they belong on the locked screen)
export default async function HostOnboardingPage() {
  const session = await getCurrentHost();
  if (session.kind === "anonymous") {
    redirect("/login?redirectTo=/host/onboarding");
  }
  if (session.kind === "not-host") redirect("/");
  if (session.kind === "suspended") redirect("/host/dashboard");

  // Re-read the row directly — the session helper caches a snapshot, and we
  // need the freshest latitude/longitude to decide if onboarding is done.
  const owner = await db.owner.findUnique({
    where: { id: session.owner.id },
    select: { kind: true, latitude: true, longitude: true },
  });
  if (!owner) redirect("/");
  if (owner.kind !== "FLEET") redirect("/host/dashboard");
  if (owner.latitude != null && owner.longitude != null) {
    redirect("/host/dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Finish setting up
        </p>
        <h1 className="mt-1 font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
          Set your fleet location
        </h1>
        <p className="mt-2 text-base text-on-surface-variant">
          Drop a pin where your fleet primarily operates. Independent owners
          looking for a fleet to manage their car discover you on a map of
          verified fleets — so this is required before you can use your
          dashboard.
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="size-5" />
            Map Location
          </CardTitle>
          <CardDescription>
            Click anywhere on the map to drop your pin, then drag it to
            fine-tune. You can change this any time from your profile later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingLocationForm />
        </CardContent>
      </Card>
    </div>
  );
}

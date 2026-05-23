"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { MapPin, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  updateFleetLocationAction,
  type HostProfileActionState,
} from "@/app/actions/host-profile";

// Leaflet expects `window` — must load only on the client. SSR would crash.
const LocationPickerMap = dynamic(
  () =>
    import("@/components/map/location-picker-map").then(
      (m) => m.LocationPickerMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[24rem] w-full place-items-center rounded-xl border border-border bg-surface-container-low">
        <p className="text-sm text-on-surface-variant">Loading map…</p>
      </div>
    ),
  },
);

// Tier 22 — required onboarding location step for FLEET hosts. Reuses the
// existing Tier 21 `updateFleetLocationAction`; the only behavioural
// difference vs. the /host/profile section is that a successful save advances
// the host to their dashboard (the proxy gate stops firing once the pin is
// set). Kept separate from FleetLocationSection so the profile editor's
// "stay on page + Saved." behaviour is untouched.
export function OnboardingLocationForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    HostProfileActionState,
    FormData
  >(updateFleetLocationAction, null);

  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);

  const error = state && "error" in state ? state.error : null;
  const saved = Boolean(state && "saved" in state && state.saved);

  // On a successful save, leave onboarding for the dashboard. `replace` keeps
  // the onboarding step out of history so Back doesn't bounce off the gate.
  useEffect(() => {
    if (saved) router.replace("/host/dashboard");
  }, [saved, router]);

  return (
    <div className="space-y-4">
      <LocationPickerMap onChange={(lat, lng) => setPin({ lat, lng })} />

      <form
        action={formAction}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        {pin ? (
          <>
            <input name="latitude" type="hidden" value={pin.lat} />
            <input name="longitude" type="hidden" value={pin.lng} />
          </>
        ) : null}
        <div className="min-w-0 flex-1">
          {error ? (
            <p className="text-xs text-red-600">{error}</p>
          ) : saved ? (
            <p className="text-xs font-medium text-emerald-700">
              Saved. Taking you to your dashboard…
            </p>
          ) : pin ? (
            <p className="text-xs text-on-surface-variant">
              Pin at {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}.
            </p>
          ) : (
            <p className="text-xs text-on-surface-variant">
              Click anywhere on the map to drop your pin.
            </p>
          )}
        </div>
        <Button disabled={pending || !pin || saved} size="sm" type="submit">
          {pin ? <Save className="mr-2 size-4" /> : <MapPin className="mr-2 size-4" />}
          {pending ? "Saving…" : "Save & continue"}
        </Button>
      </form>
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

// Tier 21 — kind-gated location section on /host/profile. Server parent
// renders this only when owner.kind === "FLEET". The map is client-side
// because Leaflet requires the browser DOM; the form state and action
// dispatch live here.
export function FleetLocationSection({
  initialLatitude,
  initialLongitude,
}: {
  initialLatitude: number | null;
  initialLongitude: number | null;
}) {
  const [state, formAction, pending] = useActionState<
    HostProfileActionState,
    FormData
  >(updateFleetLocationAction, null);

  // Mirror the map's chosen pin so we can submit it through hidden inputs.
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    initialLatitude != null && initialLongitude != null
      ? { lat: initialLatitude, lng: initialLongitude }
      : null,
  );

  const isUnset = initialLatitude == null || initialLongitude == null;
  const error = state && "error" in state ? state.error : null;
  const justSaved = state && "saved" in state && state.saved;

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="size-5" />
          Map Location
        </CardTitle>
        <CardDescription>
          Drop a pin where your business primarily operates. Independent
          hosts looking for a fleet to manage their car will see you on a
          map of verified fleets.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isUnset ? (
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-semibold">Your fleet doesn&apos;t have a map location yet.</p>
            <p className="mt-1 text-xs">
              Drop a pin below so you appear on the public fleet map and on
              independent hosts&apos; fleet-picker.
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            <p className="font-semibold">Your location is set.</p>
            <p className="mt-1 text-xs">
              Drag the pin or click somewhere new to update where your fleet
              appears on the map.
            </p>
          </div>
        )}

        <LocationPickerMap
          initialLatitude={initialLatitude}
          initialLongitude={initialLongitude}
          onChange={(lat, lng) => setPin({ lat, lng })}
        />

        <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {pin ? (
            <>
              <input name="latitude" type="hidden" value={pin.lat} />
              <input name="longitude" type="hidden" value={pin.lng} />
            </>
          ) : null}
          <div className="min-w-0 flex-1">
            {error ? (
              <p className="text-xs text-red-600">{error}</p>
            ) : justSaved ? (
              <p className="text-xs font-medium text-emerald-700">Saved.</p>
            ) : pin ? (
              <p className="text-xs text-on-surface-variant">
                Pin at {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)}.
              </p>
            ) : null}
          </div>
          <Button
            disabled={pending || !pin}
            size="sm"
            type="submit"
          >
            <Save className="mr-2 size-4" />
            {pending ? "Saving…" : isUnset ? "Save location" : "Update location"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

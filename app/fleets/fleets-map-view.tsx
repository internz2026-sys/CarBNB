"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, MapPin } from "lucide-react";
import dynamic from "next/dynamic";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Tier 21 — read-only map of verified fleets on the public /fleets page.
// Wraps the shared FleetPickerMap so the directory and the host
// fleet-link picker reuse the same component. Click a pin → highlight
// + show a card with View profile CTA.

const FleetPickerMap = dynamic(
  () =>
    import("@/components/map/fleet-picker-map").then((m) => m.FleetPickerMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[24rem] w-full place-items-center rounded-xl border border-border bg-surface-container-low">
        <p className="text-sm text-on-surface-variant">Loading map…</p>
      </div>
    ),
  },
);

type MappedFleet = {
  id: string;
  displayName: string;
  bio: string | null;
  serviceArea: string | null;
  carsCount: number;
  latitude: number;
  longitude: number;
};

export function FleetsMapView({ fleets }: { fleets: MappedFleet[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = fleets.find((f) => f.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <FleetPickerMap
        fleets={fleets.map((f) => ({
          id: f.id,
          fullName: f.displayName,
          companyName: f.displayName,
          serviceArea: f.serviceArea,
          bio: f.bio,
          avgRating: null,
          reviewCount: 0,
          carsCount: f.carsCount,
          latitude: f.latitude,
          longitude: f.longitude,
        }))}
        onSelect={setSelectedId}
        selectedFleetId={selectedId}
      />

      {selected ? (
        <div className="rounded-xl bg-surface-container-lowest p-5 shadow-[0_8px_24px_rgb(19_27_46_/_0.04)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                <Building2 className="size-3" />
                Verified operator
              </div>
              <h3 className="mt-1 truncate font-headline text-lg font-bold text-on-surface">
                {selected.displayName}
              </h3>
              {selected.serviceArea ? (
                <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  <MapPin className="size-3" />
                  {selected.serviceArea}
                </p>
              ) : null}
              {selected.bio ? (
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-on-surface-variant">
                  {selected.bio}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-on-surface-variant">
                {selected.carsCount}{" "}
                {selected.carsCount === 1 ? "car" : "cars"} managed
              </p>
            </div>
            <Link
              className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
              href={`/hosts/${selected.id}`}
            >
              View profile →
            </Link>
          </div>
        </div>
      ) : fleets.length > 0 ? (
        <p className="text-center text-xs text-on-surface-variant">
          Click a pin to see fleet details.
        </p>
      ) : null}
    </div>
  );
}

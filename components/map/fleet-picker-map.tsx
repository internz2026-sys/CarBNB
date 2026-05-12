"use client";

import "leaflet/dist/leaflet.css";
import { useState } from "react";
import { MapContainer, Marker, TileLayer, Tooltip } from "react-leaflet";
import L from "leaflet";
import { averageCenter, DEFAULT_MAP_ZOOM } from "@/lib/geo";

// Tier 21 — read-only map showing verified fleet operators as pins. Used
// on /host/cars/[id]/edit (fleet picker) and the public /fleets directory.
// The picker variant gets a "Link to this fleet" CTA inside the selection
// card; the directory variant only shows "View profile". Both variants
// share this map component — the parent renders whichever CTAs make sense.

export type FleetPin = {
  id: string;
  fullName: string;
  companyName: string | null;
  serviceArea: string | null;
  bio: string | null;
  avgRating: number | null;
  reviewCount: number;
  carsCount: number;
  latitude: number;
  longitude: number;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Tier 21 — divIcon that bundles the pin + an always-visible name label
// to the right. No PNG assets to wrangle; the iconAnchor keeps the pin's
// bottom-left tip at the geographic point even though the icon's overall
// width varies with the label length.
function buildPinIcon(name: string, highlighted: boolean): L.DivIcon {
  const pinSize = highlighted ? 28 : 22;
  const pinGradient = highlighted
    ? "linear-gradient(135deg, #0052cc 0%, #4a8cff 100%)"
    : "linear-gradient(135deg, #131b2e 0%, #3f4865 100%)";
  const labelBg = highlighted ? "#0052cc" : "rgba(255,255,255,0.95)";
  const labelColor = highlighted ? "#ffffff" : "#131b2e";
  const safeName = escapeHtml(name);
  return L.divIcon({
    className: "drivexp-fleet-pin",
    html: `<div style="
      display: flex;
      align-items: flex-end;
      gap: 6px;
      pointer-events: none;
    ">
      <div style="
        width: ${pinSize}px;
        height: ${pinSize}px;
        border-radius: 9999px 9999px 9999px 0;
        background: ${pinGradient};
        border: 2px solid white;
        box-shadow: 0 6px 14px rgba(0, 82, 204, ${highlighted ? "0.55" : "0.3"});
        transform: rotate(-45deg);
        flex-shrink: 0;
        pointer-events: auto;
        cursor: pointer;
      "></div>
      <div style="
        background: ${labelBg};
        padding: 2px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        color: ${labelColor};
        box-shadow: 0 2px 8px rgba(19, 27, 46, 0.12);
        white-space: nowrap;
        max-width: 12rem;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 4px;
        pointer-events: auto;
        cursor: pointer;
      ">${safeName}</div>
    </div>`,
    // iconSize is only used by Leaflet for positioning math; CSS controls
    // visual rendering. A wide-enough box prevents clipping.
    iconSize: [240, pinSize + 12],
    iconAnchor: [pinSize / 2, pinSize],
  });
}

export function FleetPickerMap({
  fleets,
  selectedFleetId,
  onSelect,
}: {
  fleets: FleetPin[];
  selectedFleetId: string | null;
  onSelect: (fleetId: string | null) => void;
}) {
  const [center] = useState(() =>
    averageCenter(
      fleets.map((f) => ({ latitude: f.latitude, longitude: f.longitude })),
    ),
  );

  return (
    <div className="relative h-[24rem] w-full overflow-hidden rounded-xl border border-border">
      <MapContainer
        center={[center.latitude, center.longitude]}
        className="size-full"
        scrollWheelZoom={true}
        zoom={DEFAULT_MAP_ZOOM}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {fleets.map((fleet) => {
          const displayName =
            fleet.companyName ?? fleet.fullName;
          const isSelected = fleet.id === selectedFleetId;
          return (
            <Marker
              eventHandlers={{
                click: () => onSelect(fleet.id),
              }}
              icon={buildPinIcon(displayName, isSelected)}
              key={fleet.id}
              position={[fleet.latitude, fleet.longitude]}
            >
              {/* Hover tooltip — opens on mouseover above the pin. Click
                  still propagates to onSelect, which highlights the pin
                  + populates the parent's info card. */}
              <Tooltip
                className="!bg-surface-container-lowest !text-on-surface !rounded-lg !border-0 !shadow-[0_8px_24px_rgb(19_27_46_/_0.18)]"
                direction="top"
                offset={[0, -22]}
                opacity={1}
              >
                <div className="space-y-1 px-1 py-0.5">
                  <p className="text-sm font-bold leading-tight">
                    {displayName}
                  </p>
                  {fleet.serviceArea ? (
                    <p className="text-[11px] font-semibold text-primary">
                      📍 {fleet.serviceArea}
                    </p>
                  ) : null}
                  <p className="text-[11px] text-on-surface-variant">
                    {fleet.carsCount}{" "}
                    {fleet.carsCount === 1 ? "car" : "cars"} managed
                  </p>
                  {fleet.bio ? (
                    <p className="line-clamp-2 max-w-[18rem] text-[11px] text-on-surface-variant">
                      {fleet.bio}
                    </p>
                  ) : null}
                  <p className="pt-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    Click to select
                  </p>
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
      {fleets.length === 0 ? (
        <div className="pointer-events-none absolute inset-x-4 top-4 z-[400] rounded-lg bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-900 shadow-[0_4px_16px_rgb(19_27_46_/_0.12)]">
          No verified fleets have set a location yet
        </div>
      ) : null}
    </div>
  );
}

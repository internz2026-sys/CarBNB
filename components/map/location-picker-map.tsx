"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { METRO_MANILA_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/geo";

// Tier 21 — single-pin map for fleet hosts to set their primary location
// at signup or from /host/profile. Drop a pin (click anywhere on the map)
// or drag the existing pin. The chosen lat/lng is reported up via the
// onChange callback; the parent form (or controlled-input wrapper) decides
// what to do with it.

// Custom marker — Leaflet's default marker requires shipping three PNG
// assets and configuring asset paths, which fights Turbopack. A divIcon
// (HTML/CSS-based) gives us a clean, dependency-free marker.
const pinIcon = L.divIcon({
  className: "drivexp-location-pin",
  html: `<div style="
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 9999px 9999px 9999px 0;
    background: linear-gradient(135deg, #0052cc 0%, #4a8cff 100%);
    border: 2px solid white;
    box-shadow: 0 6px 14px rgba(0, 82, 204, 0.35);
    transform: rotate(-45deg);
  "></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

// Internal child to handle map events — Leaflet hooks must be inside a
// MapContainer.
function MapClickHandler({
  onPick,
}: {
  onPick: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Recenters the map when the parent provides new initial coords (e.g.
// "Reset to Metro Manila center" button or initial load with existing
// pin).
function MapRecenter({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom());
  }, [latitude, longitude, map]);
  return null;
}

export function LocationPickerMap({
  initialLatitude,
  initialLongitude,
  onChange,
}: {
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  onChange: (latitude: number, longitude: number) => void;
}) {
  const startLat = initialLatitude ?? METRO_MANILA_CENTER.latitude;
  const startLng = initialLongitude ?? METRO_MANILA_CENTER.longitude;

  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    initialLatitude != null && initialLongitude != null
      ? { lat: initialLatitude, lng: initialLongitude }
      : null,
  );

  const handlePick = (lat: number, lng: number) => {
    setPin({ lat, lng });
    onChange(lat, lng);
  };

  const center = useMemo<[number, number]>(
    () => [startLat, startLng],
    [startLat, startLng],
  );

  return (
    <div className="relative h-[24rem] w-full overflow-hidden rounded-xl border border-border">
      <MapContainer
        center={center}
        className="size-full"
        scrollWheelZoom={true}
        zoom={DEFAULT_MAP_ZOOM}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onPick={handlePick} />
        {pin ? (
          <Marker
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const { lat, lng } = e.target.getLatLng();
                handlePick(lat, lng);
              },
            }}
            icon={pinIcon}
            position={[pin.lat, pin.lng]}
          />
        ) : null}
        {initialLatitude != null && initialLongitude != null ? (
          <MapRecenter
            latitude={initialLatitude}
            longitude={initialLongitude}
          />
        ) : null}
      </MapContainer>
      {!pin ? (
        <div className="pointer-events-none absolute inset-x-4 top-4 z-[400] rounded-lg bg-surface-container-lowest px-3 py-2 text-center text-xs font-semibold text-on-surface shadow-[0_4px_16px_rgb(19_27_46_/_0.12)]">
          Click anywhere on the map to set your location
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-x-4 top-4 z-[400] rounded-lg bg-surface-container-lowest px-3 py-2 text-center text-xs font-semibold text-on-surface shadow-[0_4px_16px_rgb(19_27_46_/_0.12)]">
          {pin.lat.toFixed(5)}, {pin.lng.toFixed(5)} · drag the pin to adjust
        </div>
      )}
    </div>
  );
}

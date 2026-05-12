// Tier 21 — geographic helpers. Currently only used as the source of
// the Metro Manila default center for our maps. Haversine distance is
// included for a future tier that adds "X km away" labels next to fleet
// names (Tier 21 V1 deliberately skips distance computation).

export const METRO_MANILA_CENTER = {
  latitude: 14.5995,
  longitude: 120.9842,
} as const;

export const DEFAULT_MAP_ZOOM = 11; // shows all of Metro Manila

const EARTH_RADIUS_KM = 6371;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Haversine distance in kilometers between two lat/lng points. Future
// proofing — not surfaced in any UI in Tier 21 V1.
export function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRadians(a.latitude)) *
      Math.cos(toRadians(b.latitude)) *
      sinDLng *
      sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_KM * c;
}

// Compute an average center from a list of lat/lng points. Used by the
// fleet-picker map to center the view on the cluster of verified fleets
// rather than a hardcoded coordinate. Returns the Metro Manila default
// when the list is empty.
export function averageCenter(
  points: { latitude: number | null; longitude: number | null }[],
): { latitude: number; longitude: number } {
  const valid = points.filter(
    (p): p is { latitude: number; longitude: number } =>
      typeof p.latitude === "number" && typeof p.longitude === "number",
  );
  if (valid.length === 0) {
    return { ...METRO_MANILA_CENTER };
  }
  const sum = valid.reduce(
    (acc, p) => ({
      latitude: acc.latitude + p.latitude,
      longitude: acc.longitude + p.longitude,
    }),
    { latitude: 0, longitude: 0 },
  );
  return {
    latitude: sum.latitude / valid.length,
    longitude: sum.longitude / valid.length,
  };
}

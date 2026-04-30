// Shared source of truth for vehicle type + features.
// Stored slugs are uppercase-enum style (matching transmission/fuelType
// conventions); labels are display-only. Importable from both server
// actions and client components since this file has no runtime side
// effects.

export const VEHICLE_TYPES = [
  { slug: "SEDAN", label: "Sedan" },
  { slug: "SUV", label: "SUV" },
  { slug: "HATCHBACK", label: "Hatchback" },
  { slug: "MPV", label: "MPV" },
  { slug: "VAN", label: "Van" },
  { slug: "PICKUP", label: "Pickup" },
  { slug: "COUPE", label: "Coupe" },
] as const;

export const VEHICLE_TYPE_SLUGS = VEHICLE_TYPES.map((t) => t.slug) as [
  string,
  ...string[],
];

export function vehicleTypeLabel(slug: string | null | undefined): string {
  if (!slug) return "—";
  return VEHICLE_TYPES.find((t) => t.slug === slug)?.label ?? slug;
}

export const VEHICLE_FEATURES = [
  { slug: "AIR_CONDITIONING", label: "Air conditioning" },
  { slug: "BLUETOOTH", label: "Bluetooth" },
  { slug: "USB_PORTS", label: "USB ports" },
  { slug: "BACKUP_CAMERA", label: "Backup camera" },
  { slug: "GPS", label: "GPS" },
  { slug: "DASHCAM", label: "Dashcam" },
  { slug: "CHILD_SEAT", label: "Child seat" },
  { slug: "SUNROOF", label: "Sunroof" },
  { slug: "CRUISE_CONTROL", label: "Cruise control" },
  { slug: "APPLE_CARPLAY", label: "Apple CarPlay" },
  { slug: "ANDROID_AUTO", label: "Android Auto" },
  { slug: "KEYLESS_ENTRY", label: "Keyless entry" },
  { slug: "AUTO_WIPERS", label: "Auto wipers" },
] as const;

export const VEHICLE_FEATURE_SLUGS = VEHICLE_FEATURES.map((f) => f.slug) as [
  string,
  ...string[],
];

export function vehicleFeatureLabel(slug: string): string {
  return VEHICLE_FEATURES.find((f) => f.slug === slug)?.label ?? slug;
}

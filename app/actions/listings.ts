"use server";

import { randomUUID } from "crypto";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { DayOfWeek, ListingStatus } from "@/types";
import {
  VEHICLE_TYPE_SLUGS,
  VEHICLE_FEATURE_SLUGS,
} from "@/lib/listing-taxonomy";

const CAR_PHOTOS_BUCKET = "car-photos";
const CAR_DOCUMENTS_BUCKET = "car-documents";
const MAX_PHOTOS_PER_LISTING = 8;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_DOC_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_DOC_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export type ListingActionState =
  | {
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
    }
  | null;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    throw new Error("Not authenticated");
  }
  const admin = await db.user.findUnique({ where: { email: user.email } });
  if (!admin) {
    throw new Error("Not authorized");
  }
  return admin;
}

function fileExtension(file: File): string {
  if (file.name.includes(".")) {
    return file.name.split(".").pop()!.toLowerCase();
  }
  if (file.type === "application/pdf") return "pdf";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

// ─────────────────────────────────────────────────────────────────────────
// Create listing — minimal details only. Photos, OR/CR, availability are
// added on the edit page after create. Mirrors owner flow: create → detail.
// ─────────────────────────────────────────────────────────────────────────

const CreateListingSchema = z.object({
  ownerId: z.string().trim().min(1, "Owner is required"),
  plateNumber: z
    .string()
    .trim()
    .min(1, "Plate number is required")
    .transform((v) => v.toUpperCase()),
  brand: z.string().trim().min(1, "Brand is required"),
  model: z.string().trim().min(1, "Model is required"),
  year: z.coerce.number().int().min(1980, "Year must be 1980 or later").max(2030, "Year must be 2030 or earlier"),
  color: z.string().trim().min(1, "Color is required"),
  transmission: z.enum(["Automatic", "Manual"]),
  fuelType: z.enum(["Gasoline", "Diesel", "Electric", "Hybrid"]),
  vehicleType: z.enum(VEHICLE_TYPE_SLUGS),
  features: z.array(z.enum(VEHICLE_FEATURE_SLUGS)).default([]),
  seatingCapacity: z.coerce.number().int().min(2, "Minimum 2 seats").max(15, "Maximum 15 seats"),
  location: z.string().trim().min(1, "Location is required"),
  dailyPrice: z.coerce.number().positive("Daily price must be positive"),
  description: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export async function createListingAction(
  _prev: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  const admin = await requireAdmin();

  const parsed = CreateListingSchema.safeParse({
    ownerId: formData.get("ownerId"),
    plateNumber: formData.get("plateNumber"),
    brand: formData.get("brand"),
    model: formData.get("model"),
    year: formData.get("year"),
    color: formData.get("color"),
    transmission: formData.get("transmission"),
    fuelType: formData.get("fuelType"),
    vehicleType: formData.get("vehicleType"),
    features: formData.getAll("features"),
    seatingCapacity: formData.get("seatingCapacity"),
    location: formData.get("location"),
    dailyPrice: formData.get("dailyPrice"),
    description: formData.get("description"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  const owner = await db.owner.findUnique({ where: { id: data.ownerId } });
  if (!owner) {
    return { error: "Selected owner was not found." };
  }

  const duplicate = await db.carListing.findUnique({
    where: { plateNumber: data.plateNumber },
  });
  if (duplicate) {
    return { error: `A listing with plate "${data.plateNumber}" already exists.` };
  }

  const listing = await db.carListing.create({
    data: {
      ownerId: data.ownerId,
      plateNumber: data.plateNumber,
      brand: data.brand,
      model: data.model,
      year: data.year,
      color: data.color,
      transmission: data.transmission,
      fuelType: data.fuelType,
      vehicleType: data.vehicleType,
      features: data.features,
      seatingCapacity: data.seatingCapacity,
      location: data.location,
      dailyPrice: data.dailyPrice,
      description: data.description || null,
      notes: data.notes || null,
      photos: [],
      status: ListingStatus.PENDING_APPROVAL,
    },
  });

  // Keep Owner.carsCount consistent — it's read on the owners list page.
  await db.owner.update({
    where: { id: owner.id },
    data: { carsCount: { increment: 1 } },
  });

  await db.activityLogEntry.create({
    data: {
      action: "LISTING_CREATED",
      description: `Admin ${admin.email} created listing ${listing.brand} ${listing.model} (${listing.plateNumber}) for owner ${owner.fullName}`,
      type: "car",
    },
  });

  revalidatePath("/car-listings");
  revalidatePath(`/owners/${owner.id}`);
  redirect(`/car-listings/${listing.id}/edit`);
}

// ─────────────────────────────────────────────────────────────────────────
// Status transitions — approve / suspend / reactivate
// ─────────────────────────────────────────────────────────────────────────

async function updateListingStatus(
  formData: FormData,
  targetStatus: ListingStatus,
  allowedFrom: ListingStatus[],
  verb: string,
): Promise<ListingActionState> {
  const admin = await requireAdmin();

  const id = String(formData.get("listingId") ?? "").trim();
  if (!id) {
    return { error: "Missing listing id." };
  }

  const listing = await db.carListing.findUnique({ where: { id } });
  if (!listing) {
    return { error: "Listing not found." };
  }
  if (!(allowedFrom as string[]).includes(listing.status)) {
    return {
      error: `Cannot ${verb} a listing whose current status is "${listing.status}".`,
    };
  }

  await db.carListing.update({
    where: { id },
    data: { status: targetStatus },
  });

  await db.activityLogEntry.create({
    data: {
      action: `LISTING_${verb.toUpperCase()}`,
      description: `Admin ${admin.email} ${verb}d listing ${listing.brand} ${listing.model} (${listing.plateNumber}): ${listing.status} → ${targetStatus}`,
      type: "car",
    },
  });

  revalidatePath("/car-listings");
  revalidatePath(`/car-listings/${id}`);
  revalidatePath("/dashboard");
  return null;
}

export async function approveListingAction(
  _prev: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  return updateListingStatus(
    formData,
    ListingStatus.ACTIVE,
    [ListingStatus.PENDING_APPROVAL, ListingStatus.SUSPENDED, ListingStatus.REJECTED],
    "approve",
  );
}

export async function suspendListingAction(
  _prev: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  return updateListingStatus(
    formData,
    ListingStatus.SUSPENDED,
    [ListingStatus.ACTIVE, ListingStatus.PENDING_APPROVAL, ListingStatus.BOOKED],
    "suspend",
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Edit listing details — plate number and owner are intentionally read-only
// after create to prevent DB drift + activity-log muddling.
// ─────────────────────────────────────────────────────────────────────────

const UpdateListingSchema = z.object({
  brand: z.string().trim().min(1, "Brand is required"),
  model: z.string().trim().min(1, "Model is required"),
  year: z.coerce.number().int().min(1980).max(2030),
  color: z.string().trim().min(1, "Color is required"),
  transmission: z.enum(["Automatic", "Manual"]),
  fuelType: z.enum(["Gasoline", "Diesel", "Electric", "Hybrid"]),
  vehicleType: z.enum(VEHICLE_TYPE_SLUGS),
  features: z.array(z.enum(VEHICLE_FEATURE_SLUGS)).default([]),
  seatingCapacity: z.coerce.number().int().min(2).max(15),
  location: z.string().trim().min(1, "Location is required"),
  dailyPrice: z.coerce.number().positive(),
  description: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

export async function updateListingAction(
  _prev: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  const admin = await requireAdmin();

  const id = String(formData.get("listingId") ?? "").trim();
  if (!id) return { error: "Missing listing id." };

  const existing = await db.carListing.findUnique({ where: { id } });
  if (!existing) return { error: "Listing not found." };

  const parsed = UpdateListingSchema.safeParse({
    brand: formData.get("brand"),
    model: formData.get("model"),
    year: formData.get("year"),
    color: formData.get("color"),
    transmission: formData.get("transmission"),
    fuelType: formData.get("fuelType"),
    vehicleType: formData.get("vehicleType"),
    features: formData.getAll("features"),
    seatingCapacity: formData.get("seatingCapacity"),
    location: formData.get("location"),
    dailyPrice: formData.get("dailyPrice"),
    description: formData.get("description"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const changes: string[] = [];
  for (const key of Object.keys(data) as (keyof typeof data)[]) {
    const before = (existing as Record<string, unknown>)[key] ?? "";
    const after = data[key] ?? "";
    if (String(before) !== String(after)) changes.push(key);
  }

  await db.carListing.update({
    where: { id },
    data: {
      brand: data.brand,
      model: data.model,
      year: data.year,
      color: data.color,
      transmission: data.transmission,
      fuelType: data.fuelType,
      vehicleType: data.vehicleType,
      features: data.features,
      seatingCapacity: data.seatingCapacity,
      location: data.location,
      dailyPrice: data.dailyPrice,
      description: data.description || null,
      notes: data.notes || null,
    },
  });

  if (changes.length > 0) {
    await db.activityLogEntry.create({
      data: {
        action: "LISTING_UPDATED",
        description: `Admin ${admin.email} updated listing ${existing.brand} ${existing.model} (${existing.plateNumber}). Fields changed: ${changes.join(", ")}`,
        type: "car",
      },
    });
  }

  revalidatePath("/car-listings");
  revalidatePath(`/car-listings/${id}`);
  revalidatePath(`/car-listings/${id}/edit`);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────
// Photos — multi-file gallery in `car-photos` (public bucket).
// photos[] on CarListing stores Storage paths in display order. photos[0]
// is treated as the primary/cover photo.
// ─────────────────────────────────────────────────────────────────────────

export async function addListingPhotoAction(
  _prev: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  const admin = await requireAdmin();

  const listingId = String(formData.get("listingId") ?? "").trim();
  const file = formData.get("file");

  if (!listingId) return { error: "Missing listing id." };
  if (!(file instanceof File) || file.name === "") {
    return { error: "Please choose a photo to upload." };
  }
  if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
    return { error: "Only JPG, PNG, or WebP photos are allowed." };
  }
  if (file.size === 0) return { error: "Photo file is empty." };
  if (file.size > MAX_PHOTO_BYTES) return { error: "Photo is too large (5 MB max)." };

  const listing = await db.carListing.findUnique({ where: { id: listingId } });
  if (!listing) return { error: "Listing not found." };
  if (listing.photos.length >= MAX_PHOTOS_PER_LISTING) {
    return { error: `Maximum of ${MAX_PHOTOS_PER_LISTING} photos per listing.` };
  }

  const objectPath = `${listingId}/${randomUUID().slice(0, 8)}.${fileExtension(file)}`;

  const supabase = createAdminClient();
  const { error: uploadError } = await supabase.storage
    .from(CAR_PHOTOS_BUCKET)
    .upload(objectPath, file, { upsert: false, contentType: file.type });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  await db.carListing.update({
    where: { id: listingId },
    data: { photos: [...listing.photos, objectPath] },
  });

  await db.activityLogEntry.create({
    data: {
      action: "LISTING_PHOTO_ADDED",
      description: `Admin ${admin.email} added a photo to listing ${listing.brand} ${listing.model} (${listing.plateNumber})`,
      type: "car",
    },
  });

  revalidatePath(`/car-listings/${listingId}`);
  revalidatePath(`/car-listings/${listingId}/edit`);
  return null;
}

export async function removeListingPhotoAction(
  _prev: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  const admin = await requireAdmin();

  const listingId = String(formData.get("listingId") ?? "").trim();
  const path = String(formData.get("path") ?? "").trim();
  if (!listingId || !path) return { error: "Missing listing id or photo path." };

  const listing = await db.carListing.findUnique({ where: { id: listingId } });
  if (!listing) return { error: "Listing not found." };
  if (!listing.photos.includes(path)) {
    return { error: "That photo does not belong to this listing." };
  }

  const supabase = createAdminClient();
  await supabase.storage.from(CAR_PHOTOS_BUCKET).remove([path]).catch(() => {});

  await db.carListing.update({
    where: { id: listingId },
    data: { photos: listing.photos.filter((p) => p !== path) },
  });

  await db.activityLogEntry.create({
    data: {
      action: "LISTING_PHOTO_REMOVED",
      description: `Admin ${admin.email} removed a photo from listing ${listing.brand} ${listing.model} (${listing.plateNumber})`,
      type: "car",
    },
  });

  revalidatePath(`/car-listings/${listingId}`);
  revalidatePath(`/car-listings/${listingId}/edit`);
  return null;
}

export async function setPrimaryPhotoAction(
  _prev: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  await requireAdmin();

  const listingId = String(formData.get("listingId") ?? "").trim();
  const path = String(formData.get("path") ?? "").trim();
  if (!listingId || !path) return { error: "Missing listing id or photo path." };

  const listing = await db.carListing.findUnique({ where: { id: listingId } });
  if (!listing) return { error: "Listing not found." };
  if (!listing.photos.includes(path)) {
    return { error: "That photo does not belong to this listing." };
  }

  const reordered = [path, ...listing.photos.filter((p) => p !== path)];
  await db.carListing.update({
    where: { id: listingId },
    data: { photos: reordered },
  });

  revalidatePath(`/car-listings/${listingId}`);
  revalidatePath(`/car-listings/${listingId}/edit`);
  return null;
}

export async function movePhotoAction(
  _prev: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  await requireAdmin();

  const listingId = String(formData.get("listingId") ?? "").trim();
  const path = String(formData.get("path") ?? "").trim();
  const direction = String(formData.get("direction") ?? "").trim();
  if (!listingId || !path || (direction !== "up" && direction !== "down")) {
    return { error: "Invalid reorder request." };
  }

  const listing = await db.carListing.findUnique({ where: { id: listingId } });
  if (!listing) return { error: "Listing not found." };

  const idx = listing.photos.indexOf(path);
  if (idx < 0) return { error: "That photo does not belong to this listing." };

  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= listing.photos.length) return null;

  const reordered = [...listing.photos];
  [reordered[idx], reordered[swapWith]] = [reordered[swapWith], reordered[idx]];

  await db.carListing.update({
    where: { id: listingId },
    data: { photos: reordered },
  });

  revalidatePath(`/car-listings/${listingId}`);
  revalidatePath(`/car-listings/${listingId}/edit`);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────
// OR/CR document — private bucket, same pattern as owner documents.
// ─────────────────────────────────────────────────────────────────────────

export async function uploadOrCrDocumentAction(
  _prev: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  const admin = await requireAdmin();

  const listingId = String(formData.get("listingId") ?? "").trim();
  const file = formData.get("file");

  if (!listingId) return { error: "Missing listing id." };
  if (!(file instanceof File) || file.name === "") {
    return { error: "Please choose a file to upload." };
  }
  if (!ALLOWED_DOC_TYPES.has(file.type)) {
    return { error: "Only JPG, PNG, WebP, or PDF are allowed." };
  }
  if (file.size === 0) return { error: "File is empty." };
  if (file.size > MAX_DOC_BYTES) return { error: "File is too large (5 MB max)." };

  const listing = await db.carListing.findUnique({ where: { id: listingId } });
  if (!listing) return { error: "Listing not found." };

  const objectPath = `${listingId}/or-cr.${fileExtension(file)}`;

  const supabase = createAdminClient();
  const { error: uploadError } = await supabase.storage
    .from(CAR_DOCUMENTS_BUCKET)
    .upload(objectPath, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  await db.carListing.update({
    where: { id: listingId },
    data: { orCrDocumentUrl: objectPath },
  });

  await db.activityLogEntry.create({
    data: {
      action: "LISTING_OR_CR_UPLOADED",
      description: `Admin ${admin.email} uploaded OR/CR for listing ${listing.brand} ${listing.model} (${listing.plateNumber})`,
      type: "car",
    },
  });

  revalidatePath(`/car-listings/${listingId}`);
  revalidatePath(`/car-listings/${listingId}/edit`);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────
// Availability rules — 7 rows (one per day of week). Idempotent upsert.
// ─────────────────────────────────────────────────────────────────────────

const TIME_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const ALL_DAYS: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

export async function saveAvailabilityRulesAction(
  _prev: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  const admin = await requireAdmin();

  const listingId = String(formData.get("listingId") ?? "").trim();
  if (!listingId) return { error: "Missing listing id." };

  const listing = await db.carListing.findUnique({ where: { id: listingId } });
  if (!listing) return { error: "Listing not found." };

  type RuleInput = {
    dayOfWeek: DayOfWeek;
    isAvailable: boolean;
    startTime: string | null;
    endTime: string | null;
  };

  const inputs: RuleInput[] = [];
  for (const day of ALL_DAYS) {
    const isAvailable = formData.get(`rule-${day}-available`) === "on";
    const startRaw = String(formData.get(`rule-${day}-start`) ?? "").trim();
    const endRaw = String(formData.get(`rule-${day}-end`) ?? "").trim();

    if (isAvailable) {
      if (!TIME_REGEX.test(startRaw) || !TIME_REGEX.test(endRaw)) {
        return { error: `${day}: please enter start and end times in HH:MM.` };
      }
      if (startRaw >= endRaw) {
        return { error: `${day}: end time must be after start time.` };
      }
    }

    inputs.push({
      dayOfWeek: day,
      isAvailable,
      startTime: isAvailable ? startRaw : null,
      endTime: isAvailable ? endRaw : null,
    });
  }

  const existingRules = await db.carAvailabilityRule.findMany({
    where: { carListingId: listingId },
  });
  const byDay = new Map(existingRules.map((r) => [r.dayOfWeek, r]));

  for (const input of inputs) {
    const existing = byDay.get(input.dayOfWeek);
    if (existing) {
      await db.carAvailabilityRule.update({
        where: { id: existing.id },
        data: {
          isAvailable: input.isAvailable,
          startTime: input.startTime,
          endTime: input.endTime,
        },
      });
    } else {
      await db.carAvailabilityRule.create({
        data: {
          carListingId: listingId,
          dayOfWeek: input.dayOfWeek,
          isAvailable: input.isAvailable,
          startTime: input.startTime,
          endTime: input.endTime,
        },
      });
    }
  }

  // Refresh the cached summary on the CarListing so list views can show it
  // without a separate join.
  const activeDays = inputs.filter((i) => i.isAvailable);
  let summary: string | null;
  if (activeDays.length === 0) {
    summary = "No recurring schedule";
  } else if (activeDays.length === 7) {
    summary = `Daily ${activeDays[0].startTime}-${activeDays[0].endTime}`;
  } else if (
    activeDays.length === 5 &&
    activeDays.every((d) =>
      [
        DayOfWeek.MONDAY,
        DayOfWeek.TUESDAY,
        DayOfWeek.WEDNESDAY,
        DayOfWeek.THURSDAY,
        DayOfWeek.FRIDAY,
      ].includes(d.dayOfWeek),
    )
  ) {
    summary = `Mon-Fri ${activeDays[0].startTime}-${activeDays[0].endTime}`;
  } else {
    summary = `${activeDays.length} days / week`;
  }
  await db.carListing.update({
    where: { id: listingId },
    data: { availabilitySummary: summary },
  });

  await db.activityLogEntry.create({
    data: {
      action: "LISTING_AVAILABILITY_UPDATED",
      description: `Admin ${admin.email} updated weekly availability for listing ${listing.brand} ${listing.model} (${listing.plateNumber})`,
      type: "car",
    },
  });

  revalidatePath(`/car-listings/${listingId}`);
  revalidatePath(`/car-listings/${listingId}/edit`);
  revalidatePath("/availability");
  return null;
}

// ─────────────────────────────────────────────────────────────────────────
// Availability exceptions — blackout or one-off available dates.
// ─────────────────────────────────────────────────────────────────────────

const ExceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  isAvailable: z.enum(["yes", "no"]),
  reason: z.string().trim().max(200).optional().or(z.literal("")),
});

export async function addAvailabilityExceptionAction(
  _prev: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  const admin = await requireAdmin();

  const listingId = String(formData.get("listingId") ?? "").trim();
  if (!listingId) return { error: "Missing listing id." };

  const listing = await db.carListing.findUnique({ where: { id: listingId } });
  if (!listing) return { error: "Listing not found." };

  const parsed = ExceptionSchema.safeParse({
    date: formData.get("date"),
    isAvailable: formData.get("isAvailable"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const dateValue = new Date(`${parsed.data.date}T00:00:00.000Z`);
  const existing = await db.carAvailabilityException.findFirst({
    where: { carListingId: listingId, date: dateValue },
  });
  if (existing) {
    return { error: "An exception already exists for that date. Delete it first if you want to replace it." };
  }

  await db.carAvailabilityException.create({
    data: {
      carListingId: listingId,
      date: dateValue,
      isAvailable: parsed.data.isAvailable === "yes",
      reason: parsed.data.reason || null,
    },
  });

  await db.activityLogEntry.create({
    data: {
      action: "LISTING_EXCEPTION_ADDED",
      description: `Admin ${admin.email} added ${parsed.data.isAvailable === "yes" ? "available" : "blocked"} exception on ${parsed.data.date} for listing ${listing.brand} ${listing.model}`,
      type: "car",
    },
  });

  revalidatePath(`/car-listings/${listingId}`);
  revalidatePath(`/car-listings/${listingId}/edit`);
  revalidatePath("/availability");
  return null;
}

export async function deleteAvailabilityExceptionAction(
  _prev: ListingActionState,
  formData: FormData,
): Promise<ListingActionState> {
  const admin = await requireAdmin();

  const exceptionId = String(formData.get("exceptionId") ?? "").trim();
  if (!exceptionId) return { error: "Missing exception id." };

  const existing = await db.carAvailabilityException.findUnique({
    where: { id: exceptionId },
    include: { carListing: true },
  });
  if (!existing) return { error: "Exception not found." };

  await db.carAvailabilityException.delete({ where: { id: exceptionId } });

  await db.activityLogEntry.create({
    data: {
      action: "LISTING_EXCEPTION_REMOVED",
      description: `Admin ${admin.email} removed exception on ${existing.date.toISOString().slice(0, 10)} for listing ${existing.carListing.brand} ${existing.carListing.model}`,
      type: "car",
    },
  });

  revalidatePath(`/car-listings/${existing.carListingId}`);
  revalidatePath(`/car-listings/${existing.carListingId}/edit`);
  revalidatePath("/availability");
  return null;
}

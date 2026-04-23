"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { BookingStatus, ListingStatus, PaymentStatus } from "@/types";
import { checkAvailability } from "@/lib/availability";
import { calculateBookingAmount } from "@/lib/platform-settings";
import { getPlatformSettings } from "@/lib/platform-settings-server";
import { generateBookingReference } from "@/lib/booking-ref";
import { CANCELLATION_REASONS, CANCELLATION_SLUGS } from "@/lib/cancellation-reasons";

export type AdminBookingActionState =
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

// ─────────────────────────────────────────────────────────────────────────
// Status transitions — confirm, start, complete
// ─────────────────────────────────────────────────────────────────────────

async function transitionStatus(
  formData: FormData,
  targetStatus: BookingStatus,
  allowedFrom: BookingStatus[],
  verb: string,
  extraData: Record<string, unknown> = {},
): Promise<AdminBookingActionState> {
  const admin = await requireAdmin();

  const id = String(formData.get("bookingId") ?? "").trim();
  if (!id) return { error: "Missing booking id." };

  const booking = await db.booking.findUnique({ where: { id } });
  if (!booking) return { error: "Booking not found." };
  if (!(allowedFrom as string[]).includes(booking.status)) {
    return {
      error: `Cannot ${verb} a booking whose current status is "${booking.status}".`,
    };
  }

  await db.booking.update({
    where: { id },
    data: { status: targetStatus, ...extraData },
  });

  await db.activityLogEntry.create({
    data: {
      action: `BOOKING_${verb.toUpperCase()}`,
      description: `Admin ${admin.email} ${verb}d booking ${booking.referenceNumber} for ${booking.carName}: ${booking.status} → ${targetStatus}`,
      type: "booking",
    },
  });

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${id}`);
  revalidatePath("/account");
  revalidatePath(`/account/bookings/${id}`);
  return null;
}

export async function confirmBookingAction(
  _prev: AdminBookingActionState,
  formData: FormData,
): Promise<AdminBookingActionState> {
  return transitionStatus(
    formData,
    BookingStatus.CONFIRMED,
    [BookingStatus.PENDING],
    "confirm",
  );
}

export async function startRentalAction(
  _prev: AdminBookingActionState,
  formData: FormData,
): Promise<AdminBookingActionState> {
  return transitionStatus(
    formData,
    BookingStatus.ONGOING,
    [BookingStatus.CONFIRMED],
    "start",
    { rentalStartedAt: new Date() },
  );
}

export async function completeRentalAction(
  _prev: AdminBookingActionState,
  formData: FormData,
): Promise<AdminBookingActionState> {
  return transitionStatus(
    formData,
    BookingStatus.COMPLETED,
    [BookingStatus.ONGOING],
    "complete",
    { rentalCompletedAt: new Date() },
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Cancel / reject — require preset reason; note required when reason=other
// ─────────────────────────────────────────────────────────────────────────

const CancellationSchema = z
  .object({
    reason: z.enum(CANCELLATION_SLUGS),
    note: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .refine(
    (data) => data.reason !== "other" || (data.note && data.note.length > 0),
    {
      message: "Please describe the reason when choosing Other.",
      path: ["note"],
    },
  );

async function cancelOrReject(
  formData: FormData,
  targetStatus: BookingStatus,
  allowedFrom: BookingStatus[],
  verb: "cancel" | "reject",
): Promise<AdminBookingActionState> {
  const admin = await requireAdmin();

  const id = String(formData.get("bookingId") ?? "").trim();
  if (!id) return { error: "Missing booking id." };

  const parsed = CancellationSchema.safeParse({
    reason: formData.get("reason"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const booking = await db.booking.findUnique({ where: { id } });
  if (!booking) return { error: "Booking not found." };
  if (!(allowedFrom as string[]).includes(booking.status)) {
    return {
      error: `Cannot ${verb} a booking whose current status is "${booking.status}".`,
    };
  }

  await db.booking.update({
    where: { id },
    data: {
      status: targetStatus,
      cancellationReason: parsed.data.reason,
      cancellationNote: parsed.data.note || null,
      cancelledAt: new Date(),
      cancelledBy: admin.email,
    },
  });

  const reasonLabel =
    CANCELLATION_REASONS.find((r) => r.slug === parsed.data.reason)?.label ??
    parsed.data.reason;
  await db.activityLogEntry.create({
    data: {
      action: verb === "cancel" ? "BOOKING_CANCELLED_BY_ADMIN" : "BOOKING_REJECTED",
      description: `Admin ${admin.email} ${verb === "cancel" ? "cancelled" : "rejected"} booking ${booking.referenceNumber} for ${booking.carName}. Reason: ${reasonLabel}${parsed.data.note ? ` — ${parsed.data.note}` : ""}`,
      type: "booking",
    },
  });

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${id}`);
  revalidatePath("/account");
  revalidatePath(`/account/bookings/${id}`);
  return null;
}

export async function cancelBookingAdminAction(
  _prev: AdminBookingActionState,
  formData: FormData,
): Promise<AdminBookingActionState> {
  return cancelOrReject(
    formData,
    BookingStatus.CANCELLED,
    [
      BookingStatus.PENDING,
      BookingStatus.CONFIRMED,
      BookingStatus.ONGOING,
    ],
    "cancel",
  );
}

export async function rejectBookingAction(
  _prev: AdminBookingActionState,
  formData: FormData,
): Promise<AdminBookingActionState> {
  return cancelOrReject(
    formData,
    BookingStatus.REJECTED,
    [BookingStatus.PENDING],
    "reject",
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Mark paid — cash-only for now. Method is hardcoded; admin only sees the
// notes field.
// ─────────────────────────────────────────────────────────────────────────

const MarkPaidSchema = z.object({
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function markBookingPaidAction(
  _prev: AdminBookingActionState,
  formData: FormData,
): Promise<AdminBookingActionState> {
  const admin = await requireAdmin();

  const id = String(formData.get("bookingId") ?? "").trim();
  if (!id) return { error: "Missing booking id." };

  const parsed = MarkPaidSchema.safeParse({ notes: formData.get("notes") });
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const booking = await db.booking.findUnique({ where: { id } });
  if (!booking) return { error: "Booking not found." };
  if (booking.paymentStatus === PaymentStatus.PAID) {
    return { error: "This booking is already marked as paid." };
  }
  const payableStatuses: string[] = [
    BookingStatus.CONFIRMED,
    BookingStatus.ONGOING,
    BookingStatus.COMPLETED,
  ];
  if (!payableStatuses.includes(booking.status)) {
    return {
      error: `Cannot record payment while booking is "${booking.status}".`,
    };
  }

  await db.booking.update({
    where: { id },
    data: {
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: "CASH",
      paymentReceivedAt: new Date(),
      paymentReceivedBy: admin.email,
      paymentNotes: parsed.data.notes || null,
    },
  });

  await db.activityLogEntry.create({
    data: {
      action: "BOOKING_MARKED_PAID",
      description: `Admin ${admin.email} marked booking ${booking.referenceNumber} as PAID (cash)${parsed.data.notes ? ` — ${parsed.data.notes}` : ""}`,
      type: "booking",
    },
  });

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${id}`);
  revalidatePath("/account");
  revalidatePath(`/account/bookings/${id}`);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────
// Admin creates a booking on behalf of a customer. Skips PENDING — admin is
// the decision-maker. Availability still enforced.
// ─────────────────────────────────────────────────────────────────────────

const AdminCreateBookingSchema = z.object({
  customerId: z.string().trim().min(1, "Customer is required"),
  listingId: z.string().trim().min(1, "Listing is required"),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid pickup date"),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid return date"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function createAdminBookingAction(
  _prev: AdminBookingActionState,
  formData: FormData,
): Promise<AdminBookingActionState> {
  const admin = await requireAdmin();

  const parsed = AdminCreateBookingSchema.safeParse({
    customerId: formData.get("customerId"),
    listingId: formData.get("listingId"),
    pickupDate: formData.get("pickupDate"),
    returnDate: formData.get("returnDate"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const pickup = new Date(`${parsed.data.pickupDate}T00:00:00.000Z`);
  const returnDate = new Date(`${parsed.data.returnDate}T00:00:00.000Z`);
  if (returnDate < pickup) {
    return { error: "Return date must be on or after pickup date." };
  }

  const [customer, listing] = await Promise.all([
    db.customer.findUnique({ where: { id: parsed.data.customerId } }),
    db.carListing.findUnique({
      where: { id: parsed.data.listingId },
      include: {
        owner: { select: { id: true, fullName: true } },
        availabilityRules: true,
        exceptions: true,
        bookings: {
          where: {
            status: {
              in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.ONGOING],
            },
          },
          select: { pickupDate: true, returnDate: true, status: true },
        },
      },
    }),
  ]);

  if (!customer) return { error: "Selected customer was not found." };
  if (!listing) return { error: "Selected listing was not found." };
  if (listing.status !== ListingStatus.ACTIVE) {
    return { error: "Only ACTIVE listings can be booked." };
  }

  const availability = checkAvailability({
    pickup,
    returnDate,
    rules: listing.availabilityRules,
    exceptions: listing.exceptions,
    existingBookings: listing.bookings,
  });
  if (!availability.ok) return { error: availability.reason };

  const settings = await getPlatformSettings();
  const { totalAmount, platformFee, ownerPayout } = calculateBookingAmount(
    listing.dailyPrice,
    pickup,
    returnDate,
    settings.commissionRate,
  );
  const referenceNumber = await generateBookingReference();

  const booking = await db.booking.create({
    data: {
      referenceNumber,
      customerId: customer.id,
      customerName: customer.fullName,
      carListingId: listing.id,
      carName: `${listing.brand} ${listing.model}`,
      carPhoto: listing.photos[0] ?? null,
      plateNumber: listing.plateNumber,
      seatingCapacity: listing.seatingCapacity,
      ownerId: listing.owner.id,
      ownerName: listing.owner.fullName,
      pickupDate: pickup,
      returnDate,
      totalAmount,
      platformFee,
      ownerPayout,
      status: BookingStatus.CONFIRMED, // admin-created: skip PENDING
      paymentStatus: PaymentStatus.UNPAID,
      paymentNotes: parsed.data.notes || null,
    },
  });

  await db.customer.update({
    where: { id: customer.id },
    data: { totalBookings: { increment: 1 } },
  });

  await db.activityLogEntry.create({
    data: {
      action: "BOOKING_CREATED_BY_ADMIN",
      description: `Admin ${admin.email} created booking ${referenceNumber} for customer ${customer.fullName} on ${listing.brand} ${listing.model} (${listing.plateNumber}), ${parsed.data.pickupDate} → ${parsed.data.returnDate}. Auto-confirmed.`,
      type: "booking",
    },
  });

  revalidatePath("/bookings");
  revalidatePath("/account");
  redirect(`/bookings/${booking.id}`);
}

"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { BookingStatus, CustomerStatus, ListingStatus, PaymentStatus } from "@/types";
import { notify, notifyMany } from "@/lib/notify";
import { NotificationType } from "@/lib/notification-types";
import { format } from "date-fns";
import { checkAvailability } from "@/lib/availability";
import { calculateBookingAmount } from "@/lib/platform-settings";
import { getPlatformSettings } from "@/lib/platform-settings-server";
import { generateBookingReference } from "@/lib/booking-ref";

export type BookingActionState =
  | {
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
    }
  | null;

async function requireCustomer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    throw new Error("Not authenticated");
  }
  const customer = await db.customer.findUnique({ where: { email: user.email } });
  if (!customer) {
    // Account exists in auth but not in Customer table — possibly an admin
    // or owner trying to book. Block for now.
    throw new Error("This account is not set up as a customer account.");
  }
  return customer;
}

const CreateBookingSchema = z.object({
  listingId: z.string().trim().min(1, "Listing is required"),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid pickup date"),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid return date"),
});

export async function createBookingAction(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  let customer: Awaited<ReturnType<typeof requireCustomer>>;
  try {
    customer = await requireCustomer();
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Authentication required.",
    };
  }

  // Tier 19 — server-side verification gate. The booking-cta hides the
  // Reserve UI for unverified customers, but the action is the source of
  // truth in case someone bypasses the UI (stale tab, direct API call).
  if (customer.status !== CustomerStatus.VERIFIED) {
    return {
      error:
        "You must verify your identity before booking. Please upload your ID and driver's license at /account/verification.",
    };
  }

  const parsed = CreateBookingSchema.safeParse({
    listingId: formData.get("listingId"),
    pickupDate: formData.get("pickupDate"),
    returnDate: formData.get("returnDate"),
  });
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const pickup = new Date(`${parsed.data.pickupDate}T00:00:00.000Z`);
  const returnDate = new Date(`${parsed.data.returnDate}T00:00:00.000Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (pickup < today) {
    return { error: "Pickup date must be today or later." };
  }

  const listing = await db.carListing.findUnique({
    where: { id: parsed.data.listingId },
    include: {
      owner: { select: { id: true, fullName: true } },
      availabilityRules: true,
      exceptions: true,
      bookings: {
        where: { status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.ONGOING] } },
        select: { pickupDate: true, returnDate: true, status: true },
      },
    },
  });
  if (!listing) return { error: "Listing not found." };
  if (listing.status !== ListingStatus.ACTIVE) {
    return { error: "This listing is not currently available for booking." };
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

  // Tier 19 cross-cutting decision #5 — when the
  // `autoApproveVerifiedCustomers` setting is on, a verified customer's
  // booking skips the host's per-booking approval step and goes straight
  // to CONFIRMED. The customer is already known good; the host doesn't
  // need to re-vet them per trip. The setting can be toggled off in
  // /settings without code changes if admin wants stricter behavior.
  const initialStatus = settings.autoApproveVerifiedCustomers
    ? BookingStatus.CONFIRMED
    : BookingStatus.PENDING;

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
      status: initialStatus,
      paymentStatus: PaymentStatus.UNPAID,
    },
  });

  await db.customer.update({
    where: { id: customer.id },
    data: { totalBookings: { increment: 1 } },
  });

  await db.activityLogEntry.create({
    data: {
      action: "BOOKING_CREATED",
      description: `Customer ${customer.fullName} (${customer.email}) booked ${listing.brand} ${listing.model} (${listing.plateNumber}) for ${parsed.data.pickupDate} → ${parsed.data.returnDate}. Ref ${referenceNumber}.`,
      type: "booking",
    },
  });

  // Tier 20 — fan-out notifications to the host + all admins. Host copy
  // adapts to the booking's initial status (Tier 19 decision #5 — verified
  // customers' bookings auto-confirm when the platform setting is on).
  const carLabel = `${listing.brand} ${listing.model}`;
  const dateRange = `${format(pickup, "MMM d")} → ${format(returnDate, "MMM d, yyyy")}`;
  const [hostOwner, admins] = await Promise.all([
    db.owner.findUnique({
      where: { id: listing.owner.id },
      select: { email: true, fullName: true },
    }),
    db.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true, name: true },
    }),
  ]);
  const recipients: Parameters<typeof notifyMany>[0] = [];
  if (hostOwner) {
    recipients.push({
      recipientEmail: hostOwner.email,
      recipientRole: "host",
      recipientName: hostOwner.fullName,
      type: NotificationType.BOOKING_CREATED,
      title: `New booking on ${carLabel}`,
      body:
        initialStatus === BookingStatus.CONFIRMED
          ? `${customer.fullName} booked your ${carLabel} for ${dateRange}. This booking is confirmed and on your schedule.`
          : `${customer.fullName} booked your ${carLabel} for ${dateRange}. Open the booking to confirm or reject.`,
      linkUrl: `/host/bookings/${booking.id}`,
      linkLabel: "View booking",
    });
  }
  for (const adminUser of admins) {
    recipients.push({
      recipientEmail: adminUser.email,
      recipientRole: "admin",
      recipientName: adminUser.name ?? undefined,
      type: NotificationType.BOOKING_CREATED,
      title: `New booking · ${carLabel}`,
      body: `${customer.fullName} booked ${carLabel} (${listing.plateNumber}) from ${hostOwner?.fullName ?? "host"} for ${dateRange}. Ref ${referenceNumber}.`,
      linkUrl: `/bookings/${booking.id}`,
      linkLabel: "Open booking",
    });
  }
  await notifyMany(recipients);

  revalidatePath("/account");
  revalidatePath(`/listings/${listing.id}`);
  revalidatePath("/bookings");
  redirect(`/account/bookings/${booking.id}`);
}

export async function cancelBookingAction(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  let customer: Awaited<ReturnType<typeof requireCustomer>>;
  try {
    customer = await requireCustomer();
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Authentication required.",
    };
  }

  const bookingId = String(formData.get("bookingId") ?? "").trim();
  if (!bookingId) return { error: "Missing booking id." };

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
  });
  if (!booking) return { error: "Booking not found." };
  if (booking.customerId !== customer.id) {
    // Guard against users trying to cancel someone else's booking.
    return { error: "Booking not found." };
  }
  if (booking.status !== BookingStatus.PENDING) {
    return {
      error: `Only pending bookings can be cancelled by the customer. Contact admin to cancel this ${booking.status.toLowerCase()} booking.`,
    };
  }

  await db.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.CANCELLED },
  });

  await db.activityLogEntry.create({
    data: {
      action: "BOOKING_CANCELLED_BY_CUSTOMER",
      description: `Customer ${customer.fullName} (${customer.email}) cancelled booking ${booking.referenceNumber} for ${booking.carName}`,
      type: "booking",
    },
  });

  // Tier 20 — notify the host that the customer cancelled.
  const cancelledHost = await db.owner.findUnique({
    where: { id: booking.ownerId },
    select: { email: true, fullName: true },
  });
  if (cancelledHost) {
    await notify({
      recipientEmail: cancelledHost.email,
      recipientRole: "host",
      recipientName: cancelledHost.fullName,
      type: NotificationType.BOOKING_CANCELLED,
      title: `Booking cancelled · ${booking.carName}`,
      body: `${customer.fullName} cancelled their booking on the ${booking.carName} for ${format(booking.pickupDate, "MMM d")} → ${format(booking.returnDate, "MMM d, yyyy")}.`,
      linkUrl: `/host/bookings/${bookingId}`,
      linkLabel: "View booking",
    });
  }

  revalidatePath("/account");
  revalidatePath(`/account/bookings/${bookingId}`);
  revalidatePath("/bookings");
  return null;
}

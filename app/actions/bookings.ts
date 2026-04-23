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
      status: BookingStatus.PENDING,
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

  revalidatePath("/account");
  revalidatePath(`/account/bookings/${bookingId}`);
  revalidatePath("/bookings");
  return null;
}

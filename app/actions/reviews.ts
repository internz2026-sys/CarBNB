"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { BookingStatus } from "@/types";

export type ReviewActionState =
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
    throw new Error("This account is not set up as a customer account.");
  }
  return customer;
}

const CreateReviewSchema = z.object({
  bookingId: z.string().trim().min(1, "Missing booking id"),
  rating: z.coerce
    .number()
    .int("Rating must be a whole number")
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
  comment: z
    .string()
    .trim()
    .max(1000, "Comment must be 1000 characters or fewer")
    .optional()
    .or(z.literal("")),
});

export async function createReviewAction(
  _prev: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  let customer: Awaited<ReturnType<typeof requireCustomer>>;
  try {
    customer = await requireCustomer();
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Authentication required.",
    };
  }

  const parsed = CreateReviewSchema.safeParse({
    bookingId: formData.get("bookingId"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { bookingId, rating, comment } = parsed.data;

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      customerId: true,
      ownerId: true,
      carListingId: true,
      status: true,
      review: { select: { id: true } },
    },
  });
  if (!booking) {
    return { error: "Booking not found." };
  }
  if (booking.customerId !== customer.id) {
    return { error: "You can only review your own bookings." };
  }
  if (booking.status !== BookingStatus.COMPLETED) {
    return { error: "Only completed bookings can be reviewed." };
  }
  if (booking.review) {
    return { error: "You've already reviewed this booking." };
  }

  // Insert review + recompute denormalized aggregates on CarListing in one
  // transaction. Recompute (vs incremental update) keeps the avgRating
  // exact — incremental floats can drift over time.
  await db.$transaction(async (tx) => {
    await tx.review.create({
      data: {
        bookingId: booking.id,
        customerId: customer.id,
        listingId: booking.carListingId,
        ownerId: booking.ownerId,
        rating,
        comment: comment && comment.length > 0 ? comment : null,
      },
    });

    const agg = await tx.review.aggregate({
      where: { listingId: booking.carListingId },
      _avg: { rating: true },
      _count: { _all: true },
    });

    await tx.carListing.update({
      where: { id: booking.carListingId },
      data: {
        avgRating: agg._avg.rating ?? 0,
        reviewCount: agg._count._all,
      },
    });
  });

  await db.activityLogEntry.create({
    data: {
      action: "REVIEW_CREATED",
      description: `Customer ${customer.email} left a ${rating}-star review on booking ${booking.id}`,
      type: "booking",
    },
  });

  revalidatePath(`/account/bookings/${booking.id}`);
  revalidatePath(`/listings/${booking.carListingId}`);
  revalidatePath(`/listings`);
  return null;
}

// Public read — anyone visiting a listing detail can request more reviews.
// No auth guard. Returns an additional batch starting at `skip`, plus a
// hasMore flag the client uses to hide the View more button when exhausted.
const REVIEWS_PAGE_SIZE = 5;

export async function loadMoreReviewsAction(
  listingId: string,
  skip: number,
): Promise<{
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string; // ISO
    customerName: string;
  }>;
  hasMore: boolean;
}> {
  if (typeof listingId !== "string" || listingId.length === 0) {
    return { reviews: [], hasMore: false };
  }
  const safeSkip = Math.max(0, Math.floor(Number(skip) || 0));

  const rows = await db.review.findMany({
    where: { listingId },
    orderBy: { createdAt: "desc" },
    skip: safeSkip,
    take: REVIEWS_PAGE_SIZE + 1,
    include: { customer: { select: { fullName: true } } },
  });

  const hasMore = rows.length > REVIEWS_PAGE_SIZE;
  const slice = rows.slice(0, REVIEWS_PAGE_SIZE);

  return {
    reviews: slice.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      customerName: r.customer.fullName,
    })),
    hasMore,
  };
}

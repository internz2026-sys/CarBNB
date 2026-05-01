// One-off test helper: seed N COMPLETED bookings + reviews on a listing so
// the /listings/[id] "View more reviews" button can be exercised without
// stepping through the customer→booking→admin lifecycle 6+ times by hand.
//
// Usage: npx tsx scripts/seed-test-reviews.ts <listingId> [count]
// Example: npx tsx scripts/seed-test-reviews.ts cmoa21tf4abc 7
//
// Safe to re-run; each invocation appends fresh rows. Delete from Prisma
// Studio when you're done testing if you want a clean slate.

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { BookingStatus, PaymentStatus } from "../types";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter, log: ["error"] });

const SAMPLE_COMMENTS = [
  "Solid car, super clean. Pickup was smooth.",
  "Great communication from the host. Would book again.",
  "Drove great. Tires were in good condition. Recommend.",
  null, // some reviews have no comment
  "Slight delay at pickup but the car itself was perfect.",
  "Felt brand new inside. Worth every peso.",
  "Decent ride, AC could be colder but it works.",
  null,
  "Spotless interior, full tank as promised. 10/10.",
  "Easy booking process. Would rent from this host again.",
];

async function main() {
  const args = process.argv.slice(2);
  const listingId = args[0];
  const count = Number(args[1] ?? "7");

  if (!listingId) {
    console.error("Usage: npx tsx scripts/seed-test-reviews.ts <listingId> [count]");
    process.exit(1);
  }
  if (Number.isNaN(count) || count < 1 || count > 50) {
    console.error("count must be a number between 1 and 50");
    process.exit(1);
  }

  const listing = await prisma.carListing.findUnique({
    where: { id: listingId },
    include: { owner: true },
  });
  if (!listing) {
    console.error(`Listing ${listingId} not found.`);
    process.exit(1);
  }

  const customers = await prisma.customer.findMany({ take: 10 });
  if (customers.length === 0) {
    console.error("No customers in DB. Seed first or sign up customers.");
    process.exit(1);
  }

  console.log(`Seeding ${count} reviews on ${listing.brand} ${listing.model} (${listingId})...`);

  for (let i = 0; i < count; i++) {
    const customer = customers[i % customers.length];
    const rating = (i % 5) + 1; // cycles 1-5
    const comment = SAMPLE_COMMENTS[i % SAMPLE_COMMENTS.length];

    // Pick non-overlapping past dates so this doesn't tangle with availability
    // checks on real bookings. (i+1)*30 days ago, 3-day rentals.
    const daysAgo = (i + 1) * 30;
    const pickup = new Date(Date.now() - daysAgo * 86_400_000);
    const ret = new Date(pickup.getTime() + 3 * 86_400_000);
    const totalAmount = listing.dailyPrice * 3;
    const platformFee = Math.round(totalAmount * 0.15);

    const booking = await prisma.booking.create({
      data: {
        referenceNumber: `TEST-${randomUUID().slice(0, 6).toUpperCase()}`,
        customerId: customer.id,
        customerName: customer.fullName,
        carListingId: listing.id,
        carName: `${listing.brand} ${listing.model} ${listing.year}`,
        carPhoto: listing.photos[0] ?? null,
        plateNumber: listing.plateNumber,
        seatingCapacity: listing.seatingCapacity,
        ownerId: listing.ownerId,
        ownerName: listing.owner.fullName,
        pickupDate: pickup,
        returnDate: ret,
        totalAmount,
        platformFee,
        ownerPayout: totalAmount - platformFee,
        status: BookingStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
        rentalCompletedAt: ret,
      },
    });

    await prisma.review.create({
      data: {
        bookingId: booking.id,
        customerId: customer.id,
        listingId: listing.id,
        ownerId: listing.ownerId,
        rating,
        comment,
        // Stagger createdAt so the chronological-newest-first order is
        // visually distinct in the UI.
        createdAt: new Date(Date.now() - (count - i) * 60_000),
      },
    });

    console.log(`  ${i + 1}/${count}: ${rating}★ from ${customer.fullName}`);
  }

  // Recompute aggregates for the listing.
  const agg = await prisma.review.aggregate({
    where: { listingId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.carListing.update({
    where: { id: listingId },
    data: {
      avgRating: agg._avg.rating ?? 0,
      reviewCount: agg._count._all,
    },
  });

  console.log(
    `Done. Listing now has ${agg._count._all} reviews, avgRating ${(agg._avg.rating ?? 0).toFixed(2)}.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

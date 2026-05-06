import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, CalendarDays, Car, MapPin, Star, User } from "lucide-react";

import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { BookingStatus, PaymentStatus } from "@/types";
import { resolveListingPhotoUrl } from "@/lib/listing-assets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CancelBookingForm } from "./cancel-booking-form";
import { ReviewForm } from "./review-form";
import { BookingChatPanel } from "@/components/booking-chat/chat-panel";

export const dynamic = "force-dynamic";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const statusStyles: Record<string, string> = {
  [BookingStatus.PENDING]: "bg-amber-100 text-amber-700",
  [BookingStatus.CONFIRMED]: "bg-emerald-100 text-emerald-700",
  [BookingStatus.ONGOING]: "bg-blue-100 text-blue-700",
  [BookingStatus.COMPLETED]: "bg-gray-100 text-gray-700",
  [BookingStatus.CANCELLED]: "bg-red-100 text-red-700",
  [BookingStatus.REJECTED]: "bg-red-100 text-red-700",
};

export default async function CustomerBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const customer = await db.customer.findUnique({ where: { email: user!.email! } });
  if (!customer) notFound();

  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      carListing: {
        select: {
          id: true,
          brand: true,
          model: true,
          year: true,
          location: true,
          transmission: true,
          fuelType: true,
          photos: true,
        },
      },
      owner: { select: { fullName: true, contactNumber: true } },
      review: {
        select: { id: true, rating: true, comment: true, createdAt: true },
      },
    },
  });

  // Also enforces the customer can only see their own bookings.
  if (!booking || booking.customerId !== customer.id) {
    notFound();
  }

  const photoUrl = booking.carPhoto ? resolveListingPhotoUrl(booking.carPhoto) : null;
  const canCancel = booking.status === BookingStatus.PENDING;

  return (
    <div className="min-h-screen bg-surface pb-16 font-sans">
      <header className="sticky top-0 z-30 bg-[rgb(250_248_255_/_0.85)] shadow-[0_8px_24px_rgb(19_27_46_/_0.04)] backdrop-blur-lg">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link className="flex items-center" href="/">
            <Image
              alt="DriveXP"
              className="h-8 w-auto"
              height={32}
              priority
              src="/driveXP-logo-wordmark.png"
              width={129}
            />
          </Link>
          <Link
            className="text-sm font-semibold text-on-surface-variant hover:text-primary"
            href="/listings"
          >
            Browse cars
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
        <Link
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground -ml-3 mb-4",
          )}
          href="/account"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to my bookings
        </Link>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="font-headline text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
            Booking {booking.referenceNumber}
          </h1>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
              statusStyles[booking.status] ?? "bg-gray-100 text-gray-700",
            )}
          >
            {booking.status}
          </span>
        </div>

        <Card className="border-border/50 shadow-sm mb-6 overflow-hidden">
          <div className="relative aspect-[16/7] bg-surface-container">
            {photoUrl ? (
              <Image
                alt={booking.carName}
                className="object-cover"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                src={photoUrl}
              />
            ) : (
              <div className="grid size-full place-items-center text-on-surface-variant">
                <Car className="size-10" />
              </div>
            )}
          </div>
          <CardContent className="pt-4">
            <h2 className="text-lg font-semibold text-on-surface">
              {booking.carListing.brand} {booking.carListing.model} · {booking.carListing.year}
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-on-surface-variant">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" />
                {booking.carListing.location}
              </span>
              <span>·</span>
              <span>{booking.carListing.transmission}</span>
              <span>·</span>
              <span>{booking.carListing.fuelType}</span>
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarDays className="size-4" />
                Trip dates
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pickup</span>
                <span className="font-medium">{format(booking.pickupDate, "EEE, MMM d, yyyy")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Return</span>
                <span className="font-medium">{format(booking.returnDate, "EEE, MMM d, yyyy")}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="size-4" />
                Host
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-sm">
              <p className="font-medium">{booking.ownerName}</p>
              {booking.status === BookingStatus.CONFIRMED ||
              booking.status === BookingStatus.ONGOING ? (
                <p className="text-xs text-muted-foreground">{booking.owner.contactNumber}</p>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Host contact shown after the admin confirms your booking.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50 shadow-sm mt-6">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold">Payment</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="text-lg font-bold text-primary">{peso.format(booking.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Status</span>
              <span>
                {booking.paymentStatus === PaymentStatus.PAID
                  ? "Paid"
                  : "Cash on pickup (pending)"}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8">
          <BookingChatPanel
            booking={{
              id: booking.id,
              customerId: booking.customerId,
              ownerId: booking.ownerId,
              status: booking.status,
              rentalCompletedAt: booking.rentalCompletedAt,
            }}
            viewerId={customer.id}
            viewerRole="customer"
          />
        </div>

        {canCancel ? (
          <div className="mt-8">
            <CancelBookingForm bookingId={booking.id} />
          </div>
        ) : null}

        {booking.status === BookingStatus.COMPLETED && booking.review ? (
          <Card className="border-border/50 shadow-sm mt-8">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                Your review
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    className={
                      booking.review!.rating >= n
                        ? "size-5 fill-amber-400 text-amber-400"
                        : "size-5 text-on-surface-variant"
                    }
                    key={n}
                  />
                ))}
                <span className="ml-2 text-sm font-medium">
                  {booking.review.rating} / 5
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  · {format(booking.review.createdAt, "MMM d, yyyy")}
                </span>
              </div>
              {booking.review.comment ? (
                <p className="whitespace-pre-wrap text-sm text-on-surface">
                  {booking.review.comment}
                </p>
              ) : (
                <p className="text-sm italic text-muted-foreground">No comment.</p>
              )}
            </CardContent>
          </Card>
        ) : null}

        {booking.status === BookingStatus.COMPLETED && !booking.review ? (
          <ReviewForm bookingId={booking.id} />
        ) : null}

        {booking.status !== BookingStatus.PENDING &&
        booking.status !== BookingStatus.CANCELLED &&
        booking.status !== BookingStatus.REJECTED &&
        booking.status !== BookingStatus.COMPLETED ? (
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Need to cancel this booking? Contact your admin — once we&apos;ve confirmed a
            reservation, changes go through them directly.
          </p>
        ) : null}
      </section>
    </div>
  );
}

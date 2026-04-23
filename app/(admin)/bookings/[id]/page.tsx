import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Ban,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  MapPin,
  Receipt,
  ShieldAlert,
  User,
  Wallet,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { BookingStatus, PaymentStatus } from "@/types";
import { resolveListingPhotoUrl } from "@/lib/listing-assets";
import { CANCELLATION_REASONS } from "@/lib/cancellation-reasons";
import { BookingActions } from "./booking-actions";

export const dynamic = "force-dynamic";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const bookingStatusStyles: Record<string, string> = {
  [BookingStatus.PENDING]: "bg-amber-100 text-amber-700",
  [BookingStatus.CONFIRMED]: "bg-indigo-100 text-indigo-700",
  [BookingStatus.ONGOING]: "bg-blue-100 text-blue-700",
  [BookingStatus.COMPLETED]: "bg-emerald-100 text-emerald-700",
  [BookingStatus.CANCELLED]: "bg-red-100 text-red-700",
  [BookingStatus.REJECTED]: "bg-red-100 text-red-700",
};

const paymentStatusStyles: Record<string, string> = {
  [PaymentStatus.PAID]: "text-emerald-700 bg-emerald-50 border-emerald-600",
  [PaymentStatus.UNPAID]: "text-red-700 bg-red-50 border-red-600",
  [PaymentStatus.PARTIALLY_PAID]: "text-amber-700 bg-amber-50 border-amber-600",
  [PaymentStatus.REFUNDED]: "text-gray-700 bg-gray-50 border-gray-600",
};

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      customer: { select: { fullName: true, email: true, contactNumber: true } },
      owner: { select: { fullName: true, email: true, contactNumber: true } },
      carListing: { select: { id: true, location: true, transmission: true, fuelType: true, photos: true } },
    },
  });
  if (!booking) notFound();

  const photoUrl = booking.carPhoto ? resolveListingPhotoUrl(booking.carPhoto) : null;
  const cancellationLabel = CANCELLATION_REASONS.find(
    (r) => r.slug === booking.cancellationReason,
  )?.label;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-2 mb-2">
        <Link
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground -ml-3",
          )}
          href="/bookings"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Bookings
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <p className="mb-1 font-mono text-xs font-bold uppercase tracking-[0.16em] text-on-surface-variant">
            {booking.referenceNumber}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {booking.carName}
            </h1>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
                bookingStatusStyles[booking.status] ?? "bg-muted text-muted-foreground",
              )}
            >
              {booking.status}
            </span>
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide",
                paymentStatusStyles[booking.paymentStatus] ?? "border-gray-300 text-gray-600",
              )}
            >
              {booking.paymentStatus}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Created {format(booking.createdAt, "MMMM d, yyyy")}
          </p>
        </div>
      </div>

      <BookingActions
        bookingId={booking.id}
        paymentStatus={booking.paymentStatus}
        status={booking.status}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="overflow-hidden border-border/50 shadow-sm">
            <div className="relative aspect-[4/3] bg-muted w-full">
              {photoUrl ? (
                <Image
                  alt={booking.carName}
                  className="object-cover"
                  fill
                  priority
                  src={photoUrl}
                />
              ) : (
                <div className="grid size-full place-items-center text-muted-foreground">
                  <Car className="w-10 h-10 opacity-40" />
                </div>
              )}
            </div>
            <CardContent className="pt-4 text-sm space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {booking.carListing.location}
              </div>
              <div className="text-xs text-muted-foreground">
                {booking.carListing.transmission} · {booking.carListing.fuelType} ·{" "}
                {booking.seatingCapacity} seats
              </div>
              <Link
                className="block text-xs text-primary hover:underline pt-1"
                href={`/car-listings/${booking.carListing.id}`}
              >
                View listing
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-sm">
              <p className="font-medium text-foreground">{booking.customer.fullName}</p>
              <p className="text-xs text-muted-foreground">{booking.customer.email}</p>
              <p className="text-xs text-muted-foreground">
                {booking.customer.contactNumber || "No contact number"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="w-4 h-4" />
                Host
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-sm">
              <p className="font-medium text-foreground">{booking.owner.fullName}</p>
              <p className="text-xs text-muted-foreground">{booking.owner.email}</p>
              <p className="text-xs text-muted-foreground">{booking.owner.contactNumber}</p>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Rental Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Pickup
                </p>
                <p className="mt-1 font-medium">
                  {format(booking.pickupDate, "EEEE, MMM d, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Return
                </p>
                <p className="mt-1 font-medium">
                  {format(booking.returnDate, "EEEE, MMM d, yyyy")}
                </p>
              </div>
              {booking.rentalStartedAt ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Rental Started
                  </p>
                  <p className="mt-1 text-xs">
                    {format(booking.rentalStartedAt, "MMM d, yyyy · h:mm a")}
                  </p>
                </div>
              ) : null}
              {booking.rentalCompletedAt ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Rental Completed
                  </p>
                  <p className="mt-1 text-xs">
                    {format(booking.rentalCompletedAt, "MMM d, yyyy · h:mm a")}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer total</span>
                <span className="font-bold text-lg text-primary">
                  {peso.format(booking.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  Platform fee
                  {booking.totalAmount > 0
                    ? ` (${Math.round((booking.platformFee / booking.totalAmount) * 100)}%)`
                    : ""}
                </span>
                <span>{peso.format(booking.platformFee)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Owner payout</span>
                <span>{peso.format(booking.ownerPayout)}</span>
              </div>

              {booking.paymentStatus === PaymentStatus.PAID ? (
                <div className="mt-3 rounded-md bg-emerald-50 p-3 text-xs text-emerald-900">
                  <p className="flex items-center gap-2 font-semibold">
                    <Receipt className="w-4 h-4" />
                    Paid {booking.paymentMethod ? `via ${booking.paymentMethod}` : ""}
                  </p>
                  {booking.paymentReceivedAt ? (
                    <p className="mt-1">
                      {format(booking.paymentReceivedAt, "MMM d, yyyy · h:mm a")} by{" "}
                      {booking.paymentReceivedBy ?? "—"}
                    </p>
                  ) : null}
                  {booking.paymentNotes ? (
                    <p className="mt-1 italic">{booking.paymentNotes}</p>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {booking.cancellationReason ? (
            <Card className="border-red-200 shadow-sm bg-red-50/50">
              <CardHeader className="pb-3 border-b border-red-100">
                <CardTitle className="text-sm font-semibold text-red-800 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  {booking.status === BookingStatus.REJECTED ? "Rejection" : "Cancellation"} details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-xs text-red-900 space-y-1">
                <p>
                  <strong>Reason:</strong>{" "}
                  {cancellationLabel ?? booking.cancellationReason}
                </p>
                {booking.cancellationNote ? <p>{booking.cancellationNote}</p> : null}
                <p className="text-[11px] text-red-800/80 pt-1">
                  {booking.cancelledAt
                    ? format(booking.cancelledAt, "MMM d, yyyy · h:mm a")
                    : ""}{" "}
                  {booking.cancelledBy ? `· ${booking.cancelledBy}` : ""}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

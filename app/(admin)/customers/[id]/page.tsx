import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Eye,
  Mail,
  Phone,
  User,
  Wallet,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { BookingStatus, PaymentStatus } from "@/types";

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

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      bookings: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          referenceNumber: true,
          carName: true,
          plateNumber: true,
          pickupDate: true,
          returnDate: true,
          status: true,
          paymentStatus: true,
          totalAmount: true,
        },
      },
    },
  });

  if (!customer) notFound();

  const completedBookings = customer.bookings.filter(
    (b) => b.status === BookingStatus.COMPLETED,
  );
  const lifetimeSpend = completedBookings.reduce((sum, b) => sum + b.totalAmount, 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-2">
        <Link
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground -ml-3",
          )}
          href="/customers"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Customers
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
            {customer.fullName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Customer since {format(customer.createdAt, "MMMM d, yyyy")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              {customer.email}
            </p>
            <p className="flex items-center gap-2">
              <Phone className="size-4 text-muted-foreground" />
              {customer.contactNumber || "Not provided"}
            </p>
            {customer.address ? (
              <p className="text-xs text-muted-foreground">{customer.address}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Booking activity
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-1 text-sm">
            <p>
              <strong>{customer.bookings.length}</strong> total bookings
            </p>
            <p className="text-xs text-muted-foreground">
              {completedBookings.length} completed ·{" "}
              {
                customer.bookings.filter((b) => b.status === BookingStatus.CANCELLED)
                  .length
              }{" "}
              cancelled
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Lifetime spend
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-1 text-sm">
            <p className="text-xl font-bold text-primary">{peso.format(lifetimeSpend)}</p>
            <p className="text-xs text-muted-foreground">From completed bookings only</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Booking history
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customer.bookings.length === 0 ? (
            <p className="rounded-lg bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              No bookings yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-2 text-left">
                <thead>
                  <tr className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    <th className="pb-3">Reference</th>
                    <th className="pb-3">Car</th>
                    <th className="pb-3">Dates</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Payment</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.bookings.map((b, idx) => (
                    <tr
                      className={cn(
                        "align-middle",
                        idx % 2 === 0 ? "bg-surface" : "bg-surface-container-low",
                      )}
                      key={b.id}
                    >
                      <td className="rounded-l-xl py-3 pl-4 pr-4 font-mono text-xs font-bold uppercase tracking-wider">
                        {b.referenceNumber}
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-sm font-medium">{b.carName}</p>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          {b.plateNumber}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground">
                        {format(b.pickupDate, "MMM d")} →{" "}
                        {format(b.returnDate, "MMM d, yyyy")}
                      </td>
                      <td className="py-3 pr-4 text-right text-sm font-semibold text-primary">
                        {peso.format(b.totalAmount)}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                            bookingStatusStyles[b.status] ?? "bg-muted text-muted-foreground",
                          )}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-[11px] text-muted-foreground">
                        {b.paymentStatus === PaymentStatus.PAID ? "Paid" : b.paymentStatus}
                      </td>
                      <td className="rounded-r-xl py-3 pr-4 text-right">
                        <Link
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                          href={`/bookings/${b.id}`}
                        >
                          <Eye className="size-3" /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

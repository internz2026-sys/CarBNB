import Link from "next/link";
import { format } from "date-fns";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  Plus,
  Search,
  Wallet,
} from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { BookingStatus, PaymentStatus } from "@/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_FILTERS: { key: string; label: string; value: BookingStatus }[] = [
  { key: "pending", label: "Pending", value: BookingStatus.PENDING },
  { key: "confirmed", label: "Confirmed", value: BookingStatus.CONFIRMED },
  { key: "ongoing", label: "Ongoing", value: BookingStatus.ONGOING },
  { key: "completed", label: "Completed", value: BookingStatus.COMPLETED },
  { key: "cancelled", label: "Cancelled", value: BookingStatus.CANCELLED },
  { key: "rejected", label: "Rejected", value: BookingStatus.REJECTED },
];

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

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; payment?: string }>;
}) {
  const { search, status, payment } = await searchParams;
  const trimmedSearch = search?.trim() ?? "";
  const activeStatus = STATUS_FILTERS.find((s) => s.key === status);
  const unpaidOnly = payment === "unpaid";

  const where: Prisma.BookingWhereInput = {};
  if (trimmedSearch) {
    where.OR = [
      { referenceNumber: { contains: trimmedSearch, mode: "insensitive" } },
      { customerName: { contains: trimmedSearch, mode: "insensitive" } },
      { carName: { contains: trimmedSearch, mode: "insensitive" } },
      { plateNumber: { contains: trimmedSearch, mode: "insensitive" } },
    ];
  }
  if (activeStatus) {
    where.status = activeStatus.value;
  }
  if (unpaidOnly) {
    where.paymentStatus = PaymentStatus.UNPAID;
  }

  const [allBookings, filteredBookings] = await Promise.all([
    db.booking.findMany({ orderBy: { createdAt: "desc" } }),
    db.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalBookings = allBookings.length;
  const pendingCount = allBookings.filter((b) => b.status === BookingStatus.PENDING).length;
  const ongoingCount = allBookings.filter((b) => b.status === BookingStatus.ONGOING).length;
  const unpaidCount = allBookings.filter(
    (b) =>
      b.paymentStatus === PaymentStatus.UNPAID &&
      (b.status === BookingStatus.CONFIRMED ||
        b.status === BookingStatus.ONGOING ||
        b.status === BookingStatus.COMPLETED),
  ).length;

  const isFiltered = Boolean(trimmedSearch || activeStatus || unpaidOnly);

  return (
    <section className="rounded-[2rem] bg-[linear-gradient(180deg,#faf8ff_0%,#eaedff_100%)] px-5 py-6 shadow-[0_8px_40px_rgb(19_27_46_/_0.06)] sm:px-8 sm:py-8 xl:px-10 xl:py-10">
      <div className="space-y-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface sm:text-5xl xl:text-[3.5rem] xl:leading-none">
              Bookings
            </h1>
            <p className="mt-3 text-lg font-medium text-on-surface-variant sm:text-xl">
              Review customer reservations, advance rental lifecycle, and record cash payments.
            </p>
          </div>

          <Link
            href="/bookings/new"
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#003d9b_0%,#0052cc_100%)] px-5 py-3 text-sm font-semibold text-on-primary shadow-[0_8px_40px_rgb(19_27_46_/_0.06)] transition hover:opacity-95"
          >
            <Plus className="size-4" />
            New Booking
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            hint={`${pendingCount} pending review`}
            icon={<ClipboardList className="size-4" />}
            label="Total bookings"
            value={totalBookings}
          />
          <SummaryCard
            hint="Awaiting admin confirmation"
            icon={<Clock className="size-4" />}
            label="Pending"
            value={pendingCount}
          />
          <SummaryCard
            hint="Rentals in progress"
            icon={<CheckCircle2 className="size-4" />}
            label="Ongoing"
            value={ongoingCount}
          />
          <SummaryCard
            hint="Confirmed / ongoing / completed"
            icon={<Wallet className="size-4" />}
            label="Unpaid"
            value={unpaidCount}
          />
        </div>

        <section className="rounded-xl bg-surface-container-lowest p-6 shadow-[0_8px_32px_rgb(19_27_46_/_0.06)] sm:p-8">
          <div className="mb-8 flex flex-col gap-4">
            <h2 className="font-headline text-[1.75rem] font-bold tracking-tight text-on-surface">
              All bookings
            </h2>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <form action="/bookings" className="relative w-full max-w-md" method="GET">
                {activeStatus ? (
                  <input name="status" type="hidden" value={activeStatus.key} />
                ) : null}
                {unpaidOnly ? <input name="payment" type="hidden" value="unpaid" /> : null}
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  className="h-11 w-full rounded-full bg-surface-container-low pl-11 pr-4 text-sm text-on-surface outline-none"
                  defaultValue={trimmedSearch}
                  name="search"
                  placeholder="Search ref, customer, car, plate..."
                  type="text"
                />
              </form>

              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <FilterChip
                  active={!activeStatus && !unpaidOnly}
                  href={{
                    pathname: "/bookings",
                    query: trimmedSearch ? { search: trimmedSearch } : {},
                  }}
                  label="All"
                />
                {STATUS_FILTERS.map((opt) => {
                  const active = activeStatus?.key === opt.key && !unpaidOnly;
                  const query: Record<string, string> = { status: opt.key };
                  if (trimmedSearch) query.search = trimmedSearch;
                  return (
                    <FilterChip
                      active={active}
                      href={{ pathname: "/bookings", query }}
                      key={opt.key}
                      label={opt.label}
                    />
                  );
                })}
                <FilterChip
                  active={unpaidOnly && !activeStatus}
                  className="border border-dashed border-red-300"
                  href={{
                    pathname: "/bookings",
                    query: {
                      payment: "unpaid",
                      ...(trimmedSearch ? { search: trimmedSearch } : {}),
                    },
                  }}
                  label="Unpaid"
                />
              </div>
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="rounded-xl bg-surface-container-low p-8 text-center">
              <p className="text-base font-semibold text-on-surface">No bookings match your filters</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                {isFiltered
                  ? "Try clearing search or filters."
                  : "No bookings exist yet. Create one using the button above."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-3 text-left">
                <thead>
                  <tr className="text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                    <th className="pb-3">Reference</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Car</th>
                    <th className="pb-3">Owner</th>
                    <th className="pb-3">Dates</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Payment</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking, idx) => (
                    <tr
                      className={cn(
                        "align-middle transition",
                        idx % 2 === 0 ? "bg-surface" : "bg-surface-container-low",
                      )}
                      key={booking.id}
                    >
                      <td className="rounded-l-xl py-5 pl-4 pr-4">
                        <span className="font-mono text-xs font-bold tracking-wider text-on-surface">
                          {booking.referenceNumber}
                        </span>
                      </td>
                      <td className="py-5 pr-4 text-sm font-medium text-on-surface">
                        {booking.customerName}
                      </td>
                      <td className="py-5 pr-4">
                        <Link
                          className="text-sm font-medium text-primary hover:underline"
                          href={`/car-listings/${booking.carListingId}`}
                        >
                          {booking.carName}
                        </Link>
                        <p className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                          {booking.plateNumber}
                        </p>
                      </td>
                      <td className="py-5 pr-4 text-sm">
                        <Link
                          className="hover:text-primary hover:underline"
                          href={`/owners/${booking.ownerId}`}
                        >
                          {booking.ownerName}
                        </Link>
                      </td>
                      <td className="py-5 pr-4 text-xs text-on-surface-variant">
                        {format(booking.pickupDate, "MMM d")} →{" "}
                        {format(booking.returnDate, "MMM d, yyyy")}
                      </td>
                      <td className="py-5 pr-4 text-right text-sm font-semibold text-primary">
                        {peso.format(booking.totalAmount)}
                      </td>
                      <td className="py-5 pr-4">
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
                            bookingStatusStyles[booking.status] ?? "bg-muted text-muted-foreground",
                          )}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="py-5 pr-4">
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                            paymentStatusStyles[booking.paymentStatus] ?? "border-gray-300 text-gray-600",
                          )}
                        >
                          {booking.paymentStatus}
                        </span>
                      </td>
                      <td className="rounded-r-xl py-5 pr-4 text-right">
                        <Link
                          className="inline-flex items-center gap-1 rounded-xl bg-surface-container-highest px-3 py-2 text-sm font-semibold text-surface-tint"
                          href={`/bookings/${booking.id}`}
                        >
                          <Eye className="size-4" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function SummaryCard({
  hint,
  icon,
  label,
  value,
}: {
  hint: string;
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <article className="flex min-h-[9rem] flex-col justify-between rounded-xl bg-surface-container-lowest px-6 py-5 shadow-[0_8px_32px_rgb(19_27_46_/_0.06)]">
      <div>
        <p className="text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
          {label}
        </p>
        <h2 className="mt-2 font-headline text-[2.4rem] font-extrabold leading-none text-on-surface">
          {value}
        </h2>
      </div>
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant">
        {icon}
        {hint}
      </span>
    </article>
  );
}

function FilterChip({
  active,
  className,
  href,
  label,
}: {
  active: boolean;
  className?: string;
  href: React.ComponentProps<typeof Link>["href"];
  label: string;
}) {
  return (
    <Link
      className={cn(
        "rounded-full px-4 py-2 text-sm font-semibold",
        active
          ? "bg-surface-container-highest text-on-surface"
          : "bg-surface text-on-surface-variant",
        className,
      )}
      href={href}
    >
      {label}
    </Link>
  );
}

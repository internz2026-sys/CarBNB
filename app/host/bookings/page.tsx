import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { CheckCircle2, ClipboardList, Clock, Eye, Search, CalendarClock } from "lucide-react";
import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { BookingStatus } from "@/types";
import { getCurrentHost } from "@/lib/current-host";
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

export default async function HostBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const session = await getCurrentHost();
  if (session.kind !== "verified") redirect("/host/dashboard");

  const ownerId = session.owner.id;
  const { search, status } = await searchParams;
  const trimmedSearch = search?.trim() ?? "";
  const activeStatus = STATUS_FILTERS.find((s) => s.key === status);

  const where: Prisma.BookingWhereInput = { ownerId };
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

  const [allBookings, filteredBookings] = await Promise.all([
    db.booking.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" } }),
    db.booking.findMany({ where, orderBy: { createdAt: "desc" } }),
  ]);

  const totalBookings = allBookings.length;
  const pendingCount = allBookings.filter((b) => b.status === BookingStatus.PENDING).length;
  const confirmedCount = allBookings.filter((b) => b.status === BookingStatus.CONFIRMED).length;
  const ongoingCount = allBookings.filter((b) => b.status === BookingStatus.ONGOING).length;

  const isFiltered = Boolean(trimmedSearch || activeStatus);

  return (
    <div className="pb-10">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
          My Bookings
        </h1>
        <p className="mt-2 text-base text-on-surface-variant">
          Requests on your cars. Accept or reject pending ones — admin handles pickup,
          return, and payments.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          hint="Across all your cars"
          icon={<ClipboardList className="size-4" />}
          label="Total bookings"
          value={totalBookings}
        />
        <SummaryCard
          hint="Needs your response"
          icon={<Clock className="size-4" />}
          label="Pending"
          value={pendingCount}
        />
        <SummaryCard
          hint="Approved, awaiting pickup"
          icon={<CalendarClock className="size-4" />}
          label="Confirmed"
          value={confirmedCount}
        />
        <SummaryCard
          hint="Currently rented"
          icon={<CheckCircle2 className="size-4" />}
          label="Ongoing"
          value={ongoingCount}
        />
      </div>

      <section className="rounded-2xl bg-surface-container-lowest p-6 shadow-[0_8px_32px_rgb(19_27_46_/_0.06)] sm:p-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <form action="/host/bookings" className="relative w-full max-w-md" method="GET">
            {activeStatus ? (
              <input name="status" type="hidden" value={activeStatus.key} />
            ) : null}
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
              active={!activeStatus}
              href={{
                pathname: "/host/bookings",
                query: trimmedSearch ? { search: trimmedSearch } : {},
              }}
              label="All"
            />
            {STATUS_FILTERS.map((opt) => {
              const active = activeStatus?.key === opt.key;
              const query: Record<string, string> = { status: opt.key };
              if (trimmedSearch) query.search = trimmedSearch;
              return (
                <FilterChip
                  active={active}
                  href={{ pathname: "/host/bookings", query }}
                  key={opt.key}
                  label={opt.label}
                />
              );
            })}
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="rounded-xl bg-surface-container-low p-8 text-center">
            <p className="text-base font-semibold text-on-surface">No bookings match your filters</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              {isFiltered
                ? "Try clearing search or filters."
                : "No one has booked your cars yet. Make sure your listings are live and priced right."}
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
                  <th className="pb-3">Dates</th>
                  <th className="pb-3 text-right">Payout</th>
                  <th className="pb-3">Status</th>
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
                      <p className="text-sm font-medium">{booking.carName}</p>
                      <p className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                        {booking.plateNumber}
                      </p>
                    </td>
                    <td className="py-5 pr-4 text-xs text-on-surface-variant">
                      {format(booking.pickupDate, "MMM d")} →{" "}
                      {format(booking.returnDate, "MMM d, yyyy")}
                    </td>
                    <td className="py-5 pr-4 text-right text-sm font-semibold text-primary">
                      {peso.format(booking.ownerPayout)}
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
                    <td className="rounded-r-xl py-5 pr-4 text-right">
                      <Link
                        className="inline-flex items-center gap-1 rounded-xl bg-surface-container-highest px-3 py-2 text-sm font-semibold text-surface-tint"
                        href={`/host/bookings/${booking.id}`}
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
    <article className="flex min-h-[7.5rem] flex-col justify-between rounded-xl bg-surface-container-lowest px-6 py-5 shadow-[0_8px_32px_rgb(19_27_46_/_0.06)]">
      <div>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
          {label}
        </p>
        <h2 className="mt-2 font-headline text-[2rem] font-extrabold leading-none text-on-surface">
          {value}
        </h2>
      </div>
      <span className="inline-flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
        {icon}
        {hint}
      </span>
    </article>
  );
}

function FilterChip({
  active,
  href,
  label,
}: {
  active: boolean;
  href: React.ComponentProps<typeof Link>["href"];
  label: string;
}) {
  return (
    <Link
      className={cn(
        "rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap",
        active
          ? "bg-surface-container-highest text-on-surface"
          : "bg-surface text-on-surface-variant",
      )}
      href={href}
    >
      {label}
    </Link>
  );
}

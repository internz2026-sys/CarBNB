import Link from "next/link";
import { format } from "date-fns";
import { Eye, Search, Users } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const trimmedSearch = search?.trim() ?? "";

  const where: Prisma.CustomerWhereInput = {};
  if (trimmedSearch) {
    where.OR = [
      { fullName: { contains: trimmedSearch, mode: "insensitive" } },
      { email: { contains: trimmedSearch, mode: "insensitive" } },
      { contactNumber: { contains: trimmedSearch, mode: "insensitive" } },
    ];
  }

  const [customers, totalCount, totalBookingsAgg] = await Promise.all([
    db.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        bookings: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            createdAt: true,
            status: true,
            totalAmount: true,
            carName: true,
          },
        },
        _count: { select: { bookings: true } },
      },
    }),
    db.customer.count(),
    db.booking.count(),
  ]);

  const isFiltered = Boolean(trimmedSearch);

  return (
    <section className="rounded-[2rem] bg-[linear-gradient(180deg,#faf8ff_0%,#eaedff_100%)] px-5 py-6 shadow-[0_8px_40px_rgb(19_27_46_/_0.06)] sm:px-8 sm:py-8 xl:px-10 xl:py-10">
      <div className="space-y-10">
        <div>
          <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface sm:text-5xl xl:text-[3.5rem] xl:leading-none">
            Customers
          </h1>
          <p className="mt-3 text-lg font-medium text-on-surface-variant sm:text-xl">
            All registered renters and their booking history.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <SummaryCard
            hint="Registered renters"
            icon={<Users className="size-4" />}
            label="Total customers"
            value={totalCount}
          />
          <SummaryCard
            hint="All-time across all customers"
            icon={<Eye className="size-4" />}
            label="Total bookings"
            value={totalBookingsAgg}
          />
        </div>

        <section className="rounded-xl bg-surface-container-lowest p-6 shadow-[0_8px_32px_rgb(19_27_46_/_0.06)] sm:p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-headline text-[1.75rem] font-bold tracking-tight text-on-surface">
                Customer Directory
              </h2>
              <p className="text-[1.02rem] text-on-surface-variant">
                Click a row to see a customer&apos;s full booking history.
              </p>
            </div>

            <form action="/customers" className="relative w-full max-w-md" method="GET">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                className="h-11 w-full rounded-full bg-surface-container-low pl-11 pr-4 text-sm text-on-surface outline-none"
                defaultValue={trimmedSearch}
                name="search"
                placeholder="Search by name, email, or phone..."
                type="text"
              />
            </form>
          </div>

          {customers.length === 0 ? (
            <div className="rounded-xl bg-surface-container-low p-8 text-center">
              <p className="text-base font-semibold text-on-surface">No customers found</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                {isFiltered
                  ? "Try clearing the search above."
                  : "No one has signed up as a customer yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-3 text-left">
                <thead>
                  <tr className="text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Contact</th>
                    <th className="pb-3 text-right">Bookings</th>
                    <th className="pb-3">Last Booking</th>
                    <th className="pb-3">Joined</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c, idx) => {
                    const lastBooking = c.bookings[0];
                    return (
                      <tr
                        className={cn(
                          "align-middle transition",
                          idx % 2 === 0 ? "bg-surface" : "bg-surface-container-low",
                        )}
                        key={c.id}
                      >
                        <td className="rounded-l-xl py-5 pl-4 pr-4">
                          <p className="text-[1.05rem] font-semibold text-on-surface">{c.fullName}</p>
                          <p className="text-xs text-on-surface-variant">{c.email}</p>
                        </td>
                        <td className="py-5 pr-4 text-sm text-on-surface-variant">
                          {c.contactNumber || "—"}
                        </td>
                        <td className="py-5 pr-4 text-right font-semibold text-primary">
                          {c._count.bookings}
                        </td>
                        <td className="py-5 pr-4 text-xs text-on-surface-variant">
                          {lastBooking ? (
                            <>
                              <p>{format(lastBooking.createdAt, "MMM d, yyyy")}</p>
                              <p className="text-[10px] uppercase tracking-wide">
                                {lastBooking.carName} · {lastBooking.status}
                              </p>
                            </>
                          ) : (
                            "No bookings yet"
                          )}
                        </td>
                        <td className="py-5 pr-4 text-xs text-on-surface-variant">
                          {format(c.createdAt, "MMM d, yyyy")}
                        </td>
                        <td className="rounded-r-xl py-5 pr-4 text-right">
                          <Link
                            className="inline-flex items-center gap-1 rounded-xl bg-surface-container-highest px-3 py-2 text-sm font-semibold text-surface-tint"
                            href={`/customers/${c.id}`}
                          >
                            <Eye className="size-4" />
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
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
    <article className="flex min-h-[7.5rem] flex-col justify-between rounded-xl bg-surface-container-lowest px-6 py-5 shadow-[0_8px_32px_rgb(19_27_46_/_0.06)]">
      <div>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
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


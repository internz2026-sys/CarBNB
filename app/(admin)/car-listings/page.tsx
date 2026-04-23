import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import {
  Car,
  CheckCircle2,
  Eye,
  Plus,
  Search,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ListingStatus } from "@/types";
import { cn } from "@/lib/utils";
import { resolveListingPhotoUrl } from "@/lib/listing-assets";

export const dynamic = "force-dynamic";

const STATUS_FILTERS: { key: string; label: string; value: ListingStatus }[] = [
  { key: "pending", label: "Pending", value: ListingStatus.PENDING_APPROVAL },
  { key: "active", label: "Active", value: ListingStatus.ACTIVE },
  { key: "suspended", label: "Suspended", value: ListingStatus.SUSPENDED },
  { key: "booked", label: "Booked", value: ListingStatus.BOOKED },
];

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const statusBadgeStyles: Record<string, string> = {
  [ListingStatus.ACTIVE]: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  [ListingStatus.PENDING_APPROVAL]: "bg-secondary-container text-on-secondary-fixed-variant",
  [ListingStatus.BOOKED]: "bg-primary-container text-primary",
  [ListingStatus.SUSPENDED]: "bg-error-container text-on-error-container",
  [ListingStatus.REJECTED]: "bg-error-container text-on-error-container",
  [ListingStatus.UNAVAILABLE]: "bg-surface-container-highest text-on-surface-variant",
  [ListingStatus.ARCHIVED]: "bg-surface-container-highest text-on-surface-variant",
  [ListingStatus.DRAFT]: "bg-surface-container-highest text-on-surface-variant",
};

const defaultBadge = "bg-surface-container-highest text-on-surface-variant";

export default async function CarListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const { search, status } = await searchParams;
  const trimmedSearch = search?.trim() ?? "";
  const activeStatus = STATUS_FILTERS.find((s) => s.key === status);

  const where: Prisma.CarListingWhereInput = {};
  if (trimmedSearch) {
    where.OR = [
      { brand: { contains: trimmedSearch, mode: "insensitive" } },
      { model: { contains: trimmedSearch, mode: "insensitive" } },
      { plateNumber: { contains: trimmedSearch, mode: "insensitive" } },
      { owner: { fullName: { contains: trimmedSearch, mode: "insensitive" } } },
    ];
  }
  if (activeStatus) {
    where.status = activeStatus.value;
  }

  const [allListings, filteredListings] = await Promise.all([
    db.carListing.findMany({ orderBy: { createdAt: "desc" } }),
    db.carListing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { owner: { select: { id: true, fullName: true } } },
    }),
  ]);

  const totalListings = allListings.length;
  const activeListings = allListings.filter((c) => c.status === ListingStatus.ACTIVE).length;
  const pendingListings = allListings.filter(
    (c) => c.status === ListingStatus.PENDING_APPROVAL,
  ).length;
  const suspendedListings = allListings.filter(
    (c) => c.status === ListingStatus.SUSPENDED,
  ).length;
  const averagePrice =
    allListings.length > 0
      ? allListings.reduce((sum, c) => sum + c.dailyPrice, 0) / allListings.length
      : 0;

  const isFiltered = Boolean(trimmedSearch || activeStatus);

  return (
    <section className="rounded-[2rem] bg-[linear-gradient(180deg,#faf8ff_0%,#eaedff_100%)] px-5 py-6 shadow-[0_8px_40px_rgb(19_27_46_/_0.06)] sm:px-8 sm:py-8 xl:px-10 xl:py-10">
      <div className="space-y-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface sm:text-5xl xl:text-[3.5rem] xl:leading-none">
              Car Listings
            </h1>
            <p className="mt-3 text-lg font-medium text-on-surface-variant sm:text-xl xl:text-[1.45rem]">
              Manage owner vehicles, approve new listings, and monitor fleet inventory.
            </p>
          </div>

          <Link
            href="/car-listings/new"
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#003d9b_0%,#0052cc_100%)] px-5 py-3 text-sm font-semibold text-on-primary shadow-[0_8px_40px_rgb(19_27_46_/_0.06)] transition hover:opacity-95"
          >
            <Plus className="size-4" />
            Add Listing
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <article className="flex min-h-[9rem] flex-col justify-between rounded-xl bg-surface-container-lowest px-6 py-5 shadow-[0_8px_32px_rgb(19_27_46_/_0.06)]">
            <div>
              <p className="text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                Total Listings
              </p>
              <h2 className="mt-2 font-headline text-[2.4rem] font-extrabold leading-none text-on-surface">
                {totalListings}
              </h2>
            </div>
            <span className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-on-surface-variant">
              <Car className="size-4" />
              {activeListings} active
            </span>
          </article>

          <article className="flex min-h-[9rem] flex-col justify-between rounded-xl bg-surface-container-lowest px-6 py-5 shadow-[0_8px_32px_rgb(19_27_46_/_0.06)]">
            <div>
              <p className="text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                Pending Approval
              </p>
              <h2 className="mt-2 font-headline text-[2.4rem] font-extrabold leading-none text-on-surface">
                {pendingListings}
              </h2>
            </div>
            <span className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-on-secondary-fixed-variant">
              <ShieldCheck className="size-4" />
              Awaiting review
            </span>
          </article>

          <article className="flex min-h-[9rem] flex-col justify-between rounded-xl bg-surface-container-lowest px-6 py-5 shadow-[0_8px_32px_rgb(19_27_46_/_0.06)]">
            <div>
              <p className="text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                Suspended
              </p>
              <h2 className="mt-2 font-headline text-[2.4rem] font-extrabold leading-none text-error">
                {suspendedListings}
              </h2>
            </div>
            <span className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-on-error-container">
              Requires attention
            </span>
          </article>

          <article className="flex min-h-[9rem] flex-col justify-between rounded-xl bg-[linear-gradient(135deg,#003d9b_0%,#0052cc_100%)] px-6 py-5 text-on-primary shadow-[0_8px_40px_rgb(19_27_46_/_0.06)]">
            <div>
              <p className="text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-on-primary/80">
                Average Daily Rate
              </p>
              <h2 className="mt-2 font-headline text-[2.4rem] font-extrabold leading-none tracking-tight">
                {peso.format(averagePrice)}
              </h2>
            </div>
            <span className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-on-primary/90">
              <Wallet className="size-4" />
              Across {totalListings} units
            </span>
          </article>
        </div>

        <section className="rounded-xl bg-surface-container-lowest p-6 shadow-[0_8px_32px_rgb(19_27_46_/_0.06)] sm:p-8">
          <div className="mb-8 flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="font-headline text-[1.75rem] font-bold tracking-tight text-on-surface">
                  Listings Directory
                </h2>
                <p className="text-[1.02rem] text-on-surface-variant">
                  Browse all registered cars and drill into owner, availability, and documents.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <form action="/car-listings" className="relative w-full max-w-md" method="GET">
                {activeStatus ? (
                  <input name="status" type="hidden" value={activeStatus.key} />
                ) : null}
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  className="h-11 w-full rounded-full bg-surface-container-low pl-11 pr-4 text-sm text-on-surface outline-none"
                  defaultValue={trimmedSearch}
                  name="search"
                  placeholder="Search by brand, model, plate, or owner..."
                  type="text"
                />
              </form>

              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <Link
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold",
                    !activeStatus
                      ? "bg-surface-container-highest text-on-surface"
                      : "bg-surface text-on-surface-variant",
                  )}
                  href={{
                    pathname: "/car-listings",
                    query: trimmedSearch ? { search: trimmedSearch } : {},
                  }}
                >
                  All Status
                </Link>
                {STATUS_FILTERS.map((opt) => {
                  const active = activeStatus?.key === opt.key;
                  const query: Record<string, string> = { status: opt.key };
                  if (trimmedSearch) query.search = trimmedSearch;
                  return (
                    <Link
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-semibold",
                        active
                          ? "bg-surface-container-highest text-on-surface"
                          : "bg-surface text-on-surface-variant",
                      )}
                      href={{ pathname: "/car-listings", query }}
                      key={opt.key}
                    >
                      {opt.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {filteredListings.length === 0 ? (
            <div className="rounded-xl bg-surface-container-low p-8 text-center">
              <p className="text-base font-semibold text-on-surface">
                No listings match your filters
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">
                {isFiltered
                  ? "Try clearing the search or status filter above."
                  : "No listings exist yet — add one using the button above."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-3 text-left">
                <thead>
                  <tr className="text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                    <th className="pb-3 font-semibold">Vehicle</th>
                    <th className="pb-3 font-semibold">Plate</th>
                    <th className="pb-3 font-semibold">Owner</th>
                    <th className="pb-3 font-semibold">Daily Rate</th>
                    <th className="pb-3 font-semibold">Availability</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Added</th>
                    <th className="pb-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredListings.map((car, index) => {
                    const primaryPhoto = car.photos[0];
                    return (
                      <tr
                        key={car.id}
                        className={cn(
                          "align-middle transition",
                          index % 2 === 0 ? "bg-surface" : "bg-surface-container-low",
                        )}
                      >
                        <td className="rounded-l-xl py-5 pl-4 pr-4">
                          <div className="flex items-center gap-4">
                            <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-surface-container-high">
                              {primaryPhoto ? (
                                <Image
                                  alt={`${car.brand} ${car.model}`}
                                  className="object-cover"
                                  fill
                                  src={resolveListingPhotoUrl(primaryPhoto)}
                                />
                              ) : (
                                <div className="grid size-full place-items-center text-on-surface-variant">
                                  <Car className="size-5" />
                                </div>
                              )}
                            </div>
                            <div>
                              <h3 className="text-[1.05rem] font-semibold text-on-surface">
                                {car.brand} {car.model}
                              </h3>
                              <p className="text-xs text-on-surface-variant">
                                {car.year} · {car.transmission} · {car.location}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 pr-4">
                          <span className="inline-block rounded-md border border-outline-variant bg-surface px-2 py-1 font-mono text-xs uppercase tracking-[0.12em] text-on-surface">
                            {car.plateNumber}
                          </span>
                        </td>
                        <td className="py-5 pr-4">
                          <Link
                            className="text-sm font-medium text-primary hover:underline"
                            href={`/owners/${car.owner.id}`}
                          >
                            {car.owner.fullName}
                          </Link>
                        </td>
                        <td className="py-5 pr-4 text-sm font-semibold text-primary">
                          {peso.format(car.dailyPrice)}
                        </td>
                        <td className="max-w-[180px] truncate py-5 pr-4 text-sm text-on-surface-variant">
                          {car.availabilitySummary || "Not set"}
                        </td>
                        <td className="py-5 pr-4">
                          <span
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
                              statusBadgeStyles[car.status] ?? defaultBadge,
                            )}
                          >
                            {car.status}
                          </span>
                        </td>
                        <td className="py-5 pr-4 text-sm text-on-surface-variant">
                          {format(new Date(car.createdAt), "MMM d, yyyy")}
                        </td>
                        <td className="rounded-r-xl py-5 pr-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/car-listings/${car.id}`}
                              className="inline-flex items-center gap-2 rounded-xl bg-surface-container-highest px-3 py-2 text-sm font-semibold text-surface-tint"
                            >
                              <Eye className="size-4" />
                              View
                            </Link>
                            {car.status === ListingStatus.PENDING_APPROVAL ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-on-secondary-fixed-variant">
                                <CheckCircle2 className="size-3" />
                                Needs review
                              </span>
                            ) : null}
                          </div>
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

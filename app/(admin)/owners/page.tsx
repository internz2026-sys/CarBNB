import Link from "next/link";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  CircleAlert,
  Eye,
  Plus,
  Search,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { OwnerStatus } from "@/types";
import { cn } from "@/lib/utils";

// Admin data must reflect the live DB. Without this, Next.js statically
// pre-renders the page at build time and new signups won't appear.
export const dynamic = "force-dynamic";

// URL-friendly status keys → canonical enum values stored in DB
const STATUS_FILTERS: { key: string; label: string; value: OwnerStatus }[] = [
  { key: "pending", label: "Pending", value: OwnerStatus.PENDING },
  { key: "verified", label: "Verified", value: OwnerStatus.VERIFIED },
  { key: "suspended", label: "Suspended", value: OwnerStatus.SUSPENDED },
];

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const statusBadgeStyles: Record<string, string> = {
  [OwnerStatus.VERIFIED]: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  [OwnerStatus.PENDING]: "bg-secondary-container text-on-secondary-fixed-variant",
  [OwnerStatus.SUSPENDED]: "bg-error-container text-on-error-container",
  [OwnerStatus.REJECTED]: "bg-error-container text-on-error-container",
  [OwnerStatus.INACTIVE]: "bg-surface-container-highest text-on-surface-variant",
};

const defaultStatusBadgeStyle = "bg-surface-container-highest text-on-surface-variant";

function getOwnerInitials(fullName: string) {
  return fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default async function OwnersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const { search, status } = await searchParams;
  const trimmedSearch = search?.trim() ?? "";
  const activeStatus = STATUS_FILTERS.find((s) => s.key === status);

  // Filtered owners drive the directory list; unfiltered drive the top-level
  // stats + verification queue so those metrics stay consistent as admins
  // narrow down who they're browsing.
  const where: Prisma.OwnerWhereInput = {};
  if (trimmedSearch) {
    where.OR = [
      { fullName: { contains: trimmedSearch, mode: "insensitive" } },
      { email: { contains: trimmedSearch, mode: "insensitive" } },
      { contactNumber: { contains: trimmedSearch } },
    ];
  }
  if (activeStatus) {
    where.status = activeStatus.value;
  }

  const [allOwners, filteredOwners] = await Promise.all([
    db.owner.findMany({ orderBy: { createdAt: "desc" } }),
    db.owner.findMany({ where, orderBy: { createdAt: "desc" } }),
  ]);

  const totalOwners = allOwners.length;
  const verifiedOwners = allOwners.filter(
    (owner) => owner.status === OwnerStatus.VERIFIED
  ).length;
  const totalFleetUnits = allOwners.reduce((sum, owner) => sum + owner.carsCount, 0);
  const totalOwnerEarnings = allOwners.reduce(
    (sum, owner) => sum + owner.totalEarnings,
    0
  );
  const averageOwnerEarnings = totalOwners > 0 ? totalOwnerEarnings / totalOwners : 0;
  const payoutReadyOwners = allOwners.filter((owner) => Boolean(owner.bankDetails)).length;
  const needsAttention = allOwners.filter((owner) =>
    (
      [OwnerStatus.PENDING, OwnerStatus.SUSPENDED, OwnerStatus.REJECTED] as string[]
    ).includes(owner.status)
  );

  const isFiltered = Boolean(trimmedSearch || activeStatus);

  const verificationQueue = needsAttention.slice(0, 3);

  return (
    <>
      <section className="rounded-[2rem] bg-[linear-gradient(180deg,#faf8ff_0%,#eaedff_100%)] px-5 py-6 shadow-[0_8px_40px_rgb(19_27_46_/_0.06)] sm:px-7 sm:py-7">
        <div className="space-y-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl xl:text-[2.5rem] xl:leading-tight">
                Owner Management
              </h1>
              <p className="mt-2 text-base font-medium text-on-surface-variant sm:text-lg">
                Curate partner profiles, verify onboarding documents, and monitor
                fleet readiness.
              </p>
            </div>

            <Link
              href="/owners/new"
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#003d9b_0%,#0052cc_100%)] px-5 py-3 text-sm font-semibold text-on-primary shadow-[0_8px_40px_rgb(19_27_46_/_0.06)] transition hover:opacity-95"
            >
              <Plus className="size-4" />
              Add Owner
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]">
            <article className="flex min-h-[10rem] flex-col justify-between rounded-xl bg-surface-container-lowest px-7 py-6 shadow-[0_8px_32px_rgb(19_27_46_/_0.06)]">
              <div>
                <p className="text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                  Total Owners
                </p>
                <h2 className="mt-4 font-headline text-[2.5rem] font-extrabold leading-none text-on-surface">
                  {totalOwners}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-base font-semibold text-on-tertiary-fixed-variant">
                <Users className="size-4" />
                <span>{verifiedOwners} verified profiles</span>
              </div>
            </article>

            <article className="flex min-h-[10rem] flex-col justify-between rounded-xl bg-surface-container-lowest px-7 py-6 shadow-[0_8px_32px_rgb(19_27_46_/_0.06)]">
              <div>
                <p className="text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                  Fleet Units
                </p>
                <h2 className="mt-4 font-headline text-[2.5rem] font-extrabold leading-none text-on-surface">
                  {totalFleetUnits}
                </h2>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-tertiary-fixed px-4 py-2 text-sm font-semibold text-on-tertiary-fixed-variant">
                <BadgeCheck className="size-4" />
                Owner-backed listings
              </span>
            </article>

            <article className="flex min-h-[10rem] flex-col justify-between rounded-xl bg-[linear-gradient(135deg,#003d9b_0%,#0052cc_100%)] px-7 py-6 text-on-primary shadow-[0_8px_40px_rgb(19_27_46_/_0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-on-primary/80">
                    Owner Earnings
                  </p>
                  <h2 className="mt-3 font-headline text-[3.2rem] font-extrabold leading-none tracking-tight">
                    {peso.format(totalOwnerEarnings)}
                  </h2>
                </div>
                <div className="grid size-[3.25rem] place-items-center rounded-xl bg-white/16">
                  <Wallet className="size-7" />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-on-primary/85">
                <div>
                  <p className="text-sm">Average per Owner</p>
                  <p className="mt-1 text-[2rem] font-semibold text-on-primary">
                    {peso.format(averageOwnerEarnings)}
                  </p>
                </div>
                <div className="hidden h-11 w-0.5 rounded-full bg-white/25 sm:block" />
                <div>
                  <p className="text-sm">Payout Ready</p>
                  <p className="mt-1 text-[2rem] font-semibold text-on-primary">
                    {payoutReadyOwners}
                  </p>
                </div>
              </div>
            </article>

            <article className="flex min-h-[10rem] flex-col justify-between rounded-xl bg-surface-container-lowest px-7 py-6 shadow-[0_8px_32px_rgb(19_27_46_/_0.06)]">
              <div>
                <p className="text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                  Needs Attention
                </p>
                <h2 className="mt-4 font-headline text-[2.5rem] font-extrabold leading-none text-error">
                  {needsAttention.length}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-base font-semibold text-on-error-container">
                <AlertTriangle className="size-4" />
                <span>{allOwners.filter((owner) => owner.status === OwnerStatus.PENDING).length} pending review</span>
              </div>
            </article>
          </div>

          <div className="grid gap-5 2xl:grid-cols-[22rem_minmax(0,1fr)]">
            <section className="rounded-xl bg-surface-container p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between gap-3">
                <h2 className="font-headline text-[1.75rem] font-bold tracking-tight text-on-surface">
                  Verification Queue
                </h2>
                <button
                  className="border-none bg-transparent text-sm font-semibold uppercase tracking-wide text-primary"
                  type="button"
                >
                  View All
                </button>
              </div>

              <div className="space-y-5">
                {verificationQueue.map((owner) => {
                  const isPending = owner.status === OwnerStatus.PENDING;

                  return (
                    <article
                      key={owner.id}
                      className="rounded-xl bg-surface-container-lowest p-5 shadow-[0_8px_28px_rgb(19_27_46_/_0.06)]"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "grid size-12 shrink-0 place-items-center rounded-xl",
                            isPending
                              ? "bg-secondary-container text-on-secondary-fixed-variant"
                              : "bg-error-container text-on-error-container"
                          )}
                        >
                          {isPending ? (
                            <ShieldCheck className="size-6" />
                          ) : (
                            <CircleAlert className="size-6" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-[1.15rem] font-semibold text-on-surface">
                                {owner.fullName}
                              </h3>
                              <p className="mt-1 text-sm text-on-surface-variant">
                                {isPending
                                  ? "Onboarding documents awaiting verification"
                                  : owner.remarks || "Profile requires admin attention"}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
                                statusBadgeStyles[owner.status]
                              )}
                            >
                              {owner.status}
                            </span>
                          </div>

                          <div className="mt-4 space-y-2 text-sm text-on-surface-variant">
                            <p>{owner.contactNumber}</p>
                            <p>{owner.email}</p>
                          </div>

                          <div className="mt-5 flex flex-wrap gap-3">
                            <Link
                              href={`/owners/${owner.id}`}
                              className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#003d9b_0%,#0052cc_100%)] px-4 py-2 text-sm font-semibold text-on-primary transition hover:opacity-95"
                            >
                              <Eye className="size-4" />
                              Review
                            </Link>
                            <button
                              className="rounded-xl border-none bg-surface-container-highest px-4 py-2 text-sm font-semibold text-surface-tint transition hover:bg-primary-fixed"
                              type="button"
                            >
                              Contact Owner
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl bg-surface-container-lowest p-6 shadow-[0_8px_32px_rgb(19_27_46_/_0.06)] sm:p-8">
              <div className="mb-8 flex flex-col gap-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="font-headline text-[1.75rem] font-bold tracking-tight text-on-surface">
                      Owner Directory
                    </h2>
                    <p className="text-[1.02rem] text-on-surface-variant">
                      Browse partner accounts, fleet counts, and verification status.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="rounded-full bg-surface-container-highest px-4 py-2 text-sm font-semibold text-on-surface-variant">
                      ALL OWNERS
                    </span>
                    <span className="rounded-full bg-primary-fixed px-4 py-2 text-sm font-semibold text-primary">
                      LIVE ROSTER
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <form
                    action="/owners"
                    className="relative w-full max-w-md"
                    method="GET"
                  >
                    {activeStatus ? (
                      <input name="status" type="hidden" value={activeStatus.key} />
                    ) : null}
                    <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      className="h-11 w-full rounded-full bg-surface-container-low pl-11 pr-4 text-sm text-on-surface outline-none"
                      defaultValue={trimmedSearch}
                      name="search"
                      placeholder="Search owners, email, or contact number..."
                      type="text"
                    />
                  </form>

                  <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <Link
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-semibold",
                        !activeStatus
                          ? "bg-surface-container-highest text-on-surface"
                          : "bg-surface text-on-surface-variant"
                      )}
                      href={{
                        pathname: "/owners",
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
                              : "bg-surface text-on-surface-variant"
                          )}
                          href={{ pathname: "/owners", query }}
                          key={opt.key}
                        >
                          {opt.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>

              {filteredOwners.length === 0 ? (
                <div className="rounded-xl bg-surface-container-low p-8 text-center">
                  <p className="text-base font-semibold text-on-surface">
                    No owners match your filters
                  </p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {isFiltered
                      ? "Try clearing the search or status filter above."
                      : "No owners exist yet — add one using the button above."}
                  </p>
                </div>
              ) : null}

              <div className="space-y-4 md:hidden">
                {filteredOwners.map((owner) => (
                  <article
                    key={owner.id}
                    className="rounded-xl bg-surface px-4 py-4 shadow-[0_8px_28px_rgb(19_27_46_/_0.06)]"
                  >
                    <div className="flex items-start gap-4">
                      <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-surface-container-high text-sm font-semibold text-primary">
                        {getOwnerInitials(owner.fullName)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-on-surface">
                              {owner.fullName}
                            </h3>
                            <p className="font-mono text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                              {owner.id}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
                              statusBadgeStyles[owner.status]
                            )}
                          >
                            {owner.status}
                          </span>
                        </div>

                        <div className="mt-3 space-y-1 text-sm text-on-surface-variant">
                          <p>{owner.contactNumber}</p>
                          <p className="break-all">{owner.email}</p>
                        </div>

                        <div className="mt-4 flex items-center justify-between text-sm">
                          <span className="text-on-surface-variant">
                            {owner.carsCount} listed cars
                          </span>
                          <span className="font-semibold text-primary">
                            {peso.format(owner.totalEarnings)}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <Link
                            href={`/owners/${owner.id}`}
                            className="inline-flex items-center gap-2 rounded-xl bg-surface-container-highest px-4 py-2 text-sm font-semibold text-surface-tint"
                          >
                            <Eye className="size-4" />
                            View
                          </Link>
                          <button
                            className="inline-flex items-center gap-2 rounded-xl bg-surface-container px-4 py-2 text-sm font-semibold text-on-surface-variant"
                            type="button"
                          >
                            <ArrowUpRight className="size-4" />
                            Update
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-hidden md:block">
                <table className="w-full border-separate border-spacing-y-3 text-left">
                  <thead>
                    <tr className="text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
                      <th className="pb-3 font-semibold">Owner</th>
                      <th className="pb-3 font-semibold">Contact</th>
                      <th className="pb-3 font-semibold">Fleet</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Joined</th>
                      <th className="pb-3 text-right font-semibold">Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOwners.map((owner, index) => (
                      <tr
                        key={owner.id}
                        className={cn(
                          "align-middle transition",
                          index % 2 === 0 ? "bg-surface" : "bg-surface-container-low"
                        )}
                      >
                        <td className="rounded-l-xl py-6 pl-4 pr-4">
                          <div className="flex items-center gap-4">
                            <div className="grid size-12 place-items-center rounded-xl bg-surface-container-high text-sm font-semibold text-primary">
                              {getOwnerInitials(owner.fullName)}
                            </div>
                            <div>
                              <h3 className="text-[1.05rem] font-semibold text-on-surface">
                                {owner.fullName}
                              </h3>
                              <p className="font-mono text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                                {owner.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 pr-4">
                          <div className="space-y-1">
                            <p className="text-[1.02rem] text-on-surface">
                              {owner.contactNumber}
                            </p>
                            <p className="text-sm text-on-surface-variant">
                              {owner.email}
                            </p>
                          </div>
                        </td>
                        <td className="py-6 pr-4 text-[1.02rem] text-on-surface">
                          {owner.carsCount} cars
                        </td>
                        <td className="py-6 pr-4">
                          <span
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
                              statusBadgeStyles[owner.status]
                            )}
                          >
                            {owner.status}
                          </span>
                        </td>
                        <td className="py-6 pr-4 text-[1.02rem] text-on-surface">
                          {format(new Date(owner.createdAt), "MMM d, yyyy")}
                        </td>
                        <td className="rounded-r-xl py-6 pr-4 text-right">
                          <div className="flex items-center justify-end gap-4">
                            <div className="text-right">
                              <p className="text-[1.05rem] font-semibold text-primary">
                                {peso.format(owner.totalEarnings)}
                              </p>
                              <p className="text-sm text-on-surface-variant">
                                {owner.bankDetails ? "Payout ready" : "Missing payout method"}
                              </p>
                            </div>
                            <Link
                              href={`/owners/${owner.id}`}
                              className="inline-flex items-center gap-2 rounded-xl bg-surface-container-highest px-3 py-2 text-sm font-semibold text-surface-tint"
                            >
                              <Eye className="size-4" />
                              View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}

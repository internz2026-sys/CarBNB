import Link from "next/link";
import { format } from "date-fns";
import { Building2, Car, CalendarClock, Wallet, ShieldAlert, ShieldCheck } from "lucide-react";

import { db } from "@/lib/db";
import { BookingStatus, ListingStatus } from "@/types";
import { getCurrentHost } from "@/lib/current-host";
import { FleetRequestActions } from "./fleet-request-actions";

export const dynamic = "force-dynamic";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export default async function HostDashboardPage() {
  const session = await getCurrentHost();
  if (session.kind !== "verified" && session.kind !== "pending" && session.kind !== "suspended") {
    // layout already redirects anonymous / not-host, but narrow the type
    return null;
  }

  if (session.kind === "pending") {
    return <LockedState variant="pending" fullName={session.owner.fullName} />;
  }
  if (session.kind === "suspended") {
    return <LockedState variant="suspended" fullName={session.owner.fullName} />;
  }

  const ownerId = session.owner.id;
  const isFleet = session.owner.kind === "FLEET";
  const displayName =
    isFleet && session.owner.companyName
      ? session.owner.companyName
      : session.owner.fullName;

  const [
    activeListings,
    upcomingBookings,
    earningsAgg,
    managedCarsCount,
    pendingFleetRequests,
    activeOutgoingLink,
    incomingPendingRequests,
  ] = await Promise.all([
    db.carListing.count({
      where: { ownerId, status: ListingStatus.ACTIVE },
    }),
    db.booking.count({
      where: {
        ownerId,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.ONGOING],
        },
      },
    }),
    db.booking.aggregate({
      where: { ownerId, status: BookingStatus.COMPLETED },
      _sum: { ownerPayout: true },
    }),
    // FLEET-only: how many cars are currently managed via active links
    isFleet
      ? db.fleetCarLink.count({
          where: { fleetId: ownerId, status: "ACTIVE" },
        })
      : Promise.resolve(0),
    // FLEET-only: incoming pending requests
    isFleet
      ? db.fleetCarLink.count({
          where: { fleetId: ownerId, status: "PENDING" },
        })
      : Promise.resolve(0),
    // INDIVIDUAL-only: the outgoing pending request count (for completeness)
    !isFleet
      ? db.fleetCarLink.count({
          where: {
            listing: { ownerId },
            status: "PENDING",
          },
        })
      : Promise.resolve(0),
    // FLEET-only: list of pending requests with the actual rows so we can
    // render approve/reject inline on the dashboard
    isFleet
      ? db.fleetCarLink.findMany({
          where: { fleetId: ownerId, status: "PENDING" },
          orderBy: { requestedAt: "asc" },
          include: {
            listing: {
              select: {
                id: true,
                brand: true,
                model: true,
                plateNumber: true,
                year: true,
                owner: { select: { id: true, fullName: true } },
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const totalEarnings = earningsAgg._sum.ownerPayout ?? 0;

  return (
    <div className="pb-8">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
          Welcome, {displayName.split(" ")[0]}
        </h1>
        <p className="mt-2 text-base text-on-surface-variant">
          {isFleet
            ? "Here's a quick look at your operations and incoming link requests."
            : "Here's a quick look at your fleet and activity."}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Tile
          accent="primary"
          href="/host/cars"
          icon={<Car className="size-5" />}
          label={isFleet ? "Cars Under Management" : "Active Listings"}
          sub={isFleet ? `Owned + ${managedCarsCount} linked` : "Tap to manage"}
          value={
            isFleet
              ? String(activeListings + managedCarsCount)
              : String(activeListings)
          }
        />
        <Tile
          accent="surface"
          href="/host/bookings"
          icon={<CalendarClock className="size-5" />}
          label="Upcoming Bookings"
          sub="Pending + confirmed + ongoing"
          value={String(upcomingBookings)}
        />
        <Tile
          accent="surface"
          href="/host/bookings?status=completed"
          icon={<Wallet className="size-5" />}
          label="Total Earnings"
          sub="From completed rentals"
          value={peso.format(totalEarnings)}
        />
      </div>

      {/* FLEET — incoming link requests */}
      {isFleet ? (
        <section className="mt-10">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="font-headline text-xl font-bold text-on-surface">
              Incoming link requests
            </h2>
            <span className="text-xs text-on-surface-variant">
              {pendingFleetRequests} pending
            </span>
          </div>
          {incomingPendingRequests.length === 0 ? (
            <div className="rounded-2xl bg-surface-container-low p-8 text-center">
              <Building2 className="mx-auto mb-3 size-6 text-on-surface-variant" />
              <p className="text-sm font-semibold text-on-surface">
                No incoming requests right now
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                Independent owners can request to link their cars to your fleet from{" "}
                <Link className="text-primary hover:underline" href="/fleets">
                  /fleets
                </Link>
                .
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {incomingPendingRequests.map((req) => (
                <li
                  className="flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-[0_6px_20px_rgb(19_27_46_/_0.04)] sm:flex-row sm:items-center sm:justify-between"
                  key={req.id}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">
                      {req.listing.year} · plate {req.listing.plateNumber}
                    </p>
                    <h3 className="truncate font-headline text-base font-bold text-on-surface">
                      {req.listing.brand} {req.listing.model}
                    </h3>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Requested by{" "}
                      <Link
                        className="text-primary hover:underline"
                        href={`/hosts/${req.listing.owner.id}`}
                      >
                        {req.listing.owner.fullName}
                      </Link>{" "}
                      · {format(req.requestedAt, "MMM d, yyyy")}
                      {req.managementFeePercent !== null
                        ? ` · proposed fee ${req.managementFeePercent}%`
                        : ""}
                    </p>
                  </div>
                  <FleetRequestActions linkId={req.id} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {/* INDIVIDUAL — outgoing pending requests count */}
      {!isFleet && activeOutgoingLink > 0 ? (
        <section className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold flex items-center gap-2">
            <Building2 className="size-4" />
            {activeOutgoingLink} pending fleet request
            {activeOutgoingLink === 1 ? "" : "s"}
          </p>
          <p className="mt-1 text-xs">
            Visit{" "}
            <Link className="text-primary hover:underline" href="/host/cars">
              My Cars
            </Link>
            {" "}to track or cancel pending fleet-management requests on your listings.
          </p>
        </section>
      ) : null}
    </div>
  );
}

function Tile({
  accent,
  href,
  icon,
  label,
  sub,
  value,
}: {
  accent: "primary" | "surface";
  href: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
  value: string;
}) {
  const isPrimary = accent === "primary";
  return (
    <Link
      className={
        isPrimary
          ? "flex min-h-[10rem] flex-col justify-between rounded-2xl bg-[linear-gradient(135deg,#003d9b_0%,#0052cc_100%)] px-6 py-5 text-on-primary shadow-[0_8px_32px_rgb(19_27_46_/_0.08)] transition hover:opacity-95"
          : "flex min-h-[10rem] flex-col justify-between rounded-2xl bg-surface-container-lowest px-6 py-5 shadow-[0_8px_32px_rgb(19_27_46_/_0.06)] transition hover:shadow-[0_12px_40px_rgb(19_27_46_/_0.1)]"
      }
      href={href}
    >
      <div>
        <div className="flex items-center justify-between">
          <p
            className={
              isPrimary
                ? "text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-on-primary/80"
                : "text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-on-surface-variant"
            }
          >
            {label}
          </p>
          <span
            className={
              isPrimary
                ? "grid size-8 place-items-center rounded-full bg-white/15 text-on-primary"
                : "grid size-8 place-items-center rounded-full bg-surface-container text-on-surface-variant"
            }
          >
            {icon}
          </span>
        </div>
        <h2
          className={
            isPrimary
              ? "mt-3 font-headline text-[2.25rem] font-extrabold leading-none tracking-tight"
              : "mt-3 font-headline text-[2.25rem] font-extrabold leading-none text-on-surface"
          }
        >
          {value}
        </h2>
      </div>
      <span
        className={
          isPrimary
            ? "text-sm font-semibold text-on-primary/90"
            : "text-sm font-semibold text-on-surface-variant"
        }
      >
        {sub}
      </span>
    </Link>
  );
}

function LockedState({
  variant,
  fullName,
}: {
  variant: "pending" | "suspended";
  fullName: string;
}) {
  const isPending = variant === "pending";
  return (
    <div className="mx-auto max-w-xl pt-8">
      <div className="rounded-2xl bg-surface-container-lowest p-8 text-center shadow-[0_8px_32px_rgb(19_27_46_/_0.06)]">
        <div
          className={
            isPending
              ? "mx-auto grid size-14 place-items-center rounded-full bg-amber-100 text-amber-700"
              : "mx-auto grid size-14 place-items-center rounded-full bg-red-100 text-red-700"
          }
        >
          {isPending ? (
            <ShieldCheck className="size-7" />
          ) : (
            <ShieldAlert className="size-7" />
          )}
        </div>
        <h1 className="mt-5 font-headline text-2xl font-extrabold text-on-surface">
          {isPending ? "Your host account is under review" : "Your host account is suspended"}
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          {isPending
            ? `Hi ${fullName.split(" ")[0]}, thanks for signing up! An admin will verify your documents shortly. You'll be able to list vehicles once approved.`
            : `Hi ${fullName.split(" ")[0]}, your host account has been suspended. Please contact support to reactivate.`}
        </p>
        <div className="mt-6 rounded-xl bg-surface-container-low p-4 text-left text-sm text-on-surface-variant">
          <p className="font-semibold text-on-surface">What happens next?</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {isPending ? (
              <>
                <li>Admin reviews your account details.</li>
                <li>You&apos;ll receive an email once your account is verified.</li>
                <li>After approval you can list cars and accept bookings.</li>
              </>
            ) : (
              <>
                <li>Contact admin to understand the reason for suspension.</li>
                <li>Resolve the outstanding concern (documents, incident, etc.).</li>
                <li>Admin can reactivate your account once resolved.</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

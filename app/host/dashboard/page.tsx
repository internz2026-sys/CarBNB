import Link from "next/link";
import { Car, CalendarClock, Wallet, ShieldAlert, ShieldCheck } from "lucide-react";

import { db } from "@/lib/db";
import { BookingStatus, ListingStatus } from "@/types";
import { getCurrentHost } from "@/lib/current-host";

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

  const [activeListings, upcomingBookings, earningsAgg] = await Promise.all([
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
  ]);

  const totalEarnings = earningsAgg._sum.ownerPayout ?? 0;

  return (
    <div className="pb-8">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
          Welcome, {session.owner.fullName.split(" ")[0]}
        </h1>
        <p className="mt-2 text-base text-on-surface-variant">
          Here&apos;s a quick look at your fleet and activity.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Tile
          accent="primary"
          href="/host/cars"
          icon={<Car className="size-5" />}
          label="Active Listings"
          sub="Tap to manage"
          value={String(activeListings)}
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

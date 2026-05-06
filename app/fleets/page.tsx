import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Building2, MapPin, ShieldCheck } from "lucide-react";

import { db } from "@/lib/db";
import { ListingStatus, OwnerStatus } from "@/types";
import { getCurrentViewer } from "@/lib/current-user";
import { UserMenu } from "@/components/layout/user-menu";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fleet Operators | DriveXP",
  description:
    "Browse registered car rental operators on DriveXP. Independent owners can request to link their car to a fleet for managed bookings.",
};

function getOwnerInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default async function FleetsDirectoryPage() {
  const fleets = await db.owner.findMany({
    where: {
      kind: "FLEET",
      status: OwnerStatus.VERIFIED,
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      companyName: true,
      fullName: true,
      bio: true,
      serviceArea: true,
      createdAt: true,
      _count: {
        select: {
          cars: { where: { status: ListingStatus.ACTIVE } },
          managedLinks: { where: { status: "ACTIVE" } },
        },
      },
    },
  });

  const viewer = await getCurrentViewer();

  return (
    <div className="min-h-screen bg-surface pb-20 font-sans">
      <header className="sticky top-0 z-30 bg-[rgb(250_248_255_/_0.85)] shadow-[0_8px_24px_rgb(19_27_46_/_0.04)] backdrop-blur-lg">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
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
          <div className="flex items-center gap-5">
            {viewer.kind === "customer" ? (
              <UserMenu
                fullName={viewer.fullName}
                links={[
                  { label: "My bookings", href: "/account" },
                  { label: "Favorites", href: "/account/favorites" },
                ]}
                roleLabel="Customer"
              />
            ) : viewer.kind === "admin" ? (
              <UserMenu
                fullName={viewer.fullName ?? viewer.email}
                links={[{ label: "Admin dashboard", href: "/dashboard" }]}
                roleLabel="Admin"
              />
            ) : viewer.kind === "host" ? (
              <UserMenu
                fullName={viewer.fullName}
                links={[
                  { label: "Host dashboard", href: "/host/dashboard" },
                  { label: "My cars", href: "/host/cars" },
                  { label: "My bookings", href: "/host/bookings" },
                  { label: "Profile", href: "/host/profile" },
                ]}
                roleLabel="Host"
              />
            ) : (
              <>
                <Link className="text-sm font-semibold text-on-surface-variant hover:text-primary" href="/login">
                  Log in
                </Link>
                <Link
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary"
                  href="/signup"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
        <div className="mb-8">
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
            Fleet operators
          </h1>
          <p className="mt-2 max-w-2xl text-base text-on-surface-variant">
            Registered car rental operators on DriveXP. Independent owners can request to
            link their car to a fleet — once approved, the fleet manages bookings on the
            owner&apos;s behalf.
          </p>
        </div>

        {fleets.length === 0 ? (
          <div className="rounded-2xl bg-surface-container-low p-12 text-center">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Building2 className="size-6" />
            </div>
            <p className="text-lg font-semibold text-on-surface">
              No fleet operators yet
            </p>
            <p className="mt-2 text-sm text-on-surface-variant">
              No verified fleets are listed at the moment. Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {fleets.map((fleet) => {
              const displayName = fleet.companyName ?? fleet.fullName;
              const carCount = fleet._count.cars + fleet._count.managedLinks;
              return (
                <Link
                  className="group flex items-start gap-4 rounded-2xl bg-surface-container-lowest p-5 shadow-[0_8px_24px_rgb(19_27_46_/_0.04)] transition hover:shadow-[0_14px_36px_rgb(19_27_46_/_0.08)]"
                  href={`/hosts/${fleet.id}`}
                  key={fleet.id}
                >
                  <div className="relative shrink-0">
                    <div className="grid size-16 place-items-center rounded-full bg-[linear-gradient(135deg,var(--color-primary-fixed)_0%,var(--color-secondary-container)_100%)] text-base font-bold text-primary shadow-[0_8px_24px_rgb(19_27_46_/_0.06)]">
                      {getOwnerInitials(displayName)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-tertiary text-white ring-2 ring-surface-container-lowest">
                      <ShieldCheck className="size-3" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                      Verified operator
                    </p>
                    <h3 className="mt-0.5 truncate font-headline text-lg font-bold text-on-surface group-hover:text-primary">
                      {displayName}
                    </h3>
                    {fleet.serviceArea ? (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                        <MapPin className="size-3" />
                        {fleet.serviceArea}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Member since {format(fleet.createdAt, "MMMM yyyy")} ·{" "}
                      {carCount} {carCount === 1 ? "car" : "cars"} managed
                    </p>
                    {fleet.bio ? (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-on-surface-variant">
                        {fleet.bio}
                      </p>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

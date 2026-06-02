import { unstable_cache } from "next/cache";

import { db } from "@/lib/db";
import { BookingStatus, OwnerStatus, ListingStatus } from "@/types";

// ─────────────────────────────────────────────────────────────────────────
// Cached read-layer for viewer-independent public pages (landing + fleets
// directory). These queries return identical data for every visitor, so we
// cache the DB work and keep only the per-viewer header dynamic in the page.
//
// Invalidation: a 5-minute time fallback (REVALIDATE_SECONDS) bounds staleness,
// and the mutation actions that change this data call revalidateTag() with the
// tags below for near-instant updates. See app/actions/{host-profile,owners}.ts.
//
// NOTE: the cached functions must NOT read request-time data (cookies/headers)
// — unstable_cache forbids it. They only touch the DB. Return shapes are kept
// serialization-safe (numbers/strings/plain objects, dates as ISO strings) so
// nothing trips the cache serializer.
// ─────────────────────────────────────────────────────────────────────────

export const LANDING_CACHE_TAG = "landing-stats";
export const FLEETS_CACHE_TAG = "fleets-directory";

const REVALIDATE_SECONDS = 300; // 5 minutes

export type LandingPageData = {
  verifiedOwners: number;
  activeTrips: number;
  cityCoverage: number;
  totalHostEarnings: number;
  featured: {
    id: string;
    brand: string;
    model: string;
    year: number;
    transmission: string;
    seatingCapacity: number;
    location: string;
    dailyPrice: number;
    ownerName: string;
    photos: string[];
  }[];
  testimonialOwnerName: string | null;
  testimonialCustomerName: string | null;
};

export const getLandingPageData = unstable_cache(
  async (): Promise<LandingPageData> => {
    const [
      verifiedOwners,
      activeTrips,
      activeListings,
      distinctCities,
      hostEarningsAgg,
      testimonialOwner,
      testimonialCustomer,
    ] = await Promise.all([
      db.owner.count({ where: { status: OwnerStatus.VERIFIED } }),
      db.booking.count({
        where: {
          status: {
            in: [
              BookingStatus.COMPLETED,
              BookingStatus.CONFIRMED,
              BookingStatus.ONGOING,
            ],
          },
        },
      }),
      db.carListing.findMany({
        where: { status: ListingStatus.ACTIVE },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { owner: { select: { fullName: true, status: true } } },
      }),
      db.carListing.findMany({
        where: { status: ListingStatus.ACTIVE },
        select: { location: true },
      }),
      db.owner.aggregate({ _sum: { totalEarnings: true } }),
      db.owner.findFirst({
        where: { status: OwnerStatus.VERIFIED },
        orderBy: { createdAt: "asc" },
      }),
      db.customer.findFirst({ orderBy: { createdAt: "asc" } }),
    ]);

    return {
      verifiedOwners,
      activeTrips,
      cityCoverage: new Set(distinctCities.map((l) => l.location)).size,
      totalHostEarnings: hostEarningsAgg._sum.totalEarnings ?? 0,
      featured: activeListings.map((car) => ({
        id: car.id,
        brand: car.brand,
        model: car.model,
        year: car.year,
        transmission: car.transmission,
        seatingCapacity: car.seatingCapacity,
        location: car.location,
        dailyPrice: car.dailyPrice,
        ownerName: car.owner.fullName,
        photos: car.photos,
      })),
      testimonialOwnerName: testimonialOwner?.fullName ?? null,
      testimonialCustomerName: testimonialCustomer?.fullName ?? null,
    };
  },
  ["landing-page-data"],
  { tags: [LANDING_CACHE_TAG], revalidate: REVALIDATE_SECONDS },
);

export type FleetDirectoryEntry = {
  id: string;
  companyName: string | null;
  fullName: string;
  bio: string | null;
  serviceArea: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string; // ISO — cache-safe; page re-parses with new Date()
  carsCount: number;
};

export const getFleetsDirectory = unstable_cache(
  async (): Promise<FleetDirectoryEntry[]> => {
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
        latitude: true,
        longitude: true,
        createdAt: true,
        _count: {
          select: {
            cars: { where: { status: ListingStatus.ACTIVE } },
            managedLinks: { where: { status: "ACTIVE" } },
          },
        },
      },
    });

    return fleets.map((f) => ({
      id: f.id,
      companyName: f.companyName,
      fullName: f.fullName,
      bio: f.bio,
      serviceArea: f.serviceArea,
      latitude: f.latitude,
      longitude: f.longitude,
      createdAt: f.createdAt.toISOString(),
      carsCount: f._count.cars + f._count.managedLinks,
    }));
  },
  ["fleets-directory"],
  { tags: [FLEETS_CACHE_TAG], revalidate: REVALIDATE_SECONDS },
);

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { DayOfWeek, ListingStatus } from "@/types";
import { getCurrentHost } from "@/lib/current-host";
import { resolveListingPhotoUrl } from "@/lib/listing-assets";
import { getListingDocumentSignedUrl } from "@/lib/listing-documents";
import { EditHostListingForm } from "./edit-host-listing-form";
import { HostListingPhotoGallery } from "./host-listing-photo-gallery";
import { HostListingOrCrForm } from "./host-listing-or-cr-form";
import { HostAvailabilityRulesForm } from "./host-availability-rules-form";
import { HostAvailabilityExceptionsForm } from "./host-availability-exceptions-form";

export const dynamic = "force-dynamic";

const statusBadgeStyles: Record<string, string> = {
  [ListingStatus.ACTIVE]: "bg-emerald-100 text-emerald-700",
  [ListingStatus.PENDING_APPROVAL]: "bg-amber-100 text-amber-700",
  [ListingStatus.BOOKED]: "bg-blue-100 text-blue-700",
  [ListingStatus.SUSPENDED]: "bg-red-100 text-red-700",
  [ListingStatus.REJECTED]: "bg-red-100 text-red-700",
};

export default async function HostEditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCurrentHost();
  if (session.kind !== "verified") redirect("/host/dashboard");

  const { id } = await params;

  const listing = await db.carListing.findUnique({
    where: { id },
    include: {
      availabilityRules: true,
      exceptions: { orderBy: { date: "asc" } },
    },
  });

  // 404 covers both "listing doesn't exist" and "belongs to another host".
  if (!listing || listing.ownerId !== session.owner.id) {
    notFound();
  }

  const orCrSignedUrl = await getListingDocumentSignedUrl(listing.orCrDocumentUrl);

  const photos = listing.photos.map((path) => ({
    path,
    url: resolveListingPhotoUrl(path),
  }));

  const rulesByDay = new Map(listing.availabilityRules.map((r) => [r.dayOfWeek, r]));

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-2">
        <Link
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground -ml-3",
          )}
          href="/host/cars"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to My Cars
        </Link>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
            Edit {listing.brand} {listing.model}
          </h1>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
              statusBadgeStyles[listing.status] ?? "bg-gray-100 text-gray-700",
            )}
          >
            {listing.status}
          </span>
        </div>
        <p className="mt-2 text-base text-on-surface-variant">
          Plate: <span className="font-mono">{listing.plateNumber}</span> ·{" "}
          {listing.status === ListingStatus.PENDING_APPROVAL
            ? "Waiting on admin approval. Keep filling out photos, OR/CR, and availability."
            : "Changes save instantly and do not require re-approval."}
        </p>
      </div>

      <EditHostListingForm
        listing={{
          id: listing.id,
          brand: listing.brand,
          model: listing.model,
          year: listing.year,
          color: listing.color,
          transmission: listing.transmission,
          fuelType: listing.fuelType,
          vehicleType: listing.vehicleType,
          features: listing.features,
          seatingCapacity: listing.seatingCapacity,
          location: listing.location,
          dailyPrice: listing.dailyPrice,
          description: listing.description,
          plateNumber: listing.plateNumber,
        }}
      />

      <HostListingPhotoGallery listingId={listing.id} photos={photos} />

      <HostListingOrCrForm
        listingId={listing.id}
        orCrPath={listing.orCrDocumentUrl}
        signedUrl={orCrSignedUrl}
      />

      <HostAvailabilityRulesForm
        listingId={listing.id}
        rules={Array.from(rulesByDay.entries()).map(([day, r]) => ({
          dayOfWeek: day as DayOfWeek,
          isAvailable: r.isAvailable,
          startTime: r.startTime,
          endTime: r.endTime,
        }))}
      />

      <HostAvailabilityExceptionsForm
        listingId={listing.id}
        exceptions={listing.exceptions.map((ex) => ({
          id: ex.id,
          date: ex.date.toISOString().slice(0, 10),
          isAvailable: ex.isAvailable,
          reason: ex.reason,
        }))}
      />
    </div>
  );
}

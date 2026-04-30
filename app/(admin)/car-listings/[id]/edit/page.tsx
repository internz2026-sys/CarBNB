import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { DayOfWeek } from "@/types";
import { resolveListingPhotoUrl } from "@/lib/listing-assets";
import { getListingDocumentSignedUrl } from "@/lib/listing-documents";
import { EditListingForm } from "./edit-listing-form";
import { ListingPhotoGallery } from "./listing-photo-gallery";
import { ListingOrCrForm } from "./listing-or-cr-form";
import { AvailabilityRulesForm } from "./availability-rules-form";
import { AvailabilityExceptionsForm } from "./availability-exceptions-form";

export const dynamic = "force-dynamic";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const listing = await db.carListing.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, fullName: true, email: true } },
      availabilityRules: true,
      exceptions: { orderBy: { date: "asc" } },
    },
  });

  if (!listing) {
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
          href={`/car-listings/${listing.id}`}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Listing
        </Link>
      </div>

      <PageHeader
        title={`Edit ${listing.brand} ${listing.model}`}
        description={`Owner: ${listing.owner.fullName} · Plate: ${listing.plateNumber}`}
      />

      <EditListingForm listing={{
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
        notes: listing.notes,
        plateNumber: listing.plateNumber,
      }} />

      <ListingPhotoGallery listingId={listing.id} photos={photos} />

      <ListingOrCrForm
        listingId={listing.id}
        orCrPath={listing.orCrDocumentUrl}
        signedUrl={orCrSignedUrl}
      />

      <AvailabilityRulesForm
        listingId={listing.id}
        rules={Array.from(rulesByDay.entries()).map(([day, r]) => ({
          dayOfWeek: day as DayOfWeek,
          isAvailable: r.isAvailable,
          startTime: r.startTime,
          endTime: r.endTime,
        }))}
      />

      <AvailabilityExceptionsForm
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

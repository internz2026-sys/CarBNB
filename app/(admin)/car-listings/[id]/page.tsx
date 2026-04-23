import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Car,
  CheckCircle2,
  Edit,
  FileText,
  MapPin,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { ListingStatus } from "@/types";
import { resolveListingPhotoUrl } from "@/lib/listing-assets";
import { getListingDocumentSignedUrl } from "@/lib/listing-documents";
import { ListingStatusActions } from "./status-actions";

export const dynamic = "force-dynamic";

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

export default async function CarListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const listing = await db.carListing.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, fullName: true, email: true, contactNumber: true, status: true } },
      availabilityRules: { orderBy: { dayOfWeek: "asc" } },
      exceptions: { orderBy: { date: "asc" } },
    },
  });

  if (!listing) {
    notFound();
  }

  const orCrSignedUrl = await getListingDocumentSignedUrl(listing.orCrDocumentUrl);

  const primaryPhoto = listing.photos[0];
  const photoUrls = listing.photos.map(resolveListingPhotoUrl);
  const primaryPhotoUrl = photoUrls[0] ?? null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-2 mb-2">
        <Link
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground -ml-3",
          )}
          href="/car-listings"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Listings
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {listing.brand} {listing.model} {listing.year}
            </h1>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
                statusBadgeStyles[listing.status] ?? "bg-muted text-muted-foreground",
              )}
            >
              {listing.status}
            </span>
          </div>
          <p className="text-muted-foreground flex flex-wrap items-center gap-2">
            <span className="inline-block rounded-md border border-outline-variant bg-surface px-2 py-0.5 font-mono text-xs uppercase tracking-[0.12em] text-on-surface">
              {listing.plateNumber}
            </span>
            <span>·</span>
            <span>Added {format(new Date(listing.createdAt), "MMMM d, yyyy")}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <ListingStatusActions listingId={listing.id} status={listing.status} />
          <Link
            className={cn(buttonVariants({ variant: "outline" }), "shadow-sm")}
            href={`/car-listings/${listing.id}/edit`}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Listing
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="overflow-hidden border-border/50 shadow-sm">
            <div className="relative aspect-[4/3] bg-muted w-full">
              {primaryPhotoUrl ? (
                <Image
                  alt={`${listing.brand} ${listing.model}`}
                  className="object-cover"
                  fill
                  priority
                  src={primaryPhotoUrl}
                />
              ) : (
                <div className="grid size-full place-items-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2 text-sm">
                    <Car className="w-8 h-8 opacity-40" />
                    <span>No photos yet</span>
                  </div>
                </div>
              )}
            </div>
            {photoUrls.length > 1 ? (
              <div className="grid grid-cols-4 gap-1 p-1 bg-muted/30">
                {photoUrls.slice(1, 5).map((url, i) => (
                  <div
                    className="aspect-[4/3] relative bg-muted rounded-sm overflow-hidden border border-border"
                    key={`${primaryPhoto}-${i}`}
                  >
                    <Image
                      alt={`Photo ${i + 2}`}
                      className="object-cover"
                      fill
                      src={url}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 border-b border-border bg-muted/20">
              <CardTitle className="text-sm font-semibold">Owner</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm">
              <Link
                className="block text-base font-semibold text-primary hover:underline"
                href={`/owners/${listing.owner.id}`}
              >
                {listing.owner.fullName}
              </Link>
              <div className="space-y-1 text-muted-foreground">
                <p>{listing.owner.email}</p>
                <p>{listing.owner.contactNumber}</p>
                <p className="pt-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-tertiary-fixed px-2 py-0.5 text-xs font-semibold text-on-tertiary-fixed-variant">
                    <CheckCircle2 className="w-3 h-3" />
                    {listing.owner.status}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 border-b border-border bg-emerald-500/5">
              <CardTitle className="text-sm font-semibold text-emerald-700">
                Daily Rate
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-3xl font-bold tracking-tight text-emerald-600">
                {peso.format(listing.dailyPrice)}
                <span className="ml-1 text-xs text-muted-foreground font-normal">/day</span>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
              <SpecCell label="Transmission" value={listing.transmission} />
              <SpecCell label="Fuel Type" value={listing.fuelType} />
              <SpecCell label="Capacity" value={`${listing.seatingCapacity} Seats`} />
              <SpecCell label="Color" value={listing.color} />
            </div>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-sm text-muted-foreground">
              {listing.location}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-semibold">Description</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-sm text-muted-foreground whitespace-pre-wrap">
              {listing.description || "No description provided."}
            </CardContent>
          </Card>

          {listing.notes ? (
            <Card className="border-amber-200 shadow-sm bg-amber-50/40">
              <CardHeader className="pb-3 border-b border-amber-100">
                <CardTitle className="text-sm font-semibold text-amber-900">
                  Admin Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-sm text-amber-900 whitespace-pre-wrap">
                {listing.notes}
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Availability
              </CardTitle>
              <Link
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8")}
                href={`/car-listings/${listing.id}/edit`}
              >
                Edit schedule
              </Link>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm">
              <p className="font-medium text-foreground">
                {listing.availabilitySummary || "Weekly schedule not configured"}
              </p>
              {listing.exceptions.length > 0 ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    Upcoming exceptions
                  </p>
                  <ul className="space-y-1 text-muted-foreground">
                    {listing.exceptions.slice(0, 5).map((ex) => (
                      <li className="text-xs" key={ex.id}>
                        {format(new Date(ex.date), "MMM d, yyyy")} —{" "}
                        {ex.isAvailable ? "Available (one-off)" : "Blocked"}
                        {ex.reason ? ` (${ex.reason})` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                OR / CR Document
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-sm">
              {orCrSignedUrl ? (
                <a
                  className="text-primary hover:underline"
                  href={orCrSignedUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  View uploaded OR/CR (signed link, expires in 1 hour)
                </a>
              ) : (
                <p className="text-muted-foreground">No OR/CR uploaded yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SpecCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 flex flex-col gap-1 items-center justify-center text-center">
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

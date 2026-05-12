import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { DayOfWeek, ListingStatus, OwnerStatus } from "@/types";
import { getCurrentHost } from "@/lib/current-host";
import { resolveListingPhotoUrl } from "@/lib/listing-assets";
import { getListingDocumentSignedUrl } from "@/lib/listing-documents";
import { resolveListingAuthority } from "@/lib/host-listing-authority";
import { Building2 } from "lucide-react";
import { ListingWizardStepper } from "@/components/host/listing-wizard-stepper";
import { EditHostListingForm } from "./edit-host-listing-form";
import { HostListingPhotoGallery } from "./host-listing-photo-gallery";
import { HostListingOrCrForm } from "./host-listing-or-cr-form";
import { HostAvailabilityRulesForm } from "./host-availability-rules-form";
import { HostAvailabilityExceptionsForm } from "./host-availability-exceptions-form";
import { FleetLinkSection } from "./fleet-link-section";
import { SubmitForApprovalCta } from "./submit-for-approval-cta";

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
      owner: { select: { id: true, fullName: true, kind: true, companyName: true } },
    },
  });
  if (!listing) notFound();

  // Tier 16: a fleet operator with an ACTIVE link on this car can also
  // open the edit page (read-only on details, editable on availability).
  // Anyone else 404s.
  const authority = await resolveListingAuthority(id, session.owner.id);
  if (authority.kind === "none") notFound();
  const isFleetViewer = authority.kind === "fleet";
  const ownerName =
    listing.owner.kind === "FLEET" && listing.owner.companyName
      ? listing.owner.companyName
      : listing.owner.fullName;

  // Build a map of "who created each exception" so the form can render
  // "blocked by Joe" / "blocked by Acme Rentals". Tier 7-era rows have
  // null and render without a byline.
  const authorIds = Array.from(
    new Set(
      listing.exceptions
        .map((ex) => ex.addedByOwnerId)
        .filter((v): v is string => v !== null),
    ),
  );
  const authorRows =
    authorIds.length > 0
      ? await db.owner.findMany({
          where: { id: { in: authorIds } },
          select: { id: true, fullName: true, kind: true, companyName: true },
        })
      : [];
  const authorById = new Map(
    authorRows.map((a) => [
      a.id,
      a.kind === "FLEET" && a.companyName ? a.companyName : a.fullName,
    ]),
  );

  // The owner-only sections (details edit, photos, OR/CR) only render
  // when the current viewer is the literal listing owner. Fleet viewers
  // skip the document fetch + photo path resolution entirely.
  const orCrSignedUrl = isFleetViewer
    ? null
    : await getListingDocumentSignedUrl(listing.orCrDocumentUrl);

  const photos = isFleetViewer
    ? []
    : listing.photos.map((path) => ({
        path,
        url: resolveListingPhotoUrl(path),
      }));

  const rulesByDay = new Map(listing.availabilityRules.map((r) => [r.dayOfWeek, r]));

  // Tier 15: only INDIVIDUAL hosts on their OWN cars see the fleet-link
  // section. Fleets viewing their own owned cars or any linked car
  // don't need it (they're the destination, not the requester).
  const showFleetLinkSection =
    !isFleetViewer && session.owner.kind === "INDIVIDUAL";

  // Load any open or active link for this car + the directory of verified
  // fleets (only if we're going to render the section). Inline the parallel
  // load so the include relation type is correctly inferred — annotating the
  // let-binding above with the bare Awaited<...> type drops the `fleet`
  // relation from the inferred shape.
  const fleetState = showFleetLinkSection
    ? await Promise.all([
        db.fleetCarLink.findFirst({
          where: {
            listingId: listing.id,
            status: { in: ["PENDING", "ACTIVE"] },
          },
          include: {
            fleet: { select: { id: true, companyName: true, fullName: true } },
          },
        }),
        db.owner.findMany({
          where: { kind: "FLEET", status: OwnerStatus.VERIFIED },
          select: {
            id: true,
            companyName: true,
            fullName: true,
            bio: true,
            serviceArea: true,
            latitude: true,
            longitude: true,
            carsCount: true,
          },
          orderBy: { createdAt: "asc" },
        }),
      ])
    : null;

  const fleetLink = fleetState?.[0] ?? null;
  const fleetOptions = fleetState?.[1] ?? [];

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
            {isFleetViewer ? "Manage" : "Edit"} {listing.brand} {listing.model}
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
          {isFleetViewer
            ? `Owned by ${ownerName}. You can update weekly availability and exceptions.`
            : listing.status === ListingStatus.DRAFT
              ? "Draft in progress — finish photos and OR/CR, then submit for admin approval."
              : listing.status === ListingStatus.PENDING_APPROVAL
                ? "Waiting on admin approval. Keep filling out photos, OR/CR, and availability."
                : "Changes save instantly and do not require re-approval."}
        </p>
      </div>

      {!isFleetViewer && listing.status === ListingStatus.DRAFT ? (
        <ListingWizardStepper
          currentStep={
            listing.photos.length === 0
              ? "photos"
              : !listing.orCrDocumentUrl
                ? "orcr"
                : "orcr"
          }
          hasOrCr={Boolean(listing.orCrDocumentUrl)}
          hasPhotos={listing.photos.length > 0}
        />
      ) : null}

      {isFleetViewer ? (
        <div className="rounded-xl border border-dashed border-border bg-surface-container-low p-4 text-sm text-on-surface-variant flex items-start gap-3">
          <Building2 className="size-4 mt-0.5 text-primary" />
          <p>
            You&apos;re viewing this listing as a fleet operator on an active
            management link. Listing details, photos, and OR/CR are managed by
            the owner. Availability is shared.
          </p>
        </div>
      ) : null}

      {!isFleetViewer ? (
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
      ) : null}

      {!isFleetViewer ? (
        <HostListingPhotoGallery listingId={listing.id} photos={photos} />
      ) : null}

      {!isFleetViewer ? (
        <HostListingOrCrForm
          listingId={listing.id}
          orCrPath={listing.orCrDocumentUrl}
          signedUrl={orCrSignedUrl}
        />
      ) : null}

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
          addedByName:
            ex.addedByOwnerId !== null
              ? authorById.get(ex.addedByOwnerId) ?? null
              : null,
        }))}
      />

      {showFleetLinkSection && listing.status !== ListingStatus.DRAFT ? (
        <FleetLinkSection
          fleets={fleetOptions.map((f) => ({
            id: f.id,
            displayName: f.companyName ?? f.fullName,
            bio: f.bio,
            serviceArea: f.serviceArea,
            latitude: f.latitude,
            longitude: f.longitude,
            carsCount: f.carsCount,
          }))}
          link={
            fleetLink && (fleetLink.status === "PENDING" || fleetLink.status === "ACTIVE")
              ? {
                  id: fleetLink.id,
                  status: fleetLink.status as "PENDING" | "ACTIVE",
                  fleetId: fleetLink.fleetId,
                  fleetName:
                    fleetLink.fleet.companyName ?? fleetLink.fleet.fullName,
                  managementFeePercent: fleetLink.managementFeePercent,
                  requestedAt: fleetLink.requestedAt.toISOString(),
                  respondedAt: fleetLink.respondedAt?.toISOString() ?? null,
                }
              : null
          }
          listingId={listing.id}
        />
      ) : null}

      {!isFleetViewer && listing.status === ListingStatus.DRAFT ? (
        <SubmitForApprovalCta
          hasOrCr={Boolean(listing.orCrDocumentUrl)}
          hasPhotos={listing.photos.length > 0}
          listingId={listing.id}
        />
      ) : null}
    </div>
  );
}

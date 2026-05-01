import Link from "next/link";
import Image from "next/image";
import { Heart, Settings2, ShieldCheck, Star, Users, Zap } from "lucide-react";
import { OwnerStatus } from "@/types";
import { resolveListingPhotoUrl } from "@/lib/listing-assets";
import { vehicleTypeLabel } from "@/lib/listing-taxonomy";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

type ListingCardProps = {
  listing: {
    id: string;
    brand: string;
    model: string;
    year: number;
    location: string;
    dailyPrice: number;
    transmission: string;
    fuelType: string;
    vehicleType: string;
    seatingCapacity: number;
    photos: string[];
    avgRating: number;
    reviewCount: number;
    owner: { status: string };
  };
  // Optional date params to thread to the listing detail page so the booking
  // form pre-fills with the search range.
  fromParam?: string;
  untilParam?: string;
};

export function ListingCard({ listing, fromParam, untilParam }: ListingCardProps) {
  const primaryPhoto = listing.photos[0];
  const photoUrl = primaryPhoto ? resolveListingPhotoUrl(primaryPhoto) : null;
  const verified = listing.owner.status === OwnerStatus.VERIFIED;

  const detailQuery: Record<string, string> = {};
  if (fromParam) detailQuery.from = fromParam;
  if (untilParam) detailQuery.until = untilParam;

  return (
    <Link
      className="group relative overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_8px_24px_rgb(19_27_46_/_0.06)] transition hover:shadow-[0_12px_32px_rgb(19_27_46_/_0.1)]"
      href={{
        pathname: `/listings/${listing.id}`,
        query: Object.keys(detailQuery).length > 0 ? detailQuery : undefined,
      }}
    >
      <div className="relative aspect-[4/3] bg-surface-container">
        {photoUrl ? (
          <Image
            alt={`${listing.brand} ${listing.model}`}
            className="object-cover transition group-hover:scale-[1.02]"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            src={photoUrl}
          />
        ) : (
          <div className="grid size-full place-items-center text-sm text-on-surface-variant">
            Photo coming soon
          </div>
        )}

        {verified ? (
          <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            <ShieldCheck className="size-3" />
            Verified Host
          </div>
        ) : null}

        <div
          aria-label="Save to favorites — coming soon"
          className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white/90 text-on-surface-variant opacity-90"
          title="Save to favorites — coming soon"
        >
          <Heart className="size-4" />
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-headline truncate text-lg font-bold text-on-surface">
              {listing.brand} {listing.model}
            </h2>
            <p className="text-xs text-on-surface-variant">
              {listing.year} · {vehicleTypeLabel(listing.vehicleType)} · {listing.location}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              From
            </p>
            <p className="font-headline text-lg font-bold text-primary">
              {peso.format(listing.dailyPrice)}
              <span className="text-xs font-normal text-on-surface-variant">/day</span>
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
          {listing.reviewCount > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-on-surface">
                {listing.avgRating.toFixed(1)}
              </span>
              <span>({listing.reviewCount})</span>
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Users className="size-3" />
            {listing.seatingCapacity}
          </span>
          <span className="inline-flex items-center gap-1">
            <Settings2 className="size-3" />
            {listing.transmission}
          </span>
          <span className="inline-flex items-center gap-1">
            <Zap className="size-3" />
            {listing.fuelType}
          </span>
        </div>
      </div>
    </Link>
  );
}

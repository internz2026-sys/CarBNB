import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { OwnerStatus } from "@/types";
import { NewListingForm } from "./new-listing-form";

export const dynamic = "force-dynamic";

export default async function NewCarListingPage() {
  const owners = await db.owner.findMany({
    where: { status: OwnerStatus.VERIFIED },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, email: true },
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
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

      <PageHeader
        title="Add Car Listing"
        description="Register a new vehicle under a verified owner. Photos, documents, and availability are added on the edit page after save."
      />

      <NewListingForm owners={owners} />
    </div>
  );
}

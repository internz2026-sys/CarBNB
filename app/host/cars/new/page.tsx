import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentHost } from "@/lib/current-host";
import { NewHostListingForm } from "./new-host-listing-form";

export const dynamic = "force-dynamic";

export default async function NewHostListingPage() {
  const session = await getCurrentHost();
  if (session.kind !== "verified") redirect("/host/dashboard");

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-2 mb-2">
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
        <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
          Add Car Listing
        </h1>
        <p className="mt-2 text-base text-on-surface-variant">
          Submit your vehicle for review. After admin approval you can add photos, OR/CR,
          and set availability.
        </p>
      </div>

      <NewHostListingForm />
    </div>
  );
}

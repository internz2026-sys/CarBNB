import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { db } from "@/lib/db";
import { getCurrentCustomer } from "@/lib/current-customer";
import { getCustomerDocumentSignedUrl } from "@/lib/customer-documents";
import { BrandLogo } from "@/components/layout/brand-logo";
import { UserMenu } from "@/components/layout/user-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CustomerDocumentsSection } from "./customer-documents-section";

export const dynamic = "force-dynamic";

export default async function VerificationPage() {
  const session = await getCurrentCustomer();
  if (session.kind === "anonymous") {
    redirect("/login?redirectTo=/account/verification");
  }
  if (session.kind === "not-customer") {
    redirect("/");
  }

  // Always fetch the latest row so the uploads reflect any in-flight
  // admin status change.
  const customer = await db.customer.findUnique({
    where: { id: session.customer.id },
    select: {
      id: true,
      fullName: true,
      status: true,
      idDocumentUrl: true,
      licenseDocumentUrl: true,
    },
  });
  if (!customer) redirect("/");

  const [idSignedUrl, licenseSignedUrl] = await Promise.all([
    getCustomerDocumentSignedUrl(customer.idDocumentUrl),
    getCustomerDocumentSignedUrl(customer.licenseDocumentUrl),
  ]);

  const allDocsPresent = Boolean(
    customer.idDocumentUrl && customer.licenseDocumentUrl,
  );

  return (
    <div className="min-h-screen bg-surface pb-16 font-sans">
      <header className="sticky top-0 z-30 bg-[rgb(250_248_255_/_0.85)] shadow-[0_8px_24px_rgb(19_27_46_/_0.04)] backdrop-blur-lg">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link className="flex items-center" href="/">
            <BrandLogo />
          </Link>
          <div className="flex items-center gap-5">
            <Link className="text-sm font-semibold text-on-surface-variant hover:text-primary" href="/listings">
              Browse cars
            </Link>
            <UserMenu
              fullName={customer.fullName}
              links={[
                { label: "My bookings", href: "/account" },
                { label: "Verification", href: "/account/verification" },
                { label: "Favorites", href: "/account/favorites" },
              ]}
              roleLabel="Customer"
            />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl space-y-6 px-4 pt-10 sm:px-6">
        <div>
          <Link
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-ml-3 text-muted-foreground",
            )}
            href="/account"
          >
            <ArrowLeft className="mr-1 size-4" />
            Back to My Bookings
          </Link>
        </div>

        <div>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
            Identity Verification
          </h1>
          <p className="mt-2 text-base text-on-surface-variant">
            We verify every customer before they can book to keep the
            marketplace safe for hosts.
          </p>
        </div>

        <CustomerDocumentsSection
          allDocsPresent={allDocsPresent}
          customerStatus={customer.status}
          idSignedUrl={idSignedUrl}
          licenseSignedUrl={licenseSignedUrl}
        />
      </section>
    </div>
  );
}

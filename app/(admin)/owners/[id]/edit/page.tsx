import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { getOwnerDocumentSignedUrl } from "@/lib/owner-documents";
import { EditOwnerForm } from "./edit-owner-form";
import { OwnerDocumentsForm } from "./owner-documents-form";

export const dynamic = "force-dynamic";

export default async function EditOwnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const owner = await db.owner.findUnique({ where: { id } });
  if (!owner) {
    notFound();
  }

  const [idSignedUrl, licenseSignedUrl] = await Promise.all([
    getOwnerDocumentSignedUrl(owner.idDocumentUrl),
    getOwnerDocumentSignedUrl(owner.licenseDocumentUrl),
  ]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-2 mb-2">
        <Link
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground -ml-3",
          )}
          href={`/owners/${owner.id}`}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Owner
        </Link>
      </div>

      <PageHeader
        description={`Update profile details for ${owner.fullName}. Status transitions are managed via the approve/suspend buttons on the detail page.`}
        title="Edit Owner"
      />

      <EditOwnerForm
        owner={{
          id: owner.id,
          fullName: owner.fullName,
          email: owner.email,
          contactNumber: owner.contactNumber,
          address: owner.address,
          bankDetails: owner.bankDetails,
          remarks: owner.remarks,
        }}
      />

      <OwnerDocumentsForm
        idSignedUrl={idSignedUrl}
        licenseSignedUrl={licenseSignedUrl}
        ownerId={owner.id}
      />
    </div>
  );
}

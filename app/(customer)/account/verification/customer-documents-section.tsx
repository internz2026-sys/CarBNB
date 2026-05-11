"use client";

import { useActionState } from "react";
import { CheckCircle2, ShieldCheck, ShieldAlert, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  uploadCustomerDocumentAction,
  type CustomerProfileActionState,
} from "@/app/actions/customer-profile";

type CustomerDocKind = "id" | "license";

function DocUploadPanel({
  docKind,
  label,
  helper,
  currentSignedUrl,
}: {
  docKind: CustomerDocKind;
  label: string;
  helper: string;
  currentSignedUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState<
    CustomerProfileActionState,
    FormData
  >(uploadCustomerDocumentAction, null);

  const hasDoc = Boolean(currentSignedUrl);
  const justSaved = state && "saved" in state && state.saved;
  const error = state && "error" in state ? state.error : null;

  return (
    <form action={formAction} className="space-y-3">
      <input name="docKind" type="hidden" value={docKind} />

      <div className="flex items-center justify-between">
        <Label htmlFor={`customer-${docKind}-file`}>{label}</Label>
        {hasDoc ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="w-3 h-3" />
            Uploaded
          </span>
        ) : (
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            Not uploaded
          </span>
        )}
      </div>

      <div className="rounded-lg border-2 border-dashed border-border p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <UploadCloud className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <p className="text-xs text-muted-foreground">{helper}</p>
            <input
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="block w-full text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-foreground hover:file:cursor-pointer"
              id={`customer-${docKind}-file`}
              name="file"
              required
              type="file"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          {currentSignedUrl ? (
            <a
              className="block text-xs font-medium text-primary underline truncate"
              href={currentSignedUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              View current document
            </a>
          ) : null}
          {error ? (
            <p className="text-xs text-red-600 break-words">{error}</p>
          ) : null}
          {justSaved && !error ? (
            <p className="text-xs font-medium text-emerald-700">Uploaded.</p>
          ) : null}
        </div>
        <Button disabled={pending} size="sm" type="submit">
          {pending ? "Uploading..." : hasDoc ? "Replace" : "Upload"}
        </Button>
      </div>
    </form>
  );
}

export function CustomerDocumentsSection({
  customerStatus,
  idSignedUrl,
  licenseSignedUrl,
  allDocsPresent,
}: {
  customerStatus: string;
  idSignedUrl: string | null;
  licenseSignedUrl: string | null;
  allDocsPresent: boolean;
}) {
  const isVerified = customerStatus === "Verified";
  const isRejected = customerStatus === "Rejected";
  const isSuspended = customerStatus === "Suspended";

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle>Identity Verification</CardTitle>
        <CardDescription>
          Upload your government ID and driver&apos;s license. Files are
          stored privately and reviewed by our admin team. Verified
          customers can book any active listing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {isVerified ? (
          <div className="flex items-start gap-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            <ShieldCheck className="size-5 shrink-0" />
            <div>
              <p className="font-semibold">Your identity is verified.</p>
              <p className="text-xs">
                You can replace your documents below at any time. Re-uploads
                don&apos;t change your verified status unless an admin flags
                you for re-verification.
              </p>
            </div>
          </div>
        ) : isRejected ? (
          <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            <ShieldAlert className="size-5 shrink-0" />
            <div>
              <p className="font-semibold">Verification rejected.</p>
              <p className="text-xs">
                Your previous submission was rejected. Please re-upload clear
                copies of both documents to resubmit for review. Contact
                support if you need help.
              </p>
            </div>
          </div>
        ) : isSuspended ? (
          <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            <ShieldAlert className="size-5 shrink-0" />
            <div>
              <p className="font-semibold">Your account is suspended.</p>
              <p className="text-xs">
                Please contact support to reinstate your account. You
                cannot upload documents while suspended.
              </p>
            </div>
          </div>
        ) : allDocsPresent ? (
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-semibold">Documents submitted — awaiting review.</p>
            <p className="mt-1 text-xs">
              Your documents are in the admin verification queue. We&apos;ll
              email you once your account is reviewed. You can replace any
              document below before then.
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-semibold">Upload both documents to start verification.</p>
            <p className="mt-1 text-xs">
              We need your government ID and driver&apos;s license to verify
              your account before you can book any car.
            </p>
          </div>
        )}

        {isSuspended ? null : (
          <div className="grid gap-6 md:grid-cols-2">
            <DocUploadPanel
              currentSignedUrl={idSignedUrl}
              docKind="id"
              helper="Government-issued ID. JPG, PNG, WebP, or PDF, up to 5 MB."
              label="Valid Government ID"
            />
            <DocUploadPanel
              currentSignedUrl={licenseSignedUrl}
              docKind="license"
              helper="Driver's license. JPG, PNG, WebP, or PDF, up to 5 MB."
              label="Driver's License"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

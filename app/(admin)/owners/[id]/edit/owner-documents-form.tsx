"use client";

import { useActionState } from "react";
import { UploadCloud, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  uploadOwnerDocumentAction,
  type OwnerActionState,
} from "@/app/actions/owners";

type DocKind = "id" | "license";

function DocUploadPanel({
  ownerId,
  docKind,
  label,
  helper,
  currentSignedUrl,
}: {
  ownerId: string;
  docKind: DocKind;
  label: string;
  helper: string;
  currentSignedUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState<OwnerActionState, FormData>(
    uploadOwnerDocumentAction,
    null,
  );

  const hasDoc = Boolean(currentSignedUrl);

  return (
    <form action={formAction} className="space-y-3">
      <input name="ownerId" type="hidden" value={ownerId} />
      <input name="docKind" type="hidden" value={docKind} />

      <div className="flex items-center justify-between">
        <Label htmlFor={`${docKind}-file`}>{label}</Label>
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
              id={`${docKind}-file`}
              name="file"
              required
              type="file"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          {currentSignedUrl ? (
            <a
              className="text-xs font-medium text-primary underline truncate"
              href={currentSignedUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              View current document
            </a>
          ) : null}
          {state?.error ? (
            <p className="text-xs text-red-600 break-words">{state.error}</p>
          ) : null}
        </div>
        <Button disabled={pending} size="sm" type="submit">
          {pending ? "Uploading..." : hasDoc ? "Replace" : "Upload"}
        </Button>
      </div>
    </form>
  );
}

export function OwnerDocumentsForm({
  ownerId,
  idSignedUrl,
  licenseSignedUrl,
}: {
  ownerId: string;
  idSignedUrl: string | null;
  licenseSignedUrl: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification Documents</CardTitle>
        <CardDescription>
          Upload government ID and driver&apos;s license for this owner. Files are
          stored privately — signed links expire every hour.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <DocUploadPanel
          currentSignedUrl={idSignedUrl}
          docKind="id"
          helper="Government-issued ID. JPG, PNG, WebP, or PDF, up to 5 MB."
          label="Valid Government ID"
          ownerId={ownerId}
        />
        <DocUploadPanel
          currentSignedUrl={licenseSignedUrl}
          docKind="license"
          helper="Driver's license. JPG, PNG, WebP, or PDF, up to 5 MB."
          label="Driver's License"
          ownerId={ownerId}
        />
      </CardContent>
    </Card>
  );
}

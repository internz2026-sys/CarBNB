"use client";

import { useActionState, useRef } from "react";
import { FileText, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  uploadOrCrDocumentAction,
  type ListingActionState,
} from "@/app/actions/listings";

export function ListingOrCrForm({
  listingId,
  orCrPath,
  signedUrl,
}: {
  listingId: string;
  orCrPath: string | null;
  signedUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState<ListingActionState, FormData>(
    uploadOrCrDocumentAction,
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>OR / CR Document</CardTitle>
        <CardDescription>
          Required for verification. Uploaded to a private bucket — only admins see it via
          short-lived signed URLs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {state?.error ? (
          <div className="rounded-[1rem] bg-red-50 p-3 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        {orCrPath ? (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex items-center gap-3">
              <FileText className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">OR/CR uploaded</p>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {orCrPath}
                </p>
              </div>
            </div>
            {signedUrl ? (
              <a
                className="text-sm text-primary hover:underline shrink-0"
                href={signedUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                View (1h link)
              </a>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No OR/CR uploaded yet.</p>
        )}

        <form action={formAction} className="flex flex-wrap items-center gap-3">
          <input name="listingId" type="hidden" value={listingId} />
          <label className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-primary/40 px-4 py-3 text-sm font-medium cursor-pointer hover:bg-primary/5">
            <UploadCloud className="size-4" />
            {orCrPath ? "Replace document" : "Upload document"}
            <input
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              name="file"
              onChange={(e) => {
                if (e.target.files?.length) {
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              ref={fileInputRef}
              type="file"
            />
          </label>
          <span className="text-xs text-muted-foreground">
            JPG, PNG, WebP, or PDF · Max 5 MB
          </span>
          {pending ? <span className="text-xs text-primary">Uploading...</span> : null}
        </form>
      </CardContent>
    </Card>
  );
}

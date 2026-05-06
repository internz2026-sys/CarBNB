"use client";

import { useActionState } from "react";
import { CheckCircle2, ImageIcon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  submitListingForApprovalAction,
  type HostListingActionState,
} from "@/app/actions/host-listings";

// Tier 17 — sticky bottom CTA rendered on /host/cars/[id]/edit when
// status === DRAFT. Disabled until the host has uploaded ≥1 photo
// AND an OR/CR document; the disabled state lists what's still
// missing so the host can act on it. The action layer
// (submitListingForApprovalAction) re-checks the same prerequisites
// — UI gating is for UX clarity only.

export function SubmitForApprovalCta({
  hasOrCr,
  hasPhotos,
  listingId,
}: {
  hasOrCr: boolean;
  hasPhotos: boolean;
  listingId: string;
}) {
  const [state, formAction, pending] = useActionState<
    HostListingActionState,
    FormData
  >(submitListingForApprovalAction, null);

  const ready = hasPhotos && hasOrCr;
  const missing: string[] = [];
  if (!hasPhotos) missing.push("at least one photo");
  if (!hasOrCr) missing.push("the OR/CR document");

  return (
    <div className="sticky bottom-4 z-30">
      <div
        className={cn(
          "rounded-xl border border-border bg-surface-container-lowest p-4 shadow-[0_12px_36px_rgb(19_27_46_/_0.12)]",
          "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        )}
      >
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
            <CheckCircle2
              className={cn(
                "size-4",
                ready ? "text-emerald-600" : "text-on-surface-variant",
              )}
            />
            {ready
              ? "Ready to submit for approval"
              : `Add ${missing.join(" and ")} to submit`}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-on-surface-variant">
            <span
              className={cn(
                "inline-flex items-center gap-1",
                hasPhotos ? "text-emerald-700" : "",
              )}
            >
              <ImageIcon className="size-3" />
              Photos {hasPhotos ? "✓" : "—"}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1",
                hasOrCr ? "text-emerald-700" : "",
              )}
            >
              <FileText className="size-3" />
              OR/CR {hasOrCr ? "✓" : "—"}
            </span>
          </div>
          {state?.error ? (
            <p className="text-xs text-red-700 bg-red-50 rounded-md px-2 py-1">
              {state.error}
            </p>
          ) : null}
        </div>

        <form action={formAction}>
          <input name="listingId" type="hidden" value={listingId} />
          <Button disabled={!ready || pending} size="lg" type="submit">
            {pending ? "Submitting..." : "Submit for Approval"}
          </Button>
        </form>
      </div>
    </div>
  );
}

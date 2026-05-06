"use client";

import { useActionState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  approveLinkAction,
  rejectLinkAction,
  type FleetLinkActionState,
} from "@/app/actions/fleet-links";

// Tier 15 dashboard widget: a fleet operator approves or rejects an
// incoming link request from an independent owner. Both buttons share
// the same row; success refreshes the page (revalidatePath inside the
// action handles it).

export function FleetRequestActions({ linkId }: { linkId: string }) {
  const [approveState, approveFormAction, approvePending] = useActionState<
    FleetLinkActionState,
    FormData
  >(approveLinkAction, null);
  const [rejectState, rejectFormAction, rejectPending] = useActionState<
    FleetLinkActionState,
    FormData
  >(rejectLinkAction, null);

  const errorMessage =
    (approveState && "error" in approveState ? approveState.error : null) ??
    (rejectState && "error" in rejectState ? rejectState.error : null);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <form action={approveFormAction}>
          <input name="linkId" type="hidden" value={linkId} />
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={approvePending || rejectPending}
            size="sm"
            type="submit"
          >
            <Check className="size-3.5 mr-1.5" />
            {approvePending ? "Approving..." : "Approve"}
          </Button>
        </form>
        <form action={rejectFormAction}>
          <input name="linkId" type="hidden" value={linkId} />
          <Button
            disabled={approvePending || rejectPending}
            size="sm"
            type="submit"
            variant="outline"
          >
            <X className="size-3.5 mr-1.5" />
            {rejectPending ? "Rejecting..." : "Reject"}
          </Button>
        </form>
      </div>
      {errorMessage ? (
        <p className="text-xs text-red-600">{errorMessage}</p>
      ) : null}
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import { format } from "date-fns";
import { Building2, ChevronDown, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  cancelLinkRequestAction,
  requestLinkAction,
  severLinkAction,
  type FleetLinkActionState,
} from "@/app/actions/fleet-links";

type FleetOption = {
  id: string;
  displayName: string;
  bio: string | null;
};

type ExistingLink = {
  id: string;
  status: "PENDING" | "ACTIVE" | "INACTIVE";
  fleetId: string;
  fleetName: string;
  managementFeePercent: number | null;
  requestedAt: string; // ISO
  respondedAt: string | null;
} | null;

export function FleetLinkSection({
  listingId,
  fleets,
  link,
}: {
  listingId: string;
  fleets: FleetOption[];
  link: ExistingLink;
}) {
  // Three rendering states based on the current link:
  //  - null/INACTIVE → "Request to link" form (pick fleet + optional fee)
  //  - PENDING → "Awaiting fleet response" with cancel button
  //  - ACTIVE → "Currently managed by X" with sever button
  if (link?.status === "ACTIVE") {
    return <ActiveLinkCard link={link} />;
  }
  if (link?.status === "PENDING") {
    return <PendingLinkCard link={link} />;
  }
  return <RequestLinkCard fleets={fleets} listingId={listingId} />;
}

function ActiveLinkCard({
  link,
}: {
  link: NonNullable<ExistingLink>;
}) {
  const [state, formAction, pending] = useActionState<FleetLinkActionState, FormData>(
    severLinkAction,
    null,
  );
  const errorMessage = state && "error" in state ? state.error : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="size-4 text-primary" />
          Managed by {link.fleetName}
        </CardTitle>
        <CardDescription>
          This car is currently under fleet management. Bookings will route to the fleet
          operator (Tier 16). You stay the legal owner; you can sever this link any time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between text-on-surface-variant">
          <span>Fleet operator</span>
          <Link className="font-semibold text-primary hover:underline" href={`/hosts/${link.fleetId}`}>
            {link.fleetName}
          </Link>
        </div>
        {link.managementFeePercent !== null ? (
          <div className="flex justify-between text-on-surface-variant">
            <span>Agreed management fee</span>
            <span className="font-semibold text-on-surface">{link.managementFeePercent}%</span>
          </div>
        ) : null}
        <div className="flex justify-between text-on-surface-variant">
          <span>Active since</span>
          <span className="font-mono text-xs">
            {link.respondedAt ? format(new Date(link.respondedAt), "MMM d, yyyy") : "—"}
          </span>
        </div>

        {errorMessage ? (
          <div className="rounded-md bg-red-50 p-3 text-xs text-red-700">{errorMessage}</div>
        ) : null}
      </CardContent>
      <CardFooter className="bg-muted/30 border-t border-border px-6 py-4 flex justify-end gap-3 rounded-b-xl border-dashed">
        <form action={formAction}>
          <input name="linkId" type="hidden" value={link.id} />
          <Button disabled={pending} type="submit" variant="destructive">
            <X className="size-3.5 mr-1.5" />
            {pending ? "Severing..." : "Sever link"}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

function PendingLinkCard({
  link,
}: {
  link: NonNullable<ExistingLink>;
}) {
  const [state, formAction, pending] = useActionState<FleetLinkActionState, FormData>(
    cancelLinkRequestAction,
    null,
  );
  const errorMessage = state && "error" in state ? state.error : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="size-4 text-amber-600" />
          Awaiting response from {link.fleetName}
        </CardTitle>
        <CardDescription>
          You requested {link.fleetName} to manage this car. They&apos;ll see your request
          on their host dashboard. You can cancel the request any time before they respond.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between text-on-surface-variant">
          <span>Fleet operator</span>
          <Link className="font-semibold text-primary hover:underline" href={`/hosts/${link.fleetId}`}>
            {link.fleetName}
          </Link>
        </div>
        {link.managementFeePercent !== null ? (
          <div className="flex justify-between text-on-surface-variant">
            <span>Proposed management fee</span>
            <span className="font-semibold text-on-surface">{link.managementFeePercent}%</span>
          </div>
        ) : null}
        <div className="flex justify-between text-on-surface-variant">
          <span>Requested</span>
          <span className="font-mono text-xs">
            {format(new Date(link.requestedAt), "MMM d, yyyy")}
          </span>
        </div>

        {errorMessage ? (
          <div className="rounded-md bg-red-50 p-3 text-xs text-red-700">{errorMessage}</div>
        ) : null}
      </CardContent>
      <CardFooter className="bg-muted/30 border-t border-border px-6 py-4 flex justify-end gap-3 rounded-b-xl border-dashed">
        <form action={formAction}>
          <input name="linkId" type="hidden" value={link.id} />
          <Button disabled={pending} type="submit" variant="outline">
            {pending ? "Cancelling..." : "Cancel request"}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

function RequestLinkCard({
  listingId,
  fleets,
}: {
  listingId: string;
  fleets: FleetOption[];
}) {
  const [fleetId, setFleetId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [state, formAction, pending] = useActionState<FleetLinkActionState, FormData>(
    requestLinkAction,
    null,
  );

  const errorMessage = state && "error" in state ? state.error : null;
  const fieldErrors = state && "fieldErrors" in state ? state.fieldErrors : undefined;

  const selectedFleet = fleets.find((f) => f.id === fleetId);

  if (!showForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-4 text-on-surface-variant" />
            Manage with a fleet operator (optional)
          </CardTitle>
          <CardDescription>
            Don&apos;t want to handle pickups, drop-offs, and customer messages yourself?
            Link your car to a registered car rental operator. They&apos;ll manage bookings
            on your behalf for a fee you agree to up front. You stay the legal owner and
            can sever the link any time.
          </CardDescription>
        </CardHeader>
        <CardFooter className="bg-muted/30 border-t border-border px-6 py-4 flex justify-end gap-3 rounded-b-xl border-dashed">
          <Button onClick={() => setShowForm(true)} type="button" variant="outline">
            Browse fleet operators
            <ChevronDown className="size-3.5 ml-1.5" />
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (fleets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-4 text-on-surface-variant" />
            Manage with a fleet operator
          </CardTitle>
          <CardDescription>
            No verified fleet operators available right now. Check back soon.
          </CardDescription>
        </CardHeader>
        <CardFooter className="bg-muted/30 border-t border-border px-6 py-4 flex justify-end gap-3 rounded-b-xl border-dashed">
          <Button onClick={() => setShowForm(false)} type="button" variant="outline">
            Hide
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="size-4 text-primary" />
          Request fleet management
        </CardTitle>
        <CardDescription>
          Pick a verified fleet operator to manage this car. They&apos;ll see your request
          on their host dashboard and can approve or reject. Optional: propose a management
          fee percentage that gets applied to each booking on this car (fee deduction
          itself ships with accounting in a future tier).
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <input name="listingId" type="hidden" value={listingId} />
          <input name="fleetId" type="hidden" value={fleetId} />

          {errorMessage ? (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>
          ) : null}

          <div className="space-y-2">
            <Label>Fleet operator</Label>
            <Select onValueChange={(v) => v && setFleetId(v)} value={fleetId}>
              <SelectTrigger className="w-full">
                <span className="truncate text-left">
                  {selectedFleet ? selectedFleet.displayName : "Pick a verified fleet"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {fleets.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{f.displayName}</span>
                      {f.bio ? (
                        <span className="text-xs text-muted-foreground line-clamp-1">{f.bio}</span>
                      ) : null}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors?.fleetId?.[0] ? (
              <p className="text-xs text-red-600">{fieldErrors.fleetId[0]}</p>
            ) : null}
            {selectedFleet ? (
              <p className="text-xs text-on-surface-variant">
                <Link className="text-primary hover:underline" href={`/hosts/${selectedFleet.id}`} target="_blank">
                  View {selectedFleet.displayName} profile →
                </Link>
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="managementFeePercent">Proposed management fee (%)</Label>
            <Input
              id="managementFeePercent"
              max={100}
              min={0}
              name="managementFeePercent"
              placeholder="e.g. 15"
              step="0.5"
              type="number"
            />
            <p className="text-xs text-on-surface-variant">
              Optional. Recorded on the link record but not deducted yet — that ships with
              accounting in a future tier.
            </p>
            {fieldErrors?.managementFeePercent?.[0] ? (
              <p className="text-xs text-red-600">{fieldErrors.managementFeePercent[0]}</p>
            ) : null}
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 border-t border-border px-6 py-4 flex justify-end gap-3 rounded-b-xl border-dashed">
          <Button onClick={() => setShowForm(false)} type="button" variant="outline">
            Cancel
          </Button>
          <Button disabled={pending || !fleetId} type="submit">
            {pending ? "Sending request..." : "Send request"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

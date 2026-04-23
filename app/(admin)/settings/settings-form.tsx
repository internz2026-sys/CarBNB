"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  updatePlatformSettingsAction,
  type SettingsActionState,
} from "@/app/actions/settings";

type InitialSettings = {
  commissionRate: number;
  securityDeposit: number;
  autoApproveVerifiedCustomers: boolean;
  requireOwnerConfirmation: boolean;
  minimumBookingNoticeHours: number;
  updatedAt: Date;
  updatedBy: string | null;
};

export function SettingsForm({ initial }: { initial: InitialSettings }) {
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(
    updatePlatformSettingsAction,
    null,
  );

  const fieldError = (name: string) =>
    state && "fieldErrors" in state ? state.fieldErrors?.[name]?.[0] : undefined;

  // Stored as 0-1 fraction; displayed as 0-100 percent.
  const commissionPercent = Math.round(initial.commissionRate * 10000) / 100;

  return (
    <form action={formAction} className="grid gap-6" key={initial.updatedAt.toISOString()}>
      {state && "error" in state ? (
        <div className="rounded-[1rem] bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
      ) : null}

      {state && "ok" in state ? (
        <div className="flex items-center gap-2 rounded-[1rem] bg-emerald-50 p-3 text-sm text-emerald-700">
          <CheckCircle2 className="size-4" />
          {state.message}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Financial & Fees</CardTitle>
          <CardDescription>Core marketplace rates. Changes apply to new bookings; existing bookings keep their locked-in rate.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 items-center gap-4">
            <div>
              <Label className="font-semibold text-foreground" htmlFor="commissionRatePercent">
                Platform Commission Rate
              </Label>
              <p className="text-sm text-muted-foreground">Percentage taken from every new booking.</p>
              {fieldError("commissionRatePercent") ? (
                <p className="mt-1 text-xs text-red-600">{fieldError("commissionRatePercent")}</p>
              ) : null}
            </div>
            <div className="relative ml-auto">
              <Input
                className="pl-3 pr-8 w-24"
                defaultValue={commissionPercent}
                id="commissionRatePercent"
                max={50}
                min={0}
                name="commissionRatePercent"
                required
                step="0.1"
                type="number"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 items-center gap-4 pt-4 border-t border-border">
            <div>
              <Label className="font-semibold text-foreground" htmlFor="securityDeposit">
                Standard Security Deposit
              </Label>
              <p className="text-sm text-muted-foreground">Default amount held for incidentals. (Informational — no flow consumes this yet.)</p>
              {fieldError("securityDeposit") ? (
                <p className="mt-1 text-xs text-red-600">{fieldError("securityDeposit")}</p>
              ) : null}
            </div>
            <div className="relative ml-auto">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₱</span>
              <Input
                className="pl-8 w-32"
                defaultValue={initial.securityDeposit}
                id="securityDeposit"
                min={0}
                name="securityDeposit"
                required
                step="100"
                type="number"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Booking Rules</CardTitle>
          <CardDescription>Rules that universally apply to all fleet vehicles. Toggles are stored today; flows that read them land in a later tier.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-semibold text-foreground">Auto-Approve Verified Customers</Label>
              <p className="text-sm text-muted-foreground">Instantly confirm bookings for customers with verified IDs.</p>
            </div>
            <Switch
              defaultChecked={initial.autoApproveVerifiedCustomers}
              name="autoApproveVerifiedCustomers"
              value="on"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-semibold text-foreground">Require Owner Confirmation</Label>
              <p className="text-sm text-muted-foreground">Owners must manually accept each booking request.</p>
            </div>
            <Switch
              defaultChecked={initial.requireOwnerConfirmation}
              name="requireOwnerConfirmation"
              value="on"
            />
          </div>

          <div className="grid grid-cols-2 items-center gap-4 pt-2 border-t border-border">
            <div>
              <Label className="font-semibold text-foreground" htmlFor="minimumBookingNoticeHours">
                Minimum Booking Notice
              </Label>
              <p className="text-sm text-muted-foreground">How many hours in advance needed.</p>
              {fieldError("minimumBookingNoticeHours") ? (
                <p className="mt-1 text-xs text-red-600">{fieldError("minimumBookingNoticeHours")}</p>
              ) : null}
            </div>
            <div className="relative ml-auto">
              <Input
                className="pl-3 pr-10 w-24"
                defaultValue={initial.minimumBookingNoticeHours}
                id="minimumBookingNoticeHours"
                max={720}
                min={0}
                name="minimumBookingNoticeHours"
                required
                step="1"
                type="number"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">hrs</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {initial.updatedBy
            ? `Last saved by ${initial.updatedBy} · ${initial.updatedAt.toLocaleString("en-PH")}`
            : "No save history yet."}
        </p>
        <Button disabled={pending} type="submit">
          {pending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}

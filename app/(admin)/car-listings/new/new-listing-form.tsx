"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  SelectValue,
} from "@/components/ui/select";
import { createListingAction, type ListingActionState } from "@/app/actions/listings";
import {
  VEHICLE_TYPES,
  VEHICLE_FEATURES,
  vehicleTypeLabel,
} from "@/lib/listing-taxonomy";

type OwnerOption = { id: string; fullName: string; email: string };

export function NewListingForm({ owners }: { owners: OwnerOption[] }) {
  const [ownerId, setOwnerId] = useState<string>(owners[0]?.id ?? "");
  const [transmission, setTransmission] = useState<string>("Automatic");
  const [fuelType, setFuelType] = useState<string>("Gasoline");
  const [vehicleType, setVehicleType] = useState<string>(VEHICLE_TYPES[0].slug);
  const [state, formAction, pending] = useActionState<ListingActionState, FormData>(
    createListingAction,
    null,
  );

  const fieldError = (name: string) => state?.fieldErrors?.[name]?.[0];

  if (owners.length === 0) {
    return (
      <div className="rounded-[1rem] bg-amber-50 p-6 text-sm text-amber-900">
        <p className="font-semibold">No verified owners yet.</p>
        <p className="mt-1">
          Listings can only be created for verified owners. Approve an owner first via the{" "}
          <Link className="underline" href="/owners">
            Owners directory
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-8">
      <input name="ownerId" type="hidden" value={ownerId} />
      <input name="transmission" type="hidden" value={transmission} />
      <input name="fuelType" type="hidden" value={fuelType} />
      <input name="vehicleType" type="hidden" value={vehicleType} />

      {state?.error ? (
        <div className="rounded-[1rem] bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Assign to Owner</CardTitle>
          <CardDescription>
            Select the verified owner this vehicle belongs to.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 w-full">
            <Label>Verified Owner</Label>
            <Select onValueChange={(v) => v && setOwnerId(v)} value={ownerId}>
              <SelectTrigger className="w-full">
                <span className="truncate text-left">
                  {(() => {
                    const selected = owners.find((o) => o.id === ownerId);
                    return selected
                      ? `${selected.fullName} — ${selected.email}`
                      : "Select owner";
                  })()}
                </span>
              </SelectTrigger>
              <SelectContent>
                {owners.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{o.fullName}</span>
                      <span className="text-xs text-muted-foreground">{o.email}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError("ownerId") ? (
              <p className="text-xs text-red-600">{fieldError("ownerId")}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Identity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="plateNumber">Plate Number</Label>
            <Input
              className="font-mono uppercase tracking-wider"
              id="plateNumber"
              name="plateNumber"
              placeholder="ABC 1234"
              required
            />
            {fieldError("plateNumber") ? (
              <p className="text-xs text-red-600">{fieldError("plateNumber")}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Year Model</Label>
            <Input
              id="year"
              max={2030}
              min={1980}
              name="year"
              placeholder="e.g. 2024"
              required
              type="number"
            />
            {fieldError("year") ? (
              <p className="text-xs text-red-600">{fieldError("year")}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" name="brand" placeholder="e.g. Toyota" required />
            {fieldError("brand") ? (
              <p className="text-xs text-red-600">{fieldError("brand")}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input id="model" name="model" placeholder="e.g. Vios" required />
            {fieldError("model") ? (
              <p className="text-xs text-red-600">{fieldError("model")}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Input id="color" name="color" placeholder="e.g. Pearl White" required />
            {fieldError("color") ? (
              <p className="text-xs text-red-600">{fieldError("color")}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">City Location</Label>
            <Input id="location" name="location" placeholder="e.g. Makati City" required />
            {fieldError("location") ? (
              <p className="text-xs text-red-600">{fieldError("location")}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Specifications & Pricing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="vehicleTypeTrigger">Vehicle Type</Label>
            <Select onValueChange={(v) => v && setVehicleType(v)} value={vehicleType}>
              <SelectTrigger className="w-full" id="vehicleTypeTrigger">
                <span className="text-left">{vehicleTypeLabel(vehicleType)}</span>
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_TYPES.map((t) => (
                  <SelectItem key={t.slug} value={t.slug}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="transmission">Transmission</Label>
            <Select onValueChange={(v) => v && setTransmission(v)} value={transmission}>
              <SelectTrigger id="transmission">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Automatic">Automatic</SelectItem>
                <SelectItem value="Manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fuelType">Fuel Type</Label>
            <Select onValueChange={(v) => v && setFuelType(v)} value={fuelType}>
              <SelectTrigger id="fuelType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Gasoline">Gasoline</SelectItem>
                <SelectItem value="Diesel">Diesel</SelectItem>
                <SelectItem value="Electric">Electric</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="seatingCapacity">Seating Capacity</Label>
            <Input
              id="seatingCapacity"
              max={15}
              min={2}
              name="seatingCapacity"
              placeholder="e.g. 5"
              required
              type="number"
            />
            {fieldError("seatingCapacity") ? (
              <p className="text-xs text-red-600">{fieldError("seatingCapacity")}</p>
            ) : null}
          </div>

          <div className="md:col-span-3 border-t border-border" />

          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="dailyPrice">Daily Rate</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                ₱
              </span>
              <Input
                className="pl-8 font-medium text-lg"
                id="dailyPrice"
                min={1}
                name="dailyPrice"
                placeholder="e.g. 2500"
                required
                step="1"
                type="number"
              />
            </div>
            {fieldError("dailyPrice") ? (
              <p className="text-xs text-red-600">{fieldError("dailyPrice")}</p>
            ) : null}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description for Renters</Label>
            <Textarea
              className="resize-none h-24"
              id="description"
              name="description"
              placeholder="Describe the vehicle's features, condition, and any rental rules..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Features</CardTitle>
          <CardDescription>
            Tick everything this vehicle has. Renters use these to compare cars.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {VEHICLE_FEATURES.map((f) => (
              <label
                className="flex items-center gap-2 rounded-md border border-border p-2.5 text-sm hover:bg-muted/40 cursor-pointer"
                key={f.slug}
              >
                <input
                  className="size-4 rounded border-border text-primary focus:ring-primary"
                  name="features"
                  type="checkbox"
                  value={f.slug}
                />
                <span>{f.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin Notes (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            className="resize-none h-20"
            id="notes"
            name="notes"
            placeholder="Internal notes, approval review, etc. (only visible to admins)"
          />
        </CardContent>
        <CardFooter className="bg-muted/30 border-t border-border px-6 py-4 flex justify-between gap-3 rounded-b-xl border-dashed">
          <p className="text-sm text-muted-foreground max-w-sm">
            After saving, you&apos;ll be redirected to the edit page to add photos, OR/CR,
            and the availability schedule.
          </p>
          <div className="flex gap-3">
            <Link className={buttonVariants({ variant: "outline" })} href="/car-listings">
              Cancel
            </Link>
            <Button disabled={pending} type="submit">
              {pending ? "Saving..." : "Save & Continue"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}

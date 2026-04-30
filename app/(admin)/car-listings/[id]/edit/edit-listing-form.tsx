"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { updateListingAction, type ListingActionState } from "@/app/actions/listings";
import {
  VEHICLE_TYPES,
  VEHICLE_FEATURES,
  vehicleTypeLabel,
} from "@/lib/listing-taxonomy";

type ListingData = {
  id: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  transmission: string;
  fuelType: string;
  vehicleType: string;
  features: string[];
  seatingCapacity: number;
  location: string;
  dailyPrice: number;
  description: string | null;
  notes: string | null;
  plateNumber: string;
};

export function EditListingForm({ listing }: { listing: ListingData }) {
  const [transmission, setTransmission] = useState<string>(listing.transmission);
  const [fuelType, setFuelType] = useState<string>(listing.fuelType);
  const [vehicleType, setVehicleType] = useState<string>(listing.vehicleType);
  const featureSet = new Set(listing.features);
  const [state, formAction, pending] = useActionState<ListingActionState, FormData>(
    updateListingAction,
    null,
  );

  const fieldError = (name: string) => state?.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction}>
      <input name="listingId" type="hidden" value={listing.id} />
      <input name="transmission" type="hidden" value={transmission} />
      <input name="fuelType" type="hidden" value={fuelType} />
      <input name="vehicleType" type="hidden" value={vehicleType} />

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Details</CardTitle>
          <CardDescription>
            Plate number and assigned owner are fixed after create to prevent drift.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          {state?.error ? (
            <div className="md:col-span-2 rounded-[1rem] bg-red-50 p-3 text-sm text-red-700">
              {state.error}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Plate Number</Label>
            <Input className="font-mono uppercase bg-muted/30" readOnly value={listing.plateNumber} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input
              defaultValue={listing.year}
              id="year"
              max={2030}
              min={1980}
              name="year"
              required
              type="number"
            />
            {fieldError("year") ? (
              <p className="text-xs text-red-600">{fieldError("year")}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input defaultValue={listing.brand} id="brand" name="brand" required />
            {fieldError("brand") ? (
              <p className="text-xs text-red-600">{fieldError("brand")}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input defaultValue={listing.model} id="model" name="model" required />
            {fieldError("model") ? (
              <p className="text-xs text-red-600">{fieldError("model")}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Input defaultValue={listing.color} id="color" name="color" required />
            {fieldError("color") ? (
              <p className="text-xs text-red-600">{fieldError("color")}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input defaultValue={listing.location} id="location" name="location" required />
            {fieldError("location") ? (
              <p className="text-xs text-red-600">{fieldError("location")}</p>
            ) : null}
          </div>
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
            <Label htmlFor="seatingCapacity">Seating</Label>
            <Input
              defaultValue={listing.seatingCapacity}
              id="seatingCapacity"
              max={15}
              min={2}
              name="seatingCapacity"
              required
              type="number"
            />
            {fieldError("seatingCapacity") ? (
              <p className="text-xs text-red-600">{fieldError("seatingCapacity")}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dailyPrice">Daily Rate (₱)</Label>
            <Input
              defaultValue={listing.dailyPrice}
              id="dailyPrice"
              min={1}
              name="dailyPrice"
              required
              step="1"
              type="number"
            />
            {fieldError("dailyPrice") ? (
              <p className="text-xs text-red-600">{fieldError("dailyPrice")}</p>
            ) : null}
          </div>
          <div className="space-y-3 md:col-span-2">
            <div>
              <Label>Features</Label>
              <p className="text-xs text-muted-foreground">
                Tick everything this vehicle has.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {VEHICLE_FEATURES.map((f) => (
                <label
                  className="flex items-center gap-2 rounded-md border border-border p-2.5 text-sm hover:bg-muted/40 cursor-pointer"
                  key={f.slug}
                >
                  <input
                    className="size-4 rounded border-border text-primary focus:ring-primary"
                    defaultChecked={featureSet.has(f.slug)}
                    name="features"
                    type="checkbox"
                    value={f.slug}
                  />
                  <span>{f.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              className="resize-none h-24"
              defaultValue={listing.description ?? ""}
              id="description"
              name="description"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Admin Notes</Label>
            <Textarea
              className="resize-none h-20"
              defaultValue={listing.notes ?? ""}
              id="notes"
              name="notes"
            />
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 border-t border-border px-6 py-4 flex justify-end gap-3 rounded-b-xl border-dashed">
          <Button disabled={pending} type="submit">
            {pending ? "Saving..." : "Save Details"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

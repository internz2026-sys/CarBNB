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
} from "@/components/ui/select";
import {
  updateHostListingAction,
  type HostListingActionState,
} from "@/app/actions/host-listings";

type ListingData = {
  id: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  transmission: string;
  fuelType: string;
  seatingCapacity: number;
  location: string;
  dailyPrice: number;
  description: string | null;
  plateNumber: string;
};

export function EditHostListingForm({ listing }: { listing: ListingData }) {
  const [transmission, setTransmission] = useState<string>(listing.transmission);
  const [fuelType, setFuelType] = useState<string>(listing.fuelType);
  const [state, formAction, pending] = useActionState<HostListingActionState, FormData>(
    updateHostListingAction,
    null,
  );

  const fieldError = (name: string) => state?.fieldErrors?.[name]?.[0];

  return (
    <form action={formAction}>
      <input name="listingId" type="hidden" value={listing.id} />
      <input name="transmission" type="hidden" value={transmission} />
      <input name="fuelType" type="hidden" value={fuelType} />

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Details</CardTitle>
          <CardDescription>
            Plate number is locked after create. Everything else can be edited any time.
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
            <Label>Transmission</Label>
            <Select onValueChange={(v) => v && setTransmission(v)} value={transmission}>
              <SelectTrigger>
                <span className="truncate text-left">{transmission}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Automatic">Automatic</SelectItem>
                <SelectItem value="Manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fuel Type</Label>
            <Select onValueChange={(v) => v && setFuelType(v)} value={fuelType}>
              <SelectTrigger>
                <span className="truncate text-left">{fuelType}</span>
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
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              className="resize-none h-24"
              defaultValue={listing.description ?? ""}
              id="description"
              name="description"
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

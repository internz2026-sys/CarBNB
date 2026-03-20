"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, UploadCloud, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { owners } from "@/lib/data/mock-data";

export default function NewCarListingPage() {
  const router = useRouter();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/car-listings");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/car-listings" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground -ml-3")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Listings
        </Link>
      </div>

      <PageHeader
        title="Add Car Listing"
        description="Register a new vehicle under an existing verified owner."
      />

      <form onSubmit={handleSave} className="space-y-8">
        {/* Step 1: Owner Selection */}
        <Card className="border-primary/50 shadow-sm">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="flex items-center gap-2 text-primary">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">1</span>
              Assign to Owner
            </CardTitle>
            <CardDescription>Select the verified owner this vehicle belongs to.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-2 max-w-md">
              <Label>Verified Owner</Label>
              <Select defaultValue={owners[0].id}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Search and select owner" />
                </SelectTrigger>
                <SelectContent>
                  {owners.map(o => (
                    <SelectItem key={o.id} value={o.id}>{o.fullName} ({o.id})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                 Can't find the owner? <Link href="/owners/new" className="text-primary hover:underline font-medium">Register them first</Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Vehicle Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted-foreground text-background text-xs">2</span>
               Vehicle Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2 pt-2">
            <div className="space-y-2">
              <Label htmlFor="plateNumber">Plate Number</Label>
              <Input id="plateNumber" placeholder="ABC 1234" className="font-mono uppercase tracking-wider" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year Model</Label>
               <Select defaultValue="2024">
                <SelectTrigger id="year">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                  <SelectItem value="2021">2021</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" placeholder="e.g. Toyota" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input id="model" placeholder="e.g. Vios" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input id="color" placeholder="e.g. White, Pearl Black" required />
            </div>
             <div className="space-y-2">
              <Label htmlFor="location">City Location</Label>
              <Input id="location" placeholder="e.g. Makati City" required />
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Specifications */}
        <Card>
          <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted-foreground text-background text-xs">3</span>
               Specifications & Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3 pt-2">
            <div className="space-y-2">
              <Label htmlFor="transmission">Transmission</Label>
              <Select defaultValue="automatic">
                <SelectTrigger id="transmission">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Automatic (AT)</SelectItem>
                  <SelectItem value="manual">Manual (MT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fuelType">Fuel Type</Label>
              <Select defaultValue="gasoline">
                <SelectTrigger id="fuelType">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasoline">Gasoline</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="capacity">Seating Capacity</Label>
              <Input id="capacity" type="number" min="2" max="15" placeholder="5" required />
            </div>

            {/* Pricing Section */}
            <div className="md:col-span-3 mt-4 pt-6 border-t border-border"></div>
            
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="price">Base Daily Rental Rate</Label>
              <div className="relative">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₱</span>
                 <Input id="price" type="number" placeholder="2500" className="pl-8 font-medium text-lg" required />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                 You can configure dynamic pricing rules later.
              </p>
            </div>

             <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Marketing Description for Renters</Label>
              <Textarea id="description" placeholder="Describe the vehicle's features, conditions, and rules..." className="resize-none h-24" />
            </div>
          </CardContent>
        </Card>

         {/* Step 4: Photos & Docs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted-foreground text-background text-xs">4</span>
               Media & Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2 pt-2">
             <div className="space-y-3">
              <Label>Primary Exterior Photo</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors aspect-video bg-muted/10">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <UploadCloud className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-medium">Upload Main Photo</p>
                <p className="text-[11px] text-muted-foreground mt-1">High quality exterior shot. Will be used on listings.</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <Label>OR/CR Registration Document</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors aspect-video bg-muted/10">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <UploadCloud className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-medium">Upload Document</p>
                <p className="text-[11px] text-muted-foreground mt-1">Required for verification before listing goes live.</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t border-border px-6 py-4 flex justify-between rounded-b-xl border-dashed">
             <p className="text-sm text-muted-foreground mt-2 max-w-sm">
               Note: You will set the vehicle's Availability Schedule in the next module after saving.
             </p>
             <div className="flex gap-3 mt-1">
               <Link href="/car-listings" className={buttonVariants({ variant: "outline" })}>Cancel</Link>
               <Button type="submit">Save & Go to Availability</Button>
             </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Calendar, User, CheckCircle2, AlertTriangle, FileText, Ban, Trash2, CalendarDays } from "lucide-react";
import Link from "next/link";
import { carListings, owners } from "@/lib/data/mock-data";
import { ListingStatus } from "@/types";
import { format } from "date-fns";
import Image from "next/image";

function getStatusBadge(status: ListingStatus) {
  switch (status) {
    case ListingStatus.ACTIVE:
      return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-500/20">{status}</Badge>;
    case ListingStatus.PENDING_APPROVAL:
      return <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-500/20">{status}</Badge>;
    case ListingStatus.BOOKED:
      return <Badge className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-500/20">{status}</Badge>;
    case ListingStatus.UNAVAILABLE:
      return <Badge variant="secondary" className="bg-muted text-muted-foreground">{status}</Badge>;
    case ListingStatus.SUSPENDED:
    case ListingStatus.REJECTED:
      return <Badge variant="destructive" className="bg-red-500/15 text-red-700 hover:bg-red-500/25 border-red-500/20">{status}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function CarListingDetailPage({ params }: { params: { id: string } }) {
  const car = carListings.find(c => c.id === params.id) || carListings[0];
  const owner = owners.find(o => o.id === car.ownerId) || owners[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/car-listings" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground -ml-3")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Listings
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {car.brand} {car.model} {car.year}
            </h1>
            {getStatusBadge(car.status)}
          </div>
          <p className="text-muted-foreground">
            <Badge variant="outline" className="font-mono text-xs mr-2">{car.plateNumber}</Badge>
            Added exactly {format(new Date(car.createdAt), "MMMM d, yyyy")}
          </p>
        </div>
        
        <div className="flex gap-2 shrink-0">
          {car.status === ListingStatus.PENDING_APPROVAL && (
            <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-sm">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approve Listing
            </Button>
          )}
          <Button variant="outline" className="shadow-sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" size="icon" className="shadow-sm" title="Delete or Archive">
             <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Photos & Owner */}
        <div className="md:col-span-1 space-y-6">
          <Card className="overflow-hidden border-border/50 shadow-sm">
            <div className="relative aspect-[4/3] bg-muted w-full">
              <Image
                src={car.photos[0]}
                alt={`${car.brand} ${car.model}`}
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="grid grid-cols-3 gap-1 p-1 bg-muted/30">
               {/* Placeholders for additional photos if any exist in the array (only 1 currently in mock) */}
               <div className="aspect-[4/3] relative bg-muted rounded-sm overflow-hidden border border-border">
                 <Image src={car.photos[0]} alt="Thumbnail" fill className="object-cover opacity-50 hover:opacity-100 transition-opacity cursor-pointer" />
               </div>
               <div className="aspect-[4/3] relative bg-muted rounded-sm border border-dashed border-border flex items-center justify-center text-muted-foreground text-xs cursor-pointer hover:bg-accent transition-colors">
                  + Add
               </div>
            </div>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 border-b border-border bg-muted/20">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                Owner Information
                <Badge variant="outline" className="font-normal">{owner.id}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {owner.fullName.charAt(0)}
                 </div>
                 <div>
                    <Link href={`/owners/${owner.id}`} className="text-sm font-semibold hover:underline hover:text-primary transition-colors">
                      {owner.fullName}
                    </Link>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Verified Owner
                    </p>
                 </div>
              </div>
              <div className="space-y-2 text-sm pt-2 border-t border-border/50">
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Mobile:</span>
                   <span className="font-medium text-right">{owner.contactNumber}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-muted-foreground">Listed Cars:</span>
                   <span className="font-medium text-right">{owner.carsCount} units</span>
                 </div>
              </div>
            </CardContent>
          </Card>

           <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 border-b border-border bg-emerald-500/5">
              <CardTitle className="text-sm font-semibold text-emerald-700">Financial Setup</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
               <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Base Daily Rate</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold tracking-tight text-emerald-600">₱{car.dailyPrice.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">/day</span>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Details & Tabs */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
              <div className="p-4 flex flex-col gap-1 items-center justify-center text-center">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Transmission</span>
                <span className="text-sm font-semibold text-foreground">{car.transmission}</span>
              </div>
              <div className="p-4 flex flex-col gap-1 items-center justify-center text-center">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Fuel Type</span>
                <span className="text-sm font-semibold text-foreground">{car.fuelType}</span>
              </div>
              <div className="p-4 flex flex-col gap-1 items-center justify-center text-center border-t md:border-t-0">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Capacity</span>
                <span className="text-sm font-semibold text-foreground">{car.seatingCapacity} Seats</span>
              </div>
              <div className="p-4 flex flex-col gap-1 items-center justify-center text-center border-t md:border-t-0">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Color</span>
                <span className="text-sm font-semibold text-foreground">{car.color}</span>
              </div>
            </div>
          </Card>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full justify-start border-b border-border rounded-none h-12 bg-transparent p-0 mb-6 space-x-6">
              <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 shadow-none data-[state=active]:shadow-none font-medium">
                 Vehicle Description
              </TabsTrigger>
              <TabsTrigger value="availability" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 shadow-none data-[state=active]:shadow-none font-medium text-blue-600 data-[state=active]:text-blue-700 data-[state=active]:border-blue-600">
                <CalendarDays className="w-4 h-4 mr-2" />
                Availability Setup
              </TabsTrigger>
               <TabsTrigger value="documents" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 shadow-none data-[state=active]:shadow-none font-medium">
                Car Documents
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                <h3 className="text-base font-semibold text-foreground">Marketing Description</h3>
                <p>{car.description || "No description provided for this listing."}</p>
                <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border">
                   <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                     <AlertTriangle className="w-4 h-4 text-amber-500" /> Admin/Approval Notes
                   </h4>
                   <p className="text-sm">{car.notes || "No internal notes."}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="availability" className="focus-visible:outline-none focus-visible:ring-0">
              <Card className="border-blue-200 shadow-sm bg-blue-50/30 overflow-hidden dark:bg-blue-950/10 dark:border-blue-900/50">
                 <CardHeader className="p-4 border-b border-blue-100 dark:border-blue-900/30 flex flex-row items-center justify-between bg-white dark:bg-background">
                    <CardTitle className="text-base font-semibold text-blue-800 dark:text-blue-400">Current Availability Pattern</CardTitle>
                    <Link href={`/availability?carId=${car.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/50")}>
                      Edit Schedule in Manager
                    </Link>
                 </CardHeader>
                 <CardContent className="p-0">
                    <div className="p-6 text-center">
                       <CalendarDays className="w-10 h-10 text-blue-300 mx-auto mb-3" />
                       <h4 className="text-lg font-bold text-foreground mb-1">{car.availabilitySummary || "Weekly Schedule Not Configured"}</h4>
                       <p className="text-sm text-muted-foreground max-w-md mx-auto">This car will only be bookable during these hours. Custom blocked dates and exceptions are managed in the Availability module.</p>
                       <Link href="/availability" className={cn(buttonVariants(), "mt-6 bg-blue-600 hover:bg-blue-700 text-white")}>
                          Open Availability Manager
                       </Link>
                    </div>
                 </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="focus-visible:outline-none focus-visible:ring-0">
               <div className="grid gap-4 sm:grid-cols-2">
                <Card className="border-border/50 shadow-sm">
                  <CardHeader className="p-4 border-b border-border bg-muted/20">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      OR/CR Registration
                      <Badge variant="outline" className="text-emerald-600 border-emerald-600 bg-emerald-50">Verified</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col items-center justify-center text-center border-t border-border bg-background">
                    <FileText className="w-8 h-8 text-muted-foreground mb-3 opacity-20" />
                    <p className="text-sm font-medium">or_cr_scanned_copy.pdf</p>
                    <p className="text-xs text-muted-foreground">Uploaded {format(new Date(car.createdAt), "MMM d")}</p>
                    <Button variant="ghost" size="sm" className="mt-4 text-primary">View Document</Button>
                  </CardContent>
                </Card>
                 <Card className="border-border/50 shadow-sm">
                  <CardHeader className="p-4 border-b border-border bg-muted/20">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      Comprehensive Insurance
                      <Badge variant="secondary">Pending Review</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col items-center justify-center text-center border-t border-border bg-background">
                    <FileText className="w-8 h-8 text-muted-foreground mb-3 opacity-20" />
                    <p className="text-sm font-medium">insurance_policy_2026.pdf</p>
                    <p className="text-xs text-muted-foreground">Uploaded {format(new Date(car.createdAt), "MMM d")}</p>
                     <Button variant="ghost" size="sm" className="mt-4 text-primary">View Document</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

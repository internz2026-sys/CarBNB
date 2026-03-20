import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Eye, Edit, ShieldCheck, Ban, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { carListings } from "@/lib/data/mock-data";
import { ListingStatus } from "@/types";
import { format } from "date-fns";

// Helper to get status badge colors
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

export default function CarListingsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Car Listings"
        description="Manage owner vehicles, approve listings, and monitor platform inventory."
      >
        <Link href="/car-listings/new" className={buttonVariants()}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Car
        </Link>
      </PageHeader>

      <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/20">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search cars, plates, owners..." className="pl-9 bg-background" />
          </div>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Button variant="secondary" size="sm" className="bg-background">All Status</Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground">Active</Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground">Pending</Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground">Booked</Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Car Model</TableHead>
                <TableHead>Plate No.</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="text-center">Price / Day</TableHead>
                <TableHead>Availability Summary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carListings.map((car) => (
                <TableRow key={car.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{car.brand} {car.model}</span>
                      <span className="text-xs text-muted-foreground font-normal">{car.year} • {car.transmission}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">{car.plateNumber}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <Link href={`/owners/${car.ownerId}`} className="text-sm font-medium hover:underline hover:text-primary transition-colors">
                        {car.ownerName}
                      </Link>
                      <span className="text-xs text-muted-foreground">{car.location}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-semibold text-emerald-600">
                    ₱{car.dailyPrice.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[150px] truncate" title={car.availabilitySummary}>
                    {car.availabilitySummary || "Not set"}
                  </TableCell>
                  <TableCell>{getStatusBadge(car.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center justify-center rounded-md text-sm font-medium hover:bg-muted h-8 w-8 outline-none">
                        <MoreHorizontal className="w-4 h-4" />
                        <span className="sr-only">Open menu</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem>
                          <Link href={`/car-listings/${car.id}`} className="w-full flex items-center">
                            <Eye className="w-4 h-4 mr-2" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Link href={`/car-listings/edit/${car.id}`} className="w-full flex items-center">
                            <Edit className="w-4 h-4 mr-2" /> Edit Listing
                          </Link>
                        </DropdownMenuItem>
                        {car.status === ListingStatus.PENDING_APPROVAL && (
                          <DropdownMenuItem className="text-emerald-600 focus:text-emerald-600">
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <Ban className="w-4 h-4 mr-2" /> Suspend
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

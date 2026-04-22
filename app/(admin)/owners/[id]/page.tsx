import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Phone, MapPin, Mail, CreditCard, Clock, FileText, AlertTriangle, Car, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getOwnerDocumentSignedUrl } from "@/lib/owner-documents";
import { OwnerStatus } from "@/types";
import { format } from "date-fns";
import Image from "next/image";
import { OwnerStatusActions } from "./status-actions";

// Owner admin data reflects live DB; no static pre-render.
export const dynamic = "force-dynamic";

function getStatusBadge(status: string) {
  switch (status) {
    case OwnerStatus.VERIFIED:
      return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-500/20">{status}</Badge>;
    case OwnerStatus.PENDING:
      return <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-500/20">{status}</Badge>;
    case OwnerStatus.SUSPENDED:
    case OwnerStatus.REJECTED:
      return <Badge variant="destructive" className="bg-red-500/15 text-red-700 hover:bg-red-500/25 border-red-500/20">{status}</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default async function OwnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [owner, ownerCars] = await Promise.all([
    db.owner.findUnique({ where: { id } }),
    db.carListing.findMany({ where: { ownerId: id }, orderBy: { createdAt: "desc" } }),
  ]);

  if (!owner) {
    notFound();
  }

  const [idSignedUrl, licenseSignedUrl] = await Promise.all([
    getOwnerDocumentSignedUrl(owner.idDocumentUrl),
    getOwnerDocumentSignedUrl(owner.licenseDocumentUrl),
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/owners" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground -ml-3")}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Owners
        </Link>
      </div>

      <PageHeader
        description={`Manage profile, verify documents, and view listed cars for ${owner.fullName}.`}
        title="Owner Details"
      >
        <div className="flex flex-col items-end gap-3">
          <OwnerStatusActions ownerId={owner.id} status={owner.status} />
          <Link
            className={buttonVariants({ variant: "outline" })}
            href={`/owners/${owner.id}/edit`}
          >
            Edit Details
          </Link>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center pb-6 border-b border-border">
                <div className="w-24 h-24 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-3xl font-bold mb-4">
                  {owner.fullName.charAt(0)}
                </div>
                <h2 className="text-xl font-bold">{owner.fullName}</h2>
                <div className="text-sm text-muted-foreground mb-3">{owner.id}</div>
                {getStatusBadge(owner.status)}
              </div>
              
              <div className="py-4 space-y-4">
                <div className="flex items-start gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span>{owner.contactNumber}</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="break-all">{owner.email}</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span>{owner.address}</span>
                </div>
                {owner.bankDetails && (
                  <div className="flex items-start gap-3 text-sm">
                    <CreditCard className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <span>{owner.bankDetails}</span>
                  </div>
                )}
                <div className="flex items-start gap-3 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span>Joined {format(new Date(owner.createdAt), "MMMM d, yyyy")}</span>
                </div>
              </div>

              {owner.remarks && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm font-medium mb-1 text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    Admin Notes
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{owner.remarks}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Earnings Summary Card */}
          <Card>
            <CardHeader className="pb-3 text-sm font-medium">Platform Stats</CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Active Cars</span>
                  <span className="font-bold">{owner.carsCount}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Total Payouts</span>
                  <span className="font-bold text-emerald-600">₱{owner.totalEarnings.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="cars" className="w-full">
            <TabsList className="w-full justify-start border-b border-border rounded-none h-12 bg-transparent p-0 mb-6 space-x-6">
              <TabsTrigger value="cars" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 shadow-none data-[state=active]:shadow-none">
                <Car className="w-4 h-4 mr-2" />
                Listed Cars
              </TabsTrigger>
              <TabsTrigger value="documents" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-3 shadow-none data-[state=active]:shadow-none">
                <FileText className="w-4 h-4 mr-2" />
                Verification Documents
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="cars" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold tracking-tight">Vehicles Owned</h3>
                <Link href={`/car-listings/new?owner=${owner.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  <Plus className="w-4 h-4 mr-2" /> Add Car
                </Link>
              </div>
              
              {ownerCars.length === 0 ? (
                <div className="p-8 text-center border border-dashed rounded-xl bg-muted/20">
                  <Car className="w-8 h-8 mx-auto text-muted-foreground mb-3 opacity-20" />
                  <p className="text-muted-foreground">No vehicles listed under this owner yet.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {ownerCars.map((car) => (
                    <Link href={`/car-listings/${car.id}`} key={car.id} className="block group">
                      <Card className="overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
                        <div className="aspect-[16/9] relative bg-muted overflow-hidden">
                          <Image
                            src={car.photos[0]}
                            alt={car.model}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute top-2 right-2">
                            <Badge variant="secondary" className="shadow-sm">{car.plateNumber}</Badge>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-base truncate pr-2">{car.brand} {car.model}</h4>
                            <span className="font-semibold text-emerald-600 whitespace-nowrap">₱{car.dailyPrice}/day</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{car.year} • {car.transmission} • {car.seatingCapacity} seats</p>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 p-2 rounded-md">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            {car.status}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="documents" className="space-y-4 focus-visible:outline-none focus-visible:ring-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold tracking-tight">Onboarding Documents</h3>
                <Link
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                  href={`/owners/${owner.id}/edit`}
                >
                  Upload / Replace
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <DocumentCard
                  signedUrl={idSignedUrl}
                  storedPath={owner.idDocumentUrl}
                  title="Government ID"
                />
                <DocumentCard
                  signedUrl={licenseSignedUrl}
                  storedPath={owner.licenseDocumentUrl}
                  title="Driver's License"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function DocumentCard({
  title,
  storedPath,
  signedUrl,
}: {
  title: string;
  storedPath: string | null;
  signedUrl: string | null;
}) {
  const hasDoc = Boolean(storedPath);
  const extension = storedPath?.split(".").pop()?.toLowerCase() ?? "";
  const isImage = ["jpg", "jpeg", "png", "webp"].includes(extension);

  return (
    <Card>
      <CardHeader className="p-4 pb-2 border-b border-border">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          {title}
          {hasDoc ? (
            <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/20">
              Uploaded
            </Badge>
          ) : (
            <Badge variant="secondary">Not uploaded</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 bg-muted/20">
        {hasDoc && signedUrl ? (
          isImage ? (
            <a
              className="block"
              href={signedUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <div className="aspect-[1.6/1] relative rounded-lg border border-dashed bg-background overflow-hidden">
                <Image
                  alt={title}
                  className="object-contain"
                  fill
                  src={signedUrl}
                  unoptimized
                />
              </div>
              <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                <ExternalLink className="w-3 h-3" />
                Open in new tab
              </div>
            </a>
          ) : (
            <a
              className="block"
              href={signedUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <div className="aspect-[1.6/1] rounded-lg border border-dashed bg-background flex flex-col items-center justify-center text-muted-foreground">
                <FileText className="w-8 h-8 mb-2" />
                <span className="text-xs font-medium uppercase">{extension} file</span>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  <ExternalLink className="w-3 h-3" />
                  Open in new tab
                </span>
              </div>
            </a>
          )
        ) : (
          <div className="aspect-[1.6/1] rounded-lg border border-dashed flex flex-col items-center justify-center text-muted-foreground bg-background">
            <FileText className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-xs">No document on file</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

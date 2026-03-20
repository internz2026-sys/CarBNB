import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function CustomersPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <PageHeader
        title="Renter CRM"
        description="Manage customer profiles, verify licenses, and review rental histories."
      />
      
      <Card className="border-dashed bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground">Customer Management</h3>
            <p className="text-muted-foreground max-w-sm mt-2">
              This module is planned for a future phase. For now, customer info is accessed directly through their Bookings.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <PageHeader
        title="Business Reports"
        description="Generate analytics, export data, and view platform trends."
      />
      
      <Card className="border-dashed bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground">Analytics Dashboard</h3>
            <p className="text-muted-foreground max-w-sm mt-2">
              Exportable PDF and CSV reports on revenue, owner performance, and car utilization will be available here.
            </p>
        </CardContent>
      </Card>
    </div>
  );
}

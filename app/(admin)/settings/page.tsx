import { PageHeader } from "@/components/layout/page-header";
import { getPlatformSettings } from "@/lib/platform-settings-server";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getPlatformSettings();

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      <PageHeader
        title="Platform Settings"
        description="Configure rules, fees, and system-wide preferences."
      />

      <SettingsForm
        initial={{
          commissionRate: settings.commissionRate,
          securityDeposit: settings.securityDeposit,
          autoApproveVerifiedCustomers: settings.autoApproveVerifiedCustomers,
          requireOwnerConfirmation: settings.requireOwnerConfirmation,
          minimumBookingNoticeHours: settings.minimumBookingNoticeHours,
          updatedAt: settings.updatedAt,
          updatedBy: settings.updatedBy,
        }}
      />
    </div>
  );
}

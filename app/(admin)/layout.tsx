import { MobileAdminNav, Sidebar } from "@/components/layout/sidebar";
import { Topnav } from "@/components/layout/topnav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top_right,#faf8ff_0%,#eaedff_42%,#f2f3ff_100%)]">
      <Sidebar />
      <Topnav />
      <main className="min-h-screen xl:pl-[18rem]">
        <div className="px-4 pb-10 pt-24 sm:px-6 lg:px-8 xl:px-6 xl:pb-12 xl:pt-24">
          <MobileAdminNav />
          {children}
        </div>
      </main>
    </div>
  );
}

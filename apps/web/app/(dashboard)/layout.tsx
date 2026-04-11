import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PromoBanner } from "@/components/layout/promo-banner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f3f3f3]">
      <Sidebar />
      <PromoBanner />
      <TopNav />
      <main className="md:ml-[88px] min-h-screen flex flex-col">
        <div className="mt-20 flex-1 pb-20 md:pb-0">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}

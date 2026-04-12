import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PromoBanner } from "@/components/layout/promo-banner";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const role = user?.role ?? "CONTRACTOR";

  return (
    <div className="min-h-screen bg-[#f3f3f3]">
      <Sidebar />
      <PromoBanner />
      <TopNav role={role} />
      <main className="md:ml-[88px] min-h-screen flex flex-col">
        <div className="mt-20 flex-1 pb-20 md:pb-0">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}

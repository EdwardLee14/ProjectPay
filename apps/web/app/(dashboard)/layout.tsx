import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { BottomNav } from "@/components/layout/bottom-nav";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await getCurrentUser();

  return (
    <div className="min-h-screen bg-[#F5F5F4]">
      <Sidebar />
      <TopNav />
      <main className="md:ml-[52px] min-h-screen flex flex-col">
        <div className="mt-12 flex-1 pb-20 md:pb-0">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}

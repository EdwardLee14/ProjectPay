import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopNav />
      <main className="md:ml-64 min-h-screen flex flex-col">
        <div className="mt-16 flex-1 pb-20 md:pb-0">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}

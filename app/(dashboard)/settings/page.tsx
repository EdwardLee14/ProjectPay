"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import shared from "@/styles/shared.module.css";

export default function SettingsPage() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <main className={shared.dashboardPage}>
      <div>
        <p className={shared.eyebrow}>Account</p>
        <h1 className={shared.pageTitle}>Settings</h1>
      </div>

      <div className="max-w-lg">
        <div className={shared.card}>
          <div className={shared.cardHeader}>
            <h3 className="text-sm font-bold text-off-black">Session</h3>
          </div>
          <div className={shared.cardBody}>
            <p className="text-sm text-off-black/60 mb-6">
              Sign out of your account on this device.
            </p>
            <Button variant="pill-destructive" onClick={handleSignOut} className="flex items-center gap-2">
              <Icon name="logout" className="text-lg" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

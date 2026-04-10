"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <Button
      variant="pill-destructive"
      onClick={handleSignOut}
      className="flex items-center gap-2"
    >
      <Icon name="logout" className="text-lg" />
      Sign Out &rarr;
    </Button>
  );
}

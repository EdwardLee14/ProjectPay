"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";

export function TopNav({ role }: { role: "CONTRACTOR" | "CLIENT" }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const displayName =
    user?.user_metadata?.full_name ??
    user?.email?.split("@")[0] ??
    "User";

  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <header className="fixed top-8 right-0 left-0 md:left-[88px] h-12 bg-white z-50 flex items-center px-5 gap-3 shadow-elevation-nav">
      {/* Brand — visible on mobile only */}
      <div className="md:hidden flex items-center gap-2 mr-auto">
        <h1 className="font-headline font-extrabold text-lg text-primary">VisiBill</h1>
      </div>

      {/* Centered search — Cosmos rounded input */}
      <div className="hidden md:flex flex-1 justify-center">
        <div className="relative w-full max-w-sm">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-off-black/25 text-base"
          />
          <input
            className="w-full pl-9 pr-4 py-1.5 bg-off-black/[0.03] border border-off-black/[0.08] rounded-full text-[13px] focus:ring-1 focus:ring-primary/30 focus:border-primary/20 focus:bg-white transition-all placeholder:text-off-black/30"
            placeholder="Search projects..."
            type="text"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2.5 ml-auto md:ml-0">
        {role === "CONTRACTOR" && (
          <Button variant="pill-orange" size="sm" className="h-7 px-3 text-[11px]" asChild>
            <Link href="/projects/new">
              <Icon name="add" className="text-xs" />
              New Project
            </Link>
          </Button>
        )}
        <button className="flex items-center justify-center w-9 h-9 text-off-black/35 hover:text-off-black hover:bg-off-black/[0.03] rounded-full transition-all">
          <Icon name="notifications" className="text-xl" />
        </button>
        <Link href="/settings" className="flex-shrink-0">
          {avatarUrl ? (
            <Image
              alt="User avatar"
              className="w-8 h-8 rounded-full object-cover hover:ring-2 hover:ring-primary/40 transition-all"
              src={avatarUrl}
              width={32}
              height={32}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}

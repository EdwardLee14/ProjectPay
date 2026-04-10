"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";

export function TopNav() {
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
    <header className="fixed top-0 right-0 left-0 md:left-64 h-14 bg-white z-50 flex items-center px-6 gap-4">
      {/* Brand — visible on mobile only */}
      <div className="md:hidden flex items-center gap-2 mr-auto">
        <h1 className="font-headline font-extrabold text-lg text-primary">VisiBill</h1>
      </div>

      {/* Centered search */}
      <div className="hidden md:flex flex-1 justify-center">
        <div className="relative w-full max-w-md">
          <Icon
            name="search"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-off-black/30 text-lg"
          />
          <input
            className="w-full pl-10 pr-4 py-2 bg-guild-cream/60 border-none rounded-full text-sm focus:ring-1 focus:ring-primary focus:bg-white transition-all placeholder:text-off-black/40"
            placeholder="Search projects..."
            type="text"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3 ml-auto md:ml-0">
        <Button variant="pill-orange" size="sm" asChild>
          <Link href="/projects/new">
            <Icon name="add" className="text-sm" />
            New Project
          </Link>
        </Button>
        <button className="p-2 text-off-black/40 hover:text-off-black rounded-full transition-colors">
          <Icon name="notifications" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-off-black">{displayName}</p>
          </div>
          {avatarUrl ? (
            <Image
              alt="User avatar"
              className="w-8 h-8 rounded-full object-cover"
              src={avatarUrl}
              width={32}
              height={32}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

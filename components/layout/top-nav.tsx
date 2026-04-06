"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/icon";
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
    <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-white shadow-soft z-50 flex items-center justify-between px-8">
      <div className="flex items-center gap-8">
        <div className="relative group">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg"
          />
          <input
            className="pl-10 pr-4 py-1.5 bg-surface-container-low border-none rounded-full text-sm w-64 focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground"
            placeholder="Search invoices..."
            type="text"
          />
        </div>
        <div className="hidden lg:flex items-center gap-6">
          <Link
            href="/projects"
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            Projects
          </Link>
          <Link
            href="/transactions"
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            Invoices
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/projects/new"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium active:scale-95 duration-200 flex items-center gap-2 shadow-sm"
        >
          <Icon name="add" className="text-sm" />
          New Project
        </Link>
        <div className="h-8 w-[1px] bg-outline-variant/20 mx-2" />
        <button className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors relative">
          <Icon name="notifications" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-white" />
        </button>
        <div className="flex items-center gap-3 ml-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-foreground">{displayName}</p>
            <p className="text-[10px] text-muted-foreground">Admin</p>
          </div>
          {avatarUrl ? (
            <Image
              alt="User avatar"
              className="w-8 h-8 rounded-full border border-outline-variant/30 object-cover"
              src={avatarUrl}
              width={32}
              height={32}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-foreground">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

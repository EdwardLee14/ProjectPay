"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/icon";
import type { User } from "@supabase/supabase-js";
import styles from "./top-nav.module.css";

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
    <header className={styles.header}>
      {/* Logo area — aligns with sidebar width */}
      <div className={styles.logoArea}>
        <span className={styles.logoText}>VB</span>
      </div>

      {/* Mobile brand */}
      <div className={styles.mobileBrand}>
        <h1 className={styles.brandText}>VisiBill</h1>
      </div>

      {/* Main nav content */}
      <div className={styles.navContent}>
        {/* Centered search */}
        <div className={styles.searchWrap}>
          <div className={styles.searchInner}>
            <Icon
              name="search"
              className={styles.searchIcon}
            />
            <input
              className={styles.searchInput}
              placeholder="Search projects..."
              type="text"
            />
          </div>
        </div>

        {/* Right actions */}
        <div className={styles.actions}>
          <button className={styles.bellBtn}>
            <Icon name="mail" className={styles.bellIcon} />
          </button>
          <button className={styles.bellBtn}>
            <Icon name="calendar_today" className={styles.bellIcon} />
          </button>
          <button className={styles.bellBtn}>
            <Icon name="notifications" className={styles.bellIcon} />
          </button>
          <div className={styles.actionDivider} />
          <Link href="/settings" className={styles.avatarLink}>
            {avatarUrl ? (
              <Image
                alt="User avatar"
                className={styles.avatarImg}
                src={avatarUrl}
                width={32}
                height={32}
              />
            ) : (
              <div className={styles.avatarFallback}>
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

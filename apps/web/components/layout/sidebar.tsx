"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import styles from "./sidebar.module.css";

const mainNav = [
  { label: "Dashboard", icon: "dashboard", href: "/dashboard" },
  { label: "Projects", icon: "account_tree", href: "/projects" },
  { label: "Transactions", icon: "receipt_long", href: "/transactions" },
  { label: "Team", icon: "group", href: "/team" },
  { label: "Messages", icon: "chat", href: "/messages" },
];

const bottomNav = [
  { label: "Settings", icon: "settings", href: "/settings" },
  { label: "Support", icon: "help", href: "/support" },
];

function NavItem({
  item,
  active,
}: {
  item: { label: string; icon: string; href: string };
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={active ? styles.navItemActive : styles.navItem}
    >
      <Icon
        name={item.icon}
        className={active ? styles.navIconActive : styles.navIcon}
        filled={active}
      />
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside className={styles.aside}>
      {/* Main navigation */}
      <nav className={styles.mainNav}>
        {mainNav.map((item) => (
          <NavItem key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </nav>

      {/* Bottom navigation */}
      <div className={styles.bottomNav}>
        {bottomNav.map((item) => (
          <NavItem key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

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
      className={cn(
        "flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl transition-all duration-150",
        active
          ? "bg-transparent text-off-black border border-primary"
          : "text-off-black/45 hover:bg-off-black/[0.03] hover:text-off-black border border-transparent"
      )}
    >
      <Icon
        name={item.icon}
        className={cn("text-[22px]", active ? "text-primary" : "")}
        filled={active}
      />
      <span
        className={cn(
          "text-[9px] leading-tight",
          active ? "font-semibold" : "font-medium"
        )}
      >
        {item.label}
      </span>
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
    <aside className="hidden md:flex flex-col h-screen w-[88px] left-0 top-0 fixed z-[60] bg-white border-r border-off-black/5">
      {/* Logo */}
      <div className="px-2 pt-4 pb-5 flex justify-center">
        <h1 className="font-headline font-extrabold text-sm text-off-black">
          VB
        </h1>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 px-2 space-y-1.5">
        {mainNav.map((item) => (
          <NavItem key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </nav>

      {/* Bottom navigation */}
      <div className="mt-auto px-2 pb-4 pt-3 border-t border-off-black/5 space-y-1.5">
        {bottomNav.map((item) => (
          <NavItem key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </div>
    </aside>
  );
}

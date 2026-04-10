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
];

const bottomNav = [
  { label: "Settings", icon: "settings", href: "/settings" },
  { label: "Support", icon: "help", href: "/support" },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 left-0 top-0 fixed z-[60] bg-guild-peach">
      <div className="px-6 pt-6 pb-8">
        <h1 className="font-headline font-extrabold text-xl text-off-black">
          VisiBill
        </h1>
        <p className="text-[10px] text-off-black/40 font-bold tracking-[0.12em] uppercase mt-1">
          ProjectPay
        </p>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {mainNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative px-4 py-2.5 rounded-lg flex items-center gap-3 transition-all duration-200",
                active
                  ? "bg-white/60 text-off-black"
                  : "text-off-black/60 hover:bg-white/30 hover:text-off-black"
              )}
            >
              <Icon
                name={item.icon}
                className="text-[20px]"
                filled={active}
              />
              <span
                className={cn(
                  "text-sm",
                  active ? "font-semibold" : "font-medium"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-3 pb-6 pt-4 border-t border-off-black/10 space-y-0.5">
        {bottomNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative px-4 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors",
                active
                  ? "bg-white/60 text-off-black"
                  : "text-off-black/60 hover:bg-white/30 hover:text-off-black"
              )}
            >
              <Icon name={item.icon} className="text-[20px]" filled={active} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

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
    <aside className="hidden md:flex flex-col h-screen w-64 left-0 top-0 fixed bg-surface-container-low p-6 z-[60]">
      <div className="mb-10">
        <h1 className="font-headline font-bold text-lg text-foreground">
          ProjectPay
        </h1>
        <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase mt-1">
          Management Console
        </p>
      </div>

      <nav className="flex-1 space-y-1">
        {mainNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-4 py-3 flex items-center gap-3 rounded-lg transition-all duration-200",
                active
                  ? "bg-white shadow-sm text-foreground"
                  : "text-muted-foreground hover:bg-white/50 hover:translate-x-1"
              )}
            >
              <Icon name={item.icon} className="text-[20px]" />
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

      <div className="mt-auto pt-6 space-y-4">
        <div className="bg-primary-container p-4 rounded-xl shadow-sm text-center">
          <p className="text-white text-xs font-semibold mb-3">
            Upgrade Plan
          </p>
          <button className="bg-white text-on-primary-fixed w-full py-2 rounded-lg text-xs font-bold active:scale-95 transition-all">
            Go Pro
          </button>
        </div>
        <div className="space-y-1">
          {bottomNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground px-4 py-2 flex items-center gap-3 hover:bg-white/50 rounded-lg text-sm font-medium transition-colors"
            >
              <Icon name={item.icon} className="text-[20px]" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}

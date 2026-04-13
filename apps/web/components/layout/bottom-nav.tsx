"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const items = [
  { label: "Dash", icon: "dashboard", href: "/dashboard" },
  { label: "Projects", icon: "account_tree", href: "/projects" },
  { label: "Pay", icon: "receipt_long", href: "/transactions" },
  { label: "Messages", icon: "chat", href: "/messages" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-border z-50 flex justify-around items-center px-4 h-16">
      {items.slice(0, 2).map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon name={item.icon} filled={active} />
            <span className={cn("text-[10px]", active ? "font-bold" : "font-medium")}>
              {item.label}
            </span>
          </Link>
        );
      })}

      <Link
        href="/projects/new"
        className="mb-8 p-3 bg-primary rounded-full text-primary-foreground active:scale-90 transition-transform"
      >
        <Icon name="add" />
      </Link>

      {items.slice(2).map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon name={item.icon} filled={active} />
            <span className={cn("text-[10px]", active ? "font-bold" : "font-medium")}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

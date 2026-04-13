"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import s from "@/app/(dashboard)/projects/projects.module.css";

export function ProjectsLayoutShell({
  listPanel,
  children,
}: {
  listPanel: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isStandalone = pathname === "/projects/new";

  if (isStandalone) {
    return <div className="overflow-y-auto h-full">{children}</div>;
  }

  return (
    <div className={s.masterDetail}>
      {listPanel}
      <div className={s.detailPanel}>{children}</div>
    </div>
  );
}

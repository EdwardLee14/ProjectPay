"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import s from "./projects.module.css";
import shared from "@/styles/shared.module.css";

type ProjectSummary = {
  id: string;
  name: string;
  status: string;
  otherName: string;
  spent: number;
  total: number;
  pct: number;
};

const TABS = [
  "All",
  "Active",
  "Draft",
  "Pending",
  "Complete",
  "Cancelled",
] as const;

const STATUS_MAP: Record<string, string[]> = {
  All: [],
  Active: ["ACTIVE"],
  Draft: ["DRAFT"],
  Pending: ["PENDING_APPROVAL", "PENDING_FUNDING"],
  Complete: ["COMPLETE"],
  Cancelled: ["CANCELLED"],
};

function statusLabel(status: string) {
  switch (status) {
    case "PENDING_APPROVAL":
      return "Pending Approval";
    case "PENDING_FUNDING":
      return "Pending Funding";
    default:
      return status.charAt(0) + status.slice(1).toLowerCase();
  }
}

const pctColor = (pct: number) =>
  pct > 100
    ? shared.statusCritical
    : pct >= 80
      ? shared.statusWarning
      : shared.statusNormal;

export function ProjectFilterTabs({
  projects,
  isContractor,
}: {
  projects: ProjectSummary[];
  isContractor: boolean;
}) {
  const [active, setActive] = useState<(typeof TABS)[number]>("All");

  const filtered =
    active === "All"
      ? projects
      : projects.filter((p) => STATUS_MAP[active]?.includes(p.status));

  return (
    <>
      {/* Filter tabs */}
      <div className={s.filterRow}>
        {TABS.map((tab) => (
          <button
            key={tab}
            className={active === tab ? s.filterTabActive : s.filterTab}
            onClick={() => setActive(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Card grid */}
      {filtered.length > 0 ? (
        <div className={s.cardGrid}>
          {filtered.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className={s.card}
            >
              <div className={s.cardBody}>
                <div className={s.cardTitleRow}>
                  <div>
                    <p className={s.cardName}>{project.name}</p>
                    <p className={s.cardSub}>
                      {isContractor ? "Client" : "Contractor"}:{" "}
                      {project.otherName}
                    </p>
                  </div>
                  <span
                    className={
                      project.status === "ACTIVE"
                        ? shared.badgeActive
                        : shared.badgeDefault
                    }
                  >
                    {statusLabel(project.status)}
                  </span>
                </div>

                {/* Progress */}
                <div>
                  <div className={s.budgetRow}>
                    <span className={s.budgetLabel}>
                      {formatCurrency(project.spent)} spent
                    </span>
                    <span className={cn(s.budgetPct, pctColor(project.pct))}>
                      {Math.round(project.pct)}%
                    </span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={project.pct} className="h-1.5" />
                  </div>
                </div>

                {/* Footer */}
                <div className={s.cardFooter}>
                  <span className={s.viewLink}>View details &rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className={s.emptyWrap}>
          <Icon name="folder_open" className="text-off-black/10" size={40} />
          <p className={cn(s.emptyTitle, "text-base")}>
            No {active.toLowerCase()} projects
          </p>
        </div>
      )}
    </>
  );
}

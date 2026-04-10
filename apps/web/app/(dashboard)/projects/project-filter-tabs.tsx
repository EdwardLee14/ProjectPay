"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
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

function accentClass(status: string) {
  switch (status) {
    case "ACTIVE":
      return s.accentActive;
    case "DRAFT":
      return s.accentDraft;
    case "PENDING_APPROVAL":
    case "PENDING_FUNDING":
      return s.accentPending;
    case "COMPLETE":
      return s.accentComplete;
    case "CANCELLED":
      return s.accentCancelled;
    default:
      return s.accentDraft;
  }
}

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
    ? shared.statusRed
    : pct >= 80
      ? shared.statusAmber
      : shared.statusGreen;

const barColor = (pct: number) =>
  pct > 100
    ? shared.progressRed
    : pct >= 80
      ? shared.progressAmber
      : shared.progressGreen;

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
              <div className={accentClass(project.status)} />
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
                  <div className={cn(shared.progressTrack, "mt-2")}>
                    <div
                      className={barColor(project.pct)}
                      style={{
                        width: `${Math.min(project.pct, 100)}%`,
                      }}
                    />
                  </div>
                  <p className={cn(s.budgetRow, "mt-1.5")}>
                    <span>{formatCurrency(project.total)} budget</span>
                  </p>
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

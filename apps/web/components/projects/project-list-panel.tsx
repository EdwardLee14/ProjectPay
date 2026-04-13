"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatCurrency, cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import s from "@/app/(dashboard)/projects/projects.module.css";
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

const TABS = ["All", "Active", "Draft"] as const;

const STATUS_MAP: Record<string, string[]> = {
  All: [],
  Active: ["ACTIVE"],
  Draft: ["DRAFT"],
};

function statusLabel(status: string) {
  switch (status) {
    case "PENDING_APPROVAL": return "Pending";
    case "PENDING_FUNDING": return "Funding";
    case "COUNTER_PROPOSED": return "Counter";
    default: return status.charAt(0) + status.slice(1).toLowerCase();
  }
}

export function ProjectListPanel({
  projects,
  isContractor,
}: {
  projects: ProjectSummary[];
  isContractor: boolean;
}) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("All");
  const [search, setSearch] = useState("");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = projects
    .filter((p) => {
      if (activeTab === "All") return p.status !== "CANCELLED";
      return STATUS_MAP[activeTab]?.includes(p.status);
    })
    .filter((p) =>
      search ? p.name.toLowerCase().includes(search.toLowerCase()) : true
    )
    .sort((a, b) =>
      sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    );

  const activeCount = projects.filter((p) => p.status !== "CANCELLED").length;

  return (
    <div className={s.listPanel}>
      <div className={s.listHeader}>
        <div className={s.listHeaderRow}>
          <div>
            <h2 className={s.listTitle}>Projects</h2>
            <span className={s.listCount}>
              {activeCount} project{activeCount !== 1 ? "s" : ""}
            </span>
          </div>
          {isContractor && (
            <Link href="/projects/new" className={s.newProjectBtn}>
              <Icon name="add" size={16} />
              New Project
            </Link>
          )}
        </div>

        <div className={s.searchWrap}>
          <Icon name="search" className={s.searchIcon} size={18} />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={s.searchInput}
          />
        </div>

        <div className={s.filterRow}>
          {TABS.map((tab) => (
            <button
              key={tab}
              className={
                activeTab === tab
                  ? shared.filterPillActive
                  : shared.filterPill
              }
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
          <button
            className={s.sortBtn}
            title={sortAsc ? "Sort Z–A" : "Sort A–Z"}
            onClick={() => setSortAsc(!sortAsc)}
          >
            <Icon
              name="sort"
              size={16}
              className={`transition-transform duration-200 ${sortAsc ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className={s.listScroll}>
        {filtered.length > 0 ? (
          filtered.map((project) => {
            const isSelected = pathname.includes(project.id);
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className={isSelected ? s.listItemActive : s.listItem}
              >
                <div className={s.listItemContent}>
                  <div className={s.listItemTopRow}>
                    <p className={s.listName}>{project.name}</p>
                    <span className={project.status === "ACTIVE" ? s.listItemBadgeActive : s.listItemBadgeDefault}>
                      {statusLabel(project.status)}
                    </span>
                  </div>
                  <p className={s.listSub}>
                    {isContractor ? "Client" : "Contractor"}: {project.otherName}
                  </p>
                  <div className={s.listItemBudgetRow}>
                    <span className={s.listItemBudgetLabel}>
                      {formatCurrency(project.spent)} / {formatCurrency(project.total)}
                    </span>
                    <span className={cn(s.listItemBudgetPct,
                      project.pct > 100 ? "text-peach-800" : project.pct >= 80 ? "text-peach-600" : "text-primary"
                    )}>
                      {Math.round(project.pct)}%
                    </span>
                  </div>
                  <div className={s.listItemProgress}>
                    <ProgressBar value={project.pct} className="h-1" />
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className={s.emptyList}>
            <Icon name="folder_open" className={s.emptyListIcon} size={40} />
            <p className={s.emptyListTitle}>
              No {activeTab.toLowerCase()} projects
            </p>
            <p className={s.emptyListDesc}>
              {search
                ? "Try a different search term"
                : "No projects match this filter"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

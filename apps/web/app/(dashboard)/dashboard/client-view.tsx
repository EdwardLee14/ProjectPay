"use client";

import Link from "next/link";
import { formatCurrency, cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import { PendingRequests, type PendingRequest } from "@/components/dashboard/pending-requests";
import { ApproveProjectButton } from "@/components/projects/approve-project-button";
import shared from "@/styles/shared.module.css";
import s from "./dashboard.module.css";

interface Category {
  id: string;
  name: string;
  allocatedAmount: number;
  spentAmount: number;
}

interface ClientProject {
  id: string;
  name: string;
  status: string;
  totalBudget: number;
  fundedAmount: number;
  stripeCardId: string | null;
  contractorName: string;
  totalSpent: number;
  categories: Category[];
}

interface ProjectRequest {
  id: string;
  name: string;
  status: "PENDING_APPROVAL" | "COUNTER_PROPOSED";
  totalBudget: number;
  counterBudget: number | null;
  contractorName: string;
  createdAt: string;
  description: string | null;
  categories: { id: string; name: string; allocatedAmount: number }[];
}

interface Props {
  userName: string;
  projects: ClientProject[];
  projectRequests: ProjectRequest[];
  pendingRequests: PendingRequest[];
  totalBudget: number;
  totalSpent: number;
  activeCount: number;
}

export function ClientDashboard({
  userName,
  projects,
  projectRequests,
  pendingRequests,
  totalBudget,
  totalSpent,
  activeCount,
}: Props) {
  const hasProjects = projects.length > 0;
  const hasAnything = hasProjects || projectRequests.length > 0;
  const remaining = totalBudget - totalSpent;
  const usagePct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <main className={shared.dashboardPage}>
      {/* Header */}
      <div className={s.header}>
        <div>
          <h1 className={shared.pageTitle}>
            Welcome back, {userName.split(" ")[0]}.
          </h1>
        </div>
        {hasProjects && (
          <p className={s.headerMeta}>
            {activeCount} active &middot; {projects.length} total
          </p>
        )}
      </div>

      {hasAnything ? (
        <>
          {/* KPIs — only shown once there are real (non-pending) projects */}
          {hasProjects && (
            <section className={s.kpiGrid}>
              {[
                {
                  label: "Active Projects",
                  value: String(activeCount),
                  sub: `${projects.length} total`,
                },
                {
                  label: "Total Budget",
                  value: formatCurrency(totalBudget),
                  sub: `across ${projects.length} project${projects.length !== 1 ? "s" : ""}`,
                },
                {
                  label: "Total Spent",
                  value: formatCurrency(totalSpent),
                  sub: `${Math.round(usagePct)}% of budget`,
                  delta: usagePct > 80 ? "up" : undefined,
                },
                {
                  label: "Remaining",
                  value: formatCurrency(remaining),
                  sub: `${Math.round(100 - usagePct)}% available`,
                },
              ].map((item) => (
                <div key={item.label} className={s.kpiCard}>
                  <div className={s.kpiLabel}>
                    <span className={s.kpiLabelText}>{item.label}</span>
                  </div>
                  <p className={s.kpiValue}>{item.value}</p>
                  <p className={s.kpiSub}>
                    {item.sub}
                    {item.delta === "up" && <span className={s.kpiDelta}>&uarr;</span>}
                  </p>
                </div>
              ))}
            </section>
          )}

          {/* ── Project requests (PENDING_APPROVAL / COUNTER_PROPOSED) ── */}
          {projectRequests.length > 0 && (
            <section className="space-y-3">
              <div className={s.sectionHeader}>
                <div className="flex items-center gap-2">
                  <h2 className={s.sectionHeaderTitle}>Incoming Requests</h2>
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold">
                    {projectRequests.length}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {projectRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl shadow-elevation-1 overflow-hidden border-l-4 border-primary"
                  >
                    <div className="px-5 pt-5 pb-4">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <p className="text-sm font-bold text-off-black">{req.name}</p>
                          <p className="text-xs text-off-black/40 mt-0.5">
                            From {req.contractorName} &middot;{" "}
                            {new Date(req.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          {req.description && (
                            <p className="text-xs text-off-black/60 mt-1">{req.description}</p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-lg font-bold text-off-black">
                            {formatCurrency(req.totalBudget)}
                          </p>
                          <p className="text-[10px] text-off-black/40">proposed budget</p>
                        </div>
                      </div>

                      {/* Category breakdown */}
                      {req.categories.length > 0 && (
                        <div className="mb-4 space-y-1.5 bg-off-black/[0.02] rounded-xl p-3">
                          <p className="text-[10px] font-bold text-off-black/40 uppercase tracking-widest mb-2">
                            Budget Breakdown
                          </p>
                          {req.categories.map((cat) => {
                            const pct = req.totalBudget > 0
                              ? (cat.allocatedAmount / req.totalBudget) * 100
                              : 0;
                            return (
                              <div key={cat.id} className="flex items-center justify-between text-xs">
                                <span className="text-off-black/70">{cat.name}</span>
                                <span className="font-medium text-off-black tabular-nums">
                                  {formatCurrency(cat.allocatedAmount)}
                                  <span className="text-off-black/30 ml-1">({Math.round(pct)}%)</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Counter note */}
                      {req.status === "COUNTER_PROPOSED" && req.counterBudget && (
                        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                          <p className="text-xs text-amber-700">
                            You countered at <span className="font-semibold">{formatCurrency(req.counterBudget)}</span>. Waiting for contractor to respond.
                          </p>
                        </div>
                      )}

                      {/* Actions — only shown when client needs to act */}
                      {req.status === "PENDING_APPROVAL" && (
                        <ApproveProjectButton
                          projectId={req.id}
                          totalBudget={req.totalBudget}
                        />
                      )}

                      <Link
                        href={`/projects/${req.id}`}
                        className="inline-block mt-3 text-xs font-semibold text-primary hover:underline"
                      >
                        View full details &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Change order / top-up pending approvals ── */}
          <PendingRequests requests={pendingRequests} />

          {/* ── Active projects ── */}
          {hasProjects && (
            <section className="space-y-3">
              <div className={s.sectionHeader}>
                <h2 className={s.sectionHeaderTitle}>Your Projects</h2>
                <Link href="/projects" className={s.sectionHeaderAction}>
                  View all &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {projects.map((project) => {
                  const pct =
                    project.totalBudget > 0
                      ? (project.totalSpent / project.totalBudget) * 100
                      : 0;
                  const isActive = project.status === "ACTIVE";

                  return (
                    <div
                      key={project.id}
                      className="bg-white rounded-2xl shadow-elevation-1 overflow-hidden"
                    >
                      <div className="px-5 pt-5 pb-4 border-b border-off-black/5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              href={`/projects/${project.id}`}
                              className="text-sm font-bold text-off-black hover:text-primary transition-colors truncate block"
                            >
                              {project.name}
                            </Link>
                            <p className="text-xs text-off-black/40 mt-0.5">
                              Contractor: {project.contractorName}
                            </p>
                          </div>
                          <span
                            className={cn(
                              shared.badgePill,
                              isActive ? shared.badgeActive : shared.badgeDefault
                            )}
                          >
                            {isActive && project.stripeCardId ? (
                              <span className="flex items-center gap-1">
                                <Icon name="credit_card" className="text-xs" />
                                Card Active
                              </span>
                            ) : (
                              project.status
                            )}
                          </span>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-off-black/50">
                              {formatCurrency(project.totalSpent)} spent
                            </span>
                            <span className="font-semibold text-off-black">
                              {formatCurrency(project.totalBudget)} total
                            </span>
                          </div>
                          <ProgressBar value={pct} className="h-2" />
                          <p className="text-[10px] text-off-black/30">
                            {formatCurrency(project.totalBudget - project.totalSpent)} remaining &middot; {Math.round(pct)}% used
                          </p>
                        </div>
                      </div>

                      {project.categories.length > 0 && (
                        <div className="px-5 py-4 space-y-3">
                          <p className="text-[10px] font-bold text-off-black/40 uppercase tracking-widest">
                            By Category
                          </p>
                          {project.categories.map((cat) => {
                            const catPct =
                              cat.allocatedAmount > 0
                                ? (cat.spentAmount / cat.allocatedAmount) * 100
                                : 0;
                            return (
                              <div key={cat.id} className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-off-black">
                                    {cat.name}
                                  </span>
                                  <span className="text-xs text-off-black/40 tabular-nums">
                                    {formatCurrency(cat.spentAmount)}{" "}
                                    <span className="text-off-black/25">/</span>{" "}
                                    {formatCurrency(cat.allocatedAmount)}
                                  </span>
                                </div>
                                <ProgressBar value={catPct} className="h-1.5" />
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="px-5 pb-5">
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          View details &rarr;
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      ) : (
        /* Empty state */
        <section className={s.emptyGrid}>
          <div className={s.emptyHero}>
            <p className="text-[10px] lg:text-xs font-bold uppercase tracking-[0.15em] text-white">
              Welcome
            </p>
            <h2 className={s.emptyHeroTitle}>No projects yet.</h2>
            <p className={s.emptyHeroDesc}>
              Your contractor will share a project with you to review. Once
              shared, you&apos;ll be able to approve the budget and a virtual
              card will be issued for the project.
            </p>
          </div>
          <div className={s.emptySteps}>
            {[
              {
                icon: "mark_email_unread",
                title: "Wait for an invite",
                desc: "Your contractor will share a project link with you.",
              },
              {
                icon: "fact_check",
                title: "Review & approve",
                desc: "Check the budget breakdown and approve to issue the card.",
              },
              {
                icon: "monitoring",
                title: "Track spending",
                desc: "See every transaction in real time as work happens.",
              },
            ].map((item, i) => (
              <div
                key={item.title}
                className={i < 2 ? s.emptyStepBorder : s.emptyStep}
              >
                <Icon
                  name={item.icon}
                  className="text-lg lg:text-xl text-primary flex-shrink-0 mt-0.5"
                />
                <div>
                  <p className={s.emptyStepTitle}>{item.title}</p>
                  <p className={s.emptyStepDesc}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

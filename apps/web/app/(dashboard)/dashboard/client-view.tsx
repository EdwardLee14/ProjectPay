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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          <h1 className={shared.pageTitle}>Dashboard</h1>
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
            <section className={s.clientSectionWrap}>
              <div className={s.sectionHeader}>
                <div className={s.clientSectionHeaderRow}>
                  <h2 className={s.sectionHeaderTitle}>Incoming Requests</h2>
                  <span className={s.clientRequestCountBadge}>
                    {projectRequests.length}
                  </span>
                </div>
              </div>

              <div className={s.clientRequestsInner}>
                {projectRequests.map((req) => (
                  <div
                    key={req.id}
                    className={s.clientRequestCard}
                  >
                    <div className={s.clientRequestBody}>
                      {/* Header row */}
                      <div className={s.clientRequestHeaderRow}>
                        <div>
                          <p className={s.clientRequestName}>{req.name}</p>
                          <p className={s.clientRequestMeta}>
                            From {req.contractorName} &middot;{" "}
                            {new Date(req.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          {req.description && (
                            <p className={s.clientRequestDesc}>{req.description}</p>
                          )}
                        </div>
                        <div className={s.clientRequestBudgetWrap}>
                          <p className={s.clientRequestBudget}>
                            {formatCurrency(req.totalBudget)}
                          </p>
                          <p className={s.clientRequestBudgetLabel}>proposed budget</p>
                        </div>
                      </div>

                      {/* Category breakdown */}
                      {req.categories.length > 0 && (
                        <div className={s.clientCategoryBreakdown}>
                          <p className={s.clientCategoryTitle}>
                            Budget Breakdown
                          </p>
                          {req.categories.map((cat) => {
                            const pct = req.totalBudget > 0
                              ? (cat.allocatedAmount / req.totalBudget) * 100
                              : 0;
                            return (
                              <div key={cat.id} className={s.clientCategoryRow}>
                                <span className={s.clientCategoryName}>{cat.name}</span>
                                <span className={s.clientCategoryAmount}>
                                  {formatCurrency(cat.allocatedAmount)}
                                  <span className={s.clientCategoryPct}>({Math.round(pct)}%)</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Counter note */}
                      {req.status === "COUNTER_PROPOSED" && req.counterBudget && (
                        <div className={s.clientCounterNote}>
                          <p className={s.clientCounterText}>
                            You countered at <span className={s.clientCounterAmount}>{formatCurrency(req.counterBudget)}</span>. Waiting for contractor to respond.
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
                        className={s.clientViewLink}
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
            <section className={s.clientSectionWrap}>
              <div className={s.sectionHeader}>
                <h2 className={s.sectionHeaderTitle}>Your Projects</h2>
                <Link href="/projects" className={s.sectionHeaderAction}>
                  View all &rarr;
                </Link>
              </div>

              <div className={s.clientProjectsGrid}>
                {projects.map((project) => {
                  const pct =
                    project.totalBudget > 0
                      ? (project.totalSpent / project.totalBudget) * 100
                      : 0;
                  const isActive = project.status === "ACTIVE";

                  return (
                    <div
                      key={project.id}
                      className={s.clientProjectCard}
                    >
                      <div className={s.clientProjectTop}>
                        <div className={s.clientProjectHeaderRow}>
                          <div className={s.clientProjectNameWrap}>
                            <Link
                              href={`/projects/${project.id}`}
                              className={s.clientProjectName}
                            >
                              {project.name}
                            </Link>
                            <p className={s.clientProjectContractor}>
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
                              <span className={s.badgeIconWrap}>
                                <Icon name="credit_card" className={s.badgeIconSmall} />
                                Card Active
                              </span>
                            ) : (
                              project.status
                            )}
                          </span>
                        </div>

                        <div className={s.clientProjectBudgetRow}>
                          <div className={s.clientProjectSpentRow}>
                            <span className={s.clientProjectSpentLabel}>
                              {formatCurrency(project.totalSpent)} spent
                            </span>
                            <span className={s.clientProjectTotalLabel}>
                              {formatCurrency(project.totalBudget)} total
                            </span>
                          </div>
                          <ProgressBar value={pct} className="h-2" />
                          <p className={s.clientProjectRemaining}>
                            {formatCurrency(project.totalBudget - project.totalSpent)} remaining &middot; {Math.round(pct)}% used
                          </p>
                        </div>
                      </div>

                      {project.categories.length > 0 && (
                        <div className={s.clientProjectCategories}>
                          <p className={s.clientProjectCategoryTitle}>
                            By Category
                          </p>
                          {project.categories.map((cat) => {
                            const catPct =
                              cat.allocatedAmount > 0
                                ? (cat.spentAmount / cat.allocatedAmount) * 100
                                : 0;
                            return (
                              <div key={cat.id} className={s.clientProjectCategoryRow}>
                                <div className={s.clientProjectCategoryHeader}>
                                  <span className={s.clientProjectCategoryName}>
                                    {cat.name}
                                  </span>
                                  <span className={s.clientProjectCategoryAmounts}>
                                    {formatCurrency(cat.spentAmount)}{" "}
                                    <span className={s.clientProjectCategorySlash}>/</span>{" "}
                                    {formatCurrency(cat.allocatedAmount)}
                                  </span>
                                </div>
                                <ProgressBar value={catPct} className="h-1.5" />
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className={s.clientProjectFooter}>
                        <Link
                          href={`/projects/${project.id}`}
                          className={s.clientProjectViewLink}
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
            <p className={s.emptyHeroEyebrow}>
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
                  className={s.emptyStepIcon}
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

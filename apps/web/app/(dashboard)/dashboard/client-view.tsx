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

interface Transaction {
  id: string;
  merchantName: string;
  amount: number;
  categoryCode: string;
  projectName: string;
  createdAt: string;
}

interface Props {
  userName: string;
  projects: ClientProject[];
  projectRequests: ProjectRequest[];
  pendingRequests: PendingRequest[];
  totalBudget: number;
  totalSpent: number;
  totalFunded: number;
  activeCount: number;
  recentTransactions: Transaction[];
}

export function ClientDashboard({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userName,
  projects,
  projectRequests,
  pendingRequests,
  totalBudget,
  totalSpent,
  totalFunded,
  activeCount,
  recentTransactions,
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

          {/* ── Budget overview + activity ── */}
          {hasProjects && (
            <section className={s.row2col}>
              {/* Budget utilization banner — matches contractor pattern */}
              <div className={cn(s.utilBanner, s.col5)}>
                {/* Geometric visualization — right side background */}
                <div className={s.utilViz}>
                  <svg viewBox="0 0 240 260" preserveAspectRatio="xMaxYMin slice">
                    <defs>
                      <pattern id="clientUtilHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(135)">
                        <line x1="0" y1="0" x2="0" y2="6" stroke="#1a1a1a" strokeWidth="0.7" />
                      </pattern>
                      <clipPath id="clientUtilShapeClip">
                        <path d="M0,260 L40,200 L70,120 L110,40 L135,80 L160,15 L195,70 L230,0 L240,0 L240,260 Z" />
                      </clipPath>
                    </defs>
                    <g transform="translate(8, 3)">
                      <path
                        d="M60,260 L90,140 L120,55 L148,95 L174,22 L212,85 L250,8 L260,15 L260,260 Z"
                        fill="#1a1a1a"
                        opacity="0.1"
                      />
                    </g>
                    <path
                      d="M0,260 L40,200 L70,120 L110,40 L135,80 L160,15 L195,70 L230,0 L240,0 L240,260 Z"
                      fill="#D65A0A"
                      opacity="0.75"
                    />
                    <rect
                      x="0" y="0" width="240" height="260"
                      fill="url(#clientUtilHatch)"
                      opacity="0.35"
                      clipPath="url(#clientUtilShapeClip)"
                    />
                  </svg>
                </div>

                <div className={s.utilOuterContent}>
                  <div className={s.utilHeader}>
                    <div className={s.utilHeaderText}>
                      <p className={s.utilEyebrow}>Your Projects&apos;</p>
                      <p className={s.utilTitle}>Budget Overview</p>
                    </div>
                  </div>

                  <div className={s.utilDivider} />

                  <div className={s.utilInnerCard}>
                    <div className={s.utilInnerLeft}>
                      <p className={s.utilInnerTitle}>Overall Spend</p>
                      <div className={s.utilProgressRow}>
                        <ProgressBar value={usagePct} className="flex-1" trackClassName="bg-peach-100" borderClassName="border border-off-black" />
                        <span className={s.utilProgressPct}>{Math.round(usagePct)}%</span>
                      </div>
                      <div className={s.utilCardMeta}>
                        <span>{formatCurrency(totalSpent)} spent</span>
                        <span className={s.utilMetaDot} />
                        <span>{formatCurrency(totalBudget)} budget</span>
                      </div>

                      <div className={s.utilSubSection}>
                        <p className={s.utilSubLabel}>
                          {projects.length} project{projects.length !== 1 ? "s" : ""} &middot; {activeCount} active
                        </p>
                        <p className={s.utilSubDesc}>
                          {formatCurrency(remaining)} remaining across all projects
                        </p>
                      </div>
                    </div>

                    <div className={s.utilInnerDivider} />

                    {/* Funding gauge */}
                    {(() => {
                      const fundedPct = totalBudget > 0 ? Math.round((totalFunded / totalBudget) * 100) : 0;
                      const gaugeColor =
                        fundedPct >= 90
                          ? "hsl(152 60% 40%)"
                          : fundedPct >= 50
                            ? "hsl(38 90% 50%)"
                            : "hsl(0 72% 51%)";
                      const gaugeLabel =
                        fundedPct >= 90
                          ? "Funded"
                          : fundedPct >= 50
                            ? "Partial"
                            : "Low";
                      const circumference = 2 * Math.PI * 15.5;
                      const arcLength = (fundedPct / 100) * circumference;
                      return (
                        <div className={s.utilInnerRight}>
                          <div className={s.utilDonut}>
                            <svg viewBox="0 0 36 36" className="w-full h-full">
                              <circle
                                cx="18" cy="18" r="15.5"
                                fill="none"
                                stroke="hsl(0 0% 0% / 0.08)"
                                strokeWidth="3"
                              />
                              <circle
                                cx="18" cy="18" r="15.5"
                                fill="none"
                                stroke={gaugeColor}
                                strokeWidth="3"
                                strokeDasharray={`${arcLength} ${circumference - arcLength}`}
                                strokeDashoffset={circumference * 0.25}
                                strokeLinecap="round"
                                style={{ transition: "stroke-dasharray 0.6s ease" }}
                              />
                            </svg>
                            <div className={s.utilDonutCenter}>
                              <span className={s.utilDonutScore}>{fundedPct}</span>
                              <span className={s.utilDonutLabel}>{gaugeLabel}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Recent transactions */}
              <div className={cn(s.activityCard, s.col7)}>
                <div className={s.activityHeader}>
                  <h3 className={s.activityHeaderTitle}>Recent Activity</h3>
                  <span className={s.activityHeaderCount}>
                    {recentTransactions.length > 0
                      ? `${recentTransactions.length} recent`
                      : "No activity"}
                  </span>
                </div>
                <div>
                  {recentTransactions.length > 0 ? (
                    recentTransactions.slice(0, 5).map((tx) => (
                      <div key={tx.id} className={s.activityRow}>
                        <span className={s.activityDot} />
                        <div>
                          <p className={s.activityTitle}>
                            {tx.merchantName} &mdash; {formatCurrency(tx.amount)}
                          </p>
                          <p className={s.activityMeta}>
                            {tx.projectName} &middot;{" "}
                            {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={s.activityRow}>
                      <span className={s.activityDot} />
                      <div>
                        <p className={s.activityTitle}>No transactions yet</p>
                        <p className={s.activityMeta}>
                          Spending will appear here once a project is active
                        </p>
                      </div>
                    </div>
                  )}
                </div>
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
                  const remainingAmt = project.totalBudget - project.totalSpent;

                  return (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className={s.clientProjectCard}
                    >
                      {/* Header */}
                      <div className={s.clientProjectTop}>
                        <div className={s.clientProjectHeaderRow}>
                          <div className={s.clientProjectNameWrap}>
                            <p className={s.clientProjectName}>
                              {project.name}
                            </p>
                            <p className={s.clientProjectContractor}>
                              {project.contractorName}
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
                                Active
                              </span>
                            ) : (
                              project.status
                            )}
                          </span>
                        </div>

                        {/* Budget bar */}
                        <div className={s.clientProjectBudgetRow}>
                          <ProgressBar
                            value={pct}
                            className="h-2"
                            trackClassName="bg-peach-100"
                            borderClassName="border border-off-black"
                          />
                          <div className={s.clientProjectSpentRow}>
                            <span className={s.clientProjectSpentLabel}>
                              {formatCurrency(project.totalSpent)} of {formatCurrency(project.totalBudget)}
                            </span>
                            <span className={cn(
                              s.clientProjectPctLabel,
                              pct > 90 ? "text-peach-800" : pct > 70 ? "text-peach-600" : "text-primary"
                            )}>
                              {Math.round(pct)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Category breakdown */}
                      {project.categories.length > 0 && (
                        <div className={s.clientProjectCategories}>
                          <p className={s.clientProjectCategoryTitle}>
                            Budget Breakdown
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
                                <ProgressBar
                                  value={catPct}
                                  className="h-1.5"
                                  trackClassName="bg-peach-100"
                                  borderClassName="border border-off-black"
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Footer */}
                      <div className={s.clientProjectFooter}>
                        <span className={s.clientProjectRemaining}>
                          {formatCurrency(remainingAmt)} remaining
                        </span>
                        <span className={s.clientProjectArrow}>
                          <Icon name="arrow_forward" className="text-sm" />
                        </span>
                      </div>
                    </Link>
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

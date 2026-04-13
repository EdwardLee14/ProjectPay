"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import s from "./budget-request-list.module.css";

interface BudgetRequest {
  id: string;
  type: "change_order" | "top_up";
  amount: number;
  reason: string;
  status: string;
  categoryName: string | null;
  requesterName: string;
  createdAt: string;
}

function statusClass(status: string) {
  switch (status) {
    case "PENDING":
      return s.badgePending;
    case "APPROVED":
      return s.badgeApproved;
    case "REJECTED":
      return s.badgeRejected;
    default:
      return s.badgeDefault;
  }
}

export function BudgetRequestList({
  requests,
  userRole,
  isContractor,
}: {
  requests: BudgetRequest[];
  userRole: string;
  isContractor: boolean;
}) {
  const router = useRouter();
  const [acting, setActing] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function handleAction(
    id: string,
    type: string,
    action: "approve" | "reject" | "delete"
  ) {
    setActing(id);
    try {
      const endpoint =
        type === "change_order" ? "/api/change-orders" : "/api/top-up-requests";

      if (action === "delete") {
        await fetch(endpoint, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
      } else {
        await fetch(endpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            status: action === "approve" ? "APPROVED" : "REJECTED",
          }),
        });
      }
      router.refresh();
    } finally {
      setActing(null);
    }
  }

  function toggleExpand(id: string) {
    setExpandedId(expandedId === id ? null : id);
  }

  if (requests.length === 0) {
    return (
      <div className={s.emptyState}>
        <Icon name="swap_horiz" className={s.emptyIcon} size={40} />
        <p className={s.emptyTitle}>No budget requests yet</p>
        <p className={s.emptyDesc}>
          Budget adjustment requests will appear here
        </p>
      </div>
    );
  }

  // Group by date
  const grouped: Record<string, BudgetRequest[]> = {};
  for (const req of requests) {
    const day = new Date(req.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(req);
  }

  return (
    <div className={s.feedContainer}>
      <div className={s.feedHeader}>
        <h3 className={s.feedTitle}>Budget Requests</h3>
      </div>

      {Object.entries(grouped).map(([day, reqs]) => (
        <div key={day}>
          <div className={s.dateHeader}>
            <span className={s.dateLabel}>{day}</span>
          </div>
          <div className={s.dateGroup}>
            {reqs.map((req) => {
              const isExpanded = expandedId === req.id;

              return (
                <div key={req.id}>
                  {/* Row */}
                  <div
                    className={s.reqRow}
                    onClick={() => toggleExpand(req.id)}
                  >
                    <div
                      className={
                        req.status === "PENDING"
                          ? s.reqIconActive
                          : s.reqIcon
                      }
                    >
                      <Icon
                        name={
                          req.type === "change_order"
                            ? "swap_horiz"
                            : "trending_up"
                        }
                        className={s.reqIconSymbol}
                      />
                    </div>

                    <div className={s.reqDetails}>
                      <p className={s.reqTitle}>
                        {req.type === "change_order"
                          ? "Change Order"
                          : "Top-Up Request"}
                      </p>
                      <div className={s.reqMeta}>
                        {req.categoryName && (
                          <span className={s.reqCategory}>
                            {req.categoryName}
                          </span>
                        )}
                        <span className={s.reqRequester}>
                          {req.requesterName}
                        </span>
                      </div>
                    </div>

                    <span className={statusClass(req.status)}>
                      {req.status}
                    </span>

                    <Icon
                      name="expand_more"
                      className={
                        isExpanded ? s.chevronOpen : s.chevron
                      }
                    />

                    <span className={s.reqAmount}>
                      +{formatCurrency(req.amount)}
                    </span>
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className={s.expandedPanel}>
                      <div className={s.detailGrid}>
                        <div className={s.detailRow}>
                          <span className={s.detailLabel}>Type</span>
                          <span className={s.detailValue}>
                            {req.type === "change_order"
                              ? "Change Order"
                              : "Top-Up"}
                          </span>
                        </div>
                        <div className={s.detailRow}>
                          <span className={s.detailLabel}>Amount</span>
                          <span className={s.detailValue}>
                            {formatCurrency(req.amount)}
                          </span>
                        </div>
                        {req.categoryName && (
                          <div className={s.detailRow}>
                            <span className={s.detailLabel}>Category</span>
                            <span className={s.detailValue}>
                              {req.categoryName}
                            </span>
                          </div>
                        )}
                        <div className={s.detailRow}>
                          <span className={s.detailLabel}>Requested by</span>
                          <span className={s.detailValue}>
                            {req.requesterName}
                          </span>
                        </div>
                      </div>

                      <div className={s.reasonBlock}>
                        <span className={s.reasonLabel}>Reason</span>
                        <p className={s.reasonText}>{req.reason}</p>
                      </div>

                      {/* Actions */}
                      {req.status === "PENDING" && (
                        <div className={s.actions}>
                          {userRole === "CLIENT" && (
                            <>
                              <button
                                onClick={() =>
                                  handleAction(req.id, req.type, "approve")
                                }
                                disabled={acting === req.id}
                                className={s.approveBtn}
                              >
                                <Icon name="check" className="text-xs" />
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  handleAction(req.id, req.type, "reject")
                                }
                                disabled={acting === req.id}
                                className={s.rejectBtn}
                              >
                                <Icon name="close" className="text-xs" />
                                Reject
                              </button>
                            </>
                          )}
                          {isContractor && (
                            <button
                              onClick={() =>
                                handleAction(req.id, req.type, "delete")
                              }
                              disabled={acting === req.id}
                              className={s.deleteBtn}
                            >
                              <Icon name="delete" className="text-xs" />
                              {acting === req.id ? "Deleting..." : "Delete"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

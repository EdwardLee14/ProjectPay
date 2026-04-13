"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import s from "./pending-requests.module.css";

interface PendingChangeOrder {
  id: string;
  type: "change_order";
  projectName: string;
  projectId: string;
  amount: number;
  reason: string;
  categoryName: string | null;
  requesterName: string;
  createdAt: string;
}

interface PendingTopUp {
  id: string;
  type: "top_up";
  projectName: string;
  projectId: string;
  amount: number;
  reason: string;
  categoryName: string | null;
  requesterName: string;
  createdAt: string;
}

export type PendingRequest = PendingChangeOrder | PendingTopUp;

export function PendingRequests({ requests }: { requests: PendingRequest[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (requests.length === 0) return null;

  async function handleAction(
    req: PendingRequest,
    status: "APPROVED" | "REJECTED"
  ) {
    setLoadingId(req.id);
    try {
      const url =
        req.type === "change_order"
          ? "/api/change-orders"
          : "/api/top-up-requests";
      await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: req.id, status }),
      });
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div className={s.headerLeft}>
          <Icon name="pending_actions" className={s.headerIcon} />
          <h2 className={s.headerTitle}>
            Pending Approvals
          </h2>
          <span className={s.headerCount}>
            {requests.length}
          </span>
        </div>
      </div>

      <div className={s.list}>
        {requests.map((req) => (
          <div
            key={req.id}
            className={s.row}
          >
            {/* Type icon */}
            <div className={s.typeIcon}>
              <Icon
                name={req.type === "change_order" ? "receipt_long" : "trending_up"}
                className={s.typeIconInner}
              />
            </div>

            {/* Info */}
            <div className={s.info}>
              <div className={s.infoTop}>
                <span className={s.infoAmount}>
                  +{formatCurrency(req.amount)}
                </span>
                <span
                  className={
                    req.type === "change_order"
                      ? s.typeBadgeChangeOrder
                      : s.typeBadgeTopUp
                  }
                >
                  {req.type === "change_order" ? "Change Order" : "Budget Request"}
                </span>
                {req.categoryName && (
                  <span className={s.categoryLabel}>
                    {req.categoryName}
                  </span>
                )}
              </div>
              <p className={s.reason}>{req.reason}</p>
              <p className={s.meta}>
                {req.projectName} &middot; {req.requesterName} &middot;{" "}
                {new Date(req.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* Actions */}
            <div className={s.actions}>
              <button
                onClick={() => handleAction(req, "APPROVED")}
                disabled={loadingId === req.id}
                className={s.approveBtn}
              >
                <Icon name="check" className={s.approveBtnIcon} />
                Approve
              </button>
              <button
                onClick={() => handleAction(req, "REJECTED")}
                disabled={loadingId === req.id}
                className={s.declineBtn}
              >
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

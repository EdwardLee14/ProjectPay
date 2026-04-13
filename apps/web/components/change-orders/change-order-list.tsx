"use client";

import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import s from "./change-order-list.module.css";

interface ChangeOrderItem {
  id: string;
  amount: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COUNTERED";
  createdAt: string;
  requester: {
    name: string;
  };
}

const badgeClassMap: Record<string, string> = {
  PENDING: s.badgePending,
  APPROVED: s.badgeApproved,
  REJECTED: s.badgeRejected,
  COUNTERED: s.badgeCountered,
};

export function ChangeOrderList({
  changeOrders,
  userRole,
}: {
  changeOrders: ChangeOrderItem[];
  userRole: "CONTRACTOR" | "CLIENT";
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleAction(id: string, status: "APPROVED" | "REJECTED") {
    setLoadingId(id);
    try {
      await fetch("/api/change-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  if (changeOrders.length === 0) {
    return (
      <div>
        <h3 className={s.title}>Change Orders</h3>
        <p className={s.emptyText}>No change orders yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className={s.title}>Change Orders</h3>
      <div className={s.list}>
        {changeOrders.map((co) => (
          <div key={co.id} className={s.orderRow}>
            <div className={s.orderInfo}>
              <div className={s.orderTopRow}>
                <p className={s.orderReason}>{co.reason}</p>
                <span className={badgeClassMap[co.status] ?? s.badgePending}>
                  {co.status}
                </span>
              </div>
              <p className={s.orderMeta}>
                {formatCurrency(co.amount)} &middot; {co.requester.name} &middot;{" "}
                {new Date(co.createdAt).toLocaleDateString()}
              </p>
            </div>
            {userRole === "CLIENT" && co.status === "PENDING" && (
              <div className={s.actions}>
                <button
                  className={s.approveBtn}
                  onClick={() => handleAction(co.id, "APPROVED")}
                  disabled={loadingId === co.id}
                >
                  Approve
                </button>
                <button
                  className={s.rejectBtn}
                  onClick={() => handleAction(co.id, "REJECTED")}
                  disabled={loadingId === co.id}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

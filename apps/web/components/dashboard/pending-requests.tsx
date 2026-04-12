"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

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
    <div className="bg-white rounded-2xl shadow-elevation-1 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-off-black/5">
        <div className="flex items-center gap-2">
          <Icon name="pending_actions" className="text-primary text-lg" />
          <h2 className="text-sm font-bold text-off-black">
            Pending Approvals
          </h2>
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold">
            {requests.length}
          </span>
        </div>
      </div>

      <div className="divide-y divide-off-black/5">
        {requests.map((req) => (
          <div
            key={req.id}
            className="flex items-center gap-4 px-5 py-4 hover:bg-off-black/[0.01] transition-colors"
          >
            {/* Type icon */}
            <div className="w-9 h-9 rounded-full bg-off-black/5 flex items-center justify-center shrink-0">
              <Icon
                name={req.type === "change_order" ? "receipt_long" : "trending_up"}
                className="text-base text-off-black/50"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-off-black">
                  +{formatCurrency(req.amount)}
                </span>
                <span
                  className={cn(
                    "px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wide",
                    req.type === "change_order"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-amber-50 text-amber-600"
                  )}
                >
                  {req.type === "change_order" ? "Change Order" : "Budget Request"}
                </span>
                {req.categoryName && (
                  <span className="text-[10px] text-off-black/40">
                    {req.categoryName}
                  </span>
                )}
              </div>
              <p className="text-xs text-off-black/60 truncate">{req.reason}</p>
              <p className="text-[10px] text-off-black/30">
                {req.projectName} &middot; {req.requesterName} &middot;{" "}
                {new Date(req.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleAction(req, "APPROVED")}
                disabled={loadingId === req.id}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                <Icon name="check" className="text-sm" />
                Approve
              </button>
              <button
                onClick={() => handleAction(req, "REJECTED")}
                disabled={loadingId === req.id}
                className="px-3 py-1.5 text-xs font-semibold text-off-black/60 bg-off-black/5 rounded-lg hover:bg-off-black/10 disabled:opacity-50 transition-all"
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

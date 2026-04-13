"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

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

function statusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return "text-primary bg-primary/10";
    case "APPROVED":
      return "text-primary bg-primary/10";
    case "REJECTED":
      return "text-destructive bg-destructive/10";
    default:
      return "text-off-black/40 bg-off-black/5";
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

  async function handleAction(id: string, type: string, action: "approve" | "reject" | "delete") {
    setActing(id);
    try {
      const endpoint = type === "change_order" ? "/api/change-orders" : "/api/top-up-requests";

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

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <Icon name="swap_horiz" className="text-off-black/10" size={40} />
        <p className="text-sm font-medium text-off-black mt-3">No budget requests yet</p>
        <p className="text-xs text-off-black/40 mt-1">Budget adjustment requests will appear here</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {requests.map((req) => (
        <div key={req.id} className="flex items-center gap-3 py-3 px-1 group">
          {/* Icon */}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            req.status === "PENDING" ? "bg-primary/10 text-primary" : "bg-off-black/5 text-off-black/30"
          }`}>
            <Icon name={req.categoryName ? "category" : "swap_horiz"} className="text-base" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-off-black">
                {formatCurrency(req.amount)}
              </span>
              {req.categoryName && (
                <span className="text-[10px] text-off-black/40">
                  {req.categoryName}
                </span>
              )}
            </div>
            <p className="text-xs text-off-black/40 truncate">{req.reason}</p>
          </div>

          {/* Meta */}
          <div className="text-right shrink-0 hidden sm:block">
            <p className="text-[10px] text-off-black/30">
              {new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
            <p className="text-[10px] text-off-black/30">{req.requesterName}</p>
          </div>

          {/* Status + Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[9px] font-bold rounded-full px-2 py-0.5 ${statusBadge(req.status)}`}>
              {req.status}
            </span>

            {req.status === "PENDING" && userRole === "CLIENT" && (
              <>
                <button
                  onClick={() => handleAction(req.id, req.type, "approve")}
                  disabled={acting === req.id}
                  className="px-2.5 py-1 text-[10px] font-semibold bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleAction(req.id, req.type, "reject")}
                  disabled={acting === req.id}
                  className="px-2.5 py-1 text-[10px] font-semibold border border-border text-off-black rounded-md hover:bg-peach-50 disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            )}

            {req.status === "PENDING" && isContractor && (
              <>
                <button
                  className="p-1 text-off-black/20 hover:text-off-black transition-colors opacity-0 group-hover:opacity-100"
                  title="Edit request"
                >
                  <Icon name="edit" className="text-sm" />
                </button>
                <button
                  onClick={() => handleAction(req.id, req.type, "delete")}
                  disabled={acting === req.id}
                  className="p-1 text-off-black/20 hover:text-destructive transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                  title="Delete request"
                >
                  <Icon name="close" className="text-sm" />
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

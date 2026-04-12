"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import shared from "@/styles/shared.module.css";

interface TopUpRequest {
  id: string;
  requestedAmount: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  createdAt: string;
  budgetCategory: { id: string; name: string } | null;
  requester: { id: string; name: string };
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-gray-50 text-gray-500 border-gray-200",
};

export function TopUpRequestList({
  requests,
  userRole,
}: {
  requests: TopUpRequest[];
  userRole: "CONTRACTOR" | "CLIENT";
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleAction(id: string, status: "APPROVED" | "REJECTED") {
    setLoadingId(id);
    try {
      await fetch("/api/top-up-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-elevation-1 p-5 lg:p-6">
        <h3 className="text-sm font-bold text-off-black mb-1">Budget Requests</h3>
        <p className="text-sm text-off-black/40">No budget requests yet.</p>
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === "PENDING");
  const resolved = requests.filter((r) => r.status !== "PENDING");

  return (
    <div className="space-y-3">
      {pending.length > 0 && (
        <div className="bg-white rounded-2xl shadow-elevation-1 overflow-hidden">
          <div className="px-5 py-4 border-b border-off-black/5 flex items-center gap-2">
            <Icon name="pending" className="text-amber-500 text-base" />
            <h3 className="text-sm font-bold text-off-black">
              Pending Requests
              <span className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                {pending.length}
              </span>
            </h3>
          </div>
          <div className="divide-y divide-off-black/5">
            {pending.map((req) => (
              <div key={req.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-off-black">
                        +{formatCurrency(req.requestedAmount)}
                      </span>
                      {req.budgetCategory && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-off-black/5 text-off-black/50 rounded-full">
                          {req.budgetCategory.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-off-black/60 leading-snug">{req.reason}</p>
                    <p className="text-[10px] text-off-black/30">
                      Requested by {req.requester.name} &middot;{" "}
                      {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {userRole === "CLIENT" && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleAction(req.id, "APPROVED")}
                        disabled={loadingId === req.id}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all"
                      >
                        <Icon name="check" className="text-sm" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(req.id, "REJECTED")}
                        disabled={loadingId === req.id}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-off-black/60 bg-off-black/5 rounded-lg hover:bg-off-black/10 disabled:opacity-50 transition-all"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <div className="bg-white rounded-2xl shadow-elevation-1 overflow-hidden">
          <div className="px-5 py-4 border-b border-off-black/5">
            <h3 className="text-sm font-bold text-off-black">Past Requests</h3>
          </div>
          <div className="divide-y divide-off-black/5">
            {resolved.map((req) => (
              <div key={req.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-off-black">
                      +{formatCurrency(req.requestedAmount)}
                    </span>
                    {req.budgetCategory && (
                      <span className="text-[10px] text-off-black/40">
                        {req.budgetCategory.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-off-black/40">{req.reason}</p>
                </div>
                <span
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-bold rounded-full border",
                    statusStyles[req.status]
                  )}
                >
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

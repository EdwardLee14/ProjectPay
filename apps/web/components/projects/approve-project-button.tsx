"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

interface Props {
  projectId: string;
  totalBudget: number;
  /** When true, renders the compact single-button variant (used on dashboard cards) */
  compact?: boolean;
}

export function ApproveProjectButton({ projectId, totalBudget, compact }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCounter, setShowCounter] = useState(false);
  const [counterValue, setCounterValue] = useState("");

  async function callReview(action: "approve" | "reject" | "counter", counterBudget?: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...(counterBudget ? { counterBudget } : {}) }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }
      // After approval, go to the project page so the contractor card details are visible
      if (action === "approve") {
        router.push(`/projects/${projectId}?approved=1`);
      } else {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  function handleCounter() {
    const amount = parseFloat(counterValue);
    if (!amount || amount <= 0) {
      setError("Enter a valid counter amount");
      return;
    }
    callReview("counter", amount);
  }

  // Compact variant: just an approve button for dashboard cards
  if (compact) {
    return (
      <div className="shrink-0 space-y-1">
        <button
          onClick={() => callReview("approve")}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all whitespace-nowrap"
        >
          <Icon name="check_circle" className="text-base" />
          {loading ? "Approving..." : "Approve & Issue Card"}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  // Full variant used on the project detail page
  if (showCounter) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-off-black/40 text-sm font-medium">$</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Your budget"
              value={counterValue}
              onChange={(e) => setCounterValue(e.target.value)}
              className="w-full pl-7 pr-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
          </div>
          <button
            onClick={handleCounter}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {loading ? "Sending..." : "Send Counter"}
          </button>
          <button
            onClick={() => { setShowCounter(false); setError(null); }}
            disabled={loading}
            className="px-3 py-2 text-sm font-medium text-off-black/50 hover:text-off-black transition-colors"
          >
            Cancel
          </button>
        </div>
        <p className="text-xs text-off-black/40">
          Contractor proposed {formatCurrency(totalBudget)}. Enter your counter offer.
        </p>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => callReview("approve")}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
        >
          <Icon name="check_circle" className="text-base" />
          {loading ? "Approving..." : "Approve & Issue Card"}
        </button>
        <button
          onClick={() => setShowCounter(true)}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border border-off-black/20 text-off-black/70 rounded-xl hover:border-primary hover:text-primary disabled:opacity-50 transition-all"
        >
          <Icon name="edit" className="text-base" />
          Counter
        </button>
        <button
          onClick={() => callReview("reject")}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-off-black/50 hover:text-red-600 disabled:opacity-50 transition-colors"
        >
          <Icon name="close" className="text-base" />
          Reject
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

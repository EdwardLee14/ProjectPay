"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

interface Props {
  projectId: string;
  counterBudget: number;
  originalBudget: number;
}

export function CounterRespondButton({ projectId, counterBudget, originalBudget }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function respond(action: "accept" | "reject") {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/counter-respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-off-black/70">
        Client countered at <span className="font-semibold text-off-black">{formatCurrency(counterBudget)}</span>
        {" "}(you proposed {formatCurrency(originalBudget)}).
        Accept to update the budget and return to client for final approval.
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => respond("accept")}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
        >
          <Icon name="check" className="text-base" />
          {loading ? "Accepting..." : "Accept Counter"}
        </button>
        <button
          onClick={() => respond("reject")}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border border-off-black/20 text-off-black/60 rounded-xl hover:border-red-300 hover:text-red-600 disabled:opacity-50 transition-all"
        >
          <Icon name="close" className="text-base" />
          Decline & Edit
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

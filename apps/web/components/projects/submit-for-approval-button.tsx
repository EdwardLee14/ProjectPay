"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";

export function SubmitForApprovalButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/submit`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to submit project");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
      >
        <Icon name="send" className="text-base" />
        {loading ? "Submitting..." : "Submit for Approval"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import s from "./change-order-form.module.css";

export function ChangeOrderForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/change-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          amount: parseFloat(amount),
          reason,
        }),
      });

      if (res.ok) {
        setAmount("");
        setReason("");
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h3 className={s.title}>Submit Change Order</h3>
      <form onSubmit={handleSubmit} className={s.form}>
        <div className={s.fieldGroup}>
          <Label htmlFor="co-amount" className={s.label}>Amount ($)</Label>
          <Input
            id="co-amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="5000"
            required
          />
        </div>
        <div className={s.fieldGroup}>
          <Label htmlFor="co-reason" className={s.label}>Reason</Label>
          <Input
            id="co-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Unexpected plumbing repair needed"
            required
          />
        </div>
        <button type="submit" className={s.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Change Order"}
        </button>
      </form>
    </div>
  );
}

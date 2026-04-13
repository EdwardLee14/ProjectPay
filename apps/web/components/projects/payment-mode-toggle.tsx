"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

type PaymentMode = "wallet" | "autopay";

interface Transaction {
  id: string;
  merchantName: string;
  amount: number;
  categoryCode: string;
  stripeTransactionId: string;
}

export function PaymentModeToggle({
  projectId,
  projectName,
  recentTransactions,
}: {
  projectId: string;
  projectName: string;
  recentTransactions: Transaction[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<PaymentMode>("wallet");

  return (
    <div className="pl-8 pr-6 py-6 max-w-2xl">
      {/* Back */}
      <button
        onClick={() => router.push(`/projects/${projectId}`)}
        className="flex items-center gap-1.5 text-sm text-off-black/50 hover:text-off-black transition-colors mb-4"
      >
        <Icon name="arrow_back" className="text-base" />
        <span>Back to Project</span>
      </button>

      {/* Header */}
      <div className="mb-5">
        <h1 className="font-headline text-lg font-bold text-off-black">
          Payment Configuration
        </h1>
        <p className="text-sm text-off-black/40 mt-0.5">
          Fund method for <span className="text-off-black font-medium">{projectName}</span>
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <button
          type="button"
          onClick={() => setMode("wallet")}
          className={cn(
            "text-left p-5 rounded-lg border transition-all",
            mode === "wallet"
              ? "border-primary bg-peach-50"
              : "border-border hover:border-off-black/20"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <Icon name="account_balance_wallet" className={cn("text-xl", mode === "wallet" ? "text-primary" : "text-off-black/30")} />
            {mode === "wallet" && <Icon name="check_circle" className="text-primary text-base" filled />}
          </div>
          <p className="text-base font-bold text-off-black">Wallet</p>
          <p className="text-[11px] text-off-black/40 mt-0.5 leading-relaxed">
            Pre-fund a project wallet. Contractors spend from dedicated balance.
          </p>
          <span className="inline-block mt-2 text-[9px] font-bold text-off-black/40 uppercase tracking-wider bg-off-black/5 px-2 py-0.5 rounded">
            Strict budgeting
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMode("autopay")}
          className={cn(
            "text-left p-5 rounded-lg border transition-all",
            mode === "autopay"
              ? "border-primary bg-peach-50"
              : "border-border hover:border-off-black/20"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <Icon name="bolt" className={cn("text-xl", mode === "autopay" ? "text-primary" : "text-off-black/30")} />
            {mode === "autopay" && <Icon name="check_circle" className="text-primary text-base" filled />}
          </div>
          <p className="text-base font-bold text-off-black">AutoPay</p>
          <p className="text-[11px] text-off-black/40 mt-0.5 leading-relaxed">
            Auto-charge client via ACH on each transaction. No pre-funding.
          </p>
          <span className="inline-block mt-2 text-[9px] font-bold text-off-black/40 uppercase tracking-wider bg-off-black/5 px-2 py-0.5 rounded">
            Max cash flow
          </span>
        </button>
      </div>

      {/* Activity Preview — compact */}
      <div className="border border-border rounded-lg p-5 mb-5">
        <p className="text-xs font-bold text-off-black mb-3">Activity Preview</p>
        <div className="space-y-2">
          {(recentTransactions.length > 0
            ? recentTransactions
            : [
                { id: "d1", merchantName: "Plumbing Supply Co.", amount: 1240, categoryCode: "Materials", stripeTransactionId: "4402" },
                { id: "d2", merchantName: "Lowe's", amount: 412.85, categoryCode: "Fixtures", stripeTransactionId: "4402" },
              ]
          ).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded bg-off-black/5 flex items-center justify-center shrink-0">
                  <Icon name="receipt_long" className="text-sm text-off-black/40" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-off-black truncate">{tx.merchantName}</p>
                  <p className="text-[10px] text-off-black/30">{tx.categoryCode}</p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-xs font-bold text-off-black">{formatCurrency(tx.amount)}</p>
                <p className="text-[9px] text-off-black/30 uppercase">{mode === "autopay" ? "ACH" : "Wallet"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(`/projects/${projectId}`)}
          className="text-sm font-medium text-off-black/40 hover:text-off-black transition-colors"
        >
          Discard
        </button>
        <button className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
          Save Configuration
        </button>
      </div>
    </div>
  );
}

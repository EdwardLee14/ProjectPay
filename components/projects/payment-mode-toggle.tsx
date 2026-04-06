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
    <div className="p-10 max-w-4xl mx-auto">
      {/* Back Action */}
      <button
        onClick={() => router.push(`/projects/${projectId}`)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
      >
        <Icon
          name="arrow_back"
          className="text-lg group-hover:-translate-x-1 transition-transform"
        />
        <span className="text-sm font-medium">Back to Project Details</span>
      </button>

      {/* Header */}
      <div className="mb-12">
        <h1 className="font-headline text-3xl font-bold text-foreground mb-2 tracking-tight">
          Payment Configuration
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
          Select how you want to fund contractor expenses for{" "}
          <span className="text-foreground font-semibold">{projectName}</span>.
        </p>
      </div>

      {/* Mode Toggle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Wallet Mode */}
        <button
          type="button"
          onClick={() => setMode("wallet")}
          className={cn(
            "block text-left h-full p-8 rounded-xl bg-card border-2 shadow-soft transition-all duration-300",
            mode === "wallet"
              ? "border-secondary shadow-xl"
              : "border-transparent hover:shadow-lg"
          )}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center text-foreground">
                <Icon name="account_balance_wallet" size={30} />
              </div>
              {mode === "wallet" && (
                <Icon
                  name="check_circle"
                  className="text-secondary"
                  filled
                />
              )}
            </div>
            <h3 className="font-headline text-xl font-bold mb-3 text-foreground">
              Wallet Mode
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Client pre-funds a project wallet. Contractors spend from a
              dedicated balance you control up front.
            </p>
            <div className="mt-auto pt-4 border-t border-outline-variant/10">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                  Best for:
                </span>
                <span className="text-xs font-semibold bg-accent px-2 py-1 rounded">
                  Strict Budgeting
                </span>
              </div>
            </div>
          </div>
        </button>

        {/* AutoPay Mode */}
        <button
          type="button"
          onClick={() => setMode("autopay")}
          className={cn(
            "block text-left h-full p-8 rounded-xl bg-card border-2 shadow-soft transition-all duration-300",
            mode === "autopay"
              ? "border-secondary shadow-xl"
              : "border-transparent hover:shadow-lg"
          )}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center text-foreground">
                <Icon name="bolt" size={30} />
              </div>
              {mode === "autopay" && (
                <Icon
                  name="check_circle"
                  className="text-secondary"
                  filled
                />
              )}
            </div>
            <h3 className="font-headline text-xl font-bold mb-3 text-foreground">
              AutoPay Mode
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Client is auto-charged via ACH on every swipe. No pre-funding
              needed. We charge your linked account as transactions happen.
            </p>
            <div className="mt-auto pt-4 border-t border-outline-variant/10">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                  Best for:
                </span>
                <span className="text-xs font-semibold bg-accent px-2 py-1 rounded">
                  Maximum Cash Flow
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Activity Preview */}
      <div className="mt-16 bg-surface-container-low rounded-xl p-8 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <Icon name="insights" className="text-secondary" />
            <h2 className="font-headline text-lg font-bold">
              Activity Preview
            </h2>
          </div>

          <div className="space-y-6 relative ml-4">
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-secondary-fixed opacity-50 ml-[15px]" />

            {(recentTransactions.length > 0
              ? recentTransactions
              : [
                  {
                    id: "demo-1",
                    merchantName: "Plumbing Supply Co.",
                    amount: 1240,
                    categoryCode: "Material Purchase",
                    stripeTransactionId: "4402",
                  },
                  {
                    id: "demo-2",
                    merchantName: "Lowe's Home Improvement",
                    amount: 412.85,
                    categoryCode: "Fixture Updates",
                    stripeTransactionId: "4402",
                  },
                ]
            ).map((tx) => (
              <div key={tx.id} className="flex gap-6 items-start relative">
                <div className="w-8 h-8 rounded-full bg-secondary-fixed border-4 border-surface-container-low z-20 flex items-center justify-center shrink-0">
                  <Icon
                    name="bolt"
                    className="text-[12px] text-on-secondary-fixed font-bold"
                  />
                </div>
                <div className="flex-1 bg-card p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm">
                      {tx.merchantName}
                    </span>
                    <span className="text-sm font-semibold text-secondary">
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {tx.categoryCode} &bull; Card #
                      {tx.stripeTransactionId.slice(-4)}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-0.5 bg-surface-container rounded">
                      {mode === "autopay" ? "AutoPay ACH" : "Wallet"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      {/* Action Footer */}
      <div className="mt-12 flex items-center justify-end gap-4">
        <button
          onClick={() => router.push(`/projects/${projectId}`)}
          className="px-6 py-3 text-sm font-semibold text-foreground hover:bg-surface-container transition-colors rounded-lg"
        >
          Discard Changes
        </button>
        <button className="px-8 py-3 bg-primary text-primary-foreground font-headline font-bold text-sm rounded-lg hover:shadow-xl active:scale-95 transition-all">
          Save Configuration
        </button>
      </div>
    </div>
  );
}

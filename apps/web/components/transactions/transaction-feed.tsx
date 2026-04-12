"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

interface TransactionRow {
  id: string;
  projectId: string;
  merchantName: string;
  amount: number;
  categoryCode: string;
  note: string | null;
  receiptUrl: string | null;
  stripeTransactionId: string;
  createdAt: string;
  budgetCategory?: { id: string; name: string } | null;
}

const MCC_ICONS: Record<string, string> = {
  "5211": "forest",
  "5231": "format_paint",
  "5251": "hardware",
  "5200": "home_repair_service",
  "7394": "construction",
  "5065": "electric_bolt",
  "5074": "plumbing",
  "5541": "local_gas_station",
  "5542": "local_gas_station",
  "4121": "directions_car",
  "7512": "directions_car",
  "1711": "hvac",
  "1731": "electric_bolt",
  "1740": "foundation",
  "1750": "carpenter",
  "1761": "roofing",
  "1771": "foundation",
};

function getMccIcon(code: string): string {
  return MCC_ICONS[code] ?? "receipt_long";
}

export function TransactionFeed({
  projectId,
  initialTransactions,
}: {
  projectId: string;
  initialTransactions: TransactionRow[];
}) {
  const [transactions, setTransactions] =
    useState<TransactionRow[]>(initialTransactions);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`transactions:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
          filter: `projectId=eq.${projectId}`,
        },
        (payload) => {
          const newTx = payload.new as TransactionRow;
          setTransactions((prev) => [newTx, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-elevation-1 p-5 lg:p-6">
        <h3 className="text-sm font-bold text-off-black mb-1">Transactions</h3>
        <p className="text-sm text-off-black/40">
          No transactions yet. They will appear here in real time as the virtual
          card is used.
        </p>
      </div>
    );
  }

  // Group by date
  const grouped: Record<string, TransactionRow[]> = {};
  for (const tx of transactions) {
    const day = new Date(tx.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(tx);
  }

  return (
    <div className="bg-white rounded-2xl shadow-elevation-1 overflow-hidden">
      <div className="px-5 py-4 border-b border-off-black/5">
        <h3 className="text-sm font-bold text-off-black">Transactions</h3>
      </div>

      {Object.entries(grouped).map(([day, txs]) => (
        <div key={day}>
          <div className="px-5 py-2 bg-off-black/[0.02] border-b border-off-black/5">
            <span className="text-[10px] font-bold text-off-black/40 uppercase tracking-widest">
              {day}
            </span>
          </div>
          <div className="divide-y divide-off-black/5">
            {txs.map((tx) => (
              <div
                key={tx.id}
                className="px-5 py-3.5 flex items-center gap-3 hover:bg-off-black/[0.01] transition-colors"
              >
                {/* Icon */}
                <div className="w-8 h-8 rounded-full bg-off-black/5 flex items-center justify-center shrink-0">
                  <Icon
                    name={getMccIcon(tx.categoryCode)}
                    className="text-base text-off-black/50"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-off-black truncate">
                    {tx.merchantName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {tx.budgetCategory ? (
                      <span className="text-[10px] font-semibold text-primary">
                        {tx.budgetCategory.name}
                      </span>
                    ) : (
                      <span className="text-[10px] text-off-black/30">
                        Uncategorized
                      </span>
                    )}
                    {tx.note && (
                      <>
                        <span className="text-off-black/20 text-[10px]">·</span>
                        <span className="text-[10px] text-off-black/40 truncate">
                          {tx.note}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <span className="text-sm font-bold text-off-black shrink-0">
                  -{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

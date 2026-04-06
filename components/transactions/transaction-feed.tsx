"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No transactions yet. Transactions will appear here in real time as
            the virtual card is used.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div>
                <p className="font-medium">{tx.merchantName}</p>
                <p className="text-xs text-muted-foreground">
                  {tx.categoryCode} &middot;{" "}
                  {new Date(tx.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className="font-semibold text-red-600">
                -{formatCurrency(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

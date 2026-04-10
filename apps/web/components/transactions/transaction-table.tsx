"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import s from "@/app/(dashboard)/transactions/transactions.module.css";
import shared from "@/styles/shared.module.css";

type Transaction = {
  id: string;
  merchantName: string;
  amount: number;
  categoryCode: string;
  status: string;
  note: string | null;
  createdAt: string;
  project: { id: string; name: string };
  budgetCategory: { id: string; name: string } | null;
};

type Project = {
  id: string;
  name: string;
};

interface TransactionTableProps {
  initialTransactions: Transaction[];
  initialHasMore: boolean;
  projects: Project[];
}

export function TransactionTable({
  initialTransactions,
  initialHasMore,
  projects,
}: TransactionTableProps) {
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");

  const cursor =
    transactions.length > 0
      ? transactions[transactions.length - 1]?.id
      : undefined;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({ limit: "20" });
      if (cursor) params.set("cursor", cursor);
      if (selectedProject) params.set("projectId", selectedProject);

      const res = await fetch(`/api/transactions?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const json = await res.json();
      const newTxs = (json.data as Record<string, unknown>[]).map((tx) => ({
        ...tx,
        amount: Number(tx.amount),
      })) as Transaction[];

      setTransactions((prev) => [...prev, ...newTxs]);
      setHasMore(json.hasMore);
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, cursor, selectedProject]);

  const handleProjectFilter = useCallback(
    async (projectId: string) => {
      setSelectedProject(projectId);
      setLoading(true);

      try {
        const params = new URLSearchParams({ limit: "20" });
        if (projectId) params.set("projectId", projectId);

        const res = await fetch(`/api/transactions?${params}`);
        if (!res.ok) throw new Error("Failed to fetch");

        const json = await res.json();
        const newTxs = (json.data as Record<string, unknown>[]).map((tx) => ({
          ...tx,
          amount: Number(tx.amount),
        })) as Transaction[];

        setTransactions(newTxs);
        setHasMore(json.hasMore);
      } catch (err) {
        console.error("Failed to filter transactions:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const filtered = transactions;

  return (
    <>
      {/* Filter row */}
      {projects.length > 1 && (
        <div className={s.filterRow}>
          <div className={s.selectWrap}>
            <select
              className={s.projectSelect}
              value={selectedProject}
              onChange={(e) => handleProjectFilter(e.target.value)}
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {filtered.length > 0 ? (
        <>
          <div className={s.tableWrap}>
            <div className={s.tableAccent} />
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-off-black/20">
                  <th className={shared.tableHeader}>Vendor</th>
                  <th className={cn(shared.tableHeader, "hidden md:table-cell")}>
                    Project
                  </th>
                  <th className={cn(shared.tableHeader, "hidden md:table-cell")}>
                    Category
                  </th>
                  <th className={cn(shared.tableHeader, "text-right")}>
                    Amount
                  </th>
                  <th className={cn(shared.tableHeader, "hidden lg:table-cell text-right")}>
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx, i) => (
                  <tr
                    key={tx.id}
                    className={
                      i < filtered.length - 1
                        ? shared.tableRowBorder
                        : shared.tableRow
                    }
                  >
                    <td className={shared.tableCell}>
                      <p className={s.vendor}>{tx.merchantName}</p>
                      <p className={cn(s.vendorDate, "md:hidden")}>
                        {new Date(tx.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </td>
                    <td
                      className={cn(shared.tableCell, "hidden md:table-cell")}
                    >
                      <Link
                        href={`/projects/${tx.project.id}`}
                        className={s.projectName}
                      >
                        {tx.project.name}
                      </Link>
                    </td>
                    <td
                      className={cn(shared.tableCell, "hidden md:table-cell")}
                    >
                      <span className={s.category}>
                        {tx.budgetCategory?.name ?? tx.categoryCode}
                      </span>
                    </td>
                    <td className={cn(shared.tableCell, "text-right")}>
                      <span className={s.amount}>
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td
                      className={cn(
                        shared.tableCell,
                        "hidden lg:table-cell text-right text-sm text-off-black"
                      )}
                    >
                      {new Date(tx.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className={s.loadMoreWrap}>
              <button
                className={s.loadMoreBtn}
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className={s.emptyWrap}>
          <Icon name="receipt_long" className="text-off-black/10" size={56} />
          <p className={s.emptyTitle}>No transactions yet</p>
          <p className={s.emptyDesc}>
            Transactions will appear here once spending begins.
          </p>
        </div>
      )}
    </>
  );
}

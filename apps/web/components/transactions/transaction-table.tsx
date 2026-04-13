"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import shared from "@/styles/shared.module.css";
import s from "@/app/(dashboard)/transactions/transactions.module.css";
import fs from "@/components/transactions/transaction-feed.module.css";

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

interface ReceiptData {
  id: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  parsedData: Record<string, unknown> | null;
}

interface TransactionTableProps {
  initialTransactions: Transaction[];
  initialHasMore: boolean;
  projects: Project[];
}

function getReceiptImageUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/receipts/${storagePath}`;
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

export function TransactionTable({
  initialTransactions,
  initialHasMore,
  projects,
}: TransactionTableProps) {
  const router = useRouter();
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [timeFilter, setTimeFilter] = useState<"all" | "week" | "month">(
    "all"
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [receiptCache, setReceiptCache] = useState<
    Record<string, ReceiptData | null>
  >({});
  const [loadingReceipt, setLoadingReceipt] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  async function handleRowClick(txId: string) {
    if (expandedId === txId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(txId);

    if (receiptCache[txId] === undefined) {
      setLoadingReceipt(txId);
      try {
        const res = await fetch(`/api/receipts?transactionId=${txId}`);
        if (res.ok) {
          const receipts = await res.json();
          setReceiptCache((prev) => ({
            ...prev,
            [txId]: receipts.length > 0 ? receipts[0] : null,
          }));
        } else {
          setReceiptCache((prev) => ({ ...prev, [txId]: null }));
        }
      } catch {
        setReceiptCache((prev) => ({ ...prev, [txId]: null }));
      } finally {
        setLoadingReceipt(null);
      }
    }
  }

  async function handleDelete(txId: string) {
    setDeleting(txId);
    try {
      const res = await fetch(`/api/transactions/${txId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTransactions((prev) => prev.filter((t) => t.id !== txId));
        setExpandedId(null);
        router.refresh();
      }
    } finally {
      setDeleting(null);
    }
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const timeFiltered =
    timeFilter === "all"
      ? transactions
      : timeFilter === "week"
        ? transactions.filter((tx) => new Date(tx.createdAt) >= weekAgo)
        : transactions.filter((tx) => new Date(tx.createdAt) >= monthAgo);

  // Group by date
  const grouped: Record<string, Transaction[]> = {};
  for (const tx of timeFiltered) {
    const day = new Date(tx.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(tx);
  }

  return (
    <>
      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          alt="Receipt"
          onClose={() => setLightboxSrc(null)}
        />
      )}

      {/* Filter row */}
      <div className={s.filterRow}>
        <div className={s.filterPills}>
          {(["all", "week", "month"] as const).map((f) => (
            <button
              key={f}
              className={
                timeFilter === f
                  ? shared.filterPillActive
                  : shared.filterPill
              }
              onClick={() => setTimeFilter(f)}
            >
              {f === "all" ? "All" : f === "week" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>
        {projects.length > 1 && (
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
        )}
      </div>

      {timeFiltered.length > 0 ? (
        <>
          {/* Feed-style grouped list */}
          <div className={fs.feedContainer}>
            {Object.entries(grouped).map(([day, txs]) => (
              <div key={day}>
                <div className={fs.dateHeader}>
                  <span className={fs.dateLabel}>{day}</span>
                </div>
                <div className={fs.dateGroup}>
                  {txs.map((tx) => {
                    const isExpanded = expandedId === tx.id;
                    const receipt = receiptCache[tx.id];
                    const parsed = (receipt?.parsedData ?? null) as Record<
                      string,
                      unknown
                    > | null;
                    const isLoading = loadingReceipt === tx.id;
                    const receiptImgUrl = receipt?.storagePath
                      ? getReceiptImageUrl(receipt.storagePath)
                      : null;

                    return (
                      <div key={tx.id}>
                        <div
                          className={fs.txRow}
                          onClick={() => handleRowClick(tx.id)}
                        >
                          <div className={fs.txIcon}>
                            <Icon
                              name={getMccIcon(tx.categoryCode)}
                              className={fs.txIconSymbol}
                            />
                          </div>

                          <div className={fs.txDetails}>
                            <p className={fs.txMerchant}>{tx.merchantName}</p>
                            <div className={fs.txMeta}>
                              <Link
                                href={`/projects/${tx.project.id}`}
                                className={s.projectName}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {tx.project.name}
                              </Link>
                              {tx.budgetCategory && (
                                <>
                                  <span className={fs.txNoteDot}>·</span>
                                  <span className={fs.txCategory}>
                                    {tx.budgetCategory.name}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <Icon
                            name="expand_more"
                            className={
                              isExpanded ? fs.txChevronOpen : fs.txChevron
                            }
                          />

                          <span className={fs.txAmount}>
                            -{formatCurrency(tx.amount)}
                          </span>
                        </div>

                        {/* Expanded */}
                        {isExpanded && (
                          <div className={fs.expandedPanel}>
                            {isLoading && (
                              <div className={fs.loadingReceipt}>
                                <div className={fs.spinner} />
                                <span>Loading receipt...</span>
                              </div>
                            )}

                            {!isLoading && (
                              <>
                                <div className={fs.expandedContent}>
                                  <div className={fs.receiptImageWrap}>
                                    {receiptImgUrl ? (
                                      <img
                                        src={receiptImgUrl}
                                        alt={
                                          receipt?.fileName ?? "Receipt"
                                        }
                                        className={`${fs.receiptImage} ${fs.receiptImageClickable}`}
                                        onClick={() =>
                                          setLightboxSrc(receiptImgUrl)
                                        }
                                      />
                                    ) : (
                                      <div className={fs.receiptPlaceholder}>
                                        <Icon
                                          name="receipt_long"
                                          className={
                                            fs.receiptPlaceholderIcon
                                          }
                                          size={32}
                                        />
                                      </div>
                                    )}
                                  </div>

                                  <div className={fs.expandedDetails}>
                                    <div className={fs.detailRow}>
                                      <span className={fs.detailLabel}>
                                        Merchant
                                      </span>
                                      <span className={fs.detailValue}>
                                        {tx.merchantName}
                                      </span>
                                    </div>
                                    <div className={fs.detailRow}>
                                      <span className={fs.detailLabel}>
                                        Project
                                      </span>
                                      <span className={fs.detailValue}>
                                        <Link
                                          href={`/projects/${tx.project.id}`}
                                          className={s.projectName}
                                        >
                                          {tx.project.name}
                                        </Link>
                                      </span>
                                    </div>
                                    <div className={fs.detailRow}>
                                      <span className={fs.detailLabel}>
                                        Date
                                      </span>
                                      <span className={fs.detailValue}>
                                        {(parsed?.date as string) ??
                                          new Date(
                                            tx.createdAt
                                          ).toLocaleDateString()}
                                      </span>
                                    </div>
                                    {tx.budgetCategory && (
                                      <div className={fs.detailRow}>
                                        <span className={fs.detailLabel}>
                                          Category
                                        </span>
                                        <span className={fs.detailValue}>
                                          {tx.budgetCategory.name}
                                        </span>
                                      </div>
                                    )}
                                    {tx.note && (
                                      <div className={fs.detailRow}>
                                        <span className={fs.detailLabel}>
                                          Note
                                        </span>
                                        <span className={fs.detailValue}>
                                          {tx.note}
                                        </span>
                                      </div>
                                    )}

                                    {/* Line items from parsed receipt */}
                                    {(() => {
                                      const items = parsed?.lineItems;
                                      if (!items || !Array.isArray(items) || items.length === 0) return null;
                                      const lineItems = items as { description: string; quantity: number; total: number }[];
                                      return (
                                        <>
                                          <p className={fs.lineItemsTitle}>Line Items</p>
                                          {lineItems.map((item, i) => (
                                            <div key={i} className={fs.lineItemRow}>
                                              <span className={fs.lineItemDesc}>
                                                {item.quantity > 1 ? `${item.quantity}x ` : ""}
                                                {item.description}
                                              </span>
                                              <span className={fs.lineItemAmt}>
                                                {formatCurrency(item.total)}
                                              </span>
                                            </div>
                                          ))}
                                        </>
                                      );
                                    })()}

                                    {receipt === null && (
                                      <p className={fs.noReceipt}>
                                        No receipt attached
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className={fs.expandedActions}>
                                  <Link
                                    href={`/projects/${tx.project.id}`}
                                    className={fs.editBtn}
                                  >
                                    <Icon
                                      name="open_in_new"
                                      className="text-xs"
                                    />
                                    View Project
                                  </Link>
                                  <button
                                    className={fs.deleteBtn}
                                    onClick={() => handleDelete(tx.id)}
                                    disabled={deleting === tx.id}
                                  >
                                    <Icon
                                      name="delete"
                                      className="text-xs"
                                    />
                                    {deleting === tx.id
                                      ? "Deleting..."
                                      : "Delete"}
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
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

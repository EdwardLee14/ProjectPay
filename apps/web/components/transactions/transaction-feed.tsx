"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import s from "./transaction-feed.module.css";

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

interface ParsedReceiptData {
  merchantName?: string;
  totalAmount?: number;
  date?: string | null;
  subtotal?: number | null;
  taxAmount?: number | null;
  lineItems?: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  suggestedCategoryName?: string | null;
}

interface ReceiptData {
  id: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  parsedData: ParsedReceiptData | null;
}

interface Category {
  id: string;
  name: string;
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

function getReceiptImageUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/receipts/${storagePath}`;
}

export function TransactionFeed({
  projectId,
  initialTransactions,
  categories = [],
}: {
  projectId: string;
  initialTransactions: TransactionRow[];
  categories?: Category[];
}) {
  const router = useRouter();
  const [transactions, setTransactions] =
    useState<TransactionRow[]>(initialTransactions);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [receiptCache, setReceiptCache] = useState<
    Record<string, ReceiptData | null>
  >({});
  const [loadingReceipt, setLoadingReceipt] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMerchant, setEditMerchant] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editNote, setEditNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const addTransaction = useCallback((tx: TransactionRow) => {
    setTransactions((prev) => {
      if (prev.some((t) => t.id === tx.id)) return prev;
      return [tx, ...prev];
    });
  }, []);

  useEffect(() => {
    function handleManualAdd(e: Event) {
      const tx = (e as CustomEvent).detail as TransactionRow;
      addTransaction(tx);
    }

    window.addEventListener("transaction-created", handleManualAdd);

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
          const raw = payload.new as Record<string, unknown>;
          fetch(`/api/transactions/${raw.id}`)
            .then((res) => (res.ok ? res.json() : Promise.reject()))
            .then((fullTx: TransactionRow) => addTransaction(fullTx))
            .catch(() => {
              addTransaction({
                ...(raw as unknown as TransactionRow),
                amount: Number(raw.amount),
                budgetCategory: null,
              });
            });
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener("transaction-created", handleManualAdd);
      supabase.removeChannel(channel);
    };
  }, [projectId, addTransaction]);

  async function handleRowClick(txId: string) {
    if (editingId) return; // Don't collapse while editing
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

  function startEdit(tx: TransactionRow) {
    setEditingId(tx.id);
    setEditMerchant(tx.merchantName);
    setEditAmount(String(tx.amount));
    setEditCategory(tx.budgetCategory?.id ?? "");
    setEditNote(tx.note ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(txId: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/transactions/${txId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantName: editMerchant,
          amount: parseFloat(editAmount),
          budgetCategoryId: editCategory || null,
          note: editNote || null,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setTransactions((prev) =>
          prev.map((t) =>
            t.id === txId
              ? { ...t, ...updated, amount: Number(updated.amount) }
              : t
          )
        );
        setEditingId(null);
        router.refresh();
      }
    } finally {
      setSaving(false);
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

  if (transactions.length === 0) {
    return (
      <div className={s.emptyState}>
        <Icon name="receipt_long" className={s.emptyIcon} size={40} />
        <p className={s.emptyTitle}>No transactions yet</p>
        <p className={s.emptyDesc}>
          Transactions will appear here in real time as the virtual card is used
        </p>
      </div>
    );
  }

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
    <>
      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          alt="Receipt"
          onClose={() => setLightboxSrc(null)}
        />
      )}

      <div className={s.feedContainer}>
        <div className={s.feedHeader}>
          <h3 className={s.feedTitle}>Transactions</h3>
        </div>

        {Object.entries(grouped).map(([day, txs]) => (
          <div key={day}>
            <div className={s.dateHeader}>
              <span className={s.dateLabel}>{day}</span>
            </div>
            <div className={s.dateGroup}>
              {txs.map((tx) => {
                const isExpanded = expandedId === tx.id;
                const receipt = receiptCache[tx.id];
                const parsed = receipt?.parsedData ?? null;
                const isLoading = loadingReceipt === tx.id;
                const isEditing = editingId === tx.id;
                const isDeleting = deleting === tx.id;
                const receiptImgUrl = receipt?.storagePath
                  ? getReceiptImageUrl(receipt.storagePath)
                  : null;

                return (
                  <div key={tx.id}>
                    {/* Collapsed row */}
                    <div
                      className={s.txRow}
                      onClick={() => handleRowClick(tx.id)}
                    >
                      <div className={s.txIcon}>
                        <Icon
                          name={getMccIcon(tx.categoryCode)}
                          className={s.txIconSymbol}
                        />
                      </div>

                      <div className={s.txDetails}>
                        <p className={s.txMerchant}>{tx.merchantName}</p>
                        <div className={s.txMeta}>
                          {tx.budgetCategory ? (
                            <span className={s.txCategory}>
                              {tx.budgetCategory.name}
                            </span>
                          ) : (
                            <span className={s.txUncategorized}>
                              Uncategorized
                            </span>
                          )}
                          {tx.note && (
                            <>
                              <span className={s.txNoteDot}>·</span>
                              <span className={s.txNote}>{tx.note}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <Icon
                        name="expand_more"
                        className={
                          isExpanded ? s.txChevronOpen : s.txChevron
                        }
                      />

                      <span className={s.txAmount}>
                        -{formatCurrency(tx.amount)}
                      </span>
                    </div>

                    {/* Expanded panel */}
                    {isExpanded && (
                      <div className={s.expandedPanel}>
                        {isLoading && (
                          <div className={s.loadingReceipt}>
                            <div className={s.spinner} />
                            <span>Loading receipt...</span>
                          </div>
                        )}

                        {!isLoading && (
                          <>
                            <div className={s.expandedContent}>
                              {/* Receipt image */}
                              <div className={s.receiptImageWrap}>
                                {receiptImgUrl ? (
                                  <img
                                    src={receiptImgUrl}
                                    alt={receipt?.fileName ?? "Receipt"}
                                    className={`${s.receiptImage} ${s.receiptImageClickable}`}
                                    onClick={() =>
                                      setLightboxSrc(receiptImgUrl)
                                    }
                                  />
                                ) : (
                                  <div className={s.receiptPlaceholder}>
                                    <Icon
                                      name="receipt_long"
                                      className={s.receiptPlaceholderIcon}
                                      size={32}
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Details */}
                              <div className={s.expandedDetails}>
                                <div className={s.detailRow}>
                                  <span className={s.detailLabel}>
                                    Merchant
                                  </span>
                                  <span className={s.detailValue}>
                                    {tx.merchantName}
                                  </span>
                                </div>
                                <div className={s.detailRow}>
                                  <span className={s.detailLabel}>Date</span>
                                  <span className={s.detailValue}>
                                    {parsed?.date ??
                                      new Date(
                                        tx.createdAt
                                      ).toLocaleDateString()}
                                  </span>
                                </div>
                                {tx.budgetCategory && (
                                  <div className={s.detailRow}>
                                    <span className={s.detailLabel}>
                                      Category
                                    </span>
                                    <span className={s.detailValue}>
                                      {tx.budgetCategory.name}
                                    </span>
                                  </div>
                                )}
                                {tx.note && (
                                  <div className={s.detailRow}>
                                    <span className={s.detailLabel}>Note</span>
                                    <span className={s.detailValue}>
                                      {tx.note}
                                    </span>
                                  </div>
                                )}

                                {/* Parsed line items */}
                                {parsed?.lineItems &&
                                  parsed.lineItems.length > 0 && (
                                    <>
                                      <p className={s.lineItemsTitle}>
                                        Line Items
                                      </p>
                                      {parsed.lineItems.map((item, i) => (
                                        <div key={i} className={s.lineItemRow}>
                                          <span className={s.lineItemDesc}>
                                            {item.quantity > 1
                                              ? `${item.quantity}x `
                                              : ""}
                                            {item.description}
                                          </span>
                                          <span className={s.lineItemAmt}>
                                            {formatCurrency(item.total)}
                                          </span>
                                        </div>
                                      ))}

                                      <div className={s.totalsDivider}>
                                        {parsed.subtotal != null && (
                                          <div className={s.totalsRow}>
                                            <span>Subtotal</span>
                                            <span>
                                              {formatCurrency(parsed.subtotal)}
                                            </span>
                                          </div>
                                        )}
                                        {parsed.taxAmount != null && (
                                          <div className={s.totalsRow}>
                                            <span>Tax</span>
                                            <span>
                                              {formatCurrency(parsed.taxAmount)}
                                            </span>
                                          </div>
                                        )}
                                        <div className={s.totalsFinal}>
                                          <span>Total</span>
                                          <span>
                                            {formatCurrency(
                                              parsed.totalAmount ?? tx.amount
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                    </>
                                  )}

                                {receipt === null && !parsed && (
                                  <p className={s.noReceipt}>
                                    No receipt attached
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Edit form (inline) */}
                            {isEditing && (
                              <div className={s.editForm}>
                                <div className={s.editFieldRow}>
                                  <div>
                                    <label className={s.editLabel}>
                                      Merchant
                                    </label>
                                    <input
                                      type="text"
                                      value={editMerchant}
                                      onChange={(e) =>
                                        setEditMerchant(e.target.value)
                                      }
                                      className={s.editInput}
                                    />
                                  </div>
                                  <div>
                                    <label className={s.editLabel}>
                                      Amount
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={editAmount}
                                      onChange={(e) =>
                                        setEditAmount(e.target.value)
                                      }
                                      className={s.editInput}
                                    />
                                  </div>
                                </div>
                                <div className={s.editFieldRow}>
                                  <div>
                                    <label className={s.editLabel}>
                                      Category
                                    </label>
                                    <select
                                      value={editCategory}
                                      onChange={(e) =>
                                        setEditCategory(e.target.value)
                                      }
                                      className={s.editSelect}
                                    >
                                      <option value="">Uncategorized</option>
                                      {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                          {cat.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className={s.editLabel}>Note</label>
                                    <input
                                      type="text"
                                      value={editNote}
                                      onChange={(e) =>
                                        setEditNote(e.target.value)
                                      }
                                      placeholder="Optional"
                                      className={s.editInput}
                                    />
                                  </div>
                                </div>
                                <div className={s.editActions}>
                                  <button
                                    onClick={() => saveEdit(tx.id)}
                                    disabled={saving}
                                    className={s.editSaveBtn}
                                  >
                                    {saving ? "Saving..." : "Save"}
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className={s.editCancelBtn}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Action buttons */}
                            {!isEditing && (
                              <div className={s.expandedActions}>
                                <button
                                  className={s.editBtn}
                                  onClick={() => startEdit(tx)}
                                >
                                  <Icon name="edit" className="text-xs" />
                                  Edit
                                </button>
                                <button
                                  className={s.deleteBtn}
                                  onClick={() => handleDelete(tx.id)}
                                  disabled={isDeleting}
                                >
                                  <Icon name="delete" className="text-xs" />
                                  {isDeleting ? "Deleting..." : "Delete"}
                                </button>
                              </div>
                            )}
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
    </>
  );
}

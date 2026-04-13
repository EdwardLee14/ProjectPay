"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { formatCurrency } from "@/lib/utils";
import s from "./add-transaction-form.module.css";

interface Category {
  id: string;
  name: string;
}

interface ParsedReceipt {
  merchantName: string;
  totalAmount: number;
  date: string | null;
  subtotal: number | null;
  taxAmount: number | null;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  suggestedCategoryId: string | null;
  suggestedCategoryName: string | null;
}

interface ReceiptMeta {
  storagePath: string;
  fileName: string;
  mimeType: string;
}

export function AddTransactionForm({
  projectId,
  categories,
}: {
  projectId: string;
  categories: Category[];
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [merchantName, setMerchantName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Receipt state
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedReceipt | null>(null);
  const [receiptMeta, setReceiptMeta] = useState<ReceiptMeta | null>(null);

  function resetForm() {
    setMerchantName("");
    setAmount("");
    setCategoryId("");
    setNote("");
    setParsedData(null);
    setReceiptMeta(null);
    setError(null);
  }

  function handleClose() {
    resetForm();
    setOpen(false);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectId);

      const res = await fetch("/api/receipts/parse", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to parse receipt");
        setParsing(false);
        return;
      }

      const data = await res.json();

      // Autofill form fields from parsed data
      if (data.parsedData.merchantName) {
        setMerchantName(data.parsedData.merchantName);
      }
      if (data.parsedData.totalAmount) {
        setAmount(String(data.parsedData.totalAmount));
      }
      if (data.parsedData.suggestedCategoryId) {
        setCategoryId(data.parsedData.suggestedCategoryId);
      }

      setParsedData(data.parsedData);
      setReceiptMeta({
        storagePath: data.storagePath,
        fileName: data.fileName,
        mimeType: data.mimeType,
      });
    } catch {
      setError("Failed to upload receipt. Please try again.");
    } finally {
      setParsing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        setError("Please enter a valid amount");
        return;
      }

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          merchantName,
          amount: numAmount,
          budgetCategoryId: categoryId || null,
          note: note || null,
          receipt: receiptMeta
            ? {
                ...receiptMeta,
                parsedData: parsedData ?? undefined,
              }
            : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to add transaction");
        return;
      }

      const result = await res.json();

      // Notify TransactionFeed immediately so it appears without waiting for realtime
      if (result.transaction) {
        window.dispatchEvent(
          new CustomEvent("transaction-created", {
            detail: {
              ...result.transaction,
              amount: Number(result.transaction.amount),
              createdAt:
                typeof result.transaction.createdAt === "string"
                  ? result.transaction.createdAt
                  : new Date(result.transaction.createdAt).toISOString(),
              receiptUrl: null,
            },
          })
        );
      }

      resetForm();
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className={s.triggerBtn}>
        <Icon name="add" className="text-sm" />
        Add Transaction
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={s.formContainer}>
      <div className={s.formHeader}>
        <p className={s.formTitle}>Add Transaction</p>
        <button type="button" onClick={handleClose} className={s.closeBtn}>
          <Icon name="close" className="text-base" />
        </button>
      </div>

      <div className={s.fieldRow}>
        <div>
          <label className={s.fieldLabel}>Merchant / Vendor</label>
          <input
            type="text"
            value={merchantName}
            onChange={(e) => setMerchantName(e.target.value)}
            placeholder="e.g. Home Depot"
            required
            className={s.fieldInput}
          />
        </div>
        <div>
          <label className={s.fieldLabel}>Amount</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
            className={s.fieldInput}
          />
        </div>
      </div>

      <div className={s.fieldRow}>
        <div>
          <label className={s.fieldLabel}>Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={s.fieldSelect}
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={s.fieldLabel}>Receipt (optional)</label>
          <label
            className={receiptMeta ? s.uploadBtnActive : s.uploadBtn}
          >
            <Icon
              name={receiptMeta ? "check_circle" : "photo_camera"}
              className="text-base"
            />
            <span>{receiptMeta ? "Receipt attached" : "Scan receipt"}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        </div>
      </div>

      {/* Parsing spinner */}
      {parsing && (
        <div className={s.parsingState}>
          <div className={s.spinner} />
          <span>Parsing receipt...</span>
        </div>
      )}

      {/* Parsed receipt preview */}
      {parsedData && !parsing && (
        <div className={s.parsePreview}>
          <div className={s.parsePreviewHeader}>
            <span className={s.parseMerchant}>{parsedData.merchantName}</span>
            {parsedData.date && (
              <span className={s.parseDate}>{parsedData.date}</span>
            )}
          </div>

          {parsedData.lineItems.length > 0 && (
            <div className={s.lineItemList}>
              {parsedData.lineItems.map((item, i) => (
                <div key={i} className={s.lineItem}>
                  <span className={s.lineItemDesc}>
                    {item.quantity > 1 ? `${item.quantity}x ` : ""}
                    {item.description}
                  </span>
                  <span className={s.lineItemAmount}>
                    {formatCurrency(item.total)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className={s.parseDivider}>
            {parsedData.subtotal != null && (
              <div className={s.parseTotalRow}>
                <span>Subtotal</span>
                <span>{formatCurrency(parsedData.subtotal)}</span>
              </div>
            )}
            {parsedData.taxAmount != null && (
              <div className={s.parseTotalRow}>
                <span>Tax</span>
                <span>{formatCurrency(parsedData.taxAmount)}</span>
              </div>
            )}
            <div className={s.parseTotalFinal}>
              <span>Total</span>
              <span>{formatCurrency(parsedData.totalAmount)}</span>
            </div>
          </div>

          {parsedData.suggestedCategoryName && (
            <div className={s.parseCategoryMatch}>
              <Icon name="check_circle" className="text-xs" />
              <span>Suggested: {parsedData.suggestedCategoryName}</span>
            </div>
          )}
        </div>
      )}

      <div>
        <label className={s.fieldLabel}>Note (optional)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note..."
          className={s.fieldInput}
        />
      </div>

      {error && (
        <p className={s.errorMsg}>
          <Icon name="error" className="text-sm" />
          {error}
        </p>
      )}

      <div className={s.actions}>
        <button type="submit" disabled={submitting} className={s.submitBtn}>
          {submitting ? "Adding..." : "Add Transaction"}
        </button>
        <button type="button" onClick={handleClose} className={s.cancelBtn}>
          Cancel
        </button>
      </div>
    </form>
  );
}

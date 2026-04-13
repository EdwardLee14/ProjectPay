"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import s from "./budget-category-list.module.css";

interface BudgetCategory {
  id: string;
  name: string;
  allocatedAmount: number;
  spentAmount: number;
}

export function BudgetCategoryList({
  categories,
  isClient,
}: {
  categories: BudgetCategory[];
  isClient: boolean;
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [saving, setSaving] = useState(false);
  const [localCategories, setLocalCategories] =
    useState<BudgetCategory[]>(categories);

  function toggleExpand(id: string) {
    if (editingId) return;
    setExpandedId(expandedId === id ? null : id);
  }

  function startEdit(cat: BudgetCategory) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditBudget(String(cat.allocatedAmount));
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(catId: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/budget-categories/${catId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          allocatedAmount: parseFloat(editBudget),
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setLocalCategories((prev) =>
          prev.map((c) =>
            c.id === catId
              ? {
                  ...c,
                  name: updated.name,
                  allocatedAmount: updated.allocatedAmount,
                }
              : c
          )
        );
        setEditingId(null);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  if (localCategories.length === 0) {
    return (
      <p className={s.empty}>No categories defined yet.</p>
    );
  }

  return (
    <div className={s.list}>
      {localCategories.map((cat) => {
        const pct =
          cat.allocatedAmount > 0
            ? (cat.spentAmount / cat.allocatedAmount) * 100
            : 0;
        const isExpanded = expandedId === cat.id;
        const isEditing = editingId === cat.id;

        return (
          <div key={cat.id}>
            <div
              className={s.row}
              onClick={() => toggleExpand(cat.id)}
            >
              <div className={s.rowHeader}>
                <span className={s.catName}>{cat.name}</span>
                <div className={s.rowRight}>
                  <span
                    className={pct > 100 ? s.pctCritical : s.pctNormal}
                  >
                    {Math.round(pct)}%
                  </span>
                  <Icon
                    name="expand_more"
                    className={isExpanded ? s.chevronOpen : s.chevron}
                  />
                </div>
              </div>
              <ProgressBar value={pct} className="h-1.5" />
              <div className={s.rowMeta}>
                <span>Spent: {formatCurrency(cat.spentAmount)}</span>
                <span>Budget: {formatCurrency(cat.allocatedAmount)}</span>
              </div>
            </div>

            {isExpanded && (
              <div className={s.expandedPanel}>
                <div className={s.detailGrid}>
                  <div className={s.detailItem}>
                    <span className={s.detailLabel}>Allocated</span>
                    <span className={s.detailValue}>
                      {formatCurrency(cat.allocatedAmount)}
                    </span>
                  </div>
                  <div className={s.detailItem}>
                    <span className={s.detailLabel}>Spent</span>
                    <span className={s.detailValue}>
                      {formatCurrency(cat.spentAmount)}
                    </span>
                  </div>
                  <div className={s.detailItem}>
                    <span className={s.detailLabel}>Remaining</span>
                    <span className={s.detailValue}>
                      {formatCurrency(cat.allocatedAmount - cat.spentAmount)}
                    </span>
                  </div>
                  <div className={s.detailItem}>
                    <span className={s.detailLabel}>Utilization</span>
                    <span className={s.detailValue}>{Math.round(pct)}%</span>
                  </div>
                </div>

                {isEditing ? (
                  <div className={s.editForm}>
                    <div className={s.editRow}>
                      <div>
                        <label className={s.editLabel}>Category Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className={s.editInput}
                        />
                      </div>
                      <div>
                        <label className={s.editLabel}>Budget Amount</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editBudget}
                          onChange={(e) => setEditBudget(e.target.value)}
                          className={s.editInput}
                        />
                      </div>
                    </div>
                    <div className={s.editActions}>
                      <button
                        onClick={() => saveEdit(cat.id)}
                        disabled={saving}
                        className={s.saveBtn}
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button onClick={cancelEdit} className={s.cancelBtn}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  !isClient && (
                    <div className={s.actions}>
                      <button
                        className={s.editActionBtn}
                        onClick={() => startEdit(cat)}
                      >
                        <Icon name="edit" className="text-xs" />
                        Edit
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";
import shared from "@/styles/shared.module.css";

const SUGGESTED_CATEGORIES = [
  "Materials",
  "Labor",
  "Subcontractors",
  "Equipment",
  "Permits & Inspections",
  "Design & Plans",
  "Contingency",
];

interface CategoryRow {
  id: string;
  name: string;
  amount: string;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function ProjectSetupForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [categories, setCategories] = useState<CategoryRow[]>([
    { id: uid(), name: "Materials", amount: "" },
    { id: uid(), name: "Labor", amount: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Round to 2 decimal places to avoid floating point drift
  function r2(n: number) {
    return Math.round(n * 100) / 100;
  }

  const totalBudgetNum = r2(Math.max(0, parseFloat(totalBudget) || 0));
  const allocatedTotal = r2(
    categories.reduce((sum, c) => sum + Math.max(0, parseFloat(c.amount) || 0), 0)
  );
  const unallocated = r2(totalBudgetNum - allocatedTotal);
  // Treat as balanced within 1 cent
  const isBalanced = totalBudgetNum > 0 && Math.abs(unallocated) < 0.005;

  function addCategory(name = "") {
    setCategories((prev) => [...prev, { id: uid(), name, amount: "" }]);
  }

  function removeCategory(id: string) {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  function updateCategory(id: string, field: "name" | "amount", value: string) {
    if (field === "amount") {
      // Strip leading minus, allow only digits and one decimal point
      value = value.replace(/-/g, "");
      const parts = value.split(".");
      if (parts.length > 2) value = parts[0] + "." + parts.slice(1).join("");
      // Cap to 2 decimal places while typing
      if (parts[1]?.length > 2) value = parts[0] + "." + parts[1].slice(0, 2);
    }
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  }

  function distributeEvenly() {
    if (!totalBudgetNum || categories.length === 0) return;
    const base = r2(Math.floor((totalBudgetNum / categories.length) * 100) / 100);
    const remainder = r2(totalBudgetNum - base * categories.length);
    // Give the remainder (a few cents) to the last category
    setCategories((prev) =>
      prev.map((c, i) => ({
        ...c,
        amount:
          i === prev.length - 1
            ? String(r2(base + remainder))
            : String(base),
      }))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (categories.length < 2) {
      setError("Add at least 2 budget categories.");
      return;
    }
    if (!isBalanced) {
      setError(
        `Category amounts must equal the total budget. You have ${formatCurrency(unallocated > 0 ? unallocated : -unallocated)} ${unallocated > 0 ? "unallocated" : "over-allocated"}.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          clientEmail: clientEmail || undefined,
          totalBudget: totalBudgetNum,
          categories: categories.map((c) => ({
            name: c.name,
            allocatedAmount: r2(Math.max(0, parseFloat(c.amount) || 0)),
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create project.");
        return;
      }

      const project = await res.json();
      router.push(`/projects/${project.id}`);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 lg:px-8 lg:py-8 space-y-6">
      {/* Back */}
      <Link href="/dashboard" className={cn(shared.backLink, "group")}>
        <Icon
          name="arrow_back"
          className="text-lg group-hover:-translate-x-1 transition-transform"
        />
        <span className="text-sm font-medium">Back to Dashboard</span>
      </Link>

      <div>
        <h1 className={shared.pageTitle}>New Project</h1>
        <p className="text-sm text-off-black/50 mt-1">
          Set up the project details and budget, then invite your client to review and approve.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project details */}
        <div className="bg-white rounded-xl shadow-elevation-1 p-6 space-y-5">
          <h2 className="text-base font-bold text-off-black">Project Details</h2>

          <div className={shared.fieldGroup}>
            <Label htmlFor="name" className={shared.fieldLabel}>
              Project Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g. Kitchen Renovation — 123 Main St"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className={shared.fieldGroup}>
            <Label htmlFor="description" className={shared.fieldLabel}>
              Description
            </Label>
            <textarea
              id="description"
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm placeholder:text-off-black/30 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              rows={3}
              placeholder="Brief overview of scope and work to be done..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className={shared.fieldGroup}>
            <Label htmlFor="clientEmail" className={shared.fieldLabel}>
              Client Email
            </Label>
            <Input
              id="clientEmail"
              type="email"
              placeholder="client@example.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
            <p className="text-[10px] text-off-black/30 mt-0.5">
              The client will be linked to this project when they sign up with this email.
            </p>
          </div>
        </div>

        {/* Budget */}
        <div className="bg-white rounded-xl shadow-elevation-1 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-off-black">Budget</h2>
            {totalBudgetNum > 0 && categories.length >= 2 && (
              <button
                type="button"
                onClick={distributeEvenly}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Distribute evenly
              </button>
            )}
          </div>

          <div className={shared.fieldGroup}>
            <Label htmlFor="totalBudget" className={shared.fieldLabel}>
              Total Budget <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-off-black/40 text-sm font-medium">
                $
              </span>
              <Input
                id="totalBudget"
                type="number"
                min="0.01"
                step="0.01"
                className="pl-7"
                placeholder="0.00"
                value={totalBudget}
                onChange={(e) => {
                  const val = e.target.value.replace(/-/g, "");
                  const parts = val.split(".");
                  const capped = parts.length > 1
                    ? parts[0] + "." + parts[1].slice(0, 2)
                    : val;
                  setTotalBudget(capped);
                }}
                required
              />
            </div>
          </div>

          {/* Category rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className={shared.fieldLabel}>
                Budget Categories <span className="text-red-500">*</span>
              </Label>
              <span
                className={cn(
                  "text-xs font-semibold tabular-nums",
                  isBalanced
                    ? "text-primary"
                    : unallocated > 0
                      ? "text-off-black/40"
                      : "text-destructive"
                )}
              >
                {isBalanced
                  ? "Balanced ✓"
                  : unallocated > 0
                    ? `${formatCurrency(unallocated)} left to allocate`
                    : `${formatCurrency(Math.abs(unallocated))} over budget`}
              </span>
            </div>

            <div className="space-y-2">
              {categories.map((cat) => {
                const amt = parseFloat(cat.amount) || 0;
                const pct =
                  totalBudgetNum > 0 ? (amt / totalBudgetNum) * 100 : 0;
                return (
                  <div key={cat.id} className="flex items-center gap-2">
                    <Input
                      placeholder="Category name"
                      value={cat.name}
                      onChange={(e) =>
                        updateCategory(cat.id, "name", e.target.value)
                      }
                      className="flex-1"
                      required
                    />
                    <div className="relative w-36 shrink-0">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-off-black/40 text-sm">
                        $
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-7"
                        value={cat.amount}
                        onChange={(e) =>
                          updateCategory(cat.id, "amount", e.target.value)
                        }
                        required
                      />
                    </div>
                    {totalBudgetNum > 0 && amt > 0 && (
                      <span className="text-xs text-off-black/30 w-10 text-right shrink-0 tabular-nums">
                        {Math.round(pct)}%
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeCategory(cat.id)}
                      disabled={categories.length <= 2}
                      className="text-off-black/20 hover:text-destructive disabled:opacity-0 transition-colors shrink-0"
                    >
                      <Icon name="close" className="text-base" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add category */}
            <div className="flex flex-wrap gap-2 pt-1">
              {SUGGESTED_CATEGORIES.filter(
                (s) => !categories.find((c) => c.name === s)
              )
                .slice(0, 4)
                .map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => addCategory(suggestion)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-off-black/50 bg-white border border-border rounded-lg hover:border-primary hover:text-primary shadow-sm transition-colors"
                  >
                    <Icon name="add" className="text-xs" />
                    {suggestion}
                  </button>
                ))}
              <button
                type="button"
                onClick={() => addCategory()}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-off-black/50 bg-white border border-border rounded-lg hover:border-primary hover:text-primary shadow-sm transition-colors"
              >
                <Icon name="add" className="text-xs" />
                Custom
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-3">
            <Icon name="error" className="text-destructive text-lg shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="text-sm font-semibold text-off-black/50 hover:text-off-black transition-colors"
          >
            Cancel
          </button>
          <Button
            type="submit"
            variant="pill"
            disabled={!name || !totalBudget || !isBalanced || isSubmitting}
          >
            {isSubmitting ? "Creating..." : clientEmail ? "Create & Send to Client" : "Create Project"}
          </Button>
        </div>
      </form>
    </div>
  );
}

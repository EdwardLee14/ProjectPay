"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { cn, formatCurrency } from "@/lib/utils";

const VENDOR_CATEGORIES = [
  "Ad Spend",
  "SaaS",
  "Travel",
  "Hardware",
  "Materials",
  "Labor",
  "Consulting",
  "Insurance",
];

type BudgetType = "total" | "monthly";

export function ProjectSetupForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [budgetType, setBudgetType] = useState<BudgetType>("total");
  const [totalBudget, setTotalBudget] = useState("");
  const [threshold, setThreshold] = useState("500");
  const [contractorSearch, setContractorSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          totalBudget: parseFloat(totalBudget),
          categories: selectedCategories.map((cat) => ({
            name: cat,
            allocatedAmount: parseFloat(totalBudget) / selectedCategories.length,
          })),
        }),
      });
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const budgetNum = parseFloat(totalBudget) || 0;
  const thresholdNum = parseFloat(threshold) || 0;

  return (
    <div className="pt-8 pb-20 px-6 md:px-24 max-w-7xl mx-auto w-full">
      {/* Header & Stepper */}
      <header className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="font-headline text-4xl font-bold text-foreground tracking-tight mb-4">
          Initialize New Project
        </h1>
        <p className="text-muted-foreground text-lg">
          Set the architectural parameters for your contractor spend and
          financial oversight.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          {[
            { num: 1, label: "Scope" },
            { num: 2, label: "Control" },
            { num: 3, label: "Team" },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              {i > 0 && <div className="h-px w-12 bg-accent" />}
              <button
                onClick={() => setStep(s.num)}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                  step >= s.num
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-muted-foreground"
                )}
              >
                {s.num}
              </button>
              <span
                className={cn(
                  "text-sm font-medium",
                  step >= s.num
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground opacity-60"
                )}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Main Form */}
        <section className="lg:col-span-8 space-y-10">
          {/* Project Identity */}
          <div className="bg-card p-10 rounded-xl shadow-soft">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-3 font-headline">
              <Icon name="architecture" className="text-primary" />
              Project Identity
            </h2>
            <div className="space-y-8">
              <div>
                <label className="block text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Project Name
                </label>
                <input
                  className="w-full bg-surface-container-low border-none rounded-lg p-4 text-foreground focus:ring-1 focus:ring-primary transition-all text-base placeholder:text-muted-foreground"
                  placeholder="e.g. Q4 Growth Campaign"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground mb-4">
                  Vendor Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {VENDOR_CATEGORIES.map((cat) => {
                    const selected = selectedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors",
                          selected
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent text-muted-foreground hover:bg-surface-container-highest"
                        )}
                      >
                        {cat}
                        {selected && (
                          <Icon name="close" className="text-sm" />
                        )}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    className="px-6 py-2 rounded-full border border-dashed border-outline-variant text-muted-foreground text-sm font-medium flex items-center gap-2"
                  >
                    <Icon name="add" className="text-sm" /> Add Category
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Guardrails */}
          <div className="bg-card p-10 rounded-xl shadow-soft">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-3 font-headline">
              <Icon name="account_balance_wallet" className="text-primary" />
              Financial Guardrails
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {(
                [
                  {
                    type: "total" as BudgetType,
                    label: "Total Budget",
                    desc: "Fixed amount for the project lifecycle",
                  },
                  {
                    type: "monthly" as BudgetType,
                    label: "Monthly Cap",
                    desc: "Recurring spend limit per month",
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setBudgetType(opt.type)}
                  className={cn(
                    "p-6 rounded-xl border-2 bg-surface-container-low text-left transition-all",
                    budgetType === opt.type
                      ? "border-primary"
                      : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <Icon
                    name={
                      budgetType === opt.type ? "check_circle" : "circle"
                    }
                    filled={budgetType === opt.type}
                    className={cn(
                      "mb-3",
                      budgetType === opt.type
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  />
                  <div className="font-bold text-foreground">{opt.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Budget Amount ($)
                </label>
                <input
                  className="w-full bg-surface-container-low border-none rounded-lg p-4 text-foreground focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground"
                  placeholder="50,000"
                  type="number"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Spending Threshold
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-surface-container-low border-none rounded-lg p-4 pl-12 text-foreground focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground"
                    placeholder="500"
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                  />
                  <Icon
                    name="lock_open"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"
                  />
                </div>
                <p className="mt-2 text-[0.6875rem] text-muted-foreground">
                  Approvals required for transactions above this limit.
                </p>
              </div>
            </div>
          </div>

          {/* Assign Contractor */}
          <div className="bg-card p-10 rounded-xl shadow-soft">
            <h2 className="text-xl font-bold mb-8 flex items-center gap-3 font-headline">
              <Icon name="person_add" className="text-primary" />
              Assign Contractor
            </h2>
            <div className="relative">
              <Icon
                name="search"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                className="w-full bg-surface-container-low border-none rounded-lg p-4 pl-12 text-foreground focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground"
                placeholder="Search by name or enter email address..."
                type="text"
                value={contractorSearch}
                onChange={(e) => setContractorSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-6 pt-6">
            <button
              type="button"
              className="text-muted-foreground font-semibold hover:text-foreground transition-colors"
              onClick={() => router.push("/dashboard")}
            >
              Save as Draft
            </button>
            <button
              type="button"
              disabled={!name || !totalBudget || isSubmitting}
              onClick={handleSubmit}
              className="bg-primary text-primary-foreground px-10 py-4 rounded-lg font-bold text-lg hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? "Creating..." : "Launch Project"}
              <Icon name="rocket_launch" />
            </button>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="lg:col-span-4 sticky top-24 space-y-6">
          {/* Summary Card */}
          <div className="bg-surface-container-low p-8 rounded-xl border border-surface-container-highest">
            <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground mb-6">
              Setup Preview
            </h3>
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <span className="text-[0.6875rem] text-muted-foreground">
                  Project Allocation
                </span>
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {budgetNum > 0 ? formatCurrency(budgetNum) : "$0.00"}
                </span>
              </div>
              <div className="h-px bg-surface-container-highest" />
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Approval Rule</span>
                  <span className="font-semibold">
                    &gt;{formatCurrency(thresholdNum)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Categories</span>
                  <span className="font-semibold">
                    {selectedCategories.length} selected
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Budget Type</span>
                  <span className="font-semibold capitalize">{budgetType}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Helper Card */}
          <div className="bg-primary-container text-white p-8 rounded-xl overflow-hidden relative">
            <div className="relative z-10">
              <Icon
                name="lightbulb"
                className="text-secondary-fixed mb-4"
              />
              <h4 className="font-bold text-lg mb-2">Need advice?</h4>
              <p className="text-sm opacity-80 mb-6">
                Based on similar projects in your industry, a Monthly Cap of
                $4,500 is common for Ad Spend categories.
              </p>
              <button className="text-xs font-bold uppercase tracking-widest text-secondary-fixed hover:underline">
                Apply Recommendation
              </button>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
          </div>
        </aside>
      </div>
    </div>
  );
}

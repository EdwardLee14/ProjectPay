"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

interface CardData {
  id: string;
  last4: string;
  number: string;
  cvc: string;
  expMonth: number;
  expYear: number;
  status: string;
  spendingLimit: number | null;
}

export function IssuedCardDetails({
  projectId,
  totalBudget,
  showOnLoad,
}: {
  projectId: string;
  totalBudget: number;
  showOnLoad?: boolean;
}) {
  const [card, setCard] = useState<CardData | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Auto-fetch if showOnLoad (i.e. client just approved)
  useEffect(() => {
    if (showOnLoad) fetchCard();
  }, [showOnLoad]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchCard() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/card-details`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Could not load card details");
        return;
      }
      setCard(await res.json());
      setRevealed(true);
    } finally {
      setLoading(false);
    }
  }

  function copy(value: string, label: string) {
    navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  const expStr = card
    ? `${String(card.expMonth).padStart(2, "0")}/${String(card.expYear).slice(-2)}`
    : "••/••";

  const maskedNumber = revealed && card
    ? card.number.replace(/(.{4})/g, "$1 ").trim()
    : "**** **** **** " + (card?.last4 ?? "••••");

  return (
    <div className="bg-white rounded-2xl shadow-elevation-1 overflow-hidden">
      <div className="px-5 py-4 border-b border-off-black/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="credit_card" className="text-primary text-lg" />
          <h3 className="text-sm font-bold text-off-black">Your Virtual Card</h3>
          {card && (
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
              card.status === "active"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-gray-50 text-gray-500 border-gray-200"
            }`}>
              {card.status}
            </span>
          )}
        </div>
        {card?.spendingLimit && (
          <span className="text-xs text-off-black/40">
            Limit: {formatCurrency(card.spendingLimit / 100)}
          </span>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Card visual */}
        <div className="rounded-2xl bg-gradient-to-br from-off-black to-off-black/80 text-white p-5 space-y-4 select-none">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold tracking-wide opacity-90">ProjectPay</span>
            <span className="text-sm font-bold opacity-70">VISA</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 rounded bg-yellow-400/80" />
          </div>
          <p className="font-mono text-base tracking-[0.2em] tabular-nums">
            {maskedNumber}
          </p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] opacity-50 uppercase tracking-widest">Expires</p>
              <p className="font-mono text-sm">{expStr}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] opacity-50 uppercase tracking-widest">CVC</p>
              <p className="font-mono text-sm">{revealed && card ? card.cvc : "•••"}</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        {!revealed ? (
          <button
            onClick={fetchCard}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold border border-off-black/15 rounded-xl hover:bg-off-black/[0.02] disabled:opacity-50 transition-all"
          >
            <Icon name="visibility" className="text-base text-off-black/40" />
            {loading ? "Loading card..." : "Reveal Card Details"}
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Card Number", value: card?.number ?? "", display: "Number" },
              { label: "Expiry", value: expStr, display: "Expiry" },
              { label: "CVC", value: card?.cvc ?? "", display: "CVC" },
            ].map(({ label, value, display }) => (
              <button
                key={label}
                onClick={() => copy(value, label)}
                className="flex flex-col items-center gap-1 py-2.5 px-3 rounded-xl border border-off-black/10 hover:border-primary/30 hover:bg-primary/[0.02] transition-all"
              >
                <Icon
                  name={copied === label ? "check" : "content_copy"}
                  className={`text-sm ${copied === label ? "text-green-600" : "text-off-black/30"}`}
                />
                <span className="text-[10px] font-medium text-off-black/50">{display}</span>
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <Icon name="error" className="text-sm" />
            {error}
          </p>
        )}

        <p className="text-[10px] text-off-black/30 text-center">
          This card is for project use only. Spending is capped at {formatCurrency(totalBudget)}.
        </p>
      </div>
    </div>
  );
}

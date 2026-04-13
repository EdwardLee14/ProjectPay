"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import s from "./issued-card-details.module.css";

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
    <div className={s.container}>
      <div className={s.header}>
        <div className={s.headerLeft}>
          <Icon name="credit_card" className={s.headerIcon} />
          <h3 className={s.headerTitle}>Your Virtual Card</h3>
          {card && (
            <span className={card.status === "active" ? s.statusBadgeActive : s.statusBadgeInactive}>
              {card.status}
            </span>
          )}
        </div>
        {card?.spendingLimit && (
          <span className={s.headerLimit}>
            Limit: {formatCurrency(card.spendingLimit / 100)}
          </span>
        )}
      </div>

      <div className={s.body}>
        {/* Card visual */}
        <div className={s.cardVisual}>
          <div className={s.cardVisualTop}>
            <span className={s.cardBrand}>VisiBill</span>
            <span className={s.cardNetwork}>VISA</span>
          </div>
          <div className={s.cardVisualTop}>
            <div className={s.cardChip} />
          </div>
          <p className={s.cardNumber}>
            {maskedNumber}
          </p>
          <div className={s.cardBottom}>
            <div>
              <p className={s.cardFieldLabel}>Expires</p>
              <p className={s.cardFieldValue}>{expStr}</p>
            </div>
            <div className="text-right">
              <p className={s.cardFieldLabel}>CVC</p>
              <p className={s.cardFieldValue}>{revealed && card ? card.cvc : "•••"}</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        {!revealed ? (
          <button
            onClick={fetchCard}
            disabled={loading}
            className={s.revealBtn}
          >
            <Icon name="visibility" className={s.revealBtnIcon} />
            {loading ? "Loading card..." : "Reveal Card Details"}
          </button>
        ) : (
          <div className={s.copyGrid}>
            {[
              { label: "Card Number", value: card?.number ?? "", display: "Number" },
              { label: "Expiry", value: expStr, display: "Expiry" },
              { label: "CVC", value: card?.cvc ?? "", display: "CVC" },
            ].map(({ label, value, display }) => (
              <button
                key={label}
                onClick={() => copy(value, label)}
                className={s.copyBtn}
              >
                <Icon
                  name={copied === label ? "check" : "content_copy"}
                  className={copied === label ? s.copyBtnIconCopied : s.copyBtnIconDefault}
                />
                <span className={s.copyBtnLabel}>{display}</span>
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className={s.errorText}>
            <Icon name="error" className={s.errorIcon} />
            {error}
          </p>
        )}

        <p className={s.footnote}>
          This card is for project use only. Spending is capped at {formatCurrency(totalBudget)}.
        </p>
      </div>
    </div>
  );
}

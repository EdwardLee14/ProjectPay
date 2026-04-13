"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import s from "@/app/(dashboard)/projects/[id]/project-detail.module.css";

interface SidebarCardRevealProps {
  projectId: string;
  projectName: string;
  contractorName: string;
  stripeCardId: string | null;
  isContractor: boolean;
}

export function SidebarCardReveal({
  projectId,
  projectName,
  contractorName,
  stripeCardId,
  isContractor,
}: SidebarCardRevealProps) {
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardData, setCardData] = useState<{
    number: string;
    cvc: string;
    expMonth: number;
    expYear: number;
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function handleReveal() {
    if (revealed) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/card-details`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Could not load card details");
        return;
      }
      const data = await res.json();
      setCardData(data);
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

  const expStr = cardData
    ? `${String(cardData.expMonth).padStart(2, "0")}/${String(cardData.expYear).slice(-2)}`
    : "--/--";

  const displayNumber = revealed && cardData
    ? cardData.number.replace(/(.{4})/g, "$1 ").trim()
    : `•••• •••• •••• ${stripeCardId?.slice(-4) ?? "••••"}`;

  return (
    <>
      {/* Virtual card */}
      <div className={s.virtualCardWrap}>
        <div className={s.virtualCard}>
          <div className={s.virtualCardTop}>
            <span className={s.virtualCardName}>{projectName}</span>
            <span className={s.virtualCardVisa}>VISA</span>
          </div>
          <div className={s.virtualCardChipRow}>
            <div className={s.virtualCardChip}>
              <div className={s.virtualCardChipLines} />
            </div>
          </div>
          <p className={s.virtualCardNumber}>{displayNumber}</p>
          <div className={s.virtualCardBottom}>
            <div>
              <p className={s.virtualCardLabel}>Cardholder</p>
              <p className={s.virtualCardValue}>{contractorName}</p>
            </div>
            <div>
              <p className={s.virtualCardLabel}>Expires</p>
              <p className={s.virtualCardValue}>{expStr}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reveal / Copy actions */}
      {!revealed ? (
        <>
          <button
            className={s.revealBtn}
            type="button"
            onClick={handleReveal}
            disabled={loading || !isContractor}
          >
            <Icon name="visibility" className="text-base" />
            {loading ? "Loading..." : "Reveal Card Details"}
          </button>
          <p className={s.revealHint}>
            {isContractor
              ? "Click to reveal full card number, CVC, and expiry"
              : "Only the assigned contractor can reveal details"}
          </p>
        </>
      ) : (
        <div className={s.copyActions}>
          {[
            { label: "Number", value: cardData?.number ?? "" },
            { label: "Expiry", value: expStr },
            { label: "CVC", value: cardData?.cvc ?? "" },
          ].map(({ label, value }) => (
            <button
              key={label}
              onClick={() => copy(value, label)}
              className={s.copyBtn}
              type="button"
            >
              <Icon
                name={copied === label ? "check" : "content_copy"}
                className="text-xs"
              />
              <span>{copied === label ? "Copied" : label}</span>
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className={s.revealError}>
          <Icon name="error" className="text-sm text-destructive" />
          {error}
        </p>
      )}
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";

const STORAGE_KEY = "visibill-promo-dismissed";

export function PromoBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");
  }

  if (!visible) return null;

  return (
    <div className="fixed top-0 right-0 left-0 md:left-[88px] h-8 z-[51] bg-primary flex items-center justify-center px-4">
      <p className="text-[11px] font-medium text-white">
        Track budgets and approve spend on the go &mdash; the new VisiBill mobile app is here.{" "}
        <span className="font-bold underline underline-offset-2 cursor-pointer">
          Download now &rarr;
        </span>
      </p>
      <button
        onClick={dismiss}
        className="absolute right-3 p-0.5 text-white/60 hover:text-white transition-colors"
        aria-label="Dismiss banner"
      >
        <Icon name="close" className="text-sm" />
      </button>
    </div>
  );
}

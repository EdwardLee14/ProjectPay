"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import s from "./image-lightbox.module.css";

interface ImageLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return createPortal(
    <div className={s.overlay} onClick={onClose}>
      <div className={s.imageWrap} onClick={(e) => e.stopPropagation()}>
        <button className={s.closeBtn} onClick={onClose} aria-label="Close">
          &times;
        </button>
        <img src={src} alt={alt} className={s.image} />
      </div>
    </div>,
    document.body
  );
}

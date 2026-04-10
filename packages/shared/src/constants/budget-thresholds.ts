export const BUDGET_THRESHOLDS = {
  /** Trigger alert when category spend reaches this percentage */
  CATEGORY_WARNING: 0.9,
  /** Category is fully spent */
  CATEGORY_LIMIT: 1.0,
  /** Trigger alert when overall project spend reaches this percentage */
  PROJECT_WARNING: 0.9,
  /** Client access token default expiry in days */
  TOKEN_EXPIRY_DAYS: 30,
  /** Maximum budget categories per project */
  MAX_CATEGORIES: 8,
  /** Minimum budget categories per project */
  MIN_CATEGORIES: 2,
} as const;

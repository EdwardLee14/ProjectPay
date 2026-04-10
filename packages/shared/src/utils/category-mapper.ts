import type { BudgetCategory } from "../types/models";
import { DEFAULT_MCC_MAP } from "../constants/merchant-categories";

/**
 * Maps a Stripe merchant category code (MCC) to the matching budget category.
 * First checks the project's custom category-to-MCC mappings, then falls back
 * to the default MCC map grouped by common construction categories.
 *
 * Returns the matched category or null if no match.
 */
export function mapMccToCategory(
  mcc: string,
  categories: Pick<BudgetCategory, "id" | "name" | "merchantCategoryCodes">[]
): string | null {
  // 1. Check explicit MCC mappings on each category
  for (const cat of categories) {
    if (cat.merchantCategoryCodes.includes(mcc)) {
      return cat.id;
    }
  }

  // 2. Fall back: match by default MCC -> category name mapping
  const defaultCategoryName = DEFAULT_MCC_MAP[mcc];
  if (defaultCategoryName) {
    const match = categories.find(
      (cat) => cat.name.toLowerCase() === defaultCategoryName.toLowerCase()
    );
    if (match) return match.id;
  }

  return null;
}

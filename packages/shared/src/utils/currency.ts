export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/** Convert Stripe cents (integer) to dollars (decimal) */
export function centsToDecimal(cents: number): number {
  return Math.abs(cents) / 100;
}

/** Convert dollars (decimal) to Stripe cents (integer) */
export function decimalToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

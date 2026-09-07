/**
 * Shared financial formatting utilities.
 * The application is strictly USD-only ($).
 */

/**
 * Format any numeric or string monetary amount into a clean, precise USD string ($XX.XX).
 */
export function formatPrice(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "$0.00";
  }

  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `$${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format number with commas for pieces/units (e.g. 5,000 pcs)
 */
export function formatQuantity(qty: number | string | null | undefined, suffix = "pcs"): string {
  if (qty === null || qty === undefined || isNaN(Number(qty))) {
    return `0 ${suffix}`.trim();
  }

  const num = typeof qty === "string" ? parseInt(qty, 10) : qty;
  return `${num.toLocaleString("en-US")} ${suffix}`.trim();
}

/**
 * Formats a number as currency (UAH)
 * @param value The value to format
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || isNaN(Number(value))) return "0 ₴"

  const numValue = typeof value === "string" ? Number.parseFloat(value) : value

  if (isNaN(numValue)) return "0 ₴"

  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue)
}

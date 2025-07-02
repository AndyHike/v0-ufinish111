export function formatCurrency(amount: number): string {
  // Handle invalid numbers
  if (isNaN(amount) || amount === null || amount === undefined) {
    return "0,00 Kč"
  }

  // Format as Czech Koruna
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format YYYY-MM-DD → DD-MM-YYYY
 */
export function fmtDate(dateStr) {
  if (!dateStr) return "—";
  // Validasi format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split("-");
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

/**
 * Format angka ke Rupiah
 */
export function fmtRupiah(n) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

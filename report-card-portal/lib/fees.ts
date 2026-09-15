export function feeBalance(amount: number, paid: number) {
  return Math.max(0, amount - paid);
}

export function feeStatus(amount: number, paid: number): "Paid" | "Due" {
  return paid >= amount ? "Paid" : "Due";
}

export function formatRupees(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function formatDueDate(value: string) {
  if (!value) return "—";
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function parseMoney(value: FormDataEntryValue | null) {
  if (value == null || String(value).trim() === "") return 0;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n !== Math.trunc(n)) return null;
  return n;
}

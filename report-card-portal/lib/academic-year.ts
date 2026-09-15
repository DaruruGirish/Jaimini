export function formatAcademicYear(fromRaw: string, toRaw: string) {
  const from = fromRaw.trim();
  const to = toRaw.trim();
  if (!/^\d{4}$/.test(from)) return { error: "Start year must be 4 digits, e.g. 2025" };
  const start = Number(from);
  if (start < 1990 || start > 2100) return { error: "Enter a valid start year" };

  let endFull: number;
  if (/^\d{2}$/.test(to)) {
    endFull = Math.floor(start / 100) * 100 + Number(to);
    if (endFull <= start) endFull += 100;
  } else if (/^\d{4}$/.test(to)) {
    endFull = Number(to);
  } else {
    return { error: "End year must be 2 or 4 digits, e.g. 26 or 2026" };
  }

  if (endFull !== start + 1) {
    return { error: "End year should be the next year, e.g. 2025 to 2026" };
  }

  return { label: `${start}-${endFull}` };
}

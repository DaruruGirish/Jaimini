export const FA_MAX = 15;
export const SA_MAX = 20;
export const TERM_MAX = 50;
export const YEAR_MAX = 100;
/** D and above. Below this is E (fail). */
export const PASS_MARK = 40;

export function gradeFromPercent(p: number | null | undefined): string | null {
  if (p == null || Number.isNaN(p)) return null;
  if (p >= 90) return "A+";
  if (p >= 80) return "A";
  if (p >= 70) return "B+";
  if (p >= 60) return "B";
  if (p >= 50) return "C";
  if (p >= 40) return "D";
  return "E";
}

export function faGrade(marks: number | null | undefined) {
  if (marks == null) return null;
  return gradeFromPercent((marks / FA_MAX) * 100);
}

export function saGrade(marks: number | null | undefined) {
  if (marks == null) return null;
  return gradeFromPercent((marks / SA_MAX) * 100);
}

export function termTotal(
  fa1: number | null | undefined,
  fa2: number | null | undefined,
  sa: number | null | undefined
) {
  if (fa1 == null && fa2 == null && sa == null) return null;
  return (fa1 ?? 0) + (fa2 ?? 0) + (sa ?? 0);
}

export function termGrade(total: number | null | undefined) {
  if (total == null) return null;
  return gradeFromPercent((total / TERM_MAX) * 100);
}

export function grandGrade(total: number | null | undefined) {
  if (total == null) return null;
  return gradeFromPercent((total / YEAR_MAX) * 100);
}

export function partATotal(cell: {
  fa1?: number | null;
  fa2?: number | null;
  sa1?: number | null;
  fa3?: number | null;
  fa4?: number | null;
  sa2?: number | null;
} | null | undefined) {
  if (!cell) return null;
  const vals = [cell.fa1, cell.fa2, cell.sa1, cell.fa3, cell.fa4, cell.sa2];
  if (vals.every((v) => v == null)) return null;
  return vals.reduce<number>((sum, v) => sum + (v ?? 0), 0);
}

export function partBTotal(cell: {
  fa01?: number | null;
  fa02?: number | null;
  sa01?: number | null;
  fa03?: number | null;
  fa04?: number | null;
  sa02?: number | null;
}) {
  const vals = [cell.fa01, cell.fa02, cell.sa01, cell.fa03, cell.fa04, cell.sa02];
  if (vals.every((v) => v == null)) return null;
  return vals.reduce<number>((sum, v) => sum + (v ?? 0), 0);
}

export function attendancePct(present: number | null | undefined, work: number | null | undefined) {
  if (present == null || work == null || work === 0) return null;
  return Math.round((present / work) * 1000) / 10;
}

export function clampMark(value: number | null, max: number) {
  if (value == null || Number.isNaN(value)) return null;
  if (value < 0) return 0;
  if (value > max) return max;
  return Math.round(value);
}

export function dash(v: number | string | null | undefined) {
  if (v == null || v === "") return "–";
  return String(v);
}

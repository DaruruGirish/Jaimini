import type { PartAKey, PartBKey } from "./mark-fields";
import { A_TO_B, PART_A_EXAMS } from "./mark-fields";
import { FA_MAX, SA_MAX, faGrade, saGrade } from "./grades";

export const SINGLE_EXAMS = ["FA1", "FA2", "SA1", "FA3", "FA4", "SA2"] as const;
export type SingleExam = (typeof SINGLE_EXAMS)[number];
export type ExamKey = SingleExam | "OVERALL";

export const EXAM_META: Record<
  SingleExam,
  { label: string; title: string; partA: PartAKey; partB: PartBKey; max: number; kind: "FA" | "SA" }
> = {
  FA1: { label: "FA-I", title: "FA-I REPORT CARD", partA: "fa1", partB: "fa01", max: FA_MAX, kind: "FA" },
  FA2: { label: "FA-II", title: "FA-II REPORT CARD", partA: "fa2", partB: "fa02", max: FA_MAX, kind: "FA" },
  SA1: { label: "SA-I", title: "SA-I REPORT CARD", partA: "sa1", partB: "sa01", max: SA_MAX, kind: "SA" },
  FA3: { label: "FA-III", title: "FA-III REPORT CARD", partA: "fa3", partB: "fa03", max: FA_MAX, kind: "FA" },
  FA4: { label: "FA-IV", title: "FA-IV REPORT CARD", partA: "fa4", partB: "fa04", max: FA_MAX, kind: "FA" },
  SA2: { label: "SA-II", title: "SA-II REPORT CARD", partA: "sa2", partB: "sa02", max: SA_MAX, kind: "SA" },
};

export function isSingleExam(value: string): value is SingleExam {
  return (SINGLE_EXAMS as readonly string[]).includes(value);
}

export const A_TO_EXAM: Record<PartAKey, SingleExam> = {
  fa1: "FA1",
  fa2: "FA2",
  sa1: "SA1",
  fa3: "FA3",
  fa4: "FA4",
  sa2: "SA2",
};

export function examFromPartA(key: PartAKey): SingleExam {
  return A_TO_EXAM[key];
}

export function examGrade(exam: SingleExam, marks: number | null) {
  return EXAM_META[exam].kind === "SA" ? saGrade(marks) : faGrade(marks);
}

export function lockedPartAKeys(exams: string[]): PartAKey[] {
  return exams.flatMap((exam) => {
    if (!isSingleExam(exam)) return [];
    return [EXAM_META[exam].partA];
  });
}

export function lockedPartBKeys(exams: string[]): PartBKey[] {
  return lockedPartAKeys(exams).map((key) => A_TO_B[key]);
}

export function examStatusLabel(status: string | undefined) {
  if (status === "APPROVED") return "Approved";
  if (status === "SUBMITTED") return "Submitted";
  if (status === "REJECTED") return "Rejected";
  return "Draft";
}

export function examIsLocked(status: string | undefined) {
  return status === "SUBMITTED" || status === "APPROVED";
}

export { PART_A_EXAMS };

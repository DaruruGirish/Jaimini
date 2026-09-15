import { FA_MAX, SA_MAX } from "./grades";

export const PART_A_EXAMS = [
  { key: "fa1", label: "FA-I", max: FA_MAX },
  { key: "fa2", label: "FA-II", max: FA_MAX },
  { key: "sa1", label: "SA-I", max: SA_MAX },
  { key: "fa3", label: "FA-III", max: FA_MAX },
  { key: "fa4", label: "FA-IV", max: FA_MAX },
  { key: "sa2", label: "SA-II", max: SA_MAX },
] as const;

export const PART_B_EXAMS = [
  { key: "fa01", label: "FA-01", max: FA_MAX },
  { key: "fa02", label: "FA-02", max: FA_MAX },
  { key: "sa01", label: "SA-01", max: SA_MAX },
  { key: "fa03", label: "FA-03", max: FA_MAX },
  { key: "fa04", label: "FA-04", max: FA_MAX },
  { key: "sa02", label: "SA-02", max: SA_MAX },
] as const;

export type PartAKey = (typeof PART_A_EXAMS)[number]["key"];
export type PartBKey = (typeof PART_B_EXAMS)[number]["key"];

export const A_TO_B: Record<PartAKey, PartBKey> = {
  fa1: "fa01",
  fa2: "fa02",
  sa1: "sa01",
  fa3: "fa03",
  fa4: "fa04",
  sa2: "sa02",
};

export const B_TO_A: Record<PartBKey, PartAKey> = {
  fa01: "fa1",
  fa02: "fa2",
  sa01: "sa1",
  fa03: "fa3",
  fa04: "fa4",
  sa02: "sa2",
};

export type PartAMarks = Record<PartAKey, number | null>;
export type PartBMarks = Record<PartBKey, number | null>;

export function emptyPartA(): PartAMarks {
  return { fa1: null, fa2: null, sa1: null, fa3: null, fa4: null, sa2: null };
}

export function emptyPartB(): PartBMarks {
  return { fa01: null, fa02: null, sa01: null, fa03: null, fa04: null, sa02: null };
}

export function isLockedStatus(status: string) {
  return status === "APPROVED";
}

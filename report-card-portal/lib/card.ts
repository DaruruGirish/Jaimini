import type { MarkCell, PartBCell, Subject } from "@prisma/client";
import {
  attendancePct,
  dash,
  faGrade,
  grandGrade,
  partBTotal,
  saGrade,
  termGrade,
  termTotal,
} from "./grades";

export type CardSchool = {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  website: string;
  logoUrl: string;
  footerQuote: string;
};

export type CardPartARow = {
  sl: number;
  subject: string;
  fa1: string;
  fa1g: string;
  fa2: string;
  fa2g: string;
  sa1: string;
  t1: string;
  t1g: string;
  fa3: string;
  fa3g: string;
  fa4: string;
  fa4g: string;
  sa2: string;
  t2: string;
  t2g: string;
  grand: string;
  grandg: string;
  grandNum: number | null;
};

export type CardView = {
  school: CardSchool;
  yearLabel: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  className: string;
  section: string;
  rollNo: string;
  photoUrl: string;
  partA: CardPartARow[];
  partB: {
    subject: string;
    fa01: string;
    fa02: string;
    sa01: string;
    fa03: string;
    fa04: string;
    sa02: string;
    total: string;
  }[];
  attendance: {
    workS1: string;
    presentS1: string;
    pctS1: string;
    workS2: string;
    presentS2: string;
    pctS2: string;
  };
  remarks: string;
  verificationCode: string | null;
  overallGrade: string;
  grandTotal: number | null;
};

function cellMap<T extends { subjectId: string }>(cells: T[]) {
  return new Map(cells.map((c) => [c.subjectId, c]));
}

export function buildCardView(input: {
  school: CardSchool;
  yearLabel: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  className: string;
  section: string;
  rollNo: number;
  photoUrl: string;
  remarks: string;
  verificationCode: string | null;
  attendanceWorkS1: number | null;
  attendancePresentS1: number | null;
  attendanceWorkS2: number | null;
  attendancePresentS2: number | null;
  subjectsA: Subject[];
  subjectsB: Subject[];
  markCells: MarkCell[];
  partBCells: PartBCell[];
}): CardView {
  const aCells = cellMap(input.markCells);
  const bCells = cellMap(input.partBCells);

  const partA: CardPartARow[] = input.subjectsA.map((subject, i) => {
    const c = aCells.get(subject.id);
    const t1 = termTotal(c?.fa1, c?.fa2, c?.sa1);
    const t2 = termTotal(c?.fa3, c?.fa4, c?.sa2);
    const grand = t1 == null && t2 == null ? null : (t1 ?? 0) + (t2 ?? 0);
    return {
      sl: i + 1,
      subject: subject.name,
      fa1: dash(c?.fa1),
      fa1g: dash(faGrade(c?.fa1)),
      fa2: dash(c?.fa2),
      fa2g: dash(faGrade(c?.fa2)),
      sa1: dash(c?.sa1),
      t1: dash(t1),
      t1g: dash(termGrade(t1)),
      fa3: dash(c?.fa3),
      fa3g: dash(faGrade(c?.fa3)),
      fa4: dash(c?.fa4),
      fa4g: dash(faGrade(c?.fa4)),
      sa2: dash(c?.sa2),
      t2: dash(t2),
      t2g: dash(termGrade(t2)),
      grand: dash(grand),
      grandg: dash(grandGrade(grand)),
      grandNum: grand,
    };
  });

  const grands = partA.map((r) => r.grandNum).filter((n): n is number => n != null);
  const avgGrand =
    grands.length === 0 ? null : Math.round(grands.reduce((a, b) => a + b, 0) / grands.length);

  const partB = input.subjectsB.map((subject) => {
    const c = bCells.get(subject.id);
    const total = c ? partBTotal(c) : null;
    return {
      subject: subject.name,
      fa01: dash(c?.fa01),
      fa02: dash(c?.fa02),
      sa01: dash(c?.sa01),
      fa03: dash(c?.fa03),
      fa04: dash(c?.fa04),
      sa02: dash(c?.sa02),
      total: dash(total),
    };
  });

  const pctS1 = attendancePct(input.attendancePresentS1, input.attendanceWorkS1);
  const pctS2 = attendancePct(input.attendancePresentS2, input.attendanceWorkS2);

  return {
    school: input.school,
    yearLabel: input.yearLabel,
    studentName: input.studentName,
    fatherName: input.fatherName,
    motherName: input.motherName,
    className: input.className,
    section: input.section,
    rollNo: String(input.rollNo),
    photoUrl: input.photoUrl,
    partA,
    partB,
    attendance: {
      workS1: dash(input.attendanceWorkS1),
      presentS1: dash(input.attendancePresentS1),
      pctS1: pctS1 == null ? "–" : `${pctS1}%`,
      workS2: dash(input.attendanceWorkS2),
      presentS2: dash(input.attendancePresentS2),
      pctS2: pctS2 == null ? "–" : `${pctS2}%`,
    },
    remarks: input.remarks || "",
    verificationCode: input.verificationCode,
    overallGrade: dash(grandGrade(avgGrand)),
    grandTotal: avgGrand,
  };
}

import { prisma } from "./prisma";
import { buildCardView, type CardView } from "./card";
import { getClassSubjects } from "./class-subjects";

const sheetInclude = {
  cells: true,
  partBCells: true,
  year: true,
  enrollment: {
    include: {
      student: true,
      class: true,
    },
  },
} as const;

export async function loadCardByMarkSheetId(markSheetId: string): Promise<CardView | null> {
  const sheet = await prisma.markSheet.findUnique({ where: { id: markSheetId }, include: sheetInclude });
  if (!sheet) return null;
  const [school, { a: subjectsA, b: subjectsB }] = await Promise.all([
    prisma.schoolSettings.findUnique({ where: { id: "singleton" } }),
    getClassSubjects(sheet.enrollment.classId),
  ]);
  if (!school) return null;
  const activeA = new Set(subjectsA.map((s) => s.id));
  return buildCardView({
    school,
    yearLabel: sheet.year.label,
    studentName: sheet.enrollment.student.name,
    fatherName: sheet.enrollment.student.fatherName,
    motherName: sheet.enrollment.student.motherName,
    className: sheet.enrollment.class.name,
    section: sheet.enrollment.class.section,
    rollNo: sheet.enrollment.rollNo,
    photoUrl: sheet.enrollment.student.photoUrl,
    remarks: sheet.remarks,
    verificationCode: sheet.verificationCode,
    attendanceWorkS1: sheet.attendanceWorkS1,
    attendancePresentS1: sheet.attendancePresentS1,
    attendanceWorkS2: sheet.attendanceWorkS2,
    attendancePresentS2: sheet.attendancePresentS2,
    subjectsA,
    subjectsB,
    markCells: sheet.cells.filter((c) => activeA.has(c.subjectId)),
    partBCells: sheet.partBCells.filter((c) => subjectsB.some((s) => s.id === c.subjectId)),
  });
}

export function grandTotalFromCells(
  cells: { fa1: number | null; fa2: number | null; sa1: number | null; fa3: number | null; fa4: number | null; sa2: number | null }[]
) {
  if (!cells.length) return null;
  const totals = cells.map((c) => (c.fa1 ?? 0) + (c.fa2 ?? 0) + (c.sa1 ?? 0) + (c.fa3 ?? 0) + (c.fa4 ?? 0) + (c.sa2 ?? 0));
  return Math.round(totals.reduce((a, b) => a + b, 0) / totals.length);
}

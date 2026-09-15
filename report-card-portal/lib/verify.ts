import { grandGrade } from "@/lib/grades";
import { grandTotalFromCells } from "@/lib/load-card";
import { prisma } from "@/lib/prisma";
import { EXAM_META, examGrade, isSingleExam } from "@/lib/exams";
import { getClassSubjects } from "@/lib/class-subjects";

export type VerifyResult =
  | {
      valid: true;
      kind: "overall" | "exam";
      examName: string;
      name: string;
      className: string;
      section: string;
      rollNo: number;
      year: string;
      grand: number | null;
      grade: string | null;
    }
  | { valid: false };

export async function lookupVerification(raw: string): Promise<VerifyResult | null> {
  const code = normalizeVerificationCode(raw);
  if (!code) return null;
  if (isRollOnlyCode(code) || !isSafeVerificationCode(code)) return { valid: false };

  const sheet = await prisma.markSheet.findUnique({
    where: { verificationCode: code },
    include: { cells: true, year: true, enrollment: { include: { student: true, class: true } } },
  });

  if (sheet && sheet.status === "APPROVED" && sheet.verificationCode) {
    const { a: subjectsA } = await getClassSubjects(sheet.enrollment.classId);
    const activeIds = new Set(subjectsA.map((s) => s.id));
    const grand = grandTotalFromCells(sheet.cells.filter((c) => activeIds.has(c.subjectId)));
    return {
      valid: true,
      kind: "overall",
      examName: "Overall",
      name: sheet.enrollment.student.name,
      className: sheet.enrollment.class.name,
      section: sheet.enrollment.class.section,
      rollNo: sheet.enrollment.rollNo,
      year: sheet.year.label,
      grand,
      grade: grandGrade(grand),
    };
  }

  const examCard = await prisma.examCard.findUnique({
    where: { verificationCode: code },
    include: {
      enrollment: {
        include: {
          student: true,
          class: true,
          year: true,
          markSheets: { include: { cells: true } },
        },
      },
    },
  });
  if (!examCard || !examCard.verificationCode || !isSingleExam(examCard.exam)) {
    return { valid: false };
  }
  const release = await prisma.examRelease.findUnique({
    where: { classId_exam: { classId: examCard.enrollment.classId, exam: examCard.exam } },
  });
  if (release?.status !== "APPROVED") return { valid: false };

  const meta = EXAM_META[examCard.exam];
  const { a: subjectsA } = await getClassSubjects(examCard.enrollment.classId);
  const activeIds = new Set(subjectsA.map((s) => s.id));
  const sheetForYear = examCard.enrollment.markSheets.find((m) => m.yearId === examCard.enrollment.yearId);
  const marks = (sheetForYear?.cells ?? [])
    .filter((c) => activeIds.has(c.subjectId))
    .map((c) => c[meta.partA])
    .filter((v): v is number => v != null);
  const avg = marks.length ? Math.round(marks.reduce((a, b) => a + b, 0) / marks.length) : null;

  return {
    valid: true,
    kind: "exam",
    examName: meta.label,
    name: examCard.enrollment.student.name,
    className: examCard.enrollment.class.name,
    section: examCard.enrollment.class.section,
    rollNo: examCard.enrollment.rollNo,
    year: examCard.enrollment.year.label,
    grand: avg,
    grade: examGrade(examCard.exam, avg),
  };
}

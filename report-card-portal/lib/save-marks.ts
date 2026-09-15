import { prisma } from "@/lib/prisma";
import { FA_MAX, SA_MAX, clampMark, partBTotal } from "@/lib/grades";
import type { PartAKey, PartAMarks, PartBKey, PartBMarks } from "@/lib/mark-fields";
import { examIsLocked, lockedPartAKeys, lockedPartBKeys } from "@/lib/exams";

export type StudentMarksInput = {
  enrollmentId: string;
  remarks?: string;
  attendanceWorkS1?: number | null;
  attendancePresentS1?: number | null;
  attendanceWorkS2?: number | null;
  attendancePresentS2?: number | null;
  cells?: Record<string, Partial<PartAMarks>>;
  partB?: Record<string, Partial<PartBMarks>>;
  merge?: boolean;
  reopen?: boolean;
  resubmit?: boolean;
};

function num(v: number | null | undefined) {
  if (v == null || Number.isNaN(Number(v))) return null;
  return Number(v);
}

export async function persistStudentMarks(
  yearId: string,
  input: StudentMarksInput,
  subjectsA: { id: string }[],
  subjectsB: { id: string }[]
) {
  let sheet = await prisma.markSheet.findUnique({
    where: { enrollmentId_yearId: { enrollmentId: input.enrollmentId, yearId } },
    include: { cells: true, partBCells: true },
  });
  if (sheet && sheet.status === "APPROVED" && !input.reopen && !input.resubmit) {
    return { skipped: true as const };
  }

  const workS1 = num(input.attendanceWorkS1);
  const presentS1 = num(input.attendancePresentS1);
  const workS2 = num(input.attendanceWorkS2);
  const presentS2 = num(input.attendancePresentS2);
  if (presentS1 != null && workS1 != null && presentS1 > workS1) {
    return { error: "Semester 1 present days cannot exceed working days" };
  }
  if (presentS2 != null && workS2 != null && presentS2 > workS2) {
    return { error: "Semester 2 present days cannot exceed working days" };
  }

  if (!sheet) {
    sheet = await prisma.markSheet.create({
      data: { enrollmentId: input.enrollmentId, yearId, status: "DRAFT" },
      include: { cells: true, partBCells: true },
    });
  }

  const enrollment = await prisma.enrollment.findUnique({ where: { id: input.enrollmentId } });
  const releases = enrollment
    ? await prisma.examRelease.findMany({ where: { classId: enrollment.classId } })
    : [];
  const lockedA = new Set(lockedPartAKeys(releases.filter((r) => examIsLocked(r.status)).map((r) => r.exam)));
  const lockedB = new Set(lockedPartBKeys(releases.filter((r) => examIsLocked(r.status)).map((r) => r.exam)));

  const nextStatus = input.resubmit || sheet.status === "SUBMITTED" ? "SUBMITTED" : "DRAFT";
  await prisma.markSheet.update({
    where: { id: sheet.id },
    data: {
      status: nextStatus,
      remarks: input.remarks ?? sheet.remarks,
      attendanceWorkS1: input.attendanceWorkS1 === undefined ? sheet.attendanceWorkS1 : workS1,
      attendancePresentS1: input.attendancePresentS1 === undefined ? sheet.attendancePresentS1 : presentS1,
      attendanceWorkS2: input.attendanceWorkS2 === undefined ? sheet.attendanceWorkS2 : workS2,
      attendancePresentS2: input.attendancePresentS2 === undefined ? sheet.attendancePresentS2 : presentS2,
      rejectedReason: nextStatus === "SUBMITTED" ? sheet.rejectedReason : null,
      submittedAt: nextStatus === "SUBMITTED" ? (sheet.submittedAt ?? new Date()) : sheet.submittedAt,
      approvedAt: input.reopen || input.resubmit ? null : sheet.approvedAt,
      verificationCode: input.reopen || input.resubmit ? null : sheet.verificationCode,
    },
  });

  for (const sub of subjectsA) {
    const incoming = input.cells?.[sub.id];
    if (!incoming && input.merge) continue;
    const existing = sheet.cells.find((c) => c.subjectId === sub.id);
    const pick = (key: PartAKey, max: number) => {
      if (lockedA.has(key)) return existing?.[key] ?? null;
      if (incoming && Object.prototype.hasOwnProperty.call(incoming, key)) {
        return clampMark(num(incoming[key] ?? null), max);
      }
      if (input.merge) return existing?.[key] ?? null;
      return null;
    };
    const fa1 = pick("fa1", FA_MAX);
    const fa2 = pick("fa2", FA_MAX);
    const sa1 = pick("sa1", SA_MAX);
    const fa3 = pick("fa3", FA_MAX);
    const fa4 = pick("fa4", FA_MAX);
    const sa2 = pick("sa2", SA_MAX);
    await prisma.markCell.upsert({
      where: { markSheetId_subjectId: { markSheetId: sheet.id, subjectId: sub.id } },
      create: { markSheetId: sheet.id, subjectId: sub.id, fa1, fa2, sa1, fa3, fa4, sa2 },
      update: { fa1, fa2, sa1, fa3, fa4, sa2 },
    });
  }

  for (const sub of subjectsB) {
    const incoming = input.partB?.[sub.id];
    if (!incoming && input.merge) continue;
    const existing = sheet.partBCells.find((c) => c.subjectId === sub.id);
    const pick = (key: PartBKey, max: number) => {
      if (lockedB.has(key)) return existing?.[key] ?? null;
      if (incoming && Object.prototype.hasOwnProperty.call(incoming, key)) {
        return clampMark(num(incoming[key] ?? null), max);
      }
      if (input.merge) return existing?.[key] ?? null;
      return null;
    };
    const fa01 = pick("fa01", FA_MAX);
    const fa02 = pick("fa02", FA_MAX);
    const sa01 = pick("sa01", SA_MAX);
    const fa03 = pick("fa03", FA_MAX);
    const fa04 = pick("fa04", FA_MAX);
    const sa02 = pick("sa02", SA_MAX);
    const total = partBTotal({ fa01, fa02, sa01, fa03, fa04, sa02 });
    await prisma.partBCell.upsert({
      where: { markSheetId_subjectId: { markSheetId: sheet.id, subjectId: sub.id } },
      create: { markSheetId: sheet.id, subjectId: sub.id, fa01, fa02, sa01, fa03, fa04, sa02, total },
      update: { fa01, fa02, sa01, fa03, fa04, sa02, total },
    });
  }

  return { ok: true as const };
}

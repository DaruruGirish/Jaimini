import { prisma } from "@/lib/prisma";
import { attendancePct, grandGrade, partATotal, partBTotal, termTotal } from "@/lib/grades";
import { grandTotalFromCells } from "@/lib/load-card";
import { classMarksStatus } from "@/lib/status";
import { buildClassCharts } from "@/lib/class-analytics";
import { SINGLE_EXAMS, type SingleExam } from "@/lib/exams";
import { getClassSubjects } from "@/lib/class-subjects";

export async function loadClassDetail(classId: string) {
  const [klass, school] = await Promise.all([
    prisma.schoolClass.findUnique({
      where: { id: classId },
      include: {
        year: true,
        classTeacher: true,
        examReleases: true,
        enrollments: {
          include: {
            student: true,
            markSheets: {
              include: {
                cells: { include: { subject: true } },
                partBCells: { include: { subject: true } },
              },
            },
          },
          orderBy: { rollNo: "asc" },
        },
      },
    }),
    prisma.schoolSettings.findUnique({ where: { id: "singleton" } }),
  ]);
  if (!klass) return null;
  const { a: subjectsA, b: subjectsB } = await getClassSubjects(classId);

  const statuses = klass.enrollments.flatMap((e) => e.markSheets.map((m) => m.status));
  const status = classMarksStatus(statuses, klass.enrollments.length);
  const canApprove = status === "Submitted" || status === "Rejected";
  const approved = status === "Approved";

  const rows = klass.enrollments.map((e) => {
    const sheet = e.markSheets.find((m) => m.yearId === klass.yearId);
    const cellsBySubject = new Map((sheet?.cells ?? []).map((c) => [c.subjectId, c]));
    const partBBySubject = new Map((sheet?.partBCells ?? []).map((c) => [c.subjectId, c]));
    const grand = sheet
      ? grandTotalFromCells(sheet.cells.filter((c) => subjectsA.some((s) => s.id === c.subjectId)))
      : null;
    const partA = subjectsA.map((sub) => {
      const cell = cellsBySubject.get(sub.id);
      const t1 = cell ? termTotal(cell.fa1, cell.fa2, cell.sa1) : null;
      const t2 = cell ? termTotal(cell.fa3, cell.fa4, cell.sa2) : null;
      const total = partATotal(cell);
      return {
        subjectId: sub.id,
        fa1: cell?.fa1 ?? null,
        fa2: cell?.fa2 ?? null,
        sa1: cell?.sa1 ?? null,
        fa3: cell?.fa3 ?? null,
        fa4: cell?.fa4 ?? null,
        sa2: cell?.sa2 ?? null,
        t1,
        t2,
        total,
        grade: grandGrade(total),
      };
    });
    const partB = subjectsB.map((sub) => {
      const cell = partBBySubject.get(sub.id);
      const total = cell ? partBTotal(cell) : null;
      return {
        subjectId: sub.id,
        fa01: cell?.fa01 ?? null,
        fa02: cell?.fa02 ?? null,
        sa01: cell?.sa01 ?? null,
        fa03: cell?.fa03 ?? null,
        fa04: cell?.fa04 ?? null,
        sa02: cell?.sa02 ?? null,
        total,
      };
    });
    return {
      enrollmentId: e.id,
      studentId: e.student.id,
      rollNo: e.rollNo,
      name: e.student.name,
      photoUrl: e.student.photoUrl,
      sheetStatus: sheet?.status ?? null,
      grand,
      grade: grandGrade(grand),
      attS1: attendancePct(sheet?.attendancePresentS1, sheet?.attendanceWorkS1),
      attS2: attendancePct(sheet?.attendancePresentS2, sheet?.attendanceWorkS2),
      partA,
      partB,
    };
  });

  const ranked = [...rows].sort((a, b) => (b.grand ?? -1) - (a.grand ?? -1));
  const rankById = new Map<string, number>();
  ranked.forEach((row, i) => {
    if (row.grand != null) rankById.set(row.enrollmentId, i + 1);
  });

  return {
    klass,
    school,
    status,
    canApprove,
    approved,
    subjectsA,
    subjectsB,
    rows: rows.map((row) => ({ ...row, rank: rankById.get(row.enrollmentId) ?? null })),
    charts: buildClassCharts(rows, subjectsA),
    exams: SINGLE_EXAMS.map((exam) => {
      const release = klass.examReleases.find((r) => r.exam === exam);
      return {
        exam: exam as SingleExam,
        status: release?.status ?? "DRAFT",
        rejectedReason: release?.rejectedReason ?? null,
      };
    }),
  };
}

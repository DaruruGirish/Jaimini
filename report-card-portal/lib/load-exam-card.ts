import { prisma } from "./prisma";
import { dash } from "./grades";
import { uniqueVerificationCode } from "./barcode";
import { EXAM_META, examGrade, isSingleExam, type SingleExam } from "./exams";
import type { CardSchool } from "./card";
import { getClassSubjects } from "./class-subjects";

export type ExamCardView = {
  school: CardSchool;
  title: string;
  examLabel: string;
  yearLabel: string;
  max: number;
  studentName: string;
  fatherName: string;
  motherName: string;
  className: string;
  section: string;
  rollNo: string;
  photoUrl: string;
  partA: { sl: number; subject: string; marks: string; grade: string }[];
  partB: { subject: string; marks: string; grade: string }[] | null;
  verificationCode: string | null;
};

export async function loadExamCardView(enrollmentId: string, exam: string): Promise<ExamCardView | null> {
  if (!isSingleExam(exam)) return null;
  const meta = EXAM_META[exam];
  const [enrollment, school] = await Promise.all([
    prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: true,
        class: true,
        year: true,
        examCards: { where: { exam } },
        markSheets: { include: { cells: true, partBCells: true } },
      },
    }),
    prisma.schoolSettings.findUnique({ where: { id: "singleton" } }),
  ]);
  if (!enrollment || !school) return null;
  const { a: subjectsA, b: subjectsB } = await getClassSubjects(enrollment.classId);
  const sheet = enrollment.markSheets.find((m) => m.yearId === enrollment.yearId);
  const cells = new Map((sheet?.cells ?? []).map((c) => [c.subjectId, c]));
  const partBCells = new Map((sheet?.partBCells ?? []).map((c) => [c.subjectId, c]));
  const partA = subjectsA.map((sub, i) => {
    const cell = cells.get(sub.id);
    const marks = cell?.[meta.partA] ?? null;
    return {
      sl: i + 1,
      subject: sub.name,
      marks: dash(marks),
      grade: dash(examGrade(exam, marks)),
    };
  });
  const partBRows = subjectsB.map((sub) => {
    const cell = partBCells.get(sub.id);
    const marks = cell?.[meta.partB] ?? null;
    return {
      subject: sub.name,
      marks: dash(marks),
      grade: dash(examGrade(exam, marks)),
      raw: marks,
    };
  });
  const showPartB = partBRows.some((row) => row.raw != null);

  return {
    school: {
      name: school.name,
      tagline: school.tagline,
      address: school.address,
      phone: school.phone,
      website: school.website,
      logoUrl: school.logoUrl,
      footerQuote: school.footerQuote,
    },
    title: meta.title,
    examLabel: meta.label,
    yearLabel: enrollment.year.label,
    max: meta.max,
    studentName: enrollment.student.name,
    fatherName: enrollment.student.fatherName,
    motherName: enrollment.student.motherName,
    className: enrollment.class.name,
    section: enrollment.class.section,
    rollNo: String(enrollment.rollNo),
    photoUrl: enrollment.student.photoUrl,
    partA,
    partB: showPartB ? partBRows.map(({ subject, marks, grade }) => ({ subject, marks, grade })) : null,
    verificationCode: enrollment.examCards[0]?.verificationCode ?? null,
  };
}

export async function issueExamCodes(opts: {
  classId: string;
  exam: SingleExam;
  yearLabel: string;
  className: string;
  section: string;
  schoolCode: string;
  enrollments: { id: string; rollNo: number }[];
}) {
  for (const enr of opts.enrollments) {
    const existing = await prisma.examCard.findUnique({
      where: { enrollmentId_exam: { enrollmentId: enr.id, exam: opts.exam } },
    });
    const code =
      existing?.verificationCode ??
      (await uniqueVerificationCode({
        schoolCode: opts.schoolCode,
        yearLabel: opts.yearLabel,
        className: opts.className,
        section: opts.section,
        rollNo: enr.rollNo,
        suffix: opts.exam,
      }));
    await prisma.examCard.upsert({
      where: { enrollmentId_exam: { enrollmentId: enr.id, exam: opts.exam } },
      create: { enrollmentId: enr.id, exam: opts.exam, verificationCode: code },
      update: { verificationCode: code },
    });
  }
}

export async function examIsPublished(classId: string, exam: string) {
  const release = await prisma.examRelease.findUnique({
    where: { classId_exam: { classId, exam } },
  });
  return release?.status === "APPROVED";
}

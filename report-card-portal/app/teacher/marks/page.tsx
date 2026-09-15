import { requireTeacher, teacherClass } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import MarksEditor from "./MarksEditor";
import ExamSubmitBar from "./ExamSubmitBar";
import { submitClass } from "@/lib/actions/teacher";
import { classMarksStatus } from "@/lib/status";
import { examIsLocked, lockedPartAKeys, SINGLE_EXAMS, type SingleExam } from "@/lib/exams";
import { classHasMarkCells, getClassSubjects } from "@/lib/class-subjects";

export default async function MarksPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string }>;
}) {
  const { student: studentId } = await searchParams;
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return <p>No class assigned.</p>;

  const [enrollments, subjects, examReleases, hasMarks] = await Promise.all([
    prisma.enrollment.findMany({
      where: { classId: klass.id },
      include: { student: true, markSheets: { include: { cells: true, partBCells: true } } },
      orderBy: { rollNo: "asc" },
    }),
    getClassSubjects(klass.id),
    prisma.examRelease.findMany({ where: { classId: klass.id } }),
    classHasMarkCells(klass.id),
  ]);
  const subjectsA = subjects.a;
  const subjectsB = subjects.b;

  const locked =
    enrollments.length > 0 &&
    enrollments.every((e) => e.markSheets.some((m) => m.yearId === klass.yearId && m.status === "APPROVED"));
  const rejectedReason = enrollments.flatMap((e) => e.markSheets).find((m) => m.status === "REJECTED")?.rejectedReason;
  const releaseByExam = Object.fromEntries(examReleases.map((r) => [r.exam, r]));
  const examStatuses = Object.fromEntries(SINGLE_EXAMS.map((exam) => [exam, releaseByExam[exam]?.status])) as Record<
    SingleExam,
    string | undefined
  >;
  const examReasons = Object.fromEntries(
    SINGLE_EXAMS.map((exam) => [exam, releaseByExam[exam]?.rejectedReason ?? undefined])
  ) as Record<SingleExam, string | undefined>;
  const lockedKeys = lockedPartAKeys(examReleases.filter((r) => examIsLocked(r.status)).map((r) => r.exam));

  const payload = enrollments.map((e) => {
    const sheet = e.markSheets.find((m) => m.yearId === klass.yearId);
    return {
      enrollmentId: e.id,
      rollNo: e.rollNo,
      name: e.student.name,
      photoUrl: e.student.photoUrl,
      remarks: sheet?.remarks ?? "",
      attendanceWorkS1: sheet?.attendanceWorkS1 ?? "",
      attendancePresentS1: sheet?.attendancePresentS1 ?? "",
      attendanceWorkS2: sheet?.attendanceWorkS2 ?? "",
      attendancePresentS2: sheet?.attendancePresentS2 ?? "",
      cells: Object.fromEntries((sheet?.cells ?? []).map((c) => [c.subjectId, c])),
      partB: Object.fromEntries((sheet?.partBCells ?? []).map((c) => [c.subjectId, c])),
      status: sheet?.status ?? "DRAFT",
    };
  });

  const statuses = payload.map((s) => s.status);
  const classStatus = classMarksStatus(statuses, enrollments.length);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-[#0C2A5A]">
        Marks · {klass.name}-{klass.section}
      </h2>
      <p className="text-sm text-slate-600">
        Pick a class exam (FA1, FA2, SA1…). Save a draft, then submit that exam only. The Principal must approve that exam
        before students can see it.
      </p>
      {rejectedReason ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Overall card — Principal comment: {rejectedReason}</p>
      ) : null}
      <ExamSubmitBar statuses={examStatuses} reasons={examReasons} />
      <MarksEditor
        subjectsA={subjectsA}
        subjectsB={subjectsB}
        orderedSubjects={subjects.all}
        students={payload}
        classLabel={`${klass.name}-${klass.section}`}
        initialStudentId={studentId}
        locked={locked}
        lockedKeys={lockedKeys}
        hasMarks={hasMarks}
      />
      {classStatus === "Approved" ? (
        <p className="text-sm text-emerald-700">
          The Principal has approved the overall year card. Print from{" "}
          <a className="underline" href="/teacher/print">
            Print desk
          </a>
          .
        </p>
      ) : classStatus === "Submitted" ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Overall year-card approval request sent. Waiting for the Principal. This does not publish FA/SA cards.
        </p>
      ) : (
        <form action={submitClass}>
          <button className="rounded-full bg-[#0C2A5A] px-5 py-2 text-white">Send overall year card for approval</button>
          <p className="mt-2 text-xs text-slate-500">
            Separate from FA1–SA2. Students see the full-year card only after the Principal approves OVERALL.
          </p>
        </form>
      )}
    </div>
  );
}

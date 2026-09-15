import Link from "next/link";
import { requireStudent, studentEnrollment } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { EXAM_META, SINGLE_EXAMS, examStatusLabel } from "@/lib/exams";

export default async function StudentMarksHub() {
  const user = await requireStudent();
  const ctx = await studentEnrollment(user.id);
  if (!ctx) return <p>No student record is linked to this login.</p>;
  const enrollment = ctx.enrollment;
  const sheet = enrollment?.markSheets.find((m) => m.yearId === enrollment.yearId);
  const overallPublished = sheet?.status === "APPROVED";
  const releases = enrollment
    ? await prisma.examRelease.findMany({ where: { classId: enrollment.classId } })
    : [];
  const byExam = Object.fromEntries(releases.map((r) => [r.exam, r]));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-[#0C2A5A]">Marks</h2>
        <p className="mt-1 text-sm text-slate-500">Open an exam only after the Principal has published that exam.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {SINGLE_EXAMS.map((exam) => {
          const published = byExam[exam]?.status === "APPROVED";
          return (
            <div key={exam} className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-lg font-semibold text-[#0C2A5A]">{EXAM_META[exam].label}</p>
              <p className="mt-1 text-sm text-slate-500">
                {published ? "Published" : "Not published"}
                {byExam[exam] && !published ? ` · ${examStatusLabel(byExam[exam]?.status)}` : ""}
              </p>
              {published && enrollment ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/student/exam/${exam}`}
                    className="rounded-full bg-[#0C2A5A] px-4 py-2 text-sm text-white"
                  >
                    View
                  </Link>
                  <a
                    href={`/print/exam/${enrollment.id}/${exam}`}
                    className="rounded-full border border-[#0C2A5A] px-4 py-2 text-sm text-[#0C2A5A]"
                  >
                    Download / Print
                  </a>
                </div>
              ) : (
                <p className="mt-4 text-sm text-amber-800">Not published</p>
              )}
            </div>
          );
        })}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-lg font-semibold text-[#0C2A5A]">Overall</p>
          <p className="mt-1 text-sm text-slate-500">Full-year card (both terms)</p>
          {overallPublished && sheet ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/student/exam/OVERALL" className="rounded-full bg-[#0C2A5A] px-4 py-2 text-sm text-white">
                View
              </Link>
              <a
                href={`/print/student/${sheet.id}`}
                className="rounded-full border border-[#0C2A5A] px-4 py-2 text-sm text-[#0C2A5A]"
              >
                Download / Print
              </a>
            </div>
          ) : (
            <p className="mt-4 text-sm text-amber-800">Not published</p>
          )}
        </div>
      </div>
    </div>
  );
}

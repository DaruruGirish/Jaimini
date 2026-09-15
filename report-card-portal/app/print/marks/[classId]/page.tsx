import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { loadClassDetail } from "@/lib/class-detail";
import ClassMarksBoard from "@/components/ClassMarksBoard";

export default async function PrintClassMarks({ params }: { params: Promise<{ classId: string }> }) {
  const session = await auth();
  if (!session?.user) notFound();
  const { classId } = await params;
  const data = await loadClassDetail(classId);
  if (!data) notFound();
  const { klass, school, subjectsA, subjectsB, rows } = data;
  if (session.user.role === "STUDENT") notFound();
  if (session.user.role === "CLASS_TEACHER" && klass.classTeacherId !== session.user.id) notFound();

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <style>{`@media print { @page { size: A4 landscape; margin: 10mm; } }`}</style>
      <div className="no-print">
        {session.user.role === "PRINCIPAL" ? (
          <Link href={`/principal/print/${klass.id}`} className="text-sm text-sky-800">
            ← Print
          </Link>
        ) : (
          <Link href="/teacher/print" className="text-sm text-sky-800">
            ← Print desk
          </Link>
        )}
        <h2 className="text-2xl font-semibold text-[#0C2A5A]">
          Print class marks · {klass.name}-{klass.section}
        </h2>
        <p className="text-sm text-slate-600">
          Choose Whole year, an exam, or Year total, then use Print / display as PDF.
        </p>
      </div>
      <ClassMarksBoard
        classId={klass.id}
        schoolName={school?.name ?? "JAIMINI PUBLIC SCHOOL"}
        classLabel={`${klass.name}-${klass.section}`}
        yearLabel={klass.year.label}
        teacherName={klass.classTeacher?.name ?? "Unassigned"}
        subjectsA={subjectsA}
        subjectsB={subjectsB}
        rows={rows}
      />
    </div>
  );
}

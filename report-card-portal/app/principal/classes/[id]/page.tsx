import Link from "next/link";
import { notFound } from "next/navigation";
import { statusBadgeClass } from "@/lib/status";
import { loadClassDetail } from "@/lib/class-detail";
import ApproveBar from "./ApproveBar";
import ClassMarksBoard from "@/components/ClassMarksBoard";

export default async function ClassDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await loadClassDetail(id);
  if (!data) notFound();
  const { klass, school, status, canApprove, approved, subjectsA, subjectsB, rows, exams } = data;

  return (
    <div className="space-y-6">
      <style>{`@media print { @page { size: A4 landscape; margin: 10mm; } }`}</style>
      <div className="no-print">
        <Link href="/principal/classes" className="text-sm text-sky-800">
          ← Classes
        </Link>
        <h2 className="text-2xl font-semibold text-[#0C2A5A]">
          View marks · Class {klass.name}-{klass.section}
        </h2>
        <p className="text-sm text-slate-600">
          Teacher: {klass.classTeacher?.name ?? "Unassigned"} · {klass.year.label} ·{" "}
          <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadgeClass(status)}`}>{status}</span>
        </p>
      </div>

      <div className="no-print">
        <ApproveBar
          classId={klass.id}
          canApprove={canApprove}
          approved={approved}
          studentCount={klass.enrollments.length}
          status={status}
          exams={exams}
        />
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

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTeacher, teacherClass } from "@/lib/guards";
import { statusBadgeClass } from "@/lib/status";
import { loadClassDetail } from "@/lib/class-detail";
import ClassAnalytics from "@/components/ClassAnalytics";

export default async function TeacherAnalyticsPage() {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return <p>No class assigned.</p>;
  const data = await loadClassDetail(klass.id);
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/teacher" className="text-sm text-sky-800">
          ← My class
        </Link>
        <h2 className="text-2xl font-semibold text-[#0C2A5A]">
          Analytics · Class {data.klass.name}-{data.klass.section} · {data.klass.year.label}
        </h2>
        <p className="text-sm text-slate-600">
          Same charts as the Principal sees for this class. Pass mark 40% (D and above).
        </p>
        <p className="text-sm text-slate-600">
          <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadgeClass(data.status)}`}>{data.status}</span>
        </p>
      </div>
      <ClassAnalytics year={data.charts.year} exams={data.charts.exams} />
    </div>
  );
}

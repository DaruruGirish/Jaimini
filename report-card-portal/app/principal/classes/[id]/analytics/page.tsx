import Link from "next/link";
import { notFound } from "next/navigation";
import { statusBadgeClass } from "@/lib/status";
import { loadClassDetail } from "@/lib/class-detail";
import ClassAnalytics from "@/components/ClassAnalytics";

export default async function ClassAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await loadClassDetail(id);
  if (!data) notFound();
  const { klass, status, charts } = data;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/principal/classes/${klass.id}`} className="text-sm text-sky-800">
          ← View marks · Class {klass.name}-{klass.section}
        </Link>
        <h2 className="text-2xl font-semibold text-[#0C2A5A]">
          Analytics · Class {klass.name}-{klass.section} · {klass.year.label}
        </h2>
        <p className="text-sm text-slate-600">
          Teacher: {klass.classTeacher?.name ?? "Unassigned"} ·{" "}
          <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadgeClass(status)}`}>{status}</span>
          {" · "}Pass mark 40% (D and above)
        </p>
      </div>
      <ClassAnalytics year={charts.year} exams={charts.exams} />
    </div>
  );
}

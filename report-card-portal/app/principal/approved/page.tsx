import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { classMarksStatus } from "@/lib/status";
import { getSelectedYear } from "@/lib/year";

export default async function ApprovedClassesPage() {
  const { selected } = await getSelectedYear();
  const classes = selected
    ? await prisma.schoolClass.findMany({
        where: { yearId: selected.id },
        include: {
          year: true,
          classTeacher: true,
          enrollments: { include: { markSheets: true } },
        },
        orderBy: [{ name: "asc" }, { section: "asc" }],
      })
    : [];

  const approved = classes.filter((klass) => {
    const statuses = klass.enrollments.flatMap((e) => e.markSheets.map((m) => m.status));
    return classMarksStatus(statuses, klass.enrollments.length) === "Approved";
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/principal" className="text-sm text-sky-800">
          ← Dashboard
        </Link>
        <h2 className="text-2xl font-semibold text-[#0C2A5A]">Approved classes</h2>
        <p className="text-sm text-slate-600">
          {selected ? `${selected.label} · ` : ""}
          {approved.length === 1 ? "1 class with approved marksheets" : `${approved.length} classes with approved marksheets`}
        </p>
      </div>

      {approved.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          No classes have been approved yet{selected ? ` in ${selected.label}` : ""}.
        </div>
      ) : (
        <div className="space-y-3">
          {approved.map((klass) => (
            <div key={klass.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm">
              <div>
                <p className="text-lg font-semibold text-[#0C2A5A]">
                  Class {klass.name}-{klass.section}
                </p>
                <p className="text-sm text-slate-600">
                  {klass.year.label} · {klass.classTeacher?.name ?? "Unassigned"} · {klass.enrollments.length} students
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-800">Approved</span>
                <Link
                  href={`/principal/classes/${klass.id}`}
                  className="rounded-full bg-[#0C2A5A] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#163E73]"
                >
                  View marks
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

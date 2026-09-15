import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { classMarksStatus, statusBadgeClass } from "@/lib/status";
import { getSelectedYear } from "@/lib/year";

export default async function PrincipalPrintDesk() {
  const { selected } = await getSelectedYear();
  if (!selected) {
    return <p className="text-slate-600">Look up an academic year on the dashboard first.</p>;
  }

  const classes = await prisma.schoolClass.findMany({
    where: { yearId: selected.id },
    include: {
      classTeacher: true,
      enrollments: { include: { markSheets: true } },
    },
    orderBy: [{ name: "asc" }, { section: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#0C2A5A]">Print</h2>
        <p className="text-sm text-slate-600">
          Academic year {selected.label}. Pick a class to print report cards or the class mark register.
        </p>
      </div>
      {classes.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm">No classes in this year.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => {
            const statuses = c.enrollments.flatMap((e) => e.markSheets.map((m) => m.status));
            const status = classMarksStatus(statuses, c.enrollments.length);
            const approvedCards = c.enrollments.filter((e) =>
              e.markSheets.some((m) => m.yearId === selected.id && m.status === "APPROVED")
            ).length;
            return (
              <Link
                key={c.id}
                href={`/principal/print/${c.id}`}
                className="rounded-xl bg-white p-5 shadow-sm transition hover:ring-2 hover:ring-sky-300"
              >
                <p className="text-lg font-semibold text-[#0C2A5A]">
                  Class {c.name}-{c.section}
                </p>
                <p className="mt-1 text-sm text-slate-600">{c.classTeacher?.name ?? "Unassigned"}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {c.enrollments.length} students · {approvedCards} report cards ready
                </p>
                <span className={`mt-3 inline-block rounded-full px-2 py-1 text-xs ${statusBadgeClass(status)}`}>{status}</span>
                <p className="mt-3 text-sm font-medium text-sky-800">Open print options →</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

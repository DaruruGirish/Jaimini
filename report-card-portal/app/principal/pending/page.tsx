import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { classMarksStatus, isPendingClass, statusBadgeClass } from "@/lib/status";
import { getSelectedYear } from "@/lib/year";
import { ApproveClassButton } from "@/app/principal/classes/[id]/ApproveBar";

export default async function PendingApprovalsPage() {
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

  const pending = classes
    .map((klass) => {
      const sheets = klass.enrollments
        .map((e) => e.markSheets.find((m) => m.yearId === klass.yearId))
        .filter((m): m is NonNullable<typeof m> => Boolean(m));
      const status = classMarksStatus(
        sheets.map((m) => m.status),
        klass.enrollments.length
      );
      const requestedAt = sheets
        .map((m) => m.submittedAt)
        .filter((d): d is Date => Boolean(d))
        .sort((a, b) => b.getTime() - a.getTime())[0];
      return { klass, status, requestedAt };
    })
    .filter((row) => isPendingClass(row.status));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/principal" className="text-sm text-sky-800">
          ← Dashboard
        </Link>
        <h2 className="text-2xl font-semibold text-[#0C2A5A]">Pending class approvals</h2>
        <p className="text-sm text-slate-600">
          {selected ? `${selected.label} · ` : ""}
          {pending.length === 1 ? "1 class waiting" : `${pending.length} classes waiting`}
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          No class is waiting for approval{selected ? ` in ${selected.label}` : ""}.
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map(({ klass, status, requestedAt }) => (
            <section key={klass.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm">
              <div>
                <h3 className="text-lg font-semibold text-[#0C2A5A]">
                  Class {klass.name}-{klass.section}
                </h3>
                <p className="text-sm text-slate-600">
                  {klass.year.label} · Teacher: {klass.classTeacher?.name ?? "Unassigned"} · {klass.enrollments.length}{" "}
                  students
                  {requestedAt
                    ? ` · Requested ${requestedAt.toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-1 text-xs ${statusBadgeClass(status)}`}>{status}</span>
                <ApproveClassButton classId={klass.id} />
                <Link
                  href={`/principal/classes/${klass.id}`}
                  className="rounded-full bg-[#0C2A5A] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#163E73]"
                >
                  View marks
                </Link>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { classMarksStatus, isPendingClass, statusBadgeClass } from "@/lib/status";
import { selectYear } from "@/lib/actions/principal";
import { getSelectedYear } from "@/lib/year";
import AcademicYearForm from "@/components/AcademicYearForm";
import YearLookup from "@/components/YearLookup";

export default async function PrincipalHome() {
  const { years, selected } = await getSelectedYear();
  const yearId = selected?.id;
  const classes = yearId
    ? await prisma.schoolClass.findMany({
        where: { yearId },
        include: { enrollments: { include: { markSheets: true } }, year: true, classTeacher: true },
        orderBy: [{ name: "asc" }, { section: "asc" }],
      })
    : [];

  const submittedClasses = classes.filter((c) => {
    const statuses = c.enrollments.flatMap((e) => e.markSheets.map((m) => m.status));
    return isPendingClass(classMarksStatus(statuses, c.enrollments.length));
  }).length;
  const approvedClasses = classes.filter((c) => {
    const statuses = c.enrollments.flatMap((e) => e.markSheets.map((m) => m.status));
    return classMarksStatus(statuses, c.enrollments.length) === "Approved";
  }).length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-[#0C2A5A]">Principal dashboard</h2>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="mb-1 font-semibold text-[#0C2A5A]">Look up an academic year</h3>
        <p className="mb-3 text-sm text-slate-600">
          Enter From and To, for example 2022 to 2023, to open that year’s classes, marks, teachers and report cards.
        </p>
        <YearLookup />
        {years.length ? (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Saved years</p>
            <div className="flex flex-wrap gap-2">
              {years.map((y) => (
                <form action={selectYear} key={y.id}>
                  <input type="hidden" name="yearId" value={y.id} />
                  <button
                    className={`rounded-full px-3 py-1.5 text-sm ${
                      y.id === selected?.id ? "bg-[#0C2A5A] text-white" : "bg-sky-50 text-[#0C2A5A] hover:bg-sky-100"
                    }`}
                  >
                    {y.label}
                    {y.isActive ? " · current" : ""}
                  </button>
                </form>
              ))}
            </div>
          </div>
        ) : null}
        <details className="mt-4 border-t pt-3">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">Add a new academic year</summary>
          <p className="mb-2 mt-2 text-sm text-slate-600">Use this only when that year is not already in the list.</p>
          <AcademicYearForm />
        </details>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Viewing year</p>
          <p className="text-3xl font-bold text-[#0C2A5A]">{selected?.label ?? "—"}</p>
        </div>
        <Link href="/principal/analytics" className="rounded-xl bg-white p-5 shadow-sm transition hover:ring-2 hover:ring-sky-300">
          <p className="text-sm text-slate-500">Class analytics</p>
          <p className="text-3xl font-bold text-[#0C2A5A]">{classes.length}</p>
          <p className="mt-2 text-xs text-sky-800">Pick a class to view charts →</p>
        </Link>
        <Link href="/principal/pending" className="rounded-xl bg-white p-5 shadow-sm transition hover:ring-2 hover:ring-amber-300">
          <p className="text-sm text-slate-500">Pending class approvals</p>
          <p className="text-3xl font-bold text-amber-600">{submittedClasses}</p>
          <p className="mt-2 text-xs text-amber-800">Approve an entire class at once →</p>
        </Link>
        <Link href="/principal/approved" className="rounded-xl bg-white p-5 shadow-sm transition hover:ring-2 hover:ring-emerald-300">
          <p className="text-sm text-slate-500">Approved classes</p>
          <p className="text-3xl font-bold text-emerald-700">{approvedClasses}</p>
          <p className="mt-2 text-xs text-emerald-800">View approved classes →</p>
        </Link>
      </div>

      <section className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold text-[#0C2A5A]">Classes in {selected?.label ?? "this year"}</h3>
          <Link href="/principal/classes" className="text-sm text-sky-800">
            Manage classes →
          </Link>
        </div>
        {!selected ? (
          <p className="p-4 text-sm text-slate-500">Look up or add an academic year first.</p>
        ) : classes.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No classes recorded for {selected.label}.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">Class</th>
                <th className="p-3">Teacher</th>
                <th className="p-3">Students</th>
                <th className="p-3">Marks status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => {
                const statuses = c.enrollments.flatMap((e) => e.markSheets.map((m) => m.status));
                const status = classMarksStatus(statuses, c.enrollments.length);
                return (
                  <tr key={c.id} className="border-t">
                    <td className="p-3 font-semibold text-[#0C2A5A]">
                      {c.name}-{c.section}
                    </td>
                    <td className="p-3">{c.classTeacher?.name ?? "Unassigned"}</td>
                    <td className="p-3">{c.enrollments.length}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${statusBadgeClass(status)}`}>{status}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/principal/classes/${c.id}`} className="rounded-full bg-[#0C2A5A] px-3 py-1 text-xs text-white">
                          View marks
                        </Link>
                        <Link href={`/principal/classes/${c.id}/analytics`} className="rounded-full bg-sky-700 px-3 py-1 text-xs text-white">
                          Analytics
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { classMarksStatus, statusBadgeClass } from "@/lib/status";
import { createClass } from "@/lib/actions/principal";
import { getSelectedYear } from "@/lib/year";
import AssignTeacher from "@/components/AssignTeacher";

export default async function ClassesPage() {
  const { selected } = await getSelectedYear();
  if (!selected) {
    return <p className="text-slate-600">Add an academic year on the dashboard first.</p>;
  }

  const [classes, teachers] = await Promise.all([
    prisma.schoolClass.findMany({
      where: { yearId: selected.id },
      include: {
        year: true,
        classTeacher: true,
        enrollments: { include: { markSheets: true } },
      },
      orderBy: [{ name: "asc" }, { section: "asc" }],
    }),
    prisma.user.findMany({ where: { role: "CLASS_TEACHER" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#0C2A5A]">Classes</h2>
        <p className="text-sm text-slate-600">Academic year {selected.label}</p>
      </div>
      <form action={createClass} className="flex flex-wrap gap-2 rounded-xl bg-white p-4 shadow-sm">
        <input type="hidden" name="yearId" value={selected.id} />
        <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">{selected.label}</span>
        <input name="name" placeholder="Class e.g. 12" className="rounded-lg border px-3 py-2" required />
        <input name="section" placeholder="Section e.g. A" className="w-24 rounded-lg border px-3 py-2" required />
        <button className="rounded-lg bg-[#0C2A5A] px-4 py-2 text-white">Create class</button>
      </form>
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3">Class</th>
              <th className="p-3">Class teacher</th>
              <th className="p-3">Students</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {classes.length === 0 ? (
              <tr>
                <td className="p-4 text-slate-500" colSpan={5}>
                  No classes for {selected.label} yet.
                </td>
              </tr>
            ) : (
              classes.map((c) => {
                const statuses = c.enrollments.flatMap((e) => e.markSheets.map((m) => m.status));
                const status = classMarksStatus(statuses, c.enrollments.length);
                return (
                  <tr key={c.id} className="border-t">
                    <td className="p-3 font-semibold text-[#0C2A5A]">
                      {c.name}-{c.section}
                    </td>
                    <td className="p-3">
                      <AssignTeacher
                        classId={c.id}
                        teacherId={c.classTeacherId ?? ""}
                        teacherName={c.classTeacher?.name ?? "Unassigned"}
                        teachers={teachers}
                      />
                    </td>
                    <td className="p-3">{c.enrollments.length}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${statusBadgeClass(status)}`}>{status}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/principal/classes/${c.id}`}
                          className="inline-block rounded-full bg-[#0C2A5A] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#163E73]"
                        >
                          View marks
                        </Link>
                        <Link
                          href={`/principal/classes/${c.id}/analytics`}
                          className="inline-block rounded-full bg-sky-700 px-4 py-1.5 text-xs font-semibold text-white"
                        >
                          Analytics
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

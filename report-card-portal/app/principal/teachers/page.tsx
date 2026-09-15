import { prisma } from "@/lib/prisma";
import { createTeacher } from "@/lib/actions/principal";
import { classMarksStatus } from "@/lib/status";
import { getSelectedYear } from "@/lib/year";
import TeacherExcel from "./TeacherExcel";

export default async function TeachersPage() {
  const { selected } = await getSelectedYear();
  const teachers = await prisma.user.findMany({
    where: { role: "CLASS_TEACHER" },
    include: {
      classes: {
        where: selected ? { yearId: selected.id } : undefined,
        include: { enrollments: { include: { markSheets: true } }, year: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#0C2A5A]">Class teachers</h2>
        <p className="text-sm text-slate-600">
          {selected ? `Assignments for ${selected.label}.` : "Add an academic year first."} Upload an Excel of class teachers (Name, Email, Password). They sign in with that email and password. Then assign each teacher to a class.
        </p>
      </div>
      <TeacherExcel />
      <form action={createTeacher} className="grid gap-2 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-4">
        <input name="name" placeholder="Name" className="rounded-lg border px-3 py-2" required />
        <input name="email" type="email" placeholder="Email" className="rounded-lg border px-3 py-2" required />
        <input name="password" placeholder="Temp password" className="rounded-lg border px-3 py-2" required />
        <button className="rounded-lg bg-[#0C2A5A] px-4 py-2 text-white">Add one teacher</button>
      </form>
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Class this year</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => {
              const c = t.classes[0];
              const statuses = c?.enrollments.flatMap((e) => e.markSheets.map((m) => m.status)) ?? [];
              return (
                <tr key={t.id} className="border-t">
                  <td className="p-3">{t.name}</td>
                  <td className="p-3">{t.email}</td>
                  <td className="p-3">{c ? <span className="font-semibold text-[#0C2A5A]">{c.name}-{c.section}</span> : "Unassigned this year"}</td>
                  <td className="p-3">{c ? classMarksStatus(statuses, c.enrollments.length) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

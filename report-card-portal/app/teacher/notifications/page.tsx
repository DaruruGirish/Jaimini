import { requireTeacher, teacherClass } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { markGrievanceRead } from "@/lib/actions/teacher";

export default async function TeacherNotificationsPage() {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return <p>No class assigned.</p>;
  const rows = await prisma.grievance.findMany({
    where: { classId: klass.id },
    include: { student: { include: { enrollments: { where: { classId: klass.id } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-[#0C2A5A]">Notifications</h2>
        <p className="text-sm text-slate-600">
          Grievances from your class only. Call the parent mobile — there is no in-app chat.
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Student</th>
              <th className="p-3">Roll</th>
              <th className="p-3">Parent mobile</th>
              <th className="p-3">Subject</th>
              <th className="p-3">Message</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="p-4 text-slate-500" colSpan={7}>
                  No grievances yet.
                </td>
              </tr>
            ) : (
              rows.map((g) => {
                const roll = g.student.enrollments[0]?.rollNo ?? "—";
                return (
                  <tr key={g.id} className={`border-t align-top ${g.status === "SENT" ? "bg-amber-50" : ""}`}>
                    <td className="p-3 whitespace-nowrap">{g.createdAt.toLocaleString("en-IN")}</td>
                    <td className="p-3">{g.student.name}</td>
                    <td className="p-3">{roll}</td>
                    <td className="p-3">
                      <a href={`tel:${g.student.parentMobile}`} className="text-lg font-semibold text-[#0C2A5A]">
                        {g.student.parentMobile}
                      </a>
                    </td>
                    <td className="p-3">{g.subject}</td>
                    <td className="p-3 whitespace-pre-wrap">{g.message}</td>
                    <td className="p-3">
                      {g.status === "READ" ? (
                        "Read"
                      ) : (
                        <form action={markGrievanceRead}>
                          <input type="hidden" name="id" value={g.id} />
                          <button className="rounded-full bg-sky-700 px-3 py-1 text-xs text-white">Mark as Read</button>
                        </form>
                      )}
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

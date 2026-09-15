import Link from "next/link";
import { requireTeacher, teacherClass } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { classMarksStatus, statusBadgeClass } from "@/lib/status";

export default async function TeacherHome() {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) {
    return <p>No class assigned yet. Ask the Principal to map you to a class.</p>;
  }
  const enrollments = await prisma.enrollment.findMany({
    where: { classId: klass.id },
    include: { student: true, markSheets: true },
    orderBy: { rollNo: "asc" },
  });
  const statuses = enrollments.flatMap((e) => e.markSheets.map((m) => m.status));
  const status = classMarksStatus(statuses, enrollments.length);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#0C2A5A]">
          Class {klass.name}-{klass.section}
        </h2>
        <p className="text-sm text-slate-600">
          {klass.year.label} · <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadgeClass(status)}`}>{status}</span>
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/teacher/analytics" className="rounded-full bg-sky-700 px-4 py-2 text-sm text-white">
          Class analytics
        </Link>
        <Link href="/teacher/appointments" className="rounded-full border border-[#0C2A5A] px-4 py-2 text-sm text-[#0C2A5A]">
          Appointments
        </Link>
      </div>
      {status === "Draft" || status === "Rejected" || status === "Not started" ? (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
          When every student’s marks are saved, send <strong>one approval request for the entire class</strong> from{" "}
          <Link href="/teacher/marks" className="underline">
            Enter marks
          </Link>
          . The Principal then approves the class at once.
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3">Roll</th>
              <th className="p-3">Name</th>
              <th className="p-3">Sheet</th>
              <th className="p-3">Edit</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => {
              const sheet = e.markSheets.find((m) => m.yearId === klass.yearId);
              return (
                <tr key={e.id} className="border-t">
                  <td className="p-3">{e.rollNo}</td>
                  <td className="p-3">{e.student.name}</td>
                  <td className="p-3">{sheet?.status ?? "Not started"}</td>
                  <td className="p-3">
                    <Link
                      href={`/teacher/marks?student=${e.id}`}
                      className="rounded-full bg-sky-700 px-3 py-1 text-xs text-white"
                    >
                      Edit marks
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

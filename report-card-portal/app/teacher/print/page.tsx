import Link from "next/link";
import { requireTeacher, teacherClass } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { classMarksStatus, statusBadgeClass } from "@/lib/status";

export default async function TeacherPrintDesk() {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return <p>No class assigned.</p>;

  const [enrollments, examReleases] = await Promise.all([
    prisma.enrollment.findMany({
      where: { classId: klass.id },
      include: { student: true, markSheets: true },
      orderBy: { rollNo: "asc" },
    }),
    prisma.examRelease.findMany({ where: { classId: klass.id } }),
  ]);
  const statuses = enrollments.flatMap((e) => e.markSheets.map((m) => m.status));
  const status = classMarksStatus(statuses, enrollments.length);
  const approvedSheets = enrollments.map((e) => ({
    e,
    sheet: e.markSheets.find((m) => m.yearId === klass.yearId && m.status === "APPROVED"),
  }));
  const ready = approvedSheets.filter((row) => row.sheet);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#0C2A5A]">Print desk</h2>
        <p className="text-sm text-slate-600">
          Class {klass.name}-{klass.section} · {klass.year.label} ·{" "}
          <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadgeClass(status)}`}>{status}</span>
        </p>
      </div>

      {status !== "Approved" ? (
        <div className="rounded-xl bg-amber-50 p-5 text-sm text-amber-900 shadow-sm">
          Overall year cards unlock after the Principal approves this class once. Enter marks, then use{" "}
          <strong>Send overall year card for approval</strong>.
        </div>
      ) : (
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-[#0C2A5A]">Print all overall report cards</h3>
          <p className="mt-2 max-w-xl text-sm text-slate-600">
            Opens every student on A4. Use the school printer, or Save as PDF and take that file to the photocopy shop.
            Cards print one student per page, ready to sign and issue.
          </p>
          <a
            href={`/print/class/${klass.id}`}
            className="mt-4 inline-block rounded-full bg-[#0C2A5A] px-5 py-2 text-white"
          >
            Open class print pack ({ready.length} cards)
          </a>
        </section>
      )}

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-[#0C2A5A]">Print one exam</h3>
        <p className="mt-2 text-sm text-slate-600">
          FA/SA cards print only after the Principal approves that exam. Approving FA1 does not unlock FA2.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {examReleases.filter((r) => r.status === "APPROVED").length === 0 ? (
            <p className="text-sm text-amber-800">No exam cards are published yet.</p>
          ) : (
            examReleases
              .filter((r) => r.status === "APPROVED")
              .map((r) => (
                <a
                  key={r.exam}
                  href={`/print/class-exam/${klass.id}/${r.exam}`}
                  className="rounded-full bg-sky-700 px-4 py-2 text-sm text-white"
                >
                  Print {r.exam} cards
                </a>
              ))
          )}
        </div>
      </section>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3">Roll</th>
              <th className="p-3">Student</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
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
                    {sheet?.status === "APPROVED" ? (
                      <a
                        href={`/print/student/${sheet.id}`}
                        className="inline-block rounded-full bg-[#0C2A5A] px-4 py-1.5 text-xs font-semibold text-white"
                      >
                        Print this card
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Locked until class approval</span>
                    )}
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

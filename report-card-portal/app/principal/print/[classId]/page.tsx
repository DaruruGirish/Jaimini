import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { classMarksStatus, statusBadgeClass } from "@/lib/status";

export default async function PrincipalPrintClass({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const klass = await prisma.schoolClass.findUnique({
    where: { id: classId },
    include: {
      year: true,
      classTeacher: true,
      enrollments: {
        include: { student: true, markSheets: true },
        orderBy: { rollNo: "asc" },
      },
      examReleases: true,
    },
  });
  if (!klass) notFound();

  const statuses = klass.enrollments.flatMap((e) => e.markSheets.map((m) => m.status));
  const status = classMarksStatus(statuses, klass.enrollments.length);
  const students = klass.enrollments.map((e) => ({
    e,
    sheet: e.markSheets.find((m) => m.yearId === klass.yearId),
  }));
  const ready = students.filter((row) => row.sheet?.status === "APPROVED");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/principal/print" className="text-sm text-sky-800">
          ← Print
        </Link>
        <h2 className="text-2xl font-semibold text-[#0C2A5A]">
          Print · Class {klass.name}-{klass.section}
        </h2>
        <p className="text-sm text-slate-600">
          {klass.year.label} · Teacher: {klass.classTeacher?.name ?? "Unassigned"} ·{" "}
          <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadgeClass(status)}`}>{status}</span>
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-[#0C2A5A]">Print all report cards</h3>
          <p className="mt-2 text-sm text-slate-600">
            One A4 report card per student. Use the school printer, or Save as PDF.
          </p>
          {ready.length ? (
            <a
              href={`/print/class/${klass.id}`}
              className="mt-4 inline-block rounded-full bg-[#0C2A5A] px-5 py-2 text-white"
            >
              Print all report cards ({ready.length})
            </a>
          ) : (
            <p className="mt-4 text-sm text-amber-800">Report cards unlock after this class is approved.</p>
          )}
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-[#0C2A5A]">Print class marks</h3>
          <p className="mt-2 text-sm text-slate-600">
            Full mark register for the class: every student, subject, FA/SA and combined totals. Choose Whole year, FA-I,
            SA-I and so on, then print.
          </p>
          <a
            href={`/print/marks/${klass.id}`}
            className="mt-4 inline-block rounded-full bg-sky-700 px-5 py-2 text-white"
          >
            Print class marks
          </a>
        </section>
      </div>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-[#0C2A5A]">Print one exam</h3>
        <p className="mt-2 text-sm text-slate-600">Published FA/SA cards only. Approving FA1 does not unlock FA2 or Overall.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {klass.examReleases.filter((r) => r.status === "APPROVED").length === 0 ? (
            <p className="text-sm text-amber-800">No exam cards are published for this class yet.</p>
          ) : (
            klass.examReleases
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

      <section className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <h3 className="font-semibold text-[#0C2A5A]">Print one student report card</h3>
          <p className="text-sm text-slate-600">Open a single card when you need only that student.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">Roll</th>
                <th className="p-3">Student</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={4}>
                    No students in this class.
                  </td>
                </tr>
              ) : (
                students.map(({ e, sheet }) => (
                  <tr key={e.id} className="border-t">
                    <td className="p-3">{e.rollNo}</td>
                    <td className="p-3">{e.student.name}</td>
                    <td className="p-3">{sheet?.status ?? "No marks"}</td>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

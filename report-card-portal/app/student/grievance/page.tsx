import { requireStudent, studentEnrollment } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import GrievanceForm from "@/components/GrievanceForm";

export default async function StudentGrievancePage() {
  const user = await requireStudent();
  const ctx = await studentEnrollment(user.id);
  const list = ctx
    ? await prisma.grievance.findMany({
        where: { studentId: ctx.student.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#0C2A5A]">Grievance</h2>
        <p className="text-sm text-slate-600">You can only see your own submissions. Status is Sent or Read.</p>
      </div>
      <GrievanceForm />
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Subject</th>
              <th className="p-3">Message</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td className="p-4 text-slate-500" colSpan={4}>
                  No grievances yet.
                </td>
              </tr>
            ) : (
              list.map((g) => (
                <tr key={g.id} className="border-t align-top">
                  <td className="p-3 whitespace-nowrap">{g.createdAt.toLocaleString("en-IN")}</td>
                  <td className="p-3 font-medium">{g.subject}</td>
                  <td className="p-3 whitespace-pre-wrap">{g.message}</td>
                  <td className="p-3">{g.status === "READ" ? "Read" : "Sent"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

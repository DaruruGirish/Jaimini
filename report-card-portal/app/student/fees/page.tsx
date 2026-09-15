import { requireStudent, studentEnrollment } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { feeBalance, feeStatus, formatDueDate, formatRupees } from "@/lib/fees";

export default async function StudentFeesPage() {
  const user = await requireStudent();
  const ctx = await studentEnrollment(user.id);
  if (!ctx?.enrollment) return <p>No class is linked to this login.</p>;
  const rows = await prisma.feeItem.findMany({
    where: { enrollmentId: ctx.enrollment.id },
    orderBy: [{ sortOrder: "asc" }, { particular: "asc" }],
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-[#0C2A5A]">Fee Details</h2>
        <p className="text-sm text-slate-600">Recorded by the school office. This page does not take payments.</p>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-xl bg-white p-5 text-sm text-slate-600 shadow-sm">No fee record yet</p>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3">Particular</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Paid</th>
                <th className="p-3">Balance</th>
                <th className="p-3">Status</th>
                <th className="p-3">Due date</th>
                <th className="p-3">Note</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const status = feeStatus(row.amount, row.paid);
                return (
                  <tr key={row.id} className="border-t">
                    <td className="p-3 font-medium">{row.particular}</td>
                    <td className="p-3">{formatRupees(row.amount)}</td>
                    <td className="p-3">{formatRupees(row.paid)}</td>
                    <td className="p-3">{formatRupees(feeBalance(row.amount, row.paid))}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          status === "Paid" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">{formatDueDate(row.dueDate)}</td>
                    <td className="p-3 text-slate-600">{row.note || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

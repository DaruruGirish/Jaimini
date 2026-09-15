import { deleteAppointment } from "@/lib/actions/appointments";

export type AppointmentRow = {
  id: string;
  title: string;
  body: string;
  location: string;
  startsAt: Date;
  audience: "STUDENT" | "TEACHER";
  authorName: string;
  studentName: string | null;
  teacherName: string | null;
  classLabel: string | null;
  canDelete?: boolean;
};

function formatWhen(d: Date) {
  return d.toLocaleString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AppointmentList({ rows, emptyText }: { rows: AppointmentRow[]; emptyText: string }) {
  if (!rows.length) {
    return <p className="rounded-xl bg-white p-5 text-sm text-slate-600 shadow-sm">{emptyText}</p>;
  }
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <article key={row.id} className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-[#0C2A5A]">{row.title}</h3>
              <p className="text-sm text-slate-600">{formatWhen(row.startsAt)}</p>
            </div>
            {row.canDelete ? (
              <form action={deleteAppointment}>
                <input type="hidden" name="id" value={row.id} />
                <button className="text-xs text-red-700">Cancel</button>
              </form>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-slate-700">
            {row.audience === "TEACHER"
              ? row.teacherName
                ? `Teacher: ${row.teacherName}`
                : "All class teachers"
              : row.studentName
                ? `Student: ${row.studentName}${row.classLabel ? ` · ${row.classLabel}` : ""}`
                : row.classLabel
                  ? `All students · ${row.classLabel}`
                  : "Students"}
          </p>
          {row.location ? <p className="text-sm text-slate-600">Place: {row.location}</p> : null}
          {row.body ? <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{row.body}</p> : null}
          <p className="mt-2 text-xs text-slate-500">Set by {row.authorName}</p>
        </article>
      ))}
    </div>
  );
}

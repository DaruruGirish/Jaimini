"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignTeacher } from "@/lib/actions/principal";

export default function AssignTeacher({
  classId,
  teacherId,
  teacherName,
  teachers,
}: {
  classId: string;
  teacherId: string;
  teacherName: string;
  teachers: { id: string; name: string }[];
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const assigned = Boolean(teacherId);

  return (
    <div className="space-y-1.5">
      <p className={`text-sm font-semibold ${assigned ? "text-[#0C2A5A]" : "text-amber-700"}`}>
        {assigned ? teacherName : "No teacher assigned"}
      </p>
      <form
        className="flex flex-wrap items-center gap-1"
        action={(fd) =>
          start(async () => {
            await assignTeacher(fd);
            router.refresh();
          })
        }
      >
        <input type="hidden" name="classId" value={classId} />
        <select
          name="classTeacherId"
          defaultValue={teacherId}
          key={teacherId || "none"}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
        >
          <option value="">Unassigned</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <button disabled={pending} className="rounded-lg bg-sky-700 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50">
          {pending ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}

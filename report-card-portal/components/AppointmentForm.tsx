"use client";

import { useActionState, useMemo, useState } from "react";

type StudentOpt = { id: string; name: string; rollNo: number };
type ClassOpt = { id: string; label: string; students: StudentOpt[] };
type TeacherOpt = { id: string; name: string };

const empty = null as { error?: string; ok?: boolean } | null;

export function StudentAppointmentForm({
  action,
  classes,
  fixedClassId,
}: {
  action: (prev: { error?: string; ok?: boolean } | null, formData: FormData) => Promise<{ error?: string; ok?: boolean }>;
  classes: ClassOpt[];
  fixedClassId?: string;
}) {
  const [state, formAction, pending] = useActionState(action, empty);
  const [classId, setClassId] = useState(fixedClassId ?? classes[0]?.id ?? "");
  const students = useMemo(() => classes.find((c) => c.id === classId)?.students ?? [], [classes, classId]);

  return (
    <form action={formAction} className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
      {fixedClassId ? <input type="hidden" name="classId" value={fixedClassId} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {fixedClassId ? null : (
          <label className="text-sm">
            Class
            <select
              name="classId"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="mt-1 block w-full rounded-lg border px-3 py-2"
              required
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="text-sm">
          Student
          <select name="studentId" className="mt-1 block w-full rounded-lg border px-3 py-2">
            <option value="">All students in this class</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.rollNo}. {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          Title
          <input name="title" required className="mt-1 block w-full rounded-lg border px-3 py-2" placeholder="e.g. Parent meeting" />
        </label>
        <label className="text-sm">
          Date and time
          <input name="startsAt" type="datetime-local" required className="mt-1 block w-full rounded-lg border px-3 py-2" />
        </label>
        <label className="text-sm">
          Place
          <input name="location" className="mt-1 block w-full rounded-lg border px-3 py-2" placeholder="e.g. Principal office" />
        </label>
        <label className="text-sm sm:col-span-2">
          Note
          <textarea name="body" rows={3} className="mt-1 block w-full rounded-lg border px-3 py-2" placeholder="Optional" />
        </label>
      </div>
      <button disabled={pending} className="rounded-lg bg-[#0C2A5A] px-4 py-2 text-white disabled:opacity-50">
        {pending ? "Saving…" : "Save appointment"}
      </button>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm text-emerald-700">Saved.</p> : null}
    </form>
  );
}

export function TeacherAppointmentForm({
  action,
  teachers,
}: {
  action: (prev: { error?: string; ok?: boolean } | null, formData: FormData) => Promise<{ error?: string; ok?: boolean }>;
  teachers: TeacherOpt[];
}) {
  const [state, formAction, pending] = useActionState(action, empty);
  return (
    <form action={formAction} className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm sm:col-span-2">
          Teacher
          <select name="teacherId" className="mt-1 block w-full rounded-lg border px-3 py-2">
            <option value="">All class teachers</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          Title
          <input name="title" required className="mt-1 block w-full rounded-lg border px-3 py-2" placeholder="e.g. Staff meeting" />
        </label>
        <label className="text-sm">
          Date and time
          <input name="startsAt" type="datetime-local" required className="mt-1 block w-full rounded-lg border px-3 py-2" />
        </label>
        <label className="text-sm">
          Place
          <input name="location" className="mt-1 block w-full rounded-lg border px-3 py-2" placeholder="e.g. Staff room" />
        </label>
        <label className="text-sm sm:col-span-2">
          Note
          <textarea name="body" rows={3} className="mt-1 block w-full rounded-lg border px-3 py-2" placeholder="Optional" />
        </label>
      </div>
      <button disabled={pending} className="rounded-lg bg-[#0C2A5A] px-4 py-2 text-white disabled:opacity-50">
        {pending ? "Saving…" : "Save appointment"}
      </button>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm text-emerald-700">Saved.</p> : null}
    </form>
  );
}

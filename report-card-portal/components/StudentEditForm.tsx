"use client";

import { useActionState } from "react";

type Action = (
  prev: { error?: string; ok?: boolean } | null,
  formData: FormData
) => Promise<{ error?: string; ok?: boolean }>;

export default function StudentEditForm({
  action,
  student,
}: {
  action: Action;
  student: {
    id: string;
    name: string;
    fatherName: string;
    motherName: string;
    parentMobile: string;
    username: string;
    klass: string;
    rollNo: number;
  };
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="grid gap-2 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-6">
      <input type="hidden" name="studentId" value={student.id} />
      <p className="sm:col-span-6 text-sm text-slate-600">
        Class {student.klass} · Roll {student.rollNo} · Username <strong>{student.username}</strong>
      </p>
      <input name="name" defaultValue={student.name} required className="rounded-lg border px-3 py-2 sm:col-span-2" />
      <input name="fatherName" defaultValue={student.fatherName} placeholder="Father" className="rounded-lg border px-3 py-2" />
      <input name="motherName" defaultValue={student.motherName} placeholder="Mother" className="rounded-lg border px-3 py-2" />
      <input
        name="parentMobile"
        defaultValue={student.parentMobile}
        required
        placeholder="Parent mobile"
        className="rounded-lg border px-3 py-2"
      />
      <button disabled={pending} className="rounded-lg bg-[#0C2A5A] px-3 py-2 text-white disabled:opacity-50">
        {pending ? "Saving…" : "Save"}
      </button>
      {state?.error ? <p className="sm:col-span-6 text-sm text-red-600">{state.error}</p> : null}
      {state?.ok ? <p className="sm:col-span-6 text-sm text-emerald-700">Saved.</p> : null}
    </form>
  );
}

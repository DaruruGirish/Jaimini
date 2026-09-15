"use client";

import { useActionState } from "react";
import type { Subject } from "@prisma/client";
import { addSubject, deleteSubject, moveSubject, renameSubject, setSubjectActive, setSubjectPart } from "@/lib/actions/subjects";

export default function SubjectManager({
  subjects,
  hasMarks,
}: {
  subjects: (Subject & { hasMarks: boolean })[];
  hasMarks: boolean;
}) {
  const [state, formAction, pending] = useActionState(addSubject, null);
  return (
    <div className="space-y-6">
      {hasMarks ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Marks already exist. A new subject order applies to the next Excel template and to cards. Existing marks stay
          keyed by subject, not by column letter.
        </p>
      ) : null}

      <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-5 shadow-sm">
        <label className="text-sm">
          Subject name
          <input name="name" required className="mt-1 block rounded-lg border px-3 py-2" placeholder="e.g. Kannada" />
        </label>
        <label className="text-sm">
          Type
          <select name="part" className="mt-1 block rounded-lg border px-3 py-2">
            <option value="A">Part A — scholastic</option>
            <option value="B">Part B — co-scholastic</option>
          </select>
        </label>
        <button disabled={pending} className="rounded-lg bg-[#0C2A5A] px-4 py-2 text-white disabled:opacity-50">
          {pending ? "Adding…" : "Add subject"}
        </button>
        {state?.error ? <p className="w-full text-sm text-red-600">{state.error}</p> : null}
      </form>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Name</th>
              <th className="p-3">Type</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subjects.length === 0 ? (
              <tr>
                <td className="p-4 text-slate-500" colSpan={5}>
                  No subjects yet. Add a Part A subject to replace the defaults.
                </td>
              </tr>
            ) : (
              subjects.map((s, i) => (
                <tr key={s.id} className={`border-t ${s.active ? "" : "bg-slate-50 text-slate-500"}`}>
                  <td className="p-3 whitespace-nowrap">
                    <form action={moveSubject} className="inline">
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="dir" value="up" />
                      <button disabled={i === 0} className="rounded border px-2 py-0.5 text-xs disabled:opacity-30">
                        Up
                      </button>
                    </form>{" "}
                    <form action={moveSubject} className="inline">
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="dir" value="down" />
                      <button
                        disabled={i === subjects.length - 1}
                        className="rounded border px-2 py-0.5 text-xs disabled:opacity-30"
                      >
                        Down
                      </button>
                    </form>
                  </td>
                  <td className="p-3">
                    <form action={renameSubject} className="flex gap-2">
                      <input type="hidden" name="id" value={s.id} />
                      <input name="name" defaultValue={s.name} className="min-w-40 flex-1 rounded border px-2 py-1" />
                      <button className="text-xs text-sky-800">Rename</button>
                    </form>
                  </td>
                  <td className="p-3">
                    <form action={setSubjectPart}>
                      <input type="hidden" name="id" value={s.id} />
                      <select
                        name="part"
                        defaultValue={s.part}
                        onChange={(e) => e.currentTarget.form?.requestSubmit()}
                        className="rounded border px-2 py-1"
                      >
                        <option value="A">Part A</option>
                        <option value="B">Part B</option>
                      </select>
                    </form>
                  </td>
                  <td className="p-3">{s.active ? "Active" : "Inactive"}</td>
                  <td className="p-3 whitespace-nowrap">
                    <form action={setSubjectActive} className="inline">
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="active" value={s.active ? "0" : "1"} />
                      <button className="text-xs text-sky-800">{s.active ? "Deactivate" : "Reactivate"}</button>
                    </form>
                    {s.hasMarks ? (
                      <span className="ml-2 text-xs text-slate-400">Has marks — cannot delete</span>
                    ) : (
                      <form action={deleteSubject} className="ml-2 inline">
                        <input type="hidden" name="id" value={s.id} />
                        <button className="text-xs text-red-700">Delete</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

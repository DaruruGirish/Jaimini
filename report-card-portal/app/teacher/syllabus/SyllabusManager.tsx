"use client";

import { useActionState, useRef } from "react";
import { removeSyllabus, uploadSyllabus } from "@/lib/actions/syllabus";

type Row = {
  id: string;
  name: string;
  part: "A" | "B";
  syllabusUrl: string;
  syllabusFileName: string;
  syllabusUploadedAt: string | null;
};

function UploadForm({ subjectId }: { subjectId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState(uploadSyllabus, null);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="subjectId" value={subjectId} />
      <input ref={inputRef} type="file" name="file" accept="application/pdf,.pdf" required className="text-xs" />
      <button disabled={pending} className="rounded-full bg-[#0C2A5A] px-3 py-1 text-xs text-white disabled:opacity-50">
        {pending ? "Uploading…" : "Upload PDF"}
      </button>
      {state?.error ? <span className="text-xs text-red-600">{state.error}</span> : null}
    </form>
  );
}

export default function SyllabusManager({ subjects }: { subjects: Row[] }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="p-3">Subject</th>
            <th className="p-3">Type</th>
            <th className="p-3">File</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {subjects.length === 0 ? (
            <tr>
              <td className="p-4 text-slate-500" colSpan={4}>
                No active subjects. Add them under Subjects first.
              </td>
            </tr>
          ) : (
            subjects.map((s) => (
              <tr key={s.id} className="border-t align-top">
                <td className="p-3 font-medium text-[#0C2A5A]">{s.name}</td>
                <td className="p-3">{s.part === "A" ? "Part A" : "Part B"}</td>
                <td className="p-3">
                  {s.syllabusUrl ? (
                    <div>
                      <a href={s.syllabusUrl} target="_blank" rel="noreferrer" className="text-sky-800 underline">
                        {s.syllabusFileName || "syllabus.pdf"}
                      </a>
                      <p className="text-xs text-slate-500">
                        {s.syllabusUploadedAt
                          ? new Date(s.syllabusUploadedAt).toLocaleString("en-IN")
                          : ""}
                      </p>
                    </div>
                  ) : (
                    <span className="text-slate-500">Not uploaded</span>
                  )}
                </td>
                <td className="p-3 space-y-2">
                  <UploadForm subjectId={s.id} />
                  {s.syllabusUrl ? (
                    <form action={removeSyllabus}>
                      <input type="hidden" name="subjectId" value={s.id} />
                      <button className="text-xs text-red-700">Remove PDF</button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

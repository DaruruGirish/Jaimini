"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createStudent, importStudents } from "@/lib/actions/teacher";
import { buildRosterTemplate, parseRosterWorkbook } from "@/lib/excel-roster";
import PhotoField from "@/components/PhotoField";

type Existing = {
  rollNo: number;
  admissionNo: string;
  name: string;
  fatherName: string;
  motherName: string;
  parentMobile?: string;
};

function downloadBytes(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function StudentRosterForm({
  classLabel,
  students,
}: {
  classLabel: string;
  students: Existing[];
  locked?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-[#0C2A5A]">Upload student details (Excel)</h3>
        <p className="mt-1 text-sm text-slate-600">
          This is the class student list for {classLabel} — name, roll number, admission number and parents. It is not marks.
          Columns must be: <strong>Roll</strong>, <strong>Admission No</strong>, <strong>Name</strong>, <strong>Father</strong>, <strong>Mother</strong>, <strong>Parent Mobile</strong>.
          Parent mobile is required — it is the student’s first password (digits only). Username is first 3 letters of first name + roll (Manvitha, 12 → man12).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => downloadBytes(buildRosterTemplate(students), `${classLabel}-students.xlsx`)}
            className="rounded-full border border-[#0C2A5A] px-4 py-1.5 text-sm text-[#0C2A5A]"
          >
            Download student Excel
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => fileRef.current?.click()}
            className="rounded-full bg-sky-700 px-4 py-1.5 text-sm text-white disabled:opacity-40"
          >
            {pending ? "Uploading…" : "Upload Excel"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              start(async () => {
                const parsed = parseRosterWorkbook(await file.arrayBuffer());
                if (!parsed.rows.length) {
                  setMsg(parsed.errors.join(" ") || "No students found in the file.");
                  return;
                }
                const r = await importStudents(parsed.rows);
                if (r.error) {
                  setMsg(r.error);
                  return;
                }
                const extra = [...parsed.errors, ...(r.notes ?? [])].join(" ");
                setMsg(`Saved ${r.saved} student${r.saved === 1 ? "" : "s"}.${extra ? " " + extra : ""}`);
                router.refresh();
              });
            }}
          />
        </div>
      </div>

      <form
        action={(fd) =>
          start(async () => {
            const r = await createStudent(fd);
            setMsg(r.error ?? "Student added to your class.");
            if (!r.error) router.refresh();
          })
        }
        className="grid gap-3 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-2"
      >
        <p className="sm:col-span-2 text-sm font-medium text-slate-700">Or add one student by hand</p>
        <input name="name" placeholder="Student name" className="rounded-lg border px-3 py-2" required />
        <input name="admissionNo" placeholder="Admission no (unique)" className="rounded-lg border px-3 py-2" required />
        <input name="fatherName" placeholder="Father's name" className="rounded-lg border px-3 py-2" />
        <input name="motherName" placeholder="Mother's name" className="rounded-lg border px-3 py-2" />
        <input name="parentMobile" required placeholder="Parent mobile (required, first password)" className="rounded-lg border px-3 py-2" />
        <input name="rollNo" type="number" min={1} placeholder="Roll no (unique in this class)" className="rounded-lg border px-3 py-2" required />
        <div>
          <p className="mb-1 text-xs text-slate-500">Passport photo (optional)</p>
          <PhotoField name="photoUrl" />
        </div>
        <button disabled={pending} className="self-end rounded-lg bg-[#0C2A5A] px-4 py-2 text-white disabled:opacity-40">
          {pending ? "Saving…" : "Add student"}
        </button>
      </form>
      {msg ? <p className="rounded-lg bg-sky-50 p-3 text-sm text-slate-700">{msg}</p> : null}
    </div>
  );
}

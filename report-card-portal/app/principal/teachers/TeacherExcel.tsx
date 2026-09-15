"use client";

import { useRef, useState, useTransition } from "react";
import { importTeachers } from "@/lib/actions/principal";
import { buildTeacherTemplate, parseTeacherWorkbook } from "@/lib/excel-roster";

function downloadBytes(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TeacherExcel() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <h3 className="font-semibold text-[#0C2A5A]">Upload teachers</h3>
      <p className="mt-1 text-sm text-slate-600">Excel columns: Name, Email, Password. Then assign each teacher to a class.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => downloadBytes(buildTeacherTemplate(), "teachers.xlsx")}
          className="rounded-full border border-[#0C2A5A] px-4 py-1.5 text-sm text-[#0C2A5A]"
        >
          Download teacher Excel
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => fileRef.current?.click()}
          className="rounded-full bg-sky-700 px-4 py-1.5 text-sm text-white disabled:opacity-40"
        >
          Upload Excel
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
              const parsed = parseTeacherWorkbook(await file.arrayBuffer());
              if (!parsed.rows.length) {
                setMsg(parsed.errors.join(" ") || "No teachers found in the file.");
                return;
              }
              const r = await importTeachers(parsed.rows);
              const extra = [...parsed.errors, ...(r.notes ?? [])].join(" ");
              setMsg(`Created ${r.created} teacher${r.created === 1 ? "" : "s"}.${extra ? " " + extra : ""}`);
            });
          }}
        />
      </div>
      {msg ? <p className="mt-3 rounded-lg bg-sky-50 p-3 text-sm text-slate-700">{msg}</p> : null}
    </div>
  );
}

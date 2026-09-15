"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Subject } from "@prisma/client";
import { saveClassMarks } from "@/lib/actions/teacher";
import { A_TO_B, B_TO_A, emptyPartA, emptyPartB, isLockedStatus, PART_A_EXAMS, PART_B_EXAMS, type PartAKey, type PartBKey } from "@/lib/mark-fields";
import { examFromPartA, EXAM_META } from "@/lib/exams";
import { buildExamTemplate, examTemplateHeaders, parseExamWorkbook } from "@/lib/excel-marks";

type StudentPayload = {
  enrollmentId: string;
  rollNo: number;
  name: string;
  photoUrl: string;
  remarks: string;
  attendanceWorkS1: number | string;
  attendancePresentS1: number | string;
  attendanceWorkS2: number | string;
  attendancePresentS2: number | string;
  cells: Record<string, { fa1: number | null; fa2: number | null; sa1: number | null; fa3: number | null; fa4: number | null; sa2: number | null }>;
  partB: Record<string, { fa01: number | null; fa02: number | null; sa01: number | null; fa03: number | null; fa04: number | null; sa02: number | null }>;
  status: string;
};

type RowState = {
  cells: Record<string, ReturnType<typeof emptyPartA>>;
  partB: Record<string, ReturnType<typeof emptyPartB>>;
  remarks: string;
  attendanceWorkS1: string;
  attendancePresentS1: string;
  attendanceWorkS2: string;
  attendancePresentS2: string;
};

function initState(students: StudentPayload[], subjectsA: Subject[], subjectsB: Subject[]): Record<string, RowState> {
  return Object.fromEntries(
    students.map((s) => [
      s.enrollmentId,
      {
        cells: Object.fromEntries(
          subjectsA.map((sub) => [
            sub.id,
            {
              fa1: s.cells[sub.id]?.fa1 ?? null,
              fa2: s.cells[sub.id]?.fa2 ?? null,
              sa1: s.cells[sub.id]?.sa1 ?? null,
              fa3: s.cells[sub.id]?.fa3 ?? null,
              fa4: s.cells[sub.id]?.fa4 ?? null,
              sa2: s.cells[sub.id]?.sa2 ?? null,
            },
          ])
        ),
        partB: Object.fromEntries(
          subjectsB.map((sub) => [
            sub.id,
            {
              fa01: s.partB[sub.id]?.fa01 ?? null,
              fa02: s.partB[sub.id]?.fa02 ?? null,
              sa01: s.partB[sub.id]?.sa01 ?? null,
              fa03: s.partB[sub.id]?.fa03 ?? null,
              fa04: s.partB[sub.id]?.fa04 ?? null,
              sa02: s.partB[sub.id]?.sa02 ?? null,
            },
          ])
        ),
        remarks: s.remarks,
        attendanceWorkS1: String(s.attendanceWorkS1 ?? ""),
        attendancePresentS1: String(s.attendancePresentS1 ?? ""),
        attendanceWorkS2: String(s.attendanceWorkS2 ?? ""),
        attendancePresentS2: String(s.attendancePresentS2 ?? ""),
      },
    ])
  );
}

function toNum(v: string) {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function downloadBytes(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function CellInput({
  value,
  max,
  disabled,
  onChange,
  wide,
}: {
  value: number | null;
  max: number;
  disabled: boolean;
  onChange: (v: number | null) => void;
  wide?: boolean;
}) {
  return (
    <input
      type="number"
      min={0}
      max={max}
      step={1}
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      className={`${wide ? "w-16" : "w-14"} rounded border px-1 py-1 text-center text-xs disabled:bg-slate-100`}
    />
  );
}

export default function MarksEditor({
  subjectsA,
  subjectsB,
  orderedSubjects,
  students,
  locked,
  lockedKeys = [],
  classLabel,
  initialStudentId,
  hasMarks,
}: {
  subjectsA: Subject[];
  subjectsB: Subject[];
  orderedSubjects: Subject[];
  students: StudentPayload[];
  locked: boolean;
  lockedKeys?: PartAKey[];
  classLabel: string;
  initialStudentId?: string;
  hasMarks: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const opened = students.some((s) => s.enrollmentId === initialStudentId);
  const [tab, setTab] = useState<"grid" | "student">("student");
  const [examA, setExamA] = useState<PartAKey>("fa1");
  const [examB, setExamB] = useState<PartBKey>("fa01");
  const [active, setActive] = useState(opened ? initialStudentId! : students[0]?.enrollmentId ?? "");
  const [query, setQuery] = useState("");
  const [state, setState] = useState(() => initState(students, subjectsA, subjectsB));
  const [msg, setMsg] = useState("");
  const [importNotes, setImportNotes] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const aExam = PART_A_EXAMS.find((e) => e.key === examA)!;
  const bExam = PART_B_EXAMS.find((e) => e.key === examB)!;
  const examALocked = lockedKeys.includes(examA);
  const examBLocked = lockedKeys.includes(B_TO_A[examB]);

  const editable = useMemo(() => students.filter((s) => !locked && !isLockedStatus(s.status)), [students, locked]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => s.name.toLowerCase().includes(q) || String(s.rollNo).includes(q));
  }, [students, query]);

  useEffect(() => {
    if (!query.trim()) return;
    if (filtered[0]) setActive(filtered[0].enrollmentId);
  }, [query, filtered]);

  function excelStudents() {
    return students.map((s) => ({
      ...s,
      cells: state[s.enrollmentId].cells,
      partB: state[s.enrollmentId].partB,
      remarks: state[s.enrollmentId].remarks,
      attendanceWorkS1: state[s.enrollmentId].attendanceWorkS1,
      attendancePresentS1: state[s.enrollmentId].attendancePresentS1,
      attendanceWorkS2: state[s.enrollmentId].attendanceWorkS2,
      attendancePresentS2: state[s.enrollmentId].attendancePresentS2,
    }));
  }

  function openStudent(id: string) {
    setActive(id);
    setTab("student");
  }

  function buildPayload(ids = editable.map((s) => s.enrollmentId)) {
    return ids.flatMap((enrollmentId) => {
      const s = students.find((row) => row.enrollmentId === enrollmentId);
      if (!s || locked || isLockedStatus(s.status)) return [];
      const row = state[enrollmentId];
      return [
        {
          enrollmentId,
          remarks: row.remarks,
          attendanceWorkS1: toNum(row.attendanceWorkS1),
          attendancePresentS1: toNum(row.attendancePresentS1),
          attendanceWorkS2: toNum(row.attendanceWorkS2),
          attendancePresentS2: toNum(row.attendancePresentS2),
          cells: row.cells,
          partB: row.partB,
          merge: false,
        },
      ];
    });
  }

  function saveAll() {
    start(async () => {
      const r = await saveClassMarks(buildPayload());
      setMsg(r.error ?? `Saved ${r.saved ?? editable.length} student${(r.saved ?? editable.length) === 1 ? "" : "s"}.`);
      router.refresh();
    });
  }

  function saveStudent(enrollmentId: string) {
    start(async () => {
      const r = await saveClassMarks(buildPayload([enrollmentId]));
      setMsg(r.error ?? "Saved this student’s marks, attendance and remarks.");
      router.refresh();
    });
  }

  async function onUpload(file: File) {
    const examKey = examFromPartA(examA);
    const buf = await file.arrayBuffer();
    const parsed = parseExamWorkbook(
      buf,
      orderedSubjects.map((s) => ({ id: s.id, name: s.name, part: s.part })),
      examKey,
      students
    );
    const notes = [...(parsed.fileError ? [parsed.fileError] : []), ...parsed.rows.filter((r) => r.error).map((r) => r.error!)];
    if (parsed.fileError) {
      setImportNotes(notes);
      setMsg(parsed.fileError);
      return;
    }
    const next = { ...state };
    const payload = [];
    for (const row of parsed.rows) {
      if (row.error || row.rollNo == null) continue;
      const match = students.find((s) => s.rollNo === row.rollNo);
      if (!match) continue;
      if (isLockedStatus(match.status)) {
        notes.push(`Roll ${row.rollNo} (${match.name}) is locked on the overall card and was skipped.`);
        continue;
      }
      const current = next[match.enrollmentId];
      const cells = { ...current.cells };
      for (const [subjectId, marks] of Object.entries(row.cells)) {
        cells[subjectId] = { ...cells[subjectId], ...marks };
      }
      const partB = { ...current.partB };
      for (const [subjectId, marks] of Object.entries(row.partB)) {
        partB[subjectId] = { ...partB[subjectId], ...marks };
      }
      next[match.enrollmentId] = {
        ...current,
        cells,
        partB,
        remarks: row.remarks ?? current.remarks,
      };
      payload.push({
        enrollmentId: match.enrollmentId,
        remarks: next[match.enrollmentId].remarks,
        cells: row.cells,
        partB: row.partB,
        merge: true,
      });
    }
    setState(next);
    setImportNotes(notes);
    start(async () => {
      if (!payload.length) {
        setMsg(notes.join(" ") || "No valid rows to save.");
        return;
      }
      const r = await saveClassMarks(payload);
      setMsg(
        r.error ??
          `Saved ${r.saved ?? payload.length} draft row${(r.saved ?? payload.length) === 1 ? "" : "s"} for ${EXAM_META[examKey].label}. Not published.${notes.length ? " " + notes.length + " row error(s) listed below." : ""}`
      );
      router.refresh();
    });
  }

  if (!students.length) return <p>No students.</p>;
  const student = filtered.find((s) => s.enrollmentId === active) ?? filtered[0] ?? students[0];
  const disabledStudent = locked || isLockedStatus(student.status);
  const row = state[student.enrollmentId];
  const canUpload = editable.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 shadow-sm">
        <button type="button" onClick={() => setTab("student")} className={`rounded-full px-4 py-1.5 text-sm ${tab === "student" ? "bg-[#0C2A5A] text-white" : "bg-slate-100"}`}>
          Edit one student
        </button>
        <button type="button" onClick={() => setTab("grid")} className={`rounded-full px-4 py-1.5 text-sm ${tab === "grid" ? "bg-[#0C2A5A] text-white" : "bg-slate-100"}`}>
          Whole class
        </button>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setTab("student");
          }}
          placeholder="Search name or roll number"
          className="min-w-56 flex-1 rounded-full border border-slate-200 px-4 py-1.5 text-sm"
        />
        <div className="ml-auto flex flex-wrap gap-2">
          {editable.length > 0 ? (
            <button type="button" disabled={pending} onClick={saveAll} className="rounded-full bg-[#0C2A5A] px-4 py-1.5 text-sm text-white">
              {pending ? "Saving…" : "Save all drafts"}
            </button>
          ) : null}
        </div>
      </div>

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-[#0C2A5A]">Excel · one exam</h3>
        <p className="mt-1 text-sm text-slate-600">
          File is for <strong>{aExam.label}</strong> only. Columns must be{" "}
          <span className="font-mono text-xs">{examTemplateHeaders(orderedSubjects).join(" | ")}</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Subject order: {orderedSubjects.length ? orderedSubjects.map((s) => s.name).join(" → ") : "Add subjects first."}{" "}
          <a className="text-sky-800 underline" href="/teacher/subjects">
            Manage subjects
          </a>
        </p>
        {hasMarks ? (
          <p className="mt-2 text-xs text-amber-800">
            If you change subject order after marks exist, download a new template. Existing marks stay keyed by subject,
            not by column letter.
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {PART_A_EXAMS.map((exam) => (
            <button
              key={exam.key}
              type="button"
              onClick={() => {
                setExamA(exam.key);
                setExamB(A_TO_B[exam.key]);
              }}
              className={`rounded-full px-3 py-1 text-xs ${examA === exam.key ? "bg-[#0C2A5A] text-white" : "bg-slate-100"}`}
            >
              {exam.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              downloadBytes(
                buildExamTemplate(
                  excelStudents().map((s) => ({ ...s, cells: {}, partB: {}, remarks: "" })),
                  orderedSubjects.map((s) => ({ id: s.id, name: s.name, part: s.part })),
                  examFromPartA(examA)
                ),
                `${classLabel}-${examFromPartA(examA)}-template.xlsx`
              )
            }
            className="rounded-full border border-[#0C2A5A] px-4 py-1.5 text-sm text-[#0C2A5A]"
          >
            Download template
          </button>
          <button
            type="button"
            onClick={() =>
              downloadBytes(
                buildExamTemplate(
                  excelStudents(),
                  orderedSubjects.map((s) => ({ id: s.id, name: s.name, part: s.part })),
                  examFromPartA(examA)
                ),
                `${classLabel}-${examFromPartA(examA)}-draft.xlsx`
              )
            }
            className="rounded-full border border-sky-700 px-4 py-1.5 text-sm text-sky-800"
          >
            Export current draft
          </button>
          <button
            type="button"
            disabled={!canUpload || examALocked}
            onClick={() => fileRef.current?.click()}
            className="rounded-full bg-sky-700 px-4 py-1.5 text-sm text-white disabled:opacity-40"
          >
            Upload .xlsx
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void onUpload(file);
            }}
          />
        </div>
        {importNotes.length ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-red-700">
            {importNotes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <p className="text-xs text-slate-500">
        Search a student by name or roll number, then edit that student’s Part A, Part B and attendance. Whole class is the grid for everyone at once.
      </p>
      {msg ? <p className="rounded-lg bg-sky-50 p-3 text-sm text-slate-700">{msg}</p> : null}

      {tab === "grid" ? (
        <div className="space-y-4">
          <section className="rounded-xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-[#0C2A5A]">Part A</h3>
            </div>
            <div className="mb-3 flex flex-wrap gap-1">
              {PART_A_EXAMS.map((exam) => (
                <button
                  key={exam.key}
                  type="button"
                  onClick={() => setExamA(exam.key)}
                  className={`rounded-full px-3 py-1 text-xs ${examA === exam.key ? "bg-[#0C2A5A] text-white" : "bg-slate-100"}`}
                >
                  {exam.label} ({exam.max}){lockedKeys.includes(exam.key) ? " · locked" : ""}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-sky-50">
                  <tr>
                    <th className="sticky left-0 bg-sky-50 p-2">Roll</th>
                    <th className="sticky left-10 bg-sky-50 p-2">Student</th>
                    {subjectsA.map((sub) => (
                      <th key={sub.id} className="p-2 text-center">
                        {sub.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const rowLocked = locked || isLockedStatus(s.status);
                    return (
                      <tr key={s.enrollmentId} className="border-t">
                        <td className="sticky left-0 bg-white p-2 text-xs text-slate-500">{s.rollNo}</td>
                        <td className="sticky left-10 bg-white p-2 whitespace-nowrap">
                          <button type="button" onClick={() => openStudent(s.enrollmentId)} className="text-left text-[#0C2A5A] underline-offset-2 hover:underline">
                            {s.name}
                          </button>
                        </td>
                        {subjectsA.map((sub) => (
                          <td key={sub.id} className="p-2 text-center">
                            <CellInput
                              value={state[s.enrollmentId].cells[sub.id][examA]}
                              max={aExam.max}
                              disabled={rowLocked || examALocked}
                              onChange={(v) =>
                                setState((prev) => ({
                                  ...prev,
                                  [s.enrollmentId]: {
                                    ...prev[s.enrollmentId],
                                    cells: {
                                      ...prev[s.enrollmentId].cells,
                                      [sub.id]: { ...prev[s.enrollmentId].cells[sub.id], [examA]: v },
                                    },
                                  },
                                }))
                              }
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-[#0C2A5A]">Part B</h3>
            </div>
            <div className="mb-3 flex flex-wrap gap-1">
              {PART_B_EXAMS.map((exam) => (
                <button
                  key={exam.key}
                  type="button"
                  onClick={() => setExamB(exam.key)}
                  className={`rounded-full px-3 py-1 text-xs ${examB === exam.key ? "bg-[#0C2A5A] text-white" : "bg-slate-100"}`}
                >
                  {exam.label} ({exam.max}){lockedKeys.includes(B_TO_A[exam.key]) ? " · locked" : ""}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-sky-50">
                  <tr>
                    <th className="p-2">Roll</th>
                    <th className="p-2">Student</th>
                    {subjectsB.map((sub) => (
                      <th key={sub.id} className="p-2 text-center">
                        {sub.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const rowLocked = locked || isLockedStatus(s.status);
                    return (
                      <tr key={s.enrollmentId} className="border-t">
                        <td className="p-2 text-xs text-slate-500">{s.rollNo}</td>
                        <td className="p-2 whitespace-nowrap">
                          <button type="button" onClick={() => openStudent(s.enrollmentId)} className="text-left text-[#0C2A5A] underline-offset-2 hover:underline">
                            {s.name}
                          </button>
                        </td>
                        {subjectsB.map((sub) => (
                          <td key={sub.id} className="p-2 text-center">
                            <CellInput
                              value={state[s.enrollmentId].partB[sub.id][examB]}
                              max={bExam.max}
                              disabled={rowLocked || examBLocked}
                              onChange={(v) =>
                                setState((prev) => ({
                                  ...prev,
                                  [s.enrollmentId]: {
                                    ...prev[s.enrollmentId],
                                    partB: {
                                      ...prev[s.enrollmentId].partB,
                                      [sub.id]: { ...prev[s.enrollmentId].partB[sub.id], [examB]: v },
                                    },
                                  },
                                }))
                              }
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-[#0C2A5A]">Attendance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-sky-50">
                  <tr>
                    <th className="p-2">Roll</th>
                    <th className="p-2">Student</th>
                    <th className="p-2 text-center">Work S1</th>
                    <th className="p-2 text-center">Present S1</th>
                    <th className="p-2 text-center">Work S2</th>
                    <th className="p-2 text-center">Present S2</th>
                    <th className="p-2">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const rowLocked = locked || isLockedStatus(s.status);
                    const r = state[s.enrollmentId];
                    return (
                      <tr key={s.enrollmentId} className="border-t">
                        <td className="p-2 text-xs text-slate-500">{s.rollNo}</td>
                        <td className="p-2 whitespace-nowrap">
                          <button type="button" onClick={() => openStudent(s.enrollmentId)} className="text-left text-[#0C2A5A] underline-offset-2 hover:underline">
                            {s.name}
                          </button>
                        </td>
                        {(
                          [
                            ["attendanceWorkS1", r.attendanceWorkS1],
                            ["attendancePresentS1", r.attendancePresentS1],
                            ["attendanceWorkS2", r.attendanceWorkS2],
                            ["attendancePresentS2", r.attendancePresentS2],
                          ] as const
                        ).map(([key, value]) => (
                          <td key={key} className="p-2 text-center">
                            <input
                              type="number"
                              min={0}
                              value={value}
                              disabled={rowLocked}
                              onChange={(e) =>
                                setState((prev) => ({
                                  ...prev,
                                  [s.enrollmentId]: { ...prev[s.enrollmentId], [key]: e.target.value },
                                }))
                              }
                              className="w-16 rounded border px-1 py-1 text-center text-xs disabled:bg-slate-100"
                            />
                          </td>
                        ))}
                        <td className="p-2">
                          <input
                            value={r.remarks}
                            disabled={rowLocked}
                            onChange={(e) =>
                              setState((prev) => ({
                                ...prev,
                                [s.enrollmentId]: { ...prev[s.enrollmentId], remarks: e.target.value },
                              }))
                            }
                            className="w-full min-w-40 rounded border px-2 py-1 text-xs disabled:bg-slate-100"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-xl bg-white p-3 shadow-sm">
            <label className="block text-xs font-medium text-slate-600">
              Search roll number or name
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. 12 or Manvitha"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </label>
            <div className="mt-2 max-h-[70vh] overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="p-2 text-sm text-slate-500">No student matches that search.</p>
              ) : (
                filtered.map((s) => (
                  <button
                    key={s.enrollmentId}
                    type="button"
                    onClick={() => setActive(s.enrollmentId)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm ${s.enrollmentId === student.enrollmentId ? "bg-sky-100" : "hover:bg-slate-50"}`}
                  >
                    <span className="w-8 text-xs text-slate-500">{s.rollNo}</span>
                    <span>{s.name}</span>
                  </button>
                ))
              )}
            </div>
          </aside>
          <div className="space-y-4 rounded-xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold text-[#0C2A5A]">
                  {student.name} · Roll {student.rollNo}
                </h3>
                <p className="text-sm text-slate-500">{student.status}</p>
              </div>
              {!disabledStudent ? (
                <button type="button" disabled={pending} onClick={() => saveStudent(student.enrollmentId)} className="rounded-full bg-[#0C2A5A] px-4 py-2 text-sm text-white">
                  {pending ? "Saving…" : "Save this student"}
                </button>
              ) : null}
            </div>

            <section>
              <h4 className="mb-2 font-semibold text-[#0C2A5A]">Part A — Scholastic</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-sky-50">
                    <tr>
                      <th className="p-2">Subject</th>
                      {PART_A_EXAMS.map((exam) => (
                        <th key={exam.key} className="p-2 text-center">
                          {exam.label}
                          <span className="block text-[10px] font-normal text-slate-500">/{exam.max}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subjectsA.map((sub) => (
                      <tr key={sub.id} className="border-t">
                        <td className="p-2 whitespace-nowrap">{sub.name}</td>
                        {PART_A_EXAMS.map((exam) => (
                          <td key={exam.key} className="p-2 text-center">
                            <CellInput
                              wide
                              value={row.cells[sub.id][exam.key]}
                              max={exam.max}
                              disabled={disabledStudent || lockedKeys.includes(exam.key)}
                              onChange={(v) =>
                                setState((prev) => ({
                                  ...prev,
                                  [student.enrollmentId]: {
                                    ...prev[student.enrollmentId],
                                    cells: {
                                      ...prev[student.enrollmentId].cells,
                                      [sub.id]: { ...prev[student.enrollmentId].cells[sub.id], [exam.key]: v },
                                    },
                                  },
                                }))
                              }
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h4 className="mb-2 font-semibold text-[#0C2A5A]">Part B — Co-scholastic</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-sky-50">
                    <tr>
                      <th className="p-2">Subject</th>
                      {PART_B_EXAMS.map((exam) => (
                        <th key={exam.key} className="p-2 text-center">
                          {exam.label}
                          <span className="block text-[10px] font-normal text-slate-500">/{exam.max}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subjectsB.map((sub) => (
                      <tr key={sub.id} className="border-t">
                        <td className="p-2 whitespace-nowrap">{sub.name}</td>
                        {PART_B_EXAMS.map((exam) => (
                          <td key={exam.key} className="p-2 text-center">
                            <CellInput
                              wide
                              value={row.partB[sub.id][exam.key]}
                              max={exam.max}
                              disabled={disabledStudent || lockedKeys.includes(B_TO_A[exam.key])}
                              onChange={(v) =>
                                setState((prev) => ({
                                  ...prev,
                                  [student.enrollmentId]: {
                                    ...prev[student.enrollmentId],
                                    partB: {
                                      ...prev[student.enrollmentId].partB,
                                      [sub.id]: { ...prev[student.enrollmentId].partB[sub.id], [exam.key]: v },
                                    },
                                  },
                                }))
                              }
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h4 className="mb-2 font-semibold text-[#0C2A5A]">Attendance</h4>
              <div className="grid gap-3 sm:grid-cols-4 text-sm">
                <label>
                  Work days S1
                  <input
                    type="number"
                    min={0}
                    value={row.attendanceWorkS1}
                    disabled={disabledStudent}
                    onChange={(e) => setState((p) => ({ ...p, [student.enrollmentId]: { ...p[student.enrollmentId], attendanceWorkS1: e.target.value } }))}
                    className="mt-1 w-full rounded border px-2 py-1 disabled:bg-slate-100"
                  />
                </label>
                <label>
                  Present S1
                  <input
                    type="number"
                    min={0}
                    value={row.attendancePresentS1}
                    disabled={disabledStudent}
                    onChange={(e) => setState((p) => ({ ...p, [student.enrollmentId]: { ...p[student.enrollmentId], attendancePresentS1: e.target.value } }))}
                    className="mt-1 w-full rounded border px-2 py-1 disabled:bg-slate-100"
                  />
                </label>
                <label>
                  Work days S2
                  <input
                    type="number"
                    min={0}
                    value={row.attendanceWorkS2}
                    disabled={disabledStudent}
                    onChange={(e) => setState((p) => ({ ...p, [student.enrollmentId]: { ...p[student.enrollmentId], attendanceWorkS2: e.target.value } }))}
                    className="mt-1 w-full rounded border px-2 py-1 disabled:bg-slate-100"
                  />
                </label>
                <label>
                  Present S2
                  <input
                    type="number"
                    min={0}
                    value={row.attendancePresentS2}
                    disabled={disabledStudent}
                    onChange={(e) => setState((p) => ({ ...p, [student.enrollmentId]: { ...p[student.enrollmentId], attendancePresentS2: e.target.value } }))}
                    className="mt-1 w-full rounded border px-2 py-1 disabled:bg-slate-100"
                  />
                </label>
              </div>
            </section>

            <label className="block text-sm">
              Remarks
              <textarea
                value={row.remarks}
                disabled={disabledStudent}
                onChange={(e) => setState((p) => ({ ...p, [student.enrollmentId]: { ...p[student.enrollmentId], remarks: e.target.value } }))}
                className="mt-1 w-full rounded border px-2 py-1 disabled:bg-slate-100"
                rows={3}
              />
            </label>

            {!disabledStudent ? (
              <button type="button" disabled={pending} onClick={() => saveStudent(student.enrollmentId)} className="rounded-full bg-[#0C2A5A] px-4 py-2 text-white">
                {pending ? "Saving…" : "Save this student"}
              </button>
            ) : student.status === "APPROVED" ? (
              <p className="text-sm text-emerald-700">Approved. Print from Print desk. Only the Principal can reject if a correction is needed.</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

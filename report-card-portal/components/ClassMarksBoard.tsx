"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";
import { dash, FA_MAX, SA_MAX, gradeFromPercent } from "@/lib/grades";
import { A_TO_B, PART_A_EXAMS, PART_B_EXAMS, type PartAKey, type PartBKey } from "@/lib/mark-fields";

function Mark({ value }: { value: number | string | null | undefined }) {
  return <span>{dash(value)}</span>;
}

type PartAMarks = {
  fa1: number | null;
  fa2: number | null;
  sa1: number | null;
  fa3: number | null;
  fa4: number | null;
  sa2: number | null;
  t1: number | null;
  t2: number | null;
  total: number | null;
  grade: string | null;
};

type PartBMarks = {
  fa01: number | null;
  fa02: number | null;
  sa01: number | null;
  fa03: number | null;
  fa04: number | null;
  sa02: number | null;
  total: number | null;
};

type StudentRow = {
  enrollmentId: string;
  studentId: string;
  rollNo: number;
  name: string;
  rank: number | null;
  grand: number | null;
  grade: string | null;
  attS1: number | null;
  attS2: number | null;
  partA: PartAMarks[];
  partB: PartBMarks[];
};

const cell = "border border-slate-200 px-1.5 py-1.5 text-center";
const head = `${cell} bg-[#0C2A5A] text-[11px] font-semibold text-white`;
const sticky = "sticky left-0 z-10 bg-inherit text-left font-medium text-[#0C2A5A]";

type ViewId = "all" | "total" | PartAKey;

const VIEWS: { id: ViewId; label: string }[] = [
  { id: "all", label: "Whole academic year" },
  { id: "fa1", label: "FA-I" },
  { id: "fa2", label: "FA-II" },
  { id: "sa1", label: "SA-I" },
  { id: "fa3", label: "FA-III" },
  { id: "fa4", label: "FA-IV" },
  { id: "sa2", label: "SA-II" },
  { id: "total", label: "Year total" },
];

function sumMarks(vals: (number | null | undefined)[]) {
  const nums = vals.filter((v): v is number => v != null);
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0);
}

function examSum(row: StudentRow, key: PartAKey) {
  return sumMarks(row.partA.map((m) => m[key]));
}

export default function ClassMarksBoard({
  classId,
  schoolName,
  classLabel,
  yearLabel,
  teacherName,
  subjectsA,
  subjectsB,
  rows,
}: {
  classId: string;
  schoolName: string;
  classLabel: string;
  yearLabel: string;
  teacherName: string;
  subjectsA: { id: string; name: string }[];
  subjectsB: { id: string; name: string }[];
  rows: StudentRow[];
}) {
  const [view, setView] = useState<ViewId>("all");
  const exam = PART_A_EXAMS.find((e) => e.key === view);
  const viewLabel = VIEWS.find((v) => v.id === view)?.label ?? "Marks";

  const examRows = useMemo(() => {
    if (!exam) return [];
    const bKey = A_TO_B[exam.key] as PartBKey;
    const withScore = rows.map((row) => {
      const aMarks = row.partA.map((m) => m[exam.key]);
      const bMarks = row.partB.map((m) => m[bKey]);
      const total = sumMarks(aMarks);
      const maxAll = exam.max * (aMarks.length || 1);
      const grade = total == null ? null : gradeFromPercent((total / maxAll) * 100);
      return { row, aMarks, bMarks, total, bTotal: sumMarks(bMarks), grade, maxAll };
    });
    const ranked = [...withScore].sort((a, b) => (b.total ?? -1) - (a.total ?? -1));
    const rank = new Map<string, number>();
    ranked.forEach((item, i) => {
      if (item.total != null) rank.set(item.row.enrollmentId, i + 1);
    });
    return withScore.map((item) => ({ ...item, rank: rank.get(item.row.enrollmentId) ?? null }));
  }, [exam, rows]);

  return (
    <div className="marks-register space-y-6">
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <p className="text-center text-xs font-semibold tracking-widest text-sky-800">{schoolName}</p>
        <h3 className="mt-1 text-center text-2xl font-bold text-[#0C2A5A]">Class {classLabel} · {viewLabel}</h3>
        <p className="mt-1 text-center text-sm text-slate-600">
          {yearLabel} · Class teacher: {teacherName} · {rows.length} students
        </p>
        <div className="no-print mt-4 flex flex-wrap justify-center gap-2">
          {VIEWS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setView(option.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                view === option.id ? "bg-[#0C2A5A] text-white" : "bg-sky-50 text-[#0C2A5A] hover:bg-sky-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="no-print mt-4 flex justify-center">
          <PrintButton
            label="Print / display as PDF"
            hint="In the print dialog choose landscape, then the school printer or Save as PDF. This prints the class mark register, not individual report cards."
          />
        </div>
      </div>

      {view === "total" || view === "all" ? (
        <>
          <CombinedExamTable rows={rows} subjectCount={subjectsA.length} />
          <SummaryTable classId={classId} subjectsA={subjectsA} rows={rows} />
        </>
      ) : null}

      {exam ? (
        <>
          <section className="overflow-x-auto rounded-xl bg-white shadow-sm">
            <h4 className="border-b px-4 py-3 text-lg font-semibold text-[#0C2A5A]">
              Part A · {exam.label}{" "}
              <span className="text-sm font-normal text-slate-500">
                (max {exam.max} per subject · total max {exam.max * subjectsA.length} across {subjectsA.length} subjects)
              </span>
            </h4>
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className={`${head} w-10`}>Rank</th>
                  <th className={`${head} w-12`}>Roll</th>
                  <th className={`${head} min-w-[9rem] text-left`}>Name</th>
                  {subjectsA.map((s) => (
                    <th key={s.id} className={head}>
                      {s.name}
                    </th>
                  ))}
                  <th className={head}>
                    Total
                    <span className="block text-[10px] font-normal text-sky-100">/ {exam.max * subjectsA.length}</span>
                  </th>
                  <th className={head}>Grade</th>
                </tr>
              </thead>
              <tbody>
                {examRows.map((item) => (
                  <tr key={item.row.enrollmentId} className="bg-white odd:bg-white even:bg-sky-50/60">
                    <td className={cell}>{dash(item.rank)}</td>
                    <td className={cell}>{item.row.rollNo}</td>
                    <td className={`${cell} ${sticky}`}>{item.row.name}</td>
                    {item.aMarks.map((mark, i) => (
                      <td key={subjectsA[i].id} className={`${cell} font-semibold`}>
                        <Mark value={mark} />
                      </td>
                    ))}
                    <td className={`${cell} font-bold text-[#0C2A5A]`}>
                      <Mark value={item.total} />
                    </td>
                    <td className={`${cell} font-bold`}>
                      <Mark value={item.grade} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          {subjectsB.length ? (
            <section className="overflow-x-auto rounded-xl bg-white shadow-sm">
              <h4 className="border-b px-4 py-3 font-semibold text-[#0C2A5A]">
                Part B · {PART_B_EXAMS.find((e) => e.key === A_TO_B[exam.key])?.label}
              </h4>
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className={`${head} w-12`}>Roll</th>
                    <th className={`${head} min-w-[9rem] text-left`}>Name</th>
                    {subjectsB.map((s) => (
                      <th key={s.id} className={head}>
                        {s.name}
                      </th>
                    ))}
                    <th className={head}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {examRows.map((item) => (
                    <tr key={item.row.enrollmentId} className="bg-white odd:bg-white even:bg-sky-50/60">
                      <td className={cell}>{item.row.rollNo}</td>
                      <td className={`${cell} ${sticky}`}>{item.row.name}</td>
                      {item.bMarks.map((mark, i) => (
                        <td key={subjectsB[i].id} className={cell}>
                          <Mark value={mark} />
                        </td>
                      ))}
                      <td className={`${cell} font-bold text-[#0C2A5A]`}>
                        <Mark value={item.bTotal} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}
        </>
      ) : null}

      {view === "all" ? (
        <>
          {subjectsA.map((subject, si) => (
            <section key={subject.id} className="overflow-x-auto rounded-xl bg-white shadow-sm">
              <h4 className="border-b px-4 py-3 font-semibold text-[#0C2A5A]">
                Part A · {subject.name} <span className="text-sm font-normal text-slate-500">(FA max 15, SA max 20, total 100)</span>
              </h4>
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className={`${head} w-12`}>Roll</th>
                    <th className={`${head} min-w-[9rem] text-left`}>Name</th>
                    <th className={head}>FA-I</th>
                    <th className={head}>FA-II</th>
                    <th className={head}>SA-I</th>
                    <th className={head}>T1 / 50</th>
                    <th className={head}>FA-III</th>
                    <th className={head}>FA-IV</th>
                    <th className={head}>SA-II</th>
                    <th className={head}>T2 / 50</th>
                    <th className={head}>Total</th>
                    <th className={head}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const m = row.partA[si];
                    return (
                      <tr key={row.enrollmentId} className="bg-white odd:bg-white even:bg-sky-50/60">
                        <td className={cell}>{row.rollNo}</td>
                        <td className={`${cell} ${sticky}`}>{row.name}</td>
                        <td className={cell}>
                          <Mark value={m?.fa1} />
                        </td>
                        <td className={cell}>
                          <Mark value={m?.fa2} />
                        </td>
                        <td className={cell}>
                          <Mark value={m?.sa1} />
                        </td>
                        <td className={`${cell} font-semibold`}>
                          <Mark value={m?.t1} />
                        </td>
                        <td className={cell}>
                          <Mark value={m?.fa3} />
                        </td>
                        <td className={cell}>
                          <Mark value={m?.fa4} />
                        </td>
                        <td className={cell}>
                          <Mark value={m?.sa2} />
                        </td>
                        <td className={`${cell} font-semibold`}>
                          <Mark value={m?.t2} />
                        </td>
                        <td className={`${cell} font-bold text-[#0C2A5A]`}>
                          <Mark value={m?.total} />
                        </td>
                        <td className={`${cell} font-bold`}>
                          <Mark value={m?.grade} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          ))}
          {subjectsB.map((subject, si) => (
            <section key={subject.id} className="overflow-x-auto rounded-xl bg-white shadow-sm">
              <h4 className="border-b px-4 py-3 font-semibold text-[#0C2A5A]">Part B · {subject.name}</h4>
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className={`${head} w-12`}>Roll</th>
                    <th className={`${head} min-w-[9rem] text-left`}>Name</th>
                    <th className={head}>FA-01</th>
                    <th className={head}>FA-02</th>
                    <th className={head}>SA-01</th>
                    <th className={head}>FA-03</th>
                    <th className={head}>FA-04</th>
                    <th className={head}>SA-02</th>
                    <th className={head}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const m = row.partB[si];
                    return (
                      <tr key={row.enrollmentId} className="bg-white odd:bg-white even:bg-sky-50/60">
                        <td className={cell}>{row.rollNo}</td>
                        <td className={`${cell} ${sticky}`}>{row.name}</td>
                        <td className={cell}>
                          <Mark value={m?.fa01} />
                        </td>
                        <td className={cell}>
                          <Mark value={m?.fa02} />
                        </td>
                        <td className={cell}>
                          <Mark value={m?.sa01} />
                        </td>
                        <td className={cell}>
                          <Mark value={m?.fa03} />
                        </td>
                        <td className={cell}>
                          <Mark value={m?.fa04} />
                        </td>
                        <td className={cell}>
                          <Mark value={m?.sa02} />
                        </td>
                        <td className={`${cell} font-bold text-[#0C2A5A]`}>
                          <Mark value={m?.total} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          ))}
        </>
      ) : null}
    </div>
  );
}

function CombinedExamTable({ rows, subjectCount }: { rows: StudentRow[]; subjectCount: number }) {
  const faMax = FA_MAX * subjectCount;
  const saMax = SA_MAX * subjectCount;
  const yearMax = faMax * 4 + saMax * 2;

  return (
    <section className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <h4 className="border-b px-4 py-3 text-lg font-semibold text-[#0C2A5A]">
        Combined totals · all subjects
        <span className="ml-2 text-sm font-normal text-slate-500">
          FA max {faMax} · SA max {saMax} · year max {yearMax}
        </span>
      </h4>
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className={`${head} w-12`}>Roll</th>
            <th className={`${head} min-w-[9rem] text-left`}>Name</th>
            <th className={head}>
              FA-I
              <span className="block text-[10px] font-normal text-sky-100">/ {faMax}</span>
            </th>
            <th className={head}>
              FA-II
              <span className="block text-[10px] font-normal text-sky-100">/ {faMax}</span>
            </th>
            <th className={head}>
              SA-I
              <span className="block text-[10px] font-normal text-sky-100">/ {saMax}</span>
            </th>
            <th className={head}>
              FA-III
              <span className="block text-[10px] font-normal text-sky-100">/ {faMax}</span>
            </th>
            <th className={head}>
              FA-IV
              <span className="block text-[10px] font-normal text-sky-100">/ {faMax}</span>
            </th>
            <th className={head}>
              SA-II
              <span className="block text-[10px] font-normal text-sky-100">/ {saMax}</span>
            </th>
            <th className={head}>
              Combined
              <span className="block text-[10px] font-normal text-sky-100">/ {yearMax}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const fa1 = examSum(row, "fa1");
            const fa2 = examSum(row, "fa2");
            const sa1 = examSum(row, "sa1");
            const fa3 = examSum(row, "fa3");
            const fa4 = examSum(row, "fa4");
            const sa2 = examSum(row, "sa2");
            const combined = sumMarks([fa1, fa2, sa1, fa3, fa4, sa2]);
            return (
              <tr key={row.enrollmentId} className="bg-white odd:bg-white even:bg-sky-50/60">
                <td className={cell}>{row.rollNo}</td>
                <td className={`${cell} ${sticky}`}>{row.name}</td>
                <td className={`${cell} font-semibold`}>
                  <Mark value={fa1} />
                </td>
                <td className={`${cell} font-semibold`}>
                  <Mark value={fa2} />
                </td>
                <td className={`${cell} font-semibold`}>
                  <Mark value={sa1} />
                </td>
                <td className={`${cell} font-semibold`}>
                  <Mark value={fa3} />
                </td>
                <td className={`${cell} font-semibold`}>
                  <Mark value={fa4} />
                </td>
                <td className={`${cell} font-semibold`}>
                  <Mark value={sa2} />
                </td>
                <td className={`${cell} text-base font-bold text-[#0C2A5A]`}>
                  <Mark value={combined} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function SummaryTable({
  classId,
  subjectsA,
  rows,
}: {
  classId: string;
  subjectsA: { id: string; name: string }[];
  rows: StudentRow[];
}) {
  return (
    <section className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <h4 className="border-b px-4 py-3 text-lg font-semibold text-[#0C2A5A]">All students · year totals</h4>
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className={`${head} w-10`}>Rank</th>
            <th className={`${head} w-12`}>Roll</th>
            <th className={`${head} min-w-[9rem] text-left`}>Name</th>
            {subjectsA.map((s) => (
              <th key={s.id} className={head}>
                {s.name}
                <span className="block text-[10px] font-normal text-sky-100">/ 100</span>
              </th>
            ))}
            <th className={head}>
              Grand
              <span className="block text-[10px] font-normal text-sky-100">/ 100</span>
            </th>
            <th className={head}>Grade</th>
            <th className={head}>Att S1</th>
            <th className={head}>Att S2</th>
            <th className={`${head} no-print`}>Card</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className={`${cell} p-4 text-slate-500`} colSpan={8 + subjectsA.length}>
                No students in this class.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.enrollmentId} className="bg-white odd:bg-white even:bg-sky-50/60">
                <td className={cell}>{dash(row.rank)}</td>
                <td className={cell}>{row.rollNo}</td>
                <td className={`${cell} ${sticky}`}>{row.name}</td>
                {row.partA.map((m, i) => (
                  <td key={subjectsA[i].id} className={`${cell} font-semibold`}>
                    <Mark value={m.total} />
                    {m.grade ? <span className="ml-1 text-[10px] font-normal text-slate-500">{m.grade}</span> : null}
                  </td>
                ))}
                <td className={`${cell} text-base font-bold text-[#0C2A5A]`}>
                  <Mark value={row.grand} />
                </td>
                <td className={`${cell} font-bold text-[#0C2A5A]`}>
                  <Mark value={row.grade} />
                </td>
                <td className={cell}>{row.attS1 != null ? `${row.attS1}%` : "–"}</td>
                <td className={cell}>{row.attS2 != null ? `${row.attS2}%` : "–"}</td>
                <td className={`${cell} no-print`}>
                  <Link href={`/principal/classes/${classId}/students/${row.studentId}`} className="text-xs text-sky-800 underline">
                    Preview
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}

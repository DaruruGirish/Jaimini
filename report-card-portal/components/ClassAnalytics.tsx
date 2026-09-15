"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartFrame from "./ChartFrame";
import { PASS_MARK } from "@/lib/grades";
import type { AnalyticsSnapshot } from "@/lib/class-analytics";
import type { PartAKey } from "@/lib/mark-fields";

const COLORS: Record<string, string> = {
  "A+": "#0C2A5A",
  A: "#1d4f9a",
  "B+": "#0284c7",
  B: "#38bdf8",
  C: "#10b981",
  D: "#f59e0b",
  E: "#ef4444",
};

function Card({
  title,
  value,
  hint,
  tone = "navy",
}: {
  title: string;
  value: string;
  hint?: string;
  tone?: "navy" | "green" | "amber" | "red";
}) {
  const tones = {
    navy: "text-[#0C2A5A]",
    green: "text-emerald-700",
    amber: "text-amber-700",
    red: "text-red-600",
  };
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
      <p className={`mt-1 text-2xl font-bold ${tones[tone]}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

type ViewId = "year" | PartAKey;

export default function ClassAnalytics({
  year,
  exams,
}: {
  year: AnalyticsSnapshot;
  exams: AnalyticsSnapshot[];
}) {
  const [view, setView] = useState<ViewId>("year");
  const views = [{ id: "year" as const, label: year.label }, ...exams.map((exam) => ({ id: exam.id as ViewId, label: exam.label }))];
  const data = view === "year" ? year : exams.find((exam) => exam.id === view) ?? year;
  const isYear = data.id === "year";
  const avg = data.classAveragePercent;
  const gaugeColor = avg == null ? "#94a3b8" : avg >= 70 ? "#10b981" : avg >= PASS_MARK ? "#f59e0b" : "#ef4444";
  const gaugeData = [
    { name: "Average", value: avg ?? 0, fill: gaugeColor },
    { name: "Rest", value: Math.max(0, 100 - (avg ?? 0)), fill: "#e2e8f0" },
  ];
  const subjectHint = isYear
    ? "Which subjects perform well or poorly · out of 100"
    : `Which subjects perform well or poorly · ${data.label} as % of ${data.markMax}`;
  const topHint = isYear
    ? "Highest grand totals in this class · out of 100"
    : `Highest ${data.label} totals · out of ${data.scoreMax}`;
  const gaugeHint = isYear
    ? "Overall class performance (grand total / 100)"
    : `Class performance using ${data.label} marks only`;

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-[#0C2A5A]">Choose analytics</p>
        <p className="mt-1 text-xs text-slate-500">
          Whole academic year keeps the current charts. Pick an exam to see the same format using only that exam’s marks.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {views.map((option) => (
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          title="Class average"
          value={avg == null ? "–" : `${avg}%`}
          hint={`${data.gradedCount} of ${data.studentCount} students with marks`}
        />
        <Card
          title="Pass rate"
          value={data.passPercent == null ? "–" : `${data.passPercent}%`}
          hint={`${data.passCount} pass · ${data.failCount} fail · pass mark ${PASS_MARK}%`}
          tone={data.passPercent == null ? "navy" : data.passPercent >= 70 ? "green" : data.passPercent >= PASS_MARK ? "amber" : "red"}
        />
        <Card
          title="Highest subject average"
          value={data.highestSubject ? `${data.highestSubject.average}%` : "–"}
          hint={data.highestSubject?.subject ?? "No marks yet"}
          tone="green"
        />
        <Card
          title="Lowest subject average"
          value={data.lowestSubject ? `${data.lowestSubject.average}%` : "–"}
          hint={data.lowestSubject?.subject ?? "No marks yet"}
          tone="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-[#0C2A5A]">Average percentage of class</h3>
          <p className="mb-2 text-xs text-slate-500">{gaugeHint}</p>
          {avg == null ? (
            <p className="py-16 text-center text-sm text-slate-500">No marks yet</p>
          ) : (
            <ChartFrame height={220}>
              {({ width, height }) => (
                <PieChart width={width} height={height}>
                  <Pie
                    data={gaugeData}
                    dataKey="value"
                    startAngle={180}
                    endAngle={0}
                    cx="50%"
                    cy="78%"
                    innerRadius={72}
                    outerRadius={108}
                    stroke="none"
                  >
                    {gaugeData.map((row) => (
                      <Cell key={row.name} fill={row.fill} />
                    ))}
                  </Pie>
                  <text
                    x={width / 2}
                    y={height * 0.72}
                    textAnchor="middle"
                    fill="#0C2A5A"
                    fontSize={28}
                    fontWeight={700}
                  >
                    {avg}%
                  </text>
                  <text x={width / 2} y={height * 0.84} textAnchor="middle" fill="#64748b" fontSize={12}>
                    class average
                  </text>
                </PieChart>
              )}
            </ChartFrame>
          )}
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-[#0C2A5A]">Top 5 performers</h3>
          <p className="mb-3 text-xs text-slate-500">{topHint}</p>
          {data.topPerformers.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">No marks yet</p>
          ) : (
            <ol className="space-y-2">
              {data.topPerformers.map((row) => (
                <li
                  key={`${row.rank}-${row.rollNo}`}
                  className="flex items-center gap-3 rounded-lg bg-sky-50/80 px-3 py-2"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0C2A5A] text-sm font-bold text-white">
                    {row.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[#0C2A5A]">{row.name}</p>
                    <p className="text-xs text-slate-500">Roll {row.rollNo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#0C2A5A]">{row.grand}</p>
                    <p className="text-xs font-semibold text-slate-500">{row.grade ?? "–"}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-[#0C2A5A]">Average total marks by subject</h3>
          <p className="mb-2 text-xs text-slate-500">{subjectHint}</p>
          <ChartFrame>
            {({ width, height }) => (
              <BarChart width={width} height={height} data={data.subjectAverages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={56} />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(v) => [isYear ? `${v} / 100` : `${v}%`, "Average"]} />
                <Bar dataKey="average" name="Average">
                  {data.subjectAverages.map((row) => (
                    <Cell key={row.subject} fill={row.average < PASS_MARK ? "#ef4444" : "#1d4f9a"} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ChartFrame>
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-[#0C2A5A]">Grade distribution</h3>
          <p className="mb-2 text-xs text-slate-500">A+ to E composition of the class</p>
          {data.gradePercents.length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-500">No grades yet</p>
          ) : (
            <ChartFrame>
              {({ width, height }) => (
                <PieChart width={width} height={height}>
                  <Pie
                    data={data.gradePercents}
                    dataKey="percent"
                    nameKey="grade"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={90}
                    label={({ grade, percent }) => `${grade} ${percent}%`}
                  >
                    {data.gradePercents.map((row) => (
                      <Cell key={row.grade} fill={COLORS[row.grade] ?? "#64748b"} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(_value, _name, item) => {
                      const row = item?.payload as { percent: number; count: number };
                      return [`${row.percent}% (${row.count} students)`, "Share"];
                    }}
                  />
                  <Legend />
                </PieChart>
              )}
            </ChartFrame>
          )}
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-[#0C2A5A]">Number of students by grade</h3>
          <p className="mb-2 text-xs text-slate-500">Exact headcount in each grade</p>
          <ChartFrame>
            {({ width, height }) => (
              <BarChart width={width} height={height} data={data.gradeCounts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="grade" />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(v) => [`${v} students`, "Count"]} />
                <Bar dataKey="count" name="Students">
                  {data.gradeCounts.map((row) => (
                    <Cell key={row.grade} fill={COLORS[row.grade] ?? "#64748b"} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ChartFrame>
        </section>

        {data.termBySubject ? (
          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-[#0C2A5A]">Term 1 vs Term 2 by subject</h3>
            <p className="mb-2 text-xs text-slate-500">Term movement by subject · each term / 50</p>
            <ChartFrame>
              {({ width, height }) => (
                <BarChart width={width} height={height} data={data.termBySubject ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 50]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="term1" fill="#0C2A5A" name="Term 1 / 50" />
                  <Bar dataKey="term2" fill="#38bdf8" name="Term 2 / 50" />
                </BarChart>
              )}
            </ChartFrame>
          </section>
        ) : null}

        {data.attendance ? (
          <section className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-[#0C2A5A]">Average attendance</h3>
            <p className="mb-2 text-xs text-slate-500">Present % by semester</p>
            <ChartFrame>
              {({ width, height }) => (
                <BarChart width={width} height={height} data={data.attendance ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="semester" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(v) => [`${v}%`, "Attendance"]} />
                  <Bar dataKey="percent" fill="#10b981" name="Present %" />
                </BarChart>
              )}
            </ChartFrame>
          </section>
        ) : null}
      </div>
    </div>
  );
}

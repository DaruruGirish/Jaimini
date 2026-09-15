import { gradeFromPercent, PASS_MARK } from "@/lib/grades";
import { PART_A_EXAMS, type PartAKey } from "@/lib/mark-fields";

export type AnalyticsStudent = {
  enrollmentId: string;
  rollNo: number;
  name: string;
  grand: number | null;
  grade: string | null;
  attS1: number | null;
  attS2: number | null;
  partA: {
    fa1: number | null;
    fa2: number | null;
    sa1: number | null;
    fa3: number | null;
    fa4: number | null;
    sa2: number | null;
    t1: number | null;
    t2: number | null;
    total: number | null;
  }[];
};

export type AnalyticsSnapshot = {
  id: "year" | PartAKey;
  label: string;
  scoreMax: number;
  markMax: number;
  studentCount: number;
  gradedCount: number;
  classAveragePercent: number | null;
  passCount: number;
  failCount: number;
  passPercent: number | null;
  highestSubject: { subject: string; average: number } | null;
  lowestSubject: { subject: string; average: number } | null;
  subjectAverages: { subject: string; average: number; n: number }[];
  gradePercents: { grade: string; percent: number; count: number }[];
  gradeCounts: { grade: string; count: number; percent: number }[];
  topPerformers: { rank: number; name: string; rollNo: number; grand: number; grade: string | null }[];
  termBySubject: { subject: string; term1: number; term2: number }[] | null;
  attendance: { semester: string; percent: number }[] | null;
};

const GRADE_ORDER = ["A+", "A", "B+", "B", "C", "D", "E"];

function mean(arr: number[]) {
  return arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;
}

function gradeTables(grades: (string | null)[]) {
  const graded = grades.filter((g): g is string => Boolean(g));
  const gradeCounts = GRADE_ORDER.map((grade) => {
    const count = graded.filter((g) => g === grade).length;
    const percent = graded.length ? Math.round((count / graded.length) * 100) : 0;
    return { grade, count, percent };
  });
  return { gradeCounts, gradePercents: gradeCounts.filter((g) => g.count > 0), gradedCount: graded.length };
}

function subjectRank(subjectAverages: { subject: string; average: number; n: number }[]) {
  const ranked = [...subjectAverages].filter((s) => s.n > 0).sort((a, b) => b.average - a.average);
  return {
    highestSubject: ranked[0] ?? null,
    lowestSubject: ranked.length ? ranked[ranked.length - 1] : null,
  };
}

export function yearAnalytics(
  rows: AnalyticsStudent[],
  subjectsA: { id: string; name: string }[]
): AnalyticsSnapshot {
  const subjectAverages = subjectsA.map((s, i) => {
    const vals = rows.map((r) => r.partA[i]?.total).filter((v): v is number => v != null);
    const average = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
    return { subject: s.name, average, n: vals.length };
  });
  const termBySubject = subjectsA.map((s, i) => {
    const t1s = rows.map((r) => r.partA[i]?.t1).filter((v): v is number => v != null);
    const t2s = rows.map((r) => r.partA[i]?.t2).filter((v): v is number => v != null);
    return { subject: s.name, term1: mean(t1s), term2: mean(t2s) };
  });
  const grands = rows.map((r) => r.grand).filter((v): v is number => v != null);
  const { gradeCounts, gradePercents, gradedCount } = gradeTables(rows.map((r) => r.grade));
  const passCount = grands.filter((v) => v >= PASS_MARK).length;
  const failCount = grands.filter((v) => v < PASS_MARK).length;
  const ranked = [...rows].sort((a, b) => (b.grand ?? -1) - (a.grand ?? -1));
  const attS1 = rows.map((r) => r.attS1).filter((v): v is number => v != null);
  const attS2 = rows.map((r) => r.attS2).filter((v): v is number => v != null);

  return {
    id: "year",
    label: "Whole academic year",
    scoreMax: 100,
    markMax: 100,
    studentCount: rows.length,
    gradedCount,
    classAveragePercent: grands.length ? mean(grands) : null,
    passCount,
    failCount,
    passPercent: grands.length ? Math.round((passCount / grands.length) * 100) : null,
    ...subjectRank(subjectAverages),
    subjectAverages,
    gradePercents,
    gradeCounts,
    topPerformers: ranked
      .filter((r): r is typeof r & { grand: number } => r.grand != null)
      .slice(0, 5)
      .map((r, i) => ({
        rank: i + 1,
        name: r.name,
        rollNo: r.rollNo,
        grand: r.grand,
        grade: r.grade,
      })),
    termBySubject,
    attendance: [
      { semester: "Semester 1", percent: mean(attS1) },
      { semester: "Semester 2", percent: mean(attS2) },
    ],
  };
}

export function examAnalytics(
  rows: AnalyticsStudent[],
  subjectsA: { id: string; name: string }[],
  exam: (typeof PART_A_EXAMS)[number]
): AnalyticsSnapshot {
  const nSub = subjectsA.length || 1;
  const scoreMax = exam.max * nSub;
  const subjectAverages = subjectsA.map((s, i) => {
    const vals = rows.map((r) => r.partA[i]?.[exam.key]).filter((v): v is number => v != null);
    const average = vals.length ? mean(vals.map((v) => (v / exam.max) * 100)) : 0;
    return { subject: s.name, average, n: vals.length };
  });
  const scored = rows.map((row) => {
    const vals = row.partA.map((m) => m[exam.key]).filter((v): v is number => v != null);
    if (!vals.length) return { ...row, examTotal: null as number | null, percent: null as number | null, examGrade: null as string | null };
    const examTotal = vals.reduce((a, b) => a + b, 0);
    const percent = Math.round((examTotal / scoreMax) * 1000) / 10;
    return { ...row, examTotal, percent, examGrade: gradeFromPercent(percent) };
  });
  const percents = scored.map((r) => r.percent).filter((v): v is number => v != null);
  const { gradeCounts, gradePercents, gradedCount } = gradeTables(scored.map((r) => r.examGrade));
  const passCount = percents.filter((v) => v >= PASS_MARK).length;
  const failCount = percents.filter((v) => v < PASS_MARK).length;
  const ranked = [...scored].sort((a, b) => (b.examTotal ?? -1) - (a.examTotal ?? -1));

  return {
    id: exam.key,
    label: exam.label,
    scoreMax,
    markMax: exam.max,
    studentCount: rows.length,
    gradedCount,
    classAveragePercent: percents.length ? mean(percents) : null,
    passCount,
    failCount,
    passPercent: percents.length ? Math.round((passCount / percents.length) * 100) : null,
    ...subjectRank(subjectAverages),
    subjectAverages,
    gradePercents,
    gradeCounts,
    topPerformers: ranked
      .filter((r): r is typeof r & { examTotal: number } => r.examTotal != null)
      .slice(0, 5)
      .map((r, i) => ({
        rank: i + 1,
        name: r.name,
        rollNo: r.rollNo,
        grand: r.examTotal,
        grade: r.examGrade,
      })),
    termBySubject: null,
    attendance: null,
  };
}

export function buildClassCharts(rows: AnalyticsStudent[], subjectsA: { id: string; name: string }[]) {
  return {
    year: yearAnalytics(rows, subjectsA),
    exams: PART_A_EXAMS.map((exam) => examAnalytics(rows, subjectsA, exam)),
  };
}

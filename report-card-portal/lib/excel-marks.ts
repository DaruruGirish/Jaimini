import * as XLSX from "xlsx";
import { PART_A_EXAMS, PART_B_EXAMS, A_TO_B, B_TO_A, type PartAKey, type PartBKey, type PartAMarks, type PartBMarks } from "@/lib/mark-fields";
import { EXAM_META, type SingleExam } from "@/lib/exams";
import { FA_MAX, SA_MAX } from "@/lib/grades";

export type ExcelStudent = {
  enrollmentId: string;
  rollNo: number;
  name: string;
  remarks: string;
  attendanceWorkS1: number | string;
  attendancePresentS1: number | string;
  attendanceWorkS2: number | string;
  attendancePresentS2: number | string;
  cells: Record<string, Partial<PartAMarks>>;
  partB: Record<string, Partial<PartBMarks>>;
};

export type ParsedImport = {
  students: {
    rollNo: number | null;
    name: string;
    partA: Record<string, Partial<PartAMarks>>;
    partB: Record<string, Partial<PartBMarks>>;
    remarks?: string;
    attendanceWorkS1?: number | null;
    attendancePresentS1?: number | null;
    attendanceWorkS2?: number | null;
    attendancePresentS2?: number | null;
  }[];
  errors: string[];
};

function normalize(s: string) {
  return s.toLowerCase().replace(/\(.*?\)/g, "").replace(/[_/\-]+/g, " ").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

const A_ALIASES: Record<string, PartAKey> = {
  "fa i": "fa1",
  fai: "fa1",
  fa1: "fa1",
  "fa 1": "fa1",
  "fa ii": "fa2",
  faii: "fa2",
  fa2: "fa2",
  "fa 2": "fa2",
  "sa i": "sa1",
  sai: "sa1",
  sa1: "sa1",
  "sa 1": "sa1",
  "fa iii": "fa3",
  faiii: "fa3",
  fa3: "fa3",
  "fa 3": "fa3",
  "fa iv": "fa4",
  faiv: "fa4",
  fa4: "fa4",
  "fa 4": "fa4",
  "sa ii": "sa2",
  saii: "sa2",
  sa2: "sa2",
  "sa 2": "sa2",
};

const B_ALIASES: Record<string, PartBKey> = {
  "fa 01": "fa01",
  fa01: "fa01",
  "fa-01": "fa01",
  "fa 02": "fa02",
  fa02: "fa02",
  "sa 01": "sa01",
  sa01: "sa01",
  "fa 03": "fa03",
  fa03: "fa03",
  "fa 04": "fa04",
  fa04: "fa04",
  "sa 02": "sa02",
  sa02: "sa02",
};

function matchSubject(raw: string, names: string[]) {
  const n = normalize(raw);
  for (const name of names) {
    if (normalize(name) === n) return name;
  }
  for (const name of names) {
    const nn = normalize(name);
    if (n.includes(nn) || nn.includes(n)) return name;
  }
  if (n === "science" || n === "evs") {
    return names.find((s) => normalize(s).includes("science") || normalize(s).includes("evs")) ?? null;
  }
  return null;
}

function findAttendanceCol(norm: string[], type: "work" | "present", sem: 1 | 2) {
  const s = String(sem);
  return norm.findIndex((h) => {
    const hasSem =
      h.includes(`s${s}`) ||
      h.includes(`semester ${s}`) ||
      h.includes(`sem ${s}`) ||
      h.includes(`term ${s}`) ||
      h.endsWith(` ${s}`);
    if (!hasSem) return false;
    if (type === "work") return (h.includes("work") || h.includes("working")) && !h.includes("present");
    return h.includes("present") || h.includes("attended");
  });
}

function parseExam(rest: string): { part: "A" | "B"; key: PartAKey | PartBKey } | null {
  const n = normalize(rest);
  if (A_ALIASES[n]) return { part: "A", key: A_ALIASES[n] };
  if (B_ALIASES[n]) return { part: "B", key: B_ALIASES[n] };
  return null;
}

function parseHeader(header: string, subjectsA: string[], subjectsB: string[]) {
  const n = normalize(header);
  if (["roll", "roll no", "roll number", "student", "name", "student name"].includes(n)) return null;
  const all = [...subjectsA, ...subjectsB].sort((a, b) => b.length - a.length);
  for (const sub of all) {
    const sn = normalize(sub);
    if (n === sn) return null;
    if (n.startsWith(sn + " ") || n.endsWith(" " + sn)) {
      const rest = n.replace(sn, "").trim();
      const exam = parseExam(rest);
      if (exam) return { subject: sub, ...exam };
    }
  }
  return null;
}

function assignMark(
  rec: ParsedImport["students"][number],
  subject: string,
  exam: { part: "A" | "B"; key: PartAKey | PartBKey },
  val: number,
  subjectsA: string[],
  subjectsB: string[]
) {
  if (subjectsB.includes(subject)) {
    const key = exam.part === "B" ? (exam.key as PartBKey) : A_TO_B[exam.key as PartAKey];
    rec.partB[subject] = { ...rec.partB[subject], [key]: val };
    return;
  }
  if (subjectsA.includes(subject)) {
    const key = exam.part === "A" ? (exam.key as PartAKey) : B_TO_A[exam.key as PartBKey];
    rec.partA[subject] = { ...rec.partA[subject], [key]: val };
  }
}

function parseNumber(v: unknown): number | null | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

function ensureStudent(map: Map<string, ParsedImport["students"][number]>, roll: number | null, name: string) {
  const key = `${roll ?? ""}|${normalize(name)}`;
  const existing = map.get(key);
  if (existing) return existing;
  const row: ParsedImport["students"][number] = { rollNo: roll, name, partA: {}, partB: {} };
  map.set(key, row);
  return row;
}

function parseSheet(
  rows: unknown[][],
  subjectsA: string[],
  subjectsB: string[],
  map: Map<string, ParsedImport["students"][number]>,
  errors: string[],
  partHint?: "A" | "B"
) {
  if (!rows.length) return;
  const header = rows[0].map((h) => String(h ?? "").trim());
  const norm = header.map(normalize);
  const rollIdx = norm.findIndex((h) => h === "roll" || h === "roll no" || h === "roll number");
  const nameIdx = norm.findIndex((h) => h === "student" || h === "name" || h === "student name");
  const subjectIdx = norm.findIndex((h) => h === "subject");
  if (nameIdx < 0 && rollIdx < 0) {
    errors.push("A sheet is missing Roll or Student columns.");
    return;
  }

  if (subjectIdx >= 0) {
    const examCols = header
      .map((h, i) => ({ i, exam: parseExam(h) }))
      .filter((c): c is { i: number; exam: { part: "A" | "B"; key: PartAKey | PartBKey } } => c.exam != null);
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const name = String(row[nameIdx] ?? "").trim();
      const roll = rollIdx >= 0 ? parseNumber(row[rollIdx]) ?? null : null;
      if (!name && roll == null) continue;
      const subjectRaw = String(row[subjectIdx] ?? "").trim();
      const subject = matchSubject(subjectRaw, [...subjectsA, ...subjectsB]);
      if (!subject) {
        if (subjectRaw) errors.push(`Unknown subject "${subjectRaw}" (row ${r + 1}).`);
        continue;
      }
      const rec = ensureStudent(map, roll, name);
      for (const col of examCols) {
        const val = parseNumber(row[col.i]);
        if (val === undefined) continue;
        assignMark(rec, subject, col.exam, val, subjectsA, subjectsB);
      }
    }
    return;
  }

  const mapped = header.map((h, i) => ({ i, parsed: parseHeader(h, subjectsA, subjectsB) }));
  const remarksIdx = norm.findIndex((h) => h === "remarks" || h === "remark");
  const att = {
    workS1: findAttendanceCol(norm, "work", 1),
    presentS1: findAttendanceCol(norm, "present", 1),
    workS2: findAttendanceCol(norm, "work", 2),
    presentS2: findAttendanceCol(norm, "present", 2),
  };

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const name = nameIdx >= 0 ? String(row[nameIdx] ?? "").trim() : "";
    const roll = rollIdx >= 0 ? parseNumber(row[rollIdx]) ?? null : null;
    if (!name && roll == null) continue;
    const rec = ensureStudent(map, roll, name || `Roll ${roll}`);
    if (remarksIdx >= 0 && row[remarksIdx] != null) rec.remarks = String(row[remarksIdx]);
    if (att.workS1 >= 0) rec.attendanceWorkS1 = parseNumber(row[att.workS1]) ?? rec.attendanceWorkS1;
    if (att.presentS1 >= 0) rec.attendancePresentS1 = parseNumber(row[att.presentS1]) ?? rec.attendancePresentS1;
    if (att.workS2 >= 0) rec.attendanceWorkS2 = parseNumber(row[att.workS2]) ?? rec.attendanceWorkS2;
    if (att.presentS2 >= 0) rec.attendancePresentS2 = parseNumber(row[att.presentS2]) ?? rec.attendancePresentS2;
    for (const col of mapped) {
      if (!col.parsed) continue;
      const val = parseNumber(row[col.i]);
      if (val === undefined) continue;
      if (partHint === "A" && subjectsB.includes(col.parsed.subject)) continue;
      if (partHint === "B" && subjectsA.includes(col.parsed.subject)) continue;
      assignMark(rec, col.parsed.subject, col.parsed, val, subjectsA, subjectsB);
    }
  }
}

export function parseMarksWorkbook(
  data: ArrayBuffer,
  subjectsA: { name: string }[],
  subjectsB: { name: string }[]
): ParsedImport {
  const wb = XLSX.read(data, { type: "array" });
  const map = new Map<string, ParsedImport["students"][number]>();
  const errors: string[] = [];
  const aNames = subjectsA.map((s) => s.name);
  const bNames = subjectsB.map((s) => s.name);
  for (const sheetName of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<(string | number)[]>(wb.Sheets[sheetName], { header: 1, defval: "" });
    const hint = /part\s*b/i.test(sheetName) ? "B" : /part\s*a|marks/i.test(sheetName) ? "A" : undefined;
    if (/instruction|how to/i.test(sheetName)) continue;
    parseSheet(rows, aNames, bNames, map, errors, hint);
  }
  return { students: [...map.values()], errors };
}

export function buildMarksTemplate(
  students: ExcelStudent[],
  subjectsA: { id: string; name: string }[],
  subjectsB: { id: string; name: string }[]
) {
  const wb = XLSX.utils.book_new();
  const aHeader = ["Roll", "Student", ...subjectsA.flatMap((s) => PART_A_EXAMS.map((e) => `${s.name} ${e.label}`))];
  const aRows = students.map((st) => [
    st.rollNo,
    st.name,
    ...subjectsA.flatMap((s) => PART_A_EXAMS.map((e) => st.cells[s.id]?.[e.key] ?? "")),
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([aHeader, ...aRows]), "Part A");

  const bHeader = ["Roll", "Student", ...subjectsB.flatMap((s) => PART_A_EXAMS.map((e) => `${s.name} ${e.label}`))];
  const bRows = students.map((st) => [
    st.rollNo,
    st.name,
    ...subjectsB.flatMap((s) => PART_B_EXAMS.map((e) => st.partB[s.id]?.[e.key] ?? "")),
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([bHeader, ...bRows]), "Part B");

  const attHeader = ["Roll", "Student", "Work S1", "Present S1", "Work S2", "Present S2", "Remarks"];
  const attRows = students.map((st) => [
    st.rollNo,
    st.name,
    st.attendanceWorkS1,
    st.attendancePresentS1,
    st.attendanceWorkS2,
    st.attendancePresentS2,
    st.remarks,
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([attHeader, ...attRows]), "Attendance");

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["How to use"],
      ["1. Keep student names and subject column titles as they are."],
      ["2. FA marks are out of 15. SA marks are out of 20."],
      ["3. Blank cells keep the marks already saved in the portal."],
      ["4. Match students by Roll number, or by the same name as in the class list."],
      ["5. Part B uses the same FA-I, FA-II, SA-I, FA-III, FA-IV, SA-II columns as Part A."],
      ["6. Fill the Attendance sheet with working days and present days for S1 and S2."],
      ["7. Upload this file on Enter marks — Part A, Part B and attendance save automatically."],
    ]),
    "Instructions"
  );
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as Uint8Array;
}

function writeWorkbook(wb: XLSX.WorkBook) {
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as Uint8Array;
}

export function buildPartATemplate(
  students: ExcelStudent[],
  subjectsA: { id: string; name: string }[]
) {
  const wb = XLSX.utils.book_new();
  const aHeader = ["Roll", "Student", ...subjectsA.flatMap((s) => PART_A_EXAMS.map((e) => `${s.name} ${e.label}`))];
  const aRows = students.map((st) => [
    st.rollNo,
    st.name,
    ...subjectsA.flatMap((s) => PART_A_EXAMS.map((e) => st.cells[s.id]?.[e.key] ?? "")),
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([aHeader, ...aRows]), "Part A");
  return writeWorkbook(wb);
}

export function buildPartBTemplate(
  students: ExcelStudent[],
  subjectsB: { id: string; name: string }[]
) {
  const wb = XLSX.utils.book_new();
  const bHeader = ["Roll", "Student", ...subjectsB.flatMap((s) => PART_A_EXAMS.map((e) => `${s.name} ${e.label}`))];
  const bRows = students.map((st) => [
    st.rollNo,
    st.name,
    ...subjectsB.flatMap((s) => PART_B_EXAMS.map((e) => st.partB[s.id]?.[e.key] ?? "")),
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([bHeader, ...bRows]), "Part B");
  return writeWorkbook(wb);
}

export function buildAttendanceTemplate(students: ExcelStudent[]) {
  const wb = XLSX.utils.book_new();
  const attHeader = ["Roll", "Student", "Work S1", "Present S1", "Work S2", "Present S2", "Remarks"];
  const attRows = students.map((st) => [
    st.rollNo,
    st.name,
    st.attendanceWorkS1,
    st.attendancePresentS1,
    st.attendanceWorkS2,
    st.attendancePresentS2,
    st.remarks,
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([attHeader, ...attRows]), "Attendance");
  return writeWorkbook(wb);
}

export function matchImportedStudent(
  row: ParsedImport["students"][number],
  students: { enrollmentId: string; rollNo: number; name: string }[]
) {
  if (row.rollNo != null) {
    const byRoll = students.find((s) => s.rollNo === row.rollNo);
    if (byRoll) return byRoll;
  }
  const n = normalize(row.name);
  const exact = students.filter((s) => normalize(s.name) === n);
  if (exact.length === 1) return exact[0];
  return null;
}

export type ExamSubject = { id: string; name: string; part: "A" | "B" };

export function examTemplateHeaders(subjects: { name: string }[]) {
  return ["RollNo", "Name", ...subjects.map((s) => s.name), "Remarks"];
}

function trimRow(row: unknown[]) {
  const cells = row.map((c) => (c == null ? "" : String(c).trim()));
  while (cells.length && cells[cells.length - 1] === "") cells.pop();
  return cells;
}

function headersEqual(actual: string[], expected: string[]) {
  if (actual.length !== expected.length) return false;
  return actual.every((h, i) => h === expected[i]);
}

export function buildExamTemplate(
  students: ExcelStudent[],
  subjects: ExamSubject[],
  exam: SingleExam
) {
  const meta = EXAM_META[exam];
  const wb = XLSX.utils.book_new();
  const headers = examTemplateHeaders(subjects);
  const rows = students.map((st) => [
    st.rollNo,
    st.name,
    ...subjects.map((s) => {
      if (s.part === "A") return st.cells[s.id]?.[meta.partA] ?? "";
      return st.partB[s.id]?.[meta.partB] ?? "";
    }),
    st.remarks,
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([headers, ...rows]), exam);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["How to use"],
      [`This file is for ${meta.label} only.`],
      ["Keep row 1 headers exactly as downloaded. Do not add, remove or shuffle columns."],
      ["Match students by RollNo. Do not use Name as the key."],
      [`FA marks are 0–${FA_MAX}. SA marks are 0–${SA_MAX}. Blank means not entered.`],
      ["Upload on Enter marks. Valid rows save as draft. Publish still needs submit + Principal approve."],
    ]),
    "Instructions"
  );
  return writeWorkbook(wb);
}

export type ExamImportRow = {
  row: number;
  rollNo: number | null;
  name: string;
  error?: string;
  remarks?: string;
  cells: Record<string, Partial<PartAMarks>>;
  partB: Record<string, Partial<PartBMarks>>;
};

export type ExamImportResult = {
  fileError?: string;
  expectedHeaders: string[];
  actualHeaders: string[];
  rows: ExamImportRow[];
};

export function parseExamWorkbook(
  data: ArrayBuffer,
  subjects: ExamSubject[],
  exam: SingleExam,
  classStudents: { enrollmentId: string; rollNo: number; name: string }[]
): ExamImportResult {
  const meta = EXAM_META[exam];
  const expected = examTemplateHeaders(subjects);
  const expectedNoRemarks = expected.slice(0, -1);
  const wb = XLSX.read(data, { type: "array" });
  const sheetName = wb.SheetNames.find((n) => n !== "Instructions") ?? wb.SheetNames[0];
  if (!sheetName) {
    return { fileError: "The file has no worksheet.", expectedHeaders: expected, actualHeaders: [], rows: [] };
  }
  const raw = XLSX.utils.sheet_to_json<(string | number)[]>(wb.Sheets[sheetName], { header: 1, defval: "" });
  if (!raw.length) {
    return { fileError: "The file is empty. Row 1 must be the header.", expectedHeaders: expected, actualHeaders: [], rows: [] };
  }
  const actual = trimRow(raw[0] ?? []);
  const hasRemarks = headersEqual(actual, expected);
  const noRemarks = headersEqual(actual, expectedNoRemarks);
  if (!hasRemarks && !noRemarks) {
    return {
      fileError: `Column headers must match the template exactly: ${expected.join(" | ")}`,
      expectedHeaders: expected,
      actualHeaders: actual,
      rows: [],
    };
  }

  const byRoll = new Map(classStudents.map((s) => [s.rollNo, s]));
  const seen = new Set<number>();
  const max = meta.max;
  const rows: ExamImportRow[] = [];

  for (let r = 1; r < raw.length; r++) {
    const cells = trimRow(raw[r] ?? []);
    if (!cells.length) continue;
    const rollRaw = cells[0];
    const name = cells[1] ?? "";
    if (rollRaw === "" && name === "") continue;
    const rollNo = Number(rollRaw);
    const line: ExamImportRow = { row: r + 1, rollNo: Number.isFinite(rollNo) ? rollNo : null, name, cells: {}, partB: {} };

    if (!Number.isFinite(rollNo) || rollNo !== Math.trunc(rollNo)) {
      line.error = `Row ${r + 1}: RollNo must be a whole number.`;
      rows.push(line);
      continue;
    }
    if (seen.has(rollNo)) {
      line.error = `Row ${r + 1}: RollNo ${rollNo} is duplicated in this file.`;
      rows.push(line);
      continue;
    }
    seen.add(rollNo);
    const match = byRoll.get(rollNo);
    if (!match) {
      line.error = `Row ${r + 1}: RollNo ${rollNo} is not in this class.`;
      rows.push(line);
      continue;
    }

    const values = cells.slice(2, 2 + subjects.length);
    const remarks = hasRemarks ? cells[2 + subjects.length] ?? "" : undefined;
    let rowError = "";
    for (let i = 0; i < subjects.length; i++) {
      const rawVal = values[i] ?? "";
      if (rawVal === "") continue;
      const n = Number(rawVal);
      if (!Number.isFinite(n) || n !== Math.trunc(n)) {
        rowError = `Row ${r + 1}: "${subjects[i].name}" must be a whole number, or blank.`;
        break;
      }
      if (n < 0 || n > max) {
        rowError = `Row ${r + 1}: "${subjects[i].name}" must be 0–${max} for ${meta.label}.`;
        break;
      }
      const sub = subjects[i];
      if (sub.part === "A") {
        line.cells[sub.id] = { [meta.partA]: n };
      } else {
        line.partB[sub.id] = { [meta.partB]: n };
      }
    }
    if (rowError) {
      line.error = rowError;
      line.cells = {};
      line.partB = {};
      rows.push(line);
      continue;
    }
    if (remarks != null && remarks !== "") line.remarks = remarks;
    rows.push(line);
  }

  return { expectedHeaders: expected, actualHeaders: actual, rows };
}

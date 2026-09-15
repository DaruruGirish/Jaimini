import * as XLSX from "xlsx";

export type RosterRow = {
  rollNo: number | null;
  admissionNo: string;
  name: string;
  fatherName: string;
  motherName: string;
  parentMobile: string;
};

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function col(header: string[], aliases: string[]) {
  const n = header.map(normalize);
  return n.findIndex((h) => aliases.includes(h));
}

export function parseRosterWorkbook(data: ArrayBuffer): { rows: RosterRow[]; errors: string[] } {
  const wb = XLSX.read(data, { type: "array" });
  const errors: string[] = [];
  const rows: RosterRow[] = [];
  const seen = new Set<string>();
  for (const sheetName of wb.SheetNames) {
    if (/instruction|how to/i.test(sheetName)) continue;
    const table = XLSX.utils.sheet_to_json<(string | number)[]>(wb.Sheets[sheetName], { header: 1, defval: "" });
    if (!table.length) continue;
    const header = table[0].map((h) => String(h ?? "").trim());
    const rollIdx = col(header, ["roll", "roll no", "roll number"]);
    const admIdx = col(header, ["admission", "admission no", "admission number", "adm no"]);
    const nameIdx = col(header, ["name", "student", "student name"]);
    const fatherIdx = col(header, ["father", "father name", "fathers name"]);
    const motherIdx = col(header, ["mother", "mother name", "mothers name"]);
    const mobileIdx = col(header, ["parent mobile", "mobile", "phone", "parent phone", "parent no"]);
    if (nameIdx < 0 && admIdx < 0) {
      errors.push(`Sheet "${sheetName}" needs Name or Admission No columns.`);
      continue;
    }
    for (let i = 1; i < table.length; i++) {
      const row = table[i];
      const name = nameIdx >= 0 ? String(row[nameIdx] ?? "").trim() : "";
      const admissionNo = admIdx >= 0 ? String(row[admIdx] ?? "").trim() : "";
      const rollRaw = rollIdx >= 0 ? Number(row[rollIdx]) : NaN;
      const rollNo = Number.isFinite(rollRaw) && rollRaw > 0 ? rollRaw : null;
      if (!name && !admissionNo && rollNo == null) continue;
      if (!name || !admissionNo || rollNo == null) {
        errors.push(`Row ${i + 1}: name, admission no and roll no are required.`);
        continue;
      }
      const key = `${admissionNo.toLowerCase()}|${rollNo}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({
        rollNo,
        admissionNo,
        name,
        fatherName: fatherIdx >= 0 ? String(row[fatherIdx] ?? "").trim() : "",
        motherName: motherIdx >= 0 ? String(row[motherIdx] ?? "").trim() : "",
        parentMobile: mobileIdx >= 0 ? String(row[mobileIdx] ?? "").trim() : "",
      });
    }
  }
  return { rows, errors };
}

export function buildRosterTemplate(
  students: { rollNo: number; admissionNo: string; name: string; fatherName: string; motherName: string; parentMobile?: string }[]
) {
  const wb = XLSX.utils.book_new();
  const header = ["Roll", "Admission No", "Name", "Father", "Mother", "Parent Mobile"];
  const body = students.length
    ? students.map((s) => [s.rollNo, s.admissionNo, s.name, s.fatherName, s.motherName, s.parentMobile ?? ""])
    : [
        [1, "JPS-2026-001", "Example Student", "Father Name", "Mother Name", "9876543210"],
        [2, "JPS-2026-002", "Another Student", "Father Name", "Mother Name", "9876543211"],
      ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([header, ...body]), "Students");
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["How to use"],
      ["1. One row per student in this class."],
      ["2. Roll must be unique in the class."],
      ["3. Admission No must be unique in the school."],
      ["4. Upload this file on Students. New rows are added; matching admission numbers are updated."],
      ["5. Parent Mobile is required. Digits only. It is the student's first password."],
      ["6. Username is first 3 letters of first name + roll (Manvitha, roll 12 → man12)."],
      ["7. This is the class roster only. Marks and attendance use a separate Excel on Enter marks."],
    ]),
    "Instructions"
  );
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as Uint8Array;
}

function cellText(v: unknown) {
  if (v == null || v === "") return "";
  return String(v).trim();
}

export function parseTeacherWorkbook(data: ArrayBuffer): {
  rows: { name: string; email: string; password: string }[];
  errors: string[];
} {
  const wb = XLSX.read(data, { type: "array" });
  const errors: string[] = [];
  const rows: { name: string; email: string; password: string }[] = [];
  const seen = new Set<string>();
  for (const sheetName of wb.SheetNames) {
    if (/instruction|how to/i.test(sheetName)) continue;
    const table = XLSX.utils.sheet_to_json<(string | number)[]>(wb.Sheets[sheetName], { header: 1, defval: "" });
    if (!table.length) continue;
    const header = table[0].map((h) => String(h ?? "").trim());
    const nameIdx = col(header, ["name", "teacher", "teacher name"]);
    const emailIdx = col(header, ["email", "login", "username"]);
    const passIdx = col(header, ["password", "temp password", "temporary password"]);
    if (nameIdx < 0 || emailIdx < 0 || passIdx < 0) {
      errors.push(`Sheet "${sheetName}" needs Name, Email and Password columns.`);
      continue;
    }
    for (let i = 1; i < table.length; i++) {
      const row = table[i];
      const name = cellText(row[nameIdx]);
      const email = cellText(row[emailIdx]).toLowerCase();
      const password = cellText(row[passIdx]);
      if (!name && !email && !password) continue;
      if (!name || !email || !password) {
        errors.push(`Row ${i + 1}: name, email and password are required.`);
        continue;
      }
      if (seen.has(email)) continue;
      seen.add(email);
      rows.push({ name, email, password });
    }
  }
  return { rows, errors };
}

export function buildTeacherTemplate() {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["Name", "Email", "Password"],
      ["Example Teacher", "teacher-example@jaimini.edu", "teacher123"],
    ]),
    "Teachers"
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["How to use"],
      ["1. One row per class teacher."],
      ["2. Email becomes the login. It must be unique."],
      ["3. Password is the temporary password they use to sign in."],
      ["4. After upload, assign each teacher to a class on Classes."],
    ]),
    "Instructions"
  );
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as Uint8Array;
}

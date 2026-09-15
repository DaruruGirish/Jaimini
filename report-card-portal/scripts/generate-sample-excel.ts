import * as XLSX from "xlsx";
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const exams = ["FA-I", "FA-II", "SA-I", "FA-III", "FA-IV", "SA-II"];
const subjectsA = ["Kannada", "English", "Hindi", "Mathematics", "EVS/Science"];
const subjectsB = ["Computer Science", "Physical Education", "Drawing"];

function marksRow(seed: number, n: number, maxFa = 15, maxSa = 20) {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const isSa = exams[i % 6].startsWith("SA");
    const max = isSa ? maxSa : maxFa;
    out.push(Math.min(max, 8 + ((seed + i * 3) % (max - 7))));
  }
  return out;
}

function buildWorkbook(
  students: { roll: number; name: string; remarks: string; att: number[] }[]
) {
  const wb = XLSX.utils.book_new();
  const aHeader = ["Roll", "Student", ...subjectsA.flatMap((s) => exams.map((e) => `${s} ${e}`))];
  const aRows = students.map((st, i) => [st.roll, st.name, ...marksRow(i + 2, subjectsA.length * 6)]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([aHeader, ...aRows]), "Part A");

  const bHeader = ["Roll", "Student", ...subjectsB.flatMap((s) => exams.map((e) => `${s} ${e}`))];
  const bRows = students.map((st, i) => [st.roll, st.name, ...marksRow(i + 5, subjectsB.length * 6)]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([bHeader, ...bRows]), "Part B");

  const attHeader = ["Roll", "Student", "Work S1", "Present S1", "Work S2", "Present S2", "Remarks"];
  const attRows = students.map((st) => [st.roll, st.name, ...st.att, st.remarks]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([attHeader, ...attRows]), "Attendance");

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["How to use this sample"],
      ["1. This is fake test data. Replace names/marks later with real school data."],
      ["2. Keep the sheet names Part A, Part B and Attendance."],
      ["3. Keep Roll numbers matching the class in the portal."],
      ["4. FA columns are out of 15. SA columns are out of 20."],
      ["5. Part B uses the same FA-I / FA-II / SA-I / FA-III / FA-IV / SA-II column titles as Part A."],
      ["6. On Enter marks, click Upload Excel. Marks save automatically."],
    ]),
    "Instructions"
  );
  return wb;
}

const class10 = [
  { roll: 1, name: "Sneha G", remarks: "Sample remarks for Sneha.", att: [88, 80, 90, 82] },
  { roll: 4, name: "Vikram H", remarks: "Sample remarks for Vikram.", att: [88, 81, 90, 83] },
  { roll: 7, name: "Nisha T", remarks: "Sample remarks for Nisha.", att: [88, 82, 90, 84] },
  { roll: 9, name: "Rohan B", remarks: "Sample remarks for Rohan.", att: [88, 83, 90, 85] },
];

const class12 = [
  { roll: 1, name: "Arjun K", remarks: "Sample remarks for Arjun.", att: [90, 82, 92, 80] },
  { roll: 3, name: "Karthik N", remarks: "Sample remarks for Karthik.", att: [90, 84, 92, 86] },
  { roll: 5, name: "Diya S", remarks: "Sample remarks for Diya.", att: [90, 88, 92, 90] },
  { roll: 8, name: "Rahul M", remarks: "Sample remarks for Rahul.", att: [90, 70, 92, 74] },
  { roll: 12, name: "Manvitha R", remarks: "Sample remarks for Manvitha.", att: [90, 86, 92, 88] },
  { roll: 15, name: "Ananya P", remarks: "Sample remarks for Ananya.", att: [90, 85, 92, 87] },
];

const dir = join(dirname(fileURLToPath(import.meta.url)), "../public/samples");
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "sample-marks-10B.xlsx"), XLSX.write(buildWorkbook(class10), { type: "buffer", bookType: "xlsx" }));
writeFileSync(join(dir, "sample-marks-12A.xlsx"), XLSX.write(buildWorkbook(class12), { type: "buffer", bookType: "xlsx" }));

function rosterSheet(
  students: { roll: number; admissionNo: string; name: string; father: string; mother: string }[]
) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["Roll", "Admission No", "Name", "Father", "Mother"],
      ...students.map((s) => [s.roll, s.admissionNo, s.name, s.father, s.mother]),
    ]),
    "Students"
  );
  return wb;
}

writeFileSync(
  join(dir, "sample-students-10B.xlsx"),
  XLSX.write(
    rosterSheet([
      { roll: 1, admissionNo: "JPS-2024-101", name: "Sneha G", father: "Gopal G", mother: "Radha G" },
      { roll: 4, admissionNo: "JPS-2024-104", name: "Vikram H", father: "Harish H", mother: "Poornima H" },
      { roll: 7, admissionNo: "JPS-2024-107", name: "Nisha T", father: "Thimmappa T", mother: "Geetha T" },
      { roll: 9, admissionNo: "JPS-2024-109", name: "Rohan B", father: "Basavaraj B", mother: "Latha B" },
      { roll: 11, admissionNo: "JPS-2026-111", name: "Kavya L", father: "Lokesh L", mother: "Suma L" },
    ]),
    { type: "buffer", bookType: "xlsx" }
  )
);
writeFileSync(
  join(dir, "sample-students-12A.xlsx"),
  XLSX.write(
    rosterSheet([
      { roll: 1, admissionNo: "JPS-2024-001", name: "Arjun K", father: "Kiran K", mother: "Meena K" },
      { roll: 3, admissionNo: "JPS-2024-003", name: "Karthik N", father: "Nagaraj N", mother: "Sunitha N" },
      { roll: 5, admissionNo: "JPS-2024-005", name: "Diya S", father: "Suresh S", mother: "Anitha S" },
      { roll: 8, admissionNo: "JPS-2024-008", name: "Rahul M", father: "Mohan M", mother: "Kavitha M" },
      { roll: 12, admissionNo: "JPS-2024-012", name: "Manvitha R", father: "Ramesh B", mother: "Lakshmi R" },
      { roll: 15, admissionNo: "JPS-2024-015", name: "Ananya P", father: "Prakash P", mother: "Divya P" },
    ]),
    { type: "buffer", bookType: "xlsx" }
  )
);

const teachers = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(
  teachers,
  XLSX.utils.aoa_to_sheet([
    ["Name", "Email", "Password"],
    ["Sample Teacher 9-A", "teacher9a@jaimini.edu", "teacher123"],
    ["Sample Teacher 8-B", "teacher8b@jaimini.edu", "teacher123"],
  ]),
  "Teachers"
);
writeFileSync(join(dir, "sample-teachers.xlsx"), XLSX.write(teachers, { type: "buffer", bookType: "xlsx" }));

console.log("Wrote sample Excel files to public/samples");

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTeacher, teacherClass } from "@/lib/guards";
import { persistStudentMarks, type StudentMarksInput } from "@/lib/save-marks";
import { mobileDigits, provisionStudentLogin } from "@/lib/student-login";
import { EXAM_META, isSingleExam } from "@/lib/exams";
import { getClassSubjects } from "@/lib/class-subjects";

function parseMaybe(v: FormDataEntryValue | null) {
  if (v == null || String(v).trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function saveDraft(formData: FormData) {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return { error: "No class assigned" };

  const enrollmentId = String(formData.get("enrollmentId") ?? "");
  const enrollment = await prisma.enrollment.findFirst({
    where: { id: enrollmentId, classId: klass.id },
  });
  if (!enrollment) return { error: "Student not in your class" };

  const { a: subjectsA, b: subjectsB } = await getClassSubjects(klass.id);
  const result = await persistStudentMarks(
    klass.yearId,
    {
      enrollmentId,
      remarks: String(formData.get("remarks") ?? ""),
      attendanceWorkS1: parseMaybe(formData.get("attendanceWorkS1")),
      attendancePresentS1: parseMaybe(formData.get("attendancePresentS1")),
      attendanceWorkS2: parseMaybe(formData.get("attendanceWorkS2")),
      attendancePresentS2: parseMaybe(formData.get("attendancePresentS2")),
      cells: Object.fromEntries(
        subjectsA.map((sub) => [
          sub.id,
          {
            fa1: parseMaybe(formData.get(`${sub.id}-fa1`)),
            fa2: parseMaybe(formData.get(`${sub.id}-fa2`)),
            sa1: parseMaybe(formData.get(`${sub.id}-sa1`)),
            fa3: parseMaybe(formData.get(`${sub.id}-fa3`)),
            fa4: parseMaybe(formData.get(`${sub.id}-fa4`)),
            sa2: parseMaybe(formData.get(`${sub.id}-sa2`)),
          },
        ])
      ),
      partB: Object.fromEntries(
        subjectsB.map((sub) => [
          sub.id,
          {
            fa01: parseMaybe(formData.get(`${sub.id}-fa01`)),
            fa02: parseMaybe(formData.get(`${sub.id}-fa02`)),
            sa01: parseMaybe(formData.get(`${sub.id}-sa01`)),
            fa03: parseMaybe(formData.get(`${sub.id}-fa03`)),
            fa04: parseMaybe(formData.get(`${sub.id}-fa04`)),
            sa02: parseMaybe(formData.get(`${sub.id}-sa02`)),
          },
        ])
      ),
    },
    subjectsA,
    subjectsB
  );
  if (result.error) return { error: result.error };
  if (result.skipped) return { error: "This student’s card is approved. Ask the Principal to reject the class before you can edit." };
  revalidatePath("/teacher/marks");
  return { ok: true };
}

export async function saveClassMarks(payload: StudentMarksInput[]) {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return { error: "No class assigned" };
  const enrollments = await prisma.enrollment.findMany({ where: { classId: klass.id } });
  const allowed = new Set(enrollments.map((e) => e.id));
  const { a: subjectsA, b: subjectsB } = await getClassSubjects(klass.id);
  let saved = 0;
  let skipped = 0;
  for (const input of payload) {
    if (!allowed.has(input.enrollmentId)) return { error: "Student not in your class" };
    const result = await persistStudentMarks(klass.yearId, input, subjectsA, subjectsB);
    if (result.error) return { error: result.error };
    if (result.skipped) skipped += 1;
    else saved += 1;
  }
  revalidatePath("/teacher/marks");
  revalidatePath("/teacher");
  revalidatePath("/principal");
  revalidatePath("/principal/pending");
  return { ok: true, saved, skipped };
}

export async function submitClass() {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return { error: "No class assigned" };
  const enrollments = await prisma.enrollment.findMany({
    where: { classId: klass.id },
    include: { markSheets: true, student: true },
  });
  if (!enrollments.length) return { error: "No students" };

  const missing = enrollments.filter((enr) => !enr.markSheets.some((m) => m.yearId === klass.yearId));
  if (missing.length) {
    return { error: `Save marks for every student first. Missing: ${missing.map((e) => e.student.name).join(", ")}` };
  }
  if (enrollments.every((enr) => enr.markSheets.some((m) => m.yearId === klass.yearId && m.status === "APPROVED"))) {
    return { error: "This class is already approved." };
  }

  const submittedAt = new Date();
  for (const enr of enrollments) {
    const sheet = enr.markSheets.find((m) => m.yearId === klass.yearId)!;
    if (sheet.status === "APPROVED") continue;
    await prisma.markSheet.update({
      where: { id: sheet.id },
      data: { status: "SUBMITTED", submittedAt, rejectedReason: null },
    });
  }
  revalidatePath("/teacher");
  revalidatePath("/teacher/marks");
  revalidatePath("/teacher/print");
  revalidatePath("/principal");
  revalidatePath("/principal/pending");
  revalidatePath(`/principal/classes/${klass.id}`);
  return { ok: true };
}

export async function createStudent(formData: FormData) {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return { error: "No class assigned" };
  const name = String(formData.get("name") ?? "").trim();
  const admissionNo = String(formData.get("admissionNo") ?? "").trim();
  const fatherName = String(formData.get("fatherName") ?? "").trim();
  const motherName = String(formData.get("motherName") ?? "").trim();
  const parentMobile = String(formData.get("parentMobile") ?? "").trim();
  const photoUrl = String(formData.get("photoUrl") ?? "");
  const rollNo = Number(formData.get("rollNo"));
  if (!name || !admissionNo || !rollNo) return { error: "Name, admission no and roll no are required" };
  if (mobileDigits(parentMobile).length < 10) return { error: "Parent mobile is required (at least 10 digits)." };
  try {
    const student = await prisma.student.create({
      data: { name, admissionNo, fatherName, motherName, photoUrl, parentMobile: mobileDigits(parentMobile) },
    });
    await prisma.enrollment.create({
      data: { studentId: student.id, classId: klass.id, yearId: klass.yearId, rollNo },
    });
    const login = await provisionStudentLogin({ studentId: student.id, name, rollNo, parentMobile });
    if (login.error) return { error: login.error };
  } catch {
    return { error: "Admission no or roll no already used" };
  }
  revalidatePath("/teacher");
  revalidatePath("/teacher/students");
  revalidatePath("/teacher/marks");
  return { ok: true };
}

export async function importStudents(
  rows: { rollNo: number | null; admissionNo: string; name: string; fatherName: string; motherName: string; parentMobile: string }[]
) {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return { error: "No class assigned" };
  let saved = 0;
  const notes: string[] = [];
  for (const row of rows) {
    const name = row.name.trim();
    const admissionNo = row.admissionNo.trim();
    const rollNo = row.rollNo;
    const parentMobile = mobileDigits(row.parentMobile);
    if (!name || !admissionNo || rollNo == null) {
      notes.push(`Skipped a row without name, admission no or roll no.`);
      continue;
    }
    if (parentMobile.length < 10) {
      notes.push(`${name}: parent mobile is required (at least 10 digits).`);
      continue;
    }
    const rollTaken = await prisma.enrollment.findFirst({
      where: { classId: klass.id, rollNo, student: { admissionNo: { not: admissionNo } } },
    });
    if (rollTaken) {
      notes.push(`Roll ${rollNo} is already used.`);
      continue;
    }
    try {
      const existing = await prisma.student.findUnique({
        where: { admissionNo },
        include: { enrollments: { where: { yearId: klass.yearId } } },
      });
      if (existing) {
        const other = existing.enrollments.find((e) => e.classId !== klass.id);
        if (other) {
          notes.push(`${name} (${admissionNo}) is already in another class this year.`);
          continue;
        }
        await prisma.student.update({
          where: { id: existing.id },
          data: { name, fatherName: row.fatherName, motherName: row.motherName, parentMobile },
        });
        const mine = existing.enrollments.find((e) => e.classId === klass.id);
        if (mine) {
          await prisma.enrollment.update({ where: { id: mine.id }, data: { rollNo } });
        } else {
          await prisma.enrollment.create({
            data: { studentId: existing.id, classId: klass.id, yearId: klass.yearId, rollNo },
          });
        }
        const login = await provisionStudentLogin({ studentId: existing.id, name, rollNo, parentMobile });
        if (login.error) notes.push(`${name}: ${login.error}`);
      } else {
        const student = await prisma.student.create({
          data: { name, admissionNo, fatherName: row.fatherName, motherName: row.motherName, parentMobile },
        });
        await prisma.enrollment.create({
          data: { studentId: student.id, classId: klass.id, yearId: klass.yearId, rollNo },
        });
        const login = await provisionStudentLogin({ studentId: student.id, name, rollNo, parentMobile });
        if (login.error) notes.push(`${name}: ${login.error}`);
      }
      saved += 1;
    } catch {
      notes.push(`Could not save ${name} (${admissionNo}).`);
    }
  }
  revalidatePath("/teacher");
  revalidatePath("/teacher/students");
  revalidatePath("/teacher/marks");
  return { ok: true, saved, notes };
}

export async function updateStudent(_prev: { error?: string; ok?: boolean } | null, formData: FormData) {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return { error: "No class assigned" };
  const studentId = String(formData.get("studentId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const fatherName = String(formData.get("fatherName") ?? "").trim();
  const motherName = String(formData.get("motherName") ?? "").trim();
  const parentMobile = String(formData.get("parentMobile") ?? "").trim();
  const enrollment = await prisma.enrollment.findFirst({
    where: { classId: klass.id, studentId },
  });
  if (!enrollment || !name) return { error: "Student not in your class." };
  const login = await provisionStudentLogin({
    studentId,
    name,
    rollNo: enrollment.rollNo,
    parentMobile,
  });
  if (login.error) return { error: login.error };
  await prisma.student.update({
    where: { id: studentId },
    data: { name, fatherName, motherName, parentMobile: mobileDigits(parentMobile) },
  });
  revalidatePath("/teacher/students");
  return { ok: true };
}

export async function markGrievanceRead(formData: FormData) {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return { error: "No class assigned" };
  const id = String(formData.get("id") ?? "");
  const row = await prisma.grievance.findFirst({ where: { id, classId: klass.id } });
  if (!row) return { error: "Not found" };
  await prisma.grievance.update({
    where: { id },
    data: { status: "READ", readAt: row.readAt ?? new Date() },
  });
  revalidatePath("/teacher/notifications");
  return { ok: true };
}

export async function submitExam(exam: string) {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return { error: "No class assigned" };
  if (!isSingleExam(exam)) return { error: "Unknown exam" };
  const meta = EXAM_META[exam];
  const [enrollments, { a: subjectsA }] = await Promise.all([
    prisma.enrollment.findMany({
      where: { classId: klass.id },
      include: { student: true, markSheets: { include: { cells: true } } },
      orderBy: { rollNo: "asc" },
    }),
    getClassSubjects(klass.id),
  ]);
  if (!enrollments.length) return { error: "No students" };

  const current = await prisma.examRelease.findUnique({
    where: { classId_exam: { classId: klass.id, exam } },
  });
  if (current?.status === "APPROVED") return { error: `${meta.label} is already approved.` };
  if (current?.status === "SUBMITTED") return { error: `${meta.label} is already submitted. Wait for the Principal.` };

  const missing: string[] = [];
  for (const enr of enrollments) {
    const sheet = enr.markSheets.find((m) => m.yearId === klass.yearId);
    if (!sheet) {
      missing.push(enr.student.name);
      continue;
    }
    const incomplete = subjectsA.some((sub) => {
      const cell = sheet.cells.find((c) => c.subjectId === sub.id);
      return cell?.[meta.partA] == null;
    });
    if (incomplete) missing.push(enr.student.name);
  }
  if (missing.length) {
    return { error: `Save ${meta.label} marks for every student first. Missing: ${missing.join(", ")}` };
  }

  await prisma.examRelease.upsert({
    where: { classId_exam: { classId: klass.id, exam } },
    create: {
      classId: klass.id,
      exam,
      status: "SUBMITTED",
      submittedAt: new Date(),
      rejectedReason: null,
    },
    update: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      rejectedReason: null,
      approvedAt: null,
    },
  });
  revalidatePath("/teacher");
  revalidatePath("/teacher/marks");
  revalidatePath("/teacher/print");
  revalidatePath("/principal");
  revalidatePath("/principal/pending");
  revalidatePath(`/principal/classes/${klass.id}`);
  return { ok: true };
}

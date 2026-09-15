"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requirePrincipal } from "@/lib/guards";
import { uniqueVerificationCode } from "@/lib/barcode";
import { formatAcademicYear } from "@/lib/academic-year";
import { YEAR_COOKIE } from "@/lib/year";
import { classMarksStatus } from "@/lib/status";
import { mobileDigits, provisionStudentLogin } from "@/lib/student-login";
import { EXAM_META, isSingleExam } from "@/lib/exams";
import { issueExamCodes } from "@/lib/load-exam-card";
import { ensureDefaultSubjects } from "@/lib/class-subjects";

export async function updateSettings(formData: FormData) {
  await requirePrincipal();
  await prisma.schoolSettings.upsert({
    where: { id: "singleton" },
    update: {
      name: String(formData.get("name") ?? ""),
      address: String(formData.get("address") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      website: String(formData.get("website") ?? ""),
      logoUrl: String(formData.get("logoUrl") ?? ""),
      schoolCode: String(formData.get("schoolCode") ?? "").toUpperCase(),
    },
    create: {
      id: "singleton",
      name: String(formData.get("name") ?? "JAIMINI PUBLIC SCHOOL"),
      tagline: String(formData.get("tagline") ?? "SERVE FOR NATION"),
      address: String(formData.get("address") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      website: String(formData.get("website") ?? ""),
      logoUrl: String(formData.get("logoUrl") ?? "/uploads/logo/jaimini-logo.png"),
      footerQuote: String(formData.get("footerQuote") ?? ""),
      schoolCode: String(formData.get("schoolCode") ?? "JPS"),
    },
  });
  revalidatePath("/principal/settings");
}

function revalidateYearViews() {
  revalidatePath("/principal");
  revalidatePath("/principal/classes");
  revalidatePath("/principal/teachers");
  revalidatePath("/principal/pending");
  revalidatePath("/principal/approved");
}

export async function createYear(_prev: { error?: string } | null, formData: FormData) {
  await requirePrincipal();
  const formatted = formatAcademicYear(String(formData.get("yearFrom") ?? ""), String(formData.get("yearTo") ?? ""));
  if (formatted.error || !formatted.label) return { error: formatted.error ?? "Year required" };
  const exists = await prisma.academicYear.findUnique({ where: { label: formatted.label } });
  if (exists) return { error: "That academic year already exists. Use Show this year to open it." };
  const anyYear = await prisma.academicYear.count();
  const year = await prisma.academicYear.create({
    data: { label: formatted.label, isActive: anyYear === 0 },
  });
  const jar = await cookies();
  jar.set(YEAR_COOKIE, year.id, { path: "/", maxAge: 60 * 60 * 24 * 365 * 12 });
  revalidateYearViews();
  return { ok: true };
}

export async function searchYear(_prev: { error?: string } | null, formData: FormData) {
  await requirePrincipal();
  const formatted = formatAcademicYear(String(formData.get("yearFrom") ?? ""), String(formData.get("yearTo") ?? ""));
  if (formatted.error || !formatted.label) return { error: formatted.error ?? "Year required" };
  const year = await prisma.academicYear.findUnique({ where: { label: formatted.label } });
  if (!year) {
    return { error: `No records for ${formatted.label}. Add that year below if you want to start it.` };
  }
  const jar = await cookies();
  jar.set(YEAR_COOKIE, year.id, { path: "/", maxAge: 60 * 60 * 24 * 365 * 12 });
  revalidateYearViews();
  return { ok: true };
}

export async function selectYear(formData: FormData) {
  await requirePrincipal();
  const yearId = String(formData.get("yearId") ?? "");
  if (!yearId) return;
  const year = await prisma.academicYear.findUnique({ where: { id: yearId } });
  if (!year) return;
  const jar = await cookies();
  jar.set(YEAR_COOKIE, year.id, { path: "/", maxAge: 60 * 60 * 24 * 365 * 12 });
  revalidateYearViews();
}

export async function createClass(formData: FormData) {
  await requirePrincipal();
  const yearId = String(formData.get("yearId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const section = String(formData.get("section") ?? "").trim().toUpperCase();
  if (!yearId || !name || !section) return { error: "Class, section and year are required" };
  try {
    const klass = await prisma.schoolClass.create({ data: { yearId, name, section } });
    await ensureDefaultSubjects(klass.id);
  } catch {
    return { error: "That class/section already exists for this year" };
  }
  revalidatePath("/principal/classes");
  return { ok: true };
}

export async function assignTeacher(formData: FormData) {
  await requirePrincipal();
  const classId = String(formData.get("classId") ?? "");
  const classTeacherId = String(formData.get("classTeacherId") ?? "") || null;
  await prisma.schoolClass.update({ where: { id: classId }, data: { classTeacherId } });
  revalidatePath("/principal");
  revalidatePath("/principal/classes");
  revalidatePath("/principal/teachers");
  revalidatePath("/principal/print");
  revalidatePath("/teacher");
  revalidatePath("/teacher/students");
  revalidatePath("/teacher/marks");
  revalidatePath("/teacher/print");
}

export async function createTeacher(formData: FormData) {
  await requirePrincipal();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!name || !email || !password) return { error: "Name, email and password required" };
  try {
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await bcrypt.hash(password, 10),
        role: "CLASS_TEACHER",
      },
    });
  } catch {
    return { error: "Email already in use" };
  }
  revalidatePath("/principal/teachers");
  return { ok: true };
}

export async function importTeachers(rows: { name: string; email: string; password: string }[]) {
  await requirePrincipal();
  let created = 0;
  let updated = 0;
  const notes: string[] = [];
  for (const row of rows) {
    const name = row.name.trim();
    const email = row.email.trim().toLowerCase();
    const password = row.password.trim();
    if (!name || !email || !password) continue;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      if (exists.role !== "CLASS_TEACHER") {
        notes.push(`${email} is not a class teacher and was skipped.`);
        continue;
      }
      await prisma.user.update({
        where: { id: exists.id },
        data: { name, passwordHash: await bcrypt.hash(password, 10) },
      });
      updated += 1;
      continue;
    }
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await bcrypt.hash(password, 10),
        role: "CLASS_TEACHER",
      },
    });
    created += 1;
  }
  revalidatePath("/principal/teachers");
  revalidatePath("/principal/classes");
  return { ok: true, created, updated, notes };
}

export async function approveClass(classId: string) {
  await requirePrincipal();
  const klass = await prisma.schoolClass.findUnique({
    where: { id: classId },
    include: {
      year: true,
      enrollments: { include: { markSheets: true, student: true } },
    },
  });
  if (!klass) return { error: "Class not found" };
  const school = await prisma.schoolSettings.findUnique({ where: { id: "singleton" } });
  if (!school) return { error: "School settings missing" };
  if (klass.enrollments.length === 0) return { error: "No students in this class" };

  const missing = klass.enrollments.filter((enr) => !enr.markSheets.some((m) => m.yearId === klass.yearId));
  if (missing.length) {
    return { error: `Cannot approve yet. Missing marks for: ${missing.map((e) => e.student.name).join(", ")}` };
  }

  const statuses = klass.enrollments.flatMap((e) => e.markSheets.filter((m) => m.yearId === klass.yearId).map((m) => m.status));
  const status = classMarksStatus(statuses, klass.enrollments.length);
  if (status === "Approved") return { ok: true };
  if (status !== "Submitted" && status !== "Rejected") {
    return { error: "The class teacher must send an approval request for the entire class first." };
  }

  for (const enr of klass.enrollments) {
    const sheet = enr.markSheets.find((m) => m.yearId === klass.yearId)!;
    if (sheet.status === "APPROVED" && sheet.verificationCode) continue;
    const code = await uniqueVerificationCode({
      schoolCode: school.schoolCode,
      yearLabel: klass.year.label,
      className: klass.name,
      section: klass.section,
      rollNo: enr.rollNo,
    });
    await prisma.markSheet.update({
      where: { id: sheet.id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        rejectedReason: null,
        verificationCode: sheet.verificationCode ?? code,
        submittedAt: sheet.submittedAt ?? new Date(),
      },
    });
  }
  revalidatePath(`/principal/classes/${classId}`);
  revalidatePath("/principal");
  revalidatePath("/principal/pending");
  revalidatePath("/principal/approved");
  revalidatePath("/teacher");
  revalidatePath("/teacher/print");
  revalidatePath("/student");
  return { ok: true };
}

export async function rejectClass(classId: string, reason: string) {
  await requirePrincipal();
  const klass = await prisma.schoolClass.findUnique({
    where: { id: classId },
    include: { enrollments: { include: { markSheets: true } } },
  });
  if (!klass) return { error: "Class not found" };
  const comment = reason.trim() || "Please review and resubmit.";
  for (const enr of klass.enrollments) {
    for (const sheet of enr.markSheets.filter((m) => m.yearId === klass.yearId)) {
      await prisma.markSheet.update({
        where: { id: sheet.id },
        data: {
          status: "REJECTED",
          rejectedReason: comment,
          approvedAt: null,
          verificationCode: null,
        },
      });
    }
  }
  revalidatePath(`/principal/classes/${classId}`);
  revalidatePath("/principal");
  revalidatePath("/principal/pending");
  revalidatePath("/principal/approved");
  revalidatePath("/teacher");
  revalidatePath("/student");
  return { ok: true };
}

export async function approveExam(classId: string, exam: string) {
  await requirePrincipal();
  if (!isSingleExam(exam)) return { error: "Unknown exam" };
  const meta = EXAM_META[exam];
  const klass = await prisma.schoolClass.findUnique({
    where: { id: classId },
    include: { year: true, enrollments: { include: { student: true } } },
  });
  if (!klass) return { error: "Class not found" };
  const school = await prisma.schoolSettings.findUnique({ where: { id: "singleton" } });
  if (!school) return { error: "School settings missing" };
  if (!klass.enrollments.length) return { error: "No students in this class" };

  const release = await prisma.examRelease.findUnique({
    where: { classId_exam: { classId, exam } },
  });
  if (release?.status === "APPROVED") return { ok: true };
  if (release?.status !== "SUBMITTED" && release?.status !== "REJECTED") {
    return { error: `The class teacher must submit ${meta.label} first.` };
  }

  await issueExamCodes({
    classId,
    exam,
    yearLabel: klass.year.label,
    className: klass.name,
    section: klass.section,
    schoolCode: school.schoolCode,
    enrollments: klass.enrollments,
  });
  await prisma.examRelease.update({
    where: { classId_exam: { classId, exam } },
    data: { status: "APPROVED", approvedAt: new Date(), rejectedReason: null },
  });
  revalidatePath(`/principal/classes/${classId}`);
  revalidatePath("/principal");
  revalidatePath("/principal/pending");
  revalidatePath("/principal/approved");
  revalidatePath("/principal/print");
  revalidatePath("/teacher");
  revalidatePath("/teacher/marks");
  revalidatePath("/teacher/print");
  revalidatePath("/student");
  return { ok: true };
}

export async function rejectExam(classId: string, exam: string, reason: string) {
  await requirePrincipal();
  if (!isSingleExam(exam)) return { error: "Unknown exam" };
  const klass = await prisma.schoolClass.findUnique({ where: { id: classId } });
  if (!klass) return { error: "Class not found" };
  const comment = reason.trim() || "Please review and resubmit.";
  const release = await prisma.examRelease.findUnique({
    where: { classId_exam: { classId, exam } },
  });
  if (!release || release.status === "DRAFT") {
    return { error: "Nothing to reject for this exam yet." };
  }
  await prisma.examRelease.update({
    where: { classId_exam: { classId, exam } },
    data: {
      status: "REJECTED",
      rejectedReason: comment,
      approvedAt: null,
    },
  });
  await prisma.examCard.updateMany({
    where: { exam, enrollment: { classId } },
    data: { verificationCode: null },
  });
  revalidatePath(`/principal/classes/${classId}`);
  revalidatePath("/principal");
  revalidatePath("/principal/pending");
  revalidatePath("/principal/approved");
  revalidatePath("/teacher");
  revalidatePath("/teacher/marks");
  revalidatePath("/teacher/print");
  revalidatePath("/student");
  return { ok: true };
}

export async function updateStudentRecord(_prev: { error?: string; ok?: boolean } | null, formData: FormData) {
  await requirePrincipal();
  const studentId = String(formData.get("studentId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const fatherName = String(formData.get("fatherName") ?? "").trim();
  const motherName = String(formData.get("motherName") ?? "").trim();
  const parentMobile = String(formData.get("parentMobile") ?? "").trim();
  if (!studentId || !name) return { error: "Name is required." };
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { enrollments: { orderBy: { year: { label: "desc" } }, take: 1 } },
  });
  if (!student) return { error: "Student not found." };
  const rollNo = student.enrollments[0]?.rollNo ?? 0;
  const login = await provisionStudentLogin({ studentId, name, rollNo, parentMobile });
  if (login.error) return { error: login.error };
  await prisma.student.update({
    where: { id: studentId },
    data: { name, fatherName, motherName, parentMobile: mobileDigits(parentMobile) },
  });
  revalidatePath("/teacher/students");
  return { ok: true };
}

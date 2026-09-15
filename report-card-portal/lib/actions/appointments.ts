"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePrincipal, requireTeacher, requireUser, teacherClass } from "@/lib/guards";

function fields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const startsRaw = String(formData.get("startsAt") ?? "").trim();
  const startsAt = startsRaw ? new Date(startsRaw) : null;
  return { title, body, location, startsAt };
}

function revalidate() {
  revalidatePath("/principal/appointments");
  revalidatePath("/teacher/appointments");
}

export async function createStudentAppointment(_prev: { error?: string; ok?: boolean } | null, formData: FormData) {
  const user = await requirePrincipal();
  const { title, body, location, startsAt } = fields(formData);
  const classId = String(formData.get("classId") ?? "").trim();
  const studentId = String(formData.get("studentId") ?? "").trim() || null;
  if (!title) return { error: "Title is required." };
  if (!startsAt || Number.isNaN(startsAt.getTime())) return { error: "Date and time are required." };
  if (!classId) return { error: "Pick a class." };
  const klass = await prisma.schoolClass.findUnique({ where: { id: classId } });
  if (!klass) return { error: "Class not found." };
  if (studentId) {
    const enr = await prisma.enrollment.findFirst({ where: { classId, studentId } });
    if (!enr) return { error: "That student is not in the selected class." };
  }
  await prisma.appointment.create({
    data: {
      authorId: user.id,
      audience: "STUDENT",
      classId,
      studentId,
      title,
      body,
      location,
      startsAt,
    },
  });
  revalidate();
  return { ok: true };
}

export async function createTeacherAppointment(_prev: { error?: string; ok?: boolean } | null, formData: FormData) {
  const user = await requirePrincipal();
  const { title, body, location, startsAt } = fields(formData);
  const teacherId = String(formData.get("teacherId") ?? "").trim() || null;
  if (!title) return { error: "Title is required." };
  if (!startsAt || Number.isNaN(startsAt.getTime())) return { error: "Date and time are required." };
  if (teacherId) {
    const teacher = await prisma.user.findFirst({ where: { id: teacherId, role: "CLASS_TEACHER" } });
    if (!teacher) return { error: "Teacher not found." };
  }
  await prisma.appointment.create({
    data: {
      authorId: user.id,
      audience: "TEACHER",
      teacherId,
      title,
      body,
      location,
      startsAt,
    },
  });
  revalidate();
  return { ok: true };
}

export async function createClassStudentAppointment(_prev: { error?: string; ok?: boolean } | null, formData: FormData) {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return { error: "No class assigned." };
  const { title, body, location, startsAt } = fields(formData);
  const studentId = String(formData.get("studentId") ?? "").trim() || null;
  if (!title) return { error: "Title is required." };
  if (!startsAt || Number.isNaN(startsAt.getTime())) return { error: "Date and time are required." };
  if (studentId) {
    const enr = await prisma.enrollment.findFirst({ where: { classId: klass.id, studentId } });
    if (!enr) return { error: "That student is not in your class." };
  }
  await prisma.appointment.create({
    data: {
      authorId: user.id,
      audience: "STUDENT",
      classId: klass.id,
      studentId,
      title,
      body,
      location,
      startsAt,
    },
  });
  revalidate();
  return { ok: true };
}

export async function deleteAppointment(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const row = await prisma.appointment.findUnique({ where: { id } });
  if (!row) return;
  if (user.role === "PRINCIPAL") {
    await prisma.appointment.delete({ where: { id } });
    revalidate();
    return;
  }
  if (user.role !== "CLASS_TEACHER") return;
  const klass = await teacherClass(user.id);
  if (!klass) return;
  if (row.authorId !== user.id || row.audience !== "STUDENT" || row.classId !== klass.id) return;
  await prisma.appointment.delete({ where: { id } });
  revalidate();
}

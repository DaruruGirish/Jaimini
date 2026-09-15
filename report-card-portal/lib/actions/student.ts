"use server";

import { revalidatePath } from "next/cache";
import { requireStudent, studentEnrollment } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export async function submitGrievance(_prev: { error?: string; ok?: boolean } | null, formData: FormData) {
  const user = await requireStudent();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  if (!subject || !message) return { error: "Subject and message are required." };
  const ctx = await studentEnrollment(user.id);
  if (!ctx?.enrollment) return { error: "You are not enrolled in a class this year." };
  const teacherId = ctx.enrollment.class.classTeacherId;
  if (!teacherId) return { error: "No class teacher is assigned yet. Try again later." };
  await prisma.grievance.create({
    data: {
      studentId: ctx.student.id,
      teacherId,
      classId: ctx.enrollment.classId,
      subject,
      message,
    },
  });
  revalidatePath("/student/grievance");
  revalidatePath("/teacher/notifications");
  return { ok: true };
}

"use server";

import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTeacher, teacherClass } from "@/lib/guards";

const MAX_BYTES = 10 * 1024 * 1024;

function revalidate() {
  revalidatePath("/teacher/syllabus");
  revalidatePath("/student/syllabus");
  revalidatePath("/student");
}

async function removeStored(url: string) {
  if (!url.startsWith("/uploads/syllabus/")) return;
  const filePath = path.join(process.cwd(), "public", url);
  try {
    await unlink(filePath);
  } catch {
    /* already gone */
  }
}

export async function uploadSyllabus(_prev: { error?: string; ok?: boolean } | null, formData: FormData) {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return { error: "No class assigned" };
  const subjectId = String(formData.get("subjectId") ?? "");
  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, classId: klass.id, active: true },
  });
  if (!subject) return { error: "Subject not found." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a PDF file." };
  if (file.size > MAX_BYTES) return { error: "PDF must be 10 MB or smaller." };
  const ext = path.extname(file.name).toLowerCase();
  const type = file.type.toLowerCase();
  if (ext !== ".pdf" && type !== "application/pdf") return { error: "PDF only." };
  const folder = path.join(process.cwd(), "public", "uploads", "syllabus");
  await mkdir(folder, { recursive: true });
  const stored = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`;
  await writeFile(path.join(folder, stored), Buffer.from(await file.arrayBuffer()));
  if (subject.syllabusUrl) await removeStored(subject.syllabusUrl);
  await prisma.subject.update({
    where: { id: subject.id },
    data: {
      syllabusUrl: `/uploads/syllabus/${stored}`,
      syllabusFileName: file.name.replace(/[^\w.\- ()[\]]+/g, "_").slice(0, 120) || "syllabus.pdf",
      syllabusUploadedAt: new Date(),
    },
  });
  revalidate();
  return { ok: true };
}

export async function removeSyllabus(formData: FormData) {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return { error: "No class assigned" };
  const subjectId = String(formData.get("subjectId") ?? "");
  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, classId: klass.id },
  });
  if (!subject) return { error: "Subject not found." };
  if (subject.syllabusUrl) await removeStored(subject.syllabusUrl);
  await prisma.subject.update({
    where: { id: subject.id },
    data: { syllabusUrl: "", syllabusFileName: "", syllabusUploadedAt: null },
  });
  revalidate();
  return { ok: true };
}

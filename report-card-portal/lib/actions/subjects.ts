"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTeacher, teacherClass } from "@/lib/guards";
import { ensureDefaultSubjects, subjectHasMarks } from "@/lib/class-subjects";

function paths(classId: string) {
  revalidatePath("/teacher/subjects");
  revalidatePath("/teacher/marks");
  revalidatePath("/teacher/print");
  revalidatePath("/student");
  revalidatePath(`/principal/classes/${classId}`);
}

export async function addSubject(_prev: { error?: string; ok?: boolean } | null, formData: FormData) {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return { error: "No class assigned" };
  await ensureDefaultSubjects(klass.id);
  const name = String(formData.get("name") ?? "").trim();
  const part = String(formData.get("part") ?? "") === "B" ? "B" : "A";
  if (!name) return { error: "Subject name is required." };
  const last = await prisma.subject.findFirst({
    where: { classId: klass.id },
    orderBy: { sortOrder: "desc" },
  });
  try {
    await prisma.subject.create({
      data: { classId: klass.id, name, part, sortOrder: (last?.sortOrder ?? 0) + 1, active: true },
    });
  } catch {
    return { error: "That subject name already exists for this part." };
  }
  paths(klass.id);
  return { ok: true };
}

export async function renameSubject(formData: FormData) {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return { error: "No class assigned" };
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Subject name is required." };
  const row = await prisma.subject.findFirst({ where: { id, classId: klass.id } });
  if (!row) return { error: "Subject not found." };
  try {
    await prisma.subject.update({ where: { id }, data: { name } });
  } catch {
    return { error: "That subject name already exists for this part." };
  }
  paths(klass.id);
  return { ok: true };
}

export async function setSubjectPart(formData: FormData) {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return { error: "No class assigned" };
  const id = String(formData.get("id") ?? "");
  const part = String(formData.get("part") ?? "") === "B" ? "B" : "A";
  const row = await prisma.subject.findFirst({ where: { id, classId: klass.id } });
  if (!row) return { error: "Subject not found." };
  if (row.part !== part && (await subjectHasMarks(id))) {
    return { error: "Cannot change Part A/B after marks exist. Deactivate and add a new subject instead." };
  }
  try {
    await prisma.subject.update({ where: { id }, data: { part } });
  } catch {
    return { error: "That subject name already exists for this part." };
  }
  paths(klass.id);
  return { ok: true };
}

export async function moveSubject(formData: FormData) {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return { error: "No class assigned" };
  const id = String(formData.get("id") ?? "");
  const dir = String(formData.get("dir") ?? "");
  const rows = await prisma.subject.findMany({
    where: { classId: klass.id },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const i = rows.findIndex((r) => r.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= rows.length) return { error: "Cannot move further." };
  await prisma.$transaction([
    prisma.subject.update({ where: { id: rows[i].id }, data: { sortOrder: rows[j].sortOrder } }),
    prisma.subject.update({ where: { id: rows[j].id }, data: { sortOrder: rows[i].sortOrder } }),
  ]);
  paths(klass.id);
  return { ok: true };
}

export async function setSubjectActive(formData: FormData) {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return { error: "No class assigned" };
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "1";
  const row = await prisma.subject.findFirst({ where: { id, classId: klass.id } });
  if (!row) return { error: "Subject not found." };
  await prisma.subject.update({ where: { id }, data: { active } });
  paths(klass.id);
  return { ok: true };
}

export async function deleteSubject(formData: FormData) {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return { error: "No class assigned" };
  const id = String(formData.get("id") ?? "");
  const row = await prisma.subject.findFirst({ where: { id, classId: klass.id } });
  if (!row) return { error: "Subject not found." };
  if (await subjectHasMarks(id)) {
    return { error: "Marks already exist for this subject. Deactivate it instead of deleting." };
  }
  await prisma.subject.delete({ where: { id } });
  paths(klass.id);
  return { ok: true };
}

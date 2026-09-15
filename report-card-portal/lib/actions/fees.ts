"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePrincipal } from "@/lib/guards";
import { parseMoney } from "@/lib/fees";

function fields(formData: FormData) {
  const particular = String(formData.get("particular") ?? "").trim();
  const amount = parseMoney(formData.get("amount"));
  const paid = parseMoney(formData.get("paid"));
  const dueDate = String(formData.get("dueDate") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  return { particular, amount, paid, dueDate, note };
}

function revalidate(classId: string) {
  revalidatePath("/principal/fees");
  revalidatePath(`/principal/classes/${classId}`);
  revalidatePath("/student/fees");
  revalidatePath("/student");
}

export async function addTemplateItem(formData: FormData) {
  await requirePrincipal();
  const classId = String(formData.get("classId") ?? "");
  const { particular, amount, paid, dueDate, note } = fields(formData);
  if (!classId) return { error: "Pick a class." };
  if (!particular) return { error: "Particular is required." };
  if (amount == null || paid == null) return { error: "Amount and paid must be whole rupees (0 or more)." };
  if (paid > amount) return { error: "Paid cannot be more than amount." };
  const last = await prisma.feeTemplateItem.findFirst({ where: { classId }, orderBy: { sortOrder: "desc" } });
  await prisma.feeTemplateItem.create({
    data: { classId, particular, amount, paid, dueDate, note, sortOrder: (last?.sortOrder ?? 0) + 1 },
  });
  revalidate(classId);
  return { ok: true };
}

export async function updateTemplateItem(formData: FormData) {
  await requirePrincipal();
  const id = String(formData.get("id") ?? "");
  const { particular, amount, paid, dueDate, note } = fields(formData);
  if (!particular) return { error: "Particular is required." };
  if (amount == null || paid == null) return { error: "Amount and paid must be whole rupees (0 or more)." };
  if (paid > amount) return { error: "Paid cannot be more than amount." };
  const row = await prisma.feeTemplateItem.findUnique({ where: { id } });
  if (!row) return { error: "Row not found." };
  await prisma.feeTemplateItem.update({ where: { id }, data: { particular, amount, paid, dueDate, note } });
  revalidate(row.classId);
  return { ok: true };
}

export async function deleteTemplateItem(formData: FormData) {
  await requirePrincipal();
  const id = String(formData.get("id") ?? "");
  const row = await prisma.feeTemplateItem.findUnique({ where: { id } });
  if (!row) return { error: "Row not found." };
  await prisma.feeTemplateItem.delete({ where: { id } });
  revalidate(row.classId);
  return { ok: true };
}

export async function copyTemplateToClass(formData: FormData) {
  await requirePrincipal();
  const classId = String(formData.get("classId") ?? "");
  const replace = String(formData.get("replace") ?? "") === "1";
  if (!classId) return { error: "Pick a class." };
  const template = await prisma.feeTemplateItem.findMany({
    where: { classId },
    orderBy: { sortOrder: "asc" },
  });
  if (!template.length) return { error: "Add template rows first." };
  const enrollments = await prisma.enrollment.findMany({
    where: { classId },
    include: { feeItems: true },
  });
  for (const enr of enrollments) {
    if (!replace && enr.feeItems.length) continue;
    await prisma.feeItem.deleteMany({ where: { enrollmentId: enr.id } });
    await prisma.feeItem.createMany({
      data: template.map((row) => ({
        enrollmentId: enr.id,
        particular: row.particular,
        amount: row.amount,
        paid: row.paid,
        dueDate: row.dueDate,
        note: row.note,
        sortOrder: row.sortOrder,
      })),
    });
  }
  revalidate(classId);
  return { ok: true };
}

export async function addStudentFee(formData: FormData) {
  await requirePrincipal();
  const enrollmentId = String(formData.get("enrollmentId") ?? "");
  const { particular, amount, paid, dueDate, note } = fields(formData);
  if (!particular) return { error: "Particular is required." };
  if (amount == null || paid == null) return { error: "Amount and paid must be whole rupees (0 or more)." };
  if (paid > amount) return { error: "Paid cannot be more than amount." };
  const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
  if (!enrollment) return { error: "Student not found." };
  const last = await prisma.feeItem.findFirst({ where: { enrollmentId }, orderBy: { sortOrder: "desc" } });
  await prisma.feeItem.create({
    data: { enrollmentId, particular, amount, paid, dueDate, note, sortOrder: (last?.sortOrder ?? 0) + 1 },
  });
  revalidate(enrollment.classId);
  return { ok: true };
}

export async function updateStudentFee(formData: FormData) {
  await requirePrincipal();
  const id = String(formData.get("id") ?? "");
  const { particular, amount, paid, dueDate, note } = fields(formData);
  if (!particular) return { error: "Particular is required." };
  if (amount == null || paid == null) return { error: "Amount and paid must be whole rupees (0 or more)." };
  if (paid > amount) return { error: "Paid cannot be more than amount." };
  const row = await prisma.feeItem.findUnique({ where: { id }, include: { enrollment: true } });
  if (!row) return { error: "Row not found." };
  await prisma.feeItem.update({ where: { id }, data: { particular, amount, paid, dueDate, note } });
  revalidate(row.enrollment.classId);
  return { ok: true };
}

export async function deleteStudentFee(formData: FormData) {
  await requirePrincipal();
  const id = String(formData.get("id") ?? "");
  const row = await prisma.feeItem.findUnique({ where: { id }, include: { enrollment: true } });
  if (!row) return { error: "Row not found." };
  await prisma.feeItem.delete({ where: { id } });
  revalidate(row.enrollment.classId);
  return { ok: true };
}

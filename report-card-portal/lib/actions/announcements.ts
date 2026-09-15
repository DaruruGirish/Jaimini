"use server";

import { revalidatePath } from "next/cache";
import { requirePrincipal, requireTeacher, teacherClass } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export async function createAnnouncement(_prev: { error?: string; ok?: boolean } | null, formData: FormData) {
  const user = await requirePrincipal();
  const title = String(formData.get("title") ?? "").trim() || "Announcement";
  const body = String(formData.get("body") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  if (!body) return { error: "Description is required." };
  await prisma.announcement.create({
    data: { authorId: user.id, title, body, imageUrl, classId: null },
  });
  revalidatePath("/principal/announcements");
  revalidatePath("/student/announcements");
  return { ok: true };
}

export async function updateAnnouncement(_prev: { error?: string; ok?: boolean } | null, formData: FormData) {
  const user = await requirePrincipal();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim() || "Announcement";
  const body = String(formData.get("body") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  if (!body) return { error: "Description is required." };
  const post = await prisma.announcement.findUnique({ where: { id } });
  if (!post || post.authorId !== user.id) return { error: "You can only edit your own posts." };
  await prisma.announcement.update({ where: { id }, data: { title, body, imageUrl } });
  revalidatePath("/principal/announcements");
  revalidatePath("/student/announcements");
  return { ok: true };
}

export async function deleteAnnouncement(formData: FormData) {
  const user = await requirePrincipal();
  const id = String(formData.get("id") ?? "");
  const post = await prisma.announcement.findUnique({ where: { id } });
  if (!post || post.authorId !== user.id) return;
  await prisma.announcement.delete({ where: { id } });
  revalidatePath("/principal/announcements");
  revalidatePath("/student/announcements");
}

export async function createTeacherAnnouncement(_prev: { error?: string; ok?: boolean } | null, formData: FormData) {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return { error: "No class assigned" };
  const title = String(formData.get("title") ?? "").trim() || "Announcement";
  const body = String(formData.get("body") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  if (!body) return { error: "Description is required." };
  await prisma.announcement.create({
    data: { authorId: user.id, classId: klass.id, title, body, imageUrl },
  });
  revalidatePath("/teacher/announcements");
  revalidatePath("/student/announcements");
  return { ok: true };
}

export async function updateTeacherAnnouncement(_prev: { error?: string; ok?: boolean } | null, formData: FormData) {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return { error: "No class assigned" };
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim() || "Announcement";
  const body = String(formData.get("body") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  if (!body) return { error: "Description is required." };
  const post = await prisma.announcement.findUnique({ where: { id } });
  if (!post || post.authorId !== user.id || post.classId !== klass.id) {
    return { error: "You can only edit posts for your own class." };
  }
  await prisma.announcement.update({ where: { id }, data: { title, body, imageUrl } });
  revalidatePath("/teacher/announcements");
  revalidatePath("/student/announcements");
  return { ok: true };
}

export async function deleteTeacherAnnouncement(formData: FormData) {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return;
  const id = String(formData.get("id") ?? "");
  const post = await prisma.announcement.findUnique({ where: { id } });
  if (!post || post.authorId !== user.id || post.classId !== klass.id) return;
  await prisma.announcement.delete({ where: { id } });
  revalidatePath("/teacher/announcements");
  revalidatePath("/student/announcements");
}

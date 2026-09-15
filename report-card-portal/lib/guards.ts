import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { homeForRole } from "@/lib/roles";
import { prisma } from "./prisma";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

export async function requirePrincipal() {
  const user = await requireUser();
  if (user.role !== "PRINCIPAL") redirect(homeForRole(user.role));
  return user;
}

export async function requireTeacher() {
  const user = await requireUser();
  if (user.role !== "CLASS_TEACHER") redirect(homeForRole(user.role));
  return user;
}

export async function requireStudent() {
  const user = await requireUser();
  if (user.role !== "STUDENT") redirect(homeForRole(user.role));
  return user;
}

export async function teacherClass(userId: string) {
  const active = await prisma.academicYear.findFirst({ where: { isActive: true } });
  if (active) {
    const current = await prisma.schoolClass.findFirst({
      where: { classTeacherId: userId, yearId: active.id },
      include: { year: true },
    });
    if (current) return current;
  }
  return prisma.schoolClass.findFirst({
    where: { classTeacherId: userId },
    include: { year: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function studentEnrollment(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      student: {
        include: {
          enrollments: {
            include: { class: true, markSheets: true, year: true },
            orderBy: { year: { label: "desc" } },
          },
        },
      },
    },
  });
  const student = user?.student;
  if (!student) return null;
  const active = await prisma.academicYear.findFirst({ where: { isActive: true } });
  const current =
    (active ? student.enrollments.find((e) => e.yearId === active.id) : null) ?? student.enrollments[0];
  if (!current) return { student, enrollment: null };
  return { student, enrollment: current };
}

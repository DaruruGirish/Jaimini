import AppShell from "@/components/AppShell";
import { requireTeacher, teacherClass } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  const unreadCount = klass
    ? await prisma.grievance.count({ where: { classId: klass.id, status: "SENT" } })
    : 0;
  return (
    <AppShell role="CLASS_TEACHER" name={user.name ?? "Teacher"} unreadCount={unreadCount}>
      {children}
    </AppShell>
  );
}

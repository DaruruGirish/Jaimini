import { requireTeacher, teacherClass } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { createClassStudentAppointment } from "@/lib/actions/appointments";
import { StudentAppointmentForm } from "@/components/AppointmentForm";
import AppointmentList from "@/components/AppointmentList";

export default async function TeacherAppointmentsPage() {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return <p>No class assigned.</p>;

  const [enrollments, forTeachers, forStudents] = await Promise.all([
    prisma.enrollment.findMany({
      where: { classId: klass.id },
      include: { student: true },
      orderBy: { rollNo: "asc" },
    }),
    prisma.appointment.findMany({
      where: { audience: "TEACHER", OR: [{ teacherId: user.id }, { teacherId: null }] },
      include: { author: true, student: true, class: true, teacher: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.appointment.findMany({
      where: { audience: "STUDENT", classId: klass.id },
      include: { author: true, student: true, class: true, teacher: true },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  function toRow(
    row: (typeof forStudents)[number],
    canDelete: boolean
  ) {
    return {
      id: row.id,
      title: row.title,
      body: row.body,
      location: row.location,
      startsAt: row.startsAt,
      audience: row.audience,
      authorName: row.author.name,
      studentName: row.student?.name ?? null,
      teacherName: row.teacher?.name ?? null,
      classLabel: row.class ? `${row.class.name}-${row.class.section}` : null,
      canDelete,
    };
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#0C2A5A]">Appointments</h2>
        <p className="text-sm text-slate-600">
          You can book students in Class {klass.name}-{klass.section} only. You cannot book other teachers.
        </p>
      </div>
      <section className="space-y-3">
        <h3 className="font-semibold text-[#0C2A5A]">For you (from the Principal)</h3>
        <AppointmentList
          rows={forTeachers.map((row) => toRow(row, false))}
          emptyText="No appointments from the Principal."
        />
      </section>
      <section className="space-y-3">
        <h3 className="font-semibold text-[#0C2A5A]">For students</h3>
        <StudentAppointmentForm
          action={createClassStudentAppointment}
          fixedClassId={klass.id}
          classes={[
            {
              id: klass.id,
              label: `${klass.name}-${klass.section}`,
              students: enrollments.map((e) => ({ id: e.student.id, name: e.student.name, rollNo: e.rollNo })),
            },
          ]}
        />
        <AppointmentList
          rows={forStudents.map((row) => toRow(row, row.authorId === user.id))}
          emptyText="No student appointments yet."
        />
      </section>
    </div>
  );
}

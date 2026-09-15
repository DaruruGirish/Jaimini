import Link from "next/link";
import { requirePrincipal } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { getSelectedYear } from "@/lib/year";
import { createStudentAppointment, createTeacherAppointment } from "@/lib/actions/appointments";
import { StudentAppointmentForm, TeacherAppointmentForm } from "@/components/AppointmentForm";
import AppointmentList from "@/components/AppointmentList";

export default async function PrincipalAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requirePrincipal();
  const { tab } = await searchParams;
  const section = tab === "teachers" ? "teachers" : "students";
  const { selected } = await getSelectedYear();
  const [classes, teachers, studentRows, teacherRows] = await Promise.all([
    selected
      ? prisma.schoolClass.findMany({
          where: { yearId: selected.id },
          include: { enrollments: { include: { student: true }, orderBy: { rollNo: "asc" } } },
          orderBy: [{ name: "asc" }, { section: "asc" }],
        })
      : Promise.resolve([]),
    prisma.user.findMany({ where: { role: "CLASS_TEACHER" }, orderBy: { name: "asc" } }),
    prisma.appointment.findMany({
      where: { audience: "STUDENT" },
      include: { author: true, student: true, class: true, teacher: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.appointment.findMany({
      where: { audience: "TEACHER" },
      include: { author: true, student: true, class: true, teacher: true },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  const classOpts = classes.map((c) => ({
    id: c.id,
    label: `${c.name}-${c.section}`,
    students: c.enrollments.map((e) => ({ id: e.student.id, name: e.student.name, rollNo: e.rollNo })),
  }));

  function toRow(row: (typeof studentRows)[number], canDelete = true) {
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
          Two sections: students and teachers. Teachers can only book students in their own class.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/principal/appointments"
          className={`rounded-full px-4 py-1.5 text-sm ${section === "students" ? "bg-[#0C2A5A] text-white" : "bg-white text-[#0C2A5A] shadow-sm"}`}
        >
          Students
        </Link>
        <Link
          href="/principal/appointments?tab=teachers"
          className={`rounded-full px-4 py-1.5 text-sm ${section === "teachers" ? "bg-[#0C2A5A] text-white" : "bg-white text-[#0C2A5A] shadow-sm"}`}
        >
          Teachers
        </Link>
      </div>
      {section === "students" ? (
        <>
          {classOpts.length === 0 ? (
            <p className="rounded-xl bg-white p-5 text-sm text-slate-600 shadow-sm">No classes in this year.</p>
          ) : (
            <StudentAppointmentForm action={createStudentAppointment} classes={classOpts} />
          )}
          <AppointmentList rows={studentRows.map((row) => toRow(row))} emptyText="No student appointments yet." />
        </>
      ) : (
        <>
          <TeacherAppointmentForm
            action={createTeacherAppointment}
            teachers={teachers.map((t) => ({ id: t.id, name: t.name }))}
          />
          <AppointmentList rows={teacherRows.map((row) => toRow(row))} emptyText="No teacher appointments yet." />
        </>
      )}
    </div>
  );
}

import { requireTeacher, teacherClass } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { updateStudent } from "@/lib/actions/teacher";
import StudentRosterForm from "./StudentRosterForm";
import StudentEditForm from "@/components/StudentEditForm";

export default async function TeacherStudentsPage() {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return <p>No class assigned yet. Ask the Principal to map you to a class.</p>;

  const enrollments = await prisma.enrollment.findMany({
    where: { classId: klass.id },
    include: { student: { include: { user: true } }, markSheets: true },
    orderBy: { rollNo: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#0C2A5A]">
          Students · {klass.name}-{klass.section}
        </h2>
        <p className="text-sm text-slate-600">
          Parent mobile is required. It becomes the student login password until they change it.
        </p>
      </div>
      <StudentRosterForm
        classLabel={`${klass.name}-${klass.section}`}
        students={enrollments.map((e) => ({
          rollNo: e.rollNo,
          admissionNo: e.student.admissionNo,
          name: e.student.name,
          fatherName: e.student.fatherName,
          motherName: e.student.motherName,
          parentMobile: e.student.parentMobile,
        }))}
      />
      <div className="space-y-3">
        {enrollments.map((e) => (
          <StudentEditForm
            key={e.id}
            action={updateStudent}
            student={{
              id: e.student.id,
              name: e.student.name,
              fatherName: e.student.fatherName,
              motherName: e.student.motherName,
              parentMobile: e.student.parentMobile,
              username: e.student.user?.email ?? "—",
              klass: `${klass.name}-${klass.section}`,
              rollNo: e.rollNo,
            }}
          />
        ))}
      </div>
    </div>
  );
}

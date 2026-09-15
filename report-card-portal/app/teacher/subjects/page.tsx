import { requireTeacher, teacherClass } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { classHasMarkCells, ensureDefaultSubjects, subjectHasMarks } from "@/lib/class-subjects";
import SubjectManager from "./SubjectManager";

export default async function TeacherSubjectsPage() {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return <p>No class assigned.</p>;
  await ensureDefaultSubjects(klass.id);
  const subjects = await prisma.subject.findMany({
    where: { classId: klass.id },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const withMarks = [];
  for (const s of subjects) {
    withMarks.push({ ...s, hasMarks: await subjectHasMarks(s.id) });
  }
  const hasMarks = await classHasMarkCells(klass.id);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-[#0C2A5A]">
          Subjects · {klass.name}-{klass.section}
        </h2>
        <p className="text-sm text-slate-600">
          These subjects belong to your class only. Active subjects, in this order, appear on marks entry, Excel, exam
          cards and the year card. Students are not added here.
        </p>
      </div>
      <SubjectManager subjects={withMarks} hasMarks={hasMarks} />
    </div>
  );
}

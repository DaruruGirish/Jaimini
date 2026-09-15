import { requireTeacher, teacherClass } from "@/lib/guards";
import { getClassSubjects } from "@/lib/class-subjects";
import SyllabusManager from "./SyllabusManager";

export default async function TeacherSyllabusPage() {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return <p>No class assigned.</p>;
  const subjects = await getClassSubjects(klass.id);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-[#0C2A5A]">
          Syllabus · {klass.name}-{klass.section}
        </h2>
        <p className="text-sm text-slate-600">
          One PDF per active subject. Students in this class can view or download it. PDF only, max 10 MB.
        </p>
      </div>
      <SyllabusManager
        subjects={subjects.all.map((s) => ({
          id: s.id,
          name: s.name,
          part: s.part,
          syllabusUrl: s.syllabusUrl,
          syllabusFileName: s.syllabusFileName,
          syllabusUploadedAt: s.syllabusUploadedAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}

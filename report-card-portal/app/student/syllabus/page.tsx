import { requireStudent, studentEnrollment } from "@/lib/guards";
import { getClassSubjects } from "@/lib/class-subjects";

export default async function StudentSyllabusPage() {
  const user = await requireStudent();
  const ctx = await studentEnrollment(user.id);
  if (!ctx?.enrollment) {
    return <p>No class is linked to this login.</p>;
  }
  const subjects = await getClassSubjects(ctx.enrollment.classId);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-[#0C2A5A]">Syllabus</h2>
        <p className="text-sm text-slate-600">
          Subject PDFs for class {ctx.enrollment.class.name}-{ctx.enrollment.class.section}. You can view or download
          files the class teacher has uploaded.
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3">Subject</th>
              <th className="p-3">Type</th>
              <th className="p-3">File</th>
            </tr>
          </thead>
          <tbody>
            {subjects.all.length === 0 ? (
              <tr>
                <td className="p-4 text-slate-500" colSpan={3}>
                  No subjects for this class yet.
                </td>
              </tr>
            ) : (
              subjects.all.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-3 font-medium text-[#0C2A5A]">{s.name}</td>
                  <td className="p-3">{s.part === "A" ? "Part A" : "Part B"}</td>
                  <td className="p-3">
                    {s.syllabusUrl ? (
                      <span className="flex flex-wrap gap-3">
                        <a href={s.syllabusUrl} target="_blank" rel="noreferrer" className="text-sky-800 underline">
                          View
                        </a>
                        <a href={s.syllabusUrl} download={s.syllabusFileName || "syllabus.pdf"} className="text-sky-800 underline">
                          Download
                        </a>
                        <span className="text-xs text-slate-500">{s.syllabusFileName}</span>
                      </span>
                    ) : (
                      <span className="text-slate-500">Not uploaded</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

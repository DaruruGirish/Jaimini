import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { examIsPublished, loadExamCardView } from "@/lib/load-exam-card";
import { isSingleExam } from "@/lib/exams";
import ExamReportCard from "@/components/ExamReportCard";
import PrintButton from "@/components/PrintButton";

export default async function PrintExamCard({
  params,
}: {
  params: Promise<{ enrollmentId: string; exam: string }>;
}) {
  const session = await auth();
  if (!session?.user) notFound();
  const { enrollmentId, exam } = await params;
  const examKey = exam.toUpperCase();
  if (!isSingleExam(examKey)) notFound();

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { class: true },
  });
  if (!enrollment) notFound();
  if (!(await examIsPublished(enrollment.classId, examKey))) notFound();

  if (session.user.role === "CLASS_TEACHER" && enrollment.class.classTeacherId !== session.user.id) {
    notFound();
  }
  if (session.user.role === "STUDENT") {
    const me = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!me?.studentId || me.studentId !== enrollment.studentId) notFound();
  }

  const card = await loadExamCardView(enrollmentId, examKey);
  if (!card) notFound();
  return (
    <div className="bg-slate-200 py-6">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] flex-col items-end gap-2">
        <PrintButton label="Print this card / Save as PDF" />
      </div>
      <ExamReportCard card={card} />
    </div>
  );
}

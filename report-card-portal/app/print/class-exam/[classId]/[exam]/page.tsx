import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { examIsPublished, loadExamCardView } from "@/lib/load-exam-card";
import { isSingleExam } from "@/lib/exams";
import ExamReportCard from "@/components/ExamReportCard";
import PrintButton from "@/components/PrintButton";

export default async function PrintClassExam({
  params,
}: {
  params: Promise<{ classId: string; exam: string }>;
}) {
  const session = await auth();
  if (!session?.user) notFound();
  const { classId, exam } = await params;
  const examKey = exam.toUpperCase();
  if (!isSingleExam(examKey)) notFound();
  if (session.user.role === "STUDENT") notFound();

  const klass = await prisma.schoolClass.findUnique({
    where: { id: classId },
    include: { enrollments: { orderBy: { rollNo: "asc" } } },
  });
  if (!klass) notFound();
  if (session.user.role === "CLASS_TEACHER" && klass.classTeacherId !== session.user.id) notFound();
  if (!(await examIsPublished(classId, examKey))) notFound();

  const cards = [];
  for (const enr of klass.enrollments) {
    const card = await loadExamCardView(enr.id, examKey);
    if (card) cards.push(card);
  }
  if (!cards.length) notFound();

  return (
    <div className="bg-slate-200 py-6">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] flex-col items-end gap-2">
        <PrintButton label="Print all / Save as PDF" />
      </div>
      {cards.map((card) => (
        <ExamReportCard key={`${card.rollNo}-${examKey}`} card={card} />
      ))}
    </div>
  );
}

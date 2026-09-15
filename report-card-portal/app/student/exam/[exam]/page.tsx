import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStudent, studentEnrollment } from "@/lib/guards";
import { loadCardByMarkSheetId } from "@/lib/load-card";
import { examIsPublished, loadExamCardView } from "@/lib/load-exam-card";
import { isSingleExam } from "@/lib/exams";
import ReportCard from "@/components/ReportCard";
import ExamReportCard from "@/components/ExamReportCard";
import PrintButton from "@/components/PrintButton";

export default async function StudentExamPage({ params }: { params: Promise<{ exam: string }> }) {
  const user = await requireStudent();
  const ctx = await studentEnrollment(user.id);
  if (!ctx?.enrollment) notFound();
  const { exam } = await params;
  const examKey = exam.toUpperCase();

  if (examKey === "OVERALL") {
    const sheet = ctx.enrollment.markSheets.find((m) => m.yearId === ctx.enrollment!.yearId);
    if (!sheet || sheet.status !== "APPROVED") {
      return (
        <div className="space-y-3">
          <Link href="/student/marks" className="text-sm text-sky-800">
            ← Marks
          </Link>
          <p className="rounded-xl bg-amber-50 p-5 text-amber-900 shadow-sm">Not published</p>
        </div>
      );
    }
    const card = await loadCardByMarkSheetId(sheet.id);
    if (!card) notFound();
    return (
      <div className="space-y-4">
        <div className="no-print">
          <Link href="/student/marks" className="text-sm text-sky-800">
            ← Marks
          </Link>
          <h2 className="text-2xl font-semibold text-[#0C2A5A]">Overall report card</h2>
          <PrintButton label="Download / print this card" />
        </div>
        <div className="overflow-auto">
          <ReportCard card={card} />
        </div>
      </div>
    );
  }

  if (!isSingleExam(examKey)) notFound();
  const published = await examIsPublished(ctx.enrollment.classId, examKey);
  if (!published) {
    return (
      <div className="space-y-3">
        <Link href="/student/marks" className="text-sm text-sky-800">
          ← Marks
        </Link>
        <p className="rounded-xl bg-amber-50 p-5 text-amber-900 shadow-sm">Not published</p>
      </div>
    );
  }
  const card = await loadExamCardView(ctx.enrollment.id, examKey);
  if (!card) notFound();
  return (
    <div className="space-y-4">
      <div className="no-print">
        <Link href="/student/marks" className="text-sm text-sky-800">
          ← Marks
        </Link>
        <h2 className="text-2xl font-semibold text-[#0C2A5A]">{card.title}</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <PrintButton label="Download / print this card" />
          <a
            href={`/print/exam/${ctx.enrollment.id}/${examKey}`}
            className="rounded-full border border-[#0C2A5A] px-4 py-2 text-sm text-[#0C2A5A]"
          >
            Open print page
          </a>
        </div>
      </div>
      <div className="overflow-auto">
        <ExamReportCard card={card} />
      </div>
    </div>
  );
}

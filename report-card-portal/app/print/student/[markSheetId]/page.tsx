import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { loadCardByMarkSheetId } from "@/lib/load-card";
import ReportCard from "@/components/ReportCard";
import PrintButton from "@/components/PrintButton";

export default async function PrintStudent({ params }: { params: Promise<{ markSheetId: string }> }) {
  const session = await auth();
  if (!session?.user) notFound();
  const { markSheetId } = await params;
  const sheet = await prisma.markSheet.findUnique({
    where: { id: markSheetId },
    include: { enrollment: { include: { class: true } } },
  });
  if (!sheet || sheet.status !== "APPROVED") notFound();
  if (session.user.role === "CLASS_TEACHER" && sheet.enrollment.class.classTeacherId !== session.user.id) {
    notFound();
  }
  if (session.user.role === "STUDENT") {
    const me = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!me?.studentId || me.studentId !== sheet.enrollment.studentId) notFound();
  }
  const card = await loadCardByMarkSheetId(sheet.id);
  if (!card) notFound();
  return (
    <div className="bg-slate-200 py-6">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] flex-col items-end gap-2">
        <PrintButton label="Print this card / Save as PDF" />
      </div>
      <ReportCard card={card} />
    </div>
  );
}

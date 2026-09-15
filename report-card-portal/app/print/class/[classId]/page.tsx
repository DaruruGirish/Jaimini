import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { loadCardByMarkSheetId } from "@/lib/load-card";
import ReportCard from "@/components/ReportCard";
import PrintButton from "@/components/PrintButton";

export default async function PrintClass({ params }: { params: Promise<{ classId: string }> }) {
  const session = await auth();
  if (!session?.user) notFound();
  const { classId } = await params;
  const klass = await prisma.schoolClass.findUnique({
    where: { id: classId },
    include: { enrollments: { include: { markSheets: true }, orderBy: { rollNo: "asc" } } },
  });
  if (!klass) notFound();
  if (session.user.role === "STUDENT") notFound();
  if (session.user.role === "CLASS_TEACHER" && klass.classTeacherId !== session.user.id) notFound();
  const ids = klass.enrollments
    .map((e) => e.markSheets.find((m) => m.yearId === klass.yearId && m.status === "APPROVED")?.id)
    .filter((id): id is string => Boolean(id));
  if (!ids.length) notFound();
  const cards = [];
  for (const id of ids) {
    const card = await loadCardByMarkSheetId(id);
    if (card) cards.push(card);
  }
  return (
    <div className="bg-slate-200 py-6">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] flex-col items-end gap-2">
        <PrintButton label="Print all / Save as PDF" />
      </div>
      {cards.map((card, i) => (
        <ReportCard key={i} card={card} />
      ))}
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ReportCard from "@/components/ReportCard";
import { loadCardByMarkSheetId } from "@/lib/load-card";

export default async function StudentPreview({
  params,
}: {
  params: Promise<{ id: string; studentId: string }>;
}) {
  const { id, studentId } = await params;
  const enrollment = await prisma.enrollment.findFirst({
    where: { classId: id, studentId },
    include: { markSheets: true, class: true },
  });
  if (!enrollment) notFound();
  const sheet = enrollment.markSheets.find((m) => m.yearId === enrollment.yearId);
  if (!sheet) notFound();
  const card = await loadCardByMarkSheetId(sheet.id);
  if (!card) notFound();

  return (
    <div className="space-y-4">
      <Link href={`/principal/classes/${id}`} className="text-sm text-sky-800">
        ← Back to class
      </Link>
      {sheet.status === "APPROVED" ? (
        <a href={`/print/student/${sheet.id}`} className="inline-block rounded-full bg-[#0C2A5A] px-4 py-2 text-white">
          Print this card
        </a>
      ) : (
        <p className="text-sm text-amber-700">Official print unlocks after Principal approval.</p>
      )}
      <div className="overflow-auto">
        <ReportCard card={card} />
      </div>
    </div>
  );
}

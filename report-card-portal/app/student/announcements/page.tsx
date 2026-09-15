import { requireStudent, studentEnrollment } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export default async function StudentAnnouncementsPage() {
  const user = await requireStudent();
  const ctx = await studentEnrollment(user.id);
  const classId = ctx?.enrollment?.classId;
  const posts = await prisma.announcement.findMany({
    where: classId ? { OR: [{ classId: null }, { classId }] } : { classId: null },
    include: { author: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-[#0C2A5A]">Announcements</h2>
      {posts.length === 0 ? (
        <p className="rounded-xl bg-white p-5 text-sm text-slate-600 shadow-sm">No announcements yet.</p>
      ) : (
        posts.map((p) => (
          <article key={p.id} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-[#0C2A5A]">{p.title}</h3>
              <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-800">
                {p.classId ? "Class teacher" : "Principal"}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {p.author.name} · {p.createdAt.toLocaleString("en-IN")}
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-800">{p.body}</p>
            {p.imageUrl ? <img src={p.imageUrl} alt="" className="mt-3 max-h-72 rounded-lg object-contain" /> : null}
          </article>
        ))
      )}
    </div>
  );
}

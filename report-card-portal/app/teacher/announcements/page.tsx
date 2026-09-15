import { requireTeacher, teacherClass } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { createTeacherAnnouncement, deleteTeacherAnnouncement, updateTeacherAnnouncement } from "@/lib/actions/announcements";
import AnnouncementForm from "@/components/AnnouncementForm";

export default async function TeacherAnnouncementsPage() {
  const user = await requireTeacher();
  const klass = await teacherClass(user.id);
  if (!klass) return <p>No class assigned.</p>;
  const posts = await prisma.announcement.findMany({
    where: { classId: klass.id },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#0C2A5A]">Announcements</h2>
        <p className="text-sm text-slate-600">
          Posted only to Class {klass.name}-{klass.section}. Not school-wide and not sent as SMS.
        </p>
      </div>
      <AnnouncementForm action={createTeacherAnnouncement} successText="Posted to your class." />
      <div className="space-y-4">
        {posts.length === 0 ? (
          <p className="rounded-xl bg-white p-5 text-sm text-slate-600 shadow-sm">No class announcements yet.</p>
        ) : (
          posts.map((p) => (
            <article key={p.id} className="rounded-xl bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-[#0C2A5A]">{p.title}</h3>
              <p className="text-xs text-slate-500">{p.createdAt.toLocaleString("en-IN")}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{p.body}</p>
              {p.imageUrl ? <img src={p.imageUrl} alt="" className="mt-3 max-h-56 rounded-lg object-contain" /> : null}
              {p.authorId === user.id ? (
                <details className="mt-4 border-t pt-3">
                  <summary className="cursor-pointer text-sm text-sky-800">Edit or delete</summary>
                  <div className="mt-3 space-y-3">
                    <AnnouncementForm post={p} action={updateTeacherAnnouncement} />
                    <form action={deleteTeacherAnnouncement}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-sm text-red-700 underline">Delete</button>
                    </form>
                  </div>
                </details>
              ) : null}
            </article>
          ))
        )}
      </div>
    </div>
  );
}

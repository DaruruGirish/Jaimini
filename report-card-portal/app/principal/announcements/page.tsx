import { requirePrincipal } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { deleteAnnouncement } from "@/lib/actions/announcements";
import AnnouncementForm from "@/components/AnnouncementForm";

export default async function PrincipalAnnouncementsPage() {
  const user = await requirePrincipal();
  const posts = await prisma.announcement.findMany({
    where: { classId: null },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#0C2A5A]">Announcements</h2>
        <p className="text-sm text-slate-600">Posted to every student portal. Not a chat and not sent as SMS.</p>
      </div>
      <AnnouncementForm />
      <div className="space-y-4">
        {posts.map((p) => (
          <article key={p.id} className="rounded-xl bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-[#0C2A5A]">{p.title}</h3>
            <p className="text-xs text-slate-500">{p.createdAt.toLocaleString("en-IN")}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{p.body}</p>
            {p.imageUrl ? <img src={p.imageUrl} alt="" className="mt-3 max-h-56 rounded-lg object-contain" /> : null}
            {p.authorId === user.id ? (
              <details className="mt-4 border-t pt-3">
                <summary className="cursor-pointer text-sm text-sky-800">Edit or delete</summary>
                <div className="mt-3 space-y-3">
                  <AnnouncementForm post={p} />
                  <form action={deleteAnnouncement}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="text-sm text-red-700 underline">Delete</button>
                  </form>
                </div>
              </details>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { createAnnouncement, updateAnnouncement } from "@/lib/actions/announcements";
import PhotoField from "@/components/PhotoField";

type AnnouncementAction = typeof createAnnouncement;

export default function AnnouncementForm({
  post,
  action,
  successText,
}: {
  post?: { id: string; title: string; body: string; imageUrl: string };
  action?: AnnouncementAction;
  successText?: string;
}) {
  const resolved = action ?? (post ? updateAnnouncement : createAnnouncement);
  const [state, formAction, pending] = useActionState(resolved, null);
  return (
    <form action={formAction} className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
      {post ? <input type="hidden" name="id" value={post.id} /> : null}
      <label className="block text-sm">
        Title (optional)
        <input name="title" defaultValue={post?.title === "Announcement" ? "" : post?.title} className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block text-sm">
        Description
        <textarea name="body" required rows={5} defaultValue={post?.body} className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <div className="rounded-xl border-2 border-[#0C2A5A] bg-[#eef6ff] p-4">
        <p className="mb-2 text-sm font-semibold text-[#0C2A5A]">Optional image</p>
        <p className="mb-3 text-xs text-slate-600">Add one photo or poster. Students will see it on their Announcements page.</p>
        <PhotoField name="imageUrl" kind="announcement" prominent defaultUrl={post?.imageUrl || undefined} />
      </div>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.ok ? (
        <p className="text-sm text-emerald-700">{post ? "Updated." : successText ?? "Posted to all student portals."}</p>
      ) : null}
      <button disabled={pending} className="rounded-lg bg-[#0C2A5A] px-4 py-2 text-white disabled:opacity-50">
        {pending ? "Saving…" : post ? "Save changes" : "Post announcement"}
      </button>
    </form>
  );
}

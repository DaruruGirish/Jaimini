"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitGrievance } from "@/lib/actions/student";

export default function GrievanceForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(submitGrievance, null);
  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);
  return (
    <form action={action} className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-600">
        This goes only to your class teacher. They will call the parent mobile on file — there is no in-app chat.
      </p>
      <label className="block text-sm">
        Subject
        <input name="subject" required className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="Teaching, marks doubt, …" />
      </label>
      <label className="block text-sm">
        Message
        <textarea name="message" required rows={5} className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm text-emerald-700">Sent to your class teacher.</p> : null}
      <button disabled={pending} className="rounded-lg bg-[#0C2A5A] px-4 py-2 text-white disabled:opacity-50">
        {pending ? "Sending…" : "Submit"}
      </button>
    </form>
  );
}

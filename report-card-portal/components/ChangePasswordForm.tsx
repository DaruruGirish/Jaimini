"use client";

import { useActionState } from "react";
import { changePassword } from "@/lib/actions/account";

export default function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, null);
  return (
    <form action={action} className="max-w-md space-y-3 rounded-xl bg-white p-5 shadow-sm">
      <label className="block text-sm">
        Current password
        <input name="current" type="password" required className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block text-sm">
        New password
        <input name="next" type="password" required minLength={6} className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      <label className="block text-sm">
        Confirm new password
        <input name="confirm" type="password" required minLength={6} className="mt-1 w-full rounded-lg border px-3 py-2" />
      </label>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm text-emerald-700">Password updated.</p> : null}
      <button disabled={pending} className="rounded-lg bg-[#0C2A5A] px-4 py-2 text-white disabled:opacity-50">
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}

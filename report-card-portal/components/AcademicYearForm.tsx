"use client";

import { useActionState, useState } from "react";
import { createYear } from "@/lib/actions/principal";

export default function AcademicYearForm() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [state, action, pending] = useActionState(createYear, null);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <label className="text-sm">
        From
        <input
          name="yearFrom"
          inputMode="numeric"
          maxLength={4}
          placeholder="2025"
          value={from}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 4);
            setFrom(v);
            if (v.length === 4) setTo(String(Number(v) + 1));
          }}
          className="mt-1 w-24 rounded-lg border px-3 py-2"
          required
        />
      </label>
      <span className="pb-2 text-slate-500">to</span>
      <label className="text-sm">
        To
        <input
          name="yearTo"
          inputMode="numeric"
          maxLength={4}
          placeholder="2026"
          value={to}
          onChange={(e) => setTo(e.target.value.replace(/\D/g, "").slice(0, 4))}
          className="mt-1 w-24 rounded-lg border px-3 py-2"
          required
        />
      </label>
      <button disabled={pending} className="rounded-lg border border-[#0C2A5A] px-4 py-2 text-[#0C2A5A] disabled:opacity-60">
        {pending ? "Adding…" : "Add year"}
      </button>
      {state?.error ? <p className="w-full text-sm text-red-600">{state.error}</p> : null}
    </form>
  );
}

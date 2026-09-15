"use client";

import { useId, useState } from "react";

export default function PhotoField({
  name,
  defaultUrl,
  kind,
  prominent,
}: {
  name: string;
  defaultUrl?: string;
  kind?: "photo" | "logo" | "announcement";
  prominent?: boolean;
}) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [busy, setBusy] = useState(false);
  const inputId = useId();
  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("kind", kind ?? (name === "logoUrl" ? "logo" : "photo"));
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) setUrl(data.url);
    setBusy(false);
  }
  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={url} />
      {prominent ? (
        <label
          htmlFor={inputId}
          className="flex min-h-14 cursor-pointer items-center justify-start gap-3 rounded-xl border-2 border-dashed border-[#0C2A5A] bg-white px-4 py-3 text-base font-semibold text-[#0C2A5A] shadow-sm hover:bg-sky-50"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0C2A5A] text-lg text-white">+</span>
          {busy ? "Uploading…" : url ? "Change image" : "Upload image"}
        </label>
      ) : null}
      <input
        id={inputId}
        type="file"
        accept="image/*"
        onChange={onChange}
        className={prominent ? "sr-only" : "text-xs"}
      />
      {url ? <img src={url} alt="" className={prominent ? "max-h-40 rounded-lg object-contain" : "h-16 w-16 rounded object-cover"} /> : null}
    </div>
  );
}

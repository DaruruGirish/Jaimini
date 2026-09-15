"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { selectYear } from "@/lib/actions/principal";

export default function YearSelect({
  years,
  selectedId,
}: {
  years: { id: string; label: string }[];
  selectedId: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const selected = years.find((y) => y.id === selectedId);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!years.length) return null;

  function pick(id: string) {
    setOpen(false);
    if (id === selectedId) return;
    const fd = new FormData();
    fd.set("yearId", id);
    startTransition(async () => {
      await selectYear(fd);
      router.refresh();
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={pending}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-white/35 bg-[#163E73] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1d4f9a] disabled:opacity-70"
      >
        <span className="hidden text-sky-200 sm:inline">Year</span>
        <span>{selected?.label ?? "Select"}</span>
        <svg className={`h-3.5 w-3.5 text-sky-200 transition ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z" />
        </svg>
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-1 min-w-[11rem] overflow-hidden rounded-lg border border-sky-200 bg-white py-1 shadow-lg"
        >
          {years.map((y) => {
            const active = y.id === selectedId;
            return (
              <li key={y.id} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => pick(y.id)}
                  className={`w-full px-3 py-2 text-left text-sm ${
                    active
                      ? "bg-[#0C2A5A] font-semibold text-white"
                      : "text-[#0C2A5A] hover:bg-sky-100"
                  }`}
                >
                  {y.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

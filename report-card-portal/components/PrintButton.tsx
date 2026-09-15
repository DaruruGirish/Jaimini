"use client";

export default function PrintButton({
  label = "Print / Save as PDF",
  hint = "In the print dialog choose the school printer, or Save as PDF to take the file to a print shop. Each student is one A4 page.",
}: {
  label?: string;
  hint?: string;
}) {
  return (
    <div className="no-print space-y-2">
      <button onClick={() => window.print()} className="rounded-full bg-[#0C2A5A] px-5 py-2 text-white">
        {label}
      </button>
      <p className="max-w-md text-xs text-slate-600">{hint}</p>
    </div>
  );
}

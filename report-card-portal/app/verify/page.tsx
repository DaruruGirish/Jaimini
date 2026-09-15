import type { Metadata } from "next";
import { lookupVerification } from "@/lib/verify";
import VerifyForm from "@/components/VerifyForm";

export const metadata: Metadata = {
  title: "Verify report card",
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const q = code?.trim() ?? "";
  const result = q ? await lookupVerification(q) : null;

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <img src="/uploads/logo/jaimini-logo.png" alt="" className="mx-auto mb-4 h-16 w-16 rounded-full bg-white object-contain p-1 shadow" />
      <h1 className="text-center text-2xl font-semibold text-[#0C2A5A]">Verify report card</h1>
      <p className="mb-6 text-center text-sm text-slate-600">Jaimini Public School, Hiriyur · no login required</p>
      <VerifyForm defaultCode={q.toUpperCase()} />

      {result && !result.valid ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-center">
          <p className="text-2xl font-bold text-red-700">Invalid</p>
          <p className="mt-2 text-sm text-red-800">This code is unknown, not approved, or revoked.</p>
        </div>
      ) : null}

      {result?.valid ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-[#0C2A5A]">
          <p className="text-center text-2xl font-bold text-emerald-800">Valid</p>
          <p className="mt-1 text-center text-sm font-semibold tracking-wide text-emerald-700">Authentic report card</p>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-slate-600">Exam</dt>
            <dd className="font-semibold">{result.examName}</dd>
            <dt className="text-slate-600">Student name</dt>
            <dd className="font-semibold">{result.name}</dd>
            <dt className="text-slate-600">Class</dt>
            <dd>{result.className}</dd>
            <dt className="text-slate-600">Section</dt>
            <dd>{result.section}</dd>
            <dt className="text-slate-600">Roll no</dt>
            <dd>{result.rollNo}</dd>
            <dt className="text-slate-600">Academic year</dt>
            <dd>{result.year}</dd>
            {result.kind === "overall" ? (
              <>
                <dt className="text-slate-600">Grand total</dt>
                <dd>{result.grand ?? "—"}</dd>
                <dt className="text-slate-600">Overall grade</dt>
                <dd>{result.grade ?? "—"}</dd>
              </>
            ) : null}
          </dl>
        </div>
      ) : null}

      <p className="mt-10 text-center text-xs text-slate-500">Parents can only verify. Staff print from the portal after Principal approval.</p>
      <p className="mt-2 text-center text-sm">
        <a href="/login" className="text-sky-800">
          Staff login
        </a>
      </p>
    </div>
  );
}

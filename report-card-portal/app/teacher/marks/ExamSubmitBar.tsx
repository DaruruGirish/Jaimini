"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitExam } from "@/lib/actions/teacher";
import { EXAM_META, SINGLE_EXAMS, examStatusLabel, type SingleExam } from "@/lib/exams";
import { statusBadgeClass, type ClassMarksStatus } from "@/lib/status";

export default function ExamSubmitBar({
  statuses,
  reasons,
}: {
  statuses: Record<SingleExam, string | undefined>;
  reasons: Record<SingleExam, string | undefined>;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <h3 className="font-semibold text-[#0C2A5A]">Submit one exam</h3>
      <p className="mt-1 text-sm text-slate-600">
        Save a draft first. Submit locks only that exam until the Principal approves or rejects it. Other exams stay
        editable. Students do not see an exam until the Principal approves it.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {SINGLE_EXAMS.map((exam) => {
          const status = statuses[exam] ?? "DRAFT";
          const label = examStatusLabel(status);
          const canSubmit = status === "DRAFT" || status === "REJECTED";
          return (
            <div key={exam} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-[#0C2A5A]">{EXAM_META[exam].label}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadgeClass(label as ClassMarksStatus)}`}>
                  {label}
                </span>
              </div>
              {status === "REJECTED" && reasons[exam] ? (
                <p className="mt-1 text-xs text-red-700">Principal: {reasons[exam]}</p>
              ) : null}
              {status === "SUBMITTED" ? (
                <p className="mt-2 text-xs text-amber-800">Waiting for Principal. Not visible to students.</p>
              ) : null}
              {status === "APPROVED" ? (
                <p className="mt-2 text-xs text-emerald-800">Published to students.</p>
              ) : (
                <button
                  type="button"
                  disabled={!canSubmit || pending}
                  onClick={() =>
                    start(async () => {
                      const r = await submitExam(exam);
                      setMsg(r.error ?? `${EXAM_META[exam].label} submitted. Waiting for Principal approval.`);
                      router.refresh();
                    })
                  }
                  className="mt-2 rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                >
                  {pending ? "Please wait…" : `Submit ${EXAM_META[exam].label}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {msg ? <p className="mt-3 text-sm text-slate-600">{msg}</p> : null}
    </section>
  );
}

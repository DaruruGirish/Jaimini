"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveClass, approveExam, rejectClass, rejectExam } from "@/lib/actions/principal";
import type { ClassMarksStatus } from "@/lib/status";
import { EXAM_META, SINGLE_EXAMS, examStatusLabel, type SingleExam } from "@/lib/exams";
import { statusBadgeClass } from "@/lib/status";

type ExamRow = { exam: SingleExam; status: string; rejectedReason?: string | null };

export default function ApproveBar({
  classId,
  canApprove,
  approved,
  studentCount,
  status,
  exams,
}: {
  classId: string;
  canApprove: boolean;
  approved: boolean;
  studentCount: number;
  status: ClassMarksStatus;
  exams: ExamRow[];
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const byExam = Object.fromEntries(exams.map((e) => [e.exam, e]));

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <div>
          <h3 className="font-semibold text-[#0C2A5A]">Approve one exam</h3>
          <p className="text-sm text-slate-600">
            Approving FA1 publishes only FA1 cards for this class. FA2 and Overall stay locked until you approve those
            separately.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SINGLE_EXAMS.map((exam) => {
            const row = byExam[exam];
            const examStatus = row?.status ?? "DRAFT";
            const label = examStatusLabel(examStatus);
            const canExamApprove = examStatus === "SUBMITTED" || examStatus === "REJECTED";
            const canExamReject = examStatus === "SUBMITTED" || examStatus === "APPROVED";
            return (
              <div key={exam} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-[#0C2A5A]">{EXAM_META[exam].label}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${statusBadgeClass(label as ClassMarksStatus)}`}>
                    {label}
                  </span>
                </div>
                {examStatus === "REJECTED" && row?.rejectedReason ? (
                  <p className="mt-1 text-xs text-red-700">{row.rejectedReason}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!canExamApprove || pending}
                    onClick={() =>
                      start(async () => {
                        const r = await approveExam(classId, exam);
                        setMsg(r.error ?? `${EXAM_META[exam].label} approved. Students can now view that card.`);
                        router.refresh();
                      })
                    }
                    className="rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                  >
                    Approve {EXAM_META[exam].label}
                  </button>
                  <button
                    type="button"
                    disabled={!canExamReject || pending}
                    onClick={() =>
                      start(async () => {
                        const r = await rejectExam(classId, exam, reason);
                        setMsg(r.error ?? `${EXAM_META[exam].label} rejected. Students cannot see it.`);
                        router.refresh();
                      })
                    }
                    className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                  >
                    Reject
                  </button>
                  {examStatus === "APPROVED" ? (
                    <a
                      href={`/print/class-exam/${classId}/${exam}`}
                      className="rounded-full bg-[#0C2A5A] px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Print cards
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm">
        <div>
          <h3 className="font-semibold text-[#0C2A5A]">Overall year card</h3>
          <p className="text-sm text-slate-600">
            The class teacher sends one request for the full-year blue card. You approve or reject all {studentCount}{" "}
            students together. This does not publish FA/SA cards.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <button
            disabled={!canApprove || pending}
            onClick={() =>
              start(async () => {
                const r = await approveClass(classId);
                setMsg(r.error ?? "Overall year cards are approved.");
                router.refresh();
              })
            }
            className="rounded-full bg-emerald-700 px-5 py-2.5 text-white disabled:opacity-40"
          >
            {pending ? "Please wait…" : "Approve overall year card"}
          </button>
          <div className="flex gap-2">
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reject comment"
              className="rounded-lg border px-3 py-2"
            />
            <button
              disabled={pending || status === "Not started"}
              onClick={() =>
                start(async () => {
                  const r = await rejectClass(classId, reason);
                  setMsg(r.error ?? "Overall rejected. The teacher can edit and send the year card again.");
                  router.refresh();
                })
              }
              className="rounded-full bg-red-600 px-4 py-2 text-white disabled:opacity-40"
            >
              Reject overall
            </button>
          </div>
          {approved ? (
            <a href={`/print/class/${classId}`} className="rounded-full bg-[#0C2A5A] px-4 py-2 text-white">
              Print all year cards
            </a>
          ) : null}
        </div>
        {approved ? (
          <p className="text-sm text-emerald-800">Overall year card is approved.</p>
        ) : status === "Rejected" ? (
          <p className="text-sm text-amber-800">
            Overall was rejected and stays in Pending. You can approve it now, or wait for the teacher to send it again.
          </p>
        ) : canApprove ? (
          <p className="text-sm text-amber-800">The teacher has sent an overall approval request.</p>
        ) : (
          <p className="text-sm text-amber-800">Waiting for the class teacher to send the overall year card.</p>
        )}
        {msg ? <p className="text-sm text-slate-600">{msg}</p> : null}
      </div>
    </div>
  );
}

export function ApproveClassButton({ classId }: { classId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await approveClass(classId);
            setMsg(r.error ?? "Class approved.");
            router.refresh();
          })
        }
        className="rounded-full bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
      >
        {pending ? "Approving…" : "Approve this class"}
      </button>
      {msg ? <p className="text-xs text-slate-600">{msg}</p> : null}
    </div>
  );
}

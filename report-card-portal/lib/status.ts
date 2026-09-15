import type { MarkSheetStatus } from "@prisma/client";

export type ClassMarksStatus = "Not started" | "Draft" | "Submitted" | "Approved" | "Rejected";

export function classMarksStatus(statuses: MarkSheetStatus[], studentCount: number): ClassMarksStatus {
  if (studentCount === 0 || statuses.length === 0) return "Not started";
  if (statuses.length < studentCount && statuses.every((s) => s === "DRAFT")) return "Draft";
  if (statuses.length < studentCount && statuses.length === 0) return "Not started";
  if (statuses.some((s) => s === "REJECTED")) return "Rejected";
  if (statuses.length === studentCount && statuses.every((s) => s === "APPROVED")) return "Approved";
  if (statuses.some((s) => s === "SUBMITTED") || statuses.every((s) => s === "APPROVED" || s === "SUBMITTED")) {
    if (statuses.filter((s) => s === "SUBMITTED" || s === "APPROVED").length === studentCount) return "Submitted";
  }
  if (statuses.some((s) => s === "SUBMITTED")) return "Submitted";
  if (statuses.some((s) => s === "DRAFT") || statuses.length < studentCount) return "Draft";
  return "Not started";
}

export function isPendingClass(status: ClassMarksStatus) {
  return status === "Submitted" || status === "Rejected";
}

export function statusBadgeClass(status: ClassMarksStatus) {
  switch (status) {
    case "Approved":
      return "bg-emerald-100 text-emerald-800";
    case "Submitted":
      return "bg-sky-100 text-sky-800";
    case "Rejected":
      return "bg-red-100 text-red-800";
    case "Draft":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

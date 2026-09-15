import { prisma } from "@/lib/prisma";
import type { Subject, SubjectPart } from "@prisma/client";

export const DEFAULT_PART_A = ["Kannada", "English", "Hindi", "Mathematics", "EVS/Science"];
export const DEFAULT_PART_B = ["Computer Science", "Physical Education", "Drawing"];

export async function ensureDefaultSubjects(classId: string) {
  const existingA = await prisma.subject.count({ where: { classId, part: "A" } });
  if (existingA > 0) return;
  const data: { classId: string; name: string; part: SubjectPart; sortOrder: number; active: boolean }[] = [
    ...DEFAULT_PART_A.map((name, i) => ({ classId, name, part: "A" as const, sortOrder: i + 1, active: true })),
    ...DEFAULT_PART_B.map((name, i) => ({ classId, name, part: "B" as const, sortOrder: DEFAULT_PART_A.length + i + 1, active: true })),
  ];
  await prisma.subject.createMany({ data });
}

export async function getClassSubjects(classId: string, opts?: { includeInactive?: boolean }) {
  await ensureDefaultSubjects(classId);
  const all = await prisma.subject.findMany({
    where: opts?.includeInactive ? { classId } : { classId, active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return {
    all,
    a: all.filter((s) => s.part === "A"),
    b: all.filter((s) => s.part === "B"),
  };
}

export async function classHasMarkCells(classId: string) {
  const count = await prisma.markCell.count({
    where: { subject: { classId } },
  });
  const partB = await prisma.partBCell.count({
    where: { subject: { classId } },
  });
  return count + partB > 0;
}

export async function subjectHasMarks(subjectId: string) {
  const a = await prisma.markCell.count({ where: { subjectId } });
  const b = await prisma.partBCell.count({ where: { subjectId } });
  return a + b > 0;
}

export function splitByPart(subjects: Subject[]) {
  return {
    a: subjects.filter((s) => s.part === "A"),
    b: subjects.filter((s) => s.part === "B"),
  };
}

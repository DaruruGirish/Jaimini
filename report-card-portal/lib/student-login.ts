import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export function studentUsernameFromName(name: string, rollNo: number) {
  const first = (name.trim().split(/\s+/)[0] ?? "").toLowerCase();
  const letters = first.replace(/[^a-z]/g, "");
  const prefix = letters.length === 0 ? "stu" : letters.length < 3 ? letters : letters.slice(0, 3);
  return `${prefix}${rollNo}`;
}

export function mobileDigits(raw: string) {
  return String(raw ?? "").replace(/\D/g, "");
}

export async function uniqueStudentUsername(base: string, exceptUserId?: string) {
  let candidate = base;
  let n = 2;
  for (;;) {
    const taken = await prisma.user.findUnique({ where: { email: candidate } });
    if (!taken || taken.id === exceptUserId) return candidate;
    candidate = `${base}${n}`;
    n += 1;
  }
}

export async function provisionStudentLogin(opts: {
  studentId: string;
  name: string;
  rollNo: number;
  parentMobile: string;
}) {
  const mobile = mobileDigits(opts.parentMobile);
  if (mobile.length < 10) return { error: "Parent mobile must have at least 10 digits" };

  const existing = await prisma.user.findUnique({ where: { studentId: opts.studentId } });
  if (!existing) {
    const username = await uniqueStudentUsername(studentUsernameFromName(opts.name, opts.rollNo));
    await prisma.user.create({
      data: {
        name: opts.name,
        email: username,
        passwordHash: await bcrypt.hash(mobile, 10),
        role: "STUDENT",
        studentId: opts.studentId,
      },
    });
    return { ok: true, username };
  }

  const data: { name: string; passwordHash?: string } = { name: opts.name };
  if (!existing.passwordChangedAt) {
    data.passwordHash = await bcrypt.hash(mobile, 10);
  }
  await prisma.user.update({ where: { id: existing.id }, data });
  return { ok: true, username: existing.email };
}

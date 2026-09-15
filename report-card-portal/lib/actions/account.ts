"use server";

import bcrypt from "bcryptjs";
import { requireUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export async function changePassword(_prev: { error?: string; ok?: boolean } | null, formData: FormData) {
  const user = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!current || !next || !confirm) return { error: "Fill all three fields." };
  if (next !== confirm) return { error: "New password and confirm do not match." };
  if (next.length < 6) return { error: "New password must be at least 6 characters." };
  const row = await prisma.user.findUnique({ where: { id: user.id } });
  if (!row) return { error: "Account not found." };
  const ok = await bcrypt.compare(current, row.passwordHash);
  if (!ok) return { error: "Current password is wrong." };
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(next, 10), passwordChangedAt: new Date() },
  });
  return { ok: true };
}

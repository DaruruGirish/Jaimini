import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "PRINCIPAL" && session.user.role !== "CLASS_TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const form = await req.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") ?? "photo");
  if (session.user.role === "CLASS_TEACHER" && kind !== "photo") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }
  const ext = path.extname(file.name) || ".png";
  const dir = kind === "logo" ? "logo" : kind === "announcement" ? "announcements" : "photos";
  const folder = path.join(process.cwd(), "public", "uploads", dir);
  await mkdir(folder, { recursive: true });
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  await writeFile(path.join(folder, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${dir}/${name}` });
}

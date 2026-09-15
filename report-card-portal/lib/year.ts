import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const YEAR_COOKIE = "academicYearId";

export async function getSelectedYear() {
  const years = await prisma.academicYear.findMany({ orderBy: { label: "desc" } });
  const jar = await cookies();
  const cookieId = jar.get(YEAR_COOKIE)?.value;
  const selected =
    years.find((y) => y.id === cookieId) ?? years.find((y) => y.isActive) ?? years[0] ?? null;
  return { years, selected };
}

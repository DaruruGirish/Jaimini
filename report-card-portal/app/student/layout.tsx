import StudentShell from "@/components/StudentShell";
import { requireStudent } from "@/lib/guards";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStudent();
  return (
    <StudentShell userId={user.id} name={user.name ?? "Student"}>
      {children}
    </StudentShell>
  );
}

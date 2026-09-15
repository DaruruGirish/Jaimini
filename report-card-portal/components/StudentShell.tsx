import { signOut } from "@/auth";
import { studentEnrollment } from "@/lib/guards";
import StudentSidebar from "./StudentSidebar";

export default async function StudentShell({
  userId,
  name,
  children,
}: {
  userId: string;
  name: string;
  children: React.ReactNode;
}) {
  const ctx = await studentEnrollment(userId);
  const enrollment = ctx?.enrollment;
  return (
    <div className="min-h-screen bg-[#eef4fb] text-slate-800">
      <header className="no-print bg-[#0C2A5A] text-white">
        <div className="flex items-center justify-between gap-4 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <img
              src="/uploads/logo/jaimini-logo.png"
              alt=""
              className="h-8 w-8 rounded-full bg-white object-contain p-0.5"
            />
            <div>
              <p className="text-[10px] tracking-widest text-sky-200">JAIMINI PUBLIC SCHOOL</p>
              <h1 className="text-sm font-semibold">Student portal</h1>
            </div>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button className="rounded-full border border-white/30 px-3 py-1 text-sm hover:bg-white/10">Logout</button>
          </form>
        </div>
      </header>
      <div className="flex flex-col lg:flex-row lg:items-start">
        <StudentSidebar
          name={ctx?.student.name ?? name}
          photoUrl={ctx?.student.photoUrl ?? ""}
          rollNo={enrollment ? String(enrollment.rollNo) : "—"}
          className={enrollment ? enrollment.class.name : "—"}
          section={enrollment ? enrollment.class.section : "—"}
          yearLabel={enrollment?.year.label ?? ""}
        />
        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

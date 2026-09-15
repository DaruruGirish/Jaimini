import Link from "next/link";
import { signOut } from "@/auth";
import YearSelect from "@/components/YearSelect";
import type { AppRole } from "@/lib/roles";

const principalLinks = [
  ["Dashboard", "/principal"],
  ["Classes", "/principal/classes"],
  ["Analytics", "/principal/analytics"],
  ["Print", "/principal/print"],
  ["Teachers", "/principal/teachers"],
  ["Announcements", "/principal/announcements"],
  ["Appointments", "/principal/appointments"],
  ["Settings", "/principal/settings"],
  ["Password", "/principal/password"],
];

const teacherLinks = [
  ["My class", "/teacher"],
  ["Students", "/teacher/students"],
  ["Subjects", "/teacher/subjects"],
  ["Syllabus", "/teacher/syllabus"],
  ["Enter marks", "/teacher/marks"],
  ["Analytics", "/teacher/analytics"],
  ["Print desk", "/teacher/print"],
  ["Announcements", "/teacher/announcements"],
  ["Appointments", "/teacher/appointments"],
  ["Notifications", "/teacher/notifications"],
  ["Password", "/teacher/password"],
];

const studentLinks = [
  ["Marks", "/student/marks"],
  ["Announcements", "/student/announcements"],
  ["Grievance", "/student/grievance"],
  ["Password", "/student/password"],
];

export default function AppShell({
  role,
  name,
  children,
  years,
  selectedYearId,
  unreadCount,
}: {
  role: AppRole;
  name: string;
  children: React.ReactNode;
  years?: { id: string; label: string }[];
  selectedYearId?: string;
  unreadCount?: number;
}) {
  const links = role === "PRINCIPAL" ? principalLinks : role === "CLASS_TEACHER" ? teacherLinks : studentLinks;
  return (
    <div className="min-h-screen bg-[#eef4fb] text-slate-800">
      <header className="bg-[#0C2A5A] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="/uploads/logo/jaimini-logo.png" alt="" className="h-10 w-10 rounded-full bg-white object-contain p-0.5" />
            <div>
              <p className="text-xs tracking-widest text-sky-200">JAIMINI PUBLIC SCHOOL</p>
              <h1 className="text-sm font-semibold sm:text-base">Report Card Management System</h1>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {role === "PRINCIPAL" && years && selectedYearId ? (
              <YearSelect years={years} selectedId={selectedYearId} />
            ) : null}
            <span className="hidden sm:inline text-sky-100">{name}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button className="rounded-full border border-white/30 px-3 py-1 hover:bg-white/10">Logout</button>
            </form>
          </div>
        </div>
        <nav className="bg-[#163E73]">
          <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2">
            {links.map(([label, href]) => (
              <Link key={href} href={href} className="whitespace-nowrap px-4 py-2.5 text-base font-medium text-sky-50 hover:bg-white/10">
                {label}
                {href === "/teacher/notifications" && unreadCount ? (
                  <span className="ml-2 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-[#0C2A5A]">{unreadCount}</span>
                ) : null}
              </Link>
            ))}
            <Link href="/verify" className="ml-auto whitespace-nowrap px-4 py-2.5 text-base text-sky-200 hover:bg-white/10">
              Verify
            </Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

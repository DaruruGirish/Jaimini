"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/student/marks", label: "Marks", icon: MarksIcon, match: "/student/exam" },
  { href: "/student/announcements", label: "Announcements", icon: AnnouncementsIcon },
  { href: "/student/grievance", label: "Grievance", icon: GrievanceIcon },
  { href: "/student/syllabus", label: "Syllabus", icon: SyllabusIcon },
  { href: "/student/fees", label: "Fee Details", icon: FeesIcon },
  { href: "/student/password", label: "Change password", icon: PasswordIcon },
];

function isActive(pathname: string, href: string, match?: string) {
  if (pathname === href || pathname.startsWith(`${href}/`)) return true;
  if (match && (pathname === match || pathname.startsWith(`${match}/`))) return true;
  return false;
}

export default function StudentSidebar({
  name,
  photoUrl,
  rollNo,
  className,
  section,
  yearLabel,
}: {
  name: string;
  photoUrl: string;
  rollNo: string;
  className: string;
  section: string;
  yearLabel: string;
}) {
  const pathname = usePathname();
  return (
    <aside className="student-sidebar flex w-full flex-col bg-white shadow-md lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:w-64 lg:shrink-0 lg:overflow-y-auto">
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-start gap-3">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt=""
              className="h-[88px] w-[72px] rounded-sm border-2 border-[#0C2A5A] object-cover"
            />
          ) : (
            <div className="flex h-[88px] w-[72px] items-center justify-center rounded-sm border-2 border-[#0C2A5A] bg-slate-100 text-[#0C2A5A]">
              <PlaceholderPhoto />
            </div>
          )}
          <div className="min-w-0 pt-1">
            <p className="text-base font-bold uppercase leading-tight text-[#0C2A5A]">{name}</p>
          </div>
        </div>
        <dl className="mt-3 space-y-0.5 text-sm text-slate-600">
          <div>
            <dt className="inline text-slate-500">Roll No.: </dt>
            <dd className="inline font-medium text-slate-800">{rollNo}</dd>
          </div>
          <div>
            <dt className="inline text-slate-500">Class: </dt>
            <dd className="inline font-medium text-slate-800">{className}</dd>
          </div>
          <div>
            <dt className="inline text-slate-500">Section: </dt>
            <dd className="inline font-medium text-slate-800">{section}</dd>
          </div>
          {yearLabel ? (
            <div>
              <dt className="inline text-slate-500">Year: </dt>
              <dd className="inline font-medium text-slate-800">{yearLabel}</dd>
            </div>
          ) : null}
        </dl>
      </div>
      <nav className="flex-1 py-1">
        {links.map((item) => {
          const active = isActive(pathname, item.href, item.match);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium ${
                active ? "bg-[#0C2A5A] text-white" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon className={active ? "text-white" : "text-[#0C2A5A]"} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function PlaceholderPhoto() {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19c1.2-3.2 3.7-5 7-5s5.8 1.8 7 5" />
    </svg>
  );
}

function MarksIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 shrink-0 ${className ?? ""}`} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19V5h12l4 4v10H4z" />
      <path d="M16 5v4h4M8 12h8M8 16h5" />
    </svg>
  );
}

function AnnouncementsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 shrink-0 ${className ?? ""}`} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 10v4l8 3V7L4 10z" />
      <path d="M12 8.5c2.2.4 4.5.4 7-.5v8c-2.5.9-4.8.9-7 .5" />
      <path d="M7 14.5V18" />
    </svg>
  );
}

function GrievanceIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 shrink-0 ${className ?? ""}`} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 16.5 3 20l4.2-1.4A8 8 0 1 0 5 16.5z" />
    </svg>
  );
}

function SyllabusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 shrink-0 ${className ?? ""}`} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 5h7a3 3 0 0 1 3 3v12H7a3 3 0 0 0-3 3V5z" />
      <path d="M14 8h6v12h-3a3 3 0 0 0-3 3V8z" />
    </svg>
  );
}

function FeesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 shrink-0 ${className ?? ""}`} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 7h7.5a3.5 3.5 0 0 1 0 7H9m-2 4h7.5a3.5 3.5 0 0 0 0-7" />
      <path d="M12 4v16" />
    </svg>
  );
}

function PasswordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 shrink-0 ${className ?? ""}`} fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

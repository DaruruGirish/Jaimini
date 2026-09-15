import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0C2A5A] p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <img src="/uploads/logo/jaimini-logo.png" alt="Jaimini Public School" className="mx-auto mb-4 h-20 w-20 rounded-full object-contain" />
        <p className="text-center text-xs tracking-[0.25em] text-sky-700">HIRIYUR</p>
        <h1 className="text-center text-xl font-bold text-[#0C2A5A]">Report Card Management System</h1>
        <p className="mb-6 mt-1 text-center text-sm text-slate-500">Jaimini Public School — Principal, Class Teacher &amp; Student</p>
        <LoginForm />
      </div>
    </div>
  );
}

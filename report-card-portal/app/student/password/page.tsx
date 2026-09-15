import ChangePasswordForm from "@/components/ChangePasswordForm";

export default function StudentPasswordPage() {
  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold text-[#0C2A5A]">Change password</h2>
      <p className="text-sm text-slate-600">
        First login uses the parent mobile number (digits only). After you change it here, the mobile is no longer the password.
      </p>
      <ChangePasswordForm />
    </div>
  );
}

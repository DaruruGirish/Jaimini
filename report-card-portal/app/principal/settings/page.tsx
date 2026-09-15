import { prisma } from "@/lib/prisma";
import { updateSettings } from "@/lib/actions/principal";
import PhotoField from "@/components/PhotoField";

export default async function SettingsPage() {
  const s = await prisma.schoolSettings.findUnique({ where: { id: "singleton" } });
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-[#0C2A5A]">Settings</h2>
      <p className="text-sm text-slate-600">School details used on report cards. Logout is in the top bar.</p>
      <form action={updateSettings} className="grid max-w-xl gap-3 rounded-xl bg-white p-5 shadow-sm">
        <label className="text-sm">
          School name
          <input name="name" defaultValue={s?.name} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <label className="text-sm">
          Address
          <input name="address" defaultValue={s?.address} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <label className="text-sm">
          Phone
          <input name="phone" defaultValue={s?.phone} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <label className="text-sm">
          Website
          <input name="website" defaultValue={s?.website} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <label className="text-sm">
          School code
          <input name="schoolCode" defaultValue={s?.schoolCode} className="mt-1 w-full rounded-lg border px-3 py-2" />
        </label>
        <div>
          <p className="text-sm">Logo</p>
          <PhotoField name="logoUrl" defaultUrl={s?.logoUrl} />
        </div>
        <button className="rounded-full bg-[#0C2A5A] py-2 text-white">Save settings</button>
      </form>
    </div>
  );
}

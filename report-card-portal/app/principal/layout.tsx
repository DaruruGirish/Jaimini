import AppShell from "@/components/AppShell";
import { requirePrincipal } from "@/lib/guards";
import { getSelectedYear } from "@/lib/year";

export default async function PrincipalLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePrincipal();
  const { years, selected } = await getSelectedYear();
  return (
    <AppShell role="PRINCIPAL" name={user.name ?? "Principal"} years={years} selectedYearId={selected?.id}>
      {children}
    </AppShell>
  );
}

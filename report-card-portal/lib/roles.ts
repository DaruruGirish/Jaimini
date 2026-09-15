export type AppRole = "PRINCIPAL" | "CLASS_TEACHER" | "STUDENT";

export function homeForRole(role: AppRole | undefined) {
  if (role === "PRINCIPAL") return "/principal";
  if (role === "CLASS_TEACHER") return "/teacher";
  return "/student/marks";
}

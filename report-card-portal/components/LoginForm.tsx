"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });
    setPending(false);
    if (res?.error) {
      setError("Wrong email, username or password");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm">
        Email or student username
        <input name="email" type="text" autoComplete="username" required className="mt-1 w-full rounded-lg border border-sky-200 px-3 py-2" defaultValue="principal@jaimini.edu" />
      </label>
      <label className="block text-sm">
        Password
        <input name="password" type="password" required className="mt-1 w-full rounded-lg border border-sky-200 px-3 py-2" defaultValue="principal123" />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button disabled={pending} className="w-full rounded-full bg-[#0C2A5A] py-2.5 text-white hover:bg-[#163E73] disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-xs text-slate-500">
        Principal: principal@jaimini.edu / principal123
        <br />
        Class teacher 12-A: teacher12a@jaimini.edu / teacher123
        <br />
        Student (Manvitha, roll 12): man12 / 9876543210
      </p>
    </form>
  );
}

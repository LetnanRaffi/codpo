"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { safeLocalPath } from "@/lib/navigation";

const loginSchema = z.object({
  email: z.string().email("Email gak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

function LoginForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const notice =
    searchParams.get("registered") === "1"
      ? "Akun berhasil dibuat. Cek email untuk konfirmasi, lalu masuk."
      : searchParams.get("password_updated") === "1"
        ? "Password berhasil diperbarui. Silakan masuk kembali."
        : "";
  const formError = errors.form || searchParams.get("auth_error");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const result = loginSchema.safeParse(data);
    if (!result.success) {
      const flat: Record<string, string> = {};
      for (const issue of result.error.issues) {
        flat[issue.path[0] as string] = issue.message;
      }
      setErrors(flat);
      return;
    }
    setErrors({});
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(result.data);
    setPending(false);
    if (error) {
      setErrors({
        form:
          error.message === "Invalid login credentials"
            ? "Email atau password salah"
            : error.message,
      });
      return;
    }
    const next = new URLSearchParams(window.location.search).get("next");
    router.replace(safeLocalPath(next));
    router.refresh();
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <h1 className="font-display text-2xl font-bold tracking-wide uppercase">
        Masuk
      </h1>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">
        Satu akun buat jadi buyer &amp; seller.
      </p>

      {notice && (
        <p
          role="status"
          className="mb-4 rounded-lg bg-trust-green/10 p-3 text-sm text-trust-green"
        >
          {notice}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="nama@email.com"
            aria-invalid={!!errors.email}
            className="rounded-lg"
          />
          {errors.email && (
            <p role="alert" className="text-xs font-medium text-bu-red-deep">
              {errors.email}
            </p>
          )}
        </div>

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-bu-red hover:underline"
          >
            Lupa password?
          </Link>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Minimal 8 karakter"
            aria-invalid={!!errors.password}
            className="rounded-lg"
          />
          {errors.password && (
            <p role="alert" className="text-xs font-medium text-bu-red-deep">
              {errors.password}
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="w-full rounded-full font-bold"
        >
          {pending ? "Memeriksa…" : "Masuk"}
        </Button>
        {formError && (
          <p role="alert" className="text-sm font-medium text-bu-red-deep">
            {formError}
          </p>
        )}
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="font-semibold text-bu-red hover:underline"
        >
          Daftar
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          Memuat formulir masuk…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

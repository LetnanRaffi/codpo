"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email("Email gak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export default function LoginPage() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-card px-6 py-12 text-center">
        <CheckCircle2 className="size-10 text-trust-green" aria-hidden />
        <p className="font-display text-2xl font-bold tracking-wide uppercase">
          Login berhasil
        </p>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
          Demo frontend — belum nyambung Supabase Auth. Begitu aktif, kamu
          langsung masuk ke beranda.
        </p>
        <Button className="mt-2 rounded-full" asChild>
          <Link href="/">Ke beranda</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <h1 className="font-display text-2xl font-bold tracking-wide uppercase">
        Masuk
      </h1>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">
        Satu akun buat jadi buyer &amp; seller.
      </p>

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
          className="w-full rounded-full font-bold"
        >
          Masuk
        </Button>
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

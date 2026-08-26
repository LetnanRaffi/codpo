"use client";

import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const schema = z.string().trim().email("Email gak valid");

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Email gak valid");
      return;
    }
    setPending(true);
    setError("");
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", "/reset-password");
    const { error: resetError } =
      await createClient().auth.resetPasswordForEmail(parsed.data, {
        redirectTo: callback.toString(),
      });
    setPending(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setMessage(
      "Kalau email terdaftar, tautan reset sudah dikirim. Periksa inbox dan spam.",
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <h1 className="font-display text-2xl font-bold tracking-wide uppercase">
        Reset password
      </h1>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">
        Kami akan mengirim tautan aman ke email akunmu.
      </p>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="reset-email">Email</Label>
          <Input
            id="reset-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={!!error}
            placeholder="nama@email.com"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-bu-red-deep">
            {error}
          </p>
        )}
        {message && (
          <p
            role="status"
            className="rounded-lg bg-trust-green/10 p-3 text-sm text-trust-green"
          >
            {message}
          </p>
        )}
        <Button
          type="submit"
          className="w-full rounded-full"
          disabled={pending}
        >
          {pending ? "Mengirim…" : "Kirim tautan reset"}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="font-semibold text-bu-red hover:underline"
        >
          Kembali ke login
        </Link>
      </p>
    </div>
  );
}

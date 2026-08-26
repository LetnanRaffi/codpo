"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void createClient()
      .auth.getUser()
      .then(({ data }) => setReady(Boolean(data.user)))
      .finally(() => setChecking(false));
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) return setError("Password minimal 8 karakter");
    if (password !== confirm) return setError("Konfirmasi password gak sama");
    setPending(true);
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (updateError) return setError(updateError.message);
    await supabase.auth.signOut();
    router.replace("/login?password_updated=1");
    router.refresh();
  }

  if (checking) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Memeriksa tautan reset…
      </div>
    );
  }
  if (!ready) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm">
        <p className="text-muted-foreground">
          Tautan reset tidak valid atau sudah kedaluwarsa.
        </p>
        <Link
          href="/forgot-password"
          className="mt-3 inline-block font-semibold text-bu-red hover:underline"
        >
          Minta tautan baru
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <h1 className="font-display text-2xl font-bold tracking-wide uppercase">
        Buat password baru
      </h1>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">
        Gunakan minimal 8 karakter yang sulit ditebak.
      </p>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="new-password">Password baru</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Ulangi password</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-bu-red-deep">
            {error}
          </p>
        )}
        <Button
          type="submit"
          className="w-full rounded-full"
          disabled={pending}
        >
          {pending ? "Menyimpan…" : "Simpan password baru"}
        </Button>
      </form>
    </div>
  );
}

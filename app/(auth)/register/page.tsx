"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const registerSchema = z
  .object({
    name: z.string().min(3, "Nama minimal 3 karakter"),
    email: z.string().email("Email gak valid"),
    phone: z
      .string()
      .regex(/^08\d{8,11}$/, "Nomor HP format 08xxx, 10–13 digit"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirm: z.string(),
    agree: z.literal("on", {
      message: "Kamu harus setuju Syarat & Ketentuan dulu",
    }),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Konfirmasi password gak sama",
    path: ["confirm"],
  });

export default function RegisterPage() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [agreed, setAgreed] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const result = registerSchema.safeParse(data);
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
          Akun siap
        </p>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
          Demo frontend — akun belum dibuat di Supabase. Setelah backend aktif,
          verifikasi email bakal jalan.
        </p>
        <Button className="mt-2 rounded-full" asChild>
          <Link href="/login">Masuk sekarang</Link>
        </Button>
      </div>
    );
  }

  const field = (
    id: string,
    label: string,
    props: React.ComponentProps<typeof Input>,
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} required {...props} />
      {errors[id] && (
        <p role="alert" className="text-xs font-medium text-bu-red-deep">
          {errors[id]}
        </p>
      )}
    </div>
  );

  return (
    <div className="rounded-xl border bg-card p-6">
      <h1 className="font-display text-2xl font-bold tracking-wide uppercase">
        Daftar
      </h1>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">
        Gratis. Jual barang BU, cari barang murah sekitar.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {field("name", "Nama", {
          autoComplete: "name",
          placeholder: "Nama kamu",
          "aria-invalid": !!errors.name,
          className: "rounded-lg",
        })}
        {field("email", "Email", {
          type: "email",
          autoComplete: "email",
          placeholder: "nama@email.com",
          "aria-invalid": !!errors.email,
          className: "rounded-lg",
        })}
        {field("phone", "No. WhatsApp", {
          type: "tel",
          inputMode: "numeric",
          autoComplete: "tel",
          placeholder: "08xxxxxxxxxx",
          "aria-invalid": !!errors.phone,
          className: "rounded-lg font-mono",
        })}
        {field("password", "Password", {
          type: "password",
          autoComplete: "new-password",
          placeholder: "Minimal 8 karakter",
          "aria-invalid": !!errors.password,
          className: "rounded-lg",
        })}
        {field("confirm", "Ulangi password", {
          type: "password",
          autoComplete: "new-password",
          placeholder: "Sama dengan password",
          "aria-invalid": !!errors.confirm,
          className: "rounded-lg",
        })}

        <div className="space-y-1.5">
          <Label className="flex items-start gap-2.5 text-sm leading-snug font-normal">
            <Checkbox
              name="agree"
              checked={agreed}
              onCheckedChange={(v) => setAgreed(v === true)}
              aria-required
              className="mt-0.5"
            />
            <span>
              Saya menyetujui{" "}
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-bu-red underline underline-offset-2"
              >
                Syarat &amp; Ketentuan
              </Link>{" "}
              dan{" "}
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-bu-red underline underline-offset-2"
              >
                Kebijakan Privasi
              </Link>
              .
            </span>
          </Label>
          {errors.agree && (
            <p role="alert" className="text-xs font-medium text-bu-red-deep">
              {errors.agree}
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={!agreed}
          className="w-full rounded-full font-bold"
        >
          Buat akun
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link
          href="/login"
          className="font-semibold text-bu-red hover:underline"
        >
          Masuk
        </Link>
      </p>
    </div>
  );
}

"use client";

import { Moon, Sun, UserRound } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";

import { useAuth } from "@/components/providers/auth-provider";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ThemeMenuItem() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <DropdownMenuItem
      onSelect={(e) => {
        e.preventDefault();
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
      }}
    >
      <Sun className="hidden dark:block" aria-hidden />
      <Moon className="dark:hidden" aria-hidden />
      Ganti tema
    </DropdownMenuItem>
  );
}

export function AccountMenu() {
  const { user, profile, loading, error, signOut, setMode } = useAuth();
  const [actionError, setActionError] = useState("");
  const name = profile?.name ?? user?.email ?? "Pengguna";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-full"
          aria-label="Menu akun"
        >
          <Avatar className="size-8">
            <AvatarImage alt="" />
            <AvatarFallback className="bg-secondary text-xs font-semibold">
              {user ? initials(name) : <UserRound className="size-4" />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        {user ? (
          <>
            <DropdownMenuLabel className="flex flex-col">
              <span>{name}</span>
              <span className="text-xs font-normal text-muted-foreground capitalize">
                Mode {profile?.mode === "seller" ? "penjual" : "pembeli"}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/seller/dashboard">Dashboard Seller</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                void setMode(
                  profile?.mode === "seller" ? "buyer" : "seller",
                ).catch((cause) =>
                  setActionError(
                    cause instanceof Error
                      ? cause.message
                      : "Gagal mengubah mode",
                  ),
                );
              }}
            >
              Ganti ke mode {profile?.mode === "seller" ? "pembeli" : "penjual"}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <UserRound /> Profil Saya
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <ThemeMenuItem />
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() =>
                void signOut().catch((cause) =>
                  setActionError(
                    cause instanceof Error ? cause.message : "Gagal keluar",
                  ),
                )
              }
            >
              Keluar
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link href="/login">Masuk</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/register">Daftar</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <ThemeMenuItem />
            <DropdownMenuSeparator />
          </>
        )}
        {loading && <DropdownMenuItem disabled>Memuat sesi…</DropdownMenuItem>}
        {(error || actionError) && (
          <DropdownMenuItem disabled className="text-bu-red-deep">
            {actionError || error}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

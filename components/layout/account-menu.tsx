"use client";

import { Moon, Sun, UserRound } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";

import { useMockAuth } from "@/components/providers/mock-auth-provider";
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
  const { user, toggle } = useMockAuth();

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
            <AvatarImage src={user?.avatar_url ?? undefined} alt="" />
            <AvatarFallback className="bg-secondary text-xs font-semibold">
              {user ? initials(user.name) : <UserRound className="size-4" />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        {user ? (
          <>
            <DropdownMenuLabel className="flex flex-col">
              <span>{user.name}</span>
              <span className="text-xs font-normal text-muted-foreground capitalize">
                Mode {user.mode === "buyer" ? "pembeli" : "penjual"}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/seller/dashboard">Dashboard Seller</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <UserRound /> Profil Saya
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <ThemeMenuItem />
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={toggle}>Keluar</DropdownMenuItem>
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
        <DropdownMenuItem
          onSelect={toggle}
          className="text-muted-foreground data-[highlighted]:text-foreground"
        >
          [DEV] {user ? "Keluar dari test user" : "Masuk sebagai test user"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

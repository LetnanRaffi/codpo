"use client";

import { ShoppingBag, Store } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ModeSwitcher() {
  const { user, profile, setMode } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const active = profile?.mode ?? (pathname.startsWith("/sell") || pathname.startsWith("/seller") ? "seller" : "buyer");
  async function change(mode: "buyer" | "seller") {
    if (mode === active || pending) return;
    if (!user) { router.push(mode === "seller" ? "/login?next=/sell" : "/login"); return; }
    setPending(true);
    try { await setMode(mode); router.push(mode === "seller" ? "/sell" : "/"); router.refresh(); }
    finally { setPending(false); }
  }
  return <div className="flex items-center rounded-full border bg-background p-0.5" aria-label="Mode aplikasi"><Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => void change("buyer")} className={cn("h-8 rounded-full px-2.5 text-xs", active === "buyer" && "bg-secondary font-semibold")}><ShoppingBag className="mr-1 size-3.5" />Beli</Button><Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => void change("seller")} className={cn("h-8 rounded-full px-2.5 text-xs", active === "seller" && "bg-bu-red text-white hover:bg-bu-red")}><Store className="mr-1 size-3.5" />Jual</Button></div>;
}

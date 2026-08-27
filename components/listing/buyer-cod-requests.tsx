"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/client/api";
import { Button } from "@/components/ui/button";

type RequestRow = { id: string; preferred_date: string; preferred_time: string; meeting_point: string; status: string };
export function BuyerCodRequests({ onChanged }: { onChanged?: () => void }) {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [error, setError] = useState("");
  const load = useCallback(async () => { try { const data = await apiFetch<{ items: RequestRow[] }>("/api/cod/requests?role=buyer"); setRows(data.items.filter((row) => ["requested", "countered"].includes(row.status))); } catch (cause) { setError(cause instanceof Error ? cause.message : "Gagal memuat request COD"); } }, []);
  useEffect(() => { void load(); }, [load]);
  async function act(id: string, action: "accept_counter" | "cancel") { try { await apiFetch(`/api/cod/requests/${id}`, { method: "PATCH", body: JSON.stringify({ action, request_id: id }) }); await load(); onChanged?.(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Gagal memproses request"); } }
  if (!rows.length && !error) return null;
  return <section className="rounded-xl border bg-card p-4"><h2 className="font-display text-lg font-bold uppercase">Request COD kamu</h2>{error && <p className="mt-2 text-sm text-bu-red-deep">{error}</p>}<div className="mt-3 space-y-2">{rows.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-paper-soft p-3 text-sm"><div><p className="font-semibold">{row.status === "countered" ? "Seller mengusulkan perubahan" : "Menunggu respons seller"}</p><p className="text-xs text-muted-foreground">{row.preferred_date} {row.preferred_time} · {row.meeting_point}</p></div><div className="flex gap-2">{row.status === "countered" && <Button size="sm" className="rounded-full" onClick={() => void act(row.id, "accept_counter")}>Terima</Button>}<Button size="sm" variant="outline" className="rounded-full" onClick={() => void act(row.id, "cancel")}>Batalkan</Button></div></div>)}</div></section>;
}

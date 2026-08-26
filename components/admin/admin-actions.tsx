"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/client/api";

function ActionButton({
  label,
  action,
  danger = false,
  confirmMessage,
}: {
  label: string;
  action: () => Promise<unknown>;
  danger?: boolean;
  confirmMessage?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        className={`h-8 rounded-full ${danger ? "text-bu-red-deep" : ""}`}
        onClick={() => {
          if (confirmMessage && !window.confirm(confirmMessage)) return;
          setPending(true);
          setError("");
          void action()
            .then(() => router.refresh())
            .catch((cause) =>
              setError(cause instanceof Error ? cause.message : "Gagal"),
            )
            .finally(() => setPending(false));
        }}
      >
        {pending ? "…" : label}
      </Button>
      {error && (
        <span
          className="block max-w-48 text-[10px] text-bu-red-deep"
          title={error}
        >
          Gagal: {error}
        </span>
      )}
    </>
  );
}

export function AdminUserActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  if (status !== "active")
    return (
      <ActionButton
        label="Restore"
        action={() =>
          apiFetch(`/api/admin/users/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ action: "restore" }),
          })
        }
      />
    );
  return (
    <div className="inline-flex">
      <ActionButton
        label="Suspend"
        confirmMessage="Suspend akun ini? User tidak dapat memakai API tulis sampai dipulihkan."
        action={() =>
          apiFetch(`/api/admin/users/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ action: "suspend" }),
          })
        }
      />
      <ActionButton
        label="Ban"
        danger
        confirmMessage="Blokir akun ini? Pastikan bukti moderasi sudah ditinjau."
        action={() =>
          apiFetch(`/api/admin/users/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ action: "ban" }),
          })
        }
      />
    </div>
  );
}

export function AdminListingActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const action = status === "removed" ? "restore" : "remove";
  return (
    <ActionButton
      label={action === "remove" ? "Hapus" : "Pulihkan"}
      danger={action === "remove"}
      confirmMessage={
        action === "remove"
          ? "Hapus listing ini dari marketplace?"
          : "Pulihkan listing ini ke marketplace?"
      }
      action={() =>
        apiFetch(`/api/admin/listings/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ action }),
        })
      }
    />
  );
}

export function AdminReportActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  if (["resolved", "dismissed"].includes(status))
    return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="inline-flex">
      <ActionButton
        label="Resolve"
        confirmMessage="Tandai laporan ini selesai?"
        action={() =>
          apiFetch(`/api/admin/reports/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ status: "resolved" }),
          })
        }
      />
      <ActionButton
        label="Tolak"
        confirmMessage="Tolak laporan ini tanpa tindakan lanjutan?"
        action={() =>
          apiFetch(`/api/admin/reports/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ status: "dismissed" }),
          })
        }
      />
    </div>
  );
}

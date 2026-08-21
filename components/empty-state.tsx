import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon,
  className,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center",
        className,
      )}
    >
      {icon && <div className="text-muted-foreground/60">{icon}</div>}
      <p className="font-semibold">{title}</p>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {actionLabel &&
        (actionHref ? (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="mt-2 rounded-full"
          >
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : (
          onAction && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 rounded-full"
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          )
        ))}
    </div>
  );
}

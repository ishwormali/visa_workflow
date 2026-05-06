import { type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  type VisaSessionRecord,
  type WorkflowDocumentState,
} from "@/lib/visa-workflow"

export function Field({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className="text-foreground text-sm font-medium">{label}</span>
      {children}
    </label>
  )
}

export function SummaryTile({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="border-border/70 bg-card/80 rounded-[1.5rem] border px-4 py-4">
      <p className="text-muted-foreground text-xs tracking-[0.22em] uppercase">
        {label}
      </p>
      <p className="text-foreground mt-2 text-sm leading-6 font-medium">
        {value}
      </p>
    </div>
  )
}

export function LogPanel({
  title,
  entries,
  emptyMessage,
  className,
}: {
  title: string
  entries: string[]
  emptyMessage: string
  className?: string
}) {
  return (
    <section
      className={cn(
        "rounded-[1.75rem] border border-border/70 bg-card/90 p-5",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-medium">{title}</h3>
        <span className="text-muted-foreground text-xs tracking-[0.24em] uppercase">
          Live log
        </span>
      </div>
      <div className="border-border/70 bg-primary/5 text-foreground mt-4 max-h-64 overflow-y-auto rounded-[1.25rem] border p-4 font-mono text-xs leading-6">
        {entries.length ? entries.join("\n") : emptyMessage}
      </div>
    </section>
  )
}

export function OverlayPanel({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="bg-foreground/30 fixed inset-0 z-40 px-4 py-6 backdrop-blur-sm sm:px-6">
      <div className="border-border/70 bg-background/95 mx-auto h-full max-w-4xl overflow-hidden rounded-[2rem] border shadow-[0_30px_80px_var(--color-shadow)]">
        <div className="border-border/70 flex items-center justify-between border-b px-6 py-5">
          <h2 className="font-heading text-2xl font-semibold">{title}</h2>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="h-[calc(100%-83px)] overflow-y-auto px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  )
}

export function StatusBadge({
  status,
}: {
  status: WorkflowDocumentState["status"] | VisaSessionRecord["status"]
}) {
  const className = {
    detected: "border-sky-500/20 bg-sky-500/10 text-sky-700",
    ready: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
    pending: "border-amber-500/20 bg-amber-500/10 text-amber-700",
    skipped: "border-border/70 bg-secondary text-secondary-foreground",
    sent: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
    draft: "border-sky-500/20 bg-sky-500/10 text-sky-700",
  }[status]

  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium capitalize",
        className
      )}
    >
      {status}
    </span>
  )
}

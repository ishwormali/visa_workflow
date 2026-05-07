import type { HTMLAttributes, ReactNode } from "react"

import { cn } from "@/lib/utils"

export function DocumentList({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col", className)} {...props} />
}

export function DocumentRow({
  number,
  label,
  meta,
  badge,
  files,
  inactive = false,
  children,
  className,
}: {
  number: number | string
  label: ReactNode
  meta?: ReactNode
  badge?: ReactNode
  files?: ReactNode
  inactive?: boolean
  children?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[28px_minmax(0,1fr)_auto] items-start gap-3 border-b border-[var(--rule)] px-4 py-3.5 last:border-b-0",
        inactive && "opacity-50",
        className
      )}
    >
      <div className="pt-0.5 [font-family:var(--font-mono)] text-[11px] text-[var(--ink-3)]">
        #{number}
      </div>
      <div className="min-w-0">
        <div className="mb-1 text-sm font-medium text-[var(--ink)]">
          {label}
        </div>
        {meta}
        {children}
        {files}
      </div>
      {badge ? <div>{badge}</div> : null}
    </div>
  )
}

export function DocumentMeta({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-x-2.5 gap-y-1 [font-family:var(--font-mono)] text-[11px] text-[var(--ink-3)]",
        className
      )}
      {...props}
    />
  )
}

export function DocumentMetaTag({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 before:h-[3px] before:w-[3px] before:rounded-full before:bg-[var(--ink-4)] before:content-[''] first:before:hidden",
        className
      )}
      {...props}
    />
  )
}

export function DocumentFiles({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mt-2 flex flex-col gap-1 border-t border-dashed border-[var(--rule)] pt-2",
        className
      )}
      {...props}
    />
  )
}

export function DocumentFile({
  icon = "▤",
  trailing,
  className,
  children,
}: {
  icon?: ReactNode
  trailing?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 [font-family:var(--font-mono)] text-[11px] text-[var(--ink-2)]",
        className
      )}
    >
      <span className="text-[var(--ink-4)]">{icon}</span>
      <span>{children}</span>
      {trailing ? (
        <span className="ml-auto text-[var(--ink-4)]">{trailing}</span>
      ) : null}
    </div>
  )
}

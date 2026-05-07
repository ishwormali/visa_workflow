import { cva, type VariantProps } from "class-variance-authority"
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react"

import { cn } from "@/lib/utils"

export const visaButtonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--vd-radius)] border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
  {
    variants: {
      variant: {
        default:
          "border-[var(--rule-2)] bg-[var(--paper)] text-[13px] text-[var(--ink)] hover:border-[var(--ink-4)] hover:bg-[var(--paper-3)]",
        primary:
          "border-[var(--ink)] bg-[var(--ink)] text-[13px] text-[var(--paper)] hover:border-[var(--ink-2)] hover:bg-[var(--ink-2)]",
        accent:
          "border-[var(--accent)] bg-[var(--accent)] text-[13px] text-[var(--paper)] hover:border-[var(--accent-ink)] hover:bg-[var(--accent-ink)]",
        ghost:
          "border-transparent bg-transparent px-2 py-1.5 text-[13px] text-[var(--ink-2)] hover:bg-[var(--paper-3)] hover:text-[var(--ink)]",
      },
      size: {
        default: "px-3.5 py-2",
        sm: "px-2.5 py-1.5 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type VisaButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof visaButtonVariants>

export function VisaButton({
  className,
  variant,
  size,
  type = "button",
  ...props
}: VisaButtonProps) {
  return (
    <button
      className={cn(visaButtonVariants({ variant, size }), className)}
      type={type}
      {...props}
    />
  )
}

export function VisaPanel({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--vd-radius-lg)] border border-[var(--rule)] bg-[var(--paper-2)] shadow-[var(--vd-shadow-sm)]",
        className
      )}
      {...props}
    />
  )
}

export function VisaPanelHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-[var(--rule)] px-4 py-3",
        className
      )}
      {...props}
    />
  )
}

export function VisaPanelTitle({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "text-xs font-medium tracking-[0.04em] text-[var(--ink-2)] uppercase",
        className
      )}
      {...props}
    />
  )
}

export function VisaPanelBody({
  className,
  tight = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { tight?: boolean }) {
  return <div className={cn(tight ? "p-0" : "p-4", className)} {...props} />
}

export const visaBadgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-[3px] px-[7px] py-[3px] [font-family:var(--font-mono)] text-[10px] font-medium tracking-[0.05em] uppercase before:h-[5px] before:w-[5px] before:rounded-full before:bg-current before:content-['']",
  {
    variants: {
      kind: {
        detected: "bg-[var(--info-soft)] text-[var(--info)]",
        ready: "bg-[var(--ok-soft)] text-[var(--ok)]",
        pending: "bg-[var(--warn-soft)] text-[var(--warn)]",
        skipped: "bg-[var(--muted-bg)] text-[var(--ink-3)]",
        sent: "bg-[var(--ok-soft)] text-[var(--ok)]",
        draft: "bg-[var(--info-soft)] text-[var(--info)]",
        active: "bg-[var(--accent-soft)] text-[var(--accent-ink)]",
        inactive: "bg-[var(--muted-bg)] text-[var(--ink-3)]",
      },
    },
  }
)

export type VisaBadgeKind = NonNullable<
  VariantProps<typeof visaBadgeVariants>["kind"]
>

export function VisaBadge({
  kind,
  className,
  children,
}: {
  kind: VisaBadgeKind
  className?: string
  children: ReactNode
}) {
  return (
    <span className={cn(visaBadgeVariants({ kind }), className)}>
      {children}
    </span>
  )
}

export function VisaNotice({
  className,
  kind = "default",
  icon,
  children,
}: {
  className?: string
  kind?: "default" | "warn"
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "mb-4 flex items-start gap-2.5 rounded-[var(--vd-radius)] border px-3.5 py-2.5 text-[13px]",
        kind === "warn"
          ? "border-[color-mix(in_oklab,var(--warn)_25%,transparent)] bg-[var(--warn-soft)] text-[oklch(40%_0.14_70)]"
          : "border-[color-mix(in_oklab,var(--accent)_25%,transparent)] bg-[var(--accent-soft)] text-[var(--accent-ink)]",
        className
      )}
    >
      {icon ? <div className="shrink-0 pt-0.5">{icon}</div> : null}
      <div>{children}</div>
    </div>
  )
}

export function VisaField({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1", className)} {...props} />
}

export function VisaFieldLabel({
  className,
  ...props
}: HTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "[font-family:var(--font-mono)] text-[10px] tracking-[0.08em] text-[var(--ink-3)] uppercase",
        className
      )}
      {...props}
    />
  )
}

const visaInputClassName =
  "w-full rounded-[var(--vd-radius)] border border-[var(--rule-2)] bg-[var(--paper)] px-3 py-2 [font-family:var(--font-ui)] text-sm text-[var(--ink)] outline-none transition-[border-color,box-shadow] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-soft)]"

export function VisaInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(visaInputClassName, className)} {...props} />
}

export function VisaTextarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(visaInputClassName, "min-h-16 resize-y", className)}
      {...props}
    />
  )
}

export const visaButtonRowVariants = cva("mt-5 flex items-center gap-2", {
  variants: {
    align: {
      default: "",
      between: "justify-between",
      right: "justify-end",
    },
  },
  defaultVariants: {
    align: "default",
  },
})

export function VisaButtonRow({
  className,
  align,
  ...props
}: HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof visaButtonRowVariants>) {
  return (
    <div
      className={cn(visaButtonRowVariants({ align }), className)}
      {...props}
    />
  )
}

export function VisaDivider({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("my-6 h-px bg-[var(--rule)]", className)} {...props} />
  )
}

export function VisaModalOverlay({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] overflow-y-auto bg-[color-mix(in_oklab,var(--paper)_70%,transparent)] px-6 py-10 backdrop-blur-[6px]",
        className
      )}
      {...props}
    />
  )
}

export function VisaModalCard({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mx-auto overflow-hidden rounded-[12px] border border-[var(--rule)] bg-[var(--paper-2)] shadow-[0_20px_60px_rgba(60,40,20,0.12)]",
        className
      )}
      {...props}
    />
  )
}

export function VisaModalHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 border-b border-[var(--rule)] px-6 py-5",
        className
      )}
      {...props}
    />
  )
}

export function VisaModalTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "m-0 [font-family:var(--font-display)] text-2xl font-medium tracking-[-0.01em] text-[var(--ink)]",
        className
      )}
      {...props}
    />
  )
}

export function VisaMutedText({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("text-[var(--ink-3)]", className)} {...props} />
}

export function VisaDimText({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("text-[var(--ink-4)]", className)} {...props} />
}

export function VisaAccentText({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("text-[oklch(80%_0.12_80)]", className)} {...props} />
  )
}

export function VisaMonoText({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("[font-family:var(--font-mono)] text-[11.5px]", className)}
      {...props}
    />
  )
}

export function VisaMonoFileText({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "[font-family:var(--font-mono)] text-[11.5px] text-[oklch(75%_0.1_230)]",
        className
      )}
      {...props}
    />
  )
}

export function VisaCluster({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  )
}

export function VisaFieldGrid({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}
      {...props}
    />
  )
}

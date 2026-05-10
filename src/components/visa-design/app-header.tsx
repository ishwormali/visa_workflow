import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AppHeaderProps = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
};

type AppHeaderSlotProps = {
  children: ReactNode;
  className?: string;
};

type AppHeaderTitleProps = {
  children: ReactNode;
  accent?: ReactNode;
  className?: string;
  accentClassName?: string;
};

type AppHeaderMetaProps = {
  label: ReactNode;
  value: ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
};

function AppHeaderRoot({ children, className, innerClassName }: AppHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-rule bg-[color-mix(in_oklab,var(--paper)_88%,transparent)] backdrop-blur-[10px] backdrop-saturate-150",
        className,
      )}
    >
      <div className={cn("mx-auto flex max-w-6xl items-center gap-4 px-6 py-3.5", innerClassName)}>
        {children}
      </div>
    </header>
  );
}

function AppHeaderBrand({ children, className }: AppHeaderSlotProps) {
  return <div className={cn("flex items-center gap-2.5", className)}>{children}</div>;
}

function AppHeaderLogo({ children, className }: AppHeaderSlotProps) {
  return (
    <div
      className={cn(
        "relative grid h-7 w-7 shrink-0 place-items-center rounded-lg border-[1.5px] border-ink bg-paper font-visa-display text-base font-medium tracking-[-0.02em] text-ink italic",
        className,
      )}
    >
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0.75 rounded-[6px] border border-dashed border-rule-2 opacity-50"
      />
    </div>
  );
}

function AppHeaderTitle({ children, accent, className, accentClassName }: AppHeaderTitleProps) {
  return (
    <div
      className={cn(
        "font-visa-display text-[18px] font-medium tracking-[-0.01em] text-ink",
        className,
      )}
    >
      {children}
      {accent ? (
        <em className={cn("font-normal text-ink-2 italic", accentClassName)}>{accent}</em>
      ) : null}
    </div>
  );
}

function AppHeaderTrailing({ children, className }: AppHeaderSlotProps) {
  return <div className={cn("ml-auto flex items-center gap-3", className)}>{children}</div>;
}

function AppHeaderMeta({
  label,
  value,
  className,
  labelClassName,
  valueClassName,
}: AppHeaderMetaProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 font-mono text-[11px] tracking-[0.02em] text-ink-3",
        className,
      )}
    >
      <span className={labelClassName}>{label}</span>
      <strong className={cn("font-medium text-ink", valueClassName)}>{value}</strong>
    </div>
  );
}

function AppHeaderActions({ children, className }: AppHeaderSlotProps) {
  return <div className={cn("flex items-center gap-1.5", className)}>{children}</div>;
}

export const AppHeader = Object.assign(AppHeaderRoot, {
  Brand: AppHeaderBrand,
  Logo: AppHeaderLogo,
  Title: AppHeaderTitle,
  Trailing: AppHeaderTrailing,
  Meta: AppHeaderMeta,
  Actions: AppHeaderActions,
});

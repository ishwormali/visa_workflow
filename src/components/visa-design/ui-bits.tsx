import { Fragment, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { VisaBadge, type VisaBadgeKind } from "./primitives";

export type BadgeKind = VisaBadgeKind;

export function Badge({ kind, children }: { kind: BadgeKind; children: ReactNode }) {
  return <VisaBadge kind={kind}>{children}</VisaBadge>;
}

export type LogMark = "ok" | "warn" | "err" | "api" | "·";
export type LogLine = { t: string; m: LogMark; text: ReactNode };

function parseLogEntry(entry: string): LogLine {
  const match = entry.match(/^(\S+)\s+(.*)$/);
  const time = match ? match[1] : "";
  const text = match ? match[2] : entry;
  const lower = text.toLowerCase();
  let mark: LogMark = "·";
  if (
    lower.startsWith("failed") ||
    lower.includes("failed:") ||
    lower.startsWith("error") ||
    lower.includes("error:")
  ) {
    mark = "err";
  } else if (lower.includes("not found") || lower.includes("missing") || lower.includes("warn")) {
    mark = "warn";
  } else if (
    lower.startsWith("authorizing") ||
    lower.startsWith("get ") ||
    lower.startsWith("post ") ||
    lower.startsWith("patch ") ||
    lower.startsWith("delete ") ||
    lower.includes("requesting") ||
    lower.includes("looking for") ||
    lower.includes("creating folder") ||
    lower.includes("downloading") ||
    lower.includes("sending payload") ||
    lower.includes("renaming folder") ||
    lower.includes("moving generated")
  ) {
    mark = "api";
  } else if (
    lower.startsWith("found") ||
    lower.startsWith("created") ||
    lower.startsWith("downloaded") ||
    lower.startsWith("detected") ||
    lower.startsWith("draft created") ||
    lower.startsWith("listed") ||
    lower.startsWith("session closed") ||
    lower.startsWith("read the") ||
    lower.startsWith("parsed") ||
    lower.startsWith("recorded") ||
    lower.startsWith("moved")
  ) {
    mark = "ok";
  }
  return { t: time, m: mark, text };
}

export function Console({
  title,
  lines,
  meta,
  emptyMessage,
}: {
  title?: string;
  lines: LogLine[] | string[];
  meta?: string;
  emptyMessage?: string;
}) {
  const normalized: LogLine[] =
    typeof lines[0] === "string" || lines.length === 0
      ? (lines as string[]).map(parseLogEntry)
      : (lines as LogLine[]);

  return (
    <div className="mt-4 overflow-hidden rounded-(--vd-radius-lg) border border-(--rule) bg-[oklch(20%_0.014_80)] text-[oklch(86%_0.012_80)]">
      <div className="flex items-center justify-between gap-3 border-b border-[oklch(28%_0.014_80)] bg-[oklch(18%_0.014_80)] px-3.5 py-2">
        <div className="flex items-center gap-2 text-[10px] tracking-widest text-[oklch(60%_0.012_80)] uppercase">
          <span className="h-1.75 w-1.75 rounded-full bg-(--ok) text-(--ok) shadow-[0_0_6px_currentColor]" />
          {title || "Live output"}
        </div>
        <div className="text-[10px] tracking-[0.04em] text-[oklch(55%_0.012_80)]">
          {meta || `${normalized.length} events`}
        </div>
      </div>
      <div className="max-h-70 overflow-y-auto px-3.5 py-3">
        {normalized.length === 0 && emptyMessage && (
          <div className="grid grid-cols-[60px_18px_1fr] gap-2 py-px">
            <span className="text-[oklch(48%_0.012_80)]"></span>
            <span className="text-[oklch(58%_0.012_80)]">·</span>
            <span className="text-[oklch(86%_0.012_80)]">
              <span className="text-[oklch(58%_0.012_80)]">{emptyMessage}</span>
            </span>
          </div>
        )}
        {normalized.map((l, i) => {
          const dataKind =
            l.m === "ok" || l.m === "warn" || l.m === "err" || l.m === "api" ? l.m : "";
          const glyph =
            l.m === "ok"
              ? "✓"
              : l.m === "warn"
                ? "!"
                : l.m === "err"
                  ? "✕"
                  : l.m === "api"
                    ? "→"
                    : "·";
          return (
            <div className="grid grid-cols-[60px_18px_1fr] gap-2 py-px" key={i}>
              <span className="text-[oklch(48%_0.012_80)]">{l.t}</span>
              <span
                className={cn(
                  "text-[oklch(58%_0.012_80)]",
                  dataKind === "ok" && "text-[oklch(70%_0.1_150)]",
                  dataKind === "warn" && "text-[oklch(75%_0.12_70)]",
                  dataKind === "err" && "text-[oklch(70%_0.14_30)]",
                  dataKind === "api" && "text-[oklch(70%_0.1_230)]",
                )}
              >
                {glyph}
              </span>
              <span className="text-[oklch(86%_0.012_80)]">{l.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type StepRailItem = { n: number; label: string };

export function StepRail({
  current,
  items,
  onNav,
}: {
  current: number;
  items: StepRailItem[];
  onNav?: (n: number) => void;
}) {
  return (
    <div className="mb-7 flex items-center gap-0 font-mono text-[10px] tracking-[0.08em] text-(--ink-3) uppercase">
      {items.map((s, i) => {
        const state = current === s.n ? "active" : current > s.n ? "done" : "idle";
        return (
          <Fragment key={s.n}>
            <button
              type="button"
              className={cn(
                "flex flex-1 items-center gap-2 text-left",
                onNav ? "cursor-pointer" : "cursor-default",
              )}
              disabled={!onNav}
              onClick={() => onNav?.(s.n)}
            >
              <div
                className={cn(
                  "grid h-5.5 w-5.5 shrink-0 place-items-center rounded-full border border-(--rule-2) bg-(--paper) text-[10px] text-(--ink-3) transition-colors",
                  state === "active" && "border-(--ink) bg-(--ink) text-(--paper)",
                  state === "done" && "border-(--accent) bg-(--accent) text-(--paper)",
                )}
              >
                <span>{state === "done" ? "✓" : s.n}</span>
              </div>
              <div
                className={cn("truncate whitespace-nowrap", state === "active" && "text-(--ink)")}
              >
                {s.label}
              </div>
            </button>
            {i < items.length - 1 && (
              <div
                className={cn(
                  "mx-1.5 h-px min-w-2 flex-1 bg-(--rule-2)",
                  current > s.n && "bg-(--accent)",
                )}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

export function StepHead({
  eyebrow,
  title,
  desc,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  desc?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <div className="mb-2 font-mono text-[10px] tracking-[0.12em] text-(--ink-3) uppercase">
          {eyebrow}
        </div>
      )}
      <h1 className="m-0 font-visa-display text-[32px] leading-[1.15] font-medium tracking-[-0.02em] text-(--ink) [&_em]:text-(--accent-ink) [&_em]:italic">
        {title}
      </h1>
      {desc && <p className="mt-2 max-w-[56ch] text-sm text-(--ink-2)">{desc}</p>}
      {children}
    </div>
  );
}

export type DocCategory = "upload" | "gdoc" | "gdoc_photos";

export function DocCategoryLabel({ cat }: { cat: DocCategory | string }) {
  const m: Record<string, string> = {
    upload: "Upload",
    gdoc: "Generated doc",
    gdoc_photos: "Generated doc · photos",
  };
  return <>{m[cat] || cat}</>;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDate(iso?: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "—";
  return `${d}-${MONTHS[parseInt(m, 10) - 1]}-${y}`;
}

export function formatRange(from?: string, to?: string) {
  if (!from || !to) return "—";
  return `${formatDate(from)} → ${formatDate(to)}`;
}

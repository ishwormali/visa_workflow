import { Fragment, type ReactNode } from "react"

export type BadgeKind =
  | "detected"
  | "ready"
  | "pending"
  | "skipped"
  | "sent"
  | "draft"
  | "active"
  | "inactive"

export function Badge({
  kind,
  children,
}: {
  kind: BadgeKind
  children: ReactNode
}) {
  return (
    <span className="badge" data-kind={kind}>
      {children}
    </span>
  )
}

export type LogMark = "ok" | "warn" | "err" | "api" | "·"
export type LogLine = { t: string; m: LogMark; text: ReactNode }

function parseLogEntry(entry: string): LogLine {
  const match = entry.match(/^(\S+)\s+(.*)$/)
  const time = match ? match[1] : ""
  const text = match ? match[2] : entry
  const lower = text.toLowerCase()
  let mark: LogMark = "·"
  if (
    lower.startsWith("failed") ||
    lower.includes("failed:") ||
    lower.startsWith("error") ||
    lower.includes("error:")
  ) {
    mark = "err"
  } else if (
    lower.includes("not found") ||
    lower.includes("missing") ||
    lower.includes("warn")
  ) {
    mark = "warn"
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
    mark = "api"
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
    mark = "ok"
  }
  return { t: time, m: mark, text }
}

export function Console({
  title,
  lines,
  meta,
  emptyMessage,
}: {
  title?: string
  lines: LogLine[] | string[]
  meta?: string
  emptyMessage?: string
}) {
  const normalized: LogLine[] =
    typeof lines[0] === "string" || lines.length === 0
      ? (lines as string[]).map(parseLogEntry)
      : (lines as LogLine[])

  return (
    <div className="console">
      <div className="console-head">
        <div className="console-title">{title || "Live output"}</div>
        <div className="console-meta">{meta || `${normalized.length} events`}</div>
      </div>
      <div className="console-body">
        {normalized.length === 0 && emptyMessage && (
          <div className="console-line">
            <span className="console-time"></span>
            <span className="console-mark">·</span>
            <span className="console-text">
              <span className="dim">{emptyMessage}</span>
            </span>
          </div>
        )}
        {normalized.map((l, i) => {
          const dataKind =
            l.m === "ok" || l.m === "warn" || l.m === "err" || l.m === "api"
              ? l.m
              : ""
          const glyph =
            l.m === "ok"
              ? "✓"
              : l.m === "warn"
                ? "!"
                : l.m === "err"
                  ? "✕"
                  : l.m === "api"
                    ? "→"
                    : "·"
          return (
            <div className="console-line" key={i}>
              <span className="console-time">{l.t}</span>
              <span className="console-mark" data-kind={dataKind}>
                {glyph}
              </span>
              <span className="console-text">{l.text}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export type StepRailItem = { n: number; label: string }

export function StepRail({
  current,
  items,
  onNav,
}: {
  current: number
  items: StepRailItem[]
  onNav?: (n: number) => void
}) {
  return (
    <div className="step-rail">
      {items.map((s, i) => {
        const state = current === s.n ? "active" : current > s.n ? "done" : "idle"
        return (
          <Fragment key={s.n}>
            <div
              className="step-rail-item"
              data-state={state}
              onClick={() => onNav?.(s.n)}
            >
              <div className="step-rail-num">
                <span>{s.n}</span>
              </div>
              <div className="step-rail-label">{s.label}</div>
            </div>
            {i < items.length - 1 && <div className="step-rail-tick"></div>}
          </Fragment>
        )
      })}
    </div>
  )
}

export function StepHead({
  eyebrow,
  title,
  desc,
  children,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  desc?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="step-head">
      {eyebrow && <div className="step-eyebrow">{eyebrow}</div>}
      <h1 className="step-title">{title}</h1>
      {desc && <p className="step-desc">{desc}</p>}
      {children}
    </div>
  )
}

export type DocCategory = "upload" | "gdoc" | "gdoc_photos"

export function DocCategoryLabel({ cat }: { cat: DocCategory | string }) {
  const m: Record<string, string> = {
    upload: "Upload",
    gdoc: "Generated doc",
    gdoc_photos: "Generated doc · photos",
  }
  return <>{m[cat] || cat}</>
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

export function formatDate(iso?: string) {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-")
  if (!y || !m || !d) return "—"
  return `${d}-${MONTHS[parseInt(m, 10) - 1]}-${y}`
}

export function formatRange(from?: string, to?: string) {
  if (!from || !to) return "—"
  return `${formatDate(from)} → ${formatDate(to)}`
}

import {
  ACTIVE_DOCS,
  MOCK_DOC_TYPES,
  PAST_SESSIONS,
  type DocDates,
  type EmailConfig,
} from "./data"
import { Badge, DocCategoryLabel, StepHead } from "./ui-bits"

type Props = {
  docDates: DocDates
  setDocDates: React.Dispatch<React.SetStateAction<DocDates>>
  emailConfig: EmailConfig
  onNext: () => void
  onEditEmail: () => void
}

export function Step0Setup({
  docDates,
  setDocDates,
  emailConfig,
  onNext,
  onEditEmail,
}: Props) {
  const lastSession = PAST_SESSIONS[0]

  const updateDate = (id: string, key: "from" | "to" | "single", val: string) => {
    setDocDates((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: val },
    }))
  }

  const allValid = ACTIVE_DOCS.every((d) => {
    const v = docDates[d.id] || {}
    if (d.category === "gdoc_photos") return true
    if (d.dateFormat === "range") return v.from && v.to
    return v.single
  })

  return (
    <>
      <StepHead
        eyebrow="Step 0 · Monthly setup"
        title={
          <>
            This month's <em>submission</em>
          </>
        }
        desc="Confirm the date ranges for each document. Defaults are pulled from your last submission."
      />

      <div className="notice">
        <div className="notice-icon">↩</div>
        <div>
          Last submitted on <strong>{lastSession.submittedAtPretty}</strong> with{" "}
          <strong>{lastSession.docs.length} documents</strong>. That's{" "}
          <strong>9 days ago</strong>.
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div className="panel-head-title">Email config</div>
          <button className="btn btn-ghost btn-sm" onClick={onEditEmail}>
            Edit ↗
          </button>
        </div>
        <div className="panel-body">
          <div className="cluster" style={{ rowGap: 6 }}>
            <span className="muted mono">to:</span>
            <span>{emailConfig.to}</span>
            <span className="dim">·</span>
            <span className="muted mono">cc:</span>
            <span>{emailConfig.cc}</span>
            <span className="dim">·</span>
            <span className="muted mono">sign-off:</span>
            <span>{emailConfig.signoff}</span>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div className="panel-head-title">Active doc types · {ACTIVE_DOCS.length}</div>
          <span className="muted mono">edit dates inline</span>
        </div>
        <div className="panel-body tight">
          <div className="doc-list">
            {ACTIVE_DOCS.map((d) => {
              const v = docDates[d.id] || {}
              return (
                <div className="doc-row" key={d.id}>
                  <div className="doc-num">#{d.number}</div>
                  <div className="doc-main">
                    <div className="doc-label">{d.label}</div>
                    <div className="doc-meta">
                      <span className="doc-meta-tag">
                        <DocCategoryLabel cat={d.category} />
                      </span>
                      <span className="doc-meta-tag">
                        {d.dateFormat === "range" ? "date range" : "single date"}
                      </span>
                      {d.category === "gdoc_photos" && (
                        <span className="doc-meta-tag">dates per-photo</span>
                      )}
                    </div>
                    {d.category !== "gdoc_photos" && (
                      <div className="date-controls">
                        {d.dateFormat === "range" ? (
                          <div className="date-row">
                            <label>FROM</label>
                            <input
                              className="date-input"
                              type="date"
                              value={v.from || ""}
                              onChange={(e) => updateDate(d.id, "from", e.target.value)}
                            />
                            <label style={{ width: "auto", marginLeft: 8 }}>TO</label>
                            <input
                              className="date-input"
                              type="date"
                              value={v.to || ""}
                              onChange={(e) => updateDate(d.id, "to", e.target.value)}
                            />
                          </div>
                        ) : (
                          <div className="date-row">
                            <label>DATE</label>
                            <input
                              className="date-input"
                              type="date"
                              value={v.single || ""}
                              onChange={(e) => updateDate(d.id, "single", e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <Badge kind="active">active</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <details style={{ marginTop: 12 }}>
        <summary
          style={{
            cursor: "pointer",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--ink-3)",
            padding: "8px 0",
          }}
        >
          Show {MOCK_DOC_TYPES.length - ACTIVE_DOCS.length} inactive (one-off / static) doc types
        </summary>
        <div className="panel" style={{ marginTop: 8 }}>
          <div className="panel-body tight">
            <div className="doc-list">
              {MOCK_DOC_TYPES.filter((d) => !d.active).map((d) => (
                <div className="doc-row" key={d.id} data-inactive="true">
                  <div className="doc-num">#{d.number}</div>
                  <div className="doc-main">
                    <div className="doc-label">{d.label}</div>
                    <div className="doc-meta">
                      <span className="doc-meta-tag">{d.note}</span>
                    </div>
                  </div>
                  <div>
                    <Badge kind="inactive">inactive</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </details>

      <div className="btn-row between">
        <button className="btn btn-ghost btn-sm">
          ⟳ Re-seed from{" "}
          <span className="mono" style={{ marginLeft: 4 }}>
            Document list
          </span>
        </button>
        <button className="btn btn-primary" disabled={!allValid} onClick={onNext}>
          Begin scan →
        </button>
      </div>
    </>
  )
}

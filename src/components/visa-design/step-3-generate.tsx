import { ACTIVE_DOCS, GENERATE_LOG, type DocDates } from "./data"
import {
  Badge,
  Console,
  DocCategoryLabel,
  StepHead,
  formatDate,
  formatRange,
} from "./ui-bits"

type Props = {
  docDates: DocDates
  onBack: () => void
  onNext: () => void
}

const GENERATED = [
  { id: "doc_4_upload_savers", file: "4 - savers - Apr 2026.pdf" },
  { id: "doc_4_upload_smart", file: "4 - smart account - Apr 2026.pdf" },
  { id: "doc_7_gdoc", file: "7-whatsapp-history.gdoc" },
  { id: "doc_8_gdoc_photos", file: "8-photographs.gdoc" },
]

export function Step3Generate({ docDates, onBack, onNext }: Props) {
  const today = "2026-05-05"

  return (
    <>
      <StepHead
        eyebrow="Step 3 · Generate"
        title={
          <>
            Building <em>Visa-May-2026</em>
          </>
        }
        desc={
          <>
            Created session subfolder. Generating gdocs, renaming uploads, appending to the{" "}
            <span className="mono">Document list</span>.
          </>
        }
      />

      <div className="panel">
        <div className="panel-head">
          <div className="panel-head-title">Session folder</div>
          <span className="mono muted">draft date: {formatDate(today)}</span>
        </div>
        <div className="panel-body">
          <div className="cluster">
            <span className="dim">📁</span>
            <span className="mono">Documents requested / Visa-May-2026 /</span>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div className="panel-head-title">Generated · {GENERATED.length}</div>
        </div>
        <div className="panel-body tight">
          <div className="doc-list">
            {GENERATED.map((g) => {
              const d = ACTIVE_DOCS.find((x) => x.id === g.id)
              if (!d) return null
              const v = docDates[g.id] || {}
              return (
                <div className="doc-row" key={g.id}>
                  <div className="doc-num">#{d.number}</div>
                  <div className="doc-main">
                    <div className="doc-label">{d.label}</div>
                    <div className="doc-meta">
                      <span className="doc-meta-tag">
                        <DocCategoryLabel cat={d.category} />
                      </span>
                      {d.dateFormat === "range" && v.from && (
                        <span className="doc-meta-tag">{formatRange(v.from, v.to)}</span>
                      )}
                      {d.category === "gdoc_photos" && (
                        <span className="doc-meta-tag">4 photos · per-photo dates</span>
                      )}
                    </div>
                    <div className="doc-files">
                      <div className="doc-file">
                        <span className="doc-file-icon">▤</span>
                        <span>{g.file}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Badge kind="ready">ready</Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <Console title="drive.generate" lines={GENERATE_LOG} meta="completed in 10.2s" />

      <div className="btn-row between">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          ← Back
        </button>
        <button className="btn btn-primary" onClick={onNext}>
          Build email draft →
        </button>
      </div>
    </>
  )
}

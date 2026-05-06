import {
  ACTIVE_DOCS,
  SCANNED_FILES,
  SCAN_LOG,
  type DocDates,
  type ScannedFile,
} from "./data"
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

export function Step1Scan({ docDates, onBack, onNext }: Props) {
  const detectedByDoc: Record<string, ScannedFile[]> = {}
  SCANNED_FILES.forEach((f) => {
    detectedByDoc[f.matchedTo] = detectedByDoc[f.matchedTo] || []
    detectedByDoc[f.matchedTo].push(f)
  })

  return (
    <>
      <StepHead
        eyebrow="Step 1 · Scan"
        title={
          <>
            Reading <em>Drive</em>
          </>
        }
        desc={
          <>
            Searching <span className="mono">Documents requested</span> recursively and
            matching files to active doc types via regex.
          </>
        }
      />

      <div className="panel">
        <div className="panel-head">
          <div className="panel-head-title">Detected — {SCANNED_FILES.length} files</div>
          <span className="muted mono">4/4 doc types matched</span>
        </div>
        <div className="panel-body tight">
          <div className="doc-list">
            {ACTIVE_DOCS.map((d) => {
              const files = detectedByDoc[d.id] || []
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
                      {d.dateFormat === "range" && v.from && (
                        <span className="doc-meta-tag">{formatRange(v.from, v.to)}</span>
                      )}
                      {d.dateFormat === "single" && v.single && (
                        <span className="doc-meta-tag">{formatDate(v.single)}</span>
                      )}
                      {d.category === "gdoc_photos" && (
                        <span className="doc-meta-tag">dates per-photo</span>
                      )}
                    </div>
                    {files.length > 0 && (
                      <div className="doc-files">
                        {files.map((f) => (
                          <div className="doc-file" key={f.name}>
                            <span className="doc-file-icon">▤</span>
                            <span>{f.name}</span>
                            <span className="dim" style={{ marginLeft: "auto" }}>
                              {f.size}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <Badge kind={files.length ? "detected" : "pending"}>
                      {files.length
                        ? `${files.length} ${files.length === 1 ? "file" : "files"}`
                        : "pending"}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <Console title="drive.scan" lines={SCAN_LOG} meta="completed in 2.4s" />

      <div className="btn-row between">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          ← Back
        </button>
        <button className="btn btn-primary" onClick={onNext}>
          4 photos detected → Caption them
        </button>
      </div>
    </>
  )
}

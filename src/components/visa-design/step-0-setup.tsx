import {
  ACTIVE_DOCS,
  MOCK_DOC_TYPES,
  PAST_SESSIONS,
  type DocDates,
  type EmailConfig,
} from "./data"
import {
  DocumentList,
  DocumentMeta,
  DocumentMetaTag,
  DocumentRow,
} from "./document-list"
import {
  VisaButton,
  VisaButtonRow,
  VisaCluster,
  VisaDimText,
  VisaMonoText,
  VisaNotice,
  VisaPanel,
  VisaPanelBody,
  VisaPanelHeader,
  VisaPanelTitle,
  VisaMutedText,
} from "./primitives"
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

  const updateDate = (
    id: string,
    key: "from" | "to" | "single",
    val: string
  ) => {
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

      <VisaNotice icon="↩">
        <div>
          Last submitted on <strong>{lastSession.submittedAtPretty}</strong>{" "}
          with <strong>{lastSession.docs.length} documents</strong>. That's{" "}
          <strong>9 days ago</strong>.
        </div>
      </VisaNotice>

      <div className="space-y-3">
        <VisaPanel>
          <VisaPanelHeader>
            <VisaPanelTitle>Email config</VisaPanelTitle>
            <VisaButton onClick={onEditEmail} size="sm" variant="ghost">
              Edit ↗
            </VisaButton>
          </VisaPanelHeader>
          <VisaPanelBody>
            <VisaCluster className="gap-y-1.5">
              <VisaMutedText>
                <VisaMonoText>to:</VisaMonoText>
              </VisaMutedText>
              <span>{emailConfig.to}</span>
              <VisaDimText>·</VisaDimText>
              <VisaMutedText>
                <VisaMonoText>cc:</VisaMonoText>
              </VisaMutedText>
              <span>{emailConfig.cc}</span>
              <VisaDimText>·</VisaDimText>
              <VisaMutedText>
                <VisaMonoText>sign-off:</VisaMonoText>
              </VisaMutedText>
              <span>{emailConfig.signoff}</span>
            </VisaCluster>
          </VisaPanelBody>
        </VisaPanel>

        <VisaPanel>
          <VisaPanelHeader>
            <VisaPanelTitle>
              Active doc types · {ACTIVE_DOCS.length}
            </VisaPanelTitle>
            <VisaMonoText className="text-[var(--ink-3)]">
              edit dates inline
            </VisaMonoText>
          </VisaPanelHeader>
          <VisaPanelBody tight>
            <DocumentList>
              {ACTIVE_DOCS.map((d) => {
                const v = docDates[d.id] || {}
                return (
                  <DocumentRow
                    badge={<Badge kind="active">active</Badge>}
                    key={d.id}
                    label={d.label}
                    meta={
                      <DocumentMeta>
                        <DocumentMetaTag>
                          <DocCategoryLabel cat={d.category} />
                        </DocumentMetaTag>
                        <DocumentMetaTag>
                          {d.dateFormat === "range"
                            ? "date range"
                            : "single date"}
                        </DocumentMetaTag>
                        {d.category === "gdoc_photos" && (
                          <DocumentMetaTag>dates per-photo</DocumentMetaTag>
                        )}
                      </DocumentMeta>
                    }
                    number={d.number}
                  >
                    {d.category !== "gdoc_photos" && (
                      <div className="mt-2 flex flex-col gap-2">
                        {d.dateFormat === "range" ? (
                          <div className="flex flex-wrap items-center gap-2 [font-family:var(--font-mono)] text-[11px]">
                            <label className="w-9 shrink-0 tracking-[0.05em] text-[var(--ink-3)] uppercase">
                              FROM
                            </label>
                            <input
                              className="rounded-[4px] border border-[var(--rule-2)] bg-[var(--paper)] px-2 py-1 text-xs text-[var(--ink)] transition-[border-color,box-shadow] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_2px_var(--accent-soft)]"
                              onChange={(e) =>
                                updateDate(d.id, "from", e.target.value)
                              }
                              type="date"
                              value={v.from || ""}
                            />
                            <label className="ml-2 tracking-[0.05em] text-[var(--ink-3)] uppercase">
                              TO
                            </label>
                            <input
                              className="rounded-[4px] border border-[var(--rule-2)] bg-[var(--paper)] px-2 py-1 text-xs text-[var(--ink)] transition-[border-color,box-shadow] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_2px_var(--accent-soft)]"
                              onChange={(e) =>
                                updateDate(d.id, "to", e.target.value)
                              }
                              type="date"
                              value={v.to || ""}
                            />
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2 [font-family:var(--font-mono)] text-[11px]">
                            <label className="w-9 shrink-0 tracking-[0.05em] text-[var(--ink-3)] uppercase">
                              DATE
                            </label>
                            <input
                              className="rounded-[4px] border border-[var(--rule-2)] bg-[var(--paper)] px-2 py-1 text-xs text-[var(--ink)] transition-[border-color,box-shadow] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_2px_var(--accent-soft)]"
                              onChange={(e) =>
                                updateDate(d.id, "single", e.target.value)
                              }
                              type="date"
                              value={v.single || ""}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </DocumentRow>
                )
              })}
            </DocumentList>
          </VisaPanelBody>
        </VisaPanel>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer py-2 [font-family:var(--font-mono)] text-[11px] text-[var(--ink-3)]">
          Show {MOCK_DOC_TYPES.length - ACTIVE_DOCS.length} inactive (one-off /
          static) doc types
        </summary>
        <VisaPanel className="mt-2">
          <VisaPanelBody tight>
            <DocumentList>
              {MOCK_DOC_TYPES.filter((d) => !d.active).map((d) => (
                <DocumentRow
                  badge={<Badge kind="inactive">inactive</Badge>}
                  inactive
                  key={d.id}
                  label={d.label}
                  meta={
                    <DocumentMeta>
                      <DocumentMetaTag>{d.note}</DocumentMetaTag>
                    </DocumentMeta>
                  }
                  number={d.number}
                />
              ))}
            </DocumentList>
          </VisaPanelBody>
        </VisaPanel>
      </details>

      <VisaButtonRow align="between">
        <VisaButton size="sm" variant="ghost">
          ⟳ Re-seed from{" "}
          <VisaMonoText className="ml-1">Document list</VisaMonoText>
        </VisaButton>
        <VisaButton disabled={!allValid} onClick={onNext} variant="primary">
          Begin scan →
        </VisaButton>
      </VisaButtonRow>
    </>
  )
}

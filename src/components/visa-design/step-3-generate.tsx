import { ACTIVE_DOCS, GENERATE_LOG, type DocDates } from "./data"
import {
  DocumentFile,
  DocumentFiles,
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
  VisaPanel,
  VisaPanelBody,
  VisaPanelHeader,
  VisaPanelTitle,
} from "./primitives"
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
            Created session subfolder. Generating gdocs, renaming uploads,
            appending to the <VisaMonoText>Document list</VisaMonoText>.
          </>
        }
      />

      <div className="space-y-3">
        <VisaPanel>
          <VisaPanelHeader>
            <VisaPanelTitle>Session folder</VisaPanelTitle>
            <VisaMonoText className="text-[var(--ink-3)]">
              draft date: {formatDate(today)}
            </VisaMonoText>
          </VisaPanelHeader>
          <VisaPanelBody>
            <VisaCluster>
              <VisaDimText>📁</VisaDimText>
              <VisaMonoText>Documents requested / Visa-May-2026 /</VisaMonoText>
            </VisaCluster>
          </VisaPanelBody>
        </VisaPanel>

        <VisaPanel>
          <VisaPanelHeader>
            <VisaPanelTitle>Generated · {GENERATED.length}</VisaPanelTitle>
          </VisaPanelHeader>
          <VisaPanelBody tight>
            <DocumentList>
              {GENERATED.map((g) => {
                const d = ACTIVE_DOCS.find((x) => x.id === g.id)
                if (!d) return null
                const v = docDates[g.id] || {}
                return (
                  <DocumentRow
                    badge={<Badge kind="ready">ready</Badge>}
                    key={g.id}
                    label={d.label}
                    meta={
                      <DocumentMeta>
                        <DocumentMetaTag>
                          <DocCategoryLabel cat={d.category} />
                        </DocumentMetaTag>
                        {d.dateFormat === "range" && v.from && (
                          <DocumentMetaTag>
                            {formatRange(v.from, v.to)}
                          </DocumentMetaTag>
                        )}
                        {d.category === "gdoc_photos" && (
                          <DocumentMetaTag>
                            4 photos · per-photo dates
                          </DocumentMetaTag>
                        )}
                      </DocumentMeta>
                    }
                    number={d.number}
                    files={
                      <DocumentFiles>
                        <DocumentFile>{g.file}</DocumentFile>
                      </DocumentFiles>
                    }
                  />
                )
              })}
            </DocumentList>
          </VisaPanelBody>
        </VisaPanel>
      </div>

      <Console
        title="drive.generate"
        lines={GENERATE_LOG}
        meta="completed in 10.2s"
      />

      <VisaButtonRow align="between">
        <VisaButton onClick={onBack} size="sm" variant="ghost">
          ← Back
        </VisaButton>
        <VisaButton onClick={onNext} variant="primary">
          Build email draft →
        </VisaButton>
      </VisaButtonRow>
    </>
  )
}

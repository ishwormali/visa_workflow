import { ACTIVE_DOCS, EMAIL_LOG, type DocDates, type EmailConfig } from "./data"
import { VisaButton, VisaButtonRow } from "./primitives"
import { Console, StepHead, formatDate, formatRange } from "./ui-bits"

type Props = {
  docDates: DocDates
  emailConfig: EmailConfig
  onBack: () => void
  onNext: () => void
}

const ITEMS = [
  {
    id: "doc_4_upload_savers",
    file: "4 - savers - Apr 2026.pdf",
    size: "184 KB",
  },
  {
    id: "doc_4_upload_smart",
    file: "4 - smart account - Apr 2026.pdf",
    size: "212 KB",
  },
  { id: "doc_7_gdoc", file: "7-whatsapp-history.gdoc", size: "96 KB" },
  { id: "doc_8_gdoc_photos", file: "8-photographs.gdoc", size: "10.4 MB" },
]

export function Step4Email({ docDates, emailConfig, onBack, onNext }: Props) {
  const today = "2026-05-05"
  const subject = `Visa Application Documents - ${formatDate(today).replace(/Apr/, "April").replace(/May/, "May")}`

  const dateLabel = (id: string) => {
    const d = ACTIVE_DOCS.find((x) => x.id === id)
    if (!d) return ""
    const v = docDates[id] || {}
    if (d.category === "gdoc_photos") return "(4 photos)"
    if (d.dateFormat === "range") return `(${formatRange(v.from, v.to)})`
    return v.single ? `(${formatDate(v.single)})` : ""
  }

  return (
    <>
      <StepHead
        eyebrow="Step 4 · Draft"
        title={
          <>
            Gmail <em>draft</em> ready
          </>
        }
        desc="Created in your Drafts folder. Review before sending — the prototype won't send for you."
      />

      <div className="overflow-hidden rounded-[var(--vd-radius-lg)] border border-[var(--rule)] bg-[var(--paper)] text-[13.5px] leading-[1.55]">
        <dl className="m-0 grid grid-cols-[60px_1fr] gap-x-3 gap-y-1 border-b border-[var(--rule)] px-[18px] py-[14px] text-xs">
          <dt className="pt-[3px] [font-family:var(--font-mono)] text-[10px] tracking-[0.06em] text-[var(--ink-3)] uppercase">
            To
          </dt>
          <dd className="m-0 text-[var(--ink)]">{emailConfig.to}</dd>
          <dt className="pt-[3px] [font-family:var(--font-mono)] text-[10px] tracking-[0.06em] text-[var(--ink-3)] uppercase">
            Cc
          </dt>
          <dd className="m-0 text-[var(--ink)]">{emailConfig.cc}</dd>
          <dt className="pt-[3px] [font-family:var(--font-mono)] text-[10px] tracking-[0.06em] text-[var(--ink-3)] uppercase">
            Subject
          </dt>
          <dd className="m-0 text-sm font-medium text-[var(--ink)]">
            {subject}
          </dd>
        </dl>
        <div className="px-[18px] py-[18px] whitespace-pre-wrap text-[var(--ink)]">
          {`Hi ${emailConfig.greeting},

Hope you guys are doing well.
Please find the attachments below:

`}
          {ITEMS.map((it) => {
            const d = ACTIVE_DOCS.find((x) => x.id === it.id)
            if (!d) return null
            return (
              <div
                className="[font-family:var(--font-mono)] text-xs text-[var(--ink-2)]"
                key={it.id}
              >
                <span className="font-medium text-[var(--accent-ink)]">
                  * {d.number} -{" "}
                </span>
                <span>{d.label} </span>
                <span className="text-[var(--ink-3)]">{dateLabel(it.id)}</span>
              </div>
            )
          })}
          {`
--
Best Regards,
${emailConfig.signoff}`}
        </div>
        <div className="flex flex-col gap-1 border-t border-[var(--rule)] bg-[var(--paper-2)] px-[18px] py-3">
          <div className="mb-1 [font-family:var(--font-mono)] text-[10px] tracking-[0.08em] text-[var(--ink-3)] uppercase">
            Attachments · {ITEMS.length}
          </div>
          {ITEMS.map((it) => (
            <div
              className="flex items-center gap-2 [font-family:var(--font-mono)] text-[11.5px] text-[var(--ink-2)]"
              key={it.file}
            >
              <span className="relative h-[18px] w-4 shrink-0 rounded-[2px] border border-[var(--rule-2)] bg-[var(--paper-3)] after:absolute after:top-0 after:right-0 after:h-[5px] after:w-[5px] after:border-b after:border-l after:border-[var(--rule-2)] after:bg-[var(--paper)] after:content-['']" />
              <span>{it.file}</span>
              <span className="ml-auto text-[var(--ink-4)]">{it.size}</span>
            </div>
          ))}
        </div>
      </div>

      <Console title="gmail.draft" lines={EMAIL_LOG} meta="completed in 6.8s" />

      <VisaButtonRow align="between">
        <VisaButton onClick={onBack} size="sm" variant="ghost">
          ← Back
        </VisaButton>
        <VisaButton onClick={onNext} variant="primary">
          I'll review in Gmail →
        </VisaButton>
      </VisaButtonRow>
    </>
  )
}

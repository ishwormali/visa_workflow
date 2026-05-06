import {
  ACTIVE_DOCS,
  EMAIL_LOG,
  type DocDates,
  type EmailConfig,
} from "./data"
import { Console, StepHead, formatDate, formatRange } from "./ui-bits"

type Props = {
  docDates: DocDates
  emailConfig: EmailConfig
  onBack: () => void
  onNext: () => void
}

const ITEMS = [
  { id: "doc_4_upload_savers", file: "4 - savers - Apr 2026.pdf", size: "184 KB" },
  { id: "doc_4_upload_smart", file: "4 - smart account - Apr 2026.pdf", size: "212 KB" },
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

      <div className="email-paper">
        <dl className="email-headers">
          <dt>To</dt>
          <dd>{emailConfig.to}</dd>
          <dt>Cc</dt>
          <dd>{emailConfig.cc}</dd>
          <dt>Subject</dt>
          <dd className="subject">{subject}</dd>
        </dl>
        <div className="email-body">
          {`Hi ${emailConfig.greeting},

Hope you guys are doing well.
Please find the attachments below:

`}
          {ITEMS.map((it) => {
            const d = ACTIVE_DOCS.find((x) => x.id === it.id)
            if (!d) return null
            return (
              <div className="attach-line" key={it.id}>
                <span className="num">* {d.number} - </span>
                <span>{d.label} </span>
                <span className="date">{dateLabel(it.id)}</span>
              </div>
            )
          })}
          {`
--
Best Regards,
${emailConfig.signoff}`}
        </div>
        <div className="email-attachments">
          <div className="email-attachments-label">Attachments · {ITEMS.length}</div>
          {ITEMS.map((it) => (
            <div className="email-attachment" key={it.file}>
              <span className="email-attachment-icon"></span>
              <span>{it.file}</span>
              <span className="email-attachment-size">{it.size}</span>
            </div>
          ))}
        </div>
      </div>

      <Console title="gmail.draft" lines={EMAIL_LOG} meta="completed in 6.8s" />

      <div className="btn-row between">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          ← Back
        </button>
        <button className="btn btn-primary" onClick={onNext}>
          I'll review in Gmail →
        </button>
      </div>
    </>
  )
}

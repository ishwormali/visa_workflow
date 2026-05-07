import { ACTIVE_DOCS, EMAIL_LOG, type DocDates, type EmailConfig } from "./data";
import { VisaButton, VisaButtonRow } from "./primitives";
import { Console, StepHead, formatDate, formatRange } from "./ui-bits";

type Props = {
  docDates: DocDates;
  emailConfig: EmailConfig;
  onBack: () => void;
  onNext: () => void;
};

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
];

export function Step4Email({ docDates, emailConfig, onBack, onNext }: Props) {
  const today = "2026-05-05";
  const subject = `Visa Application Documents - ${formatDate(today).replace(/Apr/, "April").replace(/May/, "May")}`;

  const dateLabel = (id: string) => {
    const d = ACTIVE_DOCS.find((x) => x.id === id);
    if (!d) return "";
    const v = docDates[id] || {};
    if (d.category === "gdoc_photos") return "(4 photos)";
    if (d.dateFormat === "range") return `(${formatRange(v.from, v.to)})`;
    return v.single ? `(${formatDate(v.single)})` : "";
  };

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

      <div className="overflow-hidden rounded-(--vd-radius-lg) border border-(--rule) bg-(--paper) text-[13.5px] leading-[1.55]">
        <dl className="m-0 grid grid-cols-[60px_1fr] gap-x-3 gap-y-1 border-b border-(--rule) px-4.5 py-3.5 text-xs">
          <dt className="pt-0.75 font-mono text-[10px] tracking-[0.06em] text-(--ink-3) uppercase">
            To
          </dt>
          <dd className="m-0 text-(--ink)">{emailConfig.to}</dd>
          <dt className="pt-0.75 font-mono text-[10px] tracking-[0.06em] text-(--ink-3) uppercase">
            Cc
          </dt>
          <dd className="m-0 text-(--ink)">{emailConfig.cc}</dd>
          <dt className="pt-0.75 font-mono text-[10px] tracking-[0.06em] text-(--ink-3) uppercase">
            Subject
          </dt>
          <dd className="m-0 text-sm font-medium text-(--ink)">{subject}</dd>
        </dl>
        <div className="px-4.5 py-4.5 whitespace-pre-wrap text-(--ink)">
          {`Hi ${emailConfig.greeting},

Hope you guys are doing well.
Please find the attachments below:

`}
          {ITEMS.map((it) => {
            const d = ACTIVE_DOCS.find((x) => x.id === it.id);
            if (!d) return null;
            return (
              <div className="font-mono text-xs text-(--ink-2)" key={it.id}>
                <span className="font-medium text-(--accent-ink)">* {d.number} - </span>
                <span>{d.label} </span>
                <span className="text-(--ink-3)">{dateLabel(it.id)}</span>
              </div>
            );
          })}
          {`
--
Best Regards,
${emailConfig.signoff}`}
        </div>
        <div className="flex flex-col gap-1 border-t border-(--rule) bg-(--paper-2) px-4.5 py-3">
          <div className="mb-1 font-mono text-[10px] tracking-[0.08em] text-(--ink-3) uppercase">
            Attachments · {ITEMS.length}
          </div>
          {ITEMS.map((it) => (
            <div
              className="flex items-center gap-2 font-mono text-[11.5px] text-(--ink-2)"
              key={it.file}
            >
              <span className="relative h-4.5 w-4 shrink-0 rounded-xs border border-(--rule-2) bg-(--paper-3) after:absolute after:top-0 after:right-0 after:h-1.25 after:w-1.25 after:border-b after:border-l after:border-(--rule-2) after:bg-(--paper) after:content-['']" />
              <span>{it.file}</span>
              <span className="ml-auto text-(--ink-4)">{it.size}</span>
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
  );
}

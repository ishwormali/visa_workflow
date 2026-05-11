import { formatGreetingBlock, formatSignOffBlock } from "@/lib/visa-workflow";

import { VisaButton, VisaButtonRow } from "../../visa-design/primitives";
import { Console, StepHead, formatDate, formatRange } from "../../visa-design/ui-bits";
import { useVisaWorkflow } from "../provider";

type Props = {
  onBack: () => void;
};

export function EmailStep({ onBack }: Props) {
  const { activeDocTypes, config, createDraft, documents, draftDate, getMatchedFileDisplayName, logs } =
    useVisaWorkflow();
  const subject = `Visa Application Documents - ${formatDate(draftDate).replace(/-/g, "-")}`;
  const attachmentItems = activeDocTypes.flatMap((docType) => {
    const document = documents.find((item) => item.docTypeId === docType.id);

    if (!document) {
      return [];
    }

    const filenames = document.generatedFiles.length
      ? document.generatedFiles
      : document.matchedFiles;

    return filenames.map((fileName) => ({
      id: `${docType.id}:${fileName}`,
      docType,
      fileName,
      document,
    }));
  });

  return (
    <>
      <StepHead
        eyebrow="Step 4 · Draft"
        title={
          <>
            Review the <em>email draft</em>
          </>
        }
        desc="Preview the message, then create a Gmail draft. The last step records when you sent it and closes the session."
      />

      <div className="overflow-hidden rounded-(--vd-radius-lg) border border-rule bg-paper text-[13.5px] leading-[1.55]">
        <dl className="m-0 grid grid-cols-[60px_1fr] gap-x-3 gap-y-1 border-b border-rule px-4.5 py-3.5 text-xs">
          <dt className="pt-0.75 font-mono text-[10px] tracking-[0.06em] text-ink-3 uppercase">
            To
          </dt>
          <dd className="m-0 text-ink">{config.email.toEmail || "Not set"}</dd>
          <dt className="pt-0.75 font-mono text-[10px] tracking-[0.06em] text-ink-3 uppercase">
            Cc
          </dt>
          <dd className="m-0 text-ink">{config.email.ccEmail || "Not set"}</dd>
          <dt className="pt-0.75 font-mono text-[10px] tracking-[0.06em] text-ink-3 uppercase">
            Subject
          </dt>
          <dd className="m-0 text-sm font-medium text-ink">{subject}</dd>
        </dl>
        <div className="px-4.5 py-4.5 whitespace-pre-wrap text-ink">
          {`${formatGreetingBlock(config.email.greeting)}

Hope you guys are doing well.
Please find the attachments below:

`}
          {activeDocTypes.map((docType) => {
            const document = documents.find((item) => item.docTypeId === docType.id);
            if (!document) return null;
            return (
              <div className="font-mono text-xs text-ink-2" key={docType.id}>
                <span className="font-medium text-accent-ink">* {docType.number} - </span>
                <span>{docType.label} </span>
                <span className="text-ink-3">
                  {document.dates.mode === "range"
                    ? `(${formatRange(document.dates.from, document.dates.to)})`
                    : `(${formatDate(document.dates.date)})`}
                </span>
              </div>
            );
          })}
          {`\n--\n${formatSignOffBlock(config.email.signOff)}`}
        </div>
        <div className="flex flex-col gap-1 border-t border-rule bg-paper-2 px-4.5 py-3">
          <div className="mb-1 font-mono text-[10px] tracking-[0.08em] text-ink-3 uppercase">
            Attachments · {attachmentItems.length}
          </div>
          {attachmentItems.map((item) => (
            <div
              className="flex items-center gap-2 font-mono text-[11.5px] text-ink-2"
              key={item.id}
            >
              <span className="relative h-4.5 w-4 shrink-0 rounded-xs border border-rule-2 bg-paper-3 after:absolute after:top-0 after:right-0 after:h-1.25 after:w-1.25 after:border-b after:border-l after:border-rule-2 after:bg-paper after:content-['']" />
              <span>{item.document.generatedFiles.length ? item.fileName : getMatchedFileDisplayName(item.fileName)}</span>
              <span className="ml-auto text-ink-3">{item.docType.category}</span>
            </div>
          ))}
        </div>
      </div>

      <Console
        title="gmail.draft"
        lines={logs[4]}
        meta={`${logs[4].length} events`}
        emptyMessage="No draft events yet."
      />

      <VisaButtonRow align="between">
        <VisaButton onClick={onBack} size="sm" variant="ghost">
          ← Back
        </VisaButton>
        <VisaButton onClick={() => void createDraft()} variant="primary">
          Create Gmail draft →
        </VisaButton>
      </VisaButtonRow>
    </>
  );
}

import { cn } from "@/lib/utils";
import { createEmailSubject, createSessionFolderName } from "@/lib/visa-workflow";

import {
  VisaButton,
  VisaButtonRow,
  VisaNotice,
  visaButtonVariants,
} from "../../visa-design/primitives";
import { Console, StepHead } from "../../visa-design/ui-bits";
import { useVisaWorkflow } from "../provider";

export function DoneStep() {
  const { draftDate, draftSession, logs, markEmailSent, photoFiles, startNextSession, documents } =
    useVisaWorkflow();
  const sent = draftSession?.status === "sent";
  const folderName = draftSession?.folderName ?? createSessionFolderName(draftDate);
  const subject = draftSession?.emailSubject ?? createEmailSubject(draftDate);

  return (
    <>
      <StepHead
        eyebrow="Step 5 · Final"
        title={
          sent ? (
            <>
              Session <em>closed</em>
            </>
          ) : (
            <>
              Awaiting <em>your send</em>
            </>
          )
        }
        desc={
          sent
            ? "Files were recorded against the workflow history and the session is now closed."
            : "Open Gmail, hit Send, then come back and confirm here."
        }
      />

      <CompletionSummary
        documentCount={documents.length}
        folderName={folderName}
        photoCount={photoFiles.length}
        sent={sent}
        subject={subject}
      />

      {!sent ? (
        <>
          <VisaNotice icon="✦">
            <div>
              Sending the draft is a one-click manual step in Gmail. Once you've sent it, click
              below to record the submission, move files into the root folder, and start fresh.
            </div>
          </VisaNotice>

          <VisaButtonRow align="between">
            <button type="button" className={cn(visaButtonVariants({ size: "sm" }))}>
              ↗ Open Gmail Drafts
            </button>
            <VisaButton onClick={() => void markEmailSent()} variant="accent">
              Email sent — close session
            </VisaButton>
          </VisaButtonRow>
        </>
      ) : (
        <>
          <Console
            title="session.close"
            lines={logs[5]}
            meta={`${logs[5].length} events`}
            emptyMessage="No close-session events yet."
          />
          <VisaButtonRow align="right">
            <VisaButton onClick={startNextSession} variant="primary">
              Start next session →
            </VisaButton>
          </VisaButtonRow>
        </>
      )}
    </>
  );
}

function CompletionSummary({
  documentCount,
  folderName,
  photoCount,
  sent,
  subject,
}: {
  documentCount: number;
  folderName: string;
  photoCount: number;
  sent: boolean;
  subject: string;
}) {
  return (
    <div className="relative mb-4 overflow-hidden rounded-[12px] border border-[color-mix(in_oklab,var(--accent)_25%,transparent)] bg-[linear-gradient(180deg,var(--accent-soft),var(--paper-2))] p-7 text-center">
      {sent && (
        <span className="absolute top-4 right-4 transform-[rotate(-6deg)] rounded-lg border-2 border-accent-ink px-2.5 py-1 font-visa-display text-sm font-medium tracking-wider text-accent-ink italic opacity-75">
          SENT
        </span>
      )}
      <h2 className="m-0 font-visa-display text-[28px] font-medium tracking-[-0.02em] text-ink [&_em]:text-accent-ink [&_em]:italic">
        {sent ? (
          <>
            <em>{folderName}</em> wrapped
          </>
        ) : (
          <>
            Almost <em>there</em>
          </>
        )}
      </h2>
      <p className="mt-1 text-sm text-ink-2">
        {sent ? `Submission recorded for ${folderName}` : `Subject: ${subject}`}
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <SummaryStat label="documents" value={String(documentCount)} />
        <SummaryStat label="photos" value={String(photoCount)} />
        <SummaryStat label="status" value={sent ? "sent" : "draft"} />
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-(--vd-radius) border border-rule bg-paper p-2.5">
      <div className="font-visa-display text-[22px] font-medium text-ink">{value}</div>
      <div className="font-mono text-[10px] tracking-[0.08em] text-ink-3 uppercase">{label}</div>
    </div>
  );
}

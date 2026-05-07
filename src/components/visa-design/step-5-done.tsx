import { cn } from "@/lib/utils";

import { DONE_LOG } from "./data";
import { VisaButton, VisaButtonRow, VisaNotice, visaButtonVariants } from "./primitives";
import { Console, StepHead } from "./ui-bits";

type Props = {
  sent: boolean;
  onSent: () => void;
  onReset: () => void;
};

export function Step5Done({ sent, onSent, onReset }: Props) {
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
            ? "Files moved to the root folder, session saved to history. Nicely done."
            : "Open Gmail, hit Send, then come back and confirm here."
        }
      />

      <CompletionSummary sent={sent} />

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
            <VisaButton onClick={onSent} variant="accent">
              Email sent — close session
            </VisaButton>
          </VisaButtonRow>
        </>
      ) : (
        <>
          <Console title="session.close" lines={DONE_LOG} meta="completed in 2.1s" />
          <VisaButtonRow align="right">
            <VisaButton onClick={onReset} variant="primary">
              Start next session →
            </VisaButton>
          </VisaButtonRow>
        </>
      )}
    </>
  );
}

function CompletionSummary({ sent }: { sent: boolean }) {
  return (
    <div className="relative mb-4 overflow-hidden rounded-[12px] border border-[color-mix(in_oklab,var(--accent)_25%,transparent)] bg-[linear-gradient(180deg,var(--accent-soft),var(--paper-2))] p-7 text-center">
      {sent && (
        <span className="absolute top-4 right-4 [transform:rotate(-6deg)] rounded-[4px] border-2 border-(--accent-ink) px-2.5 py-1 [font-family:var(--font-display)] text-sm font-medium tracking-[0.05em] text-(--accent-ink) italic opacity-75">
          SENT
        </span>
      )}
      <h2 className="m-0 [font-family:var(--font-display)] text-[28px] font-medium tracking-[-0.02em] text-(--ink) [&_em]:text-(--accent-ink) [&_em]:italic">
        {sent ? (
          <>
            <em>Visa-May-2026</em> wrapped
          </>
        ) : (
          <>
            Almost <em>there</em>
          </>
        )}
      </h2>
      <p className="mt-1 text-sm text-(--ink-2)">
        {sent
          ? "Submitted on 05-May-2026 at 14:22"
          : "Subject: Visa Application Documents - 05-May-2026"}
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <SummaryStat label="documents" value="4" />
        <SummaryStat label="photos" value="4" />
        <SummaryStat label="attached" value="12.9 MB" />
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-(--vd-radius) border border-(--rule) bg-(--paper) p-2.5">
      <div className="[font-family:var(--font-display)] text-[22px] font-medium text-(--ink)">
        {value}
      </div>
      <div className="font-mono text-[10px] tracking-[0.08em] text-(--ink-3) uppercase">
        {label}
      </div>
    </div>
  );
}

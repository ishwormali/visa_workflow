import { useState } from "react";

import { cn } from "@/lib/utils";

import { EMAIL_CONFIG, LAST_DATES, PAST_SESSIONS, type DocDates, type EmailConfig } from "./data";
import { ConfigSeed, HistoryPanel, SettingsPanel } from "./history-and-settings";
import { Step0Setup } from "./step-0-setup";
import { Step1Scan } from "./step-1-scan";
import { Step2Photos } from "./step-2-photos";
import { Step3Generate } from "./step-3-generate";
import { Step4Email } from "./step-4-email";
import { Step5Done } from "./step-5-done";
import { StepRail } from "./ui-bits";

const DEMO_NAV_LABELS = ["Setup", "Scan", "Photos", "Gen", "Email", "Done"];
const STEP_RAIL_ITEMS = DEMO_NAV_LABELS.map((label, index) => ({
  n: index,
  label,
}));

export function VisaDesignApp() {
  const [step, setStep] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSeed, setShowSeed] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(EMAIL_CONFIG);
  const [docDates, setDocDates] = useState<DocDates>(LAST_DATES);

  const goto = (n: number) => {
    if (n !== 5) setSent(false);
    setStep(n);
  };

  const reset = () => {
    setSent(false);
    setStep(0);
  };

  let body: React.ReactNode = null;
  if (showSeed) {
    body = <ConfigSeed onComplete={() => setShowSeed(false)} />;
  } else if (step === 0) {
    body = (
      <Step0Setup
        docDates={docDates}
        setDocDates={setDocDates}
        emailConfig={emailConfig}
        onNext={() => goto(1)}
        onEditEmail={() => setShowSettings(true)}
      />
    );
  } else if (step === 1) {
    body = <Step1Scan docDates={docDates} onBack={() => goto(0)} onNext={() => goto(2)} />;
  } else if (step === 2) {
    body = <Step2Photos onBack={() => goto(1)} onNext={() => goto(3)} />;
  } else if (step === 3) {
    body = <Step3Generate docDates={docDates} onBack={() => goto(2)} onNext={() => goto(4)} />;
  } else if (step === 4) {
    body = (
      <Step4Email
        docDates={docDates}
        emailConfig={emailConfig}
        onBack={() => goto(3)}
        onNext={() => goto(5)}
      />
    );
  } else if (step === 5) {
    body = <Step5Done sent={sent} onSent={() => setSent(true)} onReset={reset} />;
  }

  return (
    <div
      className="visa-design-app relative min-h-screen bg-(--paper) [font-family:var(--font-ui)] text-[15px] leading-[1.5] text-(--ink) antialiased"
      data-theme="warm"
      data-density="spacious"
    >
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 10%, rgba(140, 90, 40, 0.025), transparent 50%), radial-gradient(circle at 80% 90%, rgba(40, 60, 120, 0.020), transparent 50%)",
        }}
      />

      <AppHeader
        showHistory={showHistory}
        onShowHistory={() => setShowHistory(true)}
        onShowSettings={() => setShowSettings(true)}
      />

      <main
        className="relative z-10 mx-auto max-w-[680px] px-6 pt-9 pb-[100px]"
        data-screen-label={`step-${step}`}
      >
        {!showSeed && step > 0 && <StepRail current={step} items={STEP_RAIL_ITEMS} onNav={goto} />}
        {body}
      </main>

      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
      {showSettings && (
        <SettingsPanel
          emailConfig={emailConfig}
          setEmailConfig={setEmailConfig}
          onClose={() => setShowSettings(false)}
        />
      )}

      <DemoNav
        currentStep={step}
        showSeed={showSeed}
        onStepSelect={(selectedStep) => {
          setShowSeed(false);
          goto(selectedStep);
        }}
        onSeedSelect={() => setShowSeed(true)}
      />
    </div>
  );
}

function AppHeader({
  showHistory,
  onShowHistory,
  onShowSettings,
}: {
  showHistory: boolean;
  onShowHistory: () => void;
  onShowSettings: () => void;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-(--rule) bg-[color-mix(in_oklab,var(--paper)_88%,transparent)] backdrop-blur-[10px] backdrop-saturate-150">
      <div className="mx-auto flex max-w-[680px] items-center gap-4 px-6 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="relative grid h-7 w-7 place-items-center rounded-[4px] border-[1.5px] border-(--ink) bg-(--paper) [font-family:var(--font-display)] text-base font-medium tracking-[-0.02em] text-(--ink) italic">
            V
            <div className="pointer-events-none absolute inset-[-3px] rounded-[6px] border border-dashed border-(--rule-2) opacity-50" />
          </div>
          <div className="[font-family:var(--font-display)] text-[18px] font-medium tracking-[-0.01em] text-(--ink) [&_em]:font-normal [&_em]:text-(--ink-2) [&_em]:italic">
            visa <em>workflow</em>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-[0.02em] text-(--ink-3)">
          <span>SUBMISSIONS</span>
          <strong className="font-medium text-(--ink)">{PAST_SESSIONS.length}</strong>
        </div>

        <HeaderButton active={showHistory} onClick={onShowHistory}>
          ⏱ History
        </HeaderButton>
        <HeaderButton onClick={onShowSettings}>⚙ Settings</HeaderButton>
      </div>
    </header>
  );
}

function HeaderButton({
  active = false,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-1.5 rounded-(--vd-radius) border border-transparent px-2.5 py-1.5 text-[13px] text-(--ink-2) transition-colors hover:bg-(--paper-3) hover:text-(--ink)",
        active && "bg-(--ink) text-(--paper) hover:bg-(--ink) hover:text-(--paper)",
        className,
      )}
      type="button"
      {...props}
    />
  );
}

function DemoNav({
  currentStep,
  showSeed,
  onStepSelect,
  onSeedSelect,
}: {
  currentStep: number;
  showSeed: boolean;
  onStepSelect: (step: number) => void;
  onSeedSelect: () => void;
}) {
  return (
    <div className="fixed bottom-4 left-1/2 z-[60] flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-full border border-(--rule) bg-(--paper-2) px-2 py-1.5 font-mono text-[10px] tracking-[0.06em] uppercase shadow-[0_8px_24px_rgba(60,40,20,0.10)]">
      <span className="px-2.5 text-(--ink-3)">demo</span>
      {DEMO_NAV_LABELS.map((label, index) => (
        <button
          className={cn(
            "rounded-full px-2.5 py-1.5 text-(--ink-2) transition-colors hover:bg-(--paper-3) hover:text-(--ink)",
            !showSeed &&
              currentStep === index &&
              "bg-(--ink) text-(--paper) hover:bg-(--ink) hover:text-(--paper)",
          )}
          key={label}
          onClick={() => onStepSelect(index)}
          type="button"
        >
          {index}·{label}
        </button>
      ))}
      <button
        className={cn(
          "rounded-full px-2.5 py-1.5 text-(--ink-2) transition-colors hover:bg-(--paper-3) hover:text-(--ink)",
          showSeed && "bg-(--ink) text-(--paper) hover:bg-(--ink) hover:text-(--paper)",
        )}
        onClick={onSeedSelect}
        type="button"
      >
        seed
      </button>
    </div>
  );
}

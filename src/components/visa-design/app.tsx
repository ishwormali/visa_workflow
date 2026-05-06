import { useState } from "react"

import "@/visa-design.css"

import {
  EMAIL_CONFIG,
  LAST_DATES,
  PAST_SESSIONS,
  type DocDates,
  type EmailConfig,
} from "./data"
import {
  ConfigSeed,
  HistoryPanel,
  SettingsPanel,
} from "./history-and-settings"
import { Step0Setup } from "./step-0-setup"
import { Step1Scan } from "./step-1-scan"
import { Step2Photos } from "./step-2-photos"
import { Step3Generate } from "./step-3-generate"
import { Step4Email } from "./step-4-email"
import { Step5Done } from "./step-5-done"
import { StepRail } from "./ui-bits"

const DEMO_NAV_LABELS = ["Setup", "Scan", "Photos", "Gen", "Email", "Done"]

export function VisaDesignApp() {
  const [step, setStep] = useState(0)
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showSeed, setShowSeed] = useState(false)
  const [sent, setSent] = useState(false)
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(EMAIL_CONFIG)
  const [docDates, setDocDates] = useState<DocDates>(LAST_DATES)

  const goto = (n: number) => {
    if (n !== 5) setSent(false)
    setStep(n)
  }

  const reset = () => {
    setSent(false)
    setStep(0)
  }

  let body: React.ReactNode = null
  if (showSeed) {
    body = <ConfigSeed onComplete={() => setShowSeed(false)} />
  } else if (step === 0) {
    body = (
      <Step0Setup
        docDates={docDates}
        setDocDates={setDocDates}
        emailConfig={emailConfig}
        onNext={() => goto(1)}
        onEditEmail={() => setShowSettings(true)}
      />
    )
  } else if (step === 1) {
    body = (
      <Step1Scan
        docDates={docDates}
        onBack={() => goto(0)}
        onNext={() => goto(2)}
      />
    )
  } else if (step === 2) {
    body = <Step2Photos onBack={() => goto(1)} onNext={() => goto(3)} />
  } else if (step === 3) {
    body = (
      <Step3Generate
        docDates={docDates}
        onBack={() => goto(2)}
        onNext={() => goto(4)}
      />
    )
  } else if (step === 4) {
    body = (
      <Step4Email
        docDates={docDates}
        emailConfig={emailConfig}
        onBack={() => goto(3)}
        onNext={() => goto(5)}
      />
    )
  } else if (step === 5) {
    body = (
      <Step5Done
        sent={sent}
        onSent={() => setSent(true)}
        onReset={reset}
      />
    )
  }

  return (
    <div className="visa-design-app" data-theme="warm" data-density="spacious">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-mark">
            <div className="app-mark-glyph">V</div>
            <div className="app-mark-name">
              visa <em>workflow</em>
            </div>
          </div>
          <div className="app-header-spacer"></div>
          <div className="submission-count">
            <span>SUBMISSIONS</span>
            <strong>{PAST_SESSIONS.length}</strong>
          </div>
          <button
            className="header-btn"
            data-active={showHistory}
            onClick={() => setShowHistory(true)}
          >
            ⏱ History
          </button>
          <button className="header-btn" onClick={() => setShowSettings(true)}>
            ⚙ Settings
          </button>
        </div>
      </header>

      <main className="app-main" data-screen-label={`step-${step}`}>
        {!showSeed && step > 0 && <StepRail current={step} onNav={goto} />}
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

      <div className="demo-nav">
        <span className="demo-nav-label">demo</span>
        {DEMO_NAV_LABELS.map((label, i) => (
          <button
            key={i}
            className="demo-nav-btn"
            data-active={!showSeed && step === i}
            onClick={() => {
              setShowSeed(false)
              goto(i)
            }}
          >
            {i}·{label}
          </button>
        ))}
        <button
          className="demo-nav-btn"
          data-active={showSeed}
          onClick={() => setShowSeed(true)}
        >
          seed
        </button>
      </div>
    </div>
  )
}

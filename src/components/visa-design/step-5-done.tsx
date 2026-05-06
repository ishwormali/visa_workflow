import { DONE_LOG } from "./data"
import { Console, StepHead } from "./ui-bits"

type Props = {
  sent: boolean
  onSent: () => void
  onReset: () => void
}

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

      <div className="summary-card">
        {sent && <span className="summary-stamp">SENT</span>}
        <h2 className="summary-big">
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
        <p className="summary-sub">
          {sent
            ? "Submitted on 05-May-2026 at 14:22"
            : "Subject: Visa Application Documents - 05-May-2026"}
        </p>
        <div className="summary-stats">
          <div className="summary-stat">
            <div className="summary-stat-num">4</div>
            <div className="summary-stat-label">documents</div>
          </div>
          <div className="summary-stat">
            <div className="summary-stat-num">4</div>
            <div className="summary-stat-label">photos</div>
          </div>
          <div className="summary-stat">
            <div className="summary-stat-num">12.9 MB</div>
            <div className="summary-stat-label">attached</div>
          </div>
        </div>
      </div>

      {!sent ? (
        <>
          <div className="notice">
            <div className="notice-icon">✦</div>
            <div>
              Sending the draft is a one-click manual step in Gmail. Once you've sent it,
              click below to record the submission, move files into the root folder, and
              start fresh.
            </div>
          </div>

          <div className="btn-row between">
            <a
              className="btn btn-sm"
              href="#"
              onClick={(e) => e.preventDefault()}
            >
              ↗ Open Gmail Drafts
            </a>
            <button className="btn btn-accent" onClick={onSent}>
              Email sent — close session
            </button>
          </div>
        </>
      ) : (
        <>
          <Console title="session.close" lines={DONE_LOG} meta="completed in 2.1s" />
          <div className="btn-row right">
            <button className="btn btn-primary" onClick={onReset}>
              Start next session →
            </button>
          </div>
        </>
      )}
    </>
  )
}

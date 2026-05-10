// History panel + Settings + Config seed

const HistoryPanel = ({ onClose }) => {
  const [open, setOpen] = React.useState(PAST_SESSIONS[0].id);
  return (
    <div className="history-overlay" onClick={onClose}>
      <div className="history-card" onClick={e => e.stopPropagation()}>
        <div className="history-card-head">
          <div>
            <h2 className="history-title">Past submissions</h2>
            <div className="muted mono" style={{fontSize: 11, marginTop: 2}}>
              {PAST_SESSIONS.length} sessions · all sent · all moved
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close ✕</button>
        </div>
        <div className="history-list">
          {PAST_SESSIONS.map(s => (
            <div key={s.id}>
              <div className="history-session" onClick={() => setOpen(open === s.id ? null : s.id)}>
                <div className="history-session-head">
                  <div className="history-date">
                    {s.submittedAtPretty}
                    <small>submitted</small>
                  </div>
                  <div className="history-subject">
                    <span className="dim">re:</span> {s.subject}
                  </div>
                  <Badge kind={s.status}>{s.status}</Badge>
                  <span className="mono dim" style={{fontSize: 11}}>
                    {s.filesMoved ? '✓ moved' : '✕ not moved'} · {open === s.id ? '▾' : '▸'}
                  </span>
                </div>
              </div>
              {open === s.id && (
                <div className="history-detail">
                  <div className="muted mono" style={{fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase'}}>
                    📁 {s.folderName} · {s.docs.length} documents
                  </div>
                  {s.docs.map((d, i) => (
                    <div className="history-doc-row" key={i}>
                      <div className="doc-num">#{d.number}</div>
                      <div>
                        <div>{d.label}</div>
                        <div className="muted mono" style={{fontSize: 11}}>{d.range}</div>
                        <div className="history-doc-files">
                          {d.files.map(f => <div key={f}>▤ {f}</div>)}
                        </div>
                      </div>
                      <Badge kind="ready">ok</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SettingsPanel = ({ emailConfig, setEmailConfig, onClose }) => {
  const [draft, setDraft] = React.useState(emailConfig);
  return (
    <div className="history-overlay" onClick={onClose}>
      <div className="history-card" style={{maxWidth: 520}} onClick={e => e.stopPropagation()}>
        <div className="history-card-head">
          <h2 className="history-title">Settings</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close ✕</button>
        </div>
        <div style={{padding: '16px 24px'}}>
          <div className="field" style={{marginBottom: 12}}>
            <label className="field-label">To</label>
            <input className="input" value={draft.to} onChange={e => setDraft({...draft, to: e.target.value})} />
          </div>
          <div className="field" style={{marginBottom: 12}}>
            <label className="field-label">CC</label>
            <input className="input" value={draft.cc} onChange={e => setDraft({...draft, cc: e.target.value})} />
          </div>
          <div className="field-grid" style={{marginBottom: 12}}>
            <div className="field">
              <label className="field-label">Greeting</label>
              <input className="input" value={draft.greeting} onChange={e => setDraft({...draft, greeting: e.target.value})} />
            </div>
            <div className="field">
              <label className="field-label">Sign-off</label>
              <input className="input" value={draft.signoff} onChange={e => setDraft({...draft, signoff: e.target.value})} />
            </div>
          </div>
          <div className="divider"></div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Re-seed doc types</div>
              <div className="settings-row-help">Re-reads the Document list Google Doc</div>
            </div>
            <button className="btn btn-sm">⟳ Re-seed</button>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Clear all sessions</div>
              <div className="settings-row-help">{PAST_SESSIONS.length} sessions stored locally</div>
            </div>
            <button className="btn btn-sm">Clear…</button>
          </div>
          <div className="btn-row right">
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={() => { setEmailConfig(draft); onClose(); }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConfigSeed = ({ onComplete }) => {
  return (
    <>
      <StepHead
        eyebrow="First run · Seed"
        title={<>Seed from <em>Document list</em></>}
        desc={<>We read the table from your <span className="mono">Document list</span> Google Doc. Mark recurring vs. one-off below.</>}
      />

      <div className="notice">
        <div className="notice-icon">✦</div>
        <div>Parsed <strong>9 rows</strong> · 4 are recurring (monthly) · 5 look like one-offs.</div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div className="panel-head-title">Detected doc types</div>
          <span className="muted mono">toggle to set active</span>
        </div>
        <div className="panel-body tight">
          <div className="doc-list">
            {MOCK_DOC_TYPES.map(d => (
              <div className="doc-row" key={d.id} data-inactive={!d.active}>
                <div className="doc-num">#{d.number}</div>
                <div className="doc-main">
                  <div className="doc-label">{d.label}</div>
                  <div className="doc-meta">
                    <span className="doc-meta-tag"><DocCategoryLabel cat={d.category} /></span>
                    <span className="doc-meta-tag">{d.dateFormat}</span>
                    {d.matchPattern && <span className="doc-meta-tag mono">{d.matchPattern}</span>}
                  </div>
                </div>
                <div><Badge kind={d.active ? 'active' : 'inactive'}>{d.active ? 'active' : 'inactive'}</Badge></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="btn-row right">
        <button className="btn btn-primary" onClick={onComplete}>Save · 4 active types</button>
      </div>
    </>
  );
};

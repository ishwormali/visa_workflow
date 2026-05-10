// Step 2 — Photo captions

const Step2Photos = ({ onNext, onBack }) => {
  const [idx, setIdx] = React.useState(0);
  const [drafts, setDrafts] = React.useState(() =>
    PHOTOS.map(p => ({ date: p.date, people: p.people, description: p.description, formatted: p.formatted, formatting: false }))
  );

  const photo = PHOTOS[idx];
  const draft = drafts[idx];
  const update = (k, v) => setDrafts(arr => arr.map((d,i) => i===idx ? {...d, [k]: v} : d));

  const formatAI = () => {
    update('formatting', true);
    setTimeout(() => {
      update('formatting', false);
      update('formatted', photo.formatted);
    }, 700);
  };

  const next = () => {
    if (idx < PHOTOS.length - 1) setIdx(idx + 1);
    else onNext();
  };

  return (
    <>
      <StepHead
        eyebrow={`Step 2 · Photo ${idx + 1} of ${PHOTOS.length}`}
        title={<>Caption the <em>relationship photos</em></>}
        desc="One at a time. AI Format turns your inputs into the visa-officer's expected format."
      />

      <div className="photo-progress-meta">
        <span>{idx + 1} / {PHOTOS.length}</span>
        <span>{Math.round(((idx + 1) / PHOTOS.length) * 100)}%</span>
      </div>
      <div className="photo-progress-bar">
        <div className="photo-progress-fill" style={{ width: `${((idx + 1) / PHOTOS.length) * 100}%` }}></div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div className="panel-head-title">{photo.label}</div>
          <span className="mono muted">{photo.file}</span>
        </div>
        <div className="panel-body">
          <div className="photo-stage">
            <div className="photo-frame" style={{ background: photo.bg }}>
              <span className="photo-placeholder-label">[ photo · {photo.file} ]</span>
            </div>
            <div className="field">
              <label className="field-label">Date taken</label>
              <input className="input" type="date" value={draft.date} onChange={e => update('date', e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">People in photo</label>
              <input className="input" value={draft.people} onChange={e => update('people', e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">Description / occasion</label>
              <textarea className="textarea" value={draft.description} onChange={e => update('description', e.target.value)} />
            </div>

            <div className="cluster">
              <button className="btn btn-accent btn-sm" onClick={formatAI} disabled={draft.formatting}>
                {draft.formatting ? '· · · formatting' : '✦ AI Format'}
              </button>
              <span className="muted mono">claude-sonnet-4 · ~280 tokens</span>
            </div>

            {draft.formatted && !draft.formatting && (
              <div className="caption-preview">"{draft.formatted}"</div>
            )}
          </div>
        </div>
      </div>

      <div className="btn-row between">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Back</button>
        <div className="cluster">
          <button className="btn btn-sm" onClick={next}>Skip this photo</button>
          <button className="btn btn-primary" onClick={next}>
            {idx < PHOTOS.length - 1 ? 'Save & next →' : 'Save & continue →'}
          </button>
        </div>
      </div>
    </>
  );
};

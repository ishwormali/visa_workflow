// Shared small UI components

const Badge = ({ kind, children }) => (
  <span className="badge" data-kind={kind}>{children}</span>
);

const Console = ({ title, lines, meta }) => (
  <div className="console">
    <div className="console-head">
      <div className="console-title">{title || 'Live output'}</div>
      <div className="console-meta">{meta || `${lines.length} events`}</div>
    </div>
    <div className="console-body">
      {lines.map((l, i) => (
        <div className="console-line" key={i}>
          <span className="console-time">{l.t}</span>
          <span className="console-mark" data-kind={
            l.m === 'ok' ? 'ok' : l.m === 'warn' ? 'warn' : l.m === 'err' ? 'err' : l.m === 'api' ? 'api' : ''
          }>{
            l.m === 'ok' ? '✓' :
            l.m === 'warn' ? '!' :
            l.m === 'err' ? '✕' :
            l.m === 'api' ? '→' : '·'
          }</span>
          <span className="console-text">{l.text}</span>
        </div>
      ))}
    </div>
  </div>
);

const StepRail = ({ current, onNav }) => {
  const steps = [
    { n: 0, label: 'Setup' },
    { n: 1, label: 'Scan Drive' },
    { n: 2, label: 'Photos' },
    { n: 3, label: 'Generate' },
    { n: 4, label: 'Email' },
    { n: 5, label: 'Done' },
  ];
  return (
    <div className="step-rail">
      {steps.map((s, i) => {
        const state = current === s.n ? 'active' : current > s.n ? 'done' : 'idle';
        return (
          <React.Fragment key={s.n}>
            <div
              className="step-rail-item"
              data-state={state}
              onClick={() => onNav && onNav(s.n)}
            >
              <div className="step-rail-num"><span>{s.n}</span></div>
              <div className="step-rail-label">{s.label}</div>
            </div>
            {i < steps.length - 1 && <div className="step-rail-tick"></div>}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const StepHead = ({ eyebrow, title, desc, children }) => (
  <div className="step-head">
    {eyebrow && <div className="step-eyebrow">{eyebrow}</div>}
    <h1 className="step-title" dangerouslySetInnerHTML={typeof title === 'string' ? { __html: title } : undefined}>
      {typeof title !== 'string' ? title : null}
    </h1>
    {desc && <p className="step-desc">{desc}</p>}
    {children}
  </div>
);

const DocCategoryLabel = ({ cat }) => {
  const m = {
    upload: 'Upload',
    gdoc: 'Generated doc',
    gdoc_photos: 'Generated doc · photos',
  };
  return <>{m[cat] || cat}</>;
};

const formatDate = (iso) => {
  if (!iso) return '—';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [y, m, d] = iso.split('-');
  return `${d}-${months[parseInt(m,10)-1]}-${y}`;
};

const formatRange = (from, to) => {
  if (!from || !to) return '—';
  return `${formatDate(from)} → ${formatDate(to)}`;
};

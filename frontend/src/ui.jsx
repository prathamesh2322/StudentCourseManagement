export const DEPTS = ['CSE', 'AIML', 'ECE', 'EEE', 'MECH', 'CIVIL'];

export const Stat = ({ icon, label, value, tone = 'teal' }) => (
  <div className={'stat ' + tone}>
    <div className="ico">{icon}</div>
    <div><div className="val">{value}</div><div className="lbl">{label}</div></div>
  </div>
);

export const Card = ({ title, children, className = '' }) => (
  <section className={'card ' + className}>{title && <h3>{title}</h3>}{children}</section>
);

export function Bars({ data, color }) {
  if (!data || data.length === 0) return <p className="muted">No data yet.</p>;
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="bars">
      {data.map((d) => (
        <div className="bar-row" key={d.label}>
          <span className="bl">{d.label}</span>
          <div className="track"><div className="fill" style={{ width: (d.total ? d.value / d.total : d.value / max) * 100 + '%', background: color }} /></div>
          <span className="bv">{d.value}{d.total ? ` / ${d.total}` : ''}</span>
        </div>
      ))}
    </div>
  );
}

export function Ring({ value, label, color = 'var(--teal)' }) {
  const r = 38, c = 2 * Math.PI * r;
  return (
    <div className="ring">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="var(--line)" strokeWidth="9" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={`${(Math.min(value, 100) / 100) * c} ${c}`} transform="rotate(-90 48 48)" />
        <text x="48" y="54" textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--ink)">{value}%</text>
      </svg>
      <span>{label}</span>
    </div>
  );
}

export const GradeBadge = ({ grade }) =>
  grade ? <span className={'badge ' + (grade === 'F' ? 'bad' : grade === 'D' ? 'warn' : 'ok')}>{grade}</span>
        : <span className="badge muted-b">In progress</span>;

export const Field = ({ label, error, children }) => (
  <label className="field"><span>{label}</span>{children}{error && <small className="error">{error}</small>}</label>
);

export const Empty = ({ icon = '📭', text }) => <div className="empty"><div>{icon}</div><p>{text}</p></div>;

export function Modal({ title, onClose, children }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="modal-head"><h3>{title}</h3><button className="x" onClick={onClose} aria-label="Close">✕</button></div>
        {children}
      </div>
    </div>
  );
}

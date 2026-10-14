/** Composants visuels purs du back-office. */
import { formatAmount } from '@wynveo/core';

export function Badge({ tone = 'neutral', children }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function Btn({ variant, size, loading, children, ...rest }) {
  return (
    <button type="button" className={['btn', variant, size].filter(Boolean).join(' ')} disabled={loading || rest.disabled} {...rest}>
      {loading ? '…' : children}
    </button>
  );
}

export function Kpi({ label, value, hint, tone }) {
  const style = tone === 'warn' ? { borderColor: '#fcd34d', background: '#fffbeb' } : undefined;
  return (
    <div className="card" style={{ ...style, padding: '12px 16px' }}>
      <div className="small muted" style={{ fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4, fontVariantNumeric: 'tabular-nums', color: tone === 'warn' ? '#b45309' : undefined }}>{value}</div>
      {hint && <div className="small" style={{ fontWeight: 700, marginTop: 2, color: tone === 'warn' ? '#b45309' : 'var(--fg-muted)' }}>{hint}</div>}
    </div>
  );
}

export const Amount = ({ value }) => <b>{formatAmount(value)}</b>;

export function Brand({ size = 22 }) {
  return (
    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: size, letterSpacing: '0.03em', color: '#fff' }}>
      WYN<span style={{ color: 'var(--gold)' }}>VEO</span>
    </span>
  );
}

export function Empty({ children }) {
  return <div className="muted" style={{ textAlign: 'center', padding: '28px 12px' }}>{children}</div>;
}

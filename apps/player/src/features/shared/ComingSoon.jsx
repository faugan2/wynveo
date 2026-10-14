import { Card } from '../../ui/index.js';

/** Écran d'attente pour les modules livrés aux étapes suivantes. */
export function ComingSoon({ title, tone, art, intro, items }) {
  const bg = tone === 'sport' ? 'linear-gradient(135deg, #14b8a6, #065f5b)' : 'linear-gradient(135deg, #8b3dff, #4c1d95)';
  return (
    <>
      <div style={{ position: 'relative', borderRadius: 'var(--radius-l)', padding: 22, background: bg, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        <span aria-hidden style={{ position: 'absolute', right: 16, top: 8, fontSize: 70 }}>{art}</span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2.4rem', textTransform: 'uppercase' }}>{title}</h1>
        <p style={{ maxWidth: '38ch', marginTop: 6, paddingRight: 70 }}>{intro}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {items.map((it) => (
          <Card key={it.name} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span aria-hidden style={{ fontSize: 30 }}>{it.icon}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>{it.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--fg-muted)' }}>{it.text}</div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

/** Logo texte Wynveo : "WYN" blanc, "VEO" or. */
export function Brand({ size = 22 }) {
  return (
    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: size, letterSpacing: '0.03em', lineHeight: 1 }}>
      WYN<span style={{ color: 'var(--gold)' }}>VEO</span>
    </span>
  );
}

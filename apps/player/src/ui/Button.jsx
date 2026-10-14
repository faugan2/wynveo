import s from './Button.module.css';

/**
 * Bouton principal. `as` permet d'en faire un lien (ex. as={Link} to="/").
 * variant : green | purple | teal | blue | orange | ghost | link | danger
 */
export function Button({
  as: As = 'button', variant = 'green', size, block, loading, sub, children, className = '', disabled, type, ...rest
}) {
  const cls = [s.btn, s[variant], block && s.block, size === 'small' && s.small, className].filter(Boolean).join(' ');
  const isButton = As === 'button';
  return (
    <As
      className={cls}
      disabled={isButton ? disabled || loading : undefined}
      type={isButton ? type ?? 'button' : undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className={s.spinner} aria-label="Chargement" /> : (
        <>
          <span>{children}</span>
          {sub && <span className={s.sub}>{sub}</span>}
        </>
      )}
    </As>
  );
}

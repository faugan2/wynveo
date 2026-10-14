import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/index.js';

const styles = {
  wrap: { display: 'flex', alignItems: 'center', gap: 12, minHeight: 40 },
  back: {
    width: 38, height: 38, borderRadius: '50%', flex: 'none', display: 'grid', placeItems: 'center',
    background: 'var(--panel-2)', border: '1px solid var(--line-soft)',
  },
  title: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem', textTransform: 'uppercase', letterSpacing: '0.02em', flex: 1, minWidth: 0 },
};

/** Titre d'écran avec bouton retour. backTo : chemin, ou -1 pour revenir en arrière. */
export function PageHeader({ title, backTo = -1, right }) {
  const navigate = useNavigate();
  return (
    <div style={styles.wrap}>
      {backTo !== null && (
        <button type="button" style={styles.back} onClick={() => navigate(backTo)} aria-label="Retour">
          <Icon name="back" />
        </button>
      )}
      <h1 style={styles.title}>{title}</h1>
      {right}
    </div>
  );
}

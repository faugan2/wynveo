import { Link } from 'react-router-dom';
import { Card, EmptyState } from '../../ui/index.js';
import { ROUTES } from '../../app/routes.js';

export function BetsPage() {
  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', textTransform: 'uppercase' }}>Mes paris</h1>
      <Card>
        <EmptyState icon="bets" title="Pas encore de pari">
          Vos parties de jeux et vos paris sportifs apparaîtront ici. En attendant, vos dépôts et retraits sont dans{' '}
          <Link to={ROUTES.history}>l'historique</Link>.
        </EmptyState>
      </Card>
    </>
  );
}

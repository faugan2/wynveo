import { ComingSoon } from '../shared/ComingSoon.jsx';

/** Application Sport : matchs, coupon et paris arrivent à l'étape 3. */
export function SportPage() {
  return (
    <ComingSoon
      title="Sport" tone="sport" art="⚽"
      intro="Les paris sportifs arrivent bientôt, avec le même solde que les jeux. Les cotes viendront de l'admin et de The Odds API."
      items={[
        { icon: '📅', name: 'Matchs du jour', text: 'Football, basket, tennis' },
        { icon: '🎫', name: 'Coupon', text: 'Paris simples et combinés' },
        { icon: '✅', name: 'Règlement automatique', text: 'Gains crédités à la fin du match' },
      ]}
    />
  );
}

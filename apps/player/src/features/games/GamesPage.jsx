import { ComingSoon } from '../shared/ComingSoon.jsx';

/** Application Jeux : les 4 jeux arrivent à l'étape 2 (tirages côté serveur). */
export function GamesPage() {
  return (
    <ComingSoon
      title="Jeux" tone="games" art="🎰"
      intro="Les jeux arrivent à la prochaine étape. Ils utiliseront le solde de votre portefeuille, avec des tirages faits côté serveur."
      items={[
        { icon: '🎡', name: 'Lucky Spin', text: "Jusqu'à 50x votre mise" },
        { icon: '🎁', name: 'Mystery Box', text: 'Choisissez une boîte' },
        { icon: '🔢', name: 'Lucky Number', text: '5 numéros, tirages réguliers' },
        { icon: '👑', name: 'Jackpot quotidien', text: '1 tirage par jour' },
      ]}
    />
  );
}

import { OPERATORS } from '@wynveo/core';
import { RadioCard } from '../../../ui/index.js';
import { OPERATOR_LOOK } from './operators.js';

/** Choix de l'opérateur Mobile Money. subtitles : { TMONEY: '…' } facultatif. */
export function OperatorPicker({ value, onChange, subtitles = {} }) {
  return (
    <div role="radiogroup" aria-label="Moyen de paiement" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Object.values(OPERATORS).map((op) => (
        <RadioCard
          key={op.id}
          selected={value === op.id}
          onSelect={() => onChange(op.id)}
          badge={op.short}
          badgeStyle={OPERATOR_LOOK[op.id]?.style}
          title={op.name}
          subtitle={subtitles[op.id]}
        />
      ))}
    </div>
  );
}

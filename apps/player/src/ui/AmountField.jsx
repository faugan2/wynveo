import { formatAmount, parseAmount, CURRENCY } from '@wynveo/core';
import { TextField } from './TextField.jsx';

/** Saisie d'un montant en FCFA : affiche "5 000", renvoie 5000 (ou null). */
export function AmountField({ value, onChange, ...rest }) {
  return (
    <TextField
      inputMode="numeric"
      autoComplete="off"
      big
      suffix={CURRENCY}
      placeholder="0"
      value={value ? formatAmount(value) : ''}
      onChange={(e) => onChange(parseAmount(e.target.value))}
      {...rest}
    />
  );
}

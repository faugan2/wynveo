import { useState } from 'react';

/** Copie un texte dans le presse-papiers et signale le succès pendant 2 s. */
export function useCopy() {
  const [copied, setCopied] = useState(false);
  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  return { copy, copied };
}

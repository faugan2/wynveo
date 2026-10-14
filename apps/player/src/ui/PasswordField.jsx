import { useState } from 'react';
import { TextField } from './TextField.jsx';

const toggleStyle = { background: 'none', border: 0, color: 'var(--fg-muted)', fontWeight: 600, fontSize: '0.82rem', padding: 4 };

/** Champ mot de passe avec bouton Afficher / Masquer. */
export function PasswordField(props) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      type={visible ? 'text' : 'password'}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      suffix={(
        <button type="button" style={toggleStyle} onClick={() => setVisible((v) => !v)} aria-pressed={visible}>
          {visible ? 'Masquer' : 'Afficher'}
        </button>
      )}
      {...props}
    />
  );
}

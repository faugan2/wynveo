import { NavLink, Outlet } from 'react-router-dom';
import { Brand } from '../ui/index.jsx';
import { useAdminSession } from '../hooks/AdminSession.jsx';
import { usePendingWithdrawals } from '../hooks/useWithdrawals.js';
import { dataSource } from '../services/index.js';

const ROLE_LABEL = { super: 'Super admin', finance: 'Finance', support: 'Support', trader: 'Trader sport' };

const MENU = [
  { to: '/', label: 'Tableau de bord', end: true },
  { to: '/retraits', label: 'Retraits à valider', badge: 'pending' },
  { to: '/utilisateurs', label: 'Utilisateurs' },
  { to: '/matchs', label: 'Matchs & cotes' },
  { group: 'BIENTÔT' },
  { label: 'Utilisateurs' }, { label: 'Vérifications KYC' }, { label: 'Jeux' }, { label: 'Promotions' },
  { label: 'Rapports' }, { label: 'Admins & audit' },
];

/** Cadre du back-office : menu latéral sur ordinateur, barre horizontale sur mobile (voir admin.css). */
export function AdminShell() {
  const { admin, signOut } = useAdminSession();
  const pending = usePendingWithdrawals({ enabled: ['super', 'finance', 'support'].includes(admin.role) });
  return (
    <div className="shell">
      <aside className="side">
        <div className="side-brand"><Brand /></div>
        <div className="side-group side-sub">ADMINISTRATION</div>
        <nav aria-label="Menu admin" className="side-nav">
          {MENU.map((m, i) => {
            if (m.group) return <div key={i} className="side-group">{m.group}</div>;
            if (!m.to) return <span key={i} className="side-link soon">{m.label}</span>;
            return (
              <NavLink key={m.to} to={m.to} end={m.end} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
                {m.label}
                {m.badge === 'pending' && pending.items.length > 0 && <span className="side-count">{pending.items.length}</span>}
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <div className="shell-main">
        <header className="shell-top">
          {dataSource === 'mock' && <span className="badge warn">Mode démo</span>}
          <div style={{ marginLeft: 'auto', textAlign: 'right', minWidth: 0 }}>
            <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>{admin.email}</div>
            <div className="small muted">{ROLE_LABEL[admin.role]}</div>
          </div>
          <button type="button" className="btn sm" onClick={signOut}>Se déconnecter</button>
        </header>
        <main className="shell-content"><Outlet /></main>
      </div>
    </div>
  );
}

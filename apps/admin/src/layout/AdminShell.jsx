import { NavLink, Outlet } from 'react-router-dom';
import { Brand } from '../ui/index.jsx';
import { useAdminSession } from '../hooks/AdminSession.jsx';
import { usePendingWithdrawals } from '../hooks/useWithdrawals.js';
import { dataSource } from '../services/index.js';

const ROLE_LABEL = { super: 'Super admin', finance: 'Finance', support: 'Support', trader: 'Trader sport' };

const MENU = [
  { to: '/', label: 'Tableau de bord', end: true },
  { to: '/retraits', label: 'Retraits à valider', badge: 'pending' },
  { group: 'BIENTÔT' },
  { label: 'Utilisateurs' }, { label: 'Vérifications KYC' }, { label: 'Jeux' }, { label: 'Matchs & cotes' },
  { label: 'Règlement des paris' }, { label: 'Promotions' }, { label: 'Rapports' }, { label: 'Admins & audit' },
];

const st = {
  layout: { display: 'flex', minHeight: '100%' },
  side: { width: 232, flex: 'none', background: 'var(--side)', color: 'var(--side-fg)', padding: '18px 12px', display: 'flex', flexDirection: 'column', gap: 2 },
  link: { display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, fontWeight: 600, color: 'inherit', textDecoration: 'none' },
  active: { background: 'var(--side-active)', color: '#fff', boxShadow: 'inset 3px 0 0 var(--gold)' },
  group: { fontSize: 10, letterSpacing: '0.1em', color: '#7d76b8', margin: '16px 12px 4px', fontWeight: 700 },
  count: { marginLeft: 'auto', background: '#ef4459', color: '#fff', borderRadius: 99, fontSize: 11, padding: '1px 8px', fontWeight: 700 },
  main: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' },
  top: { height: 60, background: '#fff', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 14, padding: '0 24px' },
  content: { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 },
};

export function AdminShell() {
  const { admin, signOut } = useAdminSession();
  const pending = usePendingWithdrawals({ enabled: ['super', 'finance', 'support'].includes(admin.role) });
  return (
    <div style={st.layout}>
      <aside style={st.side}>
        <div style={{ padding: '0 12px 2px' }}><Brand /></div>
        <div style={{ ...st.group, margin: '0 12px 12px' }}>ADMINISTRATION</div>
        <nav aria-label="Menu admin" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {MENU.map((m, i) => {
            if (m.group) return <div key={i} style={st.group}>{m.group}</div>;
            if (!m.to) return <span key={i} style={{ ...st.link, opacity: 0.45, cursor: 'default' }}>{m.label}</span>;
            return (
              <NavLink key={m.to} to={m.to} end={m.end} style={({ isActive }) => ({ ...st.link, ...(isActive ? st.active : {}) })}>
                {m.label}
                {m.badge === 'pending' && pending.items.length > 0 && <span style={st.count}>{pending.items.length}</span>}
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <div style={st.main}>
        <header style={st.top}>
          {dataSource === 'mock' && <span className="badge warn">Mode démo</span>}
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontWeight: 700 }}>{admin.email}</div>
            <div className="small muted">{ROLE_LABEL[admin.role]}</div>
          </div>
          <button type="button" className="btn sm" onClick={signOut}>Se déconnecter</button>
        </header>
        <main style={st.content}><Outlet /></main>
      </div>
    </div>
  );
}

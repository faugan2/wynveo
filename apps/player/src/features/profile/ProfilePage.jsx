import { usePlayerSession } from '../../hooks/PlayerSession.jsx';

export function ProfilePage() {
  const { player, signOut } = usePlayerSession();

  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>👤 Profil</h1>
      <div style={{ padding: 20, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
        <div style={{ marginBottom: 15 }}>
          <p className="small muted">Nom</p>
          <p style={{ fontWeight: 600 }}>{player?.fullName}</p>
        </div>
        <div style={{ marginBottom: 15 }}>
          <p className="small muted">Email</p>
          <p style={{ fontWeight: 600 }}>{player?.email}</p>
        </div>
        <div style={{ marginBottom: 15 }}>
          <p className="small muted">Téléphone</p>
          <p style={{ fontWeight: 600 }}>{player?.phone}</p>
        </div>
        <button type="button" className="btn bad" onClick={signOut}>
          Se déconnecter
        </button>
      </div>
    </>
  );
}

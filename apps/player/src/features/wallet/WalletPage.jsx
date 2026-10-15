export function WalletPage() {
  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>💰 Portefeuille</h1>
      <div style={{ padding: 20, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
        <h2 style={{ marginBottom: 15 }}>Gérer mon solde</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          <button type="button" className="btn" style={{ padding: 15 }}>
            + Dépôt
          </button>
          <button type="button" className="btn" style={{ padding: 15 }}>
            - Retrait
          </button>
        </div>
        <div style={{ marginTop: 20, padding: 15, backgroundColor: 'white', borderRadius: 4 }}>
          <p className="small muted">Historique des transactions</p>
          <p style={{ color: '#999' }}>Aucune transaction pour le moment</p>
        </div>
      </div>
    </>
  );
}

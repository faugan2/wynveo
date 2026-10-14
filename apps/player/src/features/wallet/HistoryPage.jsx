import { useState } from 'react';
import { Card, EmptyState, Notice, SectionTitle, SegmentedControl, Skeleton } from '../../ui/index.js';
import { PageHeader } from '../../layout/PageHeader.jsx';
import { useTransactions } from '../../hooks/useTransactions.js';
import { ROUTES } from '../../app/routes.js';
import { TransactionRow } from './components/TransactionRow.jsx';

export function HistoryPage() {
  const [filter, setFilter] = useState('all');
  const { groups, loading, error, filters } = useTransactions({ limit: 100, filter });
  return (
    <>
      <PageHeader title="Historique" backTo={ROUTES.wallet} />
      <SegmentedControl label="Type d'opération" value={filter} onChange={setFilter}
        options={filters.map((f) => ({ value: f.id, label: f.label }))} />
      {error && <Notice tone="error">{error.message}</Notice>}
      {loading && <Card style={{ display: 'grid', gap: 10 }}><Skeleton height={38} /><Skeleton height={38} /><Skeleton height={38} /></Card>}
      {!loading && groups.length === 0 && <Card><EmptyState title="Rien à afficher">Aucune opération pour ce filtre.</EmptyState></Card>}
      {groups.map((g) => (
        <section key={g.label} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SectionTitle>{g.label}</SectionTitle>
          <Card flush>{g.items.map((tx) => <TransactionRow key={tx.id} tx={tx} />)}</Card>
        </section>
      ))}
    </>
  );
}

'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/TopNav';
import { TransactionRow } from '@/components/Cards';
import { useUser } from '@/lib/userStore';
import { api, type TransactionItem, type LoyaltySummary } from '@/lib/api';
import { formatRub, formatDate } from '@/lib/format';

export default function HistoryPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const [items, setItems] = useState<TransactionItem[]>([]);
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);
  const [filter, setFilter] = useState<'all' | number>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && !user) router.replace('/login');
  }, [user, userLoading, router]);

  useEffect(() => {
    if (!user) return;
    const programId = filter === 'all' ? undefined : filter;
    api.getHistory(user.id, programId, 200)
      .then(setItems)
      .catch((e) => setError(e.message));
  }, [user, filter]);

  useEffect(() => {
    if (!user) return;
    api.getSummary(user.id).then(setSummary).catch(() => {});
  }, [user]);

  const grouped = useMemo(() => {
    const map = new Map<string, TransactionItem[]>();
    for (const tx of items) {
      const key = tx.payout_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    }
    return Array.from(map.entries());
  }, [items]);

  if (userLoading || !user) {
    return <div className="app-container" style={{ paddingTop: 64 }}>Загрузка…</div>;
  }

  return (
    <div className="app-container">
      <TopNav />
      <main className="page-content">
        <h1 style={{ margin: '0 0 16px', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>
          История выплат
        </h1>

        {summary && (
          <div className="hero" style={{ padding: 24 }}>
            <div className="hero-label">Получено в виде кэшбэка</div>
            <div className="hero-value" style={{ fontSize: 40 }}>
              {formatRub(summary.total_cashback_rub_equivalent)}
            </div>
            <div className="hero-meta">{items.length} выплат за период</div>
          </div>
        )}

        <div className="filters scroll-x" role="tablist" aria-label="Фильтры программ">
          <button
            className={`chip ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
            role="tab"
            aria-selected={filter === 'all'}
          >
            Все
          </button>
          {summary?.programs.map((p) => (
            <button
              key={p.program_id}
              className={`chip ${filter === p.program_id ? 'active' : ''}`}
              onClick={() => setFilter(p.program_id)}
              role="tab"
              aria-selected={filter === p.program_id}
            >
              {p.program_name}
            </button>
          ))}
        </div>

        {error && <div className="error-banner">{error}</div>}

        {grouped.length === 0 && (
          <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: 48 }}>
            Транзакций пока нет
          </div>
        )}

        {grouped.map(([date, txs]) => (
          <div key={date}>
            <div className="tx-day-header">{formatDate(date)}</div>
            {txs.map((tx) => <TransactionRow key={tx.transaction_id} tx={tx} />)}
          </div>
        ))}
      </main>
    </div>
  );
}

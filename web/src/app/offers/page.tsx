'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/TopNav';
import { PartnerRow, AIInsightCard } from '@/components/Cards';
import { useUser } from '@/lib/userStore';
import { api, type OfferItem, type InsightsResponse } from '@/lib/api';

export default function OffersPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const [allOffers, setAllOffers] = useState<OfferItem[]>([]);
  const [forUser, setForUser] = useState<OfferItem[]>([]);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [tab, setTab] = useState<'mine' | 'all'>('mine');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && !user) router.replace('/login');
  }, [user, userLoading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.allSettled([
      api.listOffers(),
      api.getOffersForUser(user.id),
      api.getInsights(user.id),
    ]).then(([all, mine, ins]) => {
      if (all.status === 'fulfilled') setAllOffers(all.value);
      if (mine.status === 'fulfilled') setForUser(mine.value);
      if (ins.status === 'fulfilled') setInsights(ins.value);
    }).catch((e) => setError(e.message));
  }, [user]);

  if (userLoading || !user) {
    return <div className="app-container" style={{ paddingTop: 64 }}>Загрузка…</div>;
  }

  const offersToShow = tab === 'mine' ? forUser : allOffers;
  const aiInsight = insights?.insights.find((i) => i.icon === 'sparkles' || i.icon === 'gift') ?? insights?.insights[0];

  return (
    <div className="app-container">
      <TopNav />
      <main className="page-content">
        <h1 style={{ margin: '0 0 16px', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Партнёры
        </h1>

        <div className="filters scroll-x">
          <button
            className={`chip ${tab === 'mine' ? 'active' : ''}`}
            onClick={() => setTab('mine')}
          >
            Подобраны для тебя
          </button>
          <button
            className={`chip ${tab === 'all' ? 'active' : ''}`}
            onClick={() => setTab('all')}
          >
            Все ({allOffers.length})
          </button>
        </div>

        {tab === 'mine' && aiInsight && (
          <div style={{ marginBottom: 12 }}>
            <AIInsightCard
              insight={{
                icon: 'sparkles',
                title: 'AI-подбор',
                body: `Подобрали ${forUser.length} партнёров под твой сегмент ${user.financial_segment}. Совокупная выгода может составить ~${Math.round(forUser.reduce((s, o) => s + o.cashback_percent, 0) * 100)} ₽ при средней корзине.`,
              }}
              badgeText="AI Подбор"
            />
          </div>
        )}

        {error && <div className="error-banner">{error}</div>}

        {offersToShow.length === 0 && (
          <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: 48 }}>
            Нет офферов для отображения
          </div>
        )}

        {offersToShow.map((o) => <PartnerRow key={o.id} offer={o} />)}
      </main>
    </div>
  );
}

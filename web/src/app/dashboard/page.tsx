'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/TopNav';
import {
  HeroCard, ProgramsRow, AIInsightCard, ForecastCard,
  StreakCard, QuestItem, OfferCard, CrossSellRow,
} from '@/components/Cards';
import { useUser } from '@/lib/userStore';
import {
  api,
  type LoyaltySummary, type InsightsResponse, type ForecastResponse,
  type GamificationResponse, type OfferItem, type CrossSellItem,
} from '@/lib/api';
import { formatRub, formatMonthShort } from '@/lib/format';
import {
  BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell,
} from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const [summary, setSummary] = useState<LoyaltySummary | null>(null);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [gamification, setGamification] = useState<GamificationResponse | null>(null);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [crossSell, setCrossSell] = useState<CrossSellItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [chartTab, setChartTab] = useState<'3M' | '6M' | '1Y'>('6M');

  // если нет юзера — на login
  useEffect(() => {
    if (!userLoading && !user) router.replace('/login');
  }, [user, userLoading, router]);

  // Загрузка всех данных параллельно
  useEffect(() => {
    if (!user) return;
    setError(null);
    Promise.allSettled([
      api.getSummary(user.id),
      api.getInsights(user.id),
      api.getForecast(user.id),
      api.getGamification(user.id),
      api.getOffersForUser(user.id),
      api.getCrossSell(user.id),
    ]).then(([s, i, f, g, o, c]) => {
      if (s.status === 'fulfilled') setSummary(s.value);
      if (i.status === 'fulfilled') setInsights(i.value);
      if (f.status === 'fulfilled') setForecast(f.value);
      if (g.status === 'fulfilled') setGamification(g.value);
      if (o.status === 'fulfilled') setOffers(o.value);
      if (c.status === 'fulfilled') setCrossSell(c.value);

      const failures = [s, i, f, g, o, c].filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        const reason = (failures[0] as PromiseRejectedResult).reason;
        setError(`Не удалось загрузить часть данных: ${reason?.message ?? 'unknown'}`);
      }
    });
  }, [user]);

  if (userLoading || !user) {
    return <div className="app-container" style={{ paddingTop: 64 }}>Загрузка…</div>;
  }

  const monthsToShow = chartTab === '3M' ? 3 : chartTab === '6M' ? 6 : 12;
  const chartData = (forecast?.monthly_history ?? [])
    .slice(-monthsToShow)
    .map((p) => ({ month: formatMonthShort(p.month), value: Math.round(p.rub_equivalent) }));
  const lastMonth = chartData.at(-1);
  const prevMonth = chartData.at(-2);
  const delta = lastMonth && prevMonth && prevMonth.value
    ? Math.round(((lastMonth.value - prevMonth.value) / prevMonth.value) * 100)
    : 0;

  return (
    <div className="app-container">
      <TopNav />

      <main className="page-content">
        {error && <div className="error-banner">{error}</div>}

        <div className="dash-layout">
          <div className="stack-lg">
            {summary && <HeroCard summary={summary} />}

            <div>
              <div className="h-section">
                Программы
              </div>
              {summary && (
                <ProgramsRow
                  programs={summary.programs}
                  onSelect={(id) => router.push(`/programs/${id}`)}
                />
              )}
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <div className="chart-title">Кэшбэк за месяц</div>
                  <div className="chart-value">
                    {lastMonth ? formatRub(lastMonth.value) : '—'}
                    {delta !== 0 && (
                      <span className="chart-delta" style={delta < 0 ? {
                        background: 'rgba(245, 86, 78, 0.15)', color: 'var(--danger)',
                      } : undefined}>
                        {delta > 0 ? '+' : ''}{delta}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="chart-tabs" role="tablist">
                  {(['3M', '6M', '1Y'] as const).map((t) => (
                    <button
                      key={t}
                      role="tab"
                      aria-selected={chartTab === t}
                      className={`chart-tab ${chartTab === t ? 'active' : ''}`}
                      onClick={() => setChartTab(t)}
                    >
                      {t === '3M' ? '3М' : t === '6M' ? '6М' : '1Г'}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
                    />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{
                        background: 'var(--surface)',
                        border: '1px solid var(--divider)',
                        borderRadius: 12,
                        fontSize: 13,
                      }}
                      formatter={(v: number) => [formatRub(v), 'Кэшбэк']}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={i === chartData.length - 1 ? 'var(--brand-yellow)' : 'var(--divider)'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {gamification && <StreakCard streak={gamification.streak_days} />}

            <div>
              <div className="h-section">
                Задания
                <a
                  className="more"
                  onClick={() => router.push('/achievements')}
                  style={{ cursor: 'pointer' }}
                >
                  Все задания →
                </a>
              </div>
              <div className="quest-list">
                {gamification?.quests.map((q) => <QuestItem key={q.code} quest={q} />)}
              </div>
            </div>

            <div>
              <div className="h-section">
                Партнёрские акции
                <a className="more" onClick={() => router.push('/offers')} style={{ cursor: 'pointer' }}>
                  Все
                </a>
              </div>
              <div className="offers-grid">
                {offers.slice(0, 4).map((o) => <OfferCard key={o.id} offer={o} />)}
              </div>
            </div>
          </div>

          <div className="stack">
            {insights?.insights[0] && (
              <AIInsightCard
                insight={insights.insights[0]}
                badgeText={insights.generated_by === 'gigachat' ? 'AI Совет' : 'Совет'}
              />
            )}
            {forecast && <ForecastCard forecast={forecast} />}
            {insights && insights.insights[1] && (
              <AIInsightCard
                insight={insights.insights[1]}
                badgeText={insights.generated_by === 'gigachat' ? 'AI' : 'Совет'}
              />
            )}

            <div>
              <div className="h-section">Тебе подойдёт</div>
              <div className="stack">
                {crossSell.map((item) => <CrossSellRow key={item.product} item={item} />)}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

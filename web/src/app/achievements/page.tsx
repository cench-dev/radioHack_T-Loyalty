'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopNav } from '@/components/TopNav';
import { LevelCard, StreakCard, AchievementCard, QuestItem } from '@/components/Cards';
import { useUser } from '@/lib/userStore';
import { api, type GamificationResponse } from '@/lib/api';

export default function AchievementsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const [data, setData] = useState<GamificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && !user) router.replace('/login');
  }, [user, userLoading, router]);

  useEffect(() => {
    if (!user) return;
    api.getGamification(user.id).then(setData).catch((e) => setError(e.message));
  }, [user]);

  if (userLoading || !user) {
    return <div className="app-container" style={{ paddingTop: 64 }}>Загрузка…</div>;
  }

  const unlockedCount = data?.achievements.filter((a) => a.unlocked).length ?? 0;
  const totalCount = data?.achievements.length ?? 0;

  return (
    <div className="app-container">
      <TopNav />
      <main className="page-content">
        <h1 style={{ margin: '0 0 16px', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Достижения
        </h1>

        {error && <div className="error-banner">{error}</div>}

        {data && (
          <div className="stack-lg">
            <LevelCard
              level={data.level}
              levelName={data.level_name}
              progress={data.level_progress}
              nextThreshold={data.next_level_threshold_rub}
              currentRub={data.total_cashback_rub}
            />

            <StreakCard streak={data.streak_days} />

            <div>
              <div className="h-section">
                Активные задания
                <span className="more">{data.quests.filter((q) => !q.done).length} активных</span>
              </div>
              <div className="quest-list">
                {data.quests.map((q) => <QuestItem key={q.code} quest={q} />)}
              </div>
            </div>

            <div>
              <div className="h-section">
                Ачивки
                <span className="more">{unlockedCount} / {totalCount}</span>
              </div>
              <div className="achievements-grid">
                {data.achievements.map((a) => <AchievementCard key={a.code} ach={a} />)}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

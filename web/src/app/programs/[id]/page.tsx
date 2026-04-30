'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { TopNav } from '@/components/TopNav';
import { TransactionRow } from '@/components/Cards';
import { Icon } from '@/components/Icon';
import { useUser } from '@/lib/userStore';
import { api, type TransactionItem, type ProgramSummary } from '@/lib/api';
import { formatCurrencyAmount, programGradient } from '@/lib/format';

export default function ProgramDetailsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const programId = parseInt(params.id, 10);
  const { user, loading: userLoading } = useUser();

  const [program, setProgram] = useState<ProgramSummary | null>(null);
  const [history, setHistory] = useState<TransactionItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && !user) router.replace('/login');
  }, [user, userLoading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.allSettled([
      api.getSummary(user.id),
      api.getHistory(user.id, programId, 50),
    ]).then(([s, h]) => {
      if (s.status === 'fulfilled') {
        const p = s.value.programs.find((x) => x.program_id === programId);
        if (p) setProgram(p);
        else setError('Программа не найдена');
      }
      if (h.status === 'fulfilled') setHistory(h.value);
    });
  }, [user, programId]);

  if (userLoading || !user) {
    return <div className="app-container" style={{ paddingTop: 64 }}>Загрузка…</div>;
  }

  return (
    <div className="app-container">
      <TopNav />
      <main className="page-content">
        <button
          className="btn-ghost"
          onClick={() => router.back()}
          style={{ marginBottom: 16 }}
        >
          <Icon name="arrow-left" size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          Назад
        </button>

        {error && <div className="error-banner">{error}</div>}

        {program && (
          <>
            <div
              style={{
                background: programGradient(program.program_name),
                color: '#FFF',
                borderRadius: 'var(--r-lg)',
                padding: 32,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 4 }}>
                Программа {program.program_name}
              </div>
              <div style={{ fontSize: 14, opacity: 0.8 }}>Текущий баланс</div>
              <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-0.03em', marginTop: 8 }}>
                {formatCurrencyAmount(program.current_balance, program.currency)}
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                marginTop: 24,
                paddingTop: 20,
                borderTop: '1px solid rgba(255,255,255,0.15)',
              }}>
                <div>
                  <div style={{ fontSize: 11, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Начислено за 30 дней
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                    + {formatCurrencyAmount(program.total_earned_last_30d, program.currency)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, opacity: 0.65, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Начислено за период
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                    + {formatCurrencyAmount(program.total_earned_all_time, program.currency)}
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: 11,
                opacity: 0.55,
                marginTop: 12,
                lineHeight: 1.5,
              }}>
                Баланс включает накопления до начала истории транзакций.
                «Начислено за период» — это сумма поступлений в системе лояльности с момента её запуска.
              </div>
            </div>

            <div className="h-section">
              История начислений
              <span className="more">{history.length} записей</span>
            </div>

            {history.length === 0 ? (
              <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: 32 }}>
                Пока нет начислений по этой программе
              </div>
            ) : (
              history.map((tx) => <TransactionRow key={tx.transaction_id} tx={tx} />)
            )}
          </>
        )}
      </main>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { useUser } from '@/lib/userStore';
import { useTheme } from '@/components/ThemeProvider';
import { api, ApiError, type UserBrief } from '@/lib/api';
import { getInitials } from '@/lib/format';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, user, loading: userLoading } = useUser();
  const { theme, toggle } = useTheme();
  const [identifier, setIdentifier] = useState('');
  const [users, setUsers] = useState<UserBrief[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // если залогинен, на дашборд
  useEffect(() => {
    if (!userLoading && user) router.replace('/dashboard');
  }, [user, userLoading, router]);

  useEffect(() => {
    api.listUsers().then(setUsers).catch((e: ApiError) => {
      setError(`Не удалось загрузить пользователей: ${e.message}. `);
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { user } = await api.login(identifier.trim());
      setUser(user);
      router.push('/dashboard');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Ошибка входа');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectUser = (u: UserBrief) => {
    setUser(u);
    router.push('/dashboard');
  };

  return (
    <div className="login-container">
      <button
        className="theme-toggle"
        onClick={toggle}
        aria-label="Переключить тему"
        title={theme === 'dark' ? 'Светлая' : 'Тёмная'}
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 10,
        }}
      >
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
      </button>

      <div className="login-hero">
        <div className="login-logo">Т</div>
        <h1 className="login-title">Лояльность</h1>
        <p className="login-sub">Все выгоды от банка в одном месте</p>
      </div>

      <form onSubmit={handleLogin}>
        <label className="input-label" htmlFor="identifier">Email или телефон</label>
        <div className="input-field">
          <Icon name="mail" size={20} style={{ opacity: 0.4 }} />
          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="dmitriy.ivanov29@yandex.ru"
            required
          />
        </div>
        {error && <div className="error-banner">{error}</div>}
        <button
          type="submit"
          className="btn-primary"
          style={{ marginTop: 16 }}
          disabled={submitting || !identifier.trim()}
        >
          {submitting ? 'Входим…' : 'Войти'}
        </button>
      </form>

      <div className="divider-or">или выбери из списка</div>

      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', margin: '8px 4px 12px' }}>
        Тестовые пользователи
      </div>

      {users.length === 0 && !error && (
        <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: 24 }}>
          Загрузка…
        </div>
      )}

      {users.map((u) => {
        const segClass = u.financial_segment === 'LOW' ? 'seg-low'
          : u.financial_segment === 'MEDIUM' ? 'seg-medium' : 'seg-high';
        return (
          <button
            type="button"
            key={u.id}
            className="user-row"
            onClick={() => handleSelectUser(u)}
          >
            <div className={`user-avatar ${segClass}`}>{getInitials(u.full_name)}</div>
            <div className="user-info">
              <div className="user-name">{u.full_name}</div>
              <div className="user-meta">{u.phone_number}</div>
            </div>
            <span className={`seg-tag ${segClass}`}>{u.financial_segment}</span>
          </button>
        );
      })}
    </div>
  );
}

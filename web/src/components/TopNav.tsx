'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from './Icon';
import { useUser } from '@/lib/userStore';
import { getInitials } from '@/lib/format';
import { useTheme } from './ThemeProvider';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Главная' },
  { href: '/history', label: 'История' },
  { href: '/offers', label: 'Партнёры' },
  { href: '/achievements', label: 'Достижения' },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useUser();
  const { theme, toggle } = useTheme();

  const segClass = user
    ? user.financial_segment === 'LOW' ? 'seg-low'
    : user.financial_segment === 'MEDIUM' ? 'seg-medium'
    : 'seg-high'
    : 'seg-low';

  const handleLogout = () => {
    setUser(null);
    router.push('/login');
  };

  return (
    <header className="top-nav">
      <div className="top-nav-left">
        <Link href="/dashboard" className="top-nav-logo">
          <span className="top-nav-logo-mark">Т</span>
          <span>Лояльность</span>
        </Link>
        <nav className="top-nav-links">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname.startsWith(item.href) ? 'active' : ''}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="top-nav-right">
        <button
          className="theme-toggle"
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
          title={theme === 'dark' ? 'Светлая' : 'Тёмная'}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
        </button>
        {user && (
          <>
            <div className={`user-avatar sm ${segClass}`}>{getInitials(user.full_name)}</div>
            <div style={{ fontSize: 13 }}>
              <span style={{ marginRight: 6 }}>{user.full_name.split(' ')[0]}</span>
              <span
                className="seg-tag"
                style={{
                  fontSize: 10,
                  background: 'var(--surface-2)',
                  color: 'var(--text-secondary)',
                }}
              >
                {user.financial_segment}
              </span>
            </div>
            <button
              className="theme-toggle"
              onClick={handleLogout}
              aria-label="Выйти"
              title="Выйти"
            >
              <Icon name="logout" size={20} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}

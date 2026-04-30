'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/userStore';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useUser();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? '/dashboard' : '/login');
  }, [user, loading, router]);

  return (
    <div className="app-container" style={{ paddingTop: 64, textAlign: 'center' }}>
      <div style={{ color: 'var(--text-secondary)' }}>Загрузка…</div>
    </div>
  );
}

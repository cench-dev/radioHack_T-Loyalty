'use client';
import { useState } from 'react';
import { Icon, IconName } from './Icon';
import {
  formatRub, formatNumber, formatMonthShort, formatDate,
  programGradient, formatCurrencyAmount,
} from '@/lib/format';
import type {
  LoyaltySummary, ProgramSummary, Insight, ForecastResponse,
  Quest, Achievement, OfferItem, CrossSellItem, TransactionItem,
} from '@/lib/api';

export function HeroCard({ summary }: { summary: LoyaltySummary }) {
  return (
    <div className="hero">
      <div className="hero-label">Получено в виде кэшбэка</div>
      <div className="hero-value">{formatRub(summary.total_cashback_rub_equivalent)}</div>
      <div className="hero-meta">
        в рублёвом эквиваленте — рубли + мили + баллы
      </div>
      <div className="hero-currencies">
        <span className="currency-chip">
          <span className="currency-chip-dot" style={{ background: '#1C1C1E' }} />
          Рубли · {formatNumber(summary.total_rub)}
        </span>
        <span className="currency-chip">
          <span className="currency-chip-dot" style={{ background: '#428BF9' }} />
          Мили · {formatNumber(summary.total_miles)}
        </span>
        <span className="currency-chip">
          <span className="currency-chip-dot" style={{ background: '#FF8A65' }} />
          Браво · {formatNumber(summary.total_bravo_points)}
        </span>
      </div>
    </div>
  );
}

export function ProgramsRow({ programs, onSelect }: {
  programs: ProgramSummary[];
  onSelect?: (programId: number) => void;
}) {
  const order = ['black', 'airlines', 'bravo'];
  const sorted = [...programs].sort((a, b) => {
    const ai = order.findIndex((k) => a.program_name.toLowerCase().includes(k));
    const bi = order.findIndex((k) => b.program_name.toLowerCase().includes(k));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="programs">
      {sorted.map((p) => {
        const klass =
          p.program_name.toLowerCase().includes('black') ? 'black'
          : p.program_name.toLowerCase().includes('airlines') ? 'airlines'
          : 'bravo';
        return (
          <button
            type="button"
            key={p.program_id}
            className={`prog-card ${klass}`}
            onClick={() => onSelect?.(p.program_id)}
            style={{ background: programGradient(p.program_name), border: 'none', textAlign: 'left' }}
            aria-label={`Программа ${p.program_name}`}
          >
            <div className="prog-name">{p.program_name}</div>
            <div>
              <div className="prog-balance">{formatNumber(p.current_balance)}</div>
              <div className="prog-currency">
                {p.currency === 'rub' && 'рубли'}
                {p.currency === 'miles' && 'мили'}
                {p.currency === 'bravo-points' && 'баллы'}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}


export function AIInsightCard({ insight, badgeText = 'AI Совет' }: {
  insight: Insight;
  badgeText?: string;
}) {
  return (
    <div className="ai-insight">
      <span className="ai-badge">
        <Icon name="sparkles" size={10} />
        {badgeText}
      </span>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{insight.title}</div>
      <div className="ai-text">{insight.body}</div>
    </div>
  );
}

export function ForecastCard({ forecast }: { forecast: ForecastResponse }) {
  return (
    <div className="forecast-card">
      <div className="forecast-row">
        <div>
          <div className="forecast-label">Прогноз на год</div>
          <div className="forecast-value">~ {formatRub(forecast.next_year_rub)}</div>
        </div>
        <svg width="60" height="40" viewBox="0 0 60 40" fill="none" aria-hidden="true">
          <polyline
            points="0,30 12,25 24,20 36,12 48,8 60,4"
            stroke="var(--purple)"
            strokeWidth="2"
            fill="none"
          />
          <circle cx="60" cy="4" r="3" fill="var(--purple)" />
        </svg>
      </div>
      <div className="forecast-cta">
        Уверенность: {forecast.confidence === 'high' ? 'высокая' : forecast.confidence === 'medium' ? 'средняя' : 'низкая'}
      </div>
    </div>
  );
}


export function StreakCard({ streak }: { streak: number }) {
  const word = streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней';
  return (
    <div className="streak">
      <div className="streak-icon"><Icon name="flame" size={24} /></div>
      <div style={{ flex: 1 }}>
        <div className="streak-num">Серия {streak} {word}</div>
        <div className="streak-text">заходов подряд</div>
      </div>
    </div>
  );
}

export function QuestItem({ quest }: { quest: Quest }) {
  const klass = ['quest', quest.featured ? 'featured' : '', quest.done ? 'done' : '']
    .filter(Boolean).join(' ');
  return (
    <div className={klass}>
      <div className="quest-icon">
        <Icon name={quest.icon as IconName} size={22} />
      </div>
      <div className="quest-body">
        <div className="quest-title">{quest.title}</div>
        <div className="quest-meta">{quest.meta}</div>
        {quest.featured && (
          <div className="quest-progress-bar">
            <div className="quest-progress-fill" style={{ width: `${quest.progress * 100}%` }} />
          </div>
        )}
      </div>
      <div className="quest-reward">{quest.reward_text}</div>
    </div>
  );
}


export function AchievementCard({ ach }: { ach: Achievement }) {
  return (
    <div className={`ach ${ach.unlocked ? '' : 'locked'}`} title={ach.description}>
      <div className="ach-icon"><Icon name={ach.icon as IconName} size={22} /></div>
      <div className="ach-title">{ach.title}</div>
      <div className="ach-prog">
        {ach.unlocked ? 'Открыто' : `${Math.round(ach.progress * 100)}%`}
      </div>
    </div>
  );
}

export function OfferCard({ offer }: { offer: OfferItem }) {
  const initials = offer.partner_name
    .split(/\s+/).slice(0, 2).map((s) => s[0] || '').join('').toUpperCase();
  return (
    <div className="offer" style={{ background: offer.brand_color_hex }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PartnerLogo
          url={offer.logo_url}
          fallback={initials || 'П'}
          size={36}
          radius={10}
          variant="overlay"
        />
        <div className="offer-percent">{offer.cashback_percent}%</div>
      </div>
      <div>
        <div className="offer-name">{offer.partner_name}</div>
        <div className="offer-desc">{offer.short_description}</div>
      </div>
    </div>
  );
}

export function PartnerRow({ offer }: { offer: OfferItem }) {
  const initials = offer.partner_name
    .split(/\s+/).slice(0, 2).map((s) => s[0] || '').join('').toUpperCase();
  return (
    <div className="partner-row">
      <PartnerLogo
        url={offer.logo_url}
        fallback={initials || 'П'}
        bg={offer.brand_color_hex}
        size={48}
        radius={14}
        variant="solid"
      />
      <div className="partner-info">
        <div className="partner-name">{offer.partner_name}</div>
        <div className="partner-desc">{offer.short_description}</div>
      </div>
      <div className="partner-cb">{offer.cashback_percent}%</div>
    </div>
  );
}

function PartnerLogo({
  url, fallback, bg, size, radius, variant,
}: {
  url: string;
  fallback: string;
  bg?: string;
  size: number;
  radius: number;
  variant: 'solid' | 'overlay';
}) {
  const [error, setError] = useState(false);
  const showImage = !!url && !error;

  if (!showImage) {
    const overlayBg = variant === 'overlay' ? 'rgba(255,255,255,0.25)' : (bg || 'var(--surface-2)');
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          background: overlayBg,
          color: variant === 'overlay' ? '#FFF' : '#FFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: size <= 36 ? 13 : 16,
          flexShrink: 0,
        }}
      >
        {fallback}
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: '#FFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <img
        src={url}
        alt=""
        onError={() => setError(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
}

const CROSS_ICONS: Record<CrossSellItem['product'], IconName> = {
  investments: 'trending',
  savings: 'savings',
  business: 'card',
  mobile: 'phone',
  premium: 'crown',
};
export function CrossSellRow({ item }: { item: CrossSellItem }) {
  return (
    <a
      className="cross-item"
      href={item.external_url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${item.title} — открыть на tbank.ru в новой вкладке`}
    >
      <div className={`cross-icon ${item.product}`}>
        <Icon name={CROSS_ICONS[item.product]} size={22} />
      </div>
      <div className="cross-content">
        <div className="cross-title">{item.title}</div>
        <div className="cross-desc">{item.description}</div>
      </div>
      <Icon name="chevron-right" size={20} className="cross-arrow" />
    </a>
  );
}

export function TransactionRow({ tx }: { tx: TransactionItem }) {
  const isAirlines = tx.currency === 'miles';
  const isBravo = tx.currency === 'bravo-points';
  const iconName: IconName = isAirlines ? 'plane' : isBravo ? 'star' : 'coins';
  const iconStyle = isAirlines
    ? { background: 'var(--info-soft)', color: 'var(--info)' }
    : isBravo
    ? { background: 'rgba(255,138,101,0.18)', color: '#FF8A65' }
    : undefined;
  const amountColor = isAirlines ? 'var(--info)' : isBravo ? '#FF8A65' : 'var(--success)';

  return (
    <div className="tx-row">
      <div className="tx-icon" style={iconStyle}>
        <Icon name={iconName} size={20} />
      </div>
      <div className="tx-info">
        <div className="tx-title">{tx.program_name}</div>
        <div className="tx-date">{formatDate(tx.payout_date)}</div>
      </div>
      <div className="tx-amount" style={{ color: amountColor }}>
        + {formatCurrencyAmount(tx.cashback_amount, tx.currency)}
      </div>
    </div>
  );
}


export function LevelCard({
  level, levelName, progress, nextThreshold, currentRub,
}: {
  level: number; levelName: string; progress: number;
  nextThreshold: number; currentRub: number;
}) {
  return (
    <div className="level-card">
      <div className="level-row">
        <div>
          <div className="level-name">Уровень {level} — {levelName}</div>
          <div className="level-num">{level}</div>
        </div>
      </div>
      <div className="level-bar-wrap">
        <div className="level-bar-bg">
          <div className="level-bar-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="level-bar-meta">
          <span>{formatRub(currentRub)} кэшбэка</span>
          <span>{formatRub(nextThreshold)}</span>
        </div>
      </div>
    </div>
  );
}

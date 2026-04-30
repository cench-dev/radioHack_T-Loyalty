import { SVGProps, ReactNode } from 'react';

export type IconName =
  | 'flame' | 'trending' | 'savings' | 'target' | 'diamond' | 'rocket'
  | 'plane' | 'crown' | 'trophy' | 'star' | 'gift' | 'hotel' | 'globe'
  | 'check' | 'lock' | 'shield' | 'coins' | 'card' | 'sparkles' | 'calendar'
  | 'clock' | 'arrow-right' | 'arrow-left' | 'search' | 'bell' | 'home'
  | 'menu' | 'sun' | 'moon' | 'mail' | 'phone' | 'logout' | 'chevron-right';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
  className?: string;
}

const PATHS: Record<IconName, ReactNode> = {
  flame: (
    <path
      fillRule="evenodd"
      style={{ fill: 'currentColor', stroke: 'none' }}
      d="M12 2C10 8 5 11 5 16a7 7 0 0 0 14 0c0-5-5-8-7-14z M12 21a3 3 0 0 1-3-3c0-2 1.5-3.2 3-5 1.5 1.8 3 3 3 5a3 3 0 0 1-3 3z"
    />
  ),
  trending: (
    <>
      <polyline points="3 17 9 11 13 15 21 7" stroke="currentColor" />
      <polyline points="15 7 21 7 21 13" stroke="currentColor" />
    </>
  ),
  savings: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="3" stroke="currentColor" />
      <path d="M7 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" stroke="currentColor" />
      <circle cx="16" cy="13.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" stroke="currentColor" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  diamond: (
    <>
      <path d="M6 3h12l3 6-9 12L3 9z" stroke="currentColor" />
      <path d="M3 9h18M10 3l-2 6 4 12 4-12-2-6" stroke="currentColor" />
    </>
  ),
  rocket: (
    <>
      <path d="M4 13a8 8 0 0 1 7 7 6 6 0 0 0 3-5 9 9 0 0 0 6-8 3 3 0 0 0-3-3 9 9 0 0 0-8 6 6 6 0 0 0-5 3z" stroke="currentColor" />
      <path d="M7 14a6 6 0 0 0-3 6 6 6 0 0 0 6-3" stroke="currentColor" />
      <circle cx="15" cy="9" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  plane: (
    <>
      <path d="M22 2L11 13" stroke="currentColor" />
      <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" />
    </>
  ),
  crown: (
    <>
      <path d="M3 8l3 9h12l3-9-5 4-4-7-4 7z" stroke="currentColor" />
      <path d="M5 19h14" stroke="currentColor" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" stroke="currentColor" />
      <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" stroke="currentColor" />
      <path d="M9 14v3h6v-3M8 20h8M12 17v3" stroke="currentColor" />
    </>
  ),
  star: (
    <path
      style={{ fill: 'currentColor', stroke: 'none' }}
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
    />
  ),
  gift: (
    <>
      <rect x="3" y="9" width="18" height="12" rx="1" stroke="currentColor" />
      <path d="M3 13h18M12 9v12" stroke="currentColor" />
      <path d="M12 9c-2 0-4-1-4-3s2-3 4 0c2-3 4-2 4 0s-2 3-4 3z" stroke="currentColor" />
    </>
  ),
  hotel: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="1" stroke="currentColor" />
      <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" stroke="currentColor" />
      <path d="M10 21v-3h4v3" stroke="currentColor" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" stroke="currentColor" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" stroke="currentColor" />
    </>
  ),
  check: <polyline points="4 12 10 18 20 6" stroke="currentColor" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" stroke="currentColor" />
      <polyline points="9 12 11 14 15 10" stroke="currentColor" />
    </>
  ),
  coins: (
    <>
      <ellipse cx="9" cy="8" rx="6" ry="2.5" stroke="currentColor" />
      <path d="M3 8v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V8" stroke="currentColor" />
      <path d="M9 14.5v3c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4c0-1.4-2.7-2.5-6-2.5" stroke="currentColor" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" />
      <path d="M3 10h18M7 15h3" stroke="currentColor" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2 2M16.5 16.5l2 2M5.5 18.5l2-2M16.5 7.5l2-2" stroke="currentColor" />
      <path d="M12 8l1.5 2.5L16 12l-2.5 1.5L12 16l-1.5-2.5L8 12l2.5-1.5z" stroke="currentColor" fill="currentColor" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" />
      <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" />
      <polyline points="9 15 11 17 15 13" stroke="currentColor" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" stroke="currentColor" />
      <polyline points="12 7 12 12 15 14" stroke="currentColor" />
    </>
  ),
  'arrow-right': <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" />,
  'arrow-left': <path d="M19 12H5M11 5l-7 7 7 7" stroke="currentColor" />,
  'chevron-right': <path d="m9 18 6-6-6-6" stroke="currentColor" />,
  search: (
    <>
      <circle cx="11" cy="11" r="8" stroke="currentColor" />
      <path d="m21 21-4.3-4.3" stroke="currentColor" />
    </>
  ),
  bell: (
    <>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" stroke="currentColor" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" stroke="currentColor" />
    </>
  ),
  home: <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" stroke="currentColor" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" stroke="currentColor" />
    </>
  ),
  moon: <path d="M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10z" stroke="currentColor" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" />
      <path d="M3 7l9 7 9-7" stroke="currentColor" />
    </>
  ),
  phone: (
    <path
      d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"
      stroke="currentColor"
    />
  ),
  logout: (
    <>
      <path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" stroke="currentColor" />
      <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" />
    </>
  ),
};

export function Icon({ name, size, className, style, ...rest }: IconProps) {
  const sizeStyle = size ? { width: size, height: size } : undefined;
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ? `icon ${className}` : 'icon'}
      style={{ ...sizeStyle, ...style }}
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}

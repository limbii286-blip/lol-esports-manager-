import React, { useState } from 'react';
import { Shield } from 'lucide-react';

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

// Custom Heraldic Esports SVG Shield Crest (deterministic unique silhouette & pattern for all 56 clubs)
export const TeamCrest: React.FC<{
  tag: string;
  color: string;
  color2?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}> = ({ tag, color, color2 = '#ffffff', size = 'md' }) => {
  const px = size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'lg' ? 48 : 36;
  const h = hashString(tag || 'CLB');
  const shapeIdx = h % 6;
  const patternIdx = (h >> 3) % 4;
  const gradId = `crest_${tag.replace(/[^a-zA-Z0-9]/g, '')}_${px}_${shapeIdx}`;

  // 6 Distinct Pro Esports Crest Silhouettes (40x40 viewBox)
  const shieldPaths = [
    'M20 2 L35 7 L34 22 C33 30 27 35 20 38 C13 35 7 30 6 22 L5 7 Z', // Classic Heater Shield
    'M20 2 L36 10 L36 28 L20 38 L4 28 L4 10 Z', // Pro Hexagon
    'M20 2 L36 6 L31 18 L34 25 L20 38 L6 25 L9 18 L4 6 Z', // Winged Crest
    'M20 2 L35 12 L29 36 L11 36 L5 12 Z', // Crown Pentagon
    'M6 4 L34 4 L36 20 L20 38 L4 20 Z', // Split Banner
    'M20 2 L37 18 L20 38 L3 18 Z', // Diamond Emblem
  ];

  const label = (tag || 'CLB').slice(0, 4).toUpperCase();
  const fontSize = label.length >= 4 ? 9.5 : label.length === 3 ? 11.5 : 13;

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 40 40"
      className="shrink-0 select-none drop-shadow-sm"
      role="img"
      aria-label={tag}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color || '#334155'} />
          <stop offset="100%" stopColor="#0B0E14" />
        </linearGradient>
        <clipPath id={`${gradId}_clip`}>
          <path d={shieldPaths[shapeIdx]} />
        </clipPath>
      </defs>

      {/* Base Shield */}
      <path d={shieldPaths[shapeIdx]} fill={`url(#${gradId})`} />

      {/* Geometric Heraldic Accent */}
      <g clipPath={`url(#${gradId}_clip)`} opacity="0.26">
        {patternIdx === 0 && <polygon points="0,0 24,0 10,40 0,40" fill={color2} />}
        {patternIdx === 1 && <polygon points="20,4 38,20 20,26 2,20" fill={color2} />}
        {patternIdx === 2 && <rect x="16" y="0" width="8" height="40" fill={color2} />}
        {patternIdx === 3 && (
          <>
            <polygon points="0,28 40,10 40,18 0,36" fill={color2} />
            <polygon points="0,0 40,0 40,8 0,8" fill={color2} />
          </>
        )}
      </g>

      {/* Outer Metallic Bevel */}
      <path
        d={shieldPaths[shapeIdx]}
        fill="none"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1.6"
      />
      <path
        d={shieldPaths[shapeIdx]}
        fill="none"
        stroke={color2}
        strokeOpacity="0.45"
        strokeWidth="0.7"
      />

      {/* Team Monogram */}
      <text
        x="20"
        y="24"
        textAnchor="middle"
        fill={color2 || '#FFFFFF'}
        fontFamily="Barlow Condensed, sans-serif"
        fontWeight="800"
        fontSize={fontSize}
        letterSpacing="0.4"
      >
        {label}
      </text>
    </svg>
  );
};

// Stylized Pro Esports Player Portrait Avatar
export const PlayerAvatar: React.FC<{
  name: string;
  role: string;
  color?: string;
  size?: number;
}> = ({ name, role, color = '#C89B3C', size = 48 }) => {
  const h = hashString(name || 'PRO');
  const skinTones = ['#F1C27D', '#E0AC69', '#C68642', '#F5D0A9', '#D9A066'];
  const hairColors = ['#0F172A', '#1E293B', '#3B2F2F', '#4A3728', '#27272A'];
  const skin = skinTones[h % skinTones.length];
  const hair = hairColors[(h >> 2) % hairColors.length];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className="shrink-0 rounded-md border border-white/[0.14] bg-[#0B0E14] select-none"
      role="img"
      aria-label={name}
    >
      <defs>
        <linearGradient id={`av_${h}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor="#0B0E14" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" fill={`url(#av_${h})`} />
      {/* Pro Jersey Shoulders */}
      <path d="M7 48 C9 36 16 33 24 33 C32 33 39 36 41 48 Z" fill={color} />
      <path d="M17 34 L24 41 L31 34" fill="none" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="1.5" />
      {/* Neck & Head */}
      <rect x="20.5" y="27" width="7" height="7" rx="2" fill={skin} />
      <circle cx="24" cy="20" r="8.5" fill={skin} />
      {/* Hair Silhouette */}
      <path d="M15.5 19 C15.5 12 20 10 24 10 C29 10 32.5 13 32.5 19 C30 15 18 15 15.5 19 Z" fill={hair} />
      {/* Pro Stage Headset */}
      <path d="M14.5 20 C14.5 12 33.5 12 33.5 20" fill="none" stroke="#94A3B8" strokeWidth="2.2" />
      <rect x="12.5" y="18" width="3.2" height="6.5" rx="1.5" fill="#1E293B" stroke="#E4BD67" strokeWidth="0.9" />
      <rect x="32.3" y="18" width="3.2" height="6.5" rx="1.5" fill="#1E293B" stroke="#E4BD67" strokeWidth="0.9" />
      {/* Role Micro-Tag */}
      <rect x="2" y="2" width="16" height="9.5" rx="2" fill="rgba(11,14,20,0.85)" />
      <text
        x="10"
        y="9"
        textAnchor="middle"
        fill="#E4BD67"
        fontSize="6.5"
        fontFamily="JetBrains Mono, monospace"
        fontWeight="700"
      >
        {role.slice(0, 3)}
      </text>
    </svg>
  );
};

// Stylized Champion Emblem Badge for Draft & Broadcast Scoreboard
export const ChampionEmblem: React.FC<{
  name: string;
  dmg?: string;
  classTag?: string;
  size?: 'xs' | 'sm';
}> = ({ name, dmg = 'AD', classTag = '', size = 'sm' }) => {
  const h = hashString(name || 'CH');
  const accent =
    dmg === 'AP' ? '#38BDF8' : dmg === 'AD' ? '#F59E0B' : dmg === 'MIX' ? '#A855F7' : '#10B981';
  const dim = size === 'xs' ? 'w-6 h-6 text-[9px]' : 'w-7 h-7 text-[10px]';
  const initials = (name || 'CH')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={`${dim} shrink-0 rounded-md font-display font-extrabold flex items-center justify-center border select-none`}
      style={{
        background: `linear-gradient(135deg, ${accent}33 0%, #0B0E14 100%)`,
        borderColor: `${accent}66`,
        color: '#F8FAFC',
        boxShadow: h % 2 === 0 ? `inset 0 0 0 1px ${accent}22` : undefined,
      }}
      title={`${name}${classTag ? ` · ${classTag}` : ''}`}
    >
      {initials || name.slice(0, 2).toUpperCase()}
    </div>
  );
};

export const OvrValue: React.FC<{ ovr: number; size?: 'sm' | 'md' | 'lg' }> = ({ ovr, size = 'md' }) => {
  const colorCls =
    ovr >= 90
      ? 'text-[#E4BD67]'
      : ovr >= 84
      ? 'text-emerald-400'
      : ovr >= 76
      ? 'text-sky-400'
      : 'text-slate-300';
  const sizeCls = size === 'lg' ? 'text-2xl font-bold' : size === 'sm' ? 'text-xs font-semibold' : 'text-sm font-bold';
  return <span className={`font-mono-num ${colorCls} ${sizeCls}`}>{ovr}</span>;
};

export const SafeImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}> = ({ src, alt, className = '', fallbackLabel }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#121722] via-[#171E2C] to-[#0B0E14] text-slate-500 ${className}`}
      >
        <Shield className="w-7 h-7 text-[#C89B3C]/60 mb-1.5" />
        {fallbackLabel && <span className="text-xs font-medium text-slate-400">{fallbackLabel}</span>}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export const RadarChart: React.FC<{
  attrs: {
    mechanics: number;
    laning: number;
    macro: number;
    teamfight: number;
    clutch: number;
    pool: number;
  };
  size?: number;
}> = ({ attrs, size = 210 }) => {
  const axes = [
    { key: 'mechanics', label: 'Mekanik', val: attrs.mechanics },
    { key: 'laning', label: 'Koridor', val: attrs.laning },
    { key: 'macro', label: 'Makro', val: attrs.macro },
    { key: 'teamfight', label: 'Savaş', val: attrs.teamfight },
    { key: 'clutch', label: 'Clutch', val: attrs.clutch },
    { key: 'pool', label: 'Havuz', val: attrs.pool },
  ];

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.34;
  const angleStep = (Math.PI * 2) / axes.length;

  const getPoint = (idx: number, pct: number) => {
    const angle = -Math.PI / 2 + idx * angleStep;
    return {
      x: cx + Math.cos(angle) * radius * pct,
      y: cy + Math.sin(angle) * radius * pct,
    };
  };

  const rings = [0.25, 0.5, 0.75, 1.0];
  const polyPoints = axes
    .map((a, i) => {
      const p = getPoint(i, Math.max(0.15, Math.min(1, a.val / 100)));
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="select-none mx-auto">
      {rings.map((r) => {
        const pts = axes
          .map((_, i) => {
            const p = getPoint(i, r);
            return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
          })
          .join(' ');
        return (
          <polygon
            key={r}
            points={pts}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        );
      })}
      {axes.map((_, i) => {
        const p = getPoint(i, 1);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        );
      })}
      <polygon
        points={polyPoints}
        fill="rgba(200, 155, 60, 0.22)"
        stroke="#E4BD67"
        strokeWidth="1.75"
      />
      {axes.map((a, i) => {
        const p = getPoint(i, Math.max(0.15, Math.min(1, a.val / 100)));
        const lp = getPoint(i, 1.24);
        return (
          <g key={a.key}>
            <circle cx={p.x} cy={p.y} r="3" fill="#E4BD67" />
            <text
              x={lp.x}
              y={lp.y - 3}
              textAnchor="middle"
              fill="#94A3B8"
              fontSize="10"
              fontWeight="600"
            >
              {a.label}
            </text>
            <text
              x={lp.x}
              y={lp.y + 9}
              textAnchor="middle"
              fill="#E6ECF5"
              fontSize="10.5"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
            >
              {a.val}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export const GoldDiffChart: React.FC<{
  history: number[];
  blueTag: string;
  redTag: string;
  height?: number;
}> = ({ history, blueTag, redTag, height = 116 }) => {
  const data = history && history.length > 1 ? history : [0, 0];
  const width = 460;
  const padX = 28;
  const padY = 16;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const midY = padY + innerH / 2;

  const maxAbs = Math.max(2500, ...data.map((v) => Math.abs(v)));
  const getX = (i: number) => padX + (i / Math.max(1, data.length - 1)) * innerW;
  const getY = (v: number) => midY - (v / maxAbs) * (innerH / 2);

  const linePath = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(v).toFixed(1)}`).join(' ');
  const lastVal = data[data.length - 1] || 0;
  const areaPath = `${linePath} L ${getX(data.length - 1).toFixed(1)} ${midY} L ${padX} ${midY} Z`;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
        <span className="font-medium text-sky-400">{blueTag} Üstünlüğü</span>
        <span className="font-mono-num text-slate-200 font-semibold">
          {lastVal >= 0 ? `${blueTag} +${(lastVal / 1000).toFixed(1)}k` : `${redTag} +${(Math.abs(lastVal) / 1000).toFixed(1)}k`}
        </span>
        <span className="font-medium text-rose-400">{redTag} Üstünlüğü</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto block">
        <line x1={padX} y1={midY} x2={width - padX} y2={midY} stroke="rgba(255,255,255,0.16)" strokeDasharray="3 3" />
        <line x1={padX} y1={padY} x2={width - padX} y2={padY} stroke="rgba(255,255,255,0.05)" />
        <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="rgba(255,255,255,0.05)" />
        <path
          d={areaPath}
          fill={lastVal >= 0 ? 'rgba(56, 189, 248, 0.16)' : 'rgba(244, 63, 94, 0.16)'}
        />
        <path
          d={linePath}
          fill="none"
          stroke={lastVal >= 0 ? '#38BDF8' : '#FB7185'}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle
          cx={getX(data.length - 1)}
          cy={getY(lastVal)}
          r="3.5"
          fill={lastVal >= 0 ? '#38BDF8' : '#FB7185'}
        />
        <text x={4} y={padY + 4} fontSize="9" fill="#64748B" fontFamily="JetBrains Mono, monospace">
          +{(maxAbs / 1000).toFixed(0)}k
        </text>
        <text x={4} y={height - padY + 3} fontSize="9" fill="#64748B" fontFamily="JetBrains Mono, monospace">
          -{(maxAbs / 1000).toFixed(0)}k
        </text>
      </svg>
    </div>
  );
};

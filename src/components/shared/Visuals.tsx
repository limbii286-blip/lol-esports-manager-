import React, { useState } from 'react';
import { Shield } from 'lucide-react';

export const TeamCrest: React.FC<{
  tag: string;
  color: string;
  color2?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}> = ({ tag, color, color2 = '#ffffff', size = 'md' }) => {
  const dims =
    size === 'xs'
      ? 'w-6 h-6 text-[10px]'
      : size === 'sm'
      ? 'w-8 h-8 text-xs'
      : size === 'lg'
      ? 'w-12 h-12 text-base'
      : 'w-9 h-9 text-xs';

  return (
    <div
      className={`${dims} shrink-0 rounded-md font-display font-bold tracking-wider flex items-center justify-center border border-white/15 select-none`}
      style={{
        background: `linear-gradient(145deg, ${color} 0%, ${color}cc 100%)`,
        color: color2,
      }}
      title={tag}
    >
      {tag.slice(0, 4)}
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

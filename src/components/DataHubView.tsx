import React, { useMemo, useState } from 'react';
import { BarChart3, Award, Cpu } from 'lucide-react';
import { REGIONS } from '../data/teamsAndPlayers.js';
import { CHAMPIONS, getChampionMetaTier } from '../data/champions.js';
import {
  getCurrentPatch,
  getTeamRoster,
  getTeamOVR,
  getTeamWeeklyWages,
  getLeagueStatLeaders,
  formatMoney,
} from '../engine/gameEngine.js';
import { computeDataHubMetrics } from '../engine/fmExtensions';
import { OvrValue } from './shared/Visuals';

interface DataHubViewProps {
  state: any;
  userTeam: any;
  onSelectPlayer: (playerId: string) => void;
}

export const DataHubView: React.FC<DataHubViewProps> = ({ state, userTeam, onSelectPlayer }) => {
  const [regionId, setRegionId] = useState<string>(userTeam.region);
  const patch = useMemo(() => getCurrentPatch(state), [state]);

  const teamRows = useMemo(
    () => computeDataHubMetrics(state, regionId, getTeamRoster, getTeamOVR, getTeamWeeklyWages),
    [state, regionId]
  );

  const leaders = useMemo(() => getLeagueStatLeaders(state, regionId), [state, regionId]);
  const sTierChamps = useMemo(
    () => CHAMPIONS.filter((c: any) => getChampionMetaTier(c, patch) === 'S').slice(0, 12),
    [patch]
  );

  // Scatter plot bounds
  const minVal = 55;
  const maxVal = 96;
  const mapX = (v: number) => 46 + ((Math.max(minVal, Math.min(maxVal, v)) - minVal) / (maxVal - minVal)) * 370;
  const mapY = (v: number) => 245 - ((Math.max(minVal, Math.min(maxVal, v)) - minVal) / (maxVal - minVal)) * 205;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="text-xs text-[#E4BD67] font-semibold">
            FM Veri Merkezi (Data Hub) · Yama {patch.version} Analizi
          </div>
          <h1 className="font-display text-3xl font-extrabold text-white tracking-wide mt-0.5">
            Analitik, Güç Matrisi ve Meta İstihbaratı
          </h1>
        </div>
        <div className="flex items-center gap-1 p-1 bg-[#121722] border border-white/[0.08] rounded-lg overflow-x-auto">
          {REGIONS.map((r: any) => (
            <button
              key={r.id}
              onClick={() => setRegionId(r.id)}
              className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer whitespace-nowrap ${
                regionId === r.id ? 'bg-[#C89B3C] text-[#0B0E14]' : 'text-slate-400 hover:text-white'
              }`}
            >
              {r.id}
            </button>
          ))}
        </div>
      </div>

      {/* Top 2-Col: Quadrant Scatter Plot + Patch Meta Intel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Scatter Quadrant Chart */}
        <div className="lg:col-span-7 bg-[#121722] border border-white/[0.08] rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#E4BD67]" />
                {regionId} Takım Profili: Erken Oyun vs Geç Oyun Gücü
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sağ üst bölge hem erken baskıda hem geç takım savaşında elit kulüpleri gösterir.
              </p>
            </div>
          </div>

          <svg viewBox="0 0 460 280" className="w-full h-auto block select-none">
            {/* Axes & Midlines */}
            <rect x="46" y="40" width="370" height="205" fill="#0B0E14" stroke="rgba(255,255,255,0.08)" />
            <line x1="231" y1="40" x2="231" y2="245" stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
            <line x1="46" y1="142" x2="416" y2="142" stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />

            {/* Quadrant Labels */}
            <text x="54" y="55" fontSize="9.5" fill="#64748B">Geç Oyun Odaklı</text>
            <text x="336" y="55" fontSize="9.5" fill="#E4BD67">Şampiyonluk Eliti</text>
            <text x="54" y="236" fontSize="9.5" fill="#64748B">Gelişim Aşaması</text>
            <text x="332" y="236" fontSize="9.5" fill="#64748B">Erken Baskı</text>

            {/* Team Dots */}
            {teamRows.map((row) => {
              const cx = mapX(row.earlyIndex);
              const cy = mapY(row.lateIndex);
              return (
                <g key={row.teamId}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={row.isUser ? 7.5 : 5.5}
                    fill={row.isUser ? '#E4BD67' : row.color}
                    stroke={row.isUser ? '#FFFFFF' : '#0B0E14'}
                    strokeWidth={row.isUser ? 2 : 1.5}
                  />
                  <text
                    x={cx}
                    y={cy - 10}
                    textAnchor="middle"
                    fontSize={row.isUser ? '10.5' : '9.5'}
                    fontWeight={row.isUser ? '800' : '600'}
                    fill={row.isUser ? '#E4BD67' : '#CBD5E1'}
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {row.tag}
                  </text>
                </g>
              );
            })}

            {/* Axis Titles */}
            <text x="231" y="268" textAnchor="middle" fontSize="10" fill="#94A3B8">
              Erken Oyun Endeksi (Laning + Mekanik) →
            </text>
            <text
              x="16"
              y="142"
              textAnchor="middle"
              fontSize="10"
              fill="#94A3B8"
              transform="rotate(-90 16 142)"
            >
              Geç Oyun Endeksi (Savaş + Makro) →
            </text>
          </svg>
        </div>

        {/* Current Patch Meta Panel */}
        <div className="lg:col-span-5 bg-[#121722] border border-white/[0.08] rounded-lg p-5 space-y-4">
          <div className="border-b border-white/[0.08] pb-3">
            <div className="text-xs text-[#E4BD67] font-semibold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> Aktif Yama {patch.version}
            </div>
            <h3 className="font-display text-2xl font-bold text-white mt-0.5">{patch.name}</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{patch.desc}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center font-mono-num text-xs border-b border-white/[0.06] pb-3">
            <div>
              <div className="text-slate-500">Erken Ağırlık</div>
              <div className="text-sm font-bold text-white">{patch.earlyWeight.toFixed(2)}x</div>
            </div>
            <div>
              <div className="text-slate-500">Orta Ağırlık</div>
              <div className="text-sm font-bold text-white">{patch.midWeight.toFixed(2)}x</div>
            </div>
            <div>
              <div className="text-slate-500">Geç Ağırlık</div>
              <div className="text-sm font-bold text-white">{patch.lateWeight.toFixed(2)}x</div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-emerald-400 font-semibold">Güçlenen Sınıflar: </span>
              <span className="text-slate-300">{patch.buffedClasses.join(' · ') || 'Dengeli'}</span>
            </div>
            <div>
              <span className="text-rose-400 font-semibold">Zayıflayan Sınıflar: </span>
              <span className="text-slate-300">{patch.nerfedClasses.join(' · ') || 'Yok'}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.06]">
            <div className="text-[11px] font-semibold text-slate-400 mb-2">Yamanın S-Tier Meta Şampiyonları</div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-200">
              {sTierChamps.map((c: any) => (
                <span key={c.id} className="font-medium">
                  {c.name} <span className="text-slate-500 font-mono-num text-[10px]">({c.roles[0]})</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 2-Col: Team Efficiency Table + Individual Stat Leaders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[#121722] border border-white/[0.08] rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.08] text-sm font-bold text-white">
            {regionId} Kulüp Verimlilik & Maliyet Karşılaştırması
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#0B0E14]/70 text-[11px] text-slate-400">
                  <th className="py-2.5 px-4">Kulüp</th>
                  <th className="py-2.5 px-3 text-right">OVR</th>
                  <th className="py-2.5 px-3 text-right">Yaş Ort.</th>
                  <th className="py-2.5 px-3 text-right">Sinerji</th>
                  <th className="py-2.5 px-3 text-right">G-M</th>
                  <th className="py-2.5 px-4 text-right">Haftalık Maaş</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {teamRows
                  .slice()
                  .sort((a, b) => b.ovr - a.ovr)
                  .map((r) => (
                    <tr key={r.teamId} className={r.isUser ? 'bg-[#C89B3C]/10' : 'hover:bg-white/[0.02]'}>
                      <td className="py-2.5 px-4 font-bold text-white">
                        {r.name} <span className="text-slate-500 font-mono-num">({r.tag})</span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <OvrValue ovr={r.ovr} />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-num text-slate-300">{r.avgAge}</td>
                      <td className="py-2.5 px-3 text-right font-mono-num text-slate-300">{r.synergy}</td>
                      <td className="py-2.5 px-3 text-right font-mono-num text-slate-200">
                        {r.wins}-{r.losses}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono-num text-slate-300">
                        {formatMoney(r.weeklyWage)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stat Leaders */}
        <div className="lg:col-span-5 bg-[#121722] border border-white/[0.08] rounded-lg p-5 space-y-4">
          <div className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/[0.08] pb-3">
            <Award className="w-4 h-4 text-[#E4BD67]" />
            {regionId} Sezon İstatistik Liderleri
          </div>

          {!leaders || (leaders.byKda?.length === 0 && leaders.byMvp?.length === 0) ? (
            <div className="text-xs text-slate-400 py-6 text-center">
              Sezon maçları oynandıkça KDA ve MVP liderlik tabloları burada oluşacaktır.
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div>
                <div className="text-[11px] font-semibold text-slate-400 mb-2">En Yüksek KDA</div>
                <div className="divide-y divide-white/[0.06]">
                  {(leaders.byKda || []).slice(0, 5).map((item: any, idx: number) => (
                    <div key={item.id} className="py-2 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onSelectPlayer(item.id)}
                        className="text-left hover:text-[#E4BD67] cursor-pointer truncate"
                      >
                        <span className="font-mono-num text-slate-500 mr-2">{idx + 1}.</span>
                        <strong className="text-white">{item.name}</strong>{' '}
                        <span className="text-slate-500">({item.teamTag} · {item.role})</span>
                      </button>
                      <span className="font-mono-num font-bold text-[#E4BD67]">{item.kda.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.08]">
                <div className="text-[11px] font-semibold text-slate-400 mb-2">MVP Yarışı</div>
                <div className="divide-y divide-white/[0.06]">
                  {(leaders.byMvp || []).slice(0, 5).map((item: any, idx: number) => (
                    <div key={item.id} className="py-2 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onSelectPlayer(item.id)}
                        className="text-left hover:text-[#E4BD67] cursor-pointer truncate"
                      >
                        <span className="font-mono-num text-slate-500 mr-2">{idx + 1}.</span>
                        <strong className="text-white">{item.name}</strong>{' '}
                        <span className="text-slate-500">({item.teamTag})</span>
                      </button>
                      <span className="font-mono-num font-bold text-emerald-400">{item.stats?.mvps || 0} MVP</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hall of Fame & Career Records Showcase */}
      <div className="bg-[#121722] border border-white/[0.08] rounded-lg p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-[#E4BD67]" />
            Kariyer Rekorları & Hall of Fame (Şöhretler Müzesi)
          </div>
          <div className="font-mono-num text-xs text-slate-400">
            Kariyer: <strong className="text-emerald-400">{state.records?.careerWins || 0}G</strong> –{' '}
            <strong className="text-rose-400">{state.records?.careerLosses || 0}M</strong> · En İyi Seri:{' '}
            <strong className="text-[#E4BD67]">{state.records?.bestStreak || 0}</strong>
          </div>
        </div>
        {(state.records?.hallOfFame || []).length === 0 ? (
          <div className="text-xs text-slate-400 py-3">
            Worlds Finalleri MVP'leri ve kupa efsaneleri sezonlar ilerledikçe Hall of Fame vitrinine eklenecek.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {(state.records.hallOfFame || []).slice(0, 8).map((h: any, idx: number) => (
              <div key={idx} className="p-3 rounded-md bg-[#0B0E14] border border-white/[0.08] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{h.name}</span>
                  <span className="font-mono-num text-[#E4BD67] font-bold">{h.titles}× Kupa</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono-num">
                  {h.role} · {h.tag} · {h.lastSeason}
                </div>
                <div className="text-[11px] text-slate-500">{h.note}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { Trophy, CalendarDays, Globe } from 'lucide-react';
import { REGIONS } from '../data/teamsAndPlayers.js';
import { getSortedStandings, getPhaseLabel, getTeamOVR } from '../engine/gameEngine.js';
import { MEDIA_ASSETS } from '../assets/media';
import { SafeImage, TeamCrest, OvrValue } from './shared/Visuals';

interface LeagueViewProps {
  state: any;
  userTeam: any;
}

export const LeagueView: React.FC<LeagueViewProps> = ({ state, userTeam }) => {
  const [selectedRegion, setSelectedRegion] = useState<string>(userTeam.region);
  const [subView, setSubView] = useState<'standings' | 'tournament' | 'trophies'>('standings');

  const standings = useMemo(() => getSortedStandings(state, selectedRegion), [state, selectedRegion]);
  const schedule = state.schedules?.[selectedRegion] || [];
  const currentWeekMatches = useMemo(() => {
    const wkIdx = Math.max(0, (state.week || 1) - 1);
    return Array.isArray(schedule[wkIdx]) ? schedule[wkIdx] : [];
  }, [schedule, state.week]);

  const getTeam = (id: string) => state.teams.find((t: any) => t.id === id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="text-xs text-[#E4BD67] font-semibold">
            Sezon {state.season} · {getPhaseLabel(state.phase)} (Hafta {state.week})
          </div>
          <h1 className="font-display text-3xl font-extrabold text-white tracking-wide mt-0.5">
            Ligler, Fikstür ve Uluslararası Turnuvalar
          </h1>
        </div>
        <div className="flex items-center gap-1 p-1 bg-[#121722] border border-white/[0.08] rounded-lg w-fit">
          {[
            { id: 'standings', label: 'Bölgesel Ligler', icon: Globe },
            { id: 'tournament', label: 'Playoff / MSI / Worlds', icon: CalendarDays },
            { id: 'trophies', label: 'Müze & Arşiv', icon: Trophy },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSubView(t.id as any)}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                subView === t.id ? 'bg-[#C89B3C] text-[#0B0E14]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: REGIONAL STANDINGS & FIXTURES */}
      {subView === 'standings' && (
        <div className="space-y-5">
          <div className="flex items-center gap-1 p-1 bg-[#121722] border border-white/[0.08] rounded-lg w-fit overflow-x-auto">
            {REGIONS.map((r: any) => (
              <button
                key={r.id}
                onClick={() => setSelectedRegion(r.id)}
                className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  selectedRegion === r.id ? 'bg-[#C89B3C] text-[#0B0E14]' : 'text-slate-400 hover:text-white'
                }`}
              >
                {r.id}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 bg-[#121722] border border-white/[0.08] rounded-lg overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/[0.08] text-sm font-bold text-white">
                {selectedRegion} Puan Durumu
              </div>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-[#0B0E14]/60 text-[11px] text-slate-400">
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-3">Kulüp</th>
                    <th className="py-2.5 px-3 text-right">OVR</th>
                    <th className="py-2.5 px-3 text-right">G</th>
                    <th className="py-2.5 px-3 text-right">M</th>
                    <th className="py-2.5 px-4 text-right">Averaj</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {standings.map((row: any, idx: number) => {
                    const t = getTeam(row.teamId);
                    if (!t) return null;
                    const isMe = t.id === userTeam.id;
                    const diff = (row.gameWins || 0) - (row.gameLosses || 0);
                    return (
                      <tr key={t.id} className={isMe ? 'bg-[#C89B3C]/12' : 'hover:bg-white/[0.02]'}>
                        <td className="py-2.5 px-4 font-mono-num text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <TeamCrest tag={t.tag} color={t.color} color2={t.color2} size="xs" />
                            <span className={`font-bold ${isMe ? 'text-[#E4BD67]' : 'text-white'}`}>
                              {t.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <OvrValue ovr={getTeamOVR(state, t.id)} size="sm" />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-num font-bold text-emerald-400">
                          {row.wins}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-num text-slate-300">{row.losses}</td>
                        <td className="py-2.5 px-4 text-right font-mono-num text-slate-300">
                          {diff >= 0 ? `+${diff}` : diff}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="lg:col-span-5 bg-[#121722] border border-white/[0.08] rounded-lg p-5 space-y-3">
              <div className="text-sm font-bold text-white border-b border-white/[0.08] pb-3">
                {selectedRegion} Hafta {state.week} Fikstürü
              </div>
              {currentWeekMatches.length === 0 ? (
                <div className="text-xs text-slate-400 py-6 text-center">
                  Bu hafta için normal sezon fikstürü bulunmuyor.
                </div>
              ) : (
                <div className="divide-y divide-white/[0.06] text-xs">
                  {currentWeekMatches.map((m: any, idx: number) => {
                    const b = getTeam(m.blueId);
                    const r = getTeam(m.redId);
                    return (
                      <div key={idx} className="py-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {b && <TeamCrest tag={b.tag} color={b.color} color2={b.color2} size="xs" />}
                          <span className="font-semibold text-white truncate">{b?.tag || m.blueId}</span>
                        </div>
                        <div className="font-mono-num font-bold text-[#E4BD67] px-2 shrink-0">
                          {m.played ? `${m.blueScore} - ${m.redScore}` : `BO${m.bestOf || m.bo || 3}`}
                        </div>
                        <div className="flex items-center justify-end gap-2 flex-1 min-w-0">
                          <span className="font-semibold text-white truncate">{r?.tag || m.redId}</span>
                          {r && <TeamCrest tag={r.tag} color={r.color} color2={r.color2} size="xs" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE BRACKET / SWISS */}
      {subView === 'tournament' && (
        <div className="space-y-5">
          {state.swiss ? (
            <div className="bg-[#121722] border border-white/[0.08] rounded-lg p-5 space-y-4">
              <div className="text-sm font-bold text-[#E4BD67]">
                Worlds {state.season} Swiss Aşaması · Tur {state.swiss.round}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {[...(state.swiss.teams || [])]
                  .sort((a: any, b: any) => (b.wins - a.wins) || (a.losses - b.losses))
                  .map((rec: any) => {
                    const t = getTeam(rec.teamId);
                    const statusColor =
                      rec.status === 'QUALIFIED'
                        ? 'text-emerald-400'
                        : rec.status === 'ELIMINATED'
                        ? 'text-rose-400'
                        : 'text-[#E4BD67]';
                    return (
                      <div
                        key={rec.teamId}
                        className="p-3 rounded-md bg-[#0B0E14] border border-white/[0.08] flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {t && <TeamCrest tag={t.tag} color={t.color} color2={t.color2} size="xs" />}
                          <span className="font-bold text-white truncate">{t?.tag || rec.teamId}</span>
                        </div>
                        <span className={`font-mono-num font-bold shrink-0 ${statusColor}`}>
                          {rec.wins}G - {rec.losses}M
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : state.bracket ? (
            <div className="bg-[#121722] border border-white/[0.08] rounded-lg p-5 space-y-5">
              <div className="text-sm font-bold text-[#E4BD67]">
                {state.bracket.title || `Aktif Eleme Tablosu · ${getPhaseLabel(state.phase)}`}
              </div>
              <div className="space-y-4">
                {(state.bracket.rounds || []).map((round: any, rIdx: number) => (
                  <div key={rIdx} className="space-y-2">
                    <div className="text-[11px] font-semibold text-slate-400">
                      {round.name || `Tur ${rIdx + 1}`}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {(round.matches || []).map((m: any, idx: number) => {
                        const b = getTeam(m.blueId);
                        const r = getTeam(m.redId);
                        return (
                          <div
                            key={m.id || idx}
                            className="p-3.5 rounded-md bg-[#0B0E14] border border-white/[0.08] flex items-center justify-between gap-2"
                          >
                            <span className="font-bold text-white truncate">{b?.name || m.blueId || 'TBD'}</span>
                            <span className="font-mono-num text-[#E4BD67] font-bold shrink-0">
                              {m.played ? `${m.blueScore} - ${m.redScore}` : `BO${m.bestOf || m.bo || 5}`}
                            </span>
                            <span className="font-bold text-white truncate text-right">{r?.name || m.redId || 'TBD'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-[#121722] border border-white/[0.08] rounded-lg p-8 text-center text-xs text-slate-400">
              Şu anda normal sezon aşamasındasın. Playoff, MSI veya Worlds başladığında tüm eleme tabloları burada canlı olarak görüntülenecek.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TROPHY CABINET & ARCHIVE */}
      {subView === 'trophies' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 bg-[#121722] border border-white/[0.08] rounded-lg overflow-hidden">
            <SafeImage
              src={MEDIA_ASSETS.worldsTrophy}
              alt="Worlds Championship Trophy"
              className="w-full aspect-square object-cover"
              fallbackLabel="Championship Trophy"
            />
            <div className="p-5 space-y-1.5">
              <div className="text-xs text-[#E4BD67] font-semibold">Kulüp Kupa Müzesi</div>
              <div className="font-display text-2xl font-bold text-white">
                {userTeam.trophies?.length || 0} Resmi Kupa
              </div>
              <p className="text-xs text-slate-400">
                Bölgesel şampiyonluklar, MSI ve Worlds kupaları kulübün prestijini kalıcı olarak yükseltir.
              </p>
            </div>
          </div>

          <div className="lg:col-span-8 bg-[#121722] border border-white/[0.08] rounded-lg p-5 space-y-4">
            <div className="text-sm font-bold text-white border-b border-white/[0.08] pb-3">
              Turnuva Arşivi ve Tarihçe
            </div>
            {(state.history || []).length === 0 ? (
              <div className="text-xs text-slate-400 py-8 text-center">
                Sezon tamamlandıkça kupa kazananları ve ödüller burada arşivlenecektir.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06] text-xs">
                {state.history.map((h: any, i: number) => (
                  <div key={i} className="py-3 flex items-center justify-between gap-3">
                    <span className="font-bold text-white">{h.title || h.event}</span>
                    <span className="font-mono-num text-[#E4BD67]">{h.winnerName || h.result}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

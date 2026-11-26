import React, { useMemo } from 'react';
import { Users, RefreshCw, Sparkles, UserCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ROLES, TRAITS } from '../data/teamsAndPlayers.js';
import {
  getTeamRoster,
  getTeamOVR,
  computeTeamChemistry,
  getSquadDynamics,
  getTeamDuoSynergy,
  getTeamWeeklyWages,
  getTeamWageCap,
  getAgeFatigueProfile,
  formatMoney,
  setStarter,
  renewAllExpiringContracts,
} from '../engine/gameEngine.js';
import { OvrValue } from './shared/Visuals';
import { soundFx } from '../engine/soundFx';

interface SquadViewProps {
  state: any;
  userTeam: any;
  onSelectPlayer: (playerId: string) => void;
  onUpdate: (msg?: string) => void;
}

export const SquadView: React.FC<SquadViewProps> = ({
  state,
  userTeam,
  onSelectPlayer,
  onUpdate,
}) => {
  const allClubPlayers = useMemo(
    () =>
      state.players
        .filter((p: any) => p.teamId === userTeam.id)
        .sort((a: any, b: any) => (b.isStarter ? 1 : 0) - (a.isStarter ? 1 : 0) || ROLES.indexOf(a.role) - ROLES.indexOf(b.role) || b.ovr - a.ovr),
    [state, userTeam.id]
  );
  const roster = useMemo(() => getTeamRoster(state, userTeam.id), [state, userTeam.id]);
  const teamOvr = useMemo(() => getTeamOVR(state, userTeam.id), [state, userTeam.id]);
  const chem = useMemo(() => computeTeamChemistry(userTeam, roster), [userTeam, roster]);
  const dynamics = useMemo(() => getSquadDynamics(state), [state]);
  const duoSynergy = useMemo(() => getTeamDuoSynergy(userTeam, roster), [userTeam, roster]);
  const weeklyWages = useMemo(() => getTeamWeeklyWages(state, userTeam.id), [state, userTeam.id]);
  const wageCap = useMemo(() => getTeamWageCap(userTeam), [userTeam]);

  const isPlayerMode = state.careerMode === 'PLAYER';
  const expiringCount = allClubPlayers.filter((p: any) => (p.contractYears || 0) <= 1).length;

  const handleBulkRenew = () => {
    soundFx.draftLock();
    const res = renewAllExpiringContracts(state);
    onUpdate(res.reason);
  };

  const handleToggleStarter = (playerId: string, name: string) => {
    soundFx.click();
    setStarter(state, playerId);
    onUpdate(`${name} ilk 5 kadrosuna atandı.`);
  };

  return (
    <div className="space-y-6">
      {/* Header Summary Strip */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="text-xs text-[#E4BD67] font-semibold">Kadro Planlayıcı & Soyunma Odası Dinamikleri</div>
          <h1 className="font-display text-3xl font-extrabold text-white tracking-wide mt-0.5">
            {userTeam.name} A Takım Kadrosu
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-6 font-mono-num text-xs">
          <div>
            <div className="text-slate-500">Takım OVR</div>
            <OvrValue ovr={teamOvr} size="lg" />
          </div>
          <div>
            <div className="text-slate-500">Haftalık Maaş / Limit</div>
            <div className="text-sm font-bold text-white mt-0.5">
              {formatMoney(weeklyWages)}{' '}
              <span className="text-slate-500">/ {formatMoney(wageCap)}</span>
            </div>
          </div>
          {!isPlayerMode && expiringCount > 0 && (
            <button
              onClick={handleBulkRenew}
              className="px-3.5 py-2 rounded-md bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Biten Sözleşmeleri Yenile ({expiringCount})
            </button>
          )}
        </div>
      </div>

      {/* High-Density FM Roster Table */}
      <div className="bg-[#121722] border border-white/[0.08] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#0B0E14]/70 text-[11px] font-semibold text-slate-400">
                <th className="py-3 px-4">Rol</th>
                <th className="py-3 px-3">Oyuncu</th>
                <th className="py-3 px-3 text-right">Yaş</th>
                <th className="py-3 px-3 text-right">OVR</th>
                <th className="py-3 px-3 text-right">POT</th>
                <th className="py-3 px-3">Stil / Karakter</th>
                <th className="py-3 px-3 text-right">Form</th>
                <th className="py-3 px-3 text-right">Moral</th>
                <th className="py-3 px-3 text-right">Yorg.</th>
                <th className="py-3 px-3 text-right">Değer</th>
                <th className="py-3 px-3 text-right">Maaş</th>
                <th className="py-3 px-3 text-right">Sözl.</th>
                <th className="py-3 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-xs">
              {allClubPlayers.map((p: any) => {
                const traitLabel =
                  (TRAITS as Record<string, { label: string }>)[p.trait]?.label || p.trait || 'Standart';
                const teamGames = Math.floor(p.teamGames ?? 20);
                const ageProf = getAgeFatigueProfile(p.age);
                const fatVal = Math.round(p.fatigue || 0);
                const fatDanger = fatVal >= ageProf.injuryThreshold - 8;
                const fatWarn = !fatDanger && fatVal >= ageProf.perfThreshold;
                const formVal = Math.round(p.form ?? 75);
                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelectPlayer(p.id)}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono-num">
                      <span className={p.isStarter ? 'text-[#E4BD67] font-bold' : 'text-slate-500'}>
                        {p.role}
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        {p.loanedTo ? 'Kiralık' : p.isStarter ? 'İlk 5' : 'Yedek'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{p.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono-num">
                        {p.nat} · {teamGames} maç uyum
                        {p.loanedTo && (
                          <span className="text-sky-400">
                            {' '}
                            · {p.loanedTo.leagueName} ({p.loanedTo.gamesPlayed} maç · +{p.loanedTo.growthGained} glş.)
                          </span>
                        )}
                        {(p.importWeeksLeft || 0) > 0 && (
                          <span className="text-amber-400"> · Dil adaptasyonu ({p.importWeeksLeft}h)</span>
                        )}
                        {(p.injuredWeeks || 0) > 0 && (
                          <span className="text-rose-400"> · Sakat ({p.injuredWeeks}h)</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num">
                      <div className={p.age >= 28 ? 'text-amber-300' : 'text-slate-300'}>{p.age}</div>
                      <div className="text-[10px] text-slate-500">×{ageProf.gainMult.toFixed(1)}</div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <OvrValue ovr={p.ovr} />
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num text-slate-400">{p.pot}</td>
                    <td className="py-3 px-3 text-slate-300">
                      {p.style} <span className="text-slate-500">· {traitLabel}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num">
                      <span
                        className={
                          formVal >= 84 ? 'text-emerald-400 font-semibold' : formVal <= 65 ? 'text-rose-400' : 'text-slate-200'
                        }
                      >
                        %{formVal}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num">
                      <span
                        className={
                          p.morale >= 75 ? 'text-emerald-400' : p.morale >= 55 ? 'text-amber-400' : 'text-rose-400'
                        }
                      >
                        {Math.round(p.morale)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num" title={`Sakatlık risk eşiği: %${ageProf.injuryThreshold}`}>
                      <span className={fatDanger ? 'text-rose-400 font-bold' : fatWarn ? 'text-amber-400' : 'text-slate-300'}>
                        {fatVal}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num text-[#E4BD67]">
                      {formatMoney(p.marketValue)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num text-slate-300">
                      {formatMoney(p.salary)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num">
                      <span className={(p.contractYears || 0) <= 1 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                        {p.contractYears}y
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {!isPlayerMode && !p.isStarter && (
                          <button
                            onClick={() => handleToggleStarter(p.id, p.name)}
                            className="px-2.5 py-1 rounded border border-[#C89B3C]/50 text-[#E4BD67] hover:bg-[#C89B3C]/15 text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                          >
                            İlk 5
                          </button>
                        )}
                        <button
                          onClick={() => onSelectPlayer(p.id)}
                          className="px-2.5 py-1 rounded border border-white/[0.12] hover:border-white/[0.28] text-slate-200 text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                        >
                          Profil
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom 2-Col FM Squad Dynamics & Positional Depth Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Squad Dynamics & Duo Chemistry */}
        <div className="lg:col-span-6 bg-[#121722] border border-white/[0.08] rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#E4BD67]" />
              Soyunma Odası Dinamikleri & İkili Sinerji
            </span>
            <span className="font-mono-num text-xs text-emerald-400 font-semibold">
              Atmosfer: %{dynamics?.atmosphere ?? 78} · Destek %{dynamics?.managerSupport ?? 80}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-b border-white/[0.06] pb-4 font-mono-num">
            <div>
              <div className="text-slate-500">Takım Kimyası</div>
              <div
                className={`text-lg font-bold mt-0.5 ${
                  chem.chemIndex >= 72 ? 'text-emerald-400' : chem.chemIndex >= 52 ? 'text-[#E4BD67]' : 'text-rose-400'
                }`}
              >
                {chem.chemIndex}/100
              </div>
            </div>
            <div>
              <div className="text-slate-500">Maç İçi Etki</div>
              <div
                className={`text-lg font-bold mt-0.5 ${
                  chem.totalImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {chem.totalImpact >= 0 ? `+${chem.totalImpact}` : chem.totalImpact}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Birlikte Oynama</div>
              <div className="text-lg font-bold text-white mt-0.5">{chem.avgTeamGames} maç</div>
            </div>
            <div>
              <div className="text-slate-500">Takım Kaptanı</div>
              <div className="text-sm font-bold text-white mt-1 truncate">
                {dynamics?.captain?.name || roster[0]?.name || '—'}
              </div>
            </div>
          </div>

          {/* Chemistry Diagnostic: Superteam Clash, Language, Ego & Cohesion */}
          <div className="space-y-1.5 text-xs border-b border-white/[0.06] pb-4">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono-num">
              <span>Takım Oyunu Teşhisi</span>
              <span>
                Sinerji {Math.round(userTeam.synergy || 68)}/100 · {chem.langCount} dil · {chem.resourceHungryCount} taşıyıcı yıldız
              </span>
            </div>
            {chem.issues.map((iss: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2 text-amber-300/95">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                <span>{iss}</span>
              </div>
            ))}
            {chem.strengths.map((str: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                <span>{str}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-xs">
            <div className="text-[11px] font-semibold text-slate-400">Önemli İkili Bağlar (İlk 5)</div>
            {[
              { title: 'Orman - Orta İkilisi', pair: duoSynergy?.jglMid },
              { title: 'Alt Koridor İkilisi', pair: duoSynergy?.botSup },
            ].map((row, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0"
              >
                <div>
                  <span className="text-slate-200 font-medium">{row.title}:</span>{' '}
                  <span className="text-slate-400">{row.pair?.names || '—'}</span>
                </div>
                <span className="font-mono-num text-[#E4BD67] font-bold">
                  {Math.round(row.pair?.score || 0)}/30 · {row.pair?.label || 'Yeni'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* FM Squad Depth Planner Matrix */}
        <div className="lg:col-span-6 bg-[#121722] border border-white/[0.08] rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#E4BD67]" />
              Mevki Derinlik Matrisi (Squad Planner)
            </span>
            <span className="text-xs text-slate-400">5 Rol Planlaması</span>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {ROLES.map((role: string) => {
              const rolePlayers = allClubPlayers
                .filter((p: any) => p.role === role)
                .sort((a: any, b: any) => (b.isStarter ? 1 : 0) - (a.isStarter ? 1 : 0) || b.ovr - a.ovr);
              const starter = rolePlayers[0];
              const backups = rolePlayers.slice(1);
              return (
                <div key={role} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono-num text-[11px] font-bold text-[#E4BD67] w-8 shrink-0">{role}</span>
                    {starter ? (
                      <button
                        onClick={() => onSelectPlayer(starter.id)}
                        className="text-left hover:underline cursor-pointer min-w-0"
                      >
                        <span className="font-bold text-white">{starter.name}</span>{' '}
                        <span className="font-mono-num text-slate-400">
                          (OVR {starter.ovr} · {starter.contractYears}y)
                        </span>
                      </button>
                    ) : (
                      <span className="text-rose-400 font-semibold">Eksik Mevki</span>
                    )}
                  </div>
                  <div className="text-right text-[11px] text-slate-400 shrink-0">
                    {backups.length > 0 ? (
                      backups.map((b: any) => (
                        <button
                          key={b.id}
                          onClick={() => onSelectPlayer(b.id)}
                          className="ml-2 hover:text-white cursor-pointer font-mono-num"
                        >
                          Yedek: {b.name} ({b.ovr})
                        </button>
                      ))
                    ) : (
                      <span className="text-slate-600 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Yedek yok
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

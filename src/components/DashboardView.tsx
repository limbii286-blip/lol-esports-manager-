import React, { useMemo } from 'react';
import {
  Play,
  FastForward,
  Mic,
  Calendar,
  ChevronRight,
  SkipForward,
  AlertCircle,
  Briefcase,
  Target,
  Mail,
  Crosshair,
  Award,
} from 'lucide-react';
import { getRivalryName } from '../data/teamsAndPlayers.js';
import { CHAMPION_MAP } from '../data/champions.js';
import {
  getPhaseLabel,
  getCurrentPatch,
  getTeamOVR,
  getTeamRoster,
  computeTeamChemistry,
  getSortedStandings,
  getUserNextMatch,
  getBoardConfidence,
  getBoardObjectives,
  getWeekCalendarDays,
  formatTurkishDate,
  formatMoney,
  isMatchDay,
  resolveDramaEvent,
  acceptJobOffer,
  dismissManagerJobOffer,
  getManagerProfile,
  runPlayerWeeklyActivity,
  acceptPlayerTransferOffer,
  playAcademyMatch,
  promoteFromAcademy,
  runPlayerInterview,
  negotiatePlayerContract,
} from '../engine/gameEngine.js';
import { generateOpponentScoutReport } from '../engine/fmExtensions';
import { MEDIA_ASSETS } from '../assets/media';
import { SafeImage, TeamCrest, OvrValue } from './shared/Visuals';
import { NavTab } from '../types/game';
import { soundFx } from '../engine/soundFx';

interface DashboardViewProps {
  state: any;
  userTeam: any;
  onPlayMatch: (match: any) => void;
  onPlayAcademyMatch?: () => void;
  onQuickSimMatch: (match: any) => void;
  onAdvanceDay: () => void;
  onSkipToKeyDay: () => void;
  onAdvanceWeek: () => void;
  onOpenPress: () => void;
  onNavigate: (tab: NavTab) => void;
  onUpdate: (msg?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  userTeam,
  onPlayMatch,
  onPlayAcademyMatch,
  onQuickSimMatch,
  onAdvanceDay,
  onSkipToKeyDay,
  onAdvanceWeek,
  onOpenPress,
  onNavigate,
  onUpdate,
}) => {
  const nextMatch = useMemo(() => getUserNextMatch(state), [state]);
  const patch = useMemo(() => getCurrentPatch(state), [state]);
  const standings = useMemo(() => getSortedStandings(state, userTeam.region), [state, userTeam.region]);
  const boardConf = useMemo(() => getBoardConfidence(state), [state]);
  const objectives = useMemo(() => getBoardObjectives(state), [state]);
  const calDays = useMemo(() => getWeekCalendarDays(state), [state]);
  const matchDayToday = useMemo(() => isMatchDay(state), [state]);
  const userOvr = useMemo(() => getTeamOVR(state, userTeam.id), [state, userTeam.id]);
  const userRoster = useMemo(() => getTeamRoster(state, userTeam.id), [state, userTeam.id]);
  const teamChem = useMemo(() => computeTeamChemistry(userTeam, userRoster), [userTeam, userRoster]);
  const managerProfile = useMemo(() => getManagerProfile(state), [state]);
  const urgentNotifsCount = useMemo(
    () => (state.notifications || []).filter((n: any) => !n.read && n.priority === 'URGENT').length,
    [state]
  );
  const isPlayerMode = state.careerMode === 'PLAYER';
  const userPlayer = useMemo(
    () => (isPlayerMode ? state.players.find((p: any) => p.id === state.userPlayerId) : null),
    [state, isPlayerMode]
  );
  const pc = state.playerCareer;

  const blueTeam = nextMatch ? state.teams.find((t: any) => t.id === nextMatch.blueId) : null;
  const redTeam = nextMatch ? state.teams.find((t: any) => t.id === nextMatch.redId) : null;
  const oppTeam = nextMatch ? (nextMatch.blueId === userTeam.id ? redTeam : blueTeam) : null;
  const rivalry = blueTeam && redTeam ? getRivalryName(blueTeam.id, redTeam.id) : null;

  const scoutReport = useMemo(
    () => (oppTeam ? generateOpponentScoutReport(state, userTeam, oppTeam, getTeamRoster, getTeamOVR) : null),
    [state, userTeam, oppTeam]
  );

  const userRank = standings.findIndex((s: any) => s.teamId === userTeam.id) + 1;
  const pressKey = `${state.season}_${state.phase}_${state.week}`;
  const pressDone = state.pressDoneWeek === pressKey;

  const handleApplyCounterTactic = () => {
    if (!scoutReport) return;
    soundFx.draftLock();
    userTeam.tactics.gameplan = scoutReport.recommendedGameplan;
    userTeam.tactics.laneFocus = scoutReport.recommendedLaneFocus;
    onUpdate(`${scoutReport.oppTeam.tag} için karşı taktik uygulandı (${scoutReport.recommendedLaneFocus} odağı).`);
  };

  const handleDramaChoice = (idx: number) => {
    soundFx.click();
    resolveDramaEvent(state, idx);
    onUpdate('Soyunma odası kararı uygulandı.');
  };

  const handleAcceptJob = (teamId: string) => {
    soundFx.draftLock();
    acceptJobOffer(state, teamId);
    onUpdate('Yeni kulüp teklifi kabul edildi!');
  };

  const handleDismissJob = (teamId: string) => {
    soundFx.click();
    dismissManagerJobOffer(state, teamId);
    onUpdate('Teklif reddedildi.');
  };

  return (
    <div className="space-y-6">
      {/* Executive Club HQ Banner */}
      <div className="relative rounded-lg overflow-hidden border border-white/[0.1] bg-[#121722]">
        <div className="absolute inset-0">
          <SafeImage
            src={MEDIA_ASSETS.coachHq}
            alt="Club War Room"
            className="w-full h-full object-cover opacity-30"
            fallbackLabel="Team War Room"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E14] via-[#0B0E14]/90 to-[#0B0E14]/55" />
        </div>

        <div className="relative p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <TeamCrest tag={userTeam.tag} color={userTeam.color} color2={userTeam.color2} size="lg" />
            <div className="min-w-0">
              <div className="text-xs text-[#E4BD67] font-semibold">
                {userTeam.region} · Sezon {state.season} · {getPhaseLabel(state.phase)} (Hafta {state.week})
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-wide truncate">
                {userTeam.name} Kulüp Merkezi
              </h1>
              <div className="text-xs text-slate-400 font-mono-num mt-0.5">
                {formatTurkishDate(state.currentDate)} · Yama {patch.version} ({patch.name}) · Koç {state.managerName}
              </div>
            </div>
          </div>

          {/* 4 Executive KPI Readouts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 lg:gap-7 font-mono-num shrink-0 border-t lg:border-t-0 lg:border-l border-white/[0.1] pt-4 lg:pt-0 lg:pl-7">
            <div>
              <div className="text-[11px] text-slate-400">OVR / Kimya</div>
              <div className="flex items-baseline gap-2">
                <OvrValue ovr={userOvr} size="lg" />
                <span
                  className={`text-sm font-bold ${
                    teamChem.chemIndex >= 72 ? 'text-emerald-400' : teamChem.chemIndex >= 52 ? 'text-[#E4BD67]' : 'text-rose-400'
                  }`}
                  title="Takım Oyunu & Kimya İndeksi"
                >
                  · {teamChem.chemIndex}
                </span>
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Lig Sırası</div>
              <div className="text-2xl font-bold text-white">#{userRank || '—'}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Yönetim Güveni</div>
              <div
                className={`text-2xl font-bold ${
                  boardConf.score >= 70 ? 'text-emerald-400' : boardConf.score >= 45 ? 'text-[#E4BD67]' : 'text-rose-400'
                }`}
              >
                %{boardConf.score}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Kulüp Bütçesi</div>
              <div className="text-xl font-bold text-[#E4BD67]">{formatMoney(userTeam.budget)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Manager Career Profile Strip or Be a Legend Player Career Panel */}
      {isPlayerMode && userPlayer && pc ? (
        <div className="bg-[#121722] border border-[#C89B3C]/40 rounded-lg p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-3">
            <div>
              <div className="text-xs text-[#E4BD67] font-semibold">
                Efsane Ol · {userPlayer.role} · {userPlayer.age} Yaş · İmza:{' '}
                {(userPlayer.sigChamps || []).map((id: string) => CHAMPION_MAP[id]?.name || id).join(', ')}
              </div>
              <h2 className="font-display text-2xl font-bold text-white mt-0.5">
                {userPlayer.name} — OVR {userPlayer.ovr} (POT {userPlayer.pot})
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-4 font-mono-num text-xs">
              <div>
                <span className="text-slate-400">Koç Güveni:</span>{' '}
                <span className="font-bold text-emerald-400">%{pc.coachTrust}</span>
              </div>
              <div>
                <span className="text-slate-400">SoloQ:</span>{' '}
                <span className="font-bold text-sky-400">{pc.soloqLP} LP</span>
              </div>
              <div>
                <span className="text-slate-400">Şöhret:</span>{' '}
                <span className="font-bold text-[#E4BD67]">{pc.fame}/100</span>
              </div>
              <div>
                <span className="text-slate-400">Yorgunluk:</span>{' '}
                <span className={`font-bold ${userPlayer.fatigue >= 60 ? 'text-rose-400' : 'text-white'}`}>
                  %{Math.round(userPlayer.fatigue || 0)}
                </span>
              </div>
              <div className="px-2.5 py-1 rounded bg-[#171E2C] border border-[#C89B3C]/50 text-[#E4BD67] font-bold">
                Gelişim Puanı: {pc.skillPoints || 0}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Attributes + Skill Points */}
            <div className="lg:col-span-6 grid grid-cols-3 sm:grid-cols-6 gap-2 text-center font-mono-num">
              {[
                { key: 'laning', label: 'Koridor' },
                { key: 'mechanics', label: 'Mekanik' },
                { key: 'macro', label: 'Makro' },
                { key: 'teamfight', label: 'Savaş' },
                { key: 'clutch', label: 'Clutch' },
                { key: 'pool', label: 'Havuz' },
              ].map((at) => (
                <div key={at.key} className="bg-[#0B0E14] border border-white/[0.08] rounded p-2 space-y-1">
                  <div className="text-[10px] text-slate-500">{at.label}</div>
                  <div className="text-base font-bold text-white">{userPlayer.attrs?.[at.key] ?? 75}</div>
                  <button
                    disabled={(pc.skillPoints || 0) <= 0}
                    onClick={() => {
                      soundFx.draftLock();
                      const r = runPlayerWeeklyActivity(state, 'TRAIN_ATTR', at.key);
                      onUpdate(r.msg);
                    }}
                    className={`w-full py-1 rounded text-[10px] font-bold ${
                      (pc.skillPoints || 0) > 0
                        ? 'bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] cursor-pointer'
                        : 'bg-white/[0.04] text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    +1
                  </button>
                </div>
              ))}
            </div>

            {/* Weekly Personal Activities */}
            <div className="lg:col-span-6 flex flex-wrap gap-2 items-center">
              {[
                { id: 'SOLOQ', label: 'SoloQ Kas (+LP, +Puan)' },
                { id: 'VOD_COACH', label: 'Koçla VOD (+5 Güven)' },
                { id: 'REST', label: 'Dinlen (-18 Yorgunluk)' },
                { id: 'STREAM', label: 'Yayın Aç (+4 Şöhret)' },
                { id: 'SEEK_TRANSFER', label: 'Büyük Kulüp Teklifi Ara' },
              ].map((act) => (
                <button
                  key={act.id}
                  disabled={pc.weeklyActionDone}
                  onClick={() => {
                    soundFx.click();
                    const r = runPlayerWeeklyActivity(state, act.id);
                    onUpdate(r.msg);
                  }}
                  className={`px-3 py-2 rounded-md border text-xs font-semibold whitespace-nowrap ${
                    pc.weeklyActionDone
                      ? 'border-white/[0.05] bg-[#0B0E14]/50 text-slate-600 cursor-not-allowed'
                      : 'border-[#C89B3C]/40 bg-[#171E2C] hover:border-[#C89B3C] text-slate-200 cursor-pointer'
                  }`}
                >
                  {act.label}
                </button>
              ))}
              {pc.weeklyActionDone && (
                <span className="text-[11px] text-slate-400">Bu haftalık kişisel aktivite tamamlandı.</span>
              )}
            </div>
          </div>

          {pc.inAcademy && (
            <div className="pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 bg-[#0B0E14]/70 rounded-md p-3.5">
              <div className="space-y-0.5 text-xs">
                <div className="font-bold text-sky-400">
                  Akademi Ligi: {pc.academyClub} ({pc.academyLeague})
                </div>
                <div className="text-slate-400 font-mono-num">
                  {pc.academyGames || 0} Maç · {pc.academyWins || 0} Galibiyet · {pc.academyMvps || 0} MVP · Terfi Şartı: OVR ≥ 73 ({userPlayer.ovr}/73) veya Güven ≥ %75 (%{pc.coachTrust}/75)
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {onPlayAcademyMatch && (
                  <button
                    disabled={pc.academyPlayedThisWeek}
                    onClick={onPlayAcademyMatch}
                    className={`px-3.5 py-2 rounded-md text-xs font-bold whitespace-nowrap ${
                      pc.academyPlayedThisWeek
                        ? 'bg-white/[0.04] text-slate-500 cursor-not-allowed'
                        : 'bg-sky-500 hover:bg-sky-400 text-[#0B0E14] cursor-pointer'
                    }`}
                  >
                    {pc.academyPlayedThisWeek ? 'Bu Hafta Oynandı' : 'Akademi Maçına Çık (Canlı 2D)'}
                  </button>
                )}
                <button
                  disabled={pc.academyPlayedThisWeek}
                  onClick={() => {
                    const r = playAcademyMatch(state);
                    if (r.won) soundFx.victory();
                    else soundFx.click();
                    onUpdate(r.msg);
                  }}
                  className={`px-3 py-2 rounded-md border text-xs font-semibold whitespace-nowrap ${
                    pc.academyPlayedThisWeek
                      ? 'border-white/[0.05] text-slate-500 cursor-not-allowed'
                      : 'border-white/[0.15] bg-[#171E2C] hover:border-sky-400 text-slate-200 cursor-pointer'
                  }`}
                >
                  Hızlı Simüle Et
                </button>
                {(userPlayer.ovr >= 73 || pc.coachTrust >= 75) && (
                  <button
                    onClick={() => {
                      soundFx.trophyFanfare();
                      const r = promoteFromAcademy(state);
                      onUpdate(r.msg);
                    }}
                    className="px-4 py-2 rounded-md bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] text-xs font-extrabold cursor-pointer whitespace-nowrap"
                  >
                    Ana Kadroya Yüksel! (İlk 5)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Player Media Interview & Contract Negotiation Strip */}
          <div className="pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3 font-mono-num text-slate-300">
              <span>Maaş: <strong className="text-[#E4BD67]">{formatMoney(userPlayer.salary || 1800)}/hf</strong></span>
              <span className="text-slate-600">·</span>
              <span>Birikim: <strong className="text-emerald-400">{formatMoney(pc.personalEarnings || 0)}</strong></span>
              <span className="text-slate-600">·</span>
              <span>
                Kariyer KDA:{' '}
                <strong className="text-white">
                  {userPlayer.stats?.kills || 0}/{userPlayer.stats?.deaths || 0}/{userPlayer.stats?.assists || 0}
                </strong>{' '}
                ({userPlayer.stats?.mvps || 0} MVP)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!pc.interviewDoneThisWeek ? (
                <>
                  <span className="text-[11px] text-slate-400">Haftalık Röportaj:</span>
                  {[
                    { id: 'humble', label: 'Mütevazı (+Güven)' },
                    { id: 'confident', label: 'İddialı (+Şöhret)' },
                    { id: 'team', label: 'Takım Odaklı (+Sinerji)' },
                  ].map((iv) => (
                    <button
                      key={iv.id}
                      onClick={() => {
                        soundFx.click();
                        const r = runPlayerInterview(state, iv.id);
                        onUpdate(r.msg);
                      }}
                      className="px-2.5 py-1 rounded border border-white/[0.12] bg-[#0B0E14] hover:border-[#C89B3C] text-[11px] text-slate-200 cursor-pointer"
                    >
                      {iv.label}
                    </button>
                  ))}
                </>
              ) : (
                <span className="text-[11px] text-slate-500">Haftalık röportaj verildi</span>
              )}
              {!pc.inAcademy && (
                <button
                  onClick={() => {
                    soundFx.draftLock();
                    const r = negotiatePlayerContract(state);
                    onUpdate(r.msg);
                  }}
                  className="px-3 py-1 rounded border border-[#C89B3C]/50 bg-[#C89B3C]/10 hover:bg-[#C89B3C]/20 text-[11px] font-bold text-[#E4BD67] cursor-pointer"
                >
                  Maaş Zammı İste
                </button>
              )}
            </div>
          </div>

          {Array.isArray(pc.transferOffers) && pc.transferOffers.length > 0 && (
            <div className="pt-3 border-t border-white/[0.08] space-y-2">
              <div className="text-xs font-bold text-[#E4BD67]">Sana Gelen Büyük Kulüp Transfer Teklifleri</div>
              <div className="flex flex-wrap gap-3">
                {pc.transferOffers.map((off: any) => (
                  <div
                    key={off.teamId}
                    className="bg-[#0B0E14] border border-white/[0.1] rounded-md px-3.5 py-2 flex items-center gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">{off.teamName}</span>{' '}
                      <span className="text-slate-400 font-mono-num">
                        ({off.region} · Maaş {formatMoney(off.salary)}/hf)
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        soundFx.trophyFanfare();
                        const r = acceptPlayerTransferOffer(state, off.teamId);
                        onUpdate(r.msg);
                      }}
                      className="px-3 py-1 rounded bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] font-bold cursor-pointer"
                    >
                      İmzala
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#121722] border border-white/[0.08] rounded-lg px-5 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4 min-w-0">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#E4BD67] shrink-0" />
            <span className="font-bold text-white">{managerProfile.rankTitle}</span>
          </div>
          <div className="flex items-center gap-2 font-mono-num">
            <span className="text-slate-400">İtibar {managerProfile.reputation}/100</span>
            <div className="w-20 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full bg-[#C89B3C]"
                style={{ width: `${Math.min(100, Math.max(0, managerProfile.reputation))}%` }}
              />
            </div>
          </div>
          <span className="text-slate-500 hidden sm:inline">·</span>
          <div className="flex flex-wrap items-center gap-3 font-mono-num text-slate-300">
            <span>Taktik {managerProfile.tacticalRep}</span>
            <span className="text-slate-600">·</span>
            <span>Gençlik {managerProfile.youthRep}</span>
            <span className="text-slate-600">·</span>
            <span>Medya {managerProfile.mediaRep}</span>
          </div>
          <span className="text-slate-500 hidden md:inline">·</span>
          <div className="font-mono-num text-slate-300">
            Kariyer <span className="text-white font-bold">{managerProfile.wins}G-{managerProfile.losses}M</span>{' '}
            <span className="text-[#E4BD67]">(%{managerProfile.winRate})</span>
            <span className="text-slate-600 mx-1.5">·</span>
            Kupa <span className="text-[#E4BD67] font-bold">{managerProfile.trophiesWon}</span>
          </div>
        </div>

        {urgentNotifsCount > 0 && (
          <button
            onClick={() => onNavigate('inbox')}
            className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            {urgentNotifsCount} acil bildirim →
          </button>
        )}
      </div>
      )}

      {/* Pending Drama Event Alert (Interactive FM Locker Room Event) */}
      {state.pendingEvent && (
        <div className="bg-[#171E2C] border border-amber-500/50 rounded-lg p-5 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-semibold text-amber-400">Acil Karar Gerekiyor · Soyunma Odası Olayı</div>
              <h3 className="text-base font-bold text-white">{state.pendingEvent.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{state.pendingEvent.desc}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {(state.pendingEvent.choices || []).map((ch: any, idx: number) => (
              <button
                key={idx}
                onClick={() => handleDramaChoice(idx)}
                className="text-left p-3 rounded-md bg-[#0B0E14] border border-white/[0.1] hover:border-[#C89B3C] text-xs cursor-pointer transition-colors"
              >
                <div className="font-bold text-white">{ch.label}</div>
                {ch.hint && <div className="text-[11px] text-slate-400 mt-1">{ch.hint}</div>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Manager Job Offers Alert */}
      {state.managerJobOffers && state.managerJobOffers.length > 0 && (
        <div className="bg-[#121722] border border-[#C89B3C]/50 rounded-lg p-5 space-y-3">
          <div className="text-xs font-bold text-[#E4BD67] flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Sana Gelen Baş Koçluk Teklifleri ({state.managerJobOffers.length})
          </div>
          <div className="divide-y divide-white/[0.07]">
            {state.managerJobOffers.map((job: any) => (
              <div key={job.teamId} className="py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-white">{job.teamName}</span>{' '}
                  <span className="text-slate-400">
                    ({job.region} · Bütçe {formatMoney(job.budget)} · Prestij {job.prestige})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAcceptJob(job.teamId)}
                    className="px-3 py-1.5 rounded-md bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] font-bold cursor-pointer"
                  >
                    Teklifi Kabul Et
                  </button>
                  <button
                    onClick={() => handleDismissJob(job.teamId)}
                    className="px-3 py-1.5 rounded-md border border-white/[0.12] text-slate-300 hover:text-white cursor-pointer"
                  >
                    Reddet
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7-Day Football Manager Weekly Calendar Strip */}
      <div className="bg-[#121722] border border-white/[0.08] rounded-lg p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Calendar className="w-4 h-4 text-[#E4BD67]" />
            Haftalık Takvim & Günlük Akış
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onAdvanceDay}
              className="px-3.5 py-1.5 rounded-md bg-[#171E2C] hover:bg-[#222D42] border border-white/[0.12] text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              1 Gün İlerle
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onSkipToKeyDay}
              className="px-3.5 py-1.5 rounded-md border border-[#C89B3C]/50 bg-[#C89B3C]/10 hover:bg-[#C89B3C]/20 text-xs font-semibold text-[#E4BD67] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Maç Gününe Atla
            </button>
            {!nextMatch && (
              <button
                onClick={onAdvanceWeek}
                className="px-4 py-1.5 rounded-md bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] text-xs font-bold cursor-pointer whitespace-nowrap"
              >
                {state.phase === 'OFFSEASON' ? `Yeni Sezonu Başlat (${state.season + 1})` : 'Sonraki Hafta / Tur'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {calDays.map((d: any, idx: number) => (
            <div
              key={idx}
              className={`p-3 rounded-md border text-xs ${
                d.isToday
                  ? 'bg-[#171E2C] border-[#C89B3C]'
                  : d.isPast
                  ? 'bg-[#0B0E14]/50 border-white/[0.04] opacity-60'
                  : 'bg-[#0B0E14] border-white/[0.07]'
              }`}
            >
              <div className="flex items-center justify-between font-mono-num text-[10px]">
                <span className={d.isToday ? 'text-[#E4BD67] font-bold' : 'text-slate-500'}>{d.dayShort}</span>
                <span className="text-slate-500">
                  {d.dayNum} {d.monthShort}
                </span>
              </div>
              <div
                className={`font-semibold mt-1.5 truncate ${
                  d.eventType === 'match' ? 'text-[#E4BD67]' : 'text-slate-200'
                }`}
              >
                {d.eventLabel || 'Antrenman'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main 12-Col Split: Next Match Spotlight + Standings & Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Next Match Spotlight & Recent Inbox */}
        <div className="lg:col-span-7 space-y-6">
          {/* Next Match Spotlight */}
          <div className="bg-[#121722] border border-white/[0.08] rounded-lg p-6 space-y-5">
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
              <div>
                <div className="text-xs text-[#E4BD67] font-semibold">
                  {nextMatch
                    ? matchDayToday
                      ? 'Bugün Maç Günü · Sahneye Çıkmaya Hazır'
                      : 'Sıradaki Resmi Karşılaşma'
                    : 'Bu Hafta Bekleyen Maç Yok'}
                </div>
                {rivalry && <div className="text-xs text-rose-400 font-semibold mt-0.5">{rivalry}</div>}
              </div>
              {nextMatch && (
                <span className="font-mono-num text-xs text-slate-400">
                  BO{nextMatch.bestOf || nextMatch.bo || 3} · {getPhaseLabel(state.phase)}
                </span>
              )}
            </div>

            {nextMatch && blueTeam && redTeam ? (
              <>
                <div className="grid grid-cols-3 items-center gap-4 py-2">
                  <div className="flex flex-col items-center text-center gap-2">
                    <TeamCrest tag={blueTeam.tag} color={blueTeam.color} color2={blueTeam.color2} size="lg" />
                    <div>
                      <div className="font-display text-2xl font-bold text-white">{blueTeam.name}</div>
                      <div className="text-xs text-sky-400 font-mono-num">
                        Mavi Taraf · OVR {getTeamOVR(state, blueTeam.id)}
                      </div>
                    </div>
                  </div>

                  <div className="text-center space-y-1">
                    <div className="font-display text-3xl font-extrabold text-slate-500">VS</div>
                    <div className="text-[11px] font-mono-num text-slate-400">
                      {state.fearlessEnabled ? 'Fearless Draft Aktif' : 'Standart Draft'}
                    </div>
                  </div>

                  <div className="flex flex-col items-center text-center gap-2">
                    <TeamCrest tag={redTeam.tag} color={redTeam.color} color2={redTeam.color2} size="lg" />
                    <div>
                      <div className="font-display text-2xl font-bold text-white">{redTeam.name}</div>
                      <div className="text-xs text-rose-400 font-mono-num">
                        Kırmızı Taraf · OVR {getTeamOVR(state, redTeam.id)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.08]">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => onPlayMatch(nextMatch)}
                      className="px-5 py-2.5 rounded-md bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] text-xs font-bold flex items-center gap-2 cursor-pointer whitespace-nowrap"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Sahneye Çık (Draft & Canlı 2D)
                    </button>
                    <button
                      onClick={() => onQuickSimMatch(nextMatch)}
                      className="px-4 py-2.5 rounded-md border border-white/[0.12] bg-[#171E2C] hover:bg-[#222D42] text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <FastForward className="w-3.5 h-3.5" />
                      Hızlı Simüle Et
                    </button>
                  </div>
                  <button
                    disabled={pressDone}
                    onClick={onOpenPress}
                    className={`px-3.5 py-2.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap ${
                      pressDone
                        ? 'border-white/[0.06] text-slate-500 cursor-not-allowed'
                        : 'border-[#C89B3C]/50 text-[#E4BD67] hover:bg-[#C89B3C]/15 cursor-pointer'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    {pressDone ? 'Basın Toplantısı Yapıldı' : 'Basın Toplantısı'}
                  </button>
                </div>

                {/* Pre-Match Opponent Scout Report & 1-Click Counter-Tactic */}
                {scoutReport && (
                  <div className="pt-4 border-t border-white/[0.08] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Crosshair className="w-3.5 h-3.5 text-[#E4BD67]" />
                        Rakip Gözlem Raporu ({scoutReport.oppTeam.tag})
                        <span className="font-mono-num text-[11px] font-normal text-slate-400">
                          · Tahmini Şans %{scoutReport.winProbPct}
                          {scoutReport.hasScrimIntel ? ' · Scrim İstihbaratı Açık' : ''}
                        </span>
                      </div>
                      <button
                        onClick={handleApplyCounterTactic}
                        className="px-3 py-1.5 rounded-md border border-[#C89B3C]/60 bg-[#C89B3C]/12 hover:bg-[#C89B3C]/25 text-[#E4BD67] text-[11px] font-bold cursor-pointer whitespace-nowrap"
                      >
                        Karşı Taktik Uygula
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <div className="text-[11px] text-slate-500">Rakip Oyun Stili</div>
                        <div className="font-semibold text-slate-200 mt-0.5">{scoutReport.oppStyleLabel}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500">Yıldız Tehdit / Zayıf Halka</div>
                        <div className="font-mono-num text-slate-200 mt-0.5">
                          <span className="text-rose-400 font-semibold">{scoutReport.starPlayer.name}</span> ({scoutReport.starPlayer.ovr}) ·{' '}
                          <span className="text-emerald-400 font-semibold">{scoutReport.weakestPlayer.name}</span> ({scoutReport.weakestPlayer.ovr})
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-500">Önerilen Hedef Banlar</div>
                        <div className="text-[#E4BD67] font-medium mt-0.5 truncate">
                          {scoutReport.targetBans.map((cid) => CHAMPION_MAP[cid]?.name || cid).join(' · ')}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{scoutReport.recommendedSummary}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="py-6 text-center space-y-3">
                <p className="text-sm text-slate-300">
                  {state.phase === 'OFFSEASON'
                    ? `Sezon ${state.season} tamamlandı! Transferlerini ve sözleşme yenilemelerini bitirdiysen Sezon ${state.season + 1} fikstürünü başlatabilirsin.`
                    : 'Bu haftaki tüm resmi maçların tamamlandı. Antrenman, scrim veya transfer işlemlerini bitirdiysen yeni haftaya geçebilirsin.'}
                </p>
                <button
                  onClick={onAdvanceWeek}
                  className="px-5 py-2.5 rounded-md bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] text-xs font-bold cursor-pointer"
                >
                  {state.phase === 'OFFSEASON' ? `Sezon ${state.season + 1} Başlat` : 'Haftayı / Turu İlerlet'}
                </button>
              </div>
            )}
          </div>

          {/* Latest Inbox Feed Preview */}
          <div className="bg-[#121722] border border-white/[0.08] rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#E4BD67]" />
                Son Gelen Kutusu Bildirimleri
              </span>
              <button
                onClick={() => onNavigate('inbox')}
                className="text-xs text-[#E4BD67] hover:underline cursor-pointer"
              >
                Tümünü Aç
              </button>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {(state.inbox || []).slice(0, 4).map((msg: any) => (
                <button
                  key={msg.id}
                  onClick={() => onNavigate('inbox')}
                  className="w-full text-left py-2.5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-white truncate">{msg.title}</span>
                    <span className="text-[11px] text-slate-500 font-mono-num shrink-0">{msg.sender}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{msg.body}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Board Vision & Regional Standings */}
        <div className="lg:col-span-5 space-y-6">
          {/* Board Objectives */}
          <div className="bg-[#121722] border border-white/[0.08] rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-[#E4BD67]" />
                Yönetim Kurulu Vizyonu
              </span>
              <span className="font-mono-num text-xs text-[#E4BD67] font-bold">
                Not: {boardConf.grade} (%{boardConf.score})
              </span>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {objectives.map((obj: any, i: number) => (
                <div key={i} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="text-slate-200 font-medium">{obj.title}</div>
                    <div className="text-[11px] text-slate-500">{obj.detail}</div>
                  </div>
                  <span
                    className={`font-mono-num font-semibold shrink-0 ${
                      obj.status === 'DONE' || obj.status === 'ON_TRACK'
                        ? 'text-emerald-400'
                        : obj.status === 'WARN'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {obj.status === 'DONE'
                      ? 'Tamamlandı'
                      : obj.status === 'ON_TRACK'
                      ? 'Yolunda'
                      : obj.status === 'WARN'
                      ? 'Dikkat'
                      : 'Risk'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Regional Standings Table */}
          <div className="bg-[#121722] border border-white/[0.08] rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/[0.08] flex items-center justify-between">
              <span className="text-sm font-bold text-white">{userTeam.region} Puan Durumu</span>
              <button
                onClick={() => onNavigate('league')}
                className="text-xs text-[#E4BD67] hover:underline cursor-pointer"
              >
                Fikstür & Turnuva
              </button>
            </div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/[0.07] bg-[#0B0E14]/60 text-[11px] text-slate-400">
                  <th className="py-2 px-4">#</th>
                  <th className="py-2 px-2">Kulüp</th>
                  <th className="py-2 px-3 text-right">G-M</th>
                  <th className="py-2 px-4 text-right">Av.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {standings.map((row: any, idx: number) => {
                  const t = state.teams.find((x: any) => x.id === row.teamId);
                  if (!t) return null;
                  const isMe = t.id === userTeam.id;
                  const diff = (row.gameWins || 0) - (row.gameLosses || 0);
                  return (
                    <tr key={t.id} className={isMe ? 'bg-[#C89B3C]/12' : ''}>
                      <td className="py-2 px-4 font-mono-num text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <TeamCrest tag={t.tag} color={t.color} color2={t.color2} size="xs" />
                          <span className={`font-semibold truncate ${isMe ? 'text-[#E4BD67]' : 'text-white'}`}>
                            {t.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono-num font-bold text-white">
                        {row.wins}-{row.losses}
                      </td>
                      <td className="py-2 px-4 text-right font-mono-num text-slate-400">
                        {diff >= 0 ? `+${diff}` : diff}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

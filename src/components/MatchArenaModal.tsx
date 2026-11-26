import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  FastForward,
  Sparkles,
  Megaphone,
  Search,
  Check,
  ShieldAlert,
  Trophy,
  X,
  Sliders,
} from 'lucide-react';
import { CHAMPIONS, CHAMPION_MAP, getChampionMetaTier } from '../data/champions.js';
import { ROLES, getRivalryName } from '../data/teamsAndPlayers.js';
import {
  DRAFT_STEPS,
  createDraftState,
  applyDraftAction,
  chooseAIDraftAction,
  analyzeDraftSide,
  getMissingRoles,
} from '../engine/draftEngine.js';
import {
  createLiveMatchState,
  stepMatchMinute,
  finishMatchInstantly,
  applyMatchOutcomeToPlayers,
} from '../engine/matchEngine.js';
import {
  TEAM_TALK_OPTIONS,
  getTeamRoster,
  getCurrentPatch,
  recordSeriesResult,
  applyPostMatchTeamTalk,
} from '../engine/gameEngine.js';
import { TOUCHLINE_SHOUTS, applyTouchlineShout } from '../engine/fmExtensions';
import { soundFx } from '../engine/soundFx';
import { LiveRiftCanvas } from './LiveRiftCanvas';
import { GoldDiffChart, TeamCrest } from './shared/Visuals';
import { ActiveSeriesContext } from '../types/game';

interface MatchArenaModalProps {
  careerState: any;
  seriesCtx: ActiveSeriesContext;
  onSeriesFinished: (summary: string) => void;
  onAbort: () => void;
}

type StagePhase = 'TEAM_TALK' | 'DRAFT' | 'LIVE' | 'POST_GAME' | 'SERIES_DONE';

export const MatchArenaModal: React.FC<MatchArenaModalProps> = ({
  careerState,
  seriesCtx,
  onSeriesFinished,
  onAbort,
}) => {
  const { match, blueTeam, redTeam, userSide, bo, highStakes } = seriesCtx;
  const patch = useMemo(() => getCurrentPatch(careerState), [careerState]);
  const rivalryName = useMemo(() => getRivalryName(blueTeam.id, redTeam.id), [blueTeam.id, redTeam.id]);
  const winsNeeded = Math.ceil(bo / 2);

  const blueRoster = useMemo(() => {
    const r = getTeamRoster(careerState, blueTeam.id);
    return ROLES.map((role: string) => r.find((p: any) => p.role === role && p.isStarter) || r.find((p: any) => p.role === role) || r[0]);
  }, [careerState, blueTeam.id]);

  const redRoster = useMemo(() => {
    const r = getTeamRoster(careerState, redTeam.id);
    return ROLES.map((role: string) => r.find((p: any) => p.role === role && p.isStarter) || r.find((p: any) => p.role === role) || r[0]);
  }, [careerState, redTeam.id]);

  const [phase, setPhase] = useState<StagePhase>('TEAM_TALK');
  const [gameNum, setGameNum] = useState(1);
  const [blueScore, setBlueScore] = useState(0);
  const [redScore, setRedScore] = useState(0);
  const [selectedTalk, setSelectedTalk] = useState<string>('motivate');
  const [fearlessLocked, setFearlessLocked] = useState<Set<string>>(() => new Set());
  const [draft, setDraft] = useState<any>(null);
  const [draftVersion, setDraftVersion] = useState(0);
  const [champSearch, setChampSearch] = useState('');
  const [champRoleFilter, setChampRoleFilter] = useState<string>('ALL');

  const [liveState, setLiveState] = useState<any>(null);
  const [liveTick, setLiveTick] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<number>(2);
  const [lastShoutMin, setLastShoutMin] = useState<number>(-10);
  const [shoutNotice, setShoutNotice] = useState<string>('');
  const [postTalkDone, setPostTalkDone] = useState(false);
  const [statsTab, setStatsTab] = useState<'scoreboard' | 'damage'>('scoreboard');

  const timerRef = useRef<number | null>(null);

  const startDraftForGame = (talkId: string) => {
    soundFx.draftLock();
    setSelectedTalk(talkId);
    const d = createDraftState(
      blueTeam,
      redTeam,
      blueRoster,
      redRoster,
      patch,
      userSide,
      careerState.fearlessEnabled ? fearlessLocked : new Set()
    );
    setDraft(d);
    setDraftVersion((v) => v + 1);
    setPhase('DRAFT');
  };

  // Auto-advance AI Draft turns
  useEffect(() => {
    if (phase !== 'DRAFT' || !draft || draft.finished) return;
    const step = DRAFT_STEPS[draft.stepIndex];
    if (!step) return;

    if (step.side !== userSide) {
      const id = window.setTimeout(() => {
        const aiAction = chooseAIDraftAction(draft);
        if (aiAction && aiAction.champId) {
          applyDraftAction(draft, aiAction.champId, aiAction.role as any);
          if (step.type === 'ban') soundFx.draftBan();
          else soundFx.draftLock();
          setDraftVersion((v) => v + 1);
        }
      }, 360);
      return () => window.clearTimeout(id);
    }
  }, [phase, draft, draftVersion, userSide]);

  // Launch Live Match once draft finishes
  const launchLiveMatch = () => {
    if (!draft) return;
    const oppId = userSide === 'blue' ? redTeam.id : blueTeam.id;
    const hasScrimIntel = Boolean(careerState.scrimIntel?.[oppId]);
    const ms = createLiveMatchState(
      blueTeam,
      redTeam,
      blueRoster,
      redRoster,
      draft.bluePicks,
      draft.redPicks,
      patch,
      userSide as any,
      highStakes,
      {
        teamTalk: selectedTalk,
        hasScrimIntel,
      }
    );
    setLiveState(ms);
    setLiveTick(0);
    setLastShoutMin(-10);
    setShoutNotice('');
    setIsPlaying(true);
    setPhase('LIVE');
    soundFx.objectiveSecured();
  };

  // Live Match Simulation Loop
  useEffect(() => {
    if (phase !== 'LIVE' || !liveState || liveState.finished || !isPlaying) return;
    const intervalMs = speed === 1 ? 820 : speed === 2 ? 440 : speed === 4 ? 220 : 100;
    timerRef.current = window.setInterval(() => {
      const prevKills = liveState.blueKills + liveState.redKills;
      const prevObj =
        liveState.blueDragons + liveState.redDragons + liveState.blueBarons + liveState.redBarons;
      stepMatchMinute(liveState);
      const nextKills = liveState.blueKills + liveState.redKills;
      const nextObj =
        liveState.blueDragons + liveState.redDragons + liveState.blueBarons + liveState.redBarons;

      if (nextObj > prevObj) soundFx.objectiveSecured();
      else if (nextKills > prevKills) soundFx.killAlert();

      setLiveTick((t) => t + 1);

      if (liveState.finished) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        handleSingleGameComplete(liveState);
      }
    }, intervalMs);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [phase, liveState, isPlaying, speed]);

  // Keyboard shortcuts during LIVE broadcast (Space = Pause/Resume, 1-4 = Speed)
  useEffect(() => {
    if (phase !== 'LIVE') return;
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === '1') setSpeed(1);
      else if (e.key === '2') setSpeed(2);
      else if (e.key === '3') setSpeed(4);
      else if (e.key === '4') setSpeed(8);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase]);

  const handleSingleGameComplete = (ms: any) => {
    applyMatchOutcomeToPlayers(ms);
    const nextBlue = blueScore + (ms.winner === 'blue' ? 1 : 0);
    const nextRed = redScore + (ms.winner === 'red' ? 1 : 0);
    setBlueScore(nextBlue);
    setRedScore(nextRed);

    if (careerState.fearlessEnabled && draft) {
      const updated = new Set(fearlessLocked);
      Object.values(draft.bluePicks).forEach((cid: any) => updated.add(cid));
      Object.values(draft.redPicks).forEach((cid: any) => updated.add(cid));
      setFearlessLocked(updated);
    }

    const userWonGame = ms.winner === userSide;
    if (userWonGame) soundFx.victory();
    else soundFx.defeat();

    if (nextBlue >= winsNeeded || nextRed >= winsNeeded) {
      recordSeriesResult(careerState, match, nextBlue, nextRed);
      setPostTalkDone(false);
      setPhase('SERIES_DONE');
    } else {
      setPhase('POST_GAME');
    }
  };

  const handleInstantFinish = () => {
    if (!liveState || liveState.finished) return;
    finishMatchInstantly(liveState);
    setLiveTick((t) => t + 1);
    handleSingleGameComplete(liveState);
  };

  const handleUserPickOrBan = (champId: string) => {
    if (!draft || draft.finished) return;
    const step = DRAFT_STEPS[draft.stepIndex];
    if (!step || step.side !== userSide) return;
    const ok = applyDraftAction(draft, champId);
    if (ok) {
      if (step.type === 'ban') soundFx.draftBan();
      else soundFx.draftLock();
      setDraftVersion((v) => v + 1);
    }
  };

  const handleAssistantAutoDraft = () => {
    if (!draft || draft.finished) return;
    const step = DRAFT_STEPS[draft.stepIndex];
    if (!step || step.side !== userSide) return;
    const rec = chooseAIDraftAction(draft);
    if (rec && rec.champId) {
      const ok = applyDraftAction(draft, rec.champId, rec.role as any);
      if (ok) {
        if (step.type === 'ban') soundFx.draftBan();
        else soundFx.draftLock();
        setDraftVersion((v) => v + 1);
      }
    }
  };

  const handleAutoFinishDraft = () => {
    if (!draft) return;
    while (!draft.finished) {
      const rec = chooseAIDraftAction(draft);
      if (!rec || !rec.champId) break;
      applyDraftAction(draft, rec.champId, rec.role as any);
    }
    soundFx.draftLock();
    setDraftVersion((v) => v + 1);
  };

  const handleLiveShout = (shoutId: string) => {
    if (!liveState || liveState.finished) return;
    if (liveState.minute - lastShoutMin < 5) return;
    const msg = applyTouchlineShout(liveState, shoutId);
    soundFx.shout();
    setLastShoutMin(liveState.minute);
    setShoutNotice(msg);
    setLiveTick((t) => t + 1);
  };

  const handleLiveTacticChange = (
    field: 'gameplan' | 'laneFocus' | 'objective' | 'aheadPlan' | 'behindPlan',
    val: string
  ) => {
    if (!liveState) return;
    const userTactics = userSide === 'blue' ? liveState.blueTactics : liveState.redTactics;
    userTactics[field] = val;
    soundFx.click();
    setLiveTick((t) => t + 1);
  };

  const handlePostMatchTalk = (talkType: string) => {
    applyPostMatchTeamTalk(careerState, talkType);
    soundFx.click();
    setPostTalkDone(true);
  };

  const blueDraftAnalysis = useMemo(
    () => (draft ? analyzeDraftSide(draft.bluePicks, blueRoster, patch, draft.redPicks) : null),
    [draft, draftVersion, blueRoster, patch]
  );
  const redDraftAnalysis = useMemo(
    () => (draft ? analyzeDraftSide(draft.redPicks, redRoster, patch, draft.bluePicks) : null),
    [draft, draftVersion, redRoster, patch]
  );

  const filteredChampions = useMemo(() => {
    if (!draft) return [];
    const q = champSearch.trim().toLowerCase();
    return CHAMPIONS.filter((c: any) => {
      if (champRoleFilter !== 'ALL' && !c.roles.includes(champRoleFilter)) return false;
      if (q && !c.name.toLowerCase().includes(q) && !c.classTag.toLowerCase().includes(q)) return false;
      return true;
    }).sort((a: any, b: any) => {
      const ta = ['C', 'B', 'A', 'S'].indexOf(getChampionMetaTier(a, patch));
      const tb = ['C', 'B', 'A', 'S'].indexOf(getChampionMetaTier(b, patch));
      return tb - ta || a.name.localeCompare(b.name);
    });
  }, [draft, draftVersion, champSearch, champRoleFilter, patch]);

  const userRoster = userSide === 'blue' ? blueRoster : redRoster;
  const oppRoster = userSide === 'blue' ? redRoster : blueRoster;
  const currentStep = draft && !draft.finished ? DRAFT_STEPS[draft.stepIndex] : null;
  const isUserTurn = currentStep?.side === userSide;
  const missingUserRoles = draft ? getMissingRoles(userSide === 'blue' ? draft.bluePicks : draft.redPicks) : [];

  // Live win probability estimate from gold diff + objectives
  const liveWinProbBlue = useMemo(() => {
    if (!liveState) return 50;
    const gd = liveState.blueGold - liveState.redGold;
    const objDiff = (liveState.blueDragons - liveState.redDragons) * 900 + (liveState.blueTowers - liveState.redTowers) * 650;
    const score = (gd + objDiff) / 6500;
    const prob = 100 / (1 + Math.exp(-score));
    return Math.max(4, Math.min(96, Math.round(prob)));
  }, [liveState, liveTick]);

  const userTacticsLive = liveState ? (userSide === 'blue' ? liveState.blueTactics : liveState.redTactics) : null;
  const shoutCooldownLeft = liveState ? Math.max(0, 5 - (liveState.minute - lastShoutMin)) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#070A10]/95 backdrop-blur-md flex flex-col overflow-hidden">
      {/* Broadcast Top Bar */}
      <header className="h-16 px-6 border-b border-white/[0.08] bg-[#0B0E14] flex items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <TeamCrest tag={blueTeam.tag} color={blueTeam.color} color2={blueTeam.color2} size="sm" />
          <div className="flex items-center gap-2 font-display text-2xl font-extrabold text-white tracking-wide">
            <span className="text-sky-400">{blueTeam.tag}</span>
            <span className="font-mono-num text-[#E4BD67] text-xl px-1.5">
              {blueScore} - {redScore}
            </span>
            <span className="text-rose-400">{redTeam.tag}</span>
          </div>
          <TeamCrest tag={redTeam.tag} color={redTeam.color} color2={redTeam.color2} size="sm" />
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 ml-3">
            <span>BO{bo} · Oyun {gameNum}</span>
            <span aria-hidden="true">·</span>
            <span>Yama {patch.version}</span>
            {careerState.fearlessEnabled && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#E4BD67]">Fearless Draft</span>
              </>
            )}
            {rivalryName && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-rose-400 font-semibold">{rivalryName}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {phase === 'LIVE' && liveState && (
            <div className="font-mono-num text-sm font-bold text-white px-3 py-1.5 rounded-md bg-[#121722] border border-white/[0.08]">
              {String(liveState.minute).padStart(2, '0')}:00
            </div>
          )}
          {phase !== 'SERIES_DONE' && (
            <button
              onClick={onAbort}
              className="px-3 py-1.5 rounded-md border border-white/[0.12] hover:border-white/[0.25] text-xs text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Çık
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5 lg:p-6">
        <div className="max-w-[1400px] mx-auto">
          {/* STAGE 1: PRE-GAME LOCKER ROOM TEAM TALK */}
          {phase === 'TEAM_TALK' && (
            <div className="max-w-3xl mx-auto bg-[#121722] border border-white/[0.1] rounded-lg p-6 lg:p-8 space-y-6 mt-4">
              <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
                <div>
                  <div className="text-xs text-[#E4BD67] font-semibold">
                    Sahne Öncesi Soyunma Odası · Oyun {gameNum} (BO{bo})
                  </div>
                  <h2 className="font-display text-3xl font-bold text-white mt-1">
                    Maç Önü Takım Konuşması
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Seçtiğin konuşma tonu oyuncuların erken oyun agresifliğini, hata payını ve clutch performansını doğrudan etkiler.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TEAM_TALK_OPTIONS.map((opt: any) => (
                  <button
                    key={opt.id}
                    onClick={() => startDraftForGame(opt.id)}
                    className="text-left p-4 rounded-md border border-white/[0.08] bg-[#171E2C]/60 hover:bg-[#1D2638] hover:border-[#C89B3C]/70 transition-colors cursor-pointer space-y-1.5"
                  >
                    <div className="text-sm font-bold text-white">{opt.name || opt.label}</div>
                    <div className="text-xs text-slate-400 leading-relaxed">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STAGE 2: PRO STAGE FEARLESS DRAFT ROOM */}
          {phase === 'DRAFT' && draft && (
            <div className="space-y-4">
              {/* Draft Phase Banner */}
              <div className="bg-[#121722] border border-white/[0.08] rounded-lg px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-400">
                    Adım {Math.min(draft.stepIndex + 1, DRAFT_STEPS.length)} / {DRAFT_STEPS.length}
                  </div>
                  <div className="font-display text-2xl font-bold text-white tracking-wide">
                    {draft.finished
                      ? 'Draft Tamamlandı — Sahneye Çıkmaya Hazır'
                      : `${currentStep?.label} ${isUserTurn ? '(Senin Sıran)' : '(Rakip Düşünüyor...)'}`}
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  {!draft.finished && isUserTurn && (
                    <button
                      onClick={handleAssistantAutoDraft}
                      className="px-3.5 py-2 rounded-md border border-[#C89B3C]/50 bg-[#C89B3C]/10 hover:bg-[#C89B3C]/20 text-[#E4BD67] text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Asistan Önerisini Seç
                    </button>
                  )}
                  {!draft.finished && (
                    <button
                      onClick={handleAutoFinishDraft}
                      className="px-3.5 py-2 rounded-md border border-white/[0.12] bg-[#171E2C] hover:bg-[#212B3F] text-slate-200 text-xs font-semibold cursor-pointer whitespace-nowrap"
                    >
                      Draftı Otomatik Bitir
                    </button>
                  )}
                  {draft.finished && (
                    <button
                      onClick={launchLiveMatch}
                      className="px-5 py-2.5 rounded-md bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] text-xs font-bold flex items-center gap-2 cursor-pointer whitespace-nowrap"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Maçı Başlat (Canlı 2D)
                    </button>
                  )}
                </div>
              </div>

              {/* Fearless Locked Strip */}
              {fearlessLocked.size > 0 && (
                <div className="bg-[#121722] border border-white/[0.08] rounded-md px-4 py-2.5 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-[#E4BD67] font-semibold">Fearless Kilitli ({fearlessLocked.size}):</span>
                  <span className="text-slate-400">
                    {Array.from(fearlessLocked)
                      .map((id) => CHAMPION_MAP[id]?.name || id)
                      .join(' · ')}
                  </span>
                </div>
              )}

              {/* 3-Column Draft Layout: Blue Side | Champion Pool | Red Side */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* BLUE SIDE */}
                <div className="lg:col-span-3 bg-[#121722] border border-white/[0.08] rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                    <div className="flex items-center gap-2">
                      <TeamCrest tag={blueTeam.tag} color={blueTeam.color} color2={blueTeam.color2} size="xs" />
                      <span className="text-sm font-bold text-sky-400">
                        {blueTeam.tag} {userSide === 'blue' ? '(Sen)' : ''}
                      </span>
                    </div>
                    <span className="font-mono-num text-xs font-bold text-white">
                      Skor {blueDraftAnalysis?.score || 0}
                    </span>
                  </div>

                  {/* Bans */}
                  <div className="text-[11px] text-slate-400">
                    Yasaklamalar:{' '}
                    <span className="text-slate-200 font-medium">
                      {draft.blueBans.length
                        ? draft.blueBans.map((id: string) => CHAMPION_MAP[id]?.name || id).join(', ')
                        : '—'}
                    </span>
                  </div>

                  {/* 5 Role Slots */}
                  <div className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
                    {ROLES.map((role: string) => {
                      const player = blueRoster.find((p: any) => p.role === role);
                      const cid = draft.bluePicks[role];
                      const champ = cid ? CHAMPION_MAP[cid] : null;
                      const isSig = cid && player?.sigChamps?.includes(cid);
                      return (
                        <div key={role} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                          <div className="min-w-0">
                            <div className="text-[10px] font-mono-num text-slate-500">
                              {role} · {player?.name}
                            </div>
                            <div className={`font-bold truncate ${champ ? 'text-white' : 'text-slate-600'}`}>
                              {champ ? champ.name : 'Bekleniyor...'}
                            </div>
                          </div>
                          {champ && (
                            <div className="text-right shrink-0 text-[11px]">
                              <div className="font-mono-num text-sky-400">
                                {getChampionMetaTier(champ, patch)} · {champ.dmg}
                              </div>
                              {isSig && <div className="text-[#E4BD67] font-semibold">İmza</div>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {blueDraftAnalysis && (
                    <div className="space-y-1.5 text-[11px] text-slate-400">
                      <div className="grid grid-cols-3 gap-2 font-mono-num text-center pt-1">
                        <div>
                          <div className="text-slate-500">Erken</div>
                          <div className="text-white font-bold">{blueDraftAnalysis.early}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Orta</div>
                          <div className="text-white font-bold">{blueDraftAnalysis.mid}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Geç</div>
                          <div className="text-white font-bold">{blueDraftAnalysis.late}</div>
                        </div>
                      </div>
                      {blueDraftAnalysis.warnings.map((w: string, i: number) => (
                        <div key={i} className="text-amber-400 flex items-center gap-1.5 pt-1">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* CENTER CHAMPION POOL */}
                <div className="lg:col-span-6 bg-[#121722] border border-white/[0.08] rounded-lg p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="relative flex-1 min-w-[180px]">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={champSearch}
                        onChange={(e) => setChampSearch(e.target.value)}
                        placeholder="Şampiyon veya sınıf ara (Azir, Tank, Poke)..."
                        className="w-full bg-[#0B0E14] border border-white/[0.1] rounded-md pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-[#C89B3C]"
                      />
                    </div>
                    <div className="flex items-center gap-1 p-1 bg-[#0B0E14] rounded-md border border-white/[0.08]">
                      {['ALL', ...ROLES].map((r) => (
                        <button
                          key={r}
                          onClick={() => setChampRoleFilter(r)}
                          className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                            champRoleFilter === r ? 'bg-[#C89B3C] text-[#0B0E14]' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {r === 'ALL' ? 'Tümü' : r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {!draft.finished && isUserTurn && currentStep?.type === 'pick' && (
                    <div className="text-[11px] text-slate-400">
                      Eksik Roller:{' '}
                      <span className="text-[#E4BD67] font-semibold">{missingUserRoles.join(' · ')}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[470px] overflow-y-auto pr-1">
                    {filteredChampions.map((c: any) => {
                      const used = draft.usedChamps.has(c.id);
                      const tier = getChampionMetaTier(c, patch);
                      const isSigForUser = userRoster.some((p: any) => p?.sigChamps?.includes(c.id));
                      const isTargetBan =
                        currentStep?.type === 'ban' && oppRoster.some((p: any) => p?.sigChamps?.includes(c.id));
                      const canClick = !used && isUserTurn && !draft.finished;
                      return (
                        <button
                          key={c.id}
                          disabled={!canClick}
                          onClick={() => handleUserPickOrBan(c.id)}
                          className={`text-left p-2.5 rounded-md border transition-colors ${
                            used
                              ? 'bg-[#0B0E14]/50 border-white/[0.04] opacity-35 cursor-not-allowed'
                              : canClick
                              ? 'bg-[#171E2C]/70 border-white/[0.09] hover:border-[#C89B3C] hover:bg-[#1E273A] cursor-pointer'
                              : 'bg-[#171E2C]/40 border-white/[0.06] cursor-default'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-white truncate">{c.name}</span>
                            <span
                              className={`font-mono-num text-[11px] font-bold ${
                                tier === 'S'
                                  ? 'text-[#E4BD67]'
                                  : tier === 'A'
                                  ? 'text-emerald-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {tier}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                            {c.roles.join('/')} · {c.dmg}
                          </div>
                          <div className="flex items-center justify-between text-[10px] mt-1">
                            <span className="text-slate-500 truncate">{c.classTag}</span>
                            {isTargetBan ? (
                              <span className="text-rose-400 font-semibold">Hedef Ban</span>
                            ) : isSigForUser ? (
                              <span className="text-[#E4BD67] font-semibold">İmza</span>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* RED SIDE */}
                <div className="lg:col-span-3 bg-[#121722] border border-white/[0.08] rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                    <div className="flex items-center gap-2">
                      <TeamCrest tag={redTeam.tag} color={redTeam.color} color2={redTeam.color2} size="xs" />
                      <span className="text-sm font-bold text-rose-400">
                        {redTeam.tag} {userSide === 'red' ? '(Sen)' : ''}
                      </span>
                    </div>
                    <span className="font-mono-num text-xs font-bold text-white">
                      Skor {redDraftAnalysis?.score || 0}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Yasaklamalar:{' '}
                    <span className="text-slate-200 font-medium">
                      {draft.redBans.length
                        ? draft.redBans.map((id: string) => CHAMPION_MAP[id]?.name || id).join(', ')
                        : '—'}
                    </span>
                  </div>

                  <div className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
                    {ROLES.map((role: string) => {
                      const player = redRoster.find((p: any) => p.role === role);
                      const cid = draft.redPicks[role];
                      const champ = cid ? CHAMPION_MAP[cid] : null;
                      const isSig = cid && player?.sigChamps?.includes(cid);
                      return (
                        <div key={role} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                          <div className="min-w-0">
                            <div className="text-[10px] font-mono-num text-slate-500">
                              {role} · {player?.name}
                            </div>
                            <div className={`font-bold truncate ${champ ? 'text-white' : 'text-slate-600'}`}>
                              {champ ? champ.name : 'Bekleniyor...'}
                            </div>
                          </div>
                          {champ && (
                            <div className="text-right shrink-0 text-[11px]">
                              <div className="font-mono-num text-rose-400">
                                {getChampionMetaTier(champ, patch)} · {champ.dmg}
                              </div>
                              {isSig && <div className="text-[#E4BD67] font-semibold">İmza</div>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {redDraftAnalysis && (
                    <div className="space-y-1.5 text-[11px] text-slate-400">
                      <div className="grid grid-cols-3 gap-2 font-mono-num text-center pt-1">
                        <div>
                          <div className="text-slate-500">Erken</div>
                          <div className="text-white font-bold">{redDraftAnalysis.early}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Orta</div>
                          <div className="text-white font-bold">{redDraftAnalysis.mid}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Geç</div>
                          <div className="text-white font-bold">{redDraftAnalysis.late}</div>
                        </div>
                      </div>
                      {redDraftAnalysis.warnings.map((w: string, i: number) => (
                        <div key={i} className="text-amber-400 flex items-center gap-1.5 pt-1">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STAGE 3: LIVE 2D BROADCAST & FM TOUCHLINE */}
          {(phase === 'LIVE' || phase === 'POST_GAME') && liveState && (
            <div className="space-y-4">
              {/* Broadcast Scoreboard Strip */}
              <div className="bg-[#121722] border border-white/[0.1] rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  {/* Blue Metrics */}
                  <div className="flex items-center justify-between md:justify-start gap-5">
                    <div className="flex items-center gap-2.5">
                      <TeamCrest tag={blueTeam.tag} color={blueTeam.color} color2={blueTeam.color2} size="sm" />
                      <div>
                        <div className="font-display text-xl font-bold text-sky-400">{blueTeam.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono-num">
                          Kule {liveState.blueTowers} · Ejder {liveState.blueDragons} · Baron {liveState.blueBarons} · Kurtçuk {liveState.blueGrubs}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono-num">
                      <div className="text-2xl font-bold text-white">{liveState.blueKills}</div>
                      <div className="text-xs text-[#E4BD67]">{(liveState.blueGold / 1000).toFixed(1)}k</div>
                    </div>
                  </div>

                  {/* Center Playback Controls */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="font-mono-num text-2xl font-bold text-white">
                      {String(liveState.minute).padStart(2, '0')}:00
                    </div>
                    {phase === 'LIVE' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setIsPlaying((p) => !p)}
                          className="px-3 py-1.5 rounded-md bg-[#171E2C] hover:bg-[#212B3F] border border-white/[0.1] text-xs font-semibold text-white flex items-center gap-1 cursor-pointer"
                        >
                          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          {isPlaying ? 'Duraklat' : 'Devam'}
                        </button>
                        {[1, 2, 4, 8].map((s) => (
                          <button
                            key={s}
                            onClick={() => setSpeed(s)}
                            className={`px-2 py-1.5 rounded-md text-xs font-mono-num font-bold cursor-pointer ${
                              speed === s
                                ? 'bg-[#C89B3C] text-[#0B0E14]'
                                : 'bg-[#171E2C] text-slate-400 hover:text-white'
                            }`}
                          >
                            {s}x
                          </button>
                        ))}
                        <button
                          onClick={handleInstantFinish}
                          className="px-2.5 py-1.5 rounded-md border border-white/[0.12] hover:border-[#C89B3C] text-xs text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <FastForward className="w-3.5 h-3.5" />
                          Bitir
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Red Metrics */}
                  <div className="flex items-center justify-between md:justify-end gap-5">
                    <div className="text-left font-mono-num">
                      <div className="text-2xl font-bold text-white">{liveState.redKills}</div>
                      <div className="text-xs text-[#E4BD67]">{(liveState.redGold / 1000).toFixed(1)}k</div>
                    </div>
                    <div className="flex items-center gap-2.5 text-right">
                      <div>
                        <div className="font-display text-xl font-bold text-rose-400">{redTeam.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono-num">
                          Kule {liveState.redTowers} · Ejder {liveState.redDragons} · Baron {liveState.redBarons} · Kurtçuk {liveState.redGrubs}
                        </div>
                      </div>
                      <TeamCrest tag={redTeam.tag} color={redTeam.color} color2={redTeam.color2} size="sm" />
                    </div>
                  </div>
                </div>

                {/* Live Win Probability Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono-num">
                    <span className="text-sky-400 font-semibold">
                      {blueTeam.tag} Kazanma Olasılığı %{liveWinProbBlue}
                    </span>
                    <span className="text-rose-400 font-semibold">
                      %{100 - liveWinProbBlue} {redTeam.tag}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-rose-500/70 overflow-hidden">
                    <div
                      className="h-full bg-sky-400 transition-all duration-300"
                      style={{ width: `${liveWinProbBlue}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Main 12-Col Broadcast Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Left 5 cols: Live 2D Summoner's Rift + Gold Chart */}
                <div className="lg:col-span-5 space-y-4">
                  <LiveRiftCanvas matchState={liveState} />
                  <div className="bg-[#121722] border border-white/[0.08] rounded-lg p-4">
                    <GoldDiffChart
                      history={liveState.goldHistory}
                      blueTag={blueTeam.tag}
                      redTag={redTeam.tag}
                    />
                  </div>
                </div>

                {/* Right 7 cols: Touchline Shouts + Scoreboard + Live Commentary */}
                <div className="lg:col-span-7 space-y-4">
                  {/* FM Touchline Shouts & Live Tactical Switches */}
                  {phase === 'LIVE' && userTacticsLive && (
                    <div className="bg-[#121722] border border-white/[0.08] rounded-lg p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-white">
                          <Megaphone className="w-4 h-4 text-[#E4BD67]" />
                          Kenar Yönetimi & Canlı Taktik Müdahale
                        </div>
                        <span className="text-[11px] font-mono-num text-slate-400">
                          {shoutCooldownLeft > 0
                            ? `Sonraki talimat: ${shoutCooldownLeft} dk`
                            : 'Talimat hazır'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {TOUCHLINE_SHOUTS.map((sh) => (
                          <button
                            key={sh.id}
                            disabled={shoutCooldownLeft > 0}
                            onClick={() => handleLiveShout(sh.id)}
                            title={sh.shortDesc}
                            className={`px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors whitespace-nowrap ${
                              shoutCooldownLeft > 0
                                ? 'border-white/[0.05] bg-[#0B0E14]/50 text-slate-600 cursor-not-allowed'
                                : 'border-[#C89B3C]/40 bg-[#C89B3C]/10 hover:bg-[#C89B3C]/25 text-[#E4BD67] cursor-pointer'
                            }`}
                          >
                            {sh.label}
                          </button>
                        ))}
                      </div>

                      {/* Real-Time Tactical & Teamplay Impact Telemetry Strip */}
                      {liveState.tacticalEdge && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/[0.06] text-[11px] font-mono-num">
                          <div>
                            <div className="text-slate-500">Taktik Etki (M / K)</div>
                            <div className="font-bold mt-0.5">
                              <span className="text-sky-400">
                                {liveState.tacticalEdge.blueTactic >= 0 ? `+${liveState.tacticalEdge.blueTactic}` : liveState.tacticalEdge.blueTactic}
                              </span>
                              <span className="text-slate-600"> / </span>
                              <span className="text-rose-400">
                                {liveState.tacticalEdge.redTactic >= 0 ? `+${liveState.tacticalEdge.redTactic}` : liveState.tacticalEdge.redTactic}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-500">Takım Kimyası (M / K)</div>
                            <div className="font-bold mt-0.5">
                              <span className="text-sky-400">
                                {liveState.tacticalEdge.blueChem >= 0 ? `+${liveState.tacticalEdge.blueChem}` : liveState.tacticalEdge.blueChem}
                              </span>
                              <span className="text-slate-600"> / </span>
                              <span className="text-rose-400">
                                {liveState.tacticalEdge.redChem >= 0 ? `+${liveState.tacticalEdge.redChem}` : liveState.tacticalEdge.redChem}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-500">Karşı Taktik / Odak</div>
                            <div className="font-bold text-[#E4BD67] mt-0.5">
                              {userSide === 'blue'
                                ? `${liveState.tacticalEdge.blueCounter >= 0 ? '+' : ''}${liveState.tacticalEdge.blueCounter} · ${liveState.tacticalEdge.blueLaneFocus >= 0 ? '+' : ''}${liveState.tacticalEdge.blueLaneFocus}`
                                : `${liveState.tacticalEdge.redCounter >= 0 ? '+' : ''}${liveState.tacticalEdge.redCounter} · ${liveState.tacticalEdge.redLaneFocus >= 0 ? '+' : ''}${liveState.tacticalEdge.redLaneFocus}`}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-500">Kenar İvmesi</div>
                            <div className="font-bold text-emerald-400 mt-0.5">
                              {(() => {
                                const sh = userSide === 'blue' ? liveState.blueShoutBoost : liveState.redShoutBoost;
                                if (sh && liveState.minute <= sh.until) {
                                  return `+${sh.power} (${sh.until - liveState.minute} dk)`;
                                }
                                return 'Pasif';
                              })()}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-white/[0.06] text-xs">
                        <div>
                          <label className="text-[10px] text-slate-500 flex items-center gap-1 mb-1">
                            <Sliders className="w-3 h-3" /> Oyun Planı
                          </label>
                          <select
                            value={userTacticsLive.gameplan}
                            onChange={(e) => handleLiveTacticChange('gameplan', e.target.value)}
                            className="w-full bg-[#0B0E14] border border-white/[0.1] rounded px-2 py-1.5 text-xs text-white"
                          >
                            <option value="aggressive">Agresif Tempo</option>
                            <option value="balanced">Dengeli Kontrol</option>
                            <option value="scaling">Geç Oyun</option>
                            <option value="split">1-3-1 Ayrık</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 mb-1 block">Koridor Odağı</label>
                          <select
                            value={userTacticsLive.laneFocus}
                            onChange={(e) => handleLiveTacticChange('laneFocus', e.target.value)}
                            className="w-full bg-[#0B0E14] border border-white/[0.1] rounded px-2 py-1.5 text-xs text-white"
                          >
                            <option value="TOP">Üst Koridor</option>
                            <option value="MID">Orta Koridor</option>
                            <option value="BOT">Alt Koridor</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 mb-1 block">Görev Önceliği</label>
                          <select
                            value={userTacticsLive.objective}
                            onChange={(e) => handleLiveTacticChange('objective', e.target.value)}
                            className="w-full bg-[#0B0E14] border border-white/[0.1] rounded px-2 py-1.5 text-xs text-white"
                          >
                            <option value="dragon">Ejder Yığma</option>
                            <option value="baron">Baron / Kurtçuk</option>
                            <option value="towers">Kule Kuşatması</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 mb-1 block">Öndeyken</label>
                          <select
                            value={userTacticsLive.aheadPlan || 'choke'}
                            onChange={(e) => handleLiveTacticChange('aheadPlan', e.target.value)}
                            className="w-full bg-[#0B0E14] border border-white/[0.1] rounded px-2 py-1.5 text-xs text-white"
                          >
                            <option value="choke">Görüş Boğma</option>
                            <option value="split131">1-3-1 Baskı</option>
                            <option value="dive">Kule Altı Dive</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 mb-1 block">Gerideyken</label>
                          <select
                            value={userTacticsLive.behindPlan || 'scale'}
                            onChange={(e) => handleLiveTacticChange('behindPlan', e.target.value)}
                            className="w-full bg-[#0B0E14] border border-white/[0.1] rounded px-2 py-1.5 text-xs text-white"
                          >
                            <option value="scale">Ölçeklen</option>
                            <option value="crossmap">Çapraz Takas</option>
                            <option value="pick">Pusu & Pick</option>
                          </select>
                        </div>
                      </div>

                      {shoutNotice && (
                        <div className="text-xs text-[#E4BD67] border-t border-white/[0.06] pt-2">
                          {shoutNotice}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Post-Game Transition Banner (Bo3 / Bo5 next game) */}
                  {phase === 'POST_GAME' && (
                    <div className="bg-[#121722] border border-[#C89B3C]/50 rounded-lg p-5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <div className="text-xs text-[#E4BD67] font-semibold">
                            Oyun {gameNum} Tamamlandı · Seri Durumu {blueScore} - {redScore}
                          </div>
                          <div className="font-display text-2xl font-bold text-white mt-0.5">
                            {(liveState.winner === 'blue' ? blueTeam.name : redTeam.name)} Galip Geldi · MVP: {liveState.mvp?.name}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setGameNum((g) => g + 1);
                            setPhase('TEAM_TALK');
                          }}
                          className="px-5 py-2.5 rounded-md bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] text-xs font-bold cursor-pointer whitespace-nowrap"
                        >
                          Oyun {gameNum + 1} Draftına Geç
                        </button>
                      </div>
                      {liveState.coachReport && (
                        <div className="pt-3 border-t border-white/[0.08] space-y-1 text-xs text-slate-300">
                          {typeof liveState.coachReport === 'string' ? (
                            <div>{liveState.coachReport}</div>
                          ) : (
                            (liveState.coachReport.notes || []).map((note: string, idx: number) => (
                              <div key={idx} className="text-slate-300">
                                · {note}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Live 5v5 Scoreboard / Damage & Lane Gold Diff Switcher */}
                  <div className="bg-[#121722] border border-white/[0.08] rounded-lg overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-white/[0.08] flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setStatsTab('scoreboard')}
                          className={`cursor-pointer ${
                            statsTab === 'scoreboard' ? 'text-[#E4BD67]' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Skor Tablosu
                        </button>
                        <button
                          onClick={() => setStatsTab('damage')}
                          className={`cursor-pointer ${
                            statsTab === 'damage' ? 'text-[#E4BD67]' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Hasar & Koridor Farkı
                        </button>
                      </div>
                      <span className="font-mono-num text-[11px] text-slate-500">
                        {statsTab === 'scoreboard' ? 'K/D/A · CS · Altın · Not' : 'Hasar · Koridor Altın Farkı · Görüş'}
                      </span>
                    </div>

                    {statsTab === 'scoreboard' ? (
                      <div className="divide-y divide-white/[0.06]">
                        {ROLES.map((role: string) => {
                          const bp = liveState.bluePlayers.find((p: any) => p.role === role);
                          const rp = liveState.redPlayers.find((p: any) => p.role === role);
                          return (
                            <div
                              key={role}
                              className="grid grid-cols-11 items-center px-3 py-2 text-xs gap-1 hover:bg-white/[0.02]"
                            >
                              <div className="col-span-5 flex items-center justify-between gap-2 min-w-0">
                                <div className="min-w-0">
                                  <div className="font-semibold text-white truncate">{bp?.name}</div>
                                  <div className="text-[10px] text-sky-400 truncate">{bp?.champName}</div>
                                </div>
                                <div className="text-right font-mono-num shrink-0">
                                  <div className="text-slate-200 font-semibold">
                                    {bp?.kills}/{bp?.deaths}/{bp?.assists}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {bp?.cs} CS · {(bp?.gold / 1000).toFixed(1)}k ·{' '}
                                    <span className="text-[#E4BD67]">{bp?.rating?.toFixed(1)}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="col-span-1 text-center font-mono-num text-[10px] font-bold text-slate-500">
                                {role}
                              </div>

                              <div className="col-span-5 flex items-center justify-between gap-2 min-w-0">
                                <div className="text-left font-mono-num shrink-0">
                                  <div className="text-slate-200 font-semibold">
                                    {rp?.kills}/{rp?.deaths}/{rp?.assists}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    <span className="text-[#E4BD67]">{rp?.rating?.toFixed(1)}</span> ·{' '}
                                    {(rp?.gold / 1000).toFixed(1)}k · {rp?.cs} CS
                                  </div>
                                </div>
                                <div className="min-w-0 text-right">
                                  <div className="font-semibold text-white truncate">{rp?.name}</div>
                                  <div className="text-[10px] text-rose-400 truncate">{rp?.champName}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="divide-y divide-white/[0.06]">
                        {(() => {
                          const maxDmg = Math.max(
                            1,
                            ...liveState.bluePlayers.map((p: any) => p.dmg || 0),
                            ...liveState.redPlayers.map((p: any) => p.dmg || 0)
                          );
                          return ROLES.map((role: string) => {
                            const bp = liveState.bluePlayers.find((p: any) => p.role === role);
                            const rp = liveState.redPlayers.find((p: any) => p.role === role);
                            const laneGoldDiff = Math.round((bp?.gold || 0) - (rp?.gold || 0));
                            const bPct = Math.round(((bp?.dmg || 0) / maxDmg) * 100);
                            const rPct = Math.round(((rp?.dmg || 0) / maxDmg) * 100);
                            const bKp = liveState.blueKills > 0 ? Math.round((((bp?.kills || 0) + (bp?.assists || 0)) / liveState.blueKills) * 100) : 0;
                            const rKp = liveState.redKills > 0 ? Math.round((((rp?.kills || 0) + (rp?.assists || 0)) / liveState.redKills) * 100) : 0;
                            return (
                              <div key={role} className="grid grid-cols-11 items-center px-3 py-2 text-xs gap-2">
                                <div className="col-span-5 space-y-1">
                                  <div className="flex justify-between text-[11px] font-mono-num">
                                    <span className="font-semibold text-white truncate">{bp?.name}</span>
                                    <span className="text-sky-400">
                                      {((bp?.dmg || 0) / 1000).toFixed(1)}k · KP %{bKp} · V{Math.round(bp?.vision || 0)}
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full bg-[#0B0E14] rounded-full overflow-hidden">
                                    <div className="h-full bg-sky-400 rounded-full" style={{ width: `${bPct}%` }} />
                                  </div>
                                </div>

                                <div className="col-span-1 text-center font-mono-num">
                                  <div className="text-[10px] text-slate-500 font-bold">{role}</div>
                                  <div
                                    className={`text-[10px] font-bold ${
                                      laneGoldDiff > 150 ? 'text-sky-400' : laneGoldDiff < -150 ? 'text-rose-400' : 'text-slate-500'
                                    }`}
                                  >
                                    {laneGoldDiff >= 0 ? `+${laneGoldDiff}` : laneGoldDiff}
                                  </div>
                                </div>

                                <div className="col-span-5 space-y-1">
                                  <div className="flex justify-between text-[11px] font-mono-num">
                                    <span className="text-rose-400">
                                      V{Math.round(rp?.vision || 0)} · KP %{rKp} · {((rp?.dmg || 0) / 1000).toFixed(1)}k
                                    </span>
                                    <span className="font-semibold text-white truncate">{rp?.name}</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-[#0B0E14] rounded-full overflow-hidden flex justify-end">
                                    <div className="h-full bg-rose-400 rounded-full" style={{ width: `${rPct}%` }} />
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Live Play-by-Play Commentary Feed */}
                  <div className="bg-[#121722] border border-white/[0.08] rounded-lg p-4">
                    <div className="text-xs font-semibold text-slate-300 mb-2.5">Canlı Maç Anlatımı</div>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {[...(liveState.events || [])].reverse().map((ev: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 text-xs py-1.5 border-b border-white/[0.05] last:border-0"
                        >
                          <span className="font-mono-num text-[11px] text-[#E4BD67] w-9 shrink-0">
                            {ev.min}'
                          </span>
                          <span className="font-mono-num text-[10px] text-slate-400 w-24 shrink-0 truncate">
                            {ev.tag}
                          </span>
                          <span className="text-slate-200 leading-snug">{ev.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STAGE 4: SERIES COMPLETE + POST-MATCH LOCKER ROOM */}
          {phase === 'SERIES_DONE' && liveState && (
            <div className="max-w-3xl mx-auto bg-[#121722] border border-[#C89B3C]/50 rounded-lg p-8 space-y-6 mt-4">
              <div className="text-center space-y-2 border-b border-white/[0.08] pb-6">
                <Trophy className="w-10 h-10 text-[#E4BD67] mx-auto" />
                <div className="text-xs text-[#E4BD67] font-semibold">Seri Sonucu</div>
                <h2 className="font-display text-4xl font-extrabold text-white">
                  {blueTeam.tag} {blueScore} - {redScore} {redTeam.tag}
                </h2>
                <p className="text-sm text-slate-300">
                  {(blueScore > redScore ? blueTeam.id : redTeam.id) === careerState.userTeamId
                    ? 'Tebrikler Koç! Kulübün sahneden zaferle ayrıldı.'
                    : 'Zorlu bir seriydi. Analiz ekibiyle verileri inceleyip bir sonraki maça hazırlan.'}
                </p>
                {liveState.mvp && (
                  <div className="text-xs text-slate-400 font-mono-num pt-1">
                    Son Oyun MVP: <strong className="text-white">{liveState.mvp.name}</strong> ({liveState.mvp.champName}) ·{' '}
                    {liveState.mvp.kills}/{liveState.mvp.deaths}/{liveState.mvp.assists} · Not {liveState.mvp.rating?.toFixed(1)}
                  </div>
                )}
              </div>

              {/* Post-Match Locker Room Reaction */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-300">
                  Maç Sonu Soyunma Odası Konuşması (FM)
                </div>
                {!postTalkDone ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      onClick={() => handlePostMatchTalk('praise')}
                      className="p-3.5 rounded-md border border-white/[0.1] bg-[#171E2C] hover:border-emerald-400/60 text-left cursor-pointer"
                    >
                      <div className="text-xs font-bold text-emerald-400">Takımı Tebrik Et</div>
                      <div className="text-[11px] text-slate-400 mt-1">Moral ve soyunma odası bağını güçlendirir.</div>
                    </button>
                    <button
                      onClick={() => handlePostMatchTalk('criticize')}
                      className="p-3.5 rounded-md border border-white/[0.1] bg-[#171E2C] hover:border-rose-400/60 text-left cursor-pointer"
                    >
                      <div className="text-xs font-bold text-rose-400">Sert Eleştiri Yap</div>
                      <div className="text-[11px] text-slate-400 mt-1">Hatalara dikkat çek, disiplini ve odağı keskinleştir.</div>
                    </button>
                    <button
                      onClick={() => handlePostMatchTalk('calm')}
                      className="p-3.5 rounded-md border border-white/[0.1] bg-[#171E2C] hover:border-[#C89B3C]/60 text-left cursor-pointer"
                    >
                      <div className="text-xs font-bold text-[#E4BD67]">Sakin & Analitik Kal</div>
                      <div className="text-[11px] text-slate-400 mt-1">Takım sinerjisini ve tutarlılığı dengede tutar.</div>
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-emerald-400 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Maç sonu konuşması soyunma odasına iletildi.
                  </div>
                )}
              </div>

              {/* Post-Match Coach Analysis Summary */}
              {liveState.coachReport && (
                <div className="border-t border-b border-white/[0.08] py-4 space-y-1.5 text-xs">
                  <div className="font-semibold text-[#E4BD67]">Analist Masası Maç Özeti</div>
                  {typeof liveState.coachReport === 'string' ? (
                    <div className="text-slate-300">{liveState.coachReport}</div>
                  ) : (
                    (liveState.coachReport.notes || []).map((note: string, idx: number) => (
                      <div key={idx} className="text-slate-300">
                        · {note}
                      </div>
                    ))
                  )}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() =>
                    onSeriesFinished(
                      `${blueTeam.tag} ${blueScore}-${redScore} ${redTeam.tag} serisi tamamlandı.`
                    )
                  }
                  className="px-6 py-2.5 rounded-md bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] text-xs font-bold cursor-pointer"
                >
                  Genel Bakışa Dön
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

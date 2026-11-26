import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Mail,
  Users,
  Compass,
  Dumbbell,
  ArrowRightLeft,
  BarChart3,
  Trophy,
  Building2,
  Volume2,
  VolumeX,
  Save,
  Flame,
  Play,
  Home,
  Search,
  Database,
} from 'lucide-react';
import {
  createNewCareer,
  ensureCalendarState,
  ensureTeamExtras,
  getPhaseLabel,
  getUserNextMatch,
  quickSimSeries,
  advanceOneDay,
  skipToNextKeyDay,
  advanceWeekOrRound,
  formatTurkishDate,
  formatMoney,
  saveGame,
  loadFromSlot,
} from './engine/gameEngine.js';
import { soundFx } from './engine/soundFx';
import { ActiveSeriesContext, NavTab } from './types/game';
import { TeamCrest } from './components/shared/Visuals';
import { StartScreen } from './components/StartScreen';
import { DashboardView } from './components/DashboardView';
import { InboxView } from './components/InboxView';
import { SquadView } from './components/SquadView';
import { TacticsView } from './components/TacticsView';
import { TrainingClubView } from './components/TrainingClubView';
import { TransfersScoutingView } from './components/TransfersScoutingView';
import { DataHubView } from './components/DataHubView';
import { LeagueView } from './components/LeagueView';
import { MatchArenaModal } from './components/MatchArenaModal';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { PressConferenceModal } from './components/PressConferenceModal';
import { SaveSlotsModal } from './components/SaveSlotsModal';
import { WorldsMayhemModal } from './components/WorldsMayhemModal';
import { DatabaseEditorModal } from './components/DatabaseEditorModal';

const NAV_ITEMS: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
  { id: 'inbox', label: 'Gelen Kutusu', icon: Mail },
  { id: 'squad', label: 'Kadro & Dinamik', icon: Users },
  { id: 'tactics', label: 'Taktik Tahtası', icon: Compass },
  { id: 'training', label: 'Antrenman & Scrim', icon: Dumbbell },
  { id: 'transfers', label: 'Transfer & Scout', icon: ArrowRightLeft },
  { id: 'datahub', label: 'Veri Merkezi', icon: BarChart3 },
  { id: 'league', label: 'Lig & Turnuva', icon: Trophy },
  { id: 'club', label: 'Kulüp & Finans', icon: Building2 },
];

export default function App() {
  const [careerState, setCareerState] = useState<any>(null);
  const [revision, setRevision] = useState(0);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [activeSeries, setActiveSeries] = useState<ActiveSeriesContext | null>(null);
  const [pressOpen, setPressOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [mayhemOpen, setMayhemOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [muted, setMuted] = useState(() => soundFx.isMuted());
  const [toast, setToast] = useState<string | null>(null);
  const [globalQuery, setGlobalQuery] = useState('');

  useEffect(() => {
    if (careerState?.pendingCelebration) {
      if (careerState.pendingCelebration.isChampion) soundFx.trophyFanfare();
      else soundFx.objectiveSecured();
    }
  }, [careerState?.pendingCelebration]);

  const showToast = (msg?: string) => {
    if (!msg) return;
    setToast(msg);
    window.setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 4200);
  };

  const commitState = (st: any, msg?: string) => {
    if (!st) return;
    ensureCalendarState(st);
    const ut = st.teams.find((t: any) => t.id === st.userTeamId);
    if (ut) ensureTeamExtras(ut);
    saveGame(st);
    setCareerState(st);
    setRevision((r) => r + 1);
    if (msg) showToast(msg);
  };

  const handleStartCareer = (teamId: string, managerName: string) => {
    const st = createNewCareer(teamId, managerName);
    ensureCalendarState(st);
    setActiveTab('dashboard');
    commitState(st, `Yeni kariyer başladı! ${managerName} göreve getirildi.`);
  };

  const handleResumeAutoSave = () => {
    const loaded = loadFromSlot('autosave');
    if (loaded) {
      ensureCalendarState(loaded);
      setActiveTab('dashboard');
      commitState(loaded, 'Otomatik kayıt yüklendi.');
    } else {
      showToast('Otomatik kayıt bulunamadı.');
    }
  };

  const handleLoadState = (loaded: any, msg: string) => {
    ensureCalendarState(loaded);
    setActiveTab('dashboard');
    commitState(loaded, msg);
  };

  const userTeam = useMemo(() => {
    if (!careerState) return null;
    return careerState.teams.find((t: any) => t.id === careerState.userTeamId) || careerState.teams[0];
  }, [careerState, revision]);

  const nextMatch = useMemo(() => {
    if (!careerState) return null;
    return getUserNextMatch(careerState);
  }, [careerState, revision]);

  const unreadInboxCount = useMemo(() => {
    if (!careerState?.inbox) return 0;
    return careerState.inbox.filter((m: any) => !m.read).length;
  }, [careerState, revision]);

  const handleOpenMatchArena = (match: any) => {
    if (!careerState || !userTeam) return;
    const blueTeam = careerState.teams.find((t: any) => t.id === match.blueId);
    const redTeam = careerState.teams.find((t: any) => t.id === match.redId);
    if (!blueTeam || !redTeam) return;
    const userSide: 'blue' | 'red' = blueTeam.id === userTeam.id ? 'blue' : 'red';
    const highStakes = !['SPRING_SPLIT', 'SUMMER_SPLIT'].includes(careerState.phase);
    soundFx.draftLock();
    setActiveSeries({
      match,
      blueTeam,
      redTeam,
      userSide,
      bo: match.bestOf || match.bo || 3,
      highStakes,
    });
  };

  const handleQuickSim = (match: any) => {
    if (!careerState) return;
    soundFx.click();
    quickSimSeries(careerState, match);
    const bTag = careerState.teams.find((t: any) => t.id === match.blueId)?.tag || 'Mavi';
    const rTag = careerState.teams.find((t: any) => t.id === match.redId)?.tag || 'Kırmızı';
    commitState(
      careerState,
      `Maç hızlı simüle edildi: ${bTag} ${match.blueScore ?? 0} - ${match.redScore ?? 0} ${rTag}`
    );
  };

  const handleAdvanceDay = () => {
    if (!careerState) return;
    soundFx.click();
    const res = advanceOneDay(careerState);
    commitState(careerState, res?.msg);
  };

  const handleSkipToKeyDay = () => {
    if (!careerState) return;
    soundFx.click();
    const res = skipToNextKeyDay(careerState);
    commitState(careerState, res?.msg);
  };

  const handleAdvanceWeek = () => {
    if (!careerState) return;
    soundFx.objectiveSecured();
    const msg = advanceWeekOrRound(careerState);
    commitState(careerState, typeof msg === 'string' ? msg : 'Yeni haftaya geçildi.');
  };

  const handlePrimaryContinue = () => {
    if (!careerState) return;
    if (nextMatch) {
      handleOpenMatchArena(nextMatch);
    } else {
      handleAdvanceWeek();
    }
  };

  // Classic FM Spacebar shortcut to Continue / Match Day (when no modal or input is focused)
  useEffect(() => {
    if (!careerState || activeSeries || selectedPlayerId || pressOpen || saveModalOpen || mayhemOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return;
      if (e.code === 'Space') {
        e.preventDefault();
        handlePrimaryContinue();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [careerState, revision, activeSeries, selectedPlayerId, pressOpen, saveModalOpen, mayhemOpen, nextMatch]);

  const globalSearchResults = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (!careerState || q.length < 2) return [];
    const teamMap = new Map<string, any>(careerState.teams.map((t: any) => [t.id, t]));
    return careerState.players
      .filter((p: any) => {
        const tm = p.teamId ? teamMap.get(p.teamId) : null;
        return (
          p.name.toLowerCase().includes(q) ||
          p.role.toLowerCase().includes(q) ||
          (tm && (tm.tag.toLowerCase().includes(q) || tm.name.toLowerCase().includes(q)))
        );
      })
      .sort((a: any, b: any) => b.ovr - a.ovr)
      .slice(0, 7)
      .map((p: any) => ({
        player: p,
        team: p.teamId ? teamMap.get(p.teamId) : null,
      }));
  }, [careerState, globalQuery, revision]);

  const toggleSound = () => {
    const nextMuted = soundFx.toggleMute();
    setMuted(nextMuted);
  };

  // START SCREEN WHEN NO ACTIVE CAREER
  if (!careerState || !userTeam) {
    return (
      <>
        <StartScreen
          onStartCareer={handleStartCareer}
          onResumeAutoSave={handleResumeAutoSave}
          onOpenSaveManager={() => setSaveModalOpen(true)}
          onOpenMayhem={() => setMayhemOpen(true)}
        />
        {saveModalOpen && (
          <SaveSlotsModal
            currentState={null}
            onLoadState={handleLoadState}
            onToast={showToast}
            onClose={() => setSaveModalOpen(false)}
          />
        )}
        {mayhemOpen && <WorldsMayhemModal onClose={() => setMayhemOpen(false)} />}
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 bg-[#171E2C] border border-[#C89B3C]/60 text-white text-xs font-medium px-4 py-3 rounded-md shadow-xl max-w-sm">
            {toast}
          </div>
        )}
      </>
    );
  }

  // MAIN FOOTBALL MANAGER WORKSPACE SHELL
  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#E6ECF5] flex flex-col lg:flex-row">
      {/* Left Persistent FM Sidebar (248px) */}
      <aside className="lg:w-[248px] shrink-0 bg-[#0E121B] border-b lg:border-b-0 lg:border-r border-white/[0.08] flex flex-col justify-between">
        <div>
          {/* Club Identity Header */}
          <div className="h-16 px-4 border-b border-white/[0.08] flex items-center gap-3">
            <TeamCrest tag={userTeam.tag} color={userTeam.color} color2={userTeam.color2} size="sm" />
            <div className="min-w-0">
              <div className="font-display text-lg font-extrabold text-white tracking-wide leading-none truncate">
                {userTeam.name}
              </div>
              <div className="text-[11px] text-slate-400 font-mono-num mt-0.5 truncate">
                {userTeam.region} · S{careerState.season}
              </div>
            </div>
          </div>

          {/* Primary Management Navigation */}
          <nav className="p-2.5 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
            {NAV_ITEMS.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    soundFx.click();
                    setActiveTab(item.id);
                  }}
                  className={`px-3 py-2.5 rounded-md text-xs font-semibold flex items-center justify-between gap-2.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#171E2C] text-[#E4BD67] border border-white/[0.08]'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </span>
                  {item.id === 'inbox' && unreadInboxCount > 0 && (
                    <span className="font-mono-num text-[11px] font-bold text-[#E4BD67]">{unreadInboxCount}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Utility Links */}
        <div className="hidden lg:flex flex-col gap-1 p-3 border-t border-white/[0.08] text-xs">
          <button
            onClick={() => setMayhemOpen(true)}
            className="px-3 py-2 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.03] flex items-center gap-2 cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-[#E4BD67]" />
            Worlds Mayhem
          </button>
          <button
            onClick={() => setEditorOpen(true)}
            className="px-3 py-2 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.03] flex items-center gap-2 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-[#E4BD67]" />
            Veritabanı Editörü
          </button>
          <button
            onClick={() => setSaveModalOpen(true)}
            className="px-3 py-2 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.03] flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Kayıt Slotları
          </button>
          <button
            onClick={() => setCareerState(null)}
            className="px-3 py-2 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.03] flex items-center gap-2 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            Ana Menüye Dön
          </button>
        </div>
      </aside>

      {/* Right Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Contextual Workspace Header (3-Zone Contract) */}
        <header className="h-16 px-5 lg:px-8 border-b border-white/[0.08] bg-[#0B0E14]/95 backdrop-blur sticky top-0 z-20 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-400 truncate">
            <span className="text-white font-semibold">{userTeam.name}</span>
            <span className="mx-2">/</span>
            <span>{NAV_ITEMS.find((i) => i.id === activeTab)?.label}</span>
            <span className="hidden xl:inline mx-2">·</span>
            <span className="hidden xl:inline font-mono-num">
              {formatTurkishDate(careerState.currentDate)} ({getPhaseLabel(careerState.phase)} H{careerState.week})
            </span>
          </div>

          {/* FM Global Player & Club Search */}
          <div className="relative hidden md:block w-64 lg:w-72 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              placeholder="Oyuncu veya kulüp ara (Faker, T1)..."
              className="w-full bg-[#121722] border border-white/[0.1] rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-[#C89B3C]"
            />
            {globalSearchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#121722] border border-white/[0.12] rounded-md shadow-2xl overflow-hidden z-40 divide-y divide-white/[0.06]">
                {globalSearchResults.map(({ player, team }: any) => (
                  <button
                    key={player.id}
                    onClick={() => {
                      soundFx.click();
                      setSelectedPlayerId(player.id);
                      setGlobalQuery('');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-[#171E2C] flex items-center justify-between gap-2 text-xs cursor-pointer"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-white">{player.name}</span>{' '}
                      <span className="text-[11px] text-slate-400">
                        {player.role} · {team ? `${team.tag} (${team.region})` : 'Serbest'}
                      </span>
                    </div>
                    <span className="font-mono-num font-bold text-[#E4BD67] shrink-0">OVR {player.ovr}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={toggleSound}
              title={muted ? 'Sesi Aç' : 'Sesi Kapat'}
              className="p-2 rounded-md border border-white/[0.1] text-slate-400 hover:text-white cursor-pointer"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setSaveModalOpen(true)}
              title="Kayıt Slotları"
              className="lg:hidden p-2 rounded-md border border-white/[0.1] text-slate-400 hover:text-white cursor-pointer"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrimaryContinue}
              title="Kısayol: Space"
              className="px-4 py-2 rounded-md bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {nextMatch ? 'Maça Çık' : 'Devam Et'}
            </button>
          </div>
        </header>

        {/* Active Viewport Content */}
        <main className="flex-1 p-5 lg:p-8 max-w-[1400px] w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              state={careerState}
              userTeam={userTeam}
              onPlayMatch={handleOpenMatchArena}
              onQuickSimMatch={handleQuickSim}
              onAdvanceDay={handleAdvanceDay}
              onSkipToKeyDay={handleSkipToKeyDay}
              onAdvanceWeek={handleAdvanceWeek}
              onOpenPress={() => setPressOpen(true)}
              onNavigate={setActiveTab}
              onUpdate={(msg) => commitState(careerState, msg)}
            />
          )}

          {activeTab === 'inbox' && (
            <InboxView state={careerState} onUpdate={() => commitState(careerState)} />
          )}

          {activeTab === 'squad' && (
            <SquadView
              state={careerState}
              userTeam={userTeam}
              onSelectPlayer={(pid) => setSelectedPlayerId(pid)}
              onUpdate={(msg) => commitState(careerState, msg)}
            />
          )}

          {activeTab === 'tactics' && (
            <TacticsView
              state={careerState}
              userTeam={userTeam}
              onUpdate={(msg) => commitState(careerState, msg)}
            />
          )}

          {activeTab === 'training' && (
            <TrainingClubView
              mode="training"
              state={careerState}
              userTeam={userTeam}
              onSelectPlayer={(pid) => setSelectedPlayerId(pid)}
              onUpdate={(msg) => commitState(careerState, msg)}
            />
          )}

          {activeTab === 'transfers' && (
            <TransfersScoutingView
              state={careerState}
              userTeam={userTeam}
              onSelectPlayer={(pid) => setSelectedPlayerId(pid)}
              onUpdate={(msg) => commitState(careerState, msg)}
            />
          )}

          {activeTab === 'datahub' && (
            <DataHubView
              state={careerState}
              userTeam={userTeam}
              onSelectPlayer={(pid) => setSelectedPlayerId(pid)}
            />
          )}

          {activeTab === 'league' && <LeagueView state={careerState} userTeam={userTeam} />}

          {activeTab === 'club' && (
            <TrainingClubView
              mode="club"
              state={careerState}
              userTeam={userTeam}
              onSelectPlayer={(pid) => setSelectedPlayerId(pid)}
              onUpdate={(msg) => commitState(careerState, msg)}
            />
          )}
        </main>
      </div>

      {/* MODALS */}
      {activeSeries && (
        <MatchArenaModal
          careerState={careerState}
          seriesCtx={activeSeries}
          onSeriesFinished={(summary) => {
            setActiveSeries(null);
            commitState(careerState, summary);
          }}
          onAbort={() => setActiveSeries(null)}
        />
      )}

      {selectedPlayerId && (
        <PlayerProfileModal
          state={careerState}
          playerId={selectedPlayerId}
          onUpdate={(msg) => commitState(careerState, msg)}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}

      {pressOpen && (
        <PressConferenceModal
          state={careerState}
          nextMatch={nextMatch}
          userTeam={userTeam}
          onComplete={(msg) => {
            setPressOpen(false);
            commitState(careerState, msg);
          }}
          onClose={() => setPressOpen(false)}
        />
      )}

      {saveModalOpen && (
        <SaveSlotsModal
          currentState={careerState}
          onLoadState={handleLoadState}
          onToast={showToast}
          onClose={() => setSaveModalOpen(false)}
        />
      )}

      {mayhemOpen && <WorldsMayhemModal onClose={() => setMayhemOpen(false)} />}

      {editorOpen && (
        <DatabaseEditorModal
          state={careerState}
          onUpdate={(msg) => commitState(careerState, msg)}
          onClose={() => setEditorOpen(false)}
        />
      )}

      {/* Trophy & Prize Celebration Modal */}
      {careerState.pendingCelebration && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#121722] border border-[#C89B3C]/60 rounded-lg p-7 text-center space-y-5 shadow-2xl">
            <Trophy
              className={`w-14 h-14 mx-auto ${
                careerState.pendingCelebration.isChampion ? 'text-[#E4BD67]' : 'text-slate-300'
              }`}
            />
            <div className="space-y-1">
              <div className="text-xs font-semibold text-[#E4BD67]">
                {careerState.pendingCelebration.tournament}
              </div>
              <h2 className="font-display text-3xl font-extrabold text-white tracking-wide">
                {careerState.pendingCelebration.placement}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                {careerState.pendingCelebration.subtitle}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 bg-[#0B0E14] border border-white/[0.08] rounded-md p-3.5 font-mono-num text-xs">
              <div>
                <div className="text-slate-500">Turnuva Ödülü</div>
                <div className="text-base font-bold text-emerald-400">
                  +{formatMoney(careerState.pendingCelebration.prizeMoney || 0)}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Turnuva MVP</div>
                <div className="text-sm font-bold text-[#E4BD67] truncate">
                  {careerState.pendingCelebration.mvp || '—'}
                </div>
              </div>
            </div>
            {(careerState.pendingCelebration.sponsorBonus || 0) > 0 && (
              <div className="text-xs font-mono-num text-emerald-400">
                Sponsor Hedef Primi: +{formatMoney(careerState.pendingCelebration.sponsorBonus)}
              </div>
            )}
            <button
              onClick={() => {
                soundFx.click();
                careerState.pendingCelebration = null;
                commitState(careerState);
              }}
              className="w-full py-2.5 rounded-md bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] text-xs font-bold cursor-pointer"
            >
              Ödülü Topla ve Devam Et
            </button>
          </div>
        </div>
      )}

      {/* Clean Toast Feedback */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#171E2C] border border-[#C89B3C]/60 text-white text-xs font-medium px-4 py-3 rounded-md shadow-xl max-w-sm">
          {toast}
        </div>
      )}
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { Flame, FolderOpen, Play, ArrowRight, Trophy, Users, Wallet, ShieldCheck } from 'lucide-react';
import { REGIONS, createInitialDatabase } from '../data/teamsAndPlayers.js';
import { formatMoney, listSaveSlots } from '../engine/gameEngine.js';
import { MEDIA_ASSETS } from '../assets/media';
import { SafeImage, TeamCrest, OvrValue } from './shared/Visuals';
import { soundFx } from '../engine/soundFx';

interface StartScreenProps {
  onStartCareer: (teamId: string, managerName: string) => void;
  onResumeAutoSave: () => void;
  onOpenSaveManager: () => void;
  onOpenMayhem: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStartCareer,
  onResumeAutoSave,
  onOpenSaveManager,
  onOpenMayhem,
}) => {
  const previewDB = useMemo(() => createInitialDatabase(), []);
  const slots = useMemo(() => listSaveSlots(), []);
  const autoRec = slots.find((s: any) => s.slotId === 'autosave')?.record;
  const filledCount = slots.filter((s: any) => s.record).length;

  const [selectedRegion, setSelectedRegion] = useState<string>('LCK');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('t1');
  const [managerName, setManagerName] = useState<string>(() => {
    try {
      return localStorage.getItem('lol_mgr_nickname') || 'Baş Koç';
    } catch {
      return 'Baş Koç';
    }
  });

  const regionTeams = useMemo(
    () => previewDB.teams.filter((t: any) => t.region === selectedRegion),
    [previewDB.teams, selectedRegion]
  );

  const selectedTeam = useMemo(
    () => previewDB.teams.find((t: any) => t.id === selectedTeamId) || regionTeams[0],
    [previewDB.teams, selectedTeamId, regionTeams]
  );

  const selectedRoster = useMemo(
    () => previewDB.players.filter((p: any) => p.teamId === selectedTeam?.id),
    [previewDB.players, selectedTeam]
  );

  const getTeamAvgOvr = (teamId: string) => {
    const r = previewDB.players.filter((p: any) => p.teamId === teamId);
    if (!r.length) return 70;
    return Math.round(r.reduce((s: number, p: any) => s + p.ovr, 0) / r.length);
  };

  const handleRegionChange = (regId: string) => {
    soundFx.click();
    setSelectedRegion(regId);
    const first = previewDB.teams.find((t: any) => t.region === regId);
    if (first) setSelectedTeamId(first.id);
  };

  const handleLaunch = () => {
    if (!selectedTeam) return;
    soundFx.draftLock();
    try {
      localStorage.setItem('lol_mgr_nickname', managerName.trim() || 'Baş Koç');
    } catch {
      // ignore
    }
    onStartCareer(selectedTeam.id, managerName.trim() || 'Baş Koç');
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#E6ECF5] flex flex-col">
      {/* Top Bar Contract: 3 zones */}
      <header className="h-16 px-6 lg:px-10 border-b border-white/[0.08] bg-[#0B0E14]/95 backdrop-blur flex items-center justify-between gap-8 sticky top-0 z-30">
        <span className="font-display text-2xl font-extrabold tracking-wide text-white whitespace-nowrap shrink-0">
          LOL ESPORTS <span className="text-[#E4BD67]">MANAGER 27</span>
        </span>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => handleRegionChange('LCK')}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Kariyer Seçimi
          </button>
          <button
            onClick={onOpenMayhem}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Worlds Mayhem
          </button>
          <button
            onClick={onOpenSaveManager}
            className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Kayıt Slotları ({filledCount})
          </button>
        </nav>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleLaunch}
            className="px-4 py-2 rounded-md bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] font-semibold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Kariyere Başla
          </button>
        </div>
      </header>

      {/* Cinematic Arena Hero Banner */}
      <section className="relative border-b border-white/[0.08] overflow-hidden">
        <div className="absolute inset-0">
          <SafeImage
            src={MEDIA_ASSETS.arenaHero}
            alt="Worlds Championship Arena"
            className="w-full h-full object-cover object-center opacity-50"
            fallbackLabel="Championship Stage"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E14] via-[#0B0E14]/85 to-[#0B0E14]/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-transparent to-[#0B0E14]/30" />
        </div>

        <div className="relative max-w-[1400px] mx-auto px-6 lg:px-10 py-10 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#E4BD67] font-medium">
              <span>2027 Pro Sezonu</span>
              <span aria-hidden="true">·</span>
              <span>7 Küresel Lig</span>
              <span aria-hidden="true">·</span>
              <span>Fearless Draft</span>
              <span aria-hidden="true">·</span>
              <span>Canlı 2D Maç Motoru</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.03] max-w-2xl">
              Kulübünü Zirveye Taşı, Worlds Kupasını Kaldır
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              Taktik tahtası, gerçek zamanlı 2D Vadi simülasyonu, kenar yönetimi talimatları, basın toplantıları, Challenger wonderkid scout ağı ve Fearless Draft stratejileriyle tam ölçekli espor menajerliği.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center bg-[#121722]/90 border border-white/[0.12] rounded-md px-3 py-2 gap-2.5 min-w-[260px]">
                <span className="text-xs text-slate-400 whitespace-nowrap">Baş Koç:</span>
                <input
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  maxLength={24}
                  placeholder="Koç adın..."
                  className="bg-transparent text-sm font-semibold text-white outline-none w-full placeholder:text-slate-600"
                />
              </div>
              <button
                onClick={onOpenMayhem}
                className="px-4 py-2.5 rounded-md border border-white/[0.14] bg-[#121722]/85 hover:bg-[#1A2233] text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Flame className="w-4 h-4 text-[#E4BD67]" />
                Worlds Mayhem (Efsaneler)
              </button>
              <button
                onClick={onOpenSaveManager}
                className="px-4 py-2.5 rounded-md border border-white/[0.14] bg-[#121722]/85 hover:bg-[#1A2233] text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FolderOpen className="w-4 h-4 text-slate-400" />
                Kayıt Slotları ({filledCount})
              </button>
            </div>
          </div>

          {/* Resume Career Quick Card */}
          <div className="lg:col-span-5">
            {autoRec ? (
              <div className="bg-[#121722]/95 border border-[#C89B3C]/40 rounded-lg p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <TeamCrest
                      tag={autoRec.teamTag}
                      color={autoRec.teamColor}
                      color2={autoRec.teamColor2}
                      size="md"
                    />
                    <div className="min-w-0">
                      <div className="text-xs text-[#E4BD67] font-semibold">Kaldığın Yerden Devam Et</div>
                      <div className="text-base font-bold text-white truncate">{autoRec.teamName}</div>
                      <div className="text-xs text-slate-400 font-mono-num truncate">
                        {autoRec.managerName || 'Koç'} · S{autoRec.season} · {autoRec.phaseLabel} (H{autoRec.week})
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      soundFx.draftLock();
                      onResumeAutoSave();
                    }}
                    className="px-4 py-2.5 rounded-md bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] font-bold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Devam Et
                  </button>
                </div>
                <div className="text-[11px] text-slate-500 border-t border-white/[0.06] pt-2.5 flex justify-between font-mono-num">
                  <span>Son otomatik kayıt</span>
                  <span>{autoRec.savedAt}</span>
                </div>
              </div>
            ) : (
              <div className="bg-[#121722]/90 border border-white/[0.08] rounded-lg p-5 grid grid-cols-3 gap-4 text-left">
                <div>
                  <div className="font-mono-num text-2xl font-bold text-white">{previewDB.teams.length}</div>
                  <div className="text-xs text-slate-400 mt-0.5">Pro Kulüp</div>
                </div>
                <div>
                  <div className="font-mono-num text-2xl font-bold text-white">{previewDB.players.length}</div>
                  <div className="text-xs text-slate-400 mt-0.5">Lisanslı Oyuncu</div>
                </div>
                <div>
                  <div className="font-mono-num text-2xl font-bold text-[#E4BD67]">7 Lig</div>
                  <div className="text-xs text-slate-400 mt-0.5">LCK'den TCL'ye</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Region + Club Selector Workspace */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 lg:px-10 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-white tracking-wide">Kulüp ve Bölge Seçimi</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Bölgeni seç, kulübün kadrosunu ve bütçesini incele, sözleşmeni imzala.
            </p>
          </div>
          {/* Region Segmented Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#121722] border border-white/[0.08] rounded-lg overflow-x-auto">
            {REGIONS.map((reg: any) => (
              <button
                key={reg.id}
                onClick={() => handleRegionChange(reg.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedRegion === reg.id
                    ? 'bg-[#C89B3C] text-[#0B0E14]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {reg.id}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Team List Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {regionTeams.map((team: any) => {
              const avgOvr = getTeamAvgOvr(team.id);
              const isSelected = selectedTeam?.id === team.id;
              return (
                <button
                  key={team.id}
                  onClick={() => {
                    soundFx.click();
                    setSelectedTeamId(team.id);
                  }}
                  className={`text-left p-4 rounded-lg border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#171E2C] border-[#C89B3C]/70'
                      : 'bg-[#121722] border-white/[0.08] hover:border-white/[0.2]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <TeamCrest tag={team.tag} color={team.color} color2={team.color2} size="md" />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">{team.name}</div>
                      <div className="text-xs text-slate-400 font-mono-num mt-0.5">
                        {formatMoney(team.budget)} · Prestij {team.prestige}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-slate-500">OVR</div>
                    <OvrValue ovr={avgOvr} size="lg" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Club Dossier Preview Panel */}
          {selectedTeam && (
            <div className="lg:col-span-5 bg-[#121722] border border-white/[0.1] rounded-lg p-6 space-y-5 sticky top-24">
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <TeamCrest
                    tag={selectedTeam.tag}
                    color={selectedTeam.color}
                    color2={selectedTeam.color2}
                    size="lg"
                  />
                  <div className="min-w-0">
                    <div className="text-xs text-[#E4BD67] font-semibold">
                      {selectedTeam.region} Ligi · Kulüp Dosyası
                    </div>
                    <h3 className="font-display text-3xl font-bold text-white leading-tight truncate">
                      {selectedTeam.name}
                    </h3>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] text-slate-400">Takım OVR</div>
                  <OvrValue ovr={getTeamAvgOvr(selectedTeam.id)} size="lg" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="py-2 border-b border-white/[0.06]">
                  <div className="text-slate-500 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5" /> Bütçe
                  </div>
                  <div className="font-mono-num text-sm font-bold text-white mt-1">
                    {formatMoney(selectedTeam.budget)}
                  </div>
                </div>
                <div className="py-2 border-b border-white/[0.06]">
                  <div className="text-slate-500 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5" /> Prestij
                  </div>
                  <div className="font-mono-num text-sm font-bold text-[#E4BD67] mt-1">
                    {selectedTeam.prestige} / 100
                  </div>
                </div>
                <div className="py-2 border-b border-white/[0.06]">
                  <div className="text-slate-500 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Taraftar
                  </div>
                  <div className="font-mono-num text-sm font-bold text-white mt-1">
                    {selectedTeam.fanbase} / 100
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-400 mb-2.5">İlk 5 Kadrosu</div>
                <div className="divide-y divide-white/[0.06] border-t border-b border-white/[0.06]">
                  {selectedRoster.map((p: any) => (
                    <div key={p.id} className="py-2 flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono-num text-[11px] text-slate-500 w-7 shrink-0">{p.role}</span>
                        <span className="font-semibold text-white truncate">{p.name}</span>
                        <span className="text-slate-500 shrink-0">
                          {p.nat} · {p.age}y
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 font-mono-num">
                        <span className="text-[11px] text-slate-400">POT {p.pot}</span>
                        <OvrValue ovr={p.ovr} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#C89B3C]" />
                  <span>
                    Beklenti:{' '}
                    <strong className="text-slate-200">
                      {selectedTeam.prestige >= 90
                        ? 'Şampiyonluk & Worlds'
                        : selectedTeam.prestige >= 80
                        ? 'Playoff & Uluslararası'
                        : 'Playoff Mücadelesi'}
                    </strong>
                  </span>
                </div>
                <button
                  onClick={handleLaunch}
                  className="px-5 py-2.5 rounded-md bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] font-bold text-xs flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Sözleşmeyi İmzala
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

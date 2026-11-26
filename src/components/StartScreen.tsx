import React, { useMemo, useState } from 'react';
import { Flame, FolderOpen, Play, ArrowRight, Trophy, Users, Wallet, ShieldCheck, UserCheck, Briefcase } from 'lucide-react';
import { REGIONS, ROLES, createInitialDatabase } from '../data/teamsAndPlayers.js';
import { CHAMPIONS } from '../data/champions.js';
import { formatMoney, listSaveSlots } from '../engine/gameEngine.js';
import { MEDIA_ASSETS } from '../assets/media';
import { SafeImage, TeamCrest, OvrValue, ChampionEmblem } from './shared/Visuals';
import { soundFx } from '../engine/soundFx';

interface StartScreenProps {
  onStartCareer: (teamId: string, managerName: string) => void;
  onStartPlayerCareer: (opts: {
    playerName: string;
    role: string;
    sigChamps: string[];
    teamId: string;
    archetype: string;
    startInAcademy: boolean;
  }) => void;
  onResumeAutoSave: () => void;
  onOpenSaveManager: () => void;
  onOpenMayhem: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStartCareer,
  onStartPlayerCareer,
  onResumeAutoSave,
  onOpenSaveManager,
  onOpenMayhem,
}) => {
  const previewDB = useMemo(() => createInitialDatabase(), []);
  const slots = useMemo(() => listSaveSlots(), []);
  const autoRec = slots.find((s: any) => s.slotId === 'autosave')?.record;
  const filledCount = slots.filter((s: any) => s.record).length;

  const [careerMode, setCareerMode] = useState<'MANAGER' | 'PLAYER'>('MANAGER');
  const [selectedRegion, setSelectedRegion] = useState<string>('LCK');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('t1');
  const [managerName, setManagerName] = useState<string>(() => {
    try {
      return localStorage.getItem('lol_mgr_nickname') || 'Baş Koç';
    } catch {
      return 'Baş Koç';
    }
  });

  // Be a Legend (Player Career) state
  const [playerName, setPlayerName] = useState<string>('Legend');
  const [playerRole, setPlayerRole] = useState<string>('MID');
  const [playerArchetype, setPlayerArchetype] = useState<string>('Aggressive');
  const [sigChamps, setSigChamps] = useState<string[]>(['ahri']);
  const [startInAcademy, setStartInAcademy] = useState<boolean>(true);
  const [onlyUnderdogs, setOnlyUnderdogs] = useState<boolean>(true);

  const roleChampions = useMemo(
    () => CHAMPIONS.filter((c: any) => c.roles.includes(playerRole)).slice(0, 30),
    [playerRole]
  );

  const regionTeams = useMemo(() => {
    const base = previewDB.teams.filter((t: any) => t.region === selectedRegion);
    if (careerMode === 'PLAYER' && onlyUnderdogs) {
      const under = base.filter((t: any) => t.prestige <= 80);
      return under.length ? under : base;
    }
    return base;
  }, [previewDB.teams, selectedRegion, careerMode, onlyUnderdogs]);

  const selectedTeam = useMemo(
    () => regionTeams.find((t: any) => t.id === selectedTeamId) || regionTeams[0] || previewDB.teams[0],
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
    const list = previewDB.teams.filter((t: any) => t.region === regId);
    const preferred = careerMode === 'PLAYER' ? (list.find((t: any) => t.prestige <= 80) || list[0]) : list[0];
    if (preferred) setSelectedTeamId(preferred.id);
  };

  const handleModeSwitch = (mode: 'MANAGER' | 'PLAYER') => {
    soundFx.click();
    setCareerMode(mode);
    const list = previewDB.teams.filter((t: any) => t.region === selectedRegion);
    if (mode === 'PLAYER') {
      const under = list.find((t: any) => t.prestige <= 78) || [...list].sort((a: any, b: any) => a.prestige - b.prestige)[0];
      if (under) setSelectedTeamId(under.id);
    } else if (list[0]) {
      setSelectedTeamId(list[0].id);
    }
  };

  const handleRoleChange = (r: string) => {
    soundFx.click();
    setPlayerRole(r);
    const first = CHAMPIONS.find((c: any) => c.roles.includes(r));
    setSigChamps(first ? [String(first.id)] : []);
  };

  const toggleSigChamp = (cid: string) => {
    soundFx.click();
    setSigChamps([cid]);
  };

  const handleLaunch = () => {
    if (!selectedTeam) return;
    soundFx.draftLock();
    if (careerMode === 'PLAYER') {
      onStartPlayerCareer({
        playerName: playerName.trim() || 'Legend',
        role: playerRole,
        sigChamps,
        teamId: selectedTeam.id,
        archetype: playerArchetype,
        startInAcademy,
      });
      return;
    }
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

        <div className="relative max-w-[1400px] mx-auto px-6 lg:px-10 py-8 lg:py-10 space-y-7">
          {/* Top Hero Row: Headline + Quick Resume / Utility */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-7 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#E4BD67] font-semibold">
                <span>2027 Pro Sezonu</span>
                <span aria-hidden="true">·</span>
                <span>7 Küresel Lig · 56 Kulüp</span>
                <span aria-hidden="true">·</span>
                <span>Fearless Draft · Canlı 2D Vadi</span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.03]">
                Sahneye Nasıl Çıkacaksın?
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Kulübün başına geçip hanedanlık kur ya da Akademi liginden yükselen bir çaylak olarak kendi efsaneni yaz.
              </p>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-3">
              {autoRec ? (
                <div className="bg-[#121722]/95 border border-[#C89B3C]/45 rounded-lg p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <TeamCrest
                      tag={autoRec.teamTag}
                      color={autoRec.teamColor}
                      color2={autoRec.teamColor2}
                      size="md"
                    />
                    <div className="min-w-0">
                      <div className="text-[11px] text-[#E4BD67] font-semibold">Kaldığın Yerden Devam Et</div>
                      <div className="text-sm font-bold text-white truncate">{autoRec.teamName}</div>
                      <div className="text-[11px] text-slate-400 font-mono-num truncate">
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
              ) : null}

              <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
                <button
                  onClick={onOpenMayhem}
                  className="px-4 py-2 rounded-md border border-white/[0.14] bg-[#121722]/90 hover:bg-[#1A2233] text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Flame className="w-4 h-4 text-[#E4BD67]" />
                  Worlds Mayhem (Efsaneler)
                </button>
                <button
                  onClick={onOpenSaveManager}
                  className="px-4 py-2 rounded-md border border-white/[0.14] bg-[#121722]/90 hover:bg-[#1A2233] text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4 text-slate-400" />
                  Kayıt Slotları ({filledCount})
                </button>
              </div>
            </div>
          </div>

          {/* AAA Primary Career Mode Poster Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* CARD 1: MANAGER CAREER */}
            <button
              type="button"
              onClick={() => handleModeSwitch('MANAGER')}
              className={`group relative text-left rounded-xl overflow-hidden border transition-all duration-200 min-h-[215px] p-6 sm:p-7 flex flex-col justify-between cursor-pointer ${
                careerMode === 'MANAGER'
                  ? 'border-[#C89B3C] ring-1 ring-[#E4BD67]/50 shadow-2xl scale-[1.005]'
                  : 'border-white/[0.1] hover:border-white/[0.28] opacity-85 hover:opacity-100'
              }`}
            >
              <div className="absolute inset-0">
                <SafeImage
                  src={MEDIA_ASSETS.coachHq}
                  alt="Baş Koç ve Menajerlik"
                  className="w-full h-full object-cover object-center opacity-45 group-hover:scale-105 transition-transform duration-500"
                  fallbackLabel="Manager Mode"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/80 to-[#0B0E14]/40" />
              </div>

              <div className="relative flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E4BD67]">
                  <Briefcase className="w-4 h-4" />
                  KULÜP YÖNETİMİ & TAKTİK
                </span>
                <span
                  className={`px-3 py-1 rounded text-[11px] font-extrabold tracking-wide ${
                    careerMode === 'MANAGER'
                      ? 'bg-[#C89B3C] text-[#0B0E14]'
                      : 'bg-white/[0.08] text-slate-300'
                  }`}
                >
                  {careerMode === 'MANAGER' ? 'SEÇİLİ MOD' : 'MODU SEÇ'}
                </span>
              </div>

              <div className="relative space-y-2 mt-6">
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-wide">
                  MENAJER OL
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
                  56 profesyonel kulüpten birinin başına geç. Transfer pazarlıkları, Fearless Draft stratejileri, tesis yatırımları ve canlı 2D kenar yönetimiyle hanedanlık kur.
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-[11px] font-mono-num text-slate-300">
                  <span className="text-[#E4BD67]">56 Kulüp · 300+ Oyuncu</span>
                  <span>·</span>
                  <span>Tam Draft Kontrolü</span>
                  <span>·</span>
                  <span>Bütçe & Scout Ağı</span>
                </div>
              </div>
            </button>

            {/* CARD 2: BE A LEGEND (PLAYER CAREER) */}
            <button
              type="button"
              onClick={() => handleModeSwitch('PLAYER')}
              className={`group relative text-left rounded-xl overflow-hidden border transition-all duration-200 min-h-[215px] p-6 sm:p-7 flex flex-col justify-between cursor-pointer ${
                careerMode === 'PLAYER'
                  ? 'border-[#C89B3C] ring-1 ring-[#E4BD67]/50 shadow-2xl scale-[1.005]'
                  : 'border-white/[0.1] hover:border-white/[0.28] opacity-85 hover:opacity-100'
              }`}
            >
              <div className="absolute inset-0">
                <SafeImage
                  src={MEDIA_ASSETS.worldsTrophy}
                  alt="Efsane Ol Oyuncu Kariyeri"
                  className="w-full h-full object-cover object-center opacity-45 group-hover:scale-105 transition-transform duration-500"
                  fallbackLabel="Be a Legend Mode"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/80 to-[#0B0E14]/40" />
              </div>

              <div className="relative flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400">
                  <UserCheck className="w-4 h-4" />
                  PRO OYUNCU KARİYERİ
                </span>
                <span
                  className={`px-3 py-1 rounded text-[11px] font-extrabold tracking-wide ${
                    careerMode === 'PLAYER'
                      ? 'bg-[#C89B3C] text-[#0B0E14]'
                      : 'bg-white/[0.08] text-slate-300'
                  }`}
                >
                  {careerMode === 'PLAYER' ? 'SEÇİLİ MOD' : 'MODU SEÇ'}
                </span>
              </div>

              <div className="relative space-y-2 mt-6">
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-wide">
                  EFSANE OL
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
                  16 yaşında bir wonderkid olarak Akademi liginden başla veya doğrudan ilk 5'e çık. Koçtan imza şampiyonunu iste, maç içi kritik kararlarla parlayıp dev kulüplere transfer ol.
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-[11px] font-mono-num text-slate-300">
                  <span className="text-sky-400">Akademi → Worlds Yolu</span>
                  <span>·</span>
                  <span>Maç İçi Karar Anları</span>
                  <span>·</span>
                  <span>Röportaj & Maaş Pazarlığı</span>
                </div>
              </div>
            </button>
          </div>

          {/* Active Mode Identity Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#121722]/90 border border-white/[0.1] rounded-lg px-5 py-3.5">
            <div className="flex flex-wrap items-center gap-4">
              {careerMode === 'MANAGER' ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-[#E4BD67] whitespace-nowrap">Baş Koç Adın:</span>
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    maxLength={24}
                    placeholder="Koç adın..."
                    className="bg-[#0B0E14] border border-white/[0.12] focus:border-[#C89B3C] rounded-md px-3 py-1.5 text-sm font-semibold text-white outline-none w-56"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-sky-400 whitespace-nowrap">Oyuncu Nickname:</span>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={18}
                    placeholder="Nickname..."
                    className="bg-[#0B0E14] border border-[#C89B3C]/50 focus:border-[#E4BD67] rounded-md px-3 py-1.5 text-sm font-semibold text-white outline-none w-56"
                  />
                </div>
              )}
              <span className="text-xs text-slate-400 hidden sm:inline">
                Seçili Kulüp: <strong className="text-white">{selectedTeam?.name}</strong> ({selectedTeam?.region})
              </span>
            </div>

            <button
              onClick={handleLaunch}
              className="px-6 py-2.5 rounded-md bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] font-extrabold text-xs flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
            >
              {careerMode === 'PLAYER' ? 'Efsane Kariyerini Başlat' : 'Menajer Sözleşmesini İmzala'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Main Region + Club Selector Workspace */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 lg:px-10 py-8 space-y-6">
        {careerMode === 'PLAYER' && (
          <div className="bg-[#121722] border border-[#C89B3C]/40 rounded-lg p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
              <div>
                <div className="text-xs text-[#E4BD67] font-semibold">Efsane Ol — Pro Oyuncu Oluşturucu (16 Yaş)</div>
                <h2 className="font-display text-2xl font-bold text-white">Koridorunu, Oyun Tarzını ve İmza Şampiyonunu Seç</h2>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyUnderdogs}
                  onChange={(e) => setOnlyUnderdogs(e.target.checked)}
                  className="accent-[#C89B3C]"
                />
                Sadece alt sıra / gelişmekte olan takımları göster
              </label>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-4 space-y-3">
                <div>
                  <div className="text-[11px] text-slate-400 mb-1.5">Koridor / Rol</div>
                  <div className="flex gap-1.5">
                    {ROLES.map((r: string) => (
                      <button
                        key={r}
                        onClick={() => handleRoleChange(r)}
                        className={`flex-1 py-2 rounded text-xs font-bold cursor-pointer ${
                          playerRole === r ? 'bg-[#C89B3C] text-[#0B0E14]' : 'bg-[#0B0E14] text-slate-300 border border-white/[0.1]'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 mb-1.5">Oyun Tarzı / Profil</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'Aggressive', label: 'Mekanik Taşıyıcı' },
                      { id: 'Playmaker', label: 'Oyun Kurucu' },
                      { id: 'Consistent', label: 'İstikrarlı Çapa' },
                      { id: 'Weakside', label: 'Takım Oyuncusu' },
                    ].map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setPlayerArchetype(a.id)}
                        className={`py-2 px-2.5 rounded text-xs font-semibold cursor-pointer ${
                          playerArchetype === a.id
                            ? 'bg-[#171E2C] border border-[#C89B3C] text-[#E4BD67]'
                            : 'bg-[#0B0E14] border border-white/[0.08] text-slate-400'
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 mb-1.5">Başlangıç Ligi</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setStartInAcademy(true)}
                      className={`py-2 px-2.5 rounded text-xs font-semibold cursor-pointer ${
                        startInAcademy
                          ? 'bg-[#C89B3C] text-[#0B0E14]'
                          : 'bg-[#0B0E14] border border-white/[0.08] text-slate-400'
                      }`}
                    >
                      Akademi Ligi (Önerilen)
                    </button>
                    <button
                      onClick={() => setStartInAcademy(false)}
                      className={`py-2 px-2.5 rounded text-xs font-semibold cursor-pointer ${
                        !startInAcademy
                          ? 'bg-[#C89B3C] text-[#0B0E14]'
                          : 'bg-[#0B0E14] border border-white/[0.08] text-slate-400'
                      }`}
                    >
                      Doğrudan Ana Kadro
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-slate-400">
                    İmza Şampiyonun (1 şampiyon seç)
                  </span>
                  <span className="text-[11px] font-mono-num text-[#E4BD67]">
                    {sigChamps.map((id) => CHAMPIONS.find((c: any) => c.id === id)?.name || id).join(' · ')}
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-36 overflow-y-auto pr-1">
                  {roleChampions.map((c: any) => {
                    const active = sigChamps.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleSigChamp(c.id)}
                        className={`p-2 rounded border text-left flex items-center gap-2 cursor-pointer ${
                          active
                            ? 'bg-[#171E2C] border-[#C89B3C] text-white'
                            : 'bg-[#0B0E14] border-white/[0.08] text-slate-400 hover:text-white'
                        }`}
                      >
                        <ChampionEmblem name={c.name} dmg={c.dmg} classTag={c.classTag} size="xs" />
                        <span className="text-[11px] font-semibold truncate">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

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

import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Compass, Target } from 'lucide-react';
import { TACTIC_PRESETS, MATCH_PREP_OPTIONS, getCurrentPatch, getTeamRoster } from '../engine/gameEngine.js';
import { analyzeTacticsSystem } from '../engine/fmExtensions';
import { MEDIA_ASSETS } from '../assets/media';
import { SafeImage, OvrValue } from './shared/Visuals';
import { soundFx } from '../engine/soundFx';

interface TacticsViewProps {
  state: any;
  userTeam: any;
  onUpdate: (toast?: string) => void;
}

const PITCH_POSITIONS: Record<string, { x: number; y: number }> = {
  TOP: { x: 20, y: 22 },
  JGL: { x: 35, y: 45 },
  MID: { x: 50, y: 50 },
  BOT: { x: 75, y: 80 },
  SUP: { x: 64, y: 84 },
};

export const TacticsView: React.FC<TacticsViewProps> = ({ state, userTeam, onUpdate }) => {
  const roster = useMemo(() => getTeamRoster(state, userTeam.id), [state, userTeam.id]);
  const patch = useMemo(() => getCurrentPatch(state), [state]);
  const analysis = useMemo(() => analyzeTacticsSystem(userTeam, roster, patch), [userTeam, roster, patch]);

  const tactics = userTeam.tactics;

  const setTacticField = (key: string, value: string) => {
    soundFx.click();
    userTeam.tactics[key] = value;
    onUpdate();
  };

  const applyPreset = (preset: any) => {
    soundFx.draftLock();
    Object.assign(userTeam.tactics, preset.tactics);
    onUpdate(`"${preset.name}" taktik şablonu aktif edildi.`);
  };

  const setMatchPrep = (prepId: string) => {
    soundFx.click();
    userTeam.matchPrep = prepId;
    onUpdate('Haftalık maç hazırlığı güncellendi.');
  };

  // Jungle path arrow target based on laneFocus
  const jglTarget =
    tactics.laneFocus === 'TOP'
      ? PITCH_POSITIONS.TOP
      : tactics.laneFocus === 'BOT'
      ? PITCH_POSITIONS.BOT
      : PITCH_POSITIONS.MID;

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="text-xs text-[#E4BD67] font-semibold">
            Taktik Tahtası & Oyun Felsefesi · Yama {patch.version} ({patch.name})
          </div>
          <h1 className="font-display text-3xl font-extrabold text-white tracking-wide mt-0.5">
            {analysis.identityTitle}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">{analysis.identityDesc}</p>
        </div>
        <div className="flex items-center gap-5 shrink-0">
          <div className="text-right">
            <div className="text-[11px] text-slate-400">Taktik Uyum Skoru</div>
            <div
              className={`font-mono-num text-3xl font-bold ${
                analysis.coherenceScore >= 80
                  ? 'text-emerald-400'
                  : analysis.coherenceScore >= 65
                  ? 'text-[#E4BD67]'
                  : 'text-rose-400'
              }`}
            >
              {analysis.coherenceScore}/100
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-slate-400">Takım Sinerjisi</div>
            <div className="font-mono-num text-3xl font-bold text-white">{Math.round(userTeam.synergy || 70)}</div>
          </div>
        </div>
      </div>

      {/* Quick Tactical Presets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {TACTIC_PRESETS.map((preset: any) => {
          const active =
            tactics.gameplan === preset.tactics.gameplan &&
            tactics.laneFocus === preset.tactics.laneFocus &&
            tactics.objective === preset.tactics.objective;
          return (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className={`text-left p-4 rounded-lg border transition-colors cursor-pointer ${
                active
                  ? 'bg-[#171E2C] border-[#C89B3C]/70'
                  : 'bg-[#121722] border-white/[0.08] hover:border-white/[0.2]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-white">{preset.name}</span>
                {active && <span className="text-[10px] font-mono-num text-[#E4BD67] font-bold">AKTİF</span>}
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{preset.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Counter-Tactics Rock-Paper-Scissors Matrix Reference */}
      <div className="bg-[#121722] border border-white/[0.08] rounded-lg px-5 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
        <div className="font-bold text-[#E4BD67] shrink-0">Karşı Taktik Matrisi (Maç Motoru Etkisi)</div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-slate-300 font-mono-num">
          <span>
            <strong className="text-white">Agresif</strong> &gt; Geç Oyun / Ayrık İttirme
          </span>
          <span className="text-slate-600">·</span>
          <span>
            <strong className="text-white">Geç Oyun</strong> &gt; Dengeli Makro
          </span>
          <span className="text-slate-600">·</span>
          <span>
            <strong className="text-white">Dengeli Makro</strong> &gt; Agresif Tempo
          </span>
          <span className="text-slate-600">·</span>
          <span>
            <strong className="text-white">Ayrık İttirme</strong> &gt; Geç Oyun
          </span>
        </div>
      </div>

      {/* Main 12-Col Tactical Whiteboard + Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols: Interactive Tactical Pitch Map */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#121722] border border-white/[0.08] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-[#E4BD67]" />
                Sihirdar Vadisi Kaynak & Rota Haritası
              </span>
              <span className="text-slate-400 font-mono-num">Odak: {tactics.laneFocus}</span>
            </div>

            <div className="relative aspect-square rounded-md overflow-hidden border border-white/[0.1] bg-[#0B0E14]">
              <SafeImage
                src={MEDIA_ASSETS.tacticalMap}
                alt="Summoner's Rift Tactical Board"
                className="w-full h-full object-cover opacity-80"
                fallbackLabel="Tactical Board"
              />
              {/* SVG Jungle Pathing & Priority Vector Overlay */}
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <marker id="goldArrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#E4BD67" />
                  </marker>
                </defs>
                {/* Jungle to Focused Lane Vector */}
                <line
                  x1={PITCH_POSITIONS.JGL.x}
                  y1={PITCH_POSITIONS.JGL.y}
                  x2={jglTarget.x}
                  y2={jglTarget.y}
                  stroke="#E4BD67"
                  strokeWidth="1.2"
                  strokeDasharray="2.5 1.8"
                  markerEnd="url(#goldArrow)"
                />
                {/* Objective Ring */}
                <circle
                  cx={tactics.objective === 'baron' ? 31 : 69}
                  cy={tactics.objective === 'baron' ? 31 : 69}
                  r="9"
                  fill="rgba(228, 189, 103, 0.14)"
                  stroke="#E4BD67"
                  strokeWidth="0.9"
                  strokeDasharray="2 1.5"
                />
              </svg>

              {/* 5 Starter Tactical Nodes */}
              {Object.entries(PITCH_POSITIONS).map(([role, pos]) => {
                const player =
                  roster.find((p: any) => p.role === role && p.isStarter) || roster.find((p: any) => p.role === role);
                const alloc = analysis.laneAllocations[role];
                const isFocused = tactics.laneFocus === role;
                return (
                  <div
                    key={role}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
                  >
                    <div
                      className={`px-2 py-1 rounded-md border backdrop-blur-md min-w-[78px] ${
                        isFocused
                          ? 'bg-[#171E2C]/95 border-[#E4BD67]'
                          : 'bg-[#0B0E14]/90 border-white/[0.18]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5 text-[10px] font-mono-num">
                        <span className="text-[#E4BD67] font-bold">{role}</span>
                        <OvrValue ovr={player?.ovr || 75} size="sm" />
                      </div>
                      <div className="text-[11px] font-bold text-white truncate">{player?.name || '—'}</div>
                      <div className="text-[9px] text-slate-400 truncate">{alloc?.directive}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-Time FM Tactical Analyzer */}
          <div className="bg-[#121722] border border-white/[0.08] rounded-lg p-5 space-y-4">
            <div className="text-xs font-bold text-white">Taktik Analizör (FM Sistem Raporu)</div>

            {/* 5-Axis Phase Breakdown */}
            <div className="space-y-2.5 text-xs">
              {[
                { label: 'Erken Oyun Hakimiyeti', val: analysis.phaseRatings.earlyControl },
                { label: 'Görev & Görüş Kurulumu', val: analysis.phaseRatings.objectiveSetup },
                { label: '5v5 Takım Savaşı Gücü', val: analysis.phaseRatings.teamfightPower },
                { label: 'Yan Koridor Baskısı', val: analysis.phaseRatings.sideLanePressure },
                { label: 'Geç Oyun Sigortası', val: analysis.phaseRatings.lateInsurance },
              ].map((m) => (
                <div key={m.label} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{m.label}</span>
                    <span className="font-mono-num font-bold text-white">{m.val}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#0B0E14] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        m.val >= 82 ? 'bg-[#E4BD67]' : m.val >= 72 ? 'bg-sky-400' : 'bg-slate-500'
                      }`}
                      style={{ width: `${m.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Contradictions */}
            {analysis.contradictions.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-white/[0.07]">
                <div className="text-[11px] font-semibold text-amber-400">Taktik Çelişkiler</div>
                {analysis.contradictions.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-amber-300/90">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Strengths */}
            <div className="space-y-1.5 pt-2 border-t border-white/[0.07]">
              <div className="text-[11px] font-semibold text-emerald-400">Yapısal Sinerjiler</div>
              {analysis.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Phase-Based Controls & Individual Instructions */}
        <div className="lg:col-span-7 space-y-4">
          {/* Core Macro Instructions */}
          <div className="bg-[#121722] border border-white/[0.08] rounded-lg p-5 space-y-5">
            <div className="text-sm font-bold text-white border-b border-white/[0.08] pb-3">
              Takım Makro Talimatları
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Gameplan */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Ana Oyun Planı</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'aggressive', label: 'Agresif Tempo' },
                    { id: 'balanced', label: 'Dengeli Makro' },
                    { id: 'scaling', label: 'Geç Oyun' },
                    { id: 'split', label: 'Ayrık İttirme' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setTacticField('gameplan', opt.id)}
                      className={`px-3 py-2 rounded-md text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                        tactics.gameplan === opt.id
                          ? 'bg-[#C89B3C] text-[#0B0E14] border-[#C89B3C]'
                          : 'bg-[#0B0E14] text-slate-300 border-white/[0.08] hover:border-white/[0.2]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lane Focus */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Orman & Kaynak Odağı</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'TOP', label: 'Üst (TOP)' },
                    { id: 'MID', label: 'Orta (MID)' },
                    { id: 'BOT', label: 'Alt (BOT)' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setTacticField('laneFocus', opt.id)}
                      className={`px-3 py-2 rounded-md text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                        tactics.laneFocus === opt.id
                          ? 'bg-[#C89B3C] text-[#0B0E14] border-[#C89B3C]'
                          : 'bg-[#0B0E14] text-slate-300 border-white/[0.08] hover:border-white/[0.2]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Objective Focus */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Harita Görev Önceliği</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'dragon', label: 'Ejder Ruhu' },
                    { id: 'baron', label: 'Baron / Kurtçuk' },
                    { id: 'towers', label: 'Kule & Plaka' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setTacticField('objective', opt.id)}
                      className={`px-3 py-2 rounded-md text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                        tactics.objective === opt.id
                          ? 'bg-[#C89B3C] text-[#0B0E14] border-[#C89B3C]'
                          : 'bg-[#0B0E14] text-slate-300 border-white/[0.08] hover:border-white/[0.2]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Game-State Plans (Ahead / Behind) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Öndeyken / Gerideyken Tepki</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={tactics.aheadPlan || 'choke'}
                    onChange={(e) => setTacticField('aheadPlan', e.target.value)}
                    className="bg-[#0B0E14] border border-white/[0.1] rounded-md px-2.5 py-2 text-xs text-white"
                  >
                    <option value="choke">Öndeyken: Görüş Boğma</option>
                    <option value="split131">Öndeyken: 1-3-1 Baskı</option>
                    <option value="dive">Öndeyken: Kule Altı Dive</option>
                  </select>
                  <select
                    value={tactics.behindPlan || 'scale'}
                    onChange={(e) => setTacticField('behindPlan', e.target.value)}
                    className="bg-[#0B0E14] border border-white/[0.1] rounded-md px-2.5 py-2 text-xs text-white"
                  >
                    <option value="scale">Gerideyken: Ölçeklen</option>
                    <option value="crossmap">Gerideyken: Çapraz Takas</option>
                    <option value="pick">Gerideyken: Pusu & Pick</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Individual Role Directives */}
          <div className="bg-[#121722] border border-white/[0.08] rounded-lg p-5 space-y-4">
            <div className="text-sm font-bold text-white border-b border-white/[0.08] pb-3">
              Bireysel Rol Talimatları
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-2">
                <div className="font-semibold text-slate-300">Üst Koridor (TOP)</div>
                {[
                  { id: 'carry', label: 'Taşıyıcı (Strongside)' },
                  { id: 'balanced', label: 'Dengeli' },
                  { id: 'weakside', label: 'Zayıf Taraf (Weakside)' },
                ].map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setTacticField('topStyle', o.id)}
                    className={`w-full text-left px-3 py-2 rounded-md border cursor-pointer ${
                      tactics.topStyle === o.id
                        ? 'bg-[#171E2C] border-[#C89B3C] text-[#E4BD67] font-semibold'
                        : 'bg-[#0B0E14] border-white/[0.08] text-slate-400 hover:text-white'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-slate-300">Nişancı (BOT)</div>
                {[
                  { id: 'aggressive', label: 'Agresif 2v2 Baskı' },
                  { id: 'balanced', label: 'Dengeli' },
                  { id: 'safe', label: 'Güvenli Farm / Ölçeklen' },
                ].map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setTacticField('adcStyle', o.id)}
                    className={`w-full text-left px-3 py-2 rounded-md border cursor-pointer ${
                      tactics.adcStyle === o.id
                        ? 'bg-[#171E2C] border-[#C89B3C] text-[#E4BD67] font-semibold'
                        : 'bg-[#0B0E14] border-white/[0.08] text-slate-400 hover:text-white'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-slate-300">Destek (SUP)</div>
                {[
                  { id: 'roam', label: 'Harita Gezgini (Roam)' },
                  { id: 'balanced', label: 'Dengeli' },
                  { id: 'peel', label: 'Taşıyıcı Koruma (Peel)' },
                ].map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setTacticField('supStyle', o.id)}
                    className={`w-full text-left px-3 py-2 rounded-md border cursor-pointer ${
                      tactics.supStyle === o.id
                        ? 'bg-[#171E2C] border-[#C89B3C] text-[#E4BD67] font-semibold'
                        : 'bg-[#0B0E14] border-white/[0.08] text-slate-400 hover:text-white'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly Match Prep */}
          <div className="bg-[#121722] border border-white/[0.08] rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-[#E4BD67]" />
                Haftalık Maç Hazırlığı (Sonraki Seri Bonusu)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {MATCH_PREP_OPTIONS.map((mp: any) => {
                const active = (userTeam.matchPrep || 'none') === mp.id;
                return (
                  <button
                    key={mp.id}
                    onClick={() => setMatchPrep(mp.id)}
                    className={`text-left p-3 rounded-md border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#171E2C] border-[#C89B3C] text-white'
                        : 'bg-[#0B0E14] border-white/[0.08] text-slate-300 hover:border-white/[0.2]'
                    }`}
                  >
                    <div className="text-xs font-bold">{mp.name || mp.label}</div>
                    <div className="text-[11px] text-slate-400 mt-1">{mp.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

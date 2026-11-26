import React, { useMemo, useState } from 'react';
import { Dumbbell, Swords, Building2, Users, Handshake, GraduationCap, LogOut } from 'lucide-react';
import { ROLES } from '../data/teamsAndPlayers.js';
import {
  TRAINING_MODES,
  TRAINING_INTENSITIES,
  FACILITY_INFO,
  STAFF_INFO,
  SPONSORS,
  formatMoney,
  getTeamRoster,
  getTeamWeeklyWages,
  getTeamWageCap,
  getTeamLuxuryTax,
  getTeamFacilityUpkeep,
  getAgeFatigueProfile,
  playWeeklyScrim,
  startKoreanBootcamp,
  upgradeFacility,
  upgradeStaff,
  promoteAcademyPlayer,
  resignFromClub,
} from '../engine/gameEngine.js';
import { soundFx } from '../engine/soundFx';

interface TrainingClubViewProps {
  mode: 'training' | 'club';
  state: any;
  userTeam: any;
  onSelectPlayer: (playerId: string) => void;
  onUpdate: (msg?: string) => void;
}

export const TrainingClubView: React.FC<TrainingClubViewProps> = ({
  mode,
  state,
  userTeam,
  onSelectPlayer,
  onUpdate,
}) => {
  const roster = useMemo(() => getTeamRoster(state, userTeam.id), [state, userTeam.id]);
  const weeklyWages = useMemo(() => getTeamWeeklyWages(state, userTeam.id), [state, userTeam.id]);
  const wageCap = useMemo(() => getTeamWageCap(userTeam), [userTeam]);
  const luxuryTax = useMemo(() => getTeamLuxuryTax(state, userTeam.id), [state, userTeam.id]);
  const facilityUpkeep = useMemo(() => getTeamFacilityUpkeep(userTeam), [userTeam]);
  const scrimRep = userTeam.scrimRep ?? Math.min(85, Math.max(52, userTeam.prestige - 8));

  const handleBootcamp = () => {
    soundFx.objectiveSecured();
    const res = startKoreanBootcamp(state);
    onUpdate(res.reason);
  };

  const scrimPartners = useMemo(
    () => state.teams.filter((t: any) => t.id !== userTeam.id).sort((a: any, b: any) => b.prestige - a.prestige),
    [state.teams, userTeam.id]
  );
  const [selectedScrimId, setSelectedScrimId] = useState<string>(() => scrimPartners[0]?.id || '');
  const [academyRole, setAcademyRole] = useState<string>('MID');

  const handlePlayScrim = () => {
    if (!selectedScrimId) return;
    soundFx.draftLock();
    const res = playWeeklyScrim(state, selectedScrimId);
    onUpdate(res.ok ? res.text : res.reason);
  };

  const handleUpgradeFacility = (key: string) => {
    soundFx.objectiveSecured();
    const res = upgradeFacility(state, key);
    onUpdate(res.reason);
  };

  const handleUpgradeStaff = (key: string) => {
    soundFx.objectiveSecured();
    const res = upgradeStaff(state, key);
    onUpdate(res.reason);
  };

  const handleSelectSponsor = (sp: any) => {
    if (userTeam.prestige < sp.minPrestige) {
      onUpdate(`Bu sponsor için en az ${sp.minPrestige} kulüp prestiji gerekiyor.`);
      return;
    }
    soundFx.click();
    userTeam.sponsor = sp;
    onUpdate(`${sp.name} ile ana sponsorluk anlaşması imzalandı.`);
  };

  const handlePromoteAcademy = () => {
    soundFx.draftLock();
    const res = promoteAcademyPlayer(state, academyRole);
    onUpdate(res.ok && res.player ? `${res.player.name} (${res.player.role} · OVR ${res.player.ovr}) A Takıma yükseltildi!` : res.reason);
  };

  const handleResign = () => {
    soundFx.click();
    resignFromClub(state);
    onUpdate('Kulüpten istifa edildi. Yeni teklifler gelen kutusunda.');
  };

  if (mode === 'training') {
    return (
      <div className="space-y-6">
        <div className="border-b border-white/[0.08] pb-4">
          <div className="text-xs text-[#E4BD67] font-semibold">Haftalık Gelişim Programı & Antrenman Maçları</div>
          <h1 className="font-display text-3xl font-extrabold text-white tracking-wide mt-0.5">
            Antrenman ve Scrim Merkezi
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Training Mode & Intensity */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-[#121722] border border-white/[0.08] rounded-lg p-5 space-y-4">
              <div className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/[0.08] pb-3">
                <Dumbbell className="w-4 h-4 text-[#E4BD67]" />
                Takım Antrenman Odağı
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {TRAINING_MODES.map((tm: any) => {
                  const active = (userTeam.trainingFocus || 'balanced') === tm.id;
                  return (
                    <button
                      key={tm.id}
                      onClick={() => {
                        soundFx.click();
                        userTeam.trainingFocus = tm.id;
                        onUpdate(`Antrenman odağı "${tm.name}" olarak ayarlandı.`);
                      }}
                      className={`text-left p-3.5 rounded-md border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#171E2C] border-[#C89B3C] text-white'
                          : 'bg-[#0B0E14] border-white/[0.08] text-slate-300 hover:border-white/[0.2]'
                      }`}
                    >
                      <div className="text-xs font-bold">{tm.name}</div>
                      <div className="text-[11px] text-slate-400 mt-1">{tm.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#121722] border border-white/[0.08] rounded-lg p-5 space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
                <span className="text-sm font-bold text-white">
                  Antrenman Yoğunluğu (Yorgunluk vs Gelişim Dengesi)
                </span>
                <span className="text-[11px] text-slate-400">Yaşa bağlı yorgunluk aktif</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {TRAINING_INTENSITIES.map((ti: any) => {
                  const active = (userTeam.trainingIntensity || 'normal') === ti.id;
                  return (
                    <button
                      key={ti.id}
                      onClick={() => {
                        soundFx.click();
                        userTeam.trainingIntensity = ti.id;
                        onUpdate(`Antrenman yoğunluğu "${ti.name}" olarak güncellendi.`);
                      }}
                      className={`text-left p-3.5 rounded-md border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#171E2C] border-[#C89B3C] text-white'
                          : 'bg-[#0B0E14] border-white/[0.08] text-slate-300 hover:border-white/[0.2]'
                      }`}
                    >
                      <div className="text-xs font-bold">{ti.name}</div>
                      <div className="text-[11px] text-slate-400 mt-1">{ti.desc}</div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                27+ yaş tecrübeli oyuncular yoğun antrenmanda ×1.24–1.46 daha hızlı yorulur ve daha yavaş toparlanır; 20 yaş altı gençler yoğun tempoyu çok daha rahat kaldırır.
              </p>
            </div>
          </div>

          {/* Weekly Scrim Block + Individual Training Shortcuts */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-[#121722] border border-white/[0.08] rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Swords className="w-4 h-4 text-[#E4BD67]" />
                  Haftalık Scrim Bloğu
                </span>
                <span className="text-xs font-mono-num text-slate-400">
                  {state.scrimDoneThisWeek ? 'Bu hafta yapıldı' : 'Hazır'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Güçlü rakiplerle scrim oynamak takım sinerjisini artırır ve o rakibe karşı gelecek resmi maçta <strong className="text-slate-200">Scrim İstihbaratı</strong> bonusu kazandırır.
              </p>
              <select
                value={selectedScrimId}
                onChange={(e) => setSelectedScrimId(e.target.value)}
                className="w-full bg-[#0B0E14] border border-white/[0.12] rounded-md px-3 py-2 text-xs text-white"
              >
                {scrimPartners.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.region} · Prestij {t.prestige})
                  </option>
                ))}
              </select>
              <button
                disabled={state.scrimDoneThisWeek}
                onClick={handlePlayScrim}
                className={`w-full py-2.5 rounded-md text-xs font-bold ${
                  state.scrimDoneThisWeek
                    ? 'bg-white/[0.06] text-slate-500 cursor-not-allowed'
                    : 'bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] cursor-pointer'
                }`}
              >
                {state.scrimDoneThisWeek ? 'Bu Hafta Scrim Tamamlandı' : 'Scrim Bloğunu Oyna'}
              </button>

              <div className="pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="text-slate-400 font-mono-num">
                  Scrim İtibarı: <strong className="text-[#E4BD67]">{scrimRep}/100</strong>
                  {(state.koreanBootcampWeeks || 0) > 0 && (
                    <span className="text-emerald-400 ml-2">· Seul Kampı ({state.koreanBootcampWeeks}h)</span>
                  )}
                </div>
                <button
                  disabled={(state.koreanBootcampWeeks || 0) > 0}
                  onClick={handleBootcamp}
                  className={`px-3 py-1.5 rounded-md border text-[11px] font-semibold ${
                    (state.koreanBootcampWeeks || 0) > 0
                      ? 'border-white/[0.06] text-slate-500 cursor-not-allowed'
                      : 'border-[#C89B3C]/60 text-[#E4BD67] hover:bg-[#C89B3C]/15 cursor-pointer'
                  }`}
                >
                  {(state.koreanBootcampWeeks || 0) > 0 ? 'Kore Kampında' : 'Kore Bootcamp ($180K)'}
                </button>
              </div>
            </div>

            <div className="bg-[#121722] border border-white/[0.08] rounded-lg p-5 space-y-3">
              <div className="text-sm font-bold text-white border-b border-white/[0.08] pb-3">
                Bireysel Oyuncu Programları
              </div>
              <div className="divide-y divide-white/[0.06] text-xs">
                {roster.map((p: any) => {
                  const ageProf = getAgeFatigueProfile(p.age);
                  const fatVal = Math.round(p.fatigue || 0);
                  return (
                    <button
                      key={p.id}
                      onClick={() => onSelectPlayer(p.id)}
                      className="w-full py-2.5 flex items-center justify-between gap-2 hover:bg-white/[0.02] cursor-pointer text-left"
                    >
                      <div>
                        <span className="font-mono-num text-[#E4BD67] mr-2">{p.role}</span>
                        <span className="font-bold text-white">{p.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono-num ml-2">
                          {p.age}y · Yorg %{fatVal}
                        </span>
                      </div>
                      <span className="text-slate-400 text-[11px]">
                        <span className="font-mono-num text-slate-500 mr-2">×{ageProf.gainMult.toFixed(2)}</span>
                        Odak: <strong className="text-slate-200">{p.indFocus && p.indFocus !== 'none' ? p.indFocus : 'Genel'}</strong>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CLUB / FACILITIES / STAFF / SPONSORS / FINANCES MODE
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="text-xs text-[#E4BD67] font-semibold">Kulüp Yönetimi, Tesisler ve Finans</div>
          <h1 className="font-display text-3xl font-extrabold text-white tracking-wide mt-0.5">
            {userTeam.name} Altyapı & Mali İşler
          </h1>
        </div>
        <div className="flex items-center gap-6 font-mono-num text-xs">
          <div>
            <div className="text-slate-500">Kasa</div>
            <div className="text-lg font-bold text-[#E4BD67]">{formatMoney(userTeam.budget)}</div>
          </div>
          <div>
            <div className="text-slate-500">Haftalık Maaş / Limit</div>
            <div className="text-sm font-bold text-white">
              {formatMoney(weeklyWages)} / {formatMoney(wageCap)}
            </div>
            <div className="text-[10px] text-slate-400">
              Bakım: {formatMoney(facilityUpkeep)}/hf
              {luxuryTax > 0 && <span className="text-rose-400 ml-2">· Lüks Vergisi: {formatMoney(luxuryTax)}/hf</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Facilities & Staff 2-Col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Facilities */}
        <div className="bg-[#121722] border border-white/[0.08] rounded-lg p-5 space-y-3">
          <div className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/[0.08] pb-3">
            <Building2 className="w-4 h-4 text-[#E4BD67]" />
            Kulüp Tesisleri (Sv. 1–3)
          </div>
          <div className="divide-y divide-white/[0.06]">
            {Object.entries(FACILITY_INFO).map(([key, info]: [string, any]) => {
              const lv = userTeam.facilities?.[key] || 1;
              const maxed = lv >= 3;
              const cost = maxed ? 0 : (info.costs?.[lv] ?? 0);
              return (
                <div key={key} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="min-w-0">
                    <div className="font-bold text-white">
                      {info.name} <span className="font-mono-num text-[#E4BD67]">Sv.{lv}/3</span>
                    </div>
                    <div className="text-slate-400 mt-0.5">{info.desc}</div>
                  </div>
                  <button
                    disabled={maxed}
                    onClick={() => handleUpgradeFacility(key)}
                    className={`px-3.5 py-1.5 rounded-md font-semibold whitespace-nowrap shrink-0 ${
                      maxed
                        ? 'bg-white/[0.05] text-slate-500 cursor-not-allowed'
                        : 'bg-[#171E2C] hover:bg-[#C89B3C] hover:text-[#0B0E14] border border-white/[0.12] text-white cursor-pointer'
                    }`}
                  >
                    {maxed ? 'Maksimum' : `Yükselt (${formatMoney(cost)})`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coaching & Technical Staff */}
        <div className="bg-[#121722] border border-white/[0.08] rounded-lg p-5 space-y-3">
          <div className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/[0.08] pb-3">
            <Users className="w-4 h-4 text-[#E4BD67]" />
            Teknik Kadro & Analiz Ekibi (Sv. 1–3)
          </div>
          <div className="divide-y divide-white/[0.06]">
            {Object.entries(STAFF_INFO).map(([key, info]: [string, any]) => {
              const lv = userTeam.staff?.[key] || 1;
              const maxed = lv >= 3;
              const cost = maxed ? 0 : (info.costs?.[lv] ?? 0);
              const wage = info.wages?.[lv] ?? 0;
              return (
                <div key={key} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="min-w-0">
                    <div className="font-bold text-white">
                      {info.name} <span className="font-mono-num text-[#E4BD67]">Sv.{lv}/3</span>
                      <span className="font-mono-num text-[11px] text-slate-500 ml-2">
                        ({formatMoney(wage)}/hf)
                      </span>
                    </div>
                    <div className="text-slate-400 mt-0.5">{info.desc}</div>
                  </div>
                  <button
                    disabled={maxed}
                    onClick={() => handleUpgradeStaff(key)}
                    className={`px-3.5 py-1.5 rounded-md font-semibold whitespace-nowrap shrink-0 ${
                      maxed
                        ? 'bg-white/[0.05] text-slate-500 cursor-not-allowed'
                        : 'bg-[#171E2C] hover:bg-[#C89B3C] hover:text-[#0B0E14] border border-white/[0.12] text-white cursor-pointer'
                    }`}
                  >
                    {maxed ? 'Maksimum' : `Geliştir (${formatMoney(cost)})`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sponsors & Academy Promotion */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[#121722] border border-white/[0.08] rounded-lg p-5 space-y-3">
          <div className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/[0.08] pb-3">
            <Handshake className="w-4 h-4 text-[#E4BD67]" />
            Ana Sponsorluk Anlaşmaları
          </div>
          <div className="divide-y divide-white/[0.06] text-xs">
            {SPONSORS.map((sp: any) => {
              const isCurrent = userTeam.sponsor?.id === sp.id;
              const locked = userTeam.prestige < sp.minPrestige;
              return (
                <div key={sp.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-white">
                      {sp.name}{' '}
                      {isCurrent && <span className="text-[#E4BD67] font-mono-num text-[11px]">· AKTİF</span>}
                    </div>
                    <div className="text-slate-400 font-mono-num mt-0.5">
                      Haftalık {formatMoney(sp.weekly)} · Hedef Primi {formatMoney(sp.bonus)} ({sp.goal}) · Min Prestij{' '}
                      {sp.minPrestige}
                    </div>
                  </div>
                  <button
                    disabled={isCurrent || locked}
                    onClick={() => handleSelectSponsor(sp)}
                    className={`px-3.5 py-1.5 rounded-md font-semibold whitespace-nowrap ${
                      isCurrent
                        ? 'bg-emerald-500/15 text-emerald-400 cursor-default'
                        : locked
                        ? 'bg-white/[0.05] text-slate-500 cursor-not-allowed'
                        : 'bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] font-bold cursor-pointer'
                    }`}
                  >
                    {isCurrent ? 'Aktif Sponsor' : locked ? 'Prestij Yetersiz' : 'Anlaşma İmzala'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Academy & Career Control */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-[#121722] border border-white/[0.08] rounded-lg p-5 space-y-4">
            <div className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/[0.08] pb-3">
              <GraduationCap className="w-4 h-4 text-[#E4BD67]" />
              Gençlik Akademisinden Oyuncu Yükselt
            </div>
            <p className="text-xs text-slate-400">
              Akademi seviyesi (Sv.{userTeam.facilities?.youthAcademy || 1}) yükseldikçe A Takıma çıkacak genç yeteneğin potansiyeli artar. Her mevsimde 1 oyuncu yükseltilebilir.
            </p>
            <div className="flex items-center gap-2">
              <select
                value={academyRole}
                onChange={(e) => setAcademyRole(e.target.value)}
                className="flex-1 bg-[#0B0E14] border border-white/[0.12] rounded-md px-3 py-2 text-xs text-white"
              >
                {ROLES.map((r: string) => (
                  <option key={r} value={r}>
                    {r} Mevkii
                  </option>
                ))}
              </select>
              <button
                disabled={state.academyPromotedThisSplit}
                onClick={handlePromoteAcademy}
                className={`px-4 py-2 rounded-md text-xs font-bold whitespace-nowrap ${
                  state.academyPromotedThisSplit
                    ? 'bg-white/[0.06] text-slate-500 cursor-not-allowed'
                    : 'bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] cursor-pointer'
                }`}
              >
                {state.academyPromotedThisSplit ? 'Bu Split Kullanıldı' : 'A Takıma Al'}
              </button>
            </div>
          </div>

          <div className="bg-[#121722] border border-white/[0.08] rounded-lg p-5 flex items-center justify-between gap-4">
            <div className="text-xs">
              <div className="font-bold text-white">Kariyer İstatistikleri</div>
              <div className="text-slate-400 font-mono-num mt-0.5">
                {state.records?.careerWins || 0}G - {state.records?.careerLosses || 0}M · En İyi Seri:{' '}
                {state.records?.bestStreak || 0}
              </div>
            </div>
            <button
              onClick={handleResign}
              className="px-3.5 py-2 rounded-md border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              İstifa Et
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { X, MessageSquare, FileText, DollarSign, Dumbbell, Shield, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { CHAMPIONS, CHAMPION_MAP } from '../data/champions.js';
import { TRAITS } from '../data/teamsAndPlayers.js';
import {
  formatMoney,
  talkToPlayer1on1,
  getRenewalDemand,
  negotiateContractRenewal,
  setPlayerIndividualTraining,
  offerPlayerToClubs,
  negotiateSaleCounter,
  completePlayerSale,
  setStarter,
  releasePlayer,
  getPlayerValuationDetails,
  getAgeFatigueProfile,
} from '../engine/gameEngine.js';
import { RadarChart, OvrValue } from './shared/Visuals';
import { soundFx } from '../engine/soundFx';

interface PlayerProfileModalProps {
  state: any;
  playerId: string;
  onUpdate: (msg?: string) => void;
  onClose: () => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  state,
  playerId,
  onUpdate,
  onClose,
}) => {
  const player = state.players.find((p: any) => p.id === playerId);
  const userTeam = state.teams.find((t: any) => t.id === state.userTeamId);
  const [subTab, setSubTab] = useState<'overview' | 'training' | 'contract' | 'sell'>('overview');

  const demand = useMemo(() => (player ? getRenewalDemand(state, player.id) : null), [state, player]);
  const valuation = useMemo(
    () => (player ? getPlayerValuationDetails(state, player, userTeam) : null),
    [state, player, userTeam]
  );
  const ageProfile = useMemo(() => getAgeFatigueProfile(player?.age), [player?.age]);

  const [renewSalary, setRenewSalary] = useState<number>(() => demand?.minSalary || player?.salary || 15000);
  const [renewYears, setRenewYears] = useState<number>(2);
  const [rolePromise, setRolePromise] = useState<string>('STAR');

  const [indFocus, setIndFocus] = useState<string>(player?.indFocus || 'none');
  const [learnChamp, setLearnChamp] = useState<string>(player?.learningChampId || '');

  const [askingPrice, setAskingPrice] = useState<number>(() => valuation?.fairSaleValue || Math.round((player?.marketValue || 200000) * 1.05));
  const [saleOffers, setSaleOffers] = useState<any[]>([]);
  const [saleFeedback, setSaleFeedback] = useState<string>('');
  const [talkFeedback, setTalkFeedback] = useState<string>('');

  if (!player || !valuation) return null;

  const isOwned = player.teamId === state.userTeamId;
  const team = state.teams.find((t: any) => t.id === player.teamId);
  const traitInfo = (TRAITS as Record<string, { label: string; desc: string }>)[player.trait] || {
    label: player.trait || 'Standart',
    desc: '',
  };
  const roleChamps = CHAMPIONS.filter((c: any) => c.roles.includes(player.role));
  const kda =
    player.stats?.games > 0
      ? ((player.stats.kills + player.stats.assists) / Math.max(1, player.stats.deaths)).toFixed(2)
      : '—';

  const handleTalk = (action: 'praise' | 'criticize' | 'motivate' | 'rest') => {
    soundFx.click();
    const res = talkToPlayer1on1(state, player.id, action);
    setTalkFeedback(res.reason || (res.ok ? 'Görüşme tamamlandı.' : 'Görüşme yapılamadı.'));
    onUpdate();
  };

  const handleSaveTraining = () => {
    soundFx.click();
    const res = setPlayerIndividualTraining(state, player.id, indFocus, learnChamp || null);
    onUpdate(res?.reason || `${player.name} bireysel antrenman programı kaydedildi.`);
  };

  const handleRenewSubmit = () => {
    soundFx.draftLock();
    const res = negotiateContractRenewal(state, player.id, renewSalary, renewYears, rolePromise);
    onUpdate(res.reason);
    if (res.ok) setSubTab('overview');
  };

  const handleOfferToClubs = () => {
    soundFx.click();
    const res = offerPlayerToClubs(state, player.id, askingPrice);
    setSaleOffers(res.offers || []);
    setSaleFeedback(
      res.reason || (res.offers?.length ? `${res.offers.length} kulüpten teklif geldi.` : 'İlgi gösteren kulüp çıkmadı.')
    );
  };

  const handleAcceptSale = (offer: any) => {
    soundFx.objectiveSecured();
    const res = completePlayerSale(state, player.id, offer.buyerTeamId, offer.amount);
    onUpdate(res.reason);
    if (res.ok) onClose();
  };

  const handleCounterSale = (idx: number) => {
    const offer = saleOffers[idx];
    if (!offer) return;
    soundFx.click();
    const counterAmt = Math.round(offer.amount * 1.15);
    const res = negotiateSaleCounter(offer, counterAmt);
    setSaleOffers([...saleOffers]);
    setSaleFeedback(res.reason);
  };

  const fatigueHigh = player.fatigue >= ageProfile.injuryThreshold - 10;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#121722] border border-white/[0.12] rounded-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-md bg-[#171E2C] border border-white/[0.12] flex flex-col items-center justify-center shrink-0">
              <span className="font-mono-num text-[10px] text-slate-400">{player.role}</span>
              <OvrValue ovr={player.ovr} size="md" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-2xl font-extrabold text-white tracking-wide truncate">
                  {player.name}
                </h3>
                <span className="text-xs text-slate-400 font-mono-num">
                  {player.nat} · {player.age} yaş · POT {player.pot}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5 truncate">
                {team ? team.name : 'Serbest Oyuncu'} · Stil: {player.style} · Karakter: {traitInfo.label} · Değer:{' '}
                <span className="font-mono-num text-[#E4BD67]">{formatMoney(valuation.marketValue)}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Navigation */}
        <div className="px-6 py-2.5 border-b border-white/[0.08] bg-[#0B0E14]/60 flex items-center justify-between gap-3 flex-wrap shrink-0">
          <div className="flex items-center gap-1">
            {[
              { id: 'overview', label: 'Genel & Değerleme', icon: Shield },
              ...(isOwned
                ? [
                    { id: 'training', label: 'Bireysel Antrenman', icon: Dumbbell },
                    { id: 'contract', label: 'Sözleşme Yenileme', icon: FileText },
                    { id: 'sell', label: 'Kulüplere Öner', icon: DollarSign },
                  ]
                : []),
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  subTab === t.id ? 'bg-[#C89B3C] text-[#0B0E14]' : 'text-slate-400 hover:text-white'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>
          {isOwned && (
            <div className="flex items-center gap-2">
              {!player.isStarter && (
                <button
                  onClick={() => {
                    setStarter(state, player.id);
                    onUpdate(`${player.name} ilk 5 kadrosuna alındı.`);
                  }}
                  className="px-3 py-1.5 rounded-md border border-[#C89B3C]/60 text-[#E4BD67] hover:bg-[#C89B3C]/15 text-xs font-semibold cursor-pointer"
                >
                  İlk 5'e Al
                </button>
              )}
              <button
                onClick={() => {
                  const res = releasePlayer(state, player.id);
                  onUpdate(res.reason);
                  if (res.ok) onClose();
                }}
                className="px-3 py-1.5 rounded-md border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold cursor-pointer"
              >
                Serbest Bırak
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {subTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Radar + Vitals + Age Stamina Profile */}
              <div className="md:col-span-5 space-y-4">
                <div className="bg-[#0B0E14] border border-white/[0.08] rounded-lg p-4">
                  <div className="text-xs font-semibold text-slate-400 mb-2 text-center">
                    FM 6-Eksen Yetenek Profili
                  </div>
                  <RadarChart attrs={player.attrs} size={210} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center font-mono-num bg-[#0B0E14] border border-white/[0.08] rounded-lg p-3">
                  <div>
                    <div className="text-[10px] text-slate-500">Moral</div>
                    <div className="text-sm font-bold text-emerald-400">{Math.round(player.morale)}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Form</div>
                    <div className="text-sm font-bold text-sky-400">{Math.round(player.form)}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Yorgunluk</div>
                    <div
                      className={`text-sm font-bold ${
                        fatigueHigh ? 'text-rose-400' : 'text-slate-200'
                      }`}
                    >
                      {Math.round(player.fatigue)}%
                    </div>
                  </div>
                </div>

                {/* Age-Linked Stamina & Fatigue Profile */}
                <div className="bg-[#0B0E14] border border-white/[0.08] rounded-lg p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-[#E4BD67]" />
                      Yaş & Kondisyon Profili
                    </span>
                    <span
                      className={`font-mono-num text-[11px] font-semibold ${
                        player.age >= 27 ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {ageProfile.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/[0.06] font-mono-num text-[11px]">
                    <div>
                      <div className="text-slate-500">Yorulma</div>
                      <div className={`font-bold ${ageProfile.gainMult > 1.1 ? 'text-amber-400' : 'text-slate-200'}`}>
                        ×{ageProfile.gainMult.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Toparlanma</div>
                      <div className={`font-bold ${ageProfile.recMult < 0.9 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        ×{ageProfile.recMult.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Risk Eşiği</div>
                      <div className="font-bold text-slate-200">%{ageProfile.injuryThreshold}</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 leading-relaxed">{ageProfile.desc}</div>
                </div>
              </div>

              {/* Right Details */}
              <div className="md:col-span-7 space-y-5">
                {/* Season Stats & Contract */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-white/[0.08] pb-4 font-mono-num">
                  <div>
                    <div className="text-[11px] text-slate-500">Maç / Galibiyet</div>
                    <div className="text-sm font-bold text-white">
                      {player.stats?.games || 0} / {player.stats?.wins || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Sezon KDA</div>
                    <div className="text-sm font-bold text-[#E4BD67]">{kda}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Haftalık Maaş</div>
                    <div className="text-sm font-bold text-white">{formatMoney(player.salary)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">Kalan Sözleşme</div>
                    <div className={`text-sm font-bold ${(player.contractYears || 0) <= 1 ? 'text-amber-400' : 'text-white'}`}>
                      {player.teamId ? `${player.contractYears} Sezon` : 'Serbest'}
                    </div>
                  </div>
                </div>

                {/* Multi-Factor Market Valuation & Buyout Card */}
                <div className="bg-[#0B0E14] border border-white/[0.08] rounded-lg p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] pb-2.5">
                    <div>
                      <div className="text-[11px] text-slate-400 font-semibold">Piyasa Değerlemesi & Bonservis Analizi</div>
                      <div className="flex items-center gap-2 mt-0.5 font-mono-num">
                        <span className="text-lg font-bold text-[#E4BD67]">{formatMoney(valuation.marketValue)}</span>
                        {valuation.trend !== 'STABLE' && (
                          <span
                            className={`text-xs inline-flex items-center gap-0.5 font-semibold ${
                              valuation.trend === 'UP' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {valuation.trend === 'UP' ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {valuation.deltaPct > 0 ? `+${valuation.deltaPct}%` : `${valuation.deltaPct}%`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right font-mono-num text-xs">
                      <div className="text-slate-500 text-[10px]">
                        {player.teamId ? 'Tahmini Bonservis Aralığı' : 'İmza Primi'}
                      </div>
                      <div className="font-bold text-white">
                        {player.teamId
                          ? `${formatMoney(valuation.estimatedFeeMin)} – ${formatMoney(valuation.estimatedFeeMax)}`
                          : formatMoney(valuation.signingBonus)}
                      </div>
                      <div className="text-[10px] text-slate-400">{valuation.clubStanceLabel}</div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {valuation.factors.map((f: any) => (
                      <div key={f.key} className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-slate-400">
                          <strong className="text-slate-200">{f.label}:</strong> {f.detail}
                        </span>
                        <span
                          className={`font-mono-num font-bold shrink-0 ${
                            f.pct > 0 ? 'text-emerald-400' : f.pct < 0 ? 'text-rose-400' : 'text-slate-400'
                          }`}
                        >
                          {f.pct > 0 ? `+${f.pct}%` : `${f.pct}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Signature Champions & Mastery */}
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-white">İmza Şampiyonlar & Ustalık Havuzu</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(player.sigChamps || []).map((cid: string) => {
                      const c = CHAMPION_MAP[cid];
                      const lv = player.mastery?.[cid] || 3;
                      return (
                        <div
                          key={cid}
                          className="px-3 py-2 rounded-md bg-[#0B0E14] border border-white/[0.08] flex items-center justify-between text-xs"
                        >
                          <span className="font-semibold text-white truncate">{c?.name || cid}</span>
                          <span className="font-mono-num text-[11px] text-[#E4BD67]">Sv.{lv}</span>
                        </div>
                      );
                    })}
                  </div>
                  {traitInfo.desc && (
                    <p className="text-xs text-slate-400">
                      <strong className="text-slate-200">{traitInfo.label}:</strong> {traitInfo.desc}
                    </p>
                  )}
                </div>

                {/* 1-on-1 Coach Talk */}
                {isOwned && (
                  <div className="space-y-2.5 pt-3 border-t border-white/[0.08]">
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#E4BD67]" />
                      Birebir Koç Görüşmesi (FM 1-on-1)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'praise', label: 'Performansı Öv' },
                        { id: 'motivate', label: 'Motive Et' },
                        { id: 'criticize', label: 'Uyar / Eleştir' },
                        { id: 'rest', label: 'İzin Ver (Dinlen)' },
                      ].map((a) => (
                        <button
                          key={a.id}
                          onClick={() => handleTalk(a.id as any)}
                          className="px-3 py-2 rounded-md border border-white/[0.1] bg-[#171E2C] hover:border-[#C89B3C] text-xs font-semibold text-slate-200 cursor-pointer whitespace-nowrap"
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                    {talkFeedback && <div className="text-xs text-[#E4BD67]">{talkFeedback}</div>}
                  </div>
                )}
              </div>
            </div>
          )}

          {subTab === 'training' && isOwned && (
            <div className="max-w-xl space-y-5">
              <div>
                <h4 className="text-sm font-bold text-white">Bireysel Gelişim Odağı</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Haftalık antrenmanlarda bu oyuncunun ekstra ağırlık vereceği özelliği ve öğreneceği yeni meta şampiyonu belirle.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Özellik Odağı</label>
                <select
                  value={indFocus}
                  onChange={(e) => setIndFocus(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-white/[0.12] rounded-md px-3 py-2 text-xs text-white"
                >
                  <option value="none">Genel Dengeli Gelişim</option>
                  <option value="mechanics">Mekanik & Refleks</option>
                  <option value="laning">Koridor Safhası (Laning)</option>
                  <option value="macro">Makro & Harita Okuma</option>
                  <option value="teamfight">Takım Savaşı Pozisyonu</option>
                  <option value="clutch">Soğukkanlılık (Clutch)</option>
                  <option value="pool">Şampiyon Havuzu Genişletme</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Yeni İmza Şampiyon Çalışması ({player.role})
                </label>
                <select
                  value={learnChamp}
                  onChange={(e) => setLearnChamp(e.target.value)}
                  className="w-full bg-[#0B0E14] border border-white/[0.12] rounded-md px-3 py-2 text-xs text-white"
                >
                  <option value="">Seçilmedi</option>
                  {roleChamps.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.classTag} · {c.dmg})
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSaveTraining}
                className="px-5 py-2.5 rounded-md bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] text-xs font-bold cursor-pointer"
              >
                Bireysel Programı Kaydet
              </button>
            </div>
          )}

          {subTab === 'contract' && isOwned && demand && (
            <div className="max-w-xl space-y-5">
              <div className="border-b border-white/[0.08] pb-3">
                <h4 className="text-sm font-bold text-white">Sözleşme Yenileme Masası</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Menajer beklentisi: Haftalık en az{' '}
                  <strong className="font-mono-num text-[#E4BD67]">{formatMoney(demand.minSalary)}</strong>
                  {demand.wantsStar ? ' · Yıldız oyuncu statüsü talep ediyor.' : ' · İlk 5 veya rotasyon rolü kabul edilebilir.'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Not: Sözleşmeyi 3 sezona uzatmak oyuncunun piyasa değerini ve bonservis korumasını artırır.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold">Teklif (Haftalık $)</label>
                  <input
                    type="number"
                    step={500}
                    value={renewSalary}
                    onChange={(e) => setRenewSalary(Number(e.target.value))}
                    className="w-full bg-[#0B0E14] border border-white/[0.12] rounded-md px-3 py-2 font-mono-num text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold">Süre (Sezon)</label>
                  <select
                    value={renewYears}
                    onChange={(e) => setRenewYears(Number(e.target.value))}
                    className="w-full bg-[#0B0E14] border border-white/[0.12] rounded-md px-3 py-2 text-white"
                  >
                    <option value={1}>1 Sezon</option>
                    <option value={2}>2 Sezon</option>
                    <option value={3}>3 Sezon</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-semibold">Kadro Sözü</label>
                  <select
                    value={rolePromise}
                    onChange={(e) => setRolePromise(e.target.value)}
                    className="w-full bg-[#0B0E14] border border-white/[0.12] rounded-md px-3 py-2 text-white"
                  >
                    <option value="STAR">Yıldız Oyuncu</option>
                    <option value="STARTER">Düzenli İlk 5</option>
                    <option value="ROTATION">Rotasyon</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleRenewSubmit}
                className="px-5 py-2.5 rounded-md bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] text-xs font-bold cursor-pointer"
              >
                Sözleşme Teklifini İlet
              </button>
            </div>
          )}

          {subTab === 'sell' && isOwned && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-end gap-3 border-b border-white/[0.08] pb-4">
                <div className="space-y-1.5 flex-1 min-w-[200px]">
                  <label className="text-xs font-semibold text-slate-300">
                    Talep Edilen Bonservis (Piyasa Değeri: {formatMoney(valuation.marketValue)} · Gerçekçi Satış:{' '}
                    {formatMoney(valuation.fairSaleValue)})
                  </label>
                  <input
                    type="number"
                    step={25000}
                    value={askingPrice}
                    onChange={(e) => setAskingPrice(Number(e.target.value))}
                    className="w-full bg-[#0B0E14] border border-white/[0.12] rounded-md px-3 py-2 font-mono-num text-xs text-white"
                  />
                </div>
                <button
                  onClick={handleOfferToClubs}
                  className="px-4 py-2 rounded-md bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] text-xs font-bold cursor-pointer whitespace-nowrap"
                >
                  Kulüplere Teklif Et
                </button>
              </div>

              {saleFeedback && <div className="text-xs text-[#E4BD67]">{saleFeedback}</div>}

              {saleOffers.length > 0 && (
                <div className="divide-y divide-white/[0.07] border border-white/[0.08] rounded-md">
                  {saleOffers.map((off, idx) => (
                    <div key={idx} className="p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-white">
                          {off.buyerName} ({off.buyerRegion})
                        </div>
                        <div className="text-slate-400 font-mono-num mt-0.5">
                          Teklif: <strong className="text-emerald-400">{formatMoney(off.amount)}</strong>
                          {off.withdrawn ? ' · Geri Çekildi' : ''}
                        </div>
                      </div>
                      {!off.withdrawn && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCounterSale(idx)}
                            className="px-3 py-1.5 rounded-md border border-white/[0.12] text-slate-200 hover:border-[#C89B3C] cursor-pointer"
                          >
                            +%15 Pazarlık
                          </button>
                          <button
                            onClick={() => handleAcceptSale(off)}
                            className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                          >
                            Satışı Onayla
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

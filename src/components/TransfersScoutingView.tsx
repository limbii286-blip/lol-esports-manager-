import React, { useMemo, useState } from 'react';
import { Search, Radar, ArrowRightLeft, Inbox, Check, X, TrendingUp, TrendingDown } from 'lucide-react';
import { ROLES } from '../data/teamsAndPlayers.js';
import {
  formatMoney,
  getTransferWindowStatus,
  evaluateTransferInterest,
  getPlayerValuationDetails,
  getFreeAgentBiddingWar,
  getTeamWeeklyWages,
  getTeamWageCap,
  attemptSignOrTransfer,
  scoutChallengerProspect,
  signChallengerProspect,
  getTransferRoomOpportunities,
  respondIncomingOffer,
} from '../engine/gameEngine.js';
import { OvrValue } from './shared/Visuals';
import { soundFx } from '../engine/soundFx';

interface TransfersScoutingViewProps {
  state: any;
  userTeam: any;
  onSelectPlayer: (playerId: string) => void;
  onUpdate: (msg?: string) => void;
}

export const TransfersScoutingView: React.FC<TransfersScoutingViewProps> = ({
  state,
  userTeam,
  onSelectPlayer,
  onUpdate,
}) => {
  const [subTab, setSubTab] = useState<'market' | 'scouting' | 'room' | 'incoming'>('market');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FA' | 'EXPIRING' | 'CONTRACTED'>('ALL');
  const [sortBy, setSortBy] = useState<'ovr' | 'value' | 'pot' | 'form' | 'age'>('ovr');
  const [minOvr, setMinOvr] = useState<number>(72);
  const [search, setSearch] = useState('');

  // Negotiation Modal State
  const [negPlayer, setNegPlayer] = useState<any>(null);
  const [offerBuyout, setOfferBuyout] = useState<number>(0);
  const [offerSalary, setOfferSalary] = useState<number>(15000);
  const [offerYears, setOfferYears] = useState<number>(2);
  const [negResult, setNegResult] = useState<string>('');

  const windowStatus = useMemo(() => getTransferWindowStatus(state), [state]);
  const opportunities = useMemo(() => getTransferRoomOpportunities(state), [state]);
  const weeklyWages = useMemo(() => getTeamWeeklyWages(state, userTeam.id), [state, userTeam.id]);
  const wageCap = useMemo(() => getTeamWageCap(userTeam), [userTeam]);
  const wageRoom = Math.max(0, wageCap - weeklyWages);
  const incomingOffers = state.incomingOffers || [];
  const prospects = state.challengerPool || [];

  const marketPlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.players
      .filter((p: any) => p.teamId !== userTeam.id)
      .filter((p: any) => (roleFilter === 'ALL' ? true : p.role === roleFilter))
      .filter((p: any) => {
        if (statusFilter === 'ALL') return true;
        if (statusFilter === 'FA') return !p.teamId;
        if (statusFilter === 'EXPIRING') return Boolean(p.teamId) && (p.contractYears || 0) <= 1;
        return Boolean(p.teamId);
      })
      .filter((p: any) => p.ovr >= minOvr)
      .filter((p: any) => (!q ? true : p.name.toLowerCase().includes(q) || p.nat.toLowerCase().includes(q)))
      .sort((a: any, b: any) => {
        if (sortBy === 'value') return (b.marketValue || 0) - (a.marketValue || 0);
        if (sortBy === 'pot') return b.pot - a.pot || b.ovr - a.ovr;
        if (sortBy === 'form') return (b.form || 75) - (a.form || 75) || b.ovr - a.ovr;
        if (sortBy === 'age') return a.age - b.age || b.pot - a.pot;
        return b.ovr - a.ovr || b.pot - a.pot;
      })
      .slice(0, 60);
  }, [state.players, userTeam.id, roleFilter, statusFilter, sortBy, minOvr, search]);

  const openNegotiation = (player: any) => {
    soundFx.click();
    const val = getPlayerValuationDetails(state, player, userTeam);
    const interest = evaluateTransferInterest(state, player, userTeam);
    const initialBuyout = !player.teamId
      ? val.signingBonus
      : Math.round(((val.estimatedFeeMin + val.estimatedFeeMax) / 2) / 5000) * 5000;
    const suggestedSalary = Math.round(((player.salary || 12000) * Math.max(1.08, interest.salaryMult || 1.08)) / 500) * 500;
    setNegPlayer(player);
    setOfferBuyout(initialBuyout);
    setOfferSalary(suggestedSalary);
    setOfferYears(2);
    setNegResult('');
  };

  const handleSubmitOffer = () => {
    if (!negPlayer) return;
    soundFx.draftLock();
    const res = attemptSignOrTransfer(state, negPlayer.id, offerBuyout, offerSalary, offerYears);
    setNegResult(res.reason);
    if (res.ok) {
      onUpdate(res.reason);
      setNegPlayer(null);
    } else {
      onUpdate();
    }
  };

  const handleScout = (prospectId: string) => {
    soundFx.click();
    const res = scoutChallengerProspect(state, prospectId);
    onUpdate(res.reason);
  };

  const handleSignProspect = (prospectId: string) => {
    soundFx.draftLock();
    const res = signChallengerProspect(state, prospectId);
    onUpdate(res.reason);
  };

  const handleIncomingDecision = (offerId: string, accept: boolean) => {
    soundFx.click();
    const res = respondIncomingOffer(state, offerId, accept);
    onUpdate(res.reason);
  };

  const negInterest = useMemo(
    () => (negPlayer ? evaluateTransferInterest(state, negPlayer, userTeam) : null),
    [state, negPlayer, userTeam]
  );

  const negValuation = useMemo(
    () => (negPlayer ? getPlayerValuationDetails(state, negPlayer, userTeam) : null),
    [state, negPlayer, userTeam]
  );

  const negBiddingWar = useMemo(
    () => (negPlayer ? getFreeAgentBiddingWar(state, negPlayer, userTeam) : null),
    [state, negPlayer, userTeam]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="text-xs text-[#E4BD67] font-semibold">
            Transfer Merkezi & Küresel Scout Ağı · {windowStatus.label}
          </div>
          <h1 className="font-display text-3xl font-extrabold text-white tracking-wide mt-0.5">
            Oyuncu Piyasası ve Bonservis Merkezi
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-xs font-mono-num">
          <div>
            <div className="text-slate-500">Transfer Bütçesi</div>
            <div className="text-[#E4BD67] text-base font-bold">{formatMoney(userTeam.budget)}</div>
          </div>
          <div>
            <div className="text-slate-500">Haftalık Maaş Boşluğu</div>
            <div className={`text-sm font-bold ${wageRoom < 15000 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {formatMoney(wageRoom)}/hf
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#121722] border border-white/[0.08] rounded-lg w-fit overflow-x-auto max-w-full">
        {[
          { id: 'market', label: 'Küresel Pazar', icon: Search },
          { id: 'scouting', label: `Challenger Wonderkids (${prospects.length})`, icon: Radar },
          { id: 'room', label: `Transfer Odası (${opportunities.length})`, icon: ArrowRightLeft },
          { id: 'incoming', label: `Gelen Teklifler (${incomingOffers.length})`, icon: Inbox },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id as any)}
            className={`px-3.5 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              subTab === t.id ? 'bg-[#C89B3C] text-[#0B0E14]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: GLOBAL MARKET */}
      {subTab === 'market' && (
        <div className="space-y-4">
          <div className="bg-[#121722] border border-white/[0.08] rounded-lg p-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Oyuncu veya uyruk ara (Chovy, Faker, TR, KR)..."
                className="w-full bg-[#0B0E14] border border-white/[0.1] rounded-md pl-8 pr-3 py-2 text-xs text-white outline-none focus:border-[#C89B3C]"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#0B0E14] p-1 rounded-md border border-white/[0.08]">
              {['ALL', ...ROLES].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                    roleFilter === r ? 'bg-[#C89B3C] text-[#0B0E14]' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r === 'ALL' ? 'Tümü' : r}
                </button>
              ))}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-[#0B0E14] border border-white/[0.1] rounded-md px-3 py-2 text-xs text-white"
            >
              <option value="ALL">Tüm Durumlar</option>
              <option value="FA">Yalnızca Serbestler</option>
              <option value="EXPIRING">Son Yıl Fırsatları (1y)</option>
              <option value="CONTRACTED">Sözleşmeli Oyuncular</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#0B0E14] border border-white/[0.1] rounded-md px-3 py-2 text-xs text-white"
            >
              <option value="ovr">Sırala: OVR</option>
              <option value="value">Sırala: Piyasa Değeri</option>
              <option value="pot">Sırala: Potansiyel</option>
              <option value="form">Sırala: Güncel Form</option>
              <option value="age">Sırala: En Genç</option>
            </select>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Min OVR:</span>
              <input
                type="number"
                min={50}
                max={95}
                value={minOvr}
                onChange={(e) => setMinOvr(Number(e.target.value))}
                className="w-16 bg-[#0B0E14] border border-white/[0.1] rounded-md px-2 py-1.5 font-mono-num text-white"
              />
            </div>
          </div>

          <div className="bg-[#121722] border border-white/[0.08] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-[#0B0E14]/70 text-[11px] font-semibold text-slate-400">
                    <th className="py-3 px-4">Rol</th>
                    <th className="py-3 px-3">Oyuncu</th>
                    <th className="py-3 px-3">Kulüp & Kontrat</th>
                    <th className="py-3 px-3 text-right">Yaş</th>
                    <th className="py-3 px-3 text-right">OVR</th>
                    <th className="py-3 px-3 text-right">POT</th>
                    <th className="py-3 px-3 text-right">Form</th>
                    <th className="py-3 px-3 text-right">Piyasa Değeri</th>
                    <th className="py-3 px-3 text-right">Tahmini Bonservis</th>
                    <th className="py-3 px-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-xs">
                  {marketPlayers.map((p: any) => {
                    const club = state.teams.find((t: any) => t.id === p.teamId);
                    const val = getPlayerValuationDetails(state, p, userTeam);
                    const formVal = Math.round(p.form ?? 75);
                    return (
                      <tr key={p.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="py-2.5 px-4 font-mono-num text-[#E4BD67] font-bold">{p.role}</td>
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => onSelectPlayer(p.id)}
                            className="font-bold text-white hover:text-[#E4BD67] cursor-pointer text-left"
                          >
                            {p.name}
                          </button>
                          <div className="text-[10px] text-slate-500">
                            {p.nat} · {p.style}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="text-slate-200 font-medium">
                            {club ? `${club.tag} (${club.region})` : 'Serbest Oyuncu'}
                          </div>
                          <div
                            className={`text-[10px] font-mono-num ${
                              !club
                                ? 'text-emerald-400'
                                : (p.contractYears || 0) <= 1
                                ? 'text-amber-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {club
                              ? `${p.contractYears} sezon · ${val.clubStanceLabel}`
                              : 'Bonservissiz · İmza Primi'}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-num text-slate-300">{p.age}</td>
                        <td className="py-2.5 px-3 text-right">
                          <OvrValue ovr={p.ovr} />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-num text-slate-400">{p.pot}</td>
                        <td className="py-2.5 px-3 text-right font-mono-num">
                          <span
                            className={
                              formVal >= 84
                                ? 'text-emerald-400 font-semibold'
                                : formVal <= 65
                                ? 'text-rose-400'
                                : 'text-slate-300'
                            }
                          >
                            %{formVal}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-num">
                          <div className="text-white font-semibold">{formatMoney(val.marketValue)}</div>
                          {val.trend !== 'STABLE' && (
                            <div
                              className={`text-[10px] inline-flex items-center justify-end gap-0.5 ${
                                val.trend === 'UP' ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {val.trend === 'UP' ? (
                                <TrendingUp className="w-2.5 h-2.5" />
                              ) : (
                                <TrendingDown className="w-2.5 h-2.5" />
                              )}
                              {val.deltaPct > 0 ? `+${val.deltaPct}%` : `${val.deltaPct}%`}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono-num">
                          {club ? (
                            <div className="text-slate-200">
                              {formatMoney(val.estimatedFeeMin)}–{formatMoney(val.estimatedFeeMax)}
                            </div>
                          ) : (
                            <div className="text-emerald-400">{formatMoney(val.signingBonus)}</div>
                          )}
                          <div className="text-[10px] text-slate-500">Maaş {formatMoney(p.salary)}/hf</div>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={() => openNegotiation(p)}
                            className="px-3 py-1.5 rounded-md bg-[#171E2C] hover:bg-[#C89B3C] hover:text-[#0B0E14] border border-white/[0.12] text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Görüşme Başlat
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHALLENGER WONDERKID SCOUTING (FOG-OF-WAR) */}
      {subTab === 'scouting' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prospects.map((pr: any) => (
            <div
              key={pr.id}
              className="bg-[#121722] border border-white/[0.08] rounded-lg p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-num text-xs font-bold text-[#E4BD67]">
                    {pr.role} · {pr.nat} · {pr.age} yaş
                  </span>
                  <span className="font-mono-num text-xs text-slate-400">
                    {pr.scouted ? 'Rapor Tamamlandı' : 'Keşfedilmedi'}
                  </span>
                </div>
                <div className="text-lg font-bold text-white">{pr.name}</div>
                <div className="text-xs text-slate-400 font-mono-num">
                  Sunucu: {pr.server || pr.nat} · {pr.lp || 1200} LP · Stil: {pr.style}
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.06] font-mono-num text-xs">
                  <div>
                    <div className="text-slate-500">Mevcut OVR</div>
                    <div className="text-base font-bold text-white">
                      {pr.scouted ? pr.ovr : `${Math.max(58, pr.ovr - 5)}–${Math.min(92, pr.ovr + 5)}`}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Potansiyel (POT)</div>
                    <div className="text-base font-bold text-[#E4BD67]">
                      {pr.scouted ? pr.pot : '??? (Gözlemle)'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                {!pr.scouted ? (
                  <button
                    onClick={() => handleScout(pr.id)}
                    className="flex-1 px-3 py-2 rounded-md border border-[#C89B3C]/60 text-[#E4BD67] hover:bg-[#C89B3C]/15 text-xs font-semibold cursor-pointer"
                  >
                    Gözlemci Gönder ($15k)
                  </button>
                ) : (
                  <button
                    onClick={() => handleSignProspect(pr.id)}
                    className="flex-1 px-3 py-2 rounded-md bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] text-xs font-bold cursor-pointer"
                  >
                    Akademiye İmzalat ({formatMoney(pr.signingFee || 45000)})
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: TRANSFER ROOM OPPORTUNITIES */}
      {subTab === 'room' && (
        <div className="bg-[#121722] border border-white/[0.08] rounded-lg divide-y divide-white/[0.07]">
          {opportunities.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Şu anda Transfer Odası’nda öne çıkan fırsat bulunmuyor.
            </div>
          ) : (
            opportunities.map((opp: any, i: number) => (
              <div key={i} className="p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <div className="font-bold text-white text-sm">
                    <button
                      onClick={() => onSelectPlayer(opp.player.id)}
                      className="hover:text-[#E4BD67] cursor-pointer"
                    >
                      {opp.player.name}
                    </button>{' '}
                    <span className="font-mono-num text-[#E4BD67] text-xs">
                      ({opp.player.role} · {opp.player.age}y · OVR {opp.player.ovr} · POT {opp.player.pot})
                    </span>
                  </div>
                  <div className="text-slate-400 mt-0.5 font-mono-num">
                    {opp.club ? `${opp.club.name} (${opp.club.region})` : 'Serbest'} · {opp.reason} · Tahmini Bonservis:{' '}
                    <strong className="text-emerald-400">{formatMoney(opp.discountPrice)}</strong>
                  </div>
                </div>
                <button
                  onClick={() => openNegotiation(opp.player)}
                  className="px-4 py-2 rounded-md bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] font-bold cursor-pointer whitespace-nowrap"
                >
                  Teklif Hazırla
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: INCOMING OFFERS */}
      {subTab === 'incoming' && (
        <div className="bg-[#121722] border border-white/[0.08] rounded-lg divide-y divide-white/[0.07]">
          {incomingOffers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Oyuncuların için bekleyen resmi bir transfer teklifi yok.
            </div>
          ) : (
            incomingOffers.map((off: any) => {
              const p = state.players.find((x: any) => x.id === off.playerId);
              const buyer = state.teams.find((t: any) => t.id === off.buyerTeamId);
              return (
                <div key={off.id} className="p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="font-bold text-white text-sm">
                      {buyer?.name || off.buyerName} → {p?.name || 'Oyuncu'}
                    </div>
                    <div className="text-slate-400 font-mono-num mt-0.5">
                      Teklif Tutarı: <strong className="text-emerald-400">{formatMoney(off.amount)}</strong>
                      {p && <span className="text-slate-500"> · Piyasa Değeri: {formatMoney(p.marketValue)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleIncomingDecision(off.id, true)}
                      className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Kabul Et
                    </button>
                    <button
                      onClick={() => handleIncomingDecision(off.id, false)}
                      className="px-3.5 py-1.5 rounded-md border border-white/[0.12] hover:border-rose-500 text-slate-300 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Reddet
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* NEGOTIATION MODAL */}
      {negPlayer && negValuation && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#121722] border border-white/[0.14] rounded-lg p-6 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] pb-3">
              <div>
                <div className="text-xs text-[#E4BD67] font-semibold">
                  Transfer & Bonservis Masası · {negValuation.clubStanceLabel}
                </div>
                <h3 className="font-display text-2xl font-bold text-white">
                  {negPlayer.name} ({negPlayer.role} · {negPlayer.age}y · OVR {negPlayer.ovr} / POT {negPlayer.pot})
                </h3>
              </div>
              <button onClick={() => setNegPlayer(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Valuation & Buyout Breakdown */}
            <div className="bg-[#0B0E14] border border-white/[0.08] rounded-md p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-3 border-b border-white/[0.07] font-mono-num">
                <div>
                  <div className="text-[10px] text-slate-500">Piyasa Değeri</div>
                  <div className="text-sm font-bold text-white">{formatMoney(negValuation.marketValue)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">
                    {negPlayer.teamId ? 'Tahmini Bonservis' : 'Minimum İmza Primi'}
                  </div>
                  <div className="text-sm font-bold text-[#E4BD67]">
                    {negPlayer.teamId
                      ? `${formatMoney(negValuation.estimatedFeeMin)}–${formatMoney(negValuation.estimatedFeeMax)}`
                      : formatMoney(negValuation.signingBonus)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Oyuncu İlgisi</div>
                  <div className="text-sm font-bold text-emerald-400">{negInterest?.label || 'İlgili'}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400">Değerleme Faktörleri</div>
                {negValuation.factors.map((f: any) => (
                  <div key={f.key} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-slate-300">
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
                {negValuation.sameRegionRival && (
                  <div className="flex items-center justify-between gap-2 text-[11px] text-amber-400 pt-1 border-t border-white/[0.06]">
                    <span>Aynı Bölge Doğrudan Rakip Primi</span>
                    <span className="font-mono-num font-bold">+22%</span>
                  </div>
                )}
              </div>

              {negInterest?.reason && (
                <div className="text-[11px] text-slate-400 pt-2 border-t border-white/[0.06]">
                  {negInterest.reason}
                </div>
              )}

              {negBiddingWar && (
                <div className="pt-2 border-t border-amber-500/30 text-[11px] text-amber-300 space-y-1">
                  <div className="font-bold">
                    Kasım Free Agency Açık Artırması: {negBiddingWar.rivals.join(' & ')} devrede!
                  </div>
                  <div className="text-slate-300 font-mono-num">
                    {negBiddingWar.topRivalName} masada yaklaşık{' '}
                    <strong className="text-[#E4BD67]">{formatMoney(negBiddingWar.competingSalary)}/hf</strong> maaş öneriyor.
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-slate-300 font-semibold">
                    {negPlayer.teamId ? 'Bonservis Teklifi ($)' : 'İmza Primi ($)'}
                  </label>
                  {negPlayer.teamId && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      {[
                        { label: 'Yoklama', val: negValuation.estimatedFeeMin },
                        {
                          label: 'Adil Teklif',
                          val:
                            Math.round(
                              ((negValuation.minAcceptableBuyout + negValuation.estimatedFeeMax) / 2) / 5000
                            ) * 5000,
                        },
                        { label: 'Kesin', val: negValuation.estimatedFeeMax },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setOfferBuyout(preset.val)}
                          className="px-2 py-0.5 rounded border border-white/[0.12] hover:border-[#C89B3C] text-slate-300 hover:text-white cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="number"
                  step={10000}
                  value={offerBuyout}
                  onChange={(e) => setOfferBuyout(Number(e.target.value))}
                  className="w-full bg-[#0B0E14] border border-white/[0.12] rounded-md px-3 py-2 font-mono-num text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Haftalık Maaş ($)</label>
                  <input
                    type="number"
                    step={500}
                    value={offerSalary}
                    onChange={(e) => setOfferSalary(Number(e.target.value))}
                    className="w-full bg-[#0B0E14] border border-white/[0.12] rounded-md px-3 py-2 font-mono-num text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Sözleşme Süresi</label>
                  <select
                    value={offerYears}
                    onChange={(e) => setOfferYears(Number(e.target.value))}
                    className="w-full bg-[#0B0E14] border border-white/[0.12] rounded-md px-3 py-2 text-white"
                  >
                    <option value={1}>1 Sezon</option>
                    <option value={2}>2 Sezon</option>
                    <option value={3}>3 Sezon</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono-num text-slate-400 pt-1">
                <span>Kalan Bütçe: {formatMoney(userTeam.budget - offerBuyout)}</span>
                <span>Kalan Maaş Boşluğu: {formatMoney(wageRoom - offerSalary)}/hf</span>
              </div>
            </div>

            {negResult && <div className="text-xs text-amber-400">{negResult}</div>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setNegPlayer(null)}
                className="px-4 py-2 rounded-md border border-white/[0.12] text-xs text-slate-300 cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                onClick={handleSubmitOffer}
                className="px-5 py-2 rounded-md bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] text-xs font-bold cursor-pointer"
              >
                Resmi Teklifi Gönder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

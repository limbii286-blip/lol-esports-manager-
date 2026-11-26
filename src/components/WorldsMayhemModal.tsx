import React, { useMemo, useState } from 'react';
import { Flame, RefreshCw, Trophy, X, Play } from 'lucide-react';
import { ROLES, LEGENDS_MAYHEM } from '../data/teamsAndPlayers.js';
import { MEDIA_ASSETS } from '../assets/media';
import { SafeImage, OvrValue } from './shared/Visuals';
import { soundFx } from '../engine/soundFx';

interface WorldsMayhemModalProps {
  onClose: () => void;
}

const HISTORICAL_TEAMS = [
  { id: 'h_skt15', tag: 'SKT', name: '2015 SKT T1', region: 'LCK', rating: 96.2, star: '2015 Faker', color: '#e2012d' },
  { id: 'h_ssw14', tag: 'SSW', name: '2014 Samsung White', region: 'LCK', rating: 95.8, star: '2014 DanDy', color: '#2563eb' },
  { id: 'h_dwg20', tag: 'DWG', name: '2020 DAMWON Gaming', region: 'LCK', rating: 95.4, star: '2020 Canyon', color: '#00d2be' },
  { id: 'h_t123', tag: 'T1', name: '2023 T1', region: 'LCK', rating: 95.6, star: '2023 Zeus', color: '#dc2626' },
  { id: 'h_ig18', tag: 'IG', name: '2018 Invictus Gaming', region: 'LPL', rating: 94.8, star: '2018 TheShy', color: '#94a3b8' },
  { id: 'h_jdg23', tag: 'JDG', name: '2023 JD Gaming', region: 'LPL', rating: 94.6, star: '2023 Ruler', color: '#b91c1c' },
  { id: 'h_gen24', tag: 'GEN', name: '2024 Gen.G', region: 'LCK', rating: 94.4, star: '2024 Chovy', color: '#aa8a00' },
  { id: 'h_blg24', tag: 'BLG', name: '2024 Bilibili Gaming', region: 'LPL', rating: 94.0, star: '2024 Bin', color: '#00a1d6' },
  { id: 'h_edg21', tag: 'EDG', name: '2021 EDward Gaming', region: 'LPL', rating: 93.8, star: '2021 Viper', color: '#475569' },
  { id: 'h_fpx19', tag: 'FPX', name: '2019 FunPlus Phoenix', region: 'LPL', rating: 93.5, star: '2019 Tian', color: '#ea580c' },
  { id: 'h_rox16', tag: 'ROX', name: '2016 ROX Tigers', region: 'LCK', rating: 93.4, star: '2016 Smeb', color: '#f59e0b' },
  { id: 'h_ssg17', tag: 'SSG', name: '2017 Samsung Galaxy', region: 'LCK', rating: 93.2, star: '2017 CoreJJ', color: '#1d4ed8' },
  { id: 'h_drx22', tag: 'DRX', name: '2022 DRX', region: 'LCK', rating: 92.8, star: '2022 Zeka', color: '#3b82f6' },
  { id: 'h_rng18', tag: 'RNG', name: '2018 RNG', region: 'LPL', rating: 92.9, star: '2018 Uzi', color: '#ca8a04' },
  { id: 'h_g219', tag: 'G2', name: '2019 G2 Esports', region: 'LEC', rating: 92.5, star: '2019 Caps', color: '#ef4444' },
];

function sampleThree(role: string) {
  const pool = LEGENDS_MAYHEM.filter((l: any) => l.role === role);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

export const WorldsMayhemModal: React.FC<WorldsMayhemModalProps> = ({ onClose }) => {
  const [stage, setStage] = useState<'DRAFT' | 'TOURNAMENT' | 'FINISHED'>('DRAFT');
  const [roleIdx, setRoleIdx] = useState(0);
  const [rerolls, setRerolls] = useState(3);
  const [roster, setRoster] = useState<any[]>([]);
  const [choices, setChoices] = useState<any[]>(() => sampleThree(ROLES[0]));
  const [tactic, setTactic] = useState<'aggressive' | 'balanced' | 'scaling'>('balanced');

  const [roundIdx, setRoundIdx] = useState(0); // 0: Swiss1, 1: Swiss2, 2: QF, 3: SF, 4: FINAL
  const [opponents, setOpponents] = useState<any[]>([]);
  const [matchLogs, setMatchLogs] = useState<string[]>([]);
  const [resultStatus, setResultStatus] = useState<'CHAMPION' | 'ELIMINATED' | null>(null);

  const teamPower = useMemo(() => {
    if (!roster.length) return 0;
    return +(roster.reduce((s, p) => s + (p.ovr || 94), 0) / roster.length).toFixed(1);
  }, [roster]);

  const roundLabels = ['Swiss Tur 1 (BO3)', 'Swiss Tur 2 (BO3)', 'Çeyrek Final (BO5)', 'Yarı Final (BO5)', 'Worlds Finali (BO5)'];

  const handlePickLegend = (legend: any) => {
    soundFx.draftLock();
    const nextRoster = [...roster, legend];
    setRoster(nextRoster);
    if (roleIdx + 1 >= ROLES.length) {
      const opps = [...HISTORICAL_TEAMS].sort(() => Math.random() - 0.5).slice(0, 5);
      opps.sort((a, b) => a.rating - b.rating);
      setOpponents(opps);
      setRoundIdx(0);
      setMatchLogs([]);
      setStage('TOURNAMENT');
    } else {
      const nextIdx = roleIdx + 1;
      setRoleIdx(nextIdx);
      setChoices(sampleThree(ROLES[nextIdx]));
    }
  };

  const handleReroll = () => {
    if (rerolls <= 0) return;
    soundFx.click();
    setRerolls((r) => r - 1);
    setChoices(sampleThree(ROLES[roleIdx]));
  };

  const handlePlayRound = () => {
    const opp = opponents[roundIdx];
    if (!opp) return;
    const bo = roundIdx < 2 ? 3 : 5;
    const need = Math.ceil(bo / 2);
    let myW = 0;
    let oppW = 0;
    const tacticBonus = tactic === 'aggressive' ? 0.5 : tactic === 'scaling' ? 0.4 : 0.3;
    const winProb = 1 / (1 + Math.exp(-((teamPower + tacticBonus - opp.rating) * 0.28)));

    while (myW < need && oppW < need) {
      if (Math.random() < winProb) myW++;
      else oppW++;
    }

    const won = myW > oppW;
    const line = `${roundLabels[roundIdx]}: Efsaneler Karması ${myW} - ${oppW} ${opp.name} (${won ? 'GALİBİYET' : 'MAĞLUBİYET'})`;
    setMatchLogs((prev) => [line, ...prev]);

    if (!won) {
      soundFx.defeat();
      setResultStatus('ELIMINATED');
      setStage('FINISHED');
    } else if (roundIdx === 4) {
      soundFx.victory();
      setResultStatus('CHAMPION');
      setStage('FINISHED');
    } else {
      soundFx.objectiveSecured();
      setRoundIdx((r) => r + 1);
    }
  };

  const handleReset = () => {
    setStage('DRAFT');
    setRoleIdx(0);
    setRerolls(3);
    setRoster([]);
    setChoices(sampleThree(ROLES[0]));
    setRoundIdx(0);
    setMatchLogs([]);
    setResultStatus(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#121722] border border-[#C89B3C]/40 rounded-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-[#E4BD67]" />
            <h3 className="font-display text-2xl font-extrabold text-white tracking-wide">
              Worlds Mayhem · Tarihin En İyi Kadrolarına Karşı
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {stage === 'DRAFT' && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-[#E4BD67] font-semibold">
                    Efsane Draftı · Rol {roleIdx + 1}/5 ({ROLES[roleIdx]})
                  </div>
                  <h4 className="font-display text-2xl font-bold text-white">
                    {ROLES[roleIdx]} Mevkii İçin Bir Efsane Seç
                  </h4>
                </div>
                <button
                  disabled={rerolls <= 0}
                  onClick={handleReroll}
                  className={`px-3.5 py-2 rounded-md border text-xs font-semibold flex items-center gap-1.5 ${
                    rerolls > 0
                      ? 'border-[#C89B3C]/60 text-[#E4BD67] hover:bg-[#C89B3C]/15 cursor-pointer'
                      : 'border-white/[0.06] text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Yenile ({rerolls})
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {choices.map((l: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handlePickLegend(l)}
                    className="text-left p-5 rounded-lg border border-white/[0.1] bg-[#171E2C] hover:border-[#E4BD67] transition-colors cursor-pointer space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono-num text-xs text-[#E4BD67] font-bold">{l.role}</span>
                      <OvrValue ovr={l.ovr} size="lg" />
                    </div>
                    <div>
                      <div className="font-display text-2xl font-bold text-white">{l.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{l.era || l.team || 'Worlds Efsanesi'}</div>
                    </div>
                    <div className="text-xs text-slate-300 border-t border-white/[0.08] pt-2.5">
                      Stil: <strong>{l.style}</strong> · İmza: {(l.sigChamps || []).slice(0, 2).join(', ')}
                    </div>
                  </button>
                ))}
              </div>

              {roster.length > 0 && (
                <div className="border-t border-white/[0.08] pt-4">
                  <div className="text-xs text-slate-400 mb-2">Seçilen Kadron ({roster.length}/5):</div>
                  <div className="flex flex-wrap gap-3 text-xs">
                    {roster.map((p, i) => (
                      <div key={i} className="px-3 py-1.5 rounded-md bg-[#0B0E14] border border-white/[0.08]">
                        <span className="font-mono-num text-[#E4BD67] mr-1.5">{p.role}</span>
                        <strong className="text-white">{p.name}</strong>{' '}
                        <span className="font-mono-num text-slate-400">({p.ovr})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {stage === 'TOURNAMENT' && opponents[roundIdx] && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center bg-[#0B0E14] border border-white/[0.08] rounded-lg p-5">
                <div className="md:col-span-5 space-y-1">
                  <div className="text-xs text-[#E4BD67] font-semibold">Senin Efsaneler Karman</div>
                  <div className="font-display text-3xl font-extrabold text-white">ALL-TIME LEGENDS</div>
                  <div className="text-xs text-slate-400 font-mono-num">Takım Gücü: {teamPower}</div>
                </div>
                <div className="md:col-span-2 text-center font-display text-3xl font-extrabold text-slate-600">VS</div>
                <div className="md:col-span-5 text-right space-y-1">
                  <div className="text-xs text-rose-400 font-semibold">{roundLabels[roundIdx]}</div>
                  <div className="font-display text-3xl font-extrabold text-white">{opponents[roundIdx].name}</div>
                  <div className="text-xs text-slate-400 font-mono-num">
                    Güç: {opponents[roundIdx].rating} · Yıldız: {opponents[roundIdx].star}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Seri Taktiği:</span>
                  {(['aggressive', 'balanced', 'scaling'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTactic(t)}
                      className={`px-3 py-1.5 rounded-md border font-semibold cursor-pointer ${
                        tactic === t
                          ? 'bg-[#C89B3C] text-[#0B0E14] border-[#C89B3C]'
                          : 'bg-[#0B0E14] text-slate-300 border-white/[0.1]'
                      }`}
                    >
                      {t === 'aggressive' ? 'Erken Baskı' : t === 'balanced' ? 'Dengeli' : 'Geç Oyun'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handlePlayRound}
                  className="px-6 py-2.5 rounded-md bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Seriyi Oyna
                </button>
              </div>

              {matchLogs.length > 0 && (
                <div className="border-t border-white/[0.08] pt-4 space-y-2 text-xs">
                  <div className="font-semibold text-slate-400">Turnuva İlerlemesi</div>
                  {matchLogs.map((l, i) => (
                    <div key={i} className="text-slate-200 font-mono-num">
                      {l}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {stage === 'FINISHED' && (
            <div className="text-center space-y-5 py-4">
              {resultStatus === 'CHAMPION' ? (
                <SafeImage
                  src={MEDIA_ASSETS.worldsTrophy}
                  alt="Worlds Mayhem Champion"
                  className="w-40 h-40 object-cover rounded-lg mx-auto border border-[#C89B3C]/60"
                  fallbackLabel="Champion"
                />
              ) : (
                <Trophy className="w-12 h-12 text-slate-500 mx-auto" />
              )}
              <div>
                <div className="text-xs text-[#E4BD67] font-semibold">Worlds Mayhem Sonucu</div>
                <h4 className="font-display text-4xl font-extrabold text-white mt-1">
                  {resultStatus === 'CHAMPION' ? 'WORLDS MAYHEM ŞAMPİYONU!' : 'Turnuvaya Veda Ettin'}
                </h4>
              </div>
              <div className="max-w-lg mx-auto text-left bg-[#0B0E14] border border-white/[0.08] rounded-md p-4 space-y-1.5 text-xs font-mono-num">
                {matchLogs.map((l, i) => (
                  <div key={i} className="text-slate-300">
                    {l}
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 rounded-md bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] text-xs font-bold cursor-pointer"
                >
                  Yeni Efsane Draftı Başlat
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-md border border-white/[0.12] text-xs text-slate-300 cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

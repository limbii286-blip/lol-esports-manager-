// LoL Esports Manager v2.0 — Career Engine (7 Regions, 16-Team Swiss Worlds, Drama Events, Challenger Scouting, AI Bids, Language Barrier & Awards)
import { PATCHES, CHAMPION_MAP } from '../data/champions.js';
import {
  ROLES, REGIONS, REGION_LANG, getRivalryName,
  createInitialDatabase, calcOVR, calcMarketValue, calcWeeklySalary,
  getAgeFatigueProfile,
  generateRegenPlayer, generateChallengerProspects
} from '../data/teamsAndPlayers.js';
import { quickSimulateGame, applyMatchOutcomeToPlayers, computeTeamChemistry } from './matchEngine.js';
export { computeTeamChemistry, getAgeFatigueProfile };

export const SAVE_KEY = 'lol_esports_manager_save_v2';
export const SLOTS_KEY = 'lol_esports_manager_slots_v2';
export const SAVE_SLOT_IDS = ['autosave', 'slot1', 'slot2', 'slot3', 'slot4', 'slot5'];

export const SPONSORS = [
  { id: 'sp_safe', name: 'LogiTech Gear', weekly: 85000, bonus: 300000, goal: 'Playofflara Kal', minPrestige: 0, desc: 'Garanti dengeli haftalık gelir, düşük baskı.' },
  { id: 'sp_mid', name: 'RedBull Gaming', weekly: 135000, bonus: 650000, goal: 'Bölge Finali Oyna', minPrestige: 76, desc: 'Güçlü haftalık gelir ve bölge finali primi.' },
  { id: 'sp_elite', name: 'Mercedes-Benz Esports', weekly: 205000, bonus: 1300000, goal: 'MSI veya Worlds Kupası', minPrestige: 85, desc: 'Elit kulüpler için dev bütçe ve kupa primi.' },
];

export const FACILITY_INFO = {
  gamingHouse: { name: 'Gaming House', desc: 'Oyuncu yorgunluğunu azaltır ve toparlanmayı hızlandırır.', costs: [0, 350000, 750000, 1400000] },
  analystDesk: { name: 'Analist Ekibi', desc: 'Maç içi performans, draft analizi ve Sv.3\'te ücretsiz Challenger scouting verir.', costs: [0, 400000, 850000, 1600000] },
  youthAcademy: { name: 'Gençlik Akademisi', desc: 'Daha yüksek potansiyelli genç yetenekler üretir.', costs: [0, 300000, 650000, 1200000] },
  psychologist: { name: 'Spor Psikoloğu', desc: 'Moral düşüşlerini önler ve dil/uyum sürecini hızlandırır.', costs: [0, 280000, 600000, 1100000] },
};

export const STAFF_INFO = {
  draftAnalyst: { name: 'Baş Draft Analisti', desc: 'Maç içi taktik & draft verimini artırır (+0.5/sv).', costs: [0, 260000, 620000, 1200000], wages: [0, 8000, 18000, 34000] },
  perfCoach: { name: 'Performans & Sağlık Koçu', desc: 'Yorgunluk birikimini ve bilek/burnout sakatlık riskini azaltır.', costs: [0, 240000, 560000, 1100000], wages: [0, 7000, 16000, 30000] },
  headScout: { name: 'Baş Gözlemci (Head Scout)', desc: 'Challenger yetenek havuzunun kalitesini artırır ve scouting maliyetini düşürür.', costs: [0, 220000, 520000, 1000000], wages: [0, 6500, 15000, 28000] },
};

export const TRAINING_INTENSITIES = [
  { id: 'light', name: 'Hafif', desc: 'Yorgunluk hızlı düşer, sakatlık riski yok, gelişim yavaş.' },
  { id: 'normal', name: 'Dengeli', desc: 'Normal gelişim ve kontrollü yorgunluk.' },
  { id: 'intense', name: 'Yoğun', desc: '+45% hızlı gelişim ve şampiyon öğrenimi, ancak yüksek yorgunluk/burnout riski.' },
];

export const TEAM_TALK_OPTIONS = [
  { id: 'none', name: 'Standart Hazırlık', desc: 'Ekstra risk yok, normal maç odağı.' },
  { id: 'pressure', name: 'Baskı Kur ("Kazanmak zorundayız!")', desc: 'Clutch ve Lider oyunculara büyük güç (+2.2), Tilt olanlara risk (-1.6).' },
  { id: 'calm', name: 'Rahat Bırak ("Kendi oyununuzu oynayın")', desc: 'Tilt riskini pozitife çevirir (+1.8), stres/yorgunluğu azaltır.' },
  { id: 'praise', name: 'Övgü & Güven ("Size güveniyorum")', desc: 'Tüm takıma dengeli moral ve sinerji bonusu (+1.1).' },
  { id: 'fire', name: 'Hırslandır ("Onlara gününü gösterin!")', desc: 'Derbi, Playoff ve Uluslararası maçlarda ekstra +2.4 ateşleme!' },
];

export const TACTIC_PRESETS = [
  {
    id: 'snowball',
    name: 'Erken Kartopu (LPL Aggro)',
    desc: 'Erken baskı, Top Carry, Roaming Support ve agresif dive.',
    tactics: { gameplan: 'aggressive', laneFocus: 'TOP', objective: 'baron', topStyle: 'carry', supStyle: 'roam', adcStyle: 'aggressive', aheadPlan: 'dive', behindPlan: 'pick' },
  },
  {
    id: 'protect_adc',
    name: 'Hypercarry Koruma (Protect ADC)',
    desc: 'Geç oyun scaling, Weakside Top, Peel Support ve güvenli ADC.',
    tactics: { gameplan: 'scaling', laneFocus: 'BOT', objective: 'dragon', topStyle: 'weakside', supStyle: 'peel', adcStyle: 'safe', aheadPlan: 'choke', behindPlan: 'scale' },
  },
  {
    id: 'lck_macro',
    name: 'LCK Makro Boğma (1-3-1)',
    desc: 'Dengeli tempo, Mid/Ejder kontrolü ve harita boğma.',
    tactics: { gameplan: 'balanced', laneFocus: 'MID', objective: 'dragon', topStyle: 'balanced', supStyle: 'balanced', adcStyle: 'balanced', aheadPlan: 'choke', behindPlan: 'crossmap' },
  },
];

export const MATCH_PREP_OPTIONS = [
  { id: 'none', name: 'Standart Hazırlık', desc: 'Dengeli maç hazırlığı.' },
  { id: 'laning', name: 'Koridor Hakimiyeti (0-15 dk)', desc: 'İlk 15 dakikada +1.4 koridor ve baskın üstünlüğü.' },
  { id: 'objectives', name: 'Objektif & Ejder Kontrolü', desc: 'Ejder, Vadi Alameti ve Baron savaşlarında +1.4 üstünlük.' },
  { id: 'teamfight', name: '5v5 Takım Savaşı (15+ dk)', desc: 'Orta ve geç oyun takım savaşlarında +1.4 güç.' },
  { id: 'comeback', name: 'Savunma & Comeback Planı', desc: 'Gerideyken (-1.5k+) +1.8 savunma ve pusu direnci.' },
];

export function ensureTeamExtras(team) {
  if (!team) return;
  if (!team.staff) team.staff = { draftAnalyst: 1, perfCoach: 1, headScout: 1 };
  if (!team.trainingIntensity) team.trainingIntensity = 'normal';
  if (!team.duoSynergy) team.duoSynergy = {};
  if (!team.matchPrep) team.matchPrep = 'none';
}

export function getSquadDynamics(state) {
  const team = state.teams.find(t => t.id === state.userTeamId);
  if (!team) return null;
  const all = state.players.filter(p => p.teamId === team.id);
  const starters = getTeamRoster(state, team.id);
  const avgMorale = all.length ? Math.round(all.reduce((s, p) => s + p.morale, 0) / all.length) : 75;
  const atmosphere = Math.max(25, Math.min(100, Math.round(avgMorale * 0.65 + team.synergy * 0.35)));
  const conf = getBoardConfidence(state);
  const managerSupport = Math.max(25, Math.min(100, Math.round(avgMorale * 0.55 + conf.score * 0.45)));
  const captain = [...starters].sort((a, b) => ((b.trait === 'Leader' ? 20 : 0) + b.ovr + b.age * 0.5) - ((a.trait === 'Leader' ? 20 : 0) + a.ovr + a.age * 0.5))[0];
  const unhappyCount = all.filter(p => p.morale < 62).length;
  return { atmosphere, managerSupport, captain, unhappyCount };
}

export function getBoardObjectives(state) {
  const team = state.teams.find(t => t.id === state.userTeamId);
  const st = getSortedStandings(state, team.region);
  const rank = st.findIndex(r => r.teamId === team.id) + 1;
  const targetRank = team.prestige >= 88 ? 2 : team.prestige >= 80 ? 3 : team.prestige >= 74 ? 4 : 5;
  const intlGoal = team.prestige >= 86 ? 'Worlds Çeyrek Final / Kupa' : team.prestige >= 78 ? 'Playoff Finali / Uluslararası Bilet' : 'Playoff (İlk 4) Mücadelesi';
  const wonTrophy = team.trophies.some(t => t.includes(String(state.season)));
  return [
    {
      title: `${team.region} Lig Sıralaması: İlk ${targetRank}`,
      status: rank <= targetRank ? 'ON_TRACK' : rank <= targetRank + 1 ? 'WARN' : 'RISK',
      detail: `Mevcut Sıra: #${rank}`,
    },
    {
      title: `Sezon Hedefi: ${intlGoal}`,
      status: wonTrophy ? 'DONE' : rank <= 4 ? 'ON_TRACK' : 'WARN',
      detail: wonTrophy ? 'Bu sezon kupa kazanıldı!' : 'Playoff & Uluslararası yarış devam ediyor',
    },
    {
      title: 'Finansal Disiplin: Bütçeyi Artıda Tut',
      status: team.budget >= 250000 ? 'ON_TRACK' : team.budget >= 0 ? 'WARN' : 'RISK',
      detail: `Mevcut Bütçe: ${formatMoney(team.budget)}`,
    },
  ];
}

export function talkToPlayer1on1(state, playerId, action) {
  const p = state.players.find(x => x.id === playerId && x.teamId === state.userTeamId);
  if (!p) return { ok: false, reason: 'Oyuncu bulunamadı.' };
  const key = `${state.season}_${state.phase}_${state.week}`;
  if (p.lastTalkWeek === key) {
    return { ok: false, reason: `${p.name} ile bu hafta zaten birebir görüştün.` };
  }
  p.lastTalkWeek = key;
  const ageProf = getAgeFatigueProfile(p.age);
  if (action === 'praise') {
    const gain = (p.trait === 'Ego' || p.trait === 'Leader') ? 7 : 6;
    p.morale = Math.min(100, p.morale + gain);
    return { ok: true, reason: `${p.name} övgünden çok memnun oldu (Moral +${gain}).` };
  }
  if (action === 'motivate') {
    const formGain = (p.trait === 'Clutch' || p.trait === 'Leader') ? 4 : 3;
    p.form = Math.min(99, p.form + formGain);
    p.morale = Math.min(100, p.morale + 3);
    recalculatePlayerMarketValue(state, p, true);
    return { ok: true, reason: `${p.name} konuşmadan büyük motivasyon aldı (Form +${formGain}, Moral +3).` };
  }
  if (action === 'criticize' || action === 'push') {
    const formGain = p.trait === 'Grinder' ? 5 : 4;
    const moraleDrop = p.trait === 'Grinder' ? 0 : (p.trait === 'Ego' || p.trait === 'Tilt') ? 6 : 3;
    p.form = Math.min(99, p.form + formGain);
    p.morale = Math.max(30, p.morale - moraleDrop);
    recalculatePlayerMarketValue(state, p, true);
    return {
      ok: true,
      reason: `${p.name} uyarın sonrası antrenman temposunu artırdı (Form +${formGain}${moraleDrop === 0 ? ', Çalışkan karakteri sayesinde moral kaybetmedi' : `, Moral -${moraleDrop}`}).`,
    };
  }
  // rest/calm
  const restDrop = Math.max(5, Math.round(9 * ageProf.recMult));
  p.fatigue = Math.max(0, p.fatigue - restDrop);
  p.morale = Math.min(100, p.morale + 3);
  return { ok: true, reason: `${p.name} dinlenme izninden faydalandı (Yorgunluk -${restDrop}, Moral +3).` };
}

export function getDuoPairKey(idA, idB) {
  return [idA, idB].sort().join('|');
}

export function getTeamDuoSynergy(team, roster) {
  ensureTeamExtras(team);
  const jgl = roster.find(p => p.role === 'JGL');
  const mid = roster.find(p => p.role === 'MID');
  const bot = roster.find(p => p.role === 'BOT');
  const sup = roster.find(p => p.role === 'SUP');
  const jmScore = (jgl && mid) ? (team.duoSynergy[getDuoPairKey(jgl.id, mid.id)] || 0) : 0;
  const bsScore = (bot && sup) ? (team.duoSynergy[getDuoPairKey(bot.id, sup.id)] || 0) : 0;
  const label = (v) => v >= 20 ? 'Ölümcül İkili' : v >= 10 ? 'Uyumlu İkili' : v >= 4 ? 'Gelişiyor' : 'Yeni';
  return {
    jglMid: { score: Math.min(30, Math.round(jmScore)), label: label(jmScore), names: jgl && mid ? `${jgl.name} + ${mid.name}` : '-' },
    botSup: { score: Math.min(30, Math.round(bsScore)), label: label(bsScore), names: bot && sup ? `${bot.name} + ${sup.name}` : '-' },
  };
}

export const TRAINING_MODES = [
  { id: 'balanced', name: 'Dengeli Antrenman', desc: 'Tüm özelliklerde dengeli gelişim, normal yorgunluk.' },
  { id: 'mechanics', name: 'SoloQ & Mekanik', desc: 'Mekanik ve Koridor odaklı (+yüksek yorgunluk).' },
  { id: 'macro', name: 'VOD & Makro Analiz', desc: 'Makro, Takım Savaşı ve Sinerji odaklı.' },
  { id: 'pool', name: 'Şampiyon Havuzu', desc: 'Şampiyon havuzunu genişletir, Fearless Draft\'a hazırlar.' },
  { id: 'rest', name: 'Dinlenme & Moral', desc: 'Yorgunluğu hızla düşürür, morali yükseltir.' },
];

export function formatMoney(n) {
  if (Math.abs(n) >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  if (Math.abs(n) >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n}`;
}

function getPlayerLeaguePrestige(state, player) {
  if (!player?.teamId || !state?.teams) return 80;
  const team = state.teams.find(t => t.id === player.teamId);
  if (!team) return 80;
  const reg = REGIONS.find(r => r.id === team.region);
  return reg?.prestige ?? team.prestige ?? 80;
}

export function recalculatePlayerMarketValue(state, player, preservePrev = true) {
  if (!player) return 25000;
  const leaguePrestige = getPlayerLeaguePrestige(state, player);
  const nextVal = calcMarketValue(player.ovr, player.age, player.pot, {
    form: player.form ?? 75,
    contractYears: player.contractYears ?? (player.teamId ? 2 : 0),
    teamId: player.teamId,
    leaguePrestige,
    stats: player.stats,
  });
  if (preservePrev) {
    if (player.prevMarketValue === undefined) {
      player.prevMarketValue = player.marketValue || nextVal;
    } else if (player.marketValue && Math.abs(nextVal - player.marketValue) >= 5000) {
      player.prevMarketValue = player.marketValue;
    }
  } else {
    player.prevMarketValue = nextVal;
  }
  player.marketValue = nextVal;
  return nextVal;
}

export function syncAllMarketValues(state, preservePrev = true) {
  if (!state?.players) return;
  for (const p of state.players) {
    recalculatePlayerMarketValue(state, p, preservePrev);
  }
}

export function getPlayerValuationDetails(state, player, buyerTeam = null) {
  const safeOvr = Math.max(48, Number(player?.ovr) || 70);
  const safeAge = Math.max(16, Number(player?.age) || 22);
  const safePot = Math.max(safeOvr, Number(player?.pot) || safeOvr);
  const form = player?.form ?? 75;
  const hasTeam = Boolean(player?.teamId);
  const contractYears = player?.contractYears ?? (hasTeam ? 2 : 0);
  const leaguePrestige = getPlayerLeaguePrestige(state, player);
  const sellingTeam = hasTeam ? state?.teams?.find(t => t.id === player.teamId) : null;
  const regObj = sellingTeam ? REGIONS.find(r => r.id === sellingTeam.region) : null;

  const marketValue = recalculatePlayerMarketValue(state, player, true);
  const prevMarketValue = player.prevMarketValue ?? marketValue;
  const deltaPct = prevMarketValue > 0 ? Math.round(((marketValue - prevMarketValue) / prevMarketValue) * 100) : 0;
  const trend = deltaPct >= 2 ? 'UP' : deltaPct <= -2 ? 'DOWN' : 'STABLE';

  // Mirror exact multipliers from calcMarketValue for 100% transparent UI breakdown
  const ageMult =
    safeAge <= 19 ? 1.34 :
    safeAge <= 21 ? 1.24 :
    safeAge <= 24 ? 1.12 :
    safeAge <= 26 ? 1.00 :
    safeAge <= 28 ? 0.81 :
    safeAge <= 30 ? 0.63 : 0.45;
  const agePct = Math.round((ageMult - 1) * 100);
  const ageNote =
    safeAge <= 21 ? `${safeAge} yaş · Genç Yıldız Primi` :
    safeAge <= 24 ? `${safeAge} yaş · Yükseliş Dönemi` :
    safeAge <= 26 ? `${safeAge} yaş · Zirve Dönemi` :
    safeAge <= 28 ? `${safeAge} yaş · Olgunlaşma Düşüşü` : `${safeAge} yaş · Veteran Değer Kaybı`;

  const headroom = Math.max(0, safePot - safeOvr);
  const potSlope = safeAge <= 20 ? 0.044 : safeAge <= 23 ? 0.028 : safeAge <= 26 ? 0.014 : 0.004;
  const eliteCeilingBonus = safePot >= 91 && safeAge <= 22 ? 0.11 : safePot >= 87 && safeAge <= 21 ? 0.06 : 0;
  const potMult = 1 + Math.min(0.56, headroom * potSlope) + eliteCeilingBonus;
  const potPct = Math.round((potMult - 1) * 100);
  const potNote = headroom > 0 ? `POT ${safePot} (+${headroom} gelişim alanı)` : `POT ${safePot} (Tavana ulaştı)`;

  let formMult = form >= 75
    ? 1 + Math.min(0.28, (form - 75) * 0.0115)
    : 1 - Math.min(0.26, (75 - form) * 0.009);
  let kdaStr = '';
  if (player?.stats && player.stats.games >= 3) {
    const kda = (player.stats.kills + player.stats.assists) / Math.max(1, player.stats.deaths);
    const mvpRate = (player.stats.mvps || 0) / player.stats.games;
    const perfBoost = Math.max(-0.07, Math.min(0.10, (kda - 3.2) * 0.018 + mvpRate * 0.12));
    formMult += perfBoost;
    kdaStr = ` · ${kda.toFixed(1)} KDA`;
  }
  const formPct = Math.round((formMult - 1) * 100);
  const formNote = `Form %${Math.round(form)}${kdaStr}`;

  let contractMult = 1.0;
  let contractNote = '2 Sezon (Standart Koruma)';
  if (!hasTeam || contractYears <= 0) {
    contractMult = 0.78;
    contractNote = 'Serbest Oyuncu (Bonservissiz)';
  } else if (contractYears === 1) {
    contractMult = 0.68;
    contractNote = 'Son Yıl (Kulüp Kaldıracı Zayıf)';
  } else if (contractYears >= 3) {
    contractMult = 1.22;
    contractNote = `${contractYears} Sezon (Uzun Kontrat Primi)`;
  }
  const contractPct = Math.round((contractMult - 1) * 100);

  const repMult = 0.84 + Math.max(0, Math.min(1, (leaguePrestige - 70) / 28)) * 0.26;
  const repPct = Math.round((repMult - 1) * 100);
  const repNote = regObj ? `${regObj.id} Ligi (Prestij ${leaguePrestige})` : `Serbest Havuz (${leaguePrestige})`;

  const factors = [
    { key: 'age', label: 'Yaş Eğrisi', detail: ageNote, pct: agePct },
    { key: 'pot', label: 'Potansiyel Tavanı', detail: potNote, pct: potPct },
    { key: 'form', label: 'Form & Performans', detail: formNote, pct: formPct },
    { key: 'contract', label: 'Sözleşme Süresi', detail: contractNote, pct: contractPct },
    { key: 'rep', label: 'Lig İtibarı', detail: repNote, pct: repPct },
  ];

  // Buyout / Signing Fee Architecture
  const round5k = (v) => Math.max(20000, Math.round(v / 5000) * 5000);
  const signingBonus = getFreeAgentSigningBonus(player);

  if (!hasTeam || !sellingTeam) {
    return {
      marketValue,
      prevMarketValue,
      deltaPct,
      trend,
      factors,
      clubStance: 'FREE_AGENT',
      clubStanceLabel: 'Serbest · İmza Primi',
      signingBonus,
      minAcceptableBuyout: signingBonus,
      estimatedFeeMin: signingBonus,
      estimatedFeeMax: signingBonus,
      fairSaleValue: round5k(marketValue * 0.8),
      sameRegionRival: false,
    };
  }

  const sameRegionRival = Boolean(buyerTeam && sellingTeam.id !== buyerTeam.id && sellingTeam.region === buyerTeam.region && sellingTeam.prestige >= 82);
  const rivalTax = sameRegionRival ? 1.22 : 1.0;
  const contractFeeMod = contractYears <= 1 ? 0.88 : contractYears === 2 ? 1.04 : 1.20;

  let clubStance = 'OPEN';
  let clubStanceLabel = 'Pazarlığa Açık';
  let minMult = 1.08 * contractFeeMod;
  let maxMult = 1.35 * contractFeeMod;

  if (sellingTeam.prestige >= 88 && safeOvr >= 90 && player.isStarter && contractYears >= 2) {
    clubStance = 'UNTOUCHABLE';
    clubStanceLabel = 'Dokunulmaz Franchise';
    minMult = 2.15;
    maxMult = 2.55;
  } else if (contractYears <= 1) {
    clubStance = 'EXPIRING';
    clubStanceLabel = 'Son Yıl Fırsatı';
    minMult = player.isStarter ? 0.88 : 0.72;
    maxMult = player.isStarter ? 1.12 : 0.90;
  } else if (!player.isStarter || (player.morale ?? 80) < 64) {
    clubStance = 'OPEN';
    clubStanceLabel = !player.isStarter ? 'Yedek · Satılabilir' : 'Mutsuz · Ayrılabilir';
    minMult = 0.78;
    maxMult = 1.02;
  } else if (safeOvr >= 88) {
    clubStance = 'RELUCTANT';
    clubStanceLabel = 'Kilit Yıldız · Zorlu';
    minMult = 1.42 * contractFeeMod;
    maxMult = 1.74 * contractFeeMod;
  } else {
    clubStance = 'OPEN';
    clubStanceLabel = 'İlk 5 · Pazarlığa Açık';
    minMult = 1.08 * contractFeeMod;
    maxMult = 1.34 * contractFeeMod;
  }

  const minAcceptableBuyout = round5k(marketValue * minMult * rivalTax);
  const estimatedFeeMin = round5k(minAcceptableBuyout * 0.95);
  const estimatedFeeMax = Math.max(minAcceptableBuyout + 10000, round5k(marketValue * maxMult * rivalTax));
  const fairSaleValue = round5k(marketValue * (player.isStarter ? 0.96 : 0.82));

  return {
    marketValue,
    prevMarketValue,
    deltaPct,
    trend,
    factors,
    clubStance,
    clubStanceLabel,
    signingBonus,
    minAcceptableBuyout,
    estimatedFeeMin,
    estimatedFeeMax,
    fairSaleValue,
    sameRegionRival,
  };
}

export const SUB_LEAGUES = {
  LCK: { name: 'LCK CL (Challengers)', clubs: ['T1 Esports Academy', 'Gen.G Global Academy', 'KT Rolster Challengers', 'DK Challengers', 'HLE Challengers'] },
  LPL: { name: 'LDL (Gelişim Ligi)', clubs: ['BLG Junior', 'JDG Joy Dream', 'TES Challenger', 'EDG Youth', 'WBG Youth'] },
  LEC: { name: 'EMEA Masters', clubs: ['Karmine Corp Blue', 'Los Heretics', 'BDS Academy', 'Vitality.Bee', 'SK Gaming Prime'] },
  LCS: { name: 'NACL (Akademi Ligi)', clubs: ['FlyQuest NACL', 'TL Challengers', 'Disguised', 'Fear x Starforge', 'Maryville Esports'] },
  TCL: { name: 'TCL Akademi Ligi', clubs: ['SuperMassive Academy', 'BJK Akademi', 'Dark Passage Youth', 'FUT Academy', 'Galakticos Youth'] },
  CBLOL: { name: 'CBLOL Academy', clubs: ['LOUD Academy', 'paiN Academy', 'RED Academy', 'KaBuM! Academy', 'FURIA Academy'] },
  LCO: { name: 'LCO Challengers', clubs: ['Chiefs Academy', 'Dire Wolves Youth', 'Ground Zero', 'Kanga Esports', 'Mammoth Youth'] },
};

export function addSocialPost(state, post) {
  if (!state.socialFeed) state.socialFeed = [];
  state.socialFeed.unshift({
    id: `soc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    season: state.season,
    week: state.week,
    platform: post.platform || 'X',
    handle: post.handle || '@EsportsPulse',
    author: post.author || 'Esports Pulse',
    badge: post.badge || 'ANALİZ',
    body: post.body || '',
    likes: post.likes ?? Math.round(180 + Math.random() * 2400),
    replies: post.replies ?? Math.round(18 + Math.random() * 320),
  });
  if (state.socialFeed.length > 35) state.socialFeed.pop();
}

export function loanPlayerOut(state, playerId) {
  const p = state.players.find(x => x.id === playerId && x.teamId === state.userTeamId);
  const team = state.teams.find(t => t.id === state.userTeamId);
  if (!p || !team) return { ok: false, reason: 'Oyuncu kadroda bulunamadı.' };
  if (p.loanedTo) return { ok: false, reason: `${p.name} zaten ${p.loanedTo.clubName} (${p.loanedTo.leagueName}) takımında kiralık.` };
  const availableInRole = state.players.filter(x => x.teamId === state.userTeamId && x.role === p.role && !x.loanedTo);
  if (availableInRole.length <= 1) {
    return { ok: false, reason: `${p.role} mevkiinde başka aktif oyuncun yok! Önce yedek bulmadan kiralayamazsın.` };
  }
  const sub = SUB_LEAGUES[team.region] || SUB_LEAGUES.LEC;
  const partnerClub = sub.clubs[Math.floor(Math.random() * sub.clubs.length)];
  p.isStarter = false;
  p.benchWeeks = 0;
  p.loanedTo = {
    leagueName: sub.name,
    clubName: partnerClub,
    gamesPlayed: 0,
    growthGained: 0,
    seasonStart: state.season,
  };
  p.morale = Math.min(100, (p.morale || 75) + 6);
  getTeamRoster(state, team.id);
  addSocialPost(state, {
    platform: 'X',
    handle: '@SheepEsports',
    author: 'Sheep Esports (Tier 1)',
    badge: 'KİRALAMA',
    body: `[RESMİ] ${team.name}, genç ${p.role} oyuncusu ${p.name} (${p.age}y, OVR ${p.ovr}) için ${sub.name} ekibi ${partnerClub} ile sezonluk kiralama anlaşmasına vardı.`,
  });
  return { ok: true, reason: `${p.name}, ${partnerClub} (${sub.name}) takımına kiralandı! Haftalık maç oynayarak hızla gelişecek.` };
}

export function recallLoanedPlayer(state, playerId) {
  const p = state.players.find(x => x.id === playerId && x.teamId === state.userTeamId);
  if (!p || !p.loanedTo) return { ok: false, reason: 'Oyuncu şu anda kiralık değil.' };
  const prevClub = p.loanedTo.clubName;
  const prevGames = p.loanedTo.gamesPlayed || 0;
  const prevGrowth = p.loanedTo.growthGained || 0;
  p.loanedTo = null;
  p.morale = Math.min(100, (p.morale || 75) + 3);
  if (prevGrowth > 0) bumpManagerRep(state, 0.5, 'youthRep', 1);
  return {
    ok: true,
    reason: `${p.name}, ${prevClub} kiralık döneminden geri çağrıldı (${prevGames} alt lig maçı, +${prevGrowth} özellik gelişimi).`,
  };
}

export function getTeamRoster(state, teamId) {
  const all = state.players.filter(p => p.teamId === teamId && !p.loanedTo);
  const starters = [];
  for (const role of ROLES) {
    const rolePlayers = all.filter(p => p.role === role);
    if (rolePlayers.length === 0) continue;
    // Enforce strictly ONE starter per role (fixes 6+ starters bug!)
    const curStarters = rolePlayers.filter(p => p.isStarter).sort((a, b) => b.ovr - a.ovr);
    const chosen = curStarters[0] || [...rolePlayers].sort((a, b) => b.ovr - a.ovr)[0];
    for (const rp of rolePlayers) rp.isStarter = (rp.id === chosen.id);
    starters.push(chosen);
  }
  return starters;
}

export function getTeamOVR(state, teamId) {
  const roster = getTeamRoster(state, teamId);
  if (roster.length === 0) return 0;
  return Math.round(roster.reduce((s, p) => s + p.ovr, 0) / roster.length);
}

export function getTeamWageCap(team) {
  if (!team) return 200000;
  const p = team.prestige || 75;
  const trophyBonus = Math.min(35000, (team.trophies?.length || 0) * 9000);
  const base = p >= 93 ? 320000 : p >= 88 ? 275000 : p >= 82 ? 230000 : p >= 76 ? 190000 : 155000;
  return base + trophyBonus;
}

export function getTeamWeeklyWages(state, teamId) {
  const playerWages = state.players.filter(p => p.teamId === teamId).reduce((s, p) => s + p.salary, 0);
  const team = state.teams.find(t => t.id === teamId);
  if (!team) return playerWages;
  ensureTeamExtras(team);
  const staffWages = Object.entries(STAFF_INFO).reduce((s, [k, info]) => s + (info.wages[team.staff[k] || 1] || 0), 0);
  return playerWages + staffWages;
}

// LCK/LPL Style Franchise Player Exception (Faker Rule): loyal stars (45+ games at club) count 35% less against Salary Cap!
export function getTeamCapHit(state, teamId) {
  const playerCapHit = state.players
    .filter(p => p.teamId === teamId)
    .reduce((s, p) => s + ((p.teamGames ?? 0) >= 45 ? Math.round(p.salary * 0.65) : p.salary), 0);
  const team = state.teams.find(t => t.id === teamId);
  if (!team) return playerCapHit;
  ensureTeamExtras(team);
  const staffWages = Object.entries(STAFF_INFO).reduce((s, [k, info]) => s + (info.wages[team.staff[k] || 1] || 0), 0);
  return playerCapHit + staffWages;
}

export function getTeamLuxuryTax(state, teamId) {
  const team = state.teams.find(t => t.id === teamId);
  if (!team) return 0;
  const capHit = getTeamCapHit(state, teamId);
  const cap = getTeamWageCap(team);
  return capHit > cap ? Math.round((capHit - cap) * 2.5) : 0;
}

export function getTeamFacilityUpkeep(team) {
  if (!team?.facilities) return 20000;
  const totalLvls = Object.values(team.facilities).reduce((s, v) => s + (Number(v) || 1), 0);
  return totalLvls * 9500;
}

// November Free Agency Bidding War: rival clubs compete for high-OVR Free Agents!
export function getFreeAgentBiddingWar(state, player, userTeam) {
  if (!player || player.teamId || (player.ovr || 0) < 81) return null;
  const rivals = state.teams
    .filter(t => t.id !== userTeam?.id && t.budget >= 750000 && t.prestige >= Math.max(72, (player.ovr - 12)))
    .filter(t => evaluateTransferInterest(state, player, t).willing)
    .sort((a, b) => b.prestige - a.prestige)
    .slice(0, 2);
  if (rivals.length === 0) return null;
  const topRival = rivals[0];
  const rivalSalary = Math.round(((player.salary || 18000) * (1.16 + Math.min(0.18, (player.ovr - 80) * 0.014))) / 500) * 500;
  return {
    rivals: rivals.map(r => `${r.tag} (${r.region})`),
    topRivalName: topRival.name,
    topRivalTag: topRival.tag,
    competingSalary: rivalSalary,
  };
}

export function startKoreanBootcamp(state) {
  ensureCalendarState(state);
  const userTeam = state.teams.find(t => t.id === state.userTeamId);
  if (!userTeam) return { ok: false, reason: 'Kulüp bulunamadı.' };
  const cost = 180000;
  if ((state.koreanBootcampWeeks || 0) > 0) {
    return { ok: false, reason: `Kore Bootcamp'i zaten aktif (${state.koreanBootcampWeeks} hafta kaldı).` };
  }
  if (userTeam.budget < cost) {
    return { ok: false, reason: `Kore Bootcamp'i için ${formatMoney(cost)} bütçe gerekiyor.` };
  }
  userTeam.budget -= cost;
  state.koreanBootcampWeeks = 3;
  userTeam.scrimRep = Math.min(100, (userTeam.scrimRep ?? 62) + 15);
  userTeam.synergy = Math.min(100, +(userTeam.synergy + 3.5).toFixed(1));
  for (const p of getTeamRoster(state, userTeam.id)) {
    p.form = Math.min(99, (p.form || 75) + 3);
    p.fatigue = Math.min(100, (p.fatigue || 20) + 6);
    recalculatePlayerMarketValue(state, p, true);
  }
  addSocialPost(state, {
    platform: 'X',
    handle: '@KorizonEsports',
    author: 'Korizon Esports',
    badge: 'BOOTCAMP',
    body: `${userTeam.name} ekibi Seul'e indi! 3 haftalık Kore Bootcamp'i boyunca LCK/LPL devleriyle yoğun scrim blokları ve Kore SoloQ kampı yapacaklar.`,
  });
  return {
    ok: true,
    reason: `Seul Kore Bootcamp'i başladı (-${formatMoney(cost)})! 3 hafta boyunca tüm LCK/LPL devleriyle scrim açıldı (+3.5 Sinerji, +3 Form, +15 Scrim İtibarı).`,
  };
}

function generateRoundRobin(teamIds, bestOf = 3) {
  const arr = [...teamIds];
  const n = arr.length;
  const weeks = [];
  for (let round = 0; round < n - 1; round++) {
    const matches = [];
    for (let i = 0; i < n / 2; i++) {
      const t1 = arr[i];
      const t2 = arr[n - 1 - i];
      matches.push({
        id: `m_${round}_${i}_${t1}_${t2}`,
        blueId: round % 2 === 0 ? t1 : t2,
        redId: round % 2 === 0 ? t2 : t1,
        bestOf,
        fearless: bestOf > 1,
        blueScore: 0,
        redScore: 0,
        played: false,
        winnerId: null,
      });
    }
    weeks.push(matches);
    arr.splice(1, 0, arr.pop());
  }
  return weeks;
}

function createRegionalSchedules(teams) {
  const schedules = {};
  const standings = {};
  for (const reg of REGIONS) {
    const rTeams = teams.filter(t => t.region === reg.id);
    schedules[reg.id] = generateRoundRobin(rTeams.map(t => t.id), reg.splitBestOf || 3);
    standings[reg.id] = rTeams.map(t => ({
      teamId: t.id, wins: 0, losses: 0, gameWins: 0, gameLosses: 0,
    }));
  }
  return { schedules, standings };
}

export function getSortedStandings(state, regionId) {
  const list = state.standings[regionId] || [];
  return [...list].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const gdA = a.gameWins - a.gameLosses;
    const gdB = b.gameWins - b.gameLosses;
    if (gdB !== gdA) return gdB - gdA;
    return getTeamOVR(state, b.teamId) - getTeamOVR(state, a.teamId);
  });
}

export function addInboxMessage(state, { title, sender, category, body, priority = 'NORMAL', actions = null, meta = null }) {
  if (!Array.isArray(state.inbox)) state.inbox = [];
  if (!Array.isArray(state.notifications)) state.notifications = [];
  const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  state.inbox.unshift({
    id,
    date: `Sezon ${state.season} — ${getPhaseLabel(state.phase)} H${state.week}`,
    season: state.season,
    week: state.week,
    title,
    sender,
    category,
    body,
    priority,
    actions: Array.isArray(actions) && actions.length > 0 ? actions : null,
    actionTaken: null,
    meta: meta || null,
    read: false,
  });
  if (state.inbox.length > 70) state.inbox.pop();

  state.notifications.unshift({
    id: `notif_${id}`,
    msgId: id,
    title,
    detail: (body || '').slice(0, 110),
    category,
    priority,
    read: false,
    season: state.season,
    week: state.week,
  });
  if (state.notifications.length > 30) state.notifications.pop();
}

/**
 * @param {any} state
 * @param {number} delta
 * @param {string | null} [subField]
 * @param {number | null} [subDelta]
 */
export function bumpManagerRep(state, delta, subField = null, subDelta = null) {
  ensureCalendarState(state);
  const mp = state.managerProfile;
  mp.reputation = Math.max(0, Math.min(100, +(mp.reputation + delta).toFixed(1)));
  if (subField && typeof mp[subField] === 'number') {
    const d = subDelta !== null ? subDelta : delta;
    mp[subField] = Math.max(0, Math.min(100, +(mp[subField] + d).toFixed(1)));
  }
}

export function markAllNotificationsRead(state) {
  if (Array.isArray(state.notifications)) {
    for (const n of state.notifications) n.read = true;
  }
  if (Array.isArray(state.inbox)) {
    for (const m of state.inbox) m.read = true;
  }
}

export function getManagerProfile(state) {
  ensureCalendarState(state);
  const mp = state.managerProfile;
  const rep = Math.round(mp.reputation ?? 45);
  let rankTitle = 'Efsane Taktisyen';
  if (rep < 40) rankTitle = 'Çaylak Koç';
  else if (rep < 55) rankTitle = 'Gelecek Vadeden Koç';
  else if (rep < 68) rankTitle = 'Deneyimli Taktisyen';
  else if (rep < 80) rankTitle = 'Bölge Şampiyonu';
  else if (rep < 90) rankTitle = 'Uluslararası Elit';

  const wins = state.records?.careerWins || 0;
  const losses = state.records?.careerLosses || 0;
  const total = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  return {
    reputation: rep,
    tacticalRep: Math.round(mp.tacticalRep ?? 50),
    youthRep: Math.round(mp.youthRep ?? 45),
    mediaRep: Math.round(mp.mediaRep ?? 50),
    trophiesWon: mp.trophiesWon || 0,
    titleHistory: mp.titleHistory || [],
    rankTitle,
    winRate,
    wins,
    losses,
  };
}

export function executeInboxAction(state, msgId, actionId) {
  const msg = (state.inbox || []).find(m => m.id === msgId);
  if (!msg) return { ok: false, msg: 'Mesaj bulunamadı.' };
  const action = (msg.actions || []).find(a => a.id === actionId);
  if (!action) return { ok: false, msg: 'Geçersiz aksiyon.' };

  if (action.type === 'NAV') {
    msg.read = true;
    return { ok: true, nav: action.payload?.tab || 'dashboard' };
  }
  if (action.type === 'OPEN_PLAYER') {
    msg.read = true;
    return { ok: true, openPlayerId: action.payload?.playerId || null };
  }

  if (msg.actionTaken) {
    return { ok: false, msg: 'Bu karar zaten verildi.' };
  }

  const userTeam = state.teams.find(t => t.id === state.userTeamId);
  const roster = userTeam ? getTeamRoster(state, userTeam.id) : [];
  let confirmMsg = `${action.label} uygulandı.`;

  if (action.type === 'REST_PLAYER') {
    const p = state.players.find(x => x.id === action.payload?.playerId);
    if (p) {
      p.fatigue = Math.max(0, (p.fatigue || 0) - 14);
      p.morale = Math.min(100, (p.morale || 75) + 3);
      confirmMsg = `${p.name} özel izne çıkarıldı (Yorgunluk -14, Moral +3).`;
    }
  } else if (action.type === 'SET_LIGHT_TRAINING') {
    if (userTeam) {
      userTeam.trainingIntensity = 'light';
      confirmMsg = 'Takım antrenman yoğunluğu Hafif seviyesine düşürüldü.';
    }
  } else if (action.type === 'ACCEPT_SPONSOR_SHOOT') {
    if (userTeam) {
      userTeam.budget += 95000;
      userTeam.fanbase = Math.min(100, (userTeam.fanbase || 60) + 2);
      roster.forEach(p => { p.fatigue = Math.min(100, (p.fatigue || 0) + 6); });
      bumpManagerRep(state, 0.4, 'mediaRep', 1);
      confirmMsg = 'Sponsor çekimi onaylandı (+$95K bütçe, +2 Taraftar, İlk 5 +6 Yorgunluk).';
    }
  } else if (action.type === 'DECLINE_SPONSOR_SHOOT') {
    roster.forEach(p => {
      p.fatigue = Math.max(0, (p.fatigue || 0) - 4);
      p.form = Math.min(99, (p.form || 75) + 2);
    });
    confirmMsg = 'Sponsor çekimi reddedildi — takım antrenmana odaklandı (Yorgunluk -4, Form +2).';
  } else if (action.type === 'ACCEPT_APOLOGY') {
    const p = state.players.find(x => x.id === action.payload?.playerId);
    if (p) p.morale = Math.min(100, (p.morale || 75) + 4);
    confirmMsg = 'Özür kabul edildi; takım içi huzur korundu (Moral +4).';
  } else if (action.type === 'BLACKLIST_LEAKER') {
    if (userTeam) {
      userTeam.scrimRep = Math.max(20, (userTeam.scrimRep ?? 62) - 3);
      userTeam.synergy = Math.min(100, (userTeam.synergy || 65) + 2);
    }
    confirmMsg = 'Sızıntı yapan partner kara listeye alındı (+2 Sinerji, -3 Scrim İtibarı).';
  } else if (action.type === 'ACCEPT_CONTENT_DEAL') {
    if (userTeam) userTeam.budget += 60000;
    const p = state.players.find(x => x.id === action.payload?.playerId);
    if (p) {
      p.morale = Math.min(100, (p.morale || 75) + 4);
      p.fatigue = Math.min(100, (p.fatigue || 0) + 4);
    }
    bumpManagerRep(state, 0.3, 'mediaRep', 1);
    confirmMsg = `İçerik anlaşması imzalandı (+$60K, ${p ? p.name + ' Moral +4, Yorgunluk +4' : ''}).`;
  } else if (action.type === 'DECLINE_CONTENT_DEAL') {
    const p = state.players.find(x => x.id === action.payload?.playerId);
    if (p) p.morale = Math.max(25, (p.morale || 75) - 3);
    confirmMsg = `İçerik anlaşması reddedildi (${p ? p.name + ' Moral -3' : 'antrenman öncelikli'}).`;
  }

  msg.actionTaken = action.label;
  msg.read = true;
  if (Array.isArray(state.notifications)) {
    const n = state.notifications.find(x => x.msgId === msg.id);
    if (n) n.read = true;
  }
  return { ok: true, msg: confirmMsg };
}

export function getTransferWindowStatus(state) {
  if (state.phase === 'OFFSEASON') {
    return { open: true, label: 'Büyük Transfer Penceresi (Rostermania)', detail: 'Sezon arası açık — tüm bonservisli ve serbest transferler aktif.' };
  }
  if ((state.phase === 'SPRING_SPLIT' || state.phase === 'SUMMER_SPLIT') && state.week <= 2) {
    const splitLbl = state.phase === 'SPRING_SPLIT' ? 'Bahar' : 'Yaz Ara';
    return { open: true, label: `${splitLbl} Transfer Penceresi (AÇIK)`, detail: `Hafta 2 sonunda Kadro Kilidi (Roster Lock) devreye girecek.` };
  }
  const nextWin = state.phase === 'SPRING_SPLIT' || state.phase === 'SPRING_PLAYOFFS' || state.phase === 'MSI'
    ? 'Yaz Mevsimi Hafta 1'
    : 'Sezon Arası (Kasım)';
  return { open: false, label: 'Kadro Kilidi (Roster Lock)', detail: `Transferler kapalı. Scouting yapabilirsin; sonraki pencere: ${nextWin}.` };
}

export function isTransferWindowOpen(state) {
  return getTransferWindowStatus(state).open;
}

export function getPhaseLabel(phase) {
  const map = {
    SPRING_SPLIT: 'Bahar Mevsimi',
    SPRING_PLAYOFFS: 'Bahar Playoff',
    MSI: 'MSI Uluslararası',
    SUMMER_SPLIT: 'Yaz Mevsimi',
    SUMMER_PLAYOFFS: 'Yaz Playoff',
    WORLDS_PLAYIN: 'WORLDS Ön Eleme (Play-In)',
    WORLDS_SWISS: 'WORLDS İsviçre Aşaması',
    WORLDS_KNOCKOUT: 'WORLDS Eleme Aşaması',
    OFFSEASON: 'Sezon Arası & Transfer',
  };
  return map[phase] || phase;
}

const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const TR_DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const TR_DAYS_SHORT = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

export function ensureCalendarState(state) {
  if (!state.currentDate) state.currentDate = `${state.season || 2027}-01-11`; // Monday
  if (!state.scrimIntel) state.scrimIntel = {};
  if (!state.transferFeed) state.transferFeed = [];
  if (!state.tournamentArchive) state.tournamentArchive = [];
  if (!state.managerJobOffers) state.managerJobOffers = [];
  if (!state.incomingOffers) state.incomingOffers = [];
  if (!state.recentEventIds) state.recentEventIds = [];
  if (!state.recentNewsIds) state.recentNewsIds = [];
  if (!state.financeLog) state.financeLog = [];
  if (!state.socialFeed) state.socialFeed = [];
  if (!state.notifications) state.notifications = [];
  if (!state.managerProfile) {
    const ut = Array.isArray(state.teams) ? state.teams.find(t => t.id === state.userTeamId) : null;
    const initRep = Math.round(35 + ((ut?.prestige || 50) * 0.25));
    state.managerProfile = {
      reputation: Math.max(25, Math.min(85, initRep)),
      tacticalRep: 50,
      youthRep: 45,
      mediaRep: 50,
      trophiesWon: 0,
      titleHistory: [],
    };
  }
  if (!state.records) state.records = { careerWins: 0, careerLosses: 0, currentStreak: 0, bestStreak: 0, hallOfFame: [] };
  if (Array.isArray(state.players)) {
    for (const p of state.players) {
      if (!Array.isArray(p.careerHistory)) p.careerHistory = [];
    }
  }
  if (state.socialFeed.length === 0 && Array.isArray(state.teams)) {
    const ut = state.teams.find(t => t.id === state.userTeamId);
    if (ut) {
      addSocialPost(state, {
        platform: 'X',
        handle: '@LEC_Wooloo',
        author: 'LEC Wooloo (Tier 1)',
        badge: 'SIZINTI',
        body: `Kaynaklarımıza göre ${ut.name} yeni başantrenörü ${state.managerName || 'Koç'} yönetiminde iddialı bir ${ut.region} splitine hazırlanıyor. Scrim sonuçları şimdiden konuşuluyor.`,
      });
      addSocialPost(state, {
        platform: 'REDDIT',
        handle: 'r/leagueoflegends',
        author: 'u/RiftAnalyst26',
        badge: 'TARTIŞMA',
        body: `[Sezon ${state.season || 2027} Tahminleri] ${ut.tag} bu kadroyla Playoff ve uluslararası sahnede ne yapar? Yeni Fearless Draft metası şampiyon havuzu geniş takımları öne çıkaracak.`,
      });
    }
  }
  if (Array.isArray(state.teams)) {
    state.teams.forEach(t => {
      ensureTeamExtras(t);
      if (Array.isArray(state.players)) getTeamRoster(state, t.id);
    });
  }
  // Auto-deduplicate any colliding player IDs (fixes old SoloQ Challenger signings!)
  if (Array.isArray(state.players)) {
    const seen = new Set();
    for (const p of state.players) {
      if (seen.has(p.id)) {
        p.id = `p_fix_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      }
      seen.add(p.id);
    }
    if (Array.isArray(state.challengerPool)) {
      for (const c of state.challengerPool) {
        if (seen.has(c.id)) {
          c.id = `p_ch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
        }
        seen.add(c.id);
      }
    }
  }
  // One-time realistic budget rebalance for existing saves!
  if (!state.economyRebalancedV2 && Array.isArray(state.teams)) {
    state.economyRebalancedV2 = true;
    for (const t of state.teams) {
      const boost = Math.round(((t.prestige >= 90 ? 4500000 : t.prestige >= 82 ? 3200000 : t.prestige >= 75 ? 2400000 : 1700000)) / 50000) * 50000;
      t.budget += boost;
      if (t.sponsor) {
        const sp = SPONSORS.find(s => s.id === t.sponsor.id);
        if (sp) t.sponsor = sp;
      }
    }
  }
  // One-time multi-factor market valuation sync for existing saves
  if (!state.marketValuationV3 && Array.isArray(state.players)) {
    state.marketValuationV3 = true;
    syncAllMarketValues(state, false);
  }
}

function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toISO(dt) {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysISO(iso, days) {
  const dt = parseISO(iso);
  dt.setUTCDate(dt.getUTCDate() + days);
  return toISO(dt);
}

export function formatTurkishDate(iso) {
  const dt = parseISO(iso || '2027-01-11');
  return `${dt.getUTCDate()} ${TR_MONTHS[dt.getUTCMonth()]} ${dt.getUTCFullYear()}, ${TR_DAYS[dt.getUTCDay()]}`;
}

export function isMatchDay(state) {
  ensureCalendarState(state);
  const dow = parseISO(state.currentDate).getUTCDay(); // 6 = Saturday
  return dow === 6 && !!getUserNextMatch(state);
}

// Build 7-day Monday..Sunday strip for current week
export function getWeekCalendarDays(state) {
  ensureCalendarState(state);
  const cur = parseISO(state.currentDate);
  const dow = cur.getUTCDay(); // 0=Sun, 1=Mon..6=Sat
  const offsetToMon = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(cur);
  mon.setUTCDate(cur.getUTCDate() + offsetToMon);

  const nextMatch = getUserNextMatch(state);
  const oppId = nextMatch ? (nextMatch.blueId === state.userTeamId ? nextMatch.redId : nextMatch.blueId) : null;
  const oppTag = oppId ? state.teams.find(t => t.id === oppId)?.tag : null;

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon);
    d.setUTCDate(mon.getUTCDate() + i);
    const iso = toISO(d);
    const wd = d.getUTCDay();

    let eventLabel = 'Antrenman';
    let eventType = 'normal';
    if (wd === 1) { eventLabel = 'Haftalık Finans'; eventType = 'finance'; }
    else if (wd === 3) { eventLabel = state.week === 4 ? 'Yama & Scrim' : 'Scrim Günü'; eventType = 'scrim'; }
    else if (wd === 4) { eventLabel = 'Basın / Scout'; eventType = 'news'; }
    else if (wd === 6) {
      if (nextMatch && oppTag) { eventLabel = `MAÇ: vs ${oppTag}`; eventType = 'match'; }
      else if (state.phase === 'OFFSEASON') { eventLabel = 'Transfer Dönemi'; eventType = 'news'; }
      else { eventLabel = 'Diğer Maçlar'; eventType = 'normal'; }
    }
    else if (wd === 0) { eventLabel = 'Dinlenme'; eventType = 'rest'; }

    days.push({
      iso,
      dayNum: d.getUTCDate(),
      monthShort: TR_MONTHS[d.getUTCMonth()].slice(0, 3),
      dayShort: TR_DAYS_SHORT[wd],
      isToday: iso === state.currentDate,
      isPast: iso < state.currentDate,
      eventLabel,
      eventType,
    });
  }
  return days;
}

// Advance 1 single day (FM Continue / Spacebar loop!)
export function advanceOneDay(state) {
  ensureCalendarState(state);
  if (state.pendingEvent) return { status: 'EVENT', msg: 'Önce bekleyen karar olayını yanıtla.' };

  const curDow = parseISO(state.currentDate).getUTCDay();

  // If today is Match Day and user still has an unplayed match, stop!
  if (curDow === 6 && getUserNextMatch(state)) {
    return { status: 'MATCH_DAY', msg: 'Bugün Maç Günü! Önce karşılaşmanı oyna.' };
  }

  // Advance calendar by 1 day
  state.currentDate = addDaysISO(state.currentDate, 1);
  const newDow = parseISO(state.currentDate).getUTCDay();

  // Daily age-linked recovery for user roster (younger players bounce back faster, veterans recover slower)
  for (const p of state.players) {
    if (p.teamId === state.userTeamId) {
      const ageProf = getAgeFatigueProfile(p.age);
      const baseRec = newDow === 0 ? 4.5 : 1.4;
      p.fatigue = Math.max(0, +(p.fatigue - baseRec * ageProf.recMult).toFixed(1));
    }
  }

  // Off-Season Rostermania: allow advancing days to receive fresh AI transfer bids!
  if (state.phase === 'OFFSEASON') {
    if (newDow === 3 || newDow === 5) {
      maybeGenerateIncomingOffer(state, 0.58);
    }
    return { status: 'OK', msg: `${formatTurkishDate(state.currentDate)} — Transfer Pazarı Açık` };
  }

  // Tuesday (2), Wednesday (3), Friday (5): Living World News, Match Preview & Scouting Buzz!
  if (newDow === 2 || newDow === 3 || newDow === 5) {
    maybeGenerateLivingWorldNews(state, newDow);
  }

  // Thursday (4): Mid-week Drama Event or AI Transfer Offer!
  if (newDow === 4) {
    maybeTriggerDramaEvent(state);
    maybeGenerateIncomingOffer(state);
    if (state.pendingEvent) return { status: 'EVENT', msg: `Gündem: ${state.pendingEvent.title}` };
  }

  // Saturday (6): Match Day arrived!
  if (newDow === 6 && getUserNextMatch(state)) {
    return { status: 'MATCH_DAY', msg: 'Maç Günü geldi! Takımın sahneye çıkmaya hazır.' };
  }

  // Monday (1): Week wrapped -> finish previous week's AI matches & advance phase/week!
  if (newDow === 1) {
    advanceWeekOrRound(state);
    return { status: 'NEW_WEEK', msg: `Yeni hafta başladı: ${getPhaseLabel(state.phase)} H${state.week}` };
  }

  return { status: 'OK', msg: formatTurkishDate(state.currentDate) };
}

// Skip smoothly day-by-day until Match Day, Drama Event, or New Phase
export function skipToNextKeyDay(state) {
  ensureCalendarState(state);
  let last = { status: 'OK', msg: '' };
  for (let i = 0; i < 7; i++) {
    last = advanceOneDay(state);
    if (last.status === 'MATCH_DAY' || last.status === 'EVENT' || last.status === 'NEW_WEEK') break;
  }
  return last;
}

function setCalendarToMonday(state, month, day) {
  const dt = new Date(Date.UTC(state.season, month - 1, day));
  const dow = dt.getUTCDay();
  const diff = dow === 0 ? 1 : (dow === 1 ? 0 : 8 - dow);
  dt.setUTCDate(dt.getUTCDate() + diff);
  state.currentDate = toISO(dt);
}

export function createNewCareer(userTeamId, managerName = 'Koç') {
  const cleanName = (managerName || 'Koç').trim() || 'Koç';
  const { teams, players } = createInitialDatabase();
  const { schedules, standings } = createRegionalSchedules(teams);
  const userTeam = teams.find(t => t.id === userTeamId) || teams[0];
  userTeamId = userTeam.id;
  userTeam.sponsor = SPONSORS[0];
  teams.forEach(t => {
    ensureTeamExtras(t);
    const tPlayers = players.filter(p => p.teamId === t.id);
    // Established real-world cores start with earned continuity & duo bonds
    tPlayers.forEach(p => {
      if (p.teamGames === undefined) p.teamGames = p.isStarter ? Math.round(16 + Math.random() * 12) : 6;
    });
    const jgl = tPlayers.find(p => p.role === 'JGL' && p.isStarter);
    const mid = tPlayers.find(p => p.role === 'MID' && p.isStarter);
    const bot = tPlayers.find(p => p.role === 'BOT' && p.isStarter);
    const sup = tPlayers.find(p => p.role === 'SUP' && p.isStarter);
    if (jgl && mid) t.duoSynergy[getDuoPairKey(jgl.id, mid.id)] = Math.round(9 + Math.random() * 6);
    if (bot && sup) t.duoSynergy[getDuoPairKey(bot.id, sup.id)] = Math.round(9 + Math.random() * 6);
  });

  const state = {
    season: 2027,
    currentDate: '2027-01-11',
    managerName: cleanName,
    phase: 'SPRING_SPLIT',
    week: 1,
    patchIndex: 0,
    fearlessEnabled: true,
    userTeamId,
    teams,
    players,
    schedules,
    standings,
    swiss: null,     // 16-team Worlds Swiss Stage state
    worldsDirectIds: [], // 14 direct Swiss seeds waiting for 2 Play-In winners
    msiWinnerRegion: 'LCK',
    bracket: null,   // Playoffs / MSI / Worlds Play-In / Worlds Knockout
    challengerPool: generateChallengerProspects(),
    incomingOffers: [],
    managerJobOffers: [],
    scrimIntel: {},
    transferFeed: [],
    tournamentArchive: [],
    records: { careerWins: 0, careerLosses: 0, currentStreak: 0, bestStreak: 0, hallOfFame: [] },
    pendingEvent: null,
    boardWarnings: 0,
    sackedState: null,
    scrimDoneThisWeek: false,
    academyPromotedThisSplit: false,
    economyRebalancedV2: true,
    marketValuationV3: true,
    history: [],
    awards: [],
    inbox: [],
  };

  syncAllMarketValues(state, false);
  ensureCalendarState(state);

  addInboxMessage(state, {
    title: `Hoş Geldin ${cleanName} — ${userTeam.name} Görev Başlangıcı`,
    sender: 'Yönetim Kurulu',
    category: 'BOARD',
    body: `Hoş geldin ${cleanName}! ${userTeam.name} Genel Menajeri ve Baş Koçu olarak göreve başladın. Bütçen ${formatMoney(userTeam.budget)}. Hedefimiz ${userTeam.region} şampiyonluğu, MSI ve Worlds 2027 kupası!`,
  });

  const p0 = PATCHES[0];
  addInboxMessage(state, {
    title: `Yama ${p0.version} Yayınlandı: ${p0.name}`,
    sender: 'Riot Denge Ekibi',
    category: 'PATCH',
    body: p0.desc,
  });

  return state;
}

/**
 * @param {{ playerName?: string, role?: string, sigChamps?: string[], teamId?: string, archetype?: string, startInAcademy?: boolean }} [opts]
 */
export function createPlayerCareer({
  playerName = 'Rookie',
  role = 'MID',
  sigChamps = /** @type {string[]} */ ([]),
  teamId = 'bro',
  archetype = 'Aggressive',
  startInAcademy = true,
} = {}) {
  const cleanPlayer = (playerName || 'Rookie').trim() || 'Rookie';
  const state = createNewCareer(teamId, 'AI Baş Koç');
  const team = state.teams.find(t => t.id === teamId) || state.teams[0];
  state.managerName = `${team.tag} Baş Koçu`;
  state.careerMode = 'PLAYER';

  // Only demote existing starter if starting directly in Main Roster
  if (!startInAcademy) {
    for (const p of state.players) {
      if (p.teamId === team.id && p.role === role && p.isStarter) {
        p.isStarter = false;
      }
    }
  }

  const statOffset = startInAcademy ? -6 : 0;
  const baseAttrs = {
    laning: (archetype === 'Aggressive' ? 78 : archetype === 'Consistent' ? 76 : 74) + statOffset,
    mechanics: (archetype === 'Aggressive' ? 80 : archetype === 'Playmaker' ? 78 : 74) + statOffset,
    macro: (archetype === 'Playmaker' ? 77 : archetype === 'Weakside' ? 79 : 73) + statOffset,
    teamfight: (archetype === 'Consistent' ? 78 : archetype === 'Weakside' ? 77 : 75) + statOffset,
    clutch: (archetype === 'Aggressive' ? 78 : archetype === 'Consistent' ? 77 : 74) + statOffset,
    pool: Math.min(82, (startInAcademy ? 67 : 72) + sigChamps.length * 3),
  };
  const ovr = calcOVR(baseAttrs);
  const cleanSigs = (sigChamps || []).filter(Boolean).slice(0, 2);
  const subLeague = SUB_LEAGUES[team.region] || SUB_LEAGUES.LEC;

  const userPlayer = {
    id: 'user_legend_player',
    name: cleanPlayer,
    nat: 'TR',
    lang: REGION_LANG[team.region] || 'EN',
    role,
    age: startInAcademy ? 17 : 18,
    ovr,
    pot: 96,
    attrs: baseAttrs,
    sigChamps: cleanSigs,
    style: archetype || 'Aggressive',
    trait: archetype === 'Aggressive' ? 'Clutch' : archetype === 'Consistent' ? 'Leader' : 'Grinder',
    teamId: team.id,
    isStarter: !startInAcademy,
    contractYears: 2,
    salary: startInAcademy ? 1800 : 4500,
    marketValue: startInAcademy ? 85000 : 180000,
    morale: 84,
    form: 78,
    fatigue: 8,
    injuredWeeks: 0,
    benchWeeks: 0,
    importWeeksLeft: 0,
    teamGames: startInAcademy ? 0 : 4,
    rolePromise: startInAcademy ? 'ROTATION' : 'STAR',
    mastery: Object.fromEntries(cleanSigs.map(cid => [cid, 3])),
    stats: { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, mvps: 0 },
    careerHistory: [],
  };

  state.players.unshift(userPlayer);
  state.userPlayerId = userPlayer.id;
  state.playerCareer = {
    skillPoints: startInAcademy ? 3 : 2,
    coachTrust: startInAcademy ? 50 : 60,
    soloqLP: startInAcademy ? 480 : 640,
    fame: startInAcademy ? 8 : 15,
    weeklyActionDone: false,
    academyPlayedThisWeek: false,
    inAcademy: Boolean(startInAcademy),
    academyLeague: subLeague.name,
    academyClub: `${team.tag} Academy`,
    academyGames: 0,
    academyWins: 0,
    academyMvps: 0,
    transferOffers: [],
  };

  addInboxMessage(state, {
    title: startInAcademy
      ? `Akademi Kontratı: ${team.tag} Academy (${subLeague.name})`
      : `Efsane Ol: ${team.name} İlk 5 Forması Senin, ${cleanPlayer}!`,
    sender: `${team.tag} Baş Koçu`,
    category: 'BOARD',
    priority: 'HIGH',
    body: startInAcademy
      ? `Hoş geldin ${cleanPlayer}! Kariyerine ${subLeague.name} liginde ${team.tag} Academy formasıyla başlıyorsun (OVR ${ovr}). Akademi maçlarında parlayıp OVR 73+ veya Koç Güveni %75+ seviyesine ulaştığında ana takıma terfi edeceksin!`
      : `Hoş geldin ${cleanPlayer}! ${role} koridorunda ilk 5 şansını kaptın. Antrenman, SoloQ ve maç içi kritik kararlarınla OVR'ni yükselt; güvenimi kazanırsan Draft'ta istediğin şampiyonları da seçeceğim.`,
  });

  return state;
}

export function playAcademyMatch(state) {
  if (state.careerMode !== 'PLAYER' || !state.playerCareer?.inAcademy) {
    return { ok: false, msg: 'Şu anda Akademi Liginde değilsin.' };
  }
  const pc = state.playerCareer;
  if (pc.academyPlayedThisWeek) {
    return { ok: false, msg: 'Bu haftaki Akademi maçını zaten oynadın.' };
  }
  const p = state.players.find(x => x.id === state.userPlayerId);
  const team = state.teams.find(t => t.id === state.userTeamId);
  if (!p || !team) return { ok: false, msg: 'Oyuncu bulunamadı.' };

  const sub = SUB_LEAGUES[team.region] || SUB_LEAGUES.LEC;
  const oppClub = sub.clubs[Math.floor(Math.random() * sub.clubs.length)] || 'Rival Academy';

  const winChance = Math.max(0.32, Math.min(0.82, 0.44 + (p.ovr - 68) * 0.04 + ((p.form || 75) - 75) * 0.006));
  const won = Math.random() < winChance;
  const k = Math.max(1, Math.round((won ? 5 : 2) + Math.random() * 5));
  const d = Math.max(0, Math.round((won ? 2 : 4) + Math.random() * 3));
  const a = Math.max(2, Math.round((won ? 7 : 3) + Math.random() * 6));
  const isMvp = won && Math.random() < (0.35 + (p.ovr - 68) * 0.05);

  pc.academyGames = (pc.academyGames || 0) + 1;
  if (won) pc.academyWins = (pc.academyWins || 0) + 1;
  if (isMvp) pc.academyMvps = (pc.academyMvps || 0) + 1;
  pc.academyPlayedThisWeek = true;

  p.fatigue = Math.min(100, (p.fatigue || 0) + 8);
  p.form = Math.min(99, Math.max(55, (p.form || 75) + (won ? 3 : -1)));
  p.morale = Math.min(100, Math.max(30, (p.morale || 80) + (won ? 3 : -2)));

  let spGain = won ? 1 : (Math.random() < 0.4 ? 1 : 0);
  if (isMvp) spGain += 1;
  pc.skillPoints = (pc.skillPoints || 0) + spGain;
  pc.coachTrust = Math.max(15, Math.min(100, (pc.coachTrust || 50) + (won ? (isMvp ? 6 : 4) : -1)));
  pc.fame = Math.min(100, (pc.fame || 8) + (isMvp ? 3 : 1));

  const ready = p.ovr >= 73 || pc.coachTrust >= 75;
  if (ready) {
    addInboxMessage(state, {
      title: `Ana Takım Kapısı Açıldı! (${p.name} · OVR ${p.ovr})`,
      sender: `${team.tag} Baş Koçu`,
      category: 'BOARD',
      priority: 'URGENT',
      body: `${pc.academyLeague} performansın göz doldurdu! Ana takımda ${p.role} pozisyonu için hazırsın. Oyuncu Merkezinden "Ana Kadroya Yüksel" butonuna basarak ana lige çıkabilirsin!`,
    });
  }

  return {
    ok: true,
    won,
    isMvp,
    msg: `${pc.academyClub} vs ${oppClub}: ${won ? 'GALİBİYET' : 'MAĞLUBİYET'} (${k}/${d}/${a}${isMvp ? ' · MAÇIN MVP\'Sİ!' : ''}) · +${spGain} Gelişim Puanı.`,
  };
}

export function promoteFromAcademy(state) {
  if (state.careerMode !== 'PLAYER' || !state.playerCareer?.inAcademy) {
    return { ok: false, msg: 'Zaten ana kadrodasın.' };
  }
  const p = state.players.find(x => x.id === state.userPlayerId);
  const team = state.teams.find(t => t.id === state.userTeamId);
  const pc = state.playerCareer;
  if (!p || !team) return { ok: false, msg: 'Oyuncu bulunamadı.' };

  if (p.ovr < 73 && pc.coachTrust < 75) {
    return { ok: false, msg: `Terfi için OVR 73+ (Mevcut: ${p.ovr}) veya Koç Güveni %75+ (Mevcut: %${pc.coachTrust}) gerekli.` };
  }

  for (const op of state.players) {
    if (op.teamId === team.id && op.role === p.role && op.isStarter) {
      op.isStarter = false;
    }
  }
  p.isStarter = true;
  p.rolePromise = 'STAR';
  p.salary = 4500;
  pc.inAcademy = false;
  pc.fame = Math.min(100, (pc.fame || 10) + 10);

  if (!Array.isArray(p.careerHistory)) p.careerHistory = [];
  p.careerHistory.unshift({
    season: state.season,
    teamTag: `${team.tag} AC`,
    teamName: pc.academyClub,
    region: pc.academyLeague,
    games: pc.academyGames || 0,
    wins: pc.academyWins || 0,
    ovr: p.ovr,
  });

  addInboxMessage(state, {
    title: `TERFİ! ${p.name} Artık ${team.name} Ana Kadrosunda!`,
    sender: `${team.tag} Baş Koçu`,
    category: 'BOARD',
    priority: 'HIGH',
    body: `Tebrikler ${p.name}! ${pc.academyLeague} seviyesindeki performansınla ${team.name} İlk 5 kadrosuna yükseldin. Artık ${team.region} ana sahnesinde mücadele edeceksin!`,
  });

  return { ok: true, msg: `Tebrikler! ${team.name} Ana Kadrosuna (İlk 5) yükseldin!` };
}

/**
 * @param {any} state
 * @param {string} activityType
 * @param {string | null} [attrKey]
 */
export function runPlayerWeeklyActivity(state, activityType, attrKey = null) {
  if (state.careerMode !== 'PLAYER' || !state.playerCareer) return { ok: false, msg: 'Oyuncu kariyeri aktif değil.' };
  const p = state.players.find(x => x.id === state.userPlayerId);
  const pc = state.playerCareer;
  if (!p) return { ok: false, msg: 'Oyuncu bulunamadı.' };

  if (activityType === 'TRAIN_ATTR') {
    if ((pc.skillPoints || 0) <= 0) return { ok: false, msg: 'Yeterli Gelişim Puanın yok (Maç veya SoloQ ile kazan).' };
    if (!attrKey || p.attrs[attrKey] === undefined) return { ok: false, msg: 'Geçersiz özellik.' };
    if (p.attrs[attrKey] >= 99) return { ok: false, msg: `${attrKey} zaten maksimum (99)!` };
    p.attrs[attrKey] = Math.min(99, p.attrs[attrKey] + 1);
    p.ovr = calcOVR(p.attrs);
    pc.skillPoints--;
    recalculatePlayerMarketValue(state, p, true);
    return { ok: true, msg: `${attrKey.toUpperCase()} +1 geliştirildi! Güncel OVR: ${p.ovr}` };
  }

  if (pc.weeklyActionDone) {
    return { ok: false, msg: 'Bu hafta kişisel aktiviteni zaten yaptın.' };
  }

  if (activityType === 'SOLOQ') {
    const lpGain = Math.round(25 + Math.random() * 28);
    pc.soloqLP += lpGain;
    p.form = Math.min(99, (p.form || 75) + 2);
    p.fatigue = Math.min(100, (p.fatigue || 0) + 6);
    const gotPoint = Math.random() < 0.55;
    if (gotPoint) pc.skillPoints++;
    pc.weeklyActionDone = true;
    return {
      ok: true,
      msg: `SoloQ seansı tamamlandı (+${lpGain} LP, +2 Form${gotPoint ? ', +1 Gelişim Puanı!' : ''}).`,
    };
  }

  if (activityType === 'VOD_COACH') {
    pc.coachTrust = Math.min(100, (pc.coachTrust || 50) + 5);
    p.fatigue = Math.min(100, (p.fatigue || 0) + 3);
    if (Math.random() < 0.35 && p.attrs.macro < 99) {
      p.attrs.macro++;
      p.ovr = calcOVR(p.attrs);
    }
    pc.weeklyActionDone = true;
    return { ok: true, msg: `Koç ile birebir VOD analizi yapıldı (Koç Güveni +5 → %${pc.coachTrust}).` };
  }

  if (activityType === 'REST') {
    p.fatigue = Math.max(0, (p.fatigue || 0) - 18);
    p.morale = Math.min(100, (p.morale || 75) + 6);
    pc.weeklyActionDone = true;
    return { ok: true, msg: `Dinlenme günü tamamlandı (Yorgunluk -18, Moral +6).` };
  }

  if (activityType === 'STREAM') {
    pc.fame = Math.min(100, (pc.fame || 10) + 4);
    p.morale = Math.min(100, (p.morale || 75) + 3);
    p.fatigue = Math.min(100, (p.fatigue || 0) + 4);
    pc.coachTrust = Math.max(10, (pc.coachTrust || 50) - 1);
    pc.weeklyActionDone = true;
    return { ok: true, msg: `Yayın açıldı (+4 Şöhret, +3 Moral, Koç Güveni -1).` };
  }

  if (activityType === 'SEEK_TRANSFER') {
    if (p.ovr < 78) {
      return { ok: false, msg: `Büyük kulüplerin radarına girmek için OVR en az 78 olmalı (Mevcut: ${p.ovr}).` };
    }
    const targets = state.teams
      .filter(t => t.id !== state.userTeamId && t.prestige >= 78)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    pc.transferOffers = targets.map(t => ({
      teamId: t.id,
      teamName: t.name,
      tag: t.tag,
      region: t.region,
      prestige: t.prestige,
      salary: Math.round(p.salary * (1.35 + (t.prestige - 75) * 0.02)),
    }));
    pc.weeklyActionDone = true;
    return {
      ok: true,
      msg: targets.length
        ? `${targets.map(t => t.tag).join(' ve ')} kulüplerinden transfer teklifi geldi!`
        : 'Şu an uygun bir büyük kulüp teklifi bulunamadı.',
    };
  }

  return { ok: false, msg: 'Geçersiz aktivite.' };
}

export function acceptPlayerTransferOffer(state, targetTeamId) {
  if (state.careerMode !== 'PLAYER' || !state.playerCareer) return { ok: false, msg: 'Geçersiz mod.' };
  const p = state.players.find(x => x.id === state.userPlayerId);
  const oldTeam = state.teams.find(t => t.id === state.userTeamId);
  const newTeam = state.teams.find(t => t.id === targetTeamId);
  if (!p || !newTeam) return { ok: false, msg: 'Kulüp bulunamadı.' };

  if (oldTeam) {
    if (!Array.isArray(p.careerHistory)) p.careerHistory = [];
    p.careerHistory.unshift({
      season: state.season,
      teamTag: oldTeam.tag,
      teamName: oldTeam.name,
      region: oldTeam.region,
      games: p.stats?.games || 0,
      wins: p.stats?.wins || 0,
      ovr: p.ovr,
    });
  }

  // Demote existing starter in same role on newTeam
  for (const op of state.players) {
    if (op.teamId === newTeam.id && op.role === p.role && op.isStarter) op.isStarter = false;
  }

  const offer = (state.playerCareer.transferOffers || []).find(o => o.teamId === targetTeamId);
  p.teamId = newTeam.id;
  p.isStarter = true;
  p.salary = offer?.salary || Math.round(p.salary * 1.4);
  p.lang = REGION_LANG[newTeam.region] || p.lang;
  p.teamGames = 0;
  state.userTeamId = newTeam.id;
  state.managerName = `${newTeam.tag} Baş Koçu`;
  state.playerCareer.coachTrust = 55;
  state.playerCareer.transferOffers = [];

  addInboxMessage(state, {
    title: `Büyük Transfer: ${p.name} → ${newTeam.name}!`,
    sender: `${newTeam.tag} Yönetimi`,
    category: 'TRANSFER',
    priority: 'HIGH',
    body: `${newTeam.name} (${newTeam.region}) ile yeni sözleşme imzaladın! Haftalık maaşın ${formatMoney(p.salary)}. Yeni takımında kendini kanıtlama zamanı.`,
  });

  return { ok: true, msg: `${newTeam.name} kulübüne transfer oldun!` };
}

export function getCurrentPatch(state) {
  const yrNum = state.season || 2027;
  const yr = yrNum >= 2100 ? String(yrNum) : String(yrNum).slice(-2);
  const sub = (state.patchIndex % PATCHES.length) + 1;
  // Procedurally shift meta slightly on future seasons (2028..2100+) so every year feels fresh!
  const offset = Math.max(0, yrNum - 2027) % PATCHES.length;
  const shifted = PATCHES[(state.patchIndex + offset) % PATCHES.length];
  return {
    ...shifted,
    version: `${yr}.${sub}`,
  };
}

export function getUserNextMatch(state) {
  const uid = state.userTeamId;
  const userTeam = state.teams.find(t => t.id === uid);

  if (state.careerMode === 'PLAYER' && state.playerCareer?.inAcademy) {
    return null;
  }

  if (state.phase === 'SPRING_SPLIT' || state.phase === 'SUMMER_SPLIT') {
    const regMatches = state.schedules[userTeam.region]?.[state.week - 1] || [];
    return regMatches.find(m => !m.played && (m.blueId === uid || m.redId === uid)) || null;
  }

  if (state.phase === 'WORLDS_SWISS' && state.swiss) {
    return state.swiss.currentMatches.find(m => !m.played && (m.blueId === uid || m.redId === uid)) || null;
  }

  if (state.bracket) {
    const round = state.bracket.rounds[state.bracket.currentRound];
    if (!round) return null;
    return round.matches.find(m => !m.played && (m.blueId === uid || m.redId === uid)) || null;
  }

  return null;
}

export function recordSeriesResult(state, match, blueScore, redScore) {
  match.blueScore = blueScore;
  match.redScore = redScore;
  match.played = true;
  match.winnerId = blueScore > redScore ? match.blueId : match.redId;

  // Career records, manager reputation & streak tracking for user team
  const isUserMatch = match.blueId === state.userTeamId || match.redId === state.userTeamId;
  const userWonSeries = isUserMatch && match.winnerId === state.userTeamId;
  if (isUserMatch) {
    ensureCalendarState(state);
    const isHighStage = state.phase === 'MSI' || state.phase.startsWith('WORLDS') || state.phase.includes('PLAYOFFS');
    if (userWonSeries) {
      state.records.careerWins++;
      state.records.currentStreak++;
      if (state.records.currentStreak > state.records.bestStreak) state.records.bestStreak = state.records.currentStreak;
      bumpManagerRep(state, isHighStage ? 1.2 : 0.6, 'tacticalRep', isHighStage ? 1.5 : 0.7);
      if (state.careerMode === 'PLAYER' && state.playerCareer) {
        state.playerCareer.skillPoints = (state.playerCareer.skillPoints || 0) + 1;
        state.playerCareer.coachTrust = Math.min(100, (state.playerCareer.coachTrust || 55) + 3);
        state.playerCareer.fame = Math.min(100, (state.playerCareer.fame || 15) + 2);
        state.playerCareer.soloqLP = (state.playerCareer.soloqLP || 600) + 15;
      }
    } else {
      state.records.careerLosses++;
      state.records.currentStreak = 0;
      bumpManagerRep(state, -0.4, 'tacticalRep', -0.4);
      if (state.careerMode === 'PLAYER' && state.playerCareer) {
        state.playerCareer.coachTrust = Math.max(15, (state.playerCareer.coachTrust || 55) - 2);
      }
    }
  }

  // Match win prize bonus (helps clubs earn money throughout the season!)
  const winnerClub = state.teams.find(t => t.id === match.winnerId);
  const isIntl = state.phase === 'MSI' || state.phase.startsWith('WORLDS');
  const isPo = state.phase.includes('PLAYOFFS');
  const isRiv = !!getRivalryName(match.blueId, match.redId);
  const winCash = isIntl ? 110000 : isPo ? 75000 : isRiv ? 55000 : 35000;
  if (winnerClub) {
    winnerClub.budget += winCash;
  }

  // Derby fanbase bonus
  if (getRivalryName(match.blueId, match.redId)) {
    const winTeam = state.teams.find(t => t.id === match.winnerId);
    if (winTeam) winTeam.fanbase = Math.min(100, winTeam.fanbase + 1);
  }

  if (state.phase === 'SPRING_SPLIT' || state.phase === 'SUMMER_SPLIT') {
    const blueTeam = state.teams.find(t => t.id === match.blueId);
    const table = state.standings[blueTeam.region];
    const bRow = table.find(r => r.teamId === match.blueId);
    const rRow = table.find(r => r.teamId === match.redId);
    if (bRow && rRow) {
      bRow.gameWins += blueScore;
      bRow.gameLosses += redScore;
      rRow.gameWins += redScore;
      rRow.gameLosses += blueScore;
      if (match.winnerId === match.blueId) { bRow.wins++; rRow.losses++; }
      else { rRow.wins++; bRow.losses++; }
    }
  } else if (state.phase === 'WORLDS_SWISS' && state.swiss) {
    const bRow = state.swiss.teams.find(t => t.teamId === match.blueId);
    const rRow = state.swiss.teams.find(t => t.teamId === match.redId);
    if (bRow && rRow) {
      if (match.winnerId === match.blueId) { bRow.wins++; rRow.losses++; }
      else { rRow.wins++; bRow.losses++; }
      if (bRow.wins >= 3) bRow.status = 'QUALIFIED';
      if (bRow.losses >= 3) bRow.status = 'ELIMINATED';
      if (rRow.wins >= 3) rRow.status = 'QUALIFIED';
      if (rRow.losses >= 3) rRow.status = 'ELIMINATED';
    }
  }

  // Refresh market valuations for players who competed in this series (form & KDA/MVP impact)
  for (const p of state.players) {
    if (p.teamId === match.blueId || p.teamId === match.redId) {
      recalculatePlayerMarketValue(state, p, true);
    }
  }

  // Generate Post-Match X / Reddit Fan & Analyst Reactions for user matches
  if (match.blueId === state.userTeamId || match.redId === state.userTeamId) {
    const bTeam = state.teams.find(t => t.id === match.blueId);
    const rTeam = state.teams.find(t => t.id === match.redId);
    const userWon = match.winnerId === state.userTeamId;
    const winTeam = userWon ? (match.blueId === state.userTeamId ? bTeam : rTeam) : (match.blueId === state.userTeamId ? rTeam : bTeam);
    const loseTeam = match.winnerId === match.blueId ? rTeam : bTeam;
    const riv = getRivalryName(match.blueId, match.redId);
    if (bTeam && rTeam && winTeam && loseTeam) {
      addSocialPost(state, {
        platform: 'REDDIT',
        handle: 'r/leagueoflegends',
        author: 'Post-Match Thread',
        badge: riv ? 'DERBİ' : 'MAÇ SONU',
        body: `[Post-Match] ${bTeam.tag} ${blueScore} - ${redScore} ${rTeam.tag}: ${
          userWon
            ? `${winTeam.name} taraftarları ayakta! "${winTeam.tag} makrosu ve draft disiplini bugün ${loseTeam.tag}'a nefes aldırmadı."`
            : `${loseTeam.name} taraftarları sosyal medyada tepkili: "Draft ve objektif kontrolünde ciddi değişiklik gerekiyor."`
        }`,
        likes: Math.round(900 + Math.random() * 4800),
        replies: Math.round(140 + Math.random() * 820),
      });

      // Post-Match Analyst Breakdown Inbox Mail
      const userRoster = getTeamRoster(state, state.userTeamId);
      const topFormP = [...userRoster].sort((a, b) => (b.form || 75) - (a.form || 75))[0];
      const boardConf = getBoardConfidence(state);
      addInboxMessage(state, {
        title: `Maç Raporu: ${bTeam.tag} ${blueScore} - ${redScore} ${rTeam.tag}`,
        sender: 'Analist Ekibi',
        category: 'TOURNAMENT',
        priority: 'NORMAL',
        body: `${bTeam.name} ${blueScore} - ${redScore} ${rTeam.name} serisi tamamlandı (${userWon ? `GALİBİYET · +${formatMoney(winCash)} maç primi` : 'MAĞLUBİYET'}). Güncel seri: ${state.records.currentStreak} galibiyet. Öne çıkan oyuncu: ${topFormP ? `${topFormP.name} (Form ${topFormP.form})` : '-'}. Yönetim Güveni: %${boardConf.score}.`,
        actions: [{ id: 'nav_tactics', label: 'Taktik Tahtasına Git', type: 'NAV', payload: { tab: 'tactics' } }],
      });

      // Career & Streak Milestones
      if (userWon && (state.records.currentStreak === 5 || state.records.currentStreak === 10)) {
        bumpManagerRep(state, 1, 'tacticalRep', 1);
        addInboxMessage(state, {
          title: `Kilometre Taşı: ${state.records.currentStreak} Maçlık Galibiyet Serisi!`,
          sender: 'Yönetim Kurulu',
          category: 'BOARD',
          priority: 'HIGH',
          body: `Tebrikler Koç! Üst üste ${state.records.currentStreak} resmi seri kazanarak ligde büyük saygı topladın (Koç İtibarı +1).`,
        });
      }
      const cw = state.records.careerWins;
      if (userWon && (cw === 10 || cw === 25 || cw === 50 || cw === 100)) {
        bumpManagerRep(state, 1, 'tacticalRep', 1);
        addInboxMessage(state, {
          title: `Kariyer Başarısı: ${cw}. Resmi Galibiyet!`,
          sender: 'Yönetim Kurulu',
          category: 'BOARD',
          priority: 'HIGH',
          body: `Başantrenörlük kariyerinde ${cw}. galibiyete ulaştın! Yönetim kurulu istikrarlı vizyonunu takdir ediyor (Koç İtibarı +1).`,
        });
      }
    }
  }
}

export function quickSimSeries(state, match) {
  const blueTeam = state.teams.find(t => t.id === match.blueId);
  const redTeam = state.teams.find(t => t.id === match.redId);
  const blueRoster = getTeamRoster(state, match.blueId);
  const redRoster = getTeamRoster(state, match.redId);
  const patch = getCurrentPatch(state);
  const needed = Math.ceil(match.bestOf / 2);
  const highStakes = state.phase !== 'SPRING_SPLIT' && state.phase !== 'SUMMER_SPLIT' || !!getRivalryName(match.blueId, match.redId);
  const fearlessLocked = new Set();

  let bScore = 0, rScore = 0;
  while (bScore < needed && rScore < needed) {
    const { match: m, draft } = quickSimulateGame(blueTeam, redTeam, blueRoster, redRoster, patch, state.fearlessEnabled ? fearlessLocked : new Set(), highStakes);
    applyMatchOutcomeToPlayers(m);
    if (state.fearlessEnabled) {
      Object.values(draft.bluePicks).forEach(id => fearlessLocked.add(id));
      Object.values(draft.redPicks).forEach(id => fearlessLocked.add(id));
    }
    if (m.winner === 'blue') bScore++;
    else rScore++;
  }
  recordSeriesResult(state, match, bScore, rScore);
}

// ==================== LIVING WORLD NEWS & MATCH PREVIEWS ====================
function maybeGenerateLivingWorldNews(state, dow) {
  ensureCalendarState(state);
  const team = state.teams.find(t => t.id === state.userTeamId);
  if (!team) return;
  const roster = getTeamRoster(state, team.id);
  const recent = state.recentNewsIds;
  const pickFresh = (id, fn) => {
    if (recent.includes(id)) return false;
    fn();
    recent.push(id);
    if (recent.length > 6) recent.shift();
    return true;
  };

  // Friday (5): Pre-Match Preview & Key Lane Duel Hype (65% chance when a match is scheduled)
  if (dow === 5 && Math.random() < 0.65) {
    const nextM = getUserNextMatch(state);
    if (nextM) {
      const oppId = nextM.blueId === team.id ? nextM.redId : nextM.blueId;
      const opp = state.teams.find(t => t.id === oppId);
      const oppRoster = getTeamRoster(state, oppId);
      const myStar = [...roster].sort((a, b) => b.ovr - a.ovr)[0];
      const oppSame = oppRoster.find(p => p.role === myStar?.role) || oppRoster[0];
      const riv = getRivalryName(nextM.blueId, nextM.redId);
      addInboxMessage(state, {
        title: riv ? `DERBİ ÖN İZLEME: ${riv} (${team.tag} vs ${opp.tag})` : `Maç Önü Analizi: ${team.tag} vs ${opp.tag}`,
        sender: 'Esports Yayın Masası',
        category: 'NEWS',
        body: `Yarınki BO${nextM.bestOf} mücadelesi öncesi güç dengesi: ${team.tag} (OVR ${getTeamOVR(state, team.id)}) vs ${opp.tag} (OVR ${getTeamOVR(state, oppId)}). Günün kilit koridor düellosu ${myStar?.role} koridorunda ${myStar?.name} (${myStar?.ovr}) ile ${oppSame?.name} (${oppSame?.ovr}) arasında olacak!`,
      });
      return;
    }
  }

  // Tuesday / Wednesday: Varied World & Club Stories + Interactive Decisions (58% chance so inbox feels alive)
  if (Math.random() > 0.58) return;
  const stories = [
    {
      id: 'sponsor_shoot',
      run: () => {
        addInboxMessage(state, {
          title: 'Sponsor Çekimi & Medya Günü Teklifi (+$95K)',
          sender: 'Ticari Direktör',
          category: 'BOARD',
          priority: 'HIGH',
          body: `Ana sponsorumuz hafta içi yarım günlük stüdyo reklam çekimi talep ediyor. Katılım halinde kulüp kasasına +$95.000 gelir ve +2 Taraftar kazanılır; ancak ilk 5 oyuncularının yorgunluğu +6 artar.`,
          actions: [
            { id: 'sp_acc', label: 'Çekimi Onayla (+$95K)', type: 'ACCEPT_SPONSOR_SHOOT', style: 'primary' },
            { id: 'sp_dec', label: 'Antrenmana Odaklan (-4 Yorgunluk)', type: 'DECLINE_SPONSOR_SHOOT', style: 'secondary' },
          ],
        });
      },
    },
    {
      id: 'content_deal',
      run: () => {
        const star = roster[Math.floor(Math.random() * roster.length)];
        if (!star) return;
        addInboxMessage(state, {
          title: `Yayın & Belgesel Anlaşması: ${star.name}`,
          sender: 'Medya İlişkileri',
          category: 'NEWS',
          priority: 'HIGH',
          body: `Bir yayın platformu ${star.name} için özel "Oyuncu Gözünden" mini belgesel bölümü istiyor. Kabul ederseniz +$60.000 gelir ve ${star.name} için +4 Moral (+4 Yorgunluk); reddederseniz oyuncu hafif hayal kırıklığı yaşayabilir.`,
          actions: [
            { id: 'cd_acc', label: 'Anlaşmayı İmzala (+$60K)', type: 'ACCEPT_CONTENT_DEAL', payload: { playerId: star.id }, style: 'primary' },
            { id: 'cd_dec', label: 'İptal Et', type: 'DECLINE_CONTENT_DEAL', payload: { playerId: star.id }, style: 'secondary' },
          ],
        });
      },
    },
    {
      id: 'agent_tip',
      run: () => {
        const targets = state.players
          .filter(p => p.teamId !== team.id && p.ovr >= 80 && (!p.teamId || p.contractYears <= 1 || p.morale < 75))
          .sort((a, b) => b.ovr - a.ovr);
        const pickP = targets[Math.floor(Math.random() * Math.min(8, targets.length))];
        if (!pickP) return;
        const currClub = pickP.teamId ? state.teams.find(t => t.id === pickP.teamId) : null;
        addInboxMessage(state, {
          title: `Menajer İstihbaratı: ${pickP.name} (${pickP.role} · OVR ${pickP.ovr})`,
          sender: 'Baş Scout & Menajer Ağı',
          category: 'TRANSFER',
          priority: 'HIGH',
          body: `${currClub ? `${currClub.name} forması giyen` : 'Serbest piyasadaki'} ${pickP.name} (${pickP.age} yaş, ${pickP.role}, OVR ${pickP.ovr}) için uygun transfer koşulları oluştu (${currClub ? `Sözleşme: ${pickP.contractYears} yıl` : 'Bonservissiz'}). Kadro planlaması için profili inceleyebilirsin.`,
          actions: [
            { id: 'ag_open', label: `${pickP.name} Profilini Gör`, type: 'OPEN_PLAYER', payload: { playerId: pickP.id }, style: 'primary' },
            { id: 'ag_nav', label: 'Transfer Merkezine Git', type: 'NAV', payload: { tab: 'transfers' }, style: 'secondary' },
          ],
        });
      },
    },
    {
      id: 'power_rank',
      run: () => {
        const top5 = [...state.teams].sort((a, b) => getTeamOVR(state, b.id) - getTeamOVR(state, a.id)).slice(0, 5);
        const myRank = [...state.teams].sort((a, b) => getTeamOVR(state, b.id) - getTeamOVR(state, a.id)).findIndex(t => t.id === team.id) + 1;
        addInboxMessage(state, {
          title: `Küresel Güç Sıralaması Güncellendi (${team.tag}: #${myRank})`,
          sender: 'Global Power Rankings',
          category: 'NEWS',
          body: `Dünyanın en güçlü 5 takımı: ${top5.map((t, i) => `${i + 1}. ${t.tag} [${t.region}] (${getTeamOVR(state, t.id)})`).join(' • ')}. ${team.name} şu an küresel listede #${myRank} sırada.`,
        });
      },
    },
    {
      id: 'soloq_radar',
      run: () => {
        const hot = [...(state.challengerPool || [])].sort((a, b) => b.lp - a.lp)[0];
        if (!hot) return;
        addInboxMessage(state, {
          title: `SoloQ Radarı: ${hot.name} ${hot.server} Sunucusunda Zirvede!`,
          sender: 'Baş Gözlemci Raporu',
          category: 'NEWS',
          body: `${hot.age} yaşındaki ${hot.role} yeteneği ${hot.name}, ${hot.server} Challenger'da ${hot.lp} LP'ye ulaştı (Tahmini OVR ${hot.ovr}). Transfer → Challenger Scouting sekmesinden rapor isteyebilirsin.`,
        });
      },
    },
    {
      id: 'form_pulse',
      run: () => {
        const hotP = [...roster].sort((a, b) => b.form - a.form)[0];
        const duo = getTeamDuoSynergy(team, roster);
        addInboxMessage(state, {
          title: `Antrenman Kampı Raporu: ${hotP?.name} Formda!`,
          sender: 'Performans Koçu',
          category: 'NEWS',
          body: `Bu hafta scrimlerde ${hotP?.name} (Form ${hotP?.form}, Moral ${hotP?.morale}) takımın en keskin ismi oldu. İkili uyum durumu — JGL+MID: ${duo.jglMid.label} (${duo.jglMid.score}/30), BOT+SUP: ${duo.botSup.label} (${duo.botSup.score}/30).`,
        });
      },
    },
    {
      id: 'regional_buzz',
      run: () => {
        const otherRegs = REGIONS.filter(r => r.id !== team.region);
        const reg = otherRegs[Math.floor(Math.random() * otherRegs.length)];
        const st = getSortedStandings(state, reg.id);
        const leader = state.teams.find(t => t.id === st[0]?.teamId);
        const bottom = state.teams.find(t => t.id === st[st.length - 1]?.teamId);
        if (!leader || !bottom) return;
        addInboxMessage(state, {
          title: `${reg.name} Gündemi: ${leader.tag} Zirvede, ${bottom.tag} Krizde`,
          sender: 'Esports Insider',
          category: 'NEWS',
          body: `${reg.name} liginde ${leader.name} (${st[0].wins}G-${st[0].losses}M) şampiyonluk yürüyüşünü sürdürürken, ${bottom.name} (${st[st.length - 1].wins}G-${st[st.length - 1].losses}M) taraftar baskısı altında.`,
        });
      },
    },
    {
      id: 'patch_rumor',
      run: () => {
        const p = getCurrentPatch(state);
        addInboxMessage(state, {
          title: `Analist Masası: Yama ${p.version} (${p.name}) Meta Değerlendirmesi`,
          sender: 'Baş Draft Analisti',
          category: 'PATCH',
          body: `Mevcut Yama ${p.version} verilerine göre ${p.buffedClasses.join(', ')} sınıfları yüksek kazanma oranına sahip. Draft ekranında bu sınıflara öncelik vermek büyük avantaj sağlıyor.`,
        });
      },
    },
  ].sort(() => Math.random() - 0.5);

  for (const s of stories) {
    if (pickFresh(s.id, s.run)) break;
  }
}

// ==================== DRAMA & PRESS CONFERENCE EVENTS (16 UNIQUE FM EVENTS) ====================
function maybeTriggerDramaEvent(state) {
  ensureCalendarState(state);
  if (state.pendingEvent || Math.random() > 0.48) return;
  const mgr = state.managerName || 'Koç';
  const team = state.teams.find(t => t.id === state.userTeamId);
  const roster = getTeamRoster(state, team.id);
  const p1 = roster[Math.floor(Math.random() * roster.length)];
  const p2 = roster.find(p => p.id !== p1.id) || p1;
  const star = [...roster].sort((a, b) => b.ovr - a.ovr)[0] || p1;
  const youngest = [...roster].sort((a, b) => a.age - b.age)[0] || p1;

  const templates = [
    {
      id: 'late_stream',
      title: 'Gece Yarısı Yayın Krizi',
      desc: `${mgr}, ${p1.name} önemli maç haftasında sabah 4'e kadar SoloQ yayını yaptığı için antrenmana uykusuz geldi. Nasıl tepki vereceksin?`,
      choices: [
        { label: 'Para Cezası & Disiplin (Form +2, Moral -8, Bütçe +$15K)', effect: () => { p1.form = Math.min(99, p1.form + 2); p1.morale = Math.max(30, p1.morale - 8); team.budget += 15000; } },
        { label: 'Birebir Uyarı Konuşması (Yorgunluk -5, Moral -2)', effect: () => { p1.fatigue = Math.max(0, p1.fatigue - 5); p1.morale = Math.max(30, p1.morale - 2); } },
        { label: 'Görmezden Gel (Taraftar +2, Yorgunluk +8)', effect: () => { team.fanbase = Math.min(100, team.fanbase + 2); p1.fatigue = Math.min(100, p1.fatigue + 8); } },
      ],
    },
    {
      id: 'scrim_clash',
      title: 'Scrim Sonrası Tartışma',
      desc: `${mgr}, scrim değerlendirmesinde ${p1.name} ve ${p2.name} harita çağrısı yüzünden sertçe tartıştı. Takım atmosferi gergin!`,
      choices: [
        { label: 'Takım Yemeği Düzenle (-$20K, Sinerji +5, Moral +6)', effect: () => { team.budget -= 20000; team.synergy = Math.min(100, team.synergy + 5); roster.forEach(p => { p.morale = Math.min(100, p.morale + 6); }); } },
        { label: `${p1.name}'ı Haklı Bul (${p1.name} Moral +6, ${p2.name} Moral -7)`, effect: () => { p1.morale = Math.min(100, p1.morale + 6); p2.morale = Math.max(30, p2.morale - 7); } },
        { label: 'Profesyonel Kalın Deyip Kapat (Sinerji -2)', effect: () => { team.synergy = Math.max(40, team.synergy - 2); } },
      ],
    },
    {
      id: 'press_trash',
      title: 'Basın Toplantısı & Trash Talk',
      desc: `Rakip koç, röportajda ${team.name} için "Sadece şansla kazanıyorlar" dedi. ${mgr}, basın toplantısında mikrofon sende!`,
      choices: [
        { label: 'Sert Trash Talk Yap (Taraftar +3, Takım Moral +5)', effect: () => { team.fanbase = Math.min(100, team.fanbase + 3); roster.forEach(p => { p.morale = Math.min(100, p.morale + 5); }); } },
        { label: 'Vadi\'de Cevap Vereceğiz (Sinerji +3, Form +2)', effect: () => { team.synergy = Math.min(100, team.synergy + 3); roster.forEach(p => { p.form = Math.min(99, p.form + 2); }); } },
      ],
    },
    {
      id: 'sponsor_shoot',
      title: 'Sponsor Reklam Çekimi',
      desc: `${mgr}, ana sponsorunuz hafta ortasında tam günlük reklam çekimi talep ediyor. Kabul ederseniz nakit prim var ama antrenman aksayacak.`,
      choices: [
        { label: 'Çekimi Kabul Et (Bütçe +$85K, Yorgunluk +9)', effect: () => { team.budget += 85000; roster.forEach(p => { p.fatigue = Math.min(100, p.fatigue + 9); }); } },
        { label: 'Reddet & Antrenmana Odaklan (Form +3, Sinerji +2)', effect: () => { team.synergy = Math.min(100, team.synergy + 2); roster.forEach(p => { p.form = Math.min(99, p.form + 3); }); } },
      ],
    },
    {
      id: 'star_raise',
      title: `Yıldız Oyuncu Prim Talebi (${star.name})`,
      desc: `${mgr}, ${star.name}'ın menajeri kapını çaldı: "Oyuncum takımın lokomotifi, sezon içi başarı primi veya maaş iyileştirmesi bekliyoruz."`,
      choices: [
        { label: 'Anında Prim Öde (-$45K, Moral +12, Form +3)', effect: () => { team.budget -= 45000; star.morale = Math.min(100, star.morale + 12); star.form = Math.min(99, star.form + 3); } },
        { label: 'Sezon Sonu Kupa Sözü Ver (Moral +4)', effect: () => { star.morale = Math.min(100, star.morale + 4); } },
        { label: 'Kontratına Sadık Kal De (Moral -9, Disiplin +2 Sinerji)', effect: () => { star.morale = Math.max(30, star.morale - 9); team.synergy = Math.min(100, team.synergy + 2); } },
      ],
    },
    {
      id: 'kr_bootcamp',
      title: 'Kısa Süreli Yoğun Bootcamp Fırsatı',
      desc: `${mgr}, rakip liglerden birkaç üst düzey takım hafta içi yoğun 3 günlük kapalı scrim bloğu (mini-bootcamp) önerdi. Katılalım mı?`,
      choices: [
        { label: 'Katıl (-$55K, Tüm Takım Form +4, Sinerji +4, Yorgunluk +11)', effect: () => { team.budget -= 55000; team.synergy = Math.min(100, team.synergy + 4); roster.forEach(p => { p.form = Math.min(99, p.form + 4); p.fatigue = Math.min(100, p.fatigue + 11); }); } },
        { label: 'Sadece VOD Analizi Yap (Sinerji +2, Yorgunluk +2)', effect: () => { team.synergy = Math.min(100, team.synergy + 2); roster.forEach(p => { p.fatigue = Math.min(100, p.fatigue + 2); }); } },
        { label: 'Reddet & Oyuncuları Dinlendir (Yorgunluk -8)', effect: () => { roster.forEach(p => { p.fatigue = Math.max(0, p.fatigue - 8); }); } },
      ],
    },
    {
      id: 'pocket_pick',
      title: `SoloQ'da Gizli Meta Keşfi (${p1.name})`,
      desc: `${p1.name}, Challenger'da rakiplerin hiç beklemediği gizli bir pocket-pick bulduğunu ve bu hafta buna çalışmak istediğini söyledi.`,
      choices: [
        { label: 'Özgürlük Tanı (Havuz +2, Form +3, Sinerji -1)', effect: () => { p1.attrs.pool = Math.min(99, p1.attrs.pool + 2); p1.ovr = calcOVR(p1.attrs); p1.form = Math.min(99, p1.form + 3); team.synergy = Math.max(40, team.synergy - 1); } },
        { label: 'Standart Meta Planına Sadık Kal (Sinerji +3, Moral -3)', effect: () => { team.synergy = Math.min(100, team.synergy + 3); p1.morale = Math.max(30, p1.morale - 3); } },
      ],
    },
    {
      id: 'fan_meet',
      title: 'Taraftar Buluşması & İmza Günü',
      desc: `Pazarlama ekibi bu hafta sonu öncesi büyük bir taraftar imza günü ve forma satışı etkinliği düzenlemek istiyor.`,
      choices: [
        { label: 'Tüm Kadroyla Katıl (Bütçe +$50K, Taraftar +4, Yorgunluk +6)', effect: () => { team.budget += 50000; team.fanbase = Math.min(100, team.fanbase + 4); roster.forEach(p => { p.fatigue = Math.min(100, p.fatigue + 6); }); } },
        { label: 'Online Soru-Cevap Yap (Taraftar +2, Moral +3)', effect: () => { team.fanbase = Math.min(100, team.fanbase + 2); roster.forEach(p => { p.morale = Math.min(100, p.morale + 3); }); } },
        { label: 'İptal Et, Maça Odaklan (Form +2)', effect: () => { roster.forEach(p => { p.form = Math.min(99, p.form + 2); }); } },
      ],
    },
    {
      id: 'legend_consultant',
      title: 'Eski Efsane Koçtan Danışmanlık',
      desc: `Emekli bir Worlds şampiyonu analist, 1 haftalığına makro oyunlarınızı inceleyip özel brifing vermek istiyor.`,
      choices: [
        { label: 'Danışmanlığı Al (-$35K, Sinerji +4, Tüm Kadro Makro +1)', effect: () => { team.budget -= 35000; team.synergy = Math.min(100, team.synergy + 4); roster.forEach(p => { p.attrs.macro = Math.min(99, p.attrs.macro + 1); p.ovr = calcOVR(p.attrs); }); } },
        { label: 'Kendi Ekibime Güveniyorum (Bütçe Korundu, Moral +2)', effect: () => { roster.forEach(p => { p.morale = Math.min(100, p.morale + 2); }); } },
      ],
    },
    {
      id: 'social_backlash',
      title: `Sosyal Medya Eleştiri Dalgası (${p1.name})`,
      desc: `${p1.name}'ın son maçtaki hatalı pozisyonu Reddit ve X'te viral oldu. Taraftarlar sosyal medyada sert tepki gösteriyor.`,
      choices: [
        { label: `Basında Oyuncuna Sahip Çık (${p1.name} Moral +10, Form +3, Taraftar -1)`, effect: () => { p1.morale = Math.min(100, p1.morale + 10); p1.form = Math.min(99, p1.form + 3); team.fanbase = Math.max(20, team.fanbase - 1); } },
        { label: 'Sosyal Medya Detoksu Uygula (Yorgunluk -6, Moral +4)', effect: () => { p1.fatigue = Math.max(0, p1.fatigue - 6); p1.morale = Math.min(100, p1.morale + 4); } },
        { label: 'Performans Uyarısı Ver (Form +4, Moral -7)', effect: () => { p1.form = Math.min(99, p1.form + 4); p1.morale = Math.max(30, p1.morale - 7); } },
      ],
    },
    {
      id: 'riot_doc',
      title: 'Riot Belgesel Çekimi: "Zirveye Yolculuk"',
      desc: `Riot prodüksiyon ekibi, ${team.name} kulüp içi hayatını anlatan özel bir mini belgesel çekmek için izin istiyor.`,
      choices: [
        { label: 'Kameralara İzin Ver (Prestij +1, Taraftar +4, Yorgunluk +5)', effect: () => { team.prestige = Math.min(99, team.prestige + 1); team.fanbase = Math.min(100, team.fanbase + 4); roster.forEach(p => { p.fatigue = Math.min(100, p.fatigue + 5); }); } },
        { label: 'Taktik Gizlilik İçin Reddet (Sinerji +3, Form +2)', effect: () => { team.synergy = Math.min(100, team.synergy + 3); roster.forEach(p => { p.form = Math.min(99, p.form + 2); }); } },
      ],
    },
    {
      id: 'gh_hardware',
      title: 'Gaming House Donanım & Fiber Yenilemesi',
      desc: `Antrenman odasındaki monitörlerde ve fiber hatta hafif gecikme (ping) dalgalanmaları yaşanıyor. Oyuncular şikayetçi.`,
      choices: [
        { label: 'Acil Donanım & Hat Yükselt (-$30K, Moral +5, Form +3)', effect: () => { team.budget -= 30000; roster.forEach(p => { p.morale = Math.min(100, p.morale + 5); p.form = Math.min(99, p.form + 3); }); } },
        { label: 'Geçici Çözümle İdare Et (Yorgunluk +5, Moral -4)', effect: () => { roster.forEach(p => { p.fatigue = Math.min(100, p.fatigue + 5); p.morale = Math.max(30, p.morale - 4); }); } },
      ],
    },
    {
      id: 'young_shine',
      title: `Genç Yıldız Antrenmanda Parladı (${youngest.name})`,
      desc: `${youngest.age} yaşındaki ${youngest.name}, bu haftaki scrimlerde inanılmaz mekanik oyunlar sergiledi. Nasıl yaklaşacaksın?`,
      choices: [
        { label: 'Takım Önünde Öv (Moral +9, Form +4)', effect: () => { youngest.morale = Math.min(100, youngest.morale + 9); youngest.form = Math.min(99, youngest.form + 4); } },
        { label: 'Ayakları Yere Bassın, Makro Çalıştır (Makro +1, Sinerji +2)', effect: () => { youngest.attrs.macro = Math.min(99, youngest.attrs.macro + 1); youngest.ovr = calcOVR(youngest.attrs); team.synergy = Math.min(100, team.synergy + 2); } },
      ],
    },
    {
      id: 'scrim_leak',
      title: 'Rakip Takım Scrim Sızıntısı İddiası',
      desc: `Analistlerin, geçen hafta scrim yaptığın bir rakibin draft notlarını dışarı sızdırdığından şüpheleniyor!`,
      choices: [
        { label: 'O Takımı Kara Listeye Al (Sinerji +4, Takım Hırsı: Form +2)', effect: () => { team.synergy = Math.min(100, team.synergy + 4); roster.forEach(p => { p.form = Math.min(99, p.form + 2); }); } },
        { label: 'Sahte Draft Deneyerek Tuzak Kur (Moral +4, Sinerji +2)', effect: () => { team.synergy = Math.min(100, team.synergy + 2); roster.forEach(p => { p.morale = Math.min(100, p.morale + 4); }); } },
      ],
    },
    {
      id: 'sleep_diet',
      title: 'Beslenme & Uyku Programı Revizyonu',
      desc: `Performans koçu, oyuncuların uyku düzeni ve beslenmesini optimize edecek profesyonel bir şef ve uyku programı öneriyor.`,
      choices: [
        { label: 'Programı Onayla (-$25K, Tüm Takım Yorgunluk -14, Form +2)', effect: () => { team.budget -= 25000; roster.forEach(p => { p.fatigue = Math.max(0, p.fatigue - 14); p.form = Math.min(99, p.form + 2); }); } },
        { label: 'Mevcut Düzenle Devam Et (Değişiklik Yok)', effect: () => {} },
      ],
    },
    {
      id: 'charity_show',
      title: 'Hayır Kurumu Gösteri Maçı Daveti',
      desc: `Hafta sonu öncesi genç oyuncular için bağış toplayan bir gösteri maçına davet edildiniz.`,
      choices: [
        { label: 'Takımca Katıl (Taraftar +4, Moral +5, Yorgunluk +5)', effect: () => { team.fanbase = Math.min(100, team.fanbase + 4); roster.forEach(p => { p.morale = Math.min(100, p.morale + 5); p.fatigue = Math.min(100, p.fatigue + 5); }); } },
        { label: 'Doğrudan Bağış Yap (-$25K, Taraftar +3, Prestij +1)', effect: () => { team.budget -= 25000; team.fanbase = Math.min(100, team.fanbase + 3); team.prestige = Math.min(99, team.prestige + 1); } },
      ],
    },
  ];

  // Pick a fresh event that hasn't appeared in the last 8 events!
  const freshPool = templates.filter(t => !state.recentEventIds.includes(t.id));
  const pool = freshPool.length ? freshPool : templates;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  state.recentEventIds.push(chosen.id);
  if (state.recentEventIds.length > 8) state.recentEventIds.shift();

  state.pendingEvent = {
    title: chosen.title,
    desc: chosen.desc,
    choices: chosen.choices.map((c, idx) => ({ idx, label: c.label })),
    _effects: chosen.choices.map(c => c.effect),
  };
}

export function resolveDramaEvent(state, choiceIdx) {
  if (!state.pendingEvent) return;
  const fn = state.pendingEvent._effects?.[choiceIdx];
  if (fn) fn();
  const title = state.pendingEvent.title;
  const chosenLbl = state.pendingEvent.choices[choiceIdx]?.label || '';
  state.pendingEvent = null;
  addInboxMessage(state, {
    title: `Karar Verildi: ${title}`,
    sender: 'Kulüp Yönetimi',
    category: 'NEWS',
    body: `Seçimin: "${chosenLbl}" uygulandı.`,
  });
}

// ==================== AI INCOMING TRANSFER BIDS ====================
function maybeGenerateIncomingOffer(state, chance = 0.34) {
  if (!isTransferWindowOpen(state)) return;
  const userTeam = state.teams.find(t => t.id === state.userTeamId);
  const effectiveChance = Math.min(0.92, chance + ((userTeam?.prestige || 75) >= 84 ? 0.18 : 0));
  const maxOffers = state.phase === 'OFFSEASON' ? 4 : 3;
  if (state.incomingOffers.length >= maxOffers || Math.random() > effectiveChance) return;
  const existingIds = new Set(state.incomingOffers.map(o => o.playerId));
  const userPlayers = state.players.filter(p => p.teamId === state.userTeamId && !existingIds.has(p.id));
  if (userPlayers.length === 0) return;
  const target = userPlayers[Math.floor(Math.random() * userPlayers.length)];

  const buyers = state.teams.filter(t => {
    if (t.id === state.userTeamId) return false;
    if (t.budget < target.marketValue * 0.9) return false;

    // Buyer must actually need/want this player (upgrade over their starter or elite wonderkid!)
    const buyerStarter = getTeamRoster(state, t.id).find(p => p.role === target.role);
    const starterOvr = buyerStarter ? buyerStarter.ovr : 70;
    const isUpgrade = target.ovr >= starterOvr - 1;
    const isWonderkidTarget = target.age <= 20 && target.pot >= starterOvr + 5;
    if (!isUpgrade && !isWonderkidTarget) return false;

    // Regional & prestige realism: LCK/LPL giants don't bid on low-OVR minor-region players
    const sameRegion = t.region === userTeam.region;
    const prestigeDiff = t.prestige - userTeam.prestige;
    if (!sameRegion) {
      if ((t.region === 'LCK' || t.region === 'LPL') && target.ovr < 85 && !(target.age <= 20 && target.pot >= 91)) return false;
      if (prestigeDiff > 12 && target.ovr < 82) return false;
    }
    return true;
  });

  if (buyers.length === 0) return;
  // Prefer same-region clubs first (70% weight)
  const sameRegBuyers = buyers.filter(b => b.region === userTeam.region);
  const pool = (sameRegBuyers.length && Math.random() < 0.7) ? sameRegBuyers : buyers;
  const buyer = pool[Math.floor(Math.random() * pool.length)];
  const offerAmount = Math.round((target.marketValue * (1.05 + Math.random() * 0.35)) / 5000) * 5000;

  state.incomingOffers.push({
    id: `off_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    buyerTeamId: buyer.id,
    buyerName: buyer.name,
    buyerTag: buyer.tag,
    playerId: target.id,
    playerName: target.name,
    playerRole: target.role,
    playerOvr: target.ovr,
    amount: offerAmount,
  });

  addInboxMessage(state, {
    title: `Transfer Teklifi: ${buyer.name} → ${target.name}`,
    sender: buyer.name,
    category: 'TRANSFER',
    body: `${buyer.name} kulübü, ${target.name} (${target.role}, OVR ${target.ovr}) için ${formatMoney(offerAmount)} bonservis teklif etti! Genel Bakış veya Transfer ekranından kabul/reddedebilirsin.`,
  });
}

export function respondIncomingOffer(state, offerId, accept) {
  const idx = state.incomingOffers.findIndex(o => o.id === offerId);
  if (idx === -1) return { ok: false, reason: 'Teklif bulunamadı.' };
  const off = state.incomingOffers[idx];
  state.incomingOffers.splice(idx, 1);

  if (!accept) return { ok: true, reason: `${off.buyerName} kulübünün ${off.playerName} teklifi reddedildi.` };

  const p = state.players.find(x => x.id === off.playerId);
  const userTeam = state.teams.find(t => t.id === state.userTeamId);
  const buyer = state.teams.find(t => t.id === off.buyerTeamId);
  if (!p || p.teamId !== userTeam.id) return { ok: false, reason: 'Oyuncu artık kadroda değil.' };

  const sameRoleCount = state.players.filter(x => x.teamId === userTeam.id && x.role === p.role).length;
  if (sameRoleCount <= 1) {
    state.incomingOffers.push(off);
    return { ok: false, reason: `${p.role} rolünde başka oyuncun yok! Önce yedek almadan satamazsın.` };
  }

  userTeam.budget += off.amount;
  buyer.budget = Math.max(200000, buyer.budget - off.amount);
  p.teamId = buyer.id;
  p.isStarter = true;
  p.contractYears = 2;

  const sub = state.players.find(x => x.teamId === userTeam.id && x.role === p.role);
  if (sub) sub.isStarter = true;

  addInboxMessage(state, {
    title: `Satış Tamamlandı: ${p.name} → ${buyer.name}`,
    sender: 'Sportif Direktör',
    category: 'TRANSFER',
    body: `${p.name}, ${formatMoney(off.amount)} bonservis karşılığında ${buyer.name} kulübüne satıldı!`,
  });
  return { ok: true, reason: `${p.name} ${formatMoney(off.amount)} karşılığında satıldı!` };
}

// ==================== WEEKLY TICK ====================
function runWeeklyClubTick(state) {
  ensureCalendarState(state);
  state.scrimDoneThisWeek = false;
  if (state.playerCareer) {
    state.playerCareer.weeklyActionDone = false;
    state.playerCareer.academyPlayedThisWeek = false;
  }
  if ((state.koreanBootcampWeeks || 0) > 0) state.koreanBootcampWeeks--;
  for (const team of state.teams) {
    ensureTeamExtras(team);
    const wages = getTeamWeeklyWages(state, team.id);
    const luxuryTax = getTeamLuxuryTax(state, team.id);
    const upkeep = getTeamFacilityUpkeep(team);
    const roster = state.players.filter(p => p.teamId === team.id);
    const streamerBonus = roster.filter(p => p.trait === 'Streamer').length * 18000;
    const fanIncome = team.fanbase * 950 + streamerBonus;
    const sponsorIncome = team.sponsor ? team.sponsor.weekly : 45000;
    const totalExpenses = wages + upkeep + luxuryTax;
    const netCash = fanIncome + sponsorIncome - totalExpenses;
    team.budget += netCash;
    if (team.id === state.userTeamId) {
      state.financeLog.unshift({
        label: `S${state.season} ${getPhaseLabel(state.phase).split(' ')[0]} H${state.week}`,
        income: fanIncome + sponsorIncome,
        expenses: totalExpenses,
        net: netCash,
        balance: team.budget,
      });
      if (state.financeLog.length > 16) state.financeLog.pop();
    }
    if (team.id !== state.userTeamId && team.budget < 250000) team.budget = 250000;

    const focus = team.trainingFocus || 'balanced';
    const intensity = team.trainingIntensity || 'normal';
    const perfLvl = team.staff?.perfCoach || 1;
    const intensityGrowth = intensity === 'intense' ? 1.45 : intensity === 'light' ? 0.6 : 1.0;
    const intensityFatigue = intensity === 'intense' ? 7 : intensity === 'light' ? -6 : 0;

    for (const p of roster) {
      const ageProf = getAgeFatigueProfile(p.age);

      // Sub-League Loan Progression (LCK CL / EMEA Masters / Academy): boosted youth growth & zero bench unhappiness!
      if (p.loanedTo) {
        p.loanedTo.gamesPlayed = (p.loanedTo.gamesPlayed || 0) + 2;
        p.fatigue = Math.max(10, Math.min(55, (p.fatigue || 20) + 2));
        p.morale = Math.min(98, (p.morale || 78) + 1);
        p.form = Math.min(95, Math.max(68, (p.form || 75) + (Math.random() < 0.6 ? 2 : -1)));
        const loanGrowthChance = (p.ovr < p.pot ? (p.age <= 21 ? 0.56 : p.age <= 24 ? 0.36 : 0.14) : 0.04) * (p.trait === 'Grinder' ? 1.3 : 1.0);
        if (Math.random() < loanGrowthChance) {
          const keys = Object.keys(p.attrs);
          const k = (p.indFocus && p.attrs[p.indFocus] !== undefined) ? p.indFocus : keys[Math.floor(Math.random() * keys.length)];
          p.attrs[k] = Math.min(99, p.attrs[k] + 1);
          p.ovr = calcOVR(p.attrs);
          p.loanedTo.growthGained = (p.loanedTo.growthGained || 0) + 1;
        }
        recalculatePlayerMarketValue(state, p, true);
        continue;
      }

      // Injury / Burnout recovery (age-linked recovery rate)
      if ((p.injuredWeeks || 0) > 0) {
        p.injuredWeeks = Math.max(0, p.injuredWeeks - 1);
        p.fatigue = Math.max(0, Math.round(p.fatigue - 16 * ageProf.recMult));
      }

      // Language adaptation decay
      if (p.importWeeksLeft > 0) {
        p.importWeeksLeft = Math.max(0, p.importWeeksLeft - (team.facilities.psychologist >= 2 ? 2 : 1));
      }

      // Bench unhappiness (FM role promise / high OVR sub dissatisfaction)
      if (!p.isStarter) {
        p.benchWeeks = (p.benchWeeks || 0) + 1;
        if (p.trait === 'Ego') p.morale = Math.max(25, p.morale - 6);
        else if ((p.rolePromise === 'STAR' || p.ovr >= 78) && p.benchWeeks >= 3) {
          p.morale = Math.max(25, p.morale - 5);
          if (team.id === state.userTeamId && p.benchWeeks === 3) {
            addInboxMessage(state, {
              title: `Kadro Memnuniyetsizliği: ${p.name}`,
              sender: p.name,
              category: 'NEWS',
              body: `Koç, ${p.benchWeeks} haftadır yedek bekliyorum. İlk 5'te süre alamayacaksam transfer listesine konulmak istiyorum.`,
            });
          }
        }
      } else {
        p.benchWeeks = 0;
      }

      const grinderMult = p.trait === 'Grinder' ? 1.4 : 1.0;
      const growthChance = (p.ovr < p.pot ? (p.age <= 21 ? 0.35 : p.age <= 24 ? 0.22 : 0.10) : 0.03) * grinderMult * intensityGrowth;
      const psychBonus = (team.facilities.psychologist - 1) * 1.5;

      if (focus === 'rest') {
        const restAmount = Math.round((22 + team.facilities.gamingHouse * 3 + (perfLvl - 1) * 3) * ageProf.recMult);
        p.fatigue = Math.max(0, p.fatigue - restAmount);
        p.morale = Math.min(100, p.morale + 6 + psychBonus);
      } else {
        const baseRecovery = (6 + team.facilities.gamingHouse * 2 + (perfLvl - 1) * 2) * ageProf.recMult;
        const focusLoad = (focus === 'mechanics' ? 8 : 4) * ageProf.gainMult;
        const intLoad = intensityFatigue >= 0 ? intensityFatigue * ageProf.gainMult : intensityFatigue * ageProf.recMult;
        const netFatigue = Math.round(focusLoad + intLoad - baseRecovery);
        p.fatigue = Math.max(0, Math.min(100, Math.round(p.fatigue + netFatigue)));

        // Individual Champion Learning Progress (User roster)
        if (p.learningChampId && !p.sigChamps.includes(p.learningChampId)) {
          const step = Math.round((24 + (focus === 'pool' ? 10 : 0)) * intensityGrowth);
          p.learningProgress = Math.min(100, (p.learningProgress || 0) + step);
          if (p.learningProgress >= 100) {
            p.sigChamps.push(p.learningChampId);
            const cName = CHAMPION_MAP[p.learningChampId]?.name || p.learningChampId;
            p.learningChampId = null;
            p.learningProgress = 0;
            p.attrs.pool = Math.min(99, p.attrs.pool + 1);
            p.ovr = calcOVR(p.attrs);
            if (team.id === state.userTeamId) {
              addInboxMessage(state, {
                title: `Yeni İmza Şampiyon Öğrenildi: ${p.name} (${cName})`,
                sender: 'Antrenör Ekibi',
                category: 'NEWS',
                body: `${p.name}, bireysel antrenman programını tamamladı ve ${cName} şampiyonunu artık profesyonel imza havuzuna ekledi!`,
              });
            }
          }
        }

        if (Math.random() < growthChance) {
          if (p.indFocus && p.attrs[p.indFocus] !== undefined) {
            p.attrs[p.indFocus] = Math.min(99, p.attrs[p.indFocus] + 1);
          } else if (focus === 'mechanics') { p.attrs.mechanics = Math.min(99, p.attrs.mechanics + 1); p.attrs.laning = Math.min(99, p.attrs.laning + 1); }
          else if (focus === 'macro') { p.attrs.macro = Math.min(99, p.attrs.macro + 1); p.attrs.teamfight = Math.min(99, p.attrs.teamfight + 1); team.synergy = Math.min(100, +(team.synergy + (team.synergy >= 82 ? 0.25 : 0.5)).toFixed(1)); }
          else if (focus === 'pool') { p.attrs.pool = Math.min(99, p.attrs.pool + 1); }
          else {
            const keys = Object.keys(p.attrs);
            const k = keys[Math.floor(Math.random() * keys.length)];
            p.attrs[k] = Math.min(99, p.attrs[k] + 1);
          }
          p.ovr = calcOVR(p.attrs);
        }
      }

      // Weekly multi-factor market value refresh (captures form, OVR & performance shifts)
      recalculatePlayerMarketValue(state, p, true);

      // Age-linked Burnout / Wrist Strain injury risk (veterans break down earlier than 18-20 rookies)
      if (p.fatigue >= ageProf.injuryThreshold && !(p.injuredWeeks > 0)) {
        const ageRiskSlope = p.age >= 28 ? 0.015 : 0.012;
        const injChance = Math.max(0.03, (p.fatigue - (ageProf.injuryThreshold - 4)) * ageRiskSlope - (perfLvl - 1) * 0.035);
        if (Math.random() < injChance) {
          p.injuredWeeks = Math.random() < (p.age >= 28 ? 0.45 : 0.65) ? 1 : 2;
          p.morale = Math.max(30, p.morale - 6);
          if (team.id === state.userTeamId) {
            addInboxMessage(state, {
              title: `SAĞLIK RAPORU: ${p.name} Bilek Zorlanması / Burnout`,
              sender: 'Performans & Sağlık Ekibi',
              category: 'BOARD',
              body: `${p.name} (${p.age} yaş · ${ageProf.label}) aşırı yorgunluk (%${Math.round(p.fatigue)} / eşik %${ageProf.injuryThreshold}) nedeniyle ${p.injuredWeeks} hafta süreyle bilek zorlanması yaşayacak. Antrenman yoğunluğunu azaltabilir veya dinlendirme verebilirsin.`,
            });
          }
        }
      }
    }
  }

  // Weekly Assistant Coach Executive Digest for User Team
  const userTeam = state.teams.find(t => t.id === state.userTeamId);
  if (userTeam) {
    const userStarters = getTeamRoster(state, userTeam.id);
    const allUserPlayers = state.players.filter(p => p.teamId === userTeam.id);
    const topForm = [...userStarters].sort((a, b) => (b.form || 75) - (a.form || 75))[0];
    const mostTired = [...userStarters].sort((a, b) => (b.fatigue || 0) - (a.fatigue || 0))[0];
    const loanedOut = allUserPlayers.filter(p => p.loanedTo);
    const expiringStarters = userStarters.filter(p => (p.contractYears ?? 2) <= 1);

    const lines = [
      topForm ? `• En Formda Oyuncu: ${topForm.name} (Form ${topForm.form}, OVR ${topForm.ovr})` : null,
      mostTired ? `• En Yorgun İlk 5: ${mostTired.name} (%${Math.round(mostTired.fatigue || 0)} yorgunluk)` : null,
      loanedOut.length > 0 ? `• Kiralık Takip (${loanedOut.length} oyuncu): ${loanedOut.map(p => `${p.name} (+${p.loanedTo.growthGained || 0} gelişim)`).join(', ')}` : null,
      expiringStarters.length > 0 ? `• Sözleşme Uyarısı (${expiringStarters.length} oyuncu ≤1 yıl): ${expiringStarters.map(p => p.name).join(', ')}` : null,
    ].filter(Boolean);

    const isFatigueUrgent = mostTired && (mostTired.fatigue || 0) >= 60;
    const digestPriority = isFatigueUrgent ? 'URGENT' : expiringStarters.length > 0 ? 'HIGH' : 'NORMAL';
    const digestActions = isFatigueUrgent
      ? [
          { id: 'wk_rest', label: `${mostTired.name} Dinlendir (-14 Yorgunluk)`, type: 'REST_PLAYER', payload: { playerId: mostTired.id }, style: 'primary' },
          { id: 'wk_light', label: 'Hafif Antrenmana Geç', type: 'SET_LIGHT_TRAINING', style: 'secondary' },
        ]
      : expiringStarters.length > 0
        ? [{ id: 'wk_squad', label: 'Sözleşmeler için Kadroya Git', type: 'NAV', payload: { tab: 'squad' }, style: 'primary' }]
        : null;

    addInboxMessage(state, {
      title: `Haftalık Rapor · H${state.week}${isFatigueUrgent ? ' (Yorgunluk Uyarısı)' : ''}`,
      sender: 'Yardımcı Antrenör',
      category: 'BOARD',
      priority: digestPriority,
      body: `Hafta ${state.week} kulüp değerlendirmesi:\n${lines.join('\n')}`,
      actions: digestActions,
    });
  }

  // Living Mid-Season AI Transfers while transfer window is open!
  if (isTransferWindowOpen(state) && (state.phase === 'SPRING_SPLIT' || state.phase === 'SUMMER_SPLIT')) {
    runLivingAITransfers(state, 2);
  }
}

// ==================== SEASON AWARDS ====================
function awardSplitHonors(state, splitName) {
  const userTeam = state.teams.find(t => t.id === state.userTeamId);
  const regTeams = new Set(state.teams.filter(t => t.region === userTeam.region).map(t => t.id));
  const regPlayers = state.players.filter(p => regTeams.has(p.teamId) && p.stats.games > 0);
  if (regPlayers.length === 0) return;

  const scoreP = (p) => p.stats.mvps * 12 + (p.stats.kills * 2 + p.stats.assists - p.stats.deaths * 1.5) / Math.max(1, p.stats.games) + p.ovr * 0.25;
  const mvp = [...regPlayers].sort((a, b) => scoreP(b) - scoreP(a))[0];
  const rookies = regPlayers.filter(p => p.age <= 20);
  const rookie = rookies.length ? [...rookies].sort((a, b) => scoreP(b) - scoreP(a))[0] : null;
  const allPro = ROLES.map(role => {
    const cands = regPlayers.filter(p => p.role === role).sort((a, b) => scoreP(b) - scoreP(a));
    return cands[0] ? `${role}: ${cands[0].name}` : '';
  }).filter(Boolean);

  state.awards.unshift({
    season: state.season,
    split: `${userTeam.region} ${splitName}`,
    mvp: `${mvp.name} (${state.teams.find(t => t.id === mvp.teamId)?.tag})`,
    rookie: rookie ? `${rookie.name} (${state.teams.find(t => t.id === rookie.teamId)?.tag})` : '-',
    allPro: allPro.join(' • '),
  });

  addInboxMessage(state, {
    title: `${userTeam.region} ${splitName} Sezon Ödülleri Açıklandı`,
    sender: 'Lig Komitesi',
    category: 'NEWS',
    body: `Mevsim MVP'si: ${mvp.name} | Yılın Çaylağı: ${rookie ? rookie.name : '-'} | All-Pro 1. Takım: ${allPro.join(', ')}`,
  });
}

// ==================== BRACKETS & 16-TEAM WORLDS SWISS STAGE ====================
function createRegionalPlayoffsBracket(state, title) {
  const rounds = [
    { name: 'Yarı Finaller', matches: [] },
    { name: 'Bölge Finalleri', matches: [] },
  ];
  for (const reg of REGIONS) {
    const top4 = getSortedStandings(state, reg.id).slice(0, 4).map(r => r.teamId);
    rounds[0].matches.push(
      { id: `po_${reg.id}_sf1`, region: reg.id, blueId: top4[0], redId: top4[3], bestOf: 5, blueScore: 0, redScore: 0, played: false, winnerId: null },
      { id: `po_${reg.id}_sf2`, region: reg.id, blueId: top4[1], redId: top4[2], bestOf: 5, blueScore: 0, redScore: 0, played: false, winnerId: null }
    );
  }
  return { title, type: 'REGIONAL_PLAYOFFS', currentRound: 0, rounds };
}

function createMSIBracket(state, champByRegion) {
  // 8 Teams: All 7 Regional Champions + highest-seeded non-champion LCK team (no duplicates!)
  const lck2 = getSortedStandings(state, 'LCK').find(r => r.teamId !== champByRegion.LCK)?.teamId || getSortedStandings(state, 'LCK')[1]?.teamId;
  const qf = [
    { id: 'MSI_qf1', blueId: champByRegion.LCK, redId: champByRegion.LCO, bestOf: 5, blueScore: 0, redScore: 0, played: false, winnerId: null },
    { id: 'MSI_qf2', blueId: champByRegion.LPL, redId: champByRegion.TCL, bestOf: 5, blueScore: 0, redScore: 0, played: false, winnerId: null },
    { id: 'MSI_qf3', blueId: champByRegion.LEC, redId: champByRegion.CBLOL, bestOf: 5, blueScore: 0, redScore: 0, played: false, winnerId: null },
    { id: 'MSI_qf4', blueId: champByRegion.LCS, redId: lck2, bestOf: 5, blueScore: 0, redScore: 0, played: false, winnerId: null },
  ];
  return {
    title: `MSI ${state.season} (7 Bölge Şampiyonu + LCK #2)`,
    type: 'MSI',
    currentRound: 0,
    rounds: [
      { name: 'Çeyrek Finaller', matches: qf },
      { name: 'Yarı Finaller', matches: [] },
      { name: 'Büyük Final', matches: [] },
    ],
  };
}

// Worlds 2026 Qualification System:
// 14 Direct Swiss Seeds: LCK #1-3, LPL #1-3, LEC #1-3, LCS #1-3, CBLOL #1, + 1 MSI Champion Region Bonus Seed
// 4 Play-In Teams (2 BO5s -> 2 winners enter Swiss): TCL #1 (Champ), LCO #1 (Champ), CBLOL #2, + 4th Seed of MSI Bonus Region (or LCK/LPL #4)
function buildWorlds2026Qualification(state, finalMatches) {
  const getRegionOrderedSeeds = (regId) => {
    const fm = finalMatches.find(m => m.region === regId);
    const champId = fm?.winnerId;
    const runnerId = fm ? (fm.blueId === champId ? fm.redId : fm.blueId) : null;
    const regOrder = getSortedStandings(state, regId).map(r => r.teamId);
    const ordered = [];
    if (champId) ordered.push(champId);
    if (runnerId && !ordered.includes(runnerId)) ordered.push(runnerId);
    for (const id of regOrder) if (!ordered.includes(id)) ordered.push(id);
    return ordered;
  };

  const seeds = {};
  for (const reg of REGIONS) seeds[reg.id] = getRegionOrderedSeeds(reg.id);

  const bonusReg = state.msiWinnerRegion || 'LCK';
  const directIds = [
    ...seeds.LCK.slice(0, 3),
    ...seeds.LPL.slice(0, 3),
    ...seeds.LEC.slice(0, 3),
    ...seeds.LCS.slice(0, 3),
    seeds.CBLOL[0],
  ];

  // Add 14th direct seed: if bonusReg is a 3-slot region, take its #4; else take LCK #4
  const bonus4 = seeds[bonusReg]?.find(id => !directIds.includes(id)) || seeds.LCK.find(id => !directIds.includes(id));
  if (bonus4) directIds.push(bonus4);

  // 4 Play-In Teams: TCL Champ, LCO Champ, CBLOL #2, and LPL #4 (or next highest non-qualified major seed)
  const extraPlayIn = seeds.LPL.find(id => !directIds.includes(id)) || seeds.LCK.find(id => !directIds.includes(id));
  const playInIds = [seeds.TCL[0], seeds.LCO[0], seeds.CBLOL[1], extraPlayIn].filter(Boolean);

  const playInBracket = {
    title: `WORLDS ${state.season} Ön Eleme (Play-In — 2 Takım İsviçre'ye Çıkar)`,
    type: 'WORLDS_PLAYIN',
    currentRound: 0,
    rounds: [
      {
        name: 'Play-In Eleme Finalleri (BO5)',
        matches: [
          { id: 'WPI_1', blueId: playInIds[0], redId: playInIds[2], bestOf: 5, blueScore: 0, redScore: 0, played: false, winnerId: null },
          { id: 'WPI_2', blueId: playInIds[3], redId: playInIds[1], bestOf: 5, blueScore: 0, redScore: 0, played: false, winnerId: null },
        ],
      },
    ],
  };

  return { directIds, playInIds, playInBracket, bonusReg };
}

function createWorldsSwissStage(state, teamIds16) {
  const swissTeams = teamIds16.map(teamId => ({
    teamId,
    wins: 0,
    losses: 0,
    status: 'ACTIVE',
    pastOpps: [],
  }));

  const swiss = {
    round: 1,
    teams: swissTeams,
    currentMatches: [],
    pastRounds: [],
  };
  pairSwissRound(swiss);
  return swiss;
}

function pairSwissRound(swiss) {
  const active = swiss.teams.filter(t => t.status === 'ACTIVE');
  // Group by W-L record
  const buckets = {};
  for (const t of active) {
    const key = `${t.wins}-${t.losses}`;
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(t);
  }

  const matches = [];
  let leftovers = [];
  const keys = Object.keys(buckets).sort((a, b) => Number(b.split('-')[0]) - Number(a.split('-')[0]));

  for (const key of keys) {
    const group = [...buckets[key]].sort(() => Math.random() - 0.5);
    if (leftovers.length) group.unshift(leftovers.pop());
    while (group.length >= 2) {
      const a = group.shift();
      // Avoid rematches in Swiss stage whenever possible
      let oppIdx = group.findIndex(cand => !(a.pastOpps || []).includes(cand.teamId));
      if (oppIdx === -1) oppIdx = 0;
      const b = group.splice(oppIdx, 1)[0];
      if (!a.pastOpps) a.pastOpps = [];
      if (!b.pastOpps) b.pastOpps = [];
      a.pastOpps.push(b.teamId);
      b.pastOpps.push(a.teamId);
      const isDecider = a.wins === 2 || a.losses === 2 || b.wins === 2 || b.losses === 2;
      matches.push({
        id: `sw_r${swiss.round}_${a.teamId}_${b.teamId}`,
        recordLabel: key,
        blueId: a.teamId,
        redId: b.teamId,
        bestOf: isDecider ? 3 : 1,
        blueScore: 0, redScore: 0, played: false, winnerId: null,
      });
    }
    if (group.length === 1) leftovers.push(group[0]);
  }
  swiss.currentMatches = matches;
}

function createWorldsKnockoutBracket(state, qualifiedTeamIds) {
  const shuffled = [...qualifiedTeamIds].sort((a, b) => getTeamOVR(state, b) - getTeamOVR(state, a));
  const qf = [
    { id: 'WORLDS_qf1', blueId: shuffled[0], redId: shuffled[7], bestOf: 5, blueScore: 0, redScore: 0, played: false, winnerId: null },
    { id: 'WORLDS_qf2', blueId: shuffled[3], redId: shuffled[4], bestOf: 5, blueScore: 0, redScore: 0, played: false, winnerId: null },
    { id: 'WORLDS_qf3', blueId: shuffled[1], redId: shuffled[6], bestOf: 5, blueScore: 0, redScore: 0, played: false, winnerId: null },
    { id: 'WORLDS_qf4', blueId: shuffled[2], redId: shuffled[5], bestOf: 5, blueScore: 0, redScore: 0, played: false, winnerId: null },
  ];
  return {
    title: `WORLDS ${state.season} Eleme Aşaması`,
    type: 'WORLDS',
    currentRound: 0,
    rounds: [
      { name: 'Çeyrek Finaller', matches: qf },
      { name: 'Yarı Finaller', matches: [] },
      { name: 'WORLDS BÜYÜK FİNAL', matches: [] },
    ],
  };
}

// ==================== ADVANCE CALENDAR ====================
function advanceCalendarToNextMonday(state) {
  ensureCalendarState(state);
  const dt = parseISO(state.currentDate);
  const dow = dt.getUTCDay();
  const addDays = dow === 1 ? 7 : dow === 0 ? 1 : 8 - dow;
  state.currentDate = addDaysISO(state.currentDate, addDays);
}

export function advanceWeekOrRound(state) {
  // 0. Off-Season -> Start New Season!
  if (state.phase === 'OFFSEASON') {
    startNewSeason(state);
    return `Sezon ${state.season} başladı! Bahar Mevsimi fikstürü hazır.`;
  }

  // 1. Splits
  if (state.phase === 'SPRING_SPLIT' || state.phase === 'SUMMER_SPLIT') {
    for (const reg of REGIONS) {
      const weekMatches = state.schedules[reg.id][state.week - 1] || [];
      for (const m of weekMatches) if (!m.played) quickSimSeries(state, m);
    }
    runWeeklyClubTick(state);
    evaluateBoardJobSecurity(state);
    maybeTriggerDramaEvent(state);
    maybeGenerateIncomingOffer(state);

    if (state.week === 2) {
      addInboxMessage(state, {
        title: 'Kadro Kilidi (Roster Lock) Devreye Girdi',
        sender: 'Lig Komitesi',
        category: 'TRANSFER',
        body: 'Transfer penceresi kapandı! Bir sonraki transfer dönemine kadar yeni transfer yapılamaz; mevcut yedeklerinle ve scouting ile devam edebilirsin.',
      });
    }

    if (state.week === 4) {
      state.patchIndex = (state.patchIndex + 1) % PATCHES.length;
      const np = getCurrentPatch(state);
      addInboxMessage(state, { title: `Yeni Yama ${np.version}: ${np.name}`, sender: 'Riot Denge Ekibi', category: 'PATCH', body: np.desc });
    }

    if (state.week < 7) {
      state.week++;
      const curDow = parseISO(state.currentDate || `${state.season}-01-11`).getUTCDay();
      if (curDow !== 1) advanceCalendarToNextMonday(state);
      return `${getPhaseLabel(state.phase)} · Hafta ${state.week} başladı.`;
    }

    if (state.phase === 'SPRING_SPLIT') {
      awardSplitHonors(state, 'Bahar');
      state.phase = 'SPRING_PLAYOFFS';
      state.week = 1;
      setCalendarToMonday(state, 3, 20); // Late March Playoffs
      state.bracket = createRegionalPlayoffsBracket(state, `Sezon ${state.season} Bahar Playoffları`);
      addInboxMessage(state, { title: 'Bahar Playoffları Başlıyor!', sender: 'Lig Komitesi', category: 'TOURNAMENT', body: '7 bölgede ilk 4 takımlar BO5 Playoff ve MSI bileti için sahneye çıkıyor!' });
    } else {
      awardSplitHonors(state, 'Yaz');
      state.phase = 'SUMMER_PLAYOFFS';
      state.week = 1;
      setCalendarToMonday(state, 8, 18); // Late August Playoffs
      state.bracket = createRegionalPlayoffsBracket(state, `Sezon ${state.season} Yaz Playoffları`);
      addInboxMessage(state, { title: 'Yaz Playoffları Başlıyor!', sender: 'Lig Komitesi', category: 'TOURNAMENT', body: `Yaz Mevsimi bitti! Şimdi Worlds ${state.season} öncesi bölge finalleri!` });
    }
    return;
  }

  // 2. Worlds 16-Team Swiss Stage
  if (state.phase === 'WORLDS_SWISS' && state.swiss) {
    for (const m of state.swiss.currentMatches) if (!m.played) quickSimSeries(state, m);
    state.swiss.pastRounds.push({ round: state.swiss.round, matches: state.swiss.currentMatches });
    runWeeklyClubTick(state);

    const activeLeft = state.swiss.teams.filter(t => t.status === 'ACTIVE');
    if (activeLeft.length > 0 && state.swiss.round < 5) {
      state.swiss.round++;
      state.week = state.swiss.round;
      pairSwissRound(state.swiss);
      return;
    }

    // Archive completed Swiss Stage before transitioning to Knockout
    ensureCalendarState(state);
    state.tournamentArchive.unshift({
      id: `arch_swiss_${state.season}`,
      season: state.season,
      title: `WORLDS ${state.season} — İsviçre Aşaması`,
      kind: 'SWISS',
      rounds: (state.swiss.pastRounds || []).map(pr => ({
        name: `Tur ${pr.round}`,
        matches: pr.matches.map(m => ({ blueId: m.blueId, redId: m.redId, blueScore: m.blueScore, redScore: m.redScore, winnerId: m.winnerId, played: m.played, recordLabel: m.recordLabel, bestOf: m.bestOf })),
      })),
    });
    if (state.tournamentArchive.length > 20) state.tournamentArchive.pop();

    // Swiss Finished -> Top 8 to Knockout! (Guaranteed 8 valid unique teams)
    const qualified = state.swiss.teams.filter(t => t.status === 'QUALIFIED').map(t => t.teamId);
    if (qualified.length < 8) {
      const extras = [...state.swiss.teams]
        .filter(t => !qualified.includes(t.teamId))
        .sort((a, b) => (b.wins - a.wins) || (a.losses - b.losses))
        .map(t => t.teamId);
      while (qualified.length < 8 && extras.length) qualified.push(extras.shift());
    }
    state.phase = 'WORLDS_KNOCKOUT';
    state.week = 1;
    state.bracket = createWorldsKnockoutBracket(state, qualified);
    addInboxMessage(state, {
      title: `WORLDS ${state.season} Çeyrek Finalleri Belli Oldu!`,
      sender: 'Riot Esports',
      category: 'TOURNAMENT',
      body: `İsviçre Aşaması'ndan çıkan 8 dev takım şimdi BO5 Eleme Aşaması'nda Sihirdar Kupası için mücadele ediyor!`,
    });
    return;
  }

  // 3. Bracket Phases (Playoffs, MSI, Worlds Knockout)
  if (state.bracket) {
    const round = state.bracket.rounds[state.bracket.currentRound];
    for (const m of round.matches) if (!m.played) quickSimSeries(state, m);
    runWeeklyClubTick(state);

    if (state.bracket.currentRound < state.bracket.rounds.length - 1) {
      const nextIdx = state.bracket.currentRound + 1;
      const nextMatches = [];
      if (state.bracket.type === 'REGIONAL_PLAYOFFS') {
        for (const reg of REGIONS) {
          const sfs = round.matches.filter(m => m.region === reg.id);
          nextMatches.push({
            id: `po_${reg.id}_fin`, region: reg.id,
            blueId: sfs[0].winnerId, redId: sfs[1].winnerId,
            bestOf: 5, blueScore: 0, redScore: 0, played: false, winnerId: null,
          });
        }
      } else {
        for (let i = 0; i < round.matches.length; i += 2) {
          nextMatches.push({
            id: `${state.bracket.type}_r${nextIdx}_${i}`,
            blueId: round.matches[i].winnerId, redId: round.matches[i + 1].winnerId,
            bestOf: 5, blueScore: 0, redScore: 0, played: false, winnerId: null,
          });
        }
      }
      state.bracket.rounds[nextIdx].matches = nextMatches;
      state.bracket.currentRound = nextIdx;
      state.week++;
      return;
    }

    finishBracketAndTransition(state);
    return;
  }

  // 4. Off-Season -> Next Season
  if (state.phase === 'OFFSEASON') {
    startNewSeason(state);
  }
}

function archiveBracketSnapshot(state) {
  if (!state.bracket) return;
  ensureCalendarState(state);
  state.tournamentArchive.unshift({
    id: `arch_${state.phase}_${state.season}_${Date.now().toString(36)}`,
    season: state.season,
    title: state.bracket.title,
    kind: 'BRACKET',
    rounds: state.bracket.rounds.map(r => ({
      name: r.name,
      matches: r.matches.map(m => ({ region: m.region || null, blueId: m.blueId, redId: m.redId, blueScore: m.blueScore, redScore: m.redScore, winnerId: m.winnerId, played: m.played, bestOf: m.bestOf })),
    })),
  });
  if (state.tournamentArchive.length > 20) state.tournamentArchive.pop();
}

function finishBracketAndTransition(state) {
  archiveBracketSnapshot(state);
  const rounds = state.bracket.rounds;
  const finalMatches = rounds[rounds.length - 1].matches;
  const uid = state.userTeamId;
  const userTeam = state.teams.find(t => t.id === uid);

  const awardSponsorGoal = (team, type) => {
    if (!team || !team.sponsor) return 0;
    if (type === 'PLAYOFF' && team.sponsor.id === 'sp_safe') { team.budget += team.sponsor.bonus; return team.sponsor.bonus; }
    if (type === 'FINAL' && team.sponsor.id === 'sp_mid') { team.budget += team.sponsor.bonus; return team.sponsor.bonus; }
    if (type === 'INTL_WIN' && team.sponsor.id === 'sp_elite') { team.budget += team.sponsor.bonus; return team.sponsor.bonus; }
    return 0;
  };

  if (state.phase === 'SPRING_PLAYOFFS' || state.phase === 'SUMMER_PLAYOFFS') {
    const isSpring = state.phase === 'SPRING_PLAYOFFS';
    const splitLbl = isSpring ? 'Bahar' : 'Yaz';
    const champs = [];
    const champByRegion = {};
    const sfMatches = rounds[0]?.matches || [];

    // Award semi-finalists ($200K) and all regional teams broadcast revenue share ($100K)
    for (const t of state.teams) t.budget += 100000;
    for (const sf of sfMatches) {
      const loserId = sf.winnerId === sf.blueId ? sf.redId : sf.blueId;
      const lTeam = state.teams.find(t => t.id === loserId);
      if (lTeam) lTeam.budget += 200000;
    }

    let userPrize = 100000;
    let userPlace = 'Lig Aşaması (Yayın Geliri)';
    let userWon = false;
    let userSponsorBonus = 0;

    for (const fm of finalMatches) {
      const champ = state.teams.find(t => t.id === fm.winnerId);
      const runnerId = fm.winnerId === fm.blueId ? fm.redId : fm.blueId;
      const runner = state.teams.find(t => t.id === runnerId);
      champ.budget += 650000;
      champ.prestige = Math.min(99, champ.prestige + 1);
      champ.trophies.push(`${state.season} ${fm.region} ${splitLbl}`);
      if (runner) runner.budget += 380000;
      champs.push(`${fm.region}: ${champ.tag}`);
      champByRegion[fm.region] = champ.id;

      if (champ.id === uid) {
        userWon = true;
        userPrize = 750000;
        userPlace = `${fm.region} ${splitLbl} ŞAMPİYONU`;
        userSponsorBonus = awardSponsorGoal(userTeam, 'FINAL') + awardSponsorGoal(userTeam, 'PLAYOFF');
        bumpManagerRep(state, 6, 'tacticalRep', 4);
        state.managerProfile.trophiesWon = (state.managerProfile.trophiesWon || 0) + 1;
        state.managerProfile.titleHistory.unshift(`${state.season} ${fm.region} ${splitLbl}`);
      } else if (runnerId === uid) {
        userPrize = 480000;
        userPlace = `${fm.region} ${splitLbl} İkincisi (Finalist)`;
        userSponsorBonus = awardSponsorGoal(userTeam, 'FINAL') + awardSponsorGoal(userTeam, 'PLAYOFF');
      }
    }
    if (!userWon && sfMatches.some(m => m.blueId === uid || m.redId === uid) && userPlace === 'Lig Aşaması (Yayın Geliri)') {
      userPrize = 300000;
      userPlace = `${userTeam.region} ${splitLbl} Yarı Finalisti (3.-4.)`;
      userSponsorBonus = awardSponsorGoal(userTeam, 'PLAYOFF');
    }

    const userMvp = getTeamRoster(state, uid).sort((a, b) => (b.stats.mvps * 10 + b.ovr) - (a.stats.mvps * 10 + a.ovr))[0];
    if (userWon || userPrize >= 300000) {
      state.pendingCelebration = {
        isChampion: userWon,
        tournament: `${state.season} ${userTeam.region} ${splitLbl} Playoffları`,
        placement: userPlace,
        prizeMoney: userPrize,
        sponsorBonus: userSponsorBonus,
        mvp: userMvp ? `${userMvp.name} (${userMvp.role})` : '-',
        subtitle: userWon
          ? `Tebrikler ${state.managerName || 'Koç'}! ${userTeam.name} kupayı kaldırdı ve ${isSpring ? 'MSI' : 'WORLDS'} biletini kaptı!`
          : `${userTeam.name}, ${userPlace} olarak sezonu tamamladı ve kulüp kasasına önemli ödül kazandırdı.`,
      };
    }

    if (isSpring) {
      state.patchIndex = (state.patchIndex + 1) % PATCHES.length;
      const msiPatch = getCurrentPatch(state);
      addInboxMessage(state, {
        title: `Bahar Şampiyonları Belli Oldu — MSI Yaması ${msiPatch.version} (${msiPatch.name})`,
        sender: 'Riot Esports',
        category: 'TOURNAMENT',
        body: `Bölge Şampiyonları: ${champs.join(' • ')}. Ödül Havuzu dağıtıldı (${userPlace}: +${formatMoney(userPrize + userSponsorBonus)}). MSI Özel Yaması (${msiPatch.version}): ${msiPatch.desc}`,
      });
      state.phase = 'MSI';
      state.week = 1;
      setCalendarToMonday(state, 5, 2);
      state.bracket = createMSIBracket(state, champByRegion);
      return;
    }

    state.patchIndex = 4;
    const { directIds, playInIds, playInBracket, bonusReg } = buildWorlds2026Qualification(state, finalMatches);
    state.worldsDirectIds = directIds;
    state.phase = 'WORLDS_PLAYIN';
    state.week = 1;
    setCalendarToMonday(state, 10, 2);
    state.bracket = playInBracket;

    const userStatus = directIds.includes(uid)
      ? 'Tebrikler! Takımın Worlds İsviçre Aşaması\'na DOĞRUDAN katılmaya hak kazandı!'
      : playInIds.includes(uid)
        ? 'Takımın Worlds Ön Eleme (Play-In) bileti aldı! BO5 serisini kazanıp İsviçre Aşaması\'na çıkmalısın.'
        : 'Bu sezon Worlds biletini kaçırdın. Turnuva bitince Sezon Arası\'nda kadronu güçlendirebilirsin.';

    addInboxMessage(state, {
      title: `WORLDS ${state.season} Katılımcıları Belli Oldu (Ön Eleme Başlıyor)`,
      sender: 'Riot Esports',
      category: 'TOURNAMENT',
      body: `Yaz Şampiyonları: ${champs.join(' • ')}. Ödül Havuzu (${userPlace}: +${formatMoney(userPrize + userSponsorBonus)}). MSI Bonus Slotu: ${bonusReg}. ${userStatus}`,
    });
    return;
  }

  if (state.phase === 'MSI') {
    const msiWinner = state.teams.find(t => t.id === finalMatches[0].winnerId);
    const runnerId = finalMatches[0].winnerId === finalMatches[0].blueId ? finalMatches[0].redId : finalMatches[0].blueId;
    const msiRunner = state.teams.find(t => t.id === runnerId);
    state.msiWinnerRegion = msiWinner.region;

    // Official $2M MSI Prize Pool + Skin Share
    msiWinner.budget += 850000;
    msiWinner.prestige = Math.min(99, msiWinner.prestige + 2);
    msiWinner.trophies.push(`MSI ${state.season}`);
    if (msiRunner) msiRunner.budget += 450000;
    for (const sf of (rounds[1]?.matches || [])) {
      const lId = sf.winnerId === sf.blueId ? sf.redId : sf.blueId;
      const lt = state.teams.find(t => t.id === lId);
      if (lt) lt.budget += 260000;
    }
    for (const qf of (rounds[0]?.matches || [])) {
      const lId = qf.winnerId === qf.blueId ? qf.redId : qf.blueId;
      const lt = state.teams.find(t => t.id === lId);
      if (lt) lt.budget += 140000;
    }

    const msiMvp = getTeamRoster(state, msiWinner.id).sort((a, b) => (b.stats.mvps * 10 + b.ovr) - (a.stats.mvps * 10 + a.ovr))[0];
    state.history.push({ season: state.season, event: 'MSI', winner: msiWinner.name, tag: msiWinner.tag, mvp: msiMvp?.name || '-' });

    const playedMSI = (rounds[0]?.matches || []).some(m => m.blueId === uid || m.redId === uid);
    if (playedMSI) {
      const won = msiWinner.id === uid;
      if (won) {
        bumpManagerRep(state, 6, 'tacticalRep', 5);
        state.managerProfile.trophiesWon = (state.managerProfile.trophiesWon || 0) + 1;
        state.managerProfile.titleHistory.unshift(`MSI ${state.season}`);
      }
      const isRun = runnerId === uid;
      const isSf = (rounds[1]?.matches || []).some(m => m.blueId === uid || m.redId === uid);
      const prize = won ? 850000 : isRun ? 450000 : isSf ? 260000 : 140000;
      const spBonus = won ? awardSponsorGoal(userTeam, 'INTL_WIN') : 0;
      state.pendingCelebration = {
        isChampion: won,
        tournament: `MSI ${state.season} Uluslararası Turnuvası`,
        placement: won ? `MSI ${state.season} ŞAMPİYONU` : isRun ? 'MSI Finalisti (2.)' : isSf ? 'MSI Yarı Finalisti (3.-4.)' : 'MSI Çeyrek Finalisti (5.-8.)',
        prizeMoney: prize,
        sponsorBonus: spBonus,
        mvp: `${msiMvp?.name || '-'} (${msiWinner.tag})`,
        subtitle: won
          ? `TARİH YAZDIN ${state.managerName || 'Koç'}! ${userTeam.name} MSI kupasını kaldırdı ve ${userTeam.region} bölgesine Worlds için +1 bonus slot kazandırdı!`
          : `${userTeam.name}, MSI ${state.season} performansıyla kulüp kasasına ${formatMoney(prize)} ödül kazandırdı.`,
      };
    }

    state.patchIndex = (state.patchIndex + 1) % PATCHES.length;
    const { schedules, standings } = createRegionalSchedules(state.teams);
    state.schedules = schedules;
    state.standings = standings;
    state.bracket = null;
    state.phase = 'SUMMER_SPLIT';
    state.week = 1;
    setCalendarToMonday(state, 6, 5);
    state.academyPromotedThisSplit = false;
    state.challengerPool = generateChallengerProspects();
    const sumPatch = getCurrentPatch(state);

    addInboxMessage(state, {
      title: `MSI ${state.season} Şampiyonu: ${msiWinner.name} (Finals MVP: ${msiMvp?.name || '-'})`,
      sender: 'Riot Esports',
      category: 'TOURNAMENT',
      body: `${msiWinner.name} MSI kupasını kaldırdı (+$850K) ve ${msiWinner.region} bölgesine Worlds ${state.season} için +1 bonus slot kazandırdı! Yeni Yaz Yaması ${sumPatch.version} (${sumPatch.name}): ${sumPatch.desc}`,
    });
    return;
  }

  if (state.phase === 'WORLDS_PLAYIN') {
    const winners = finalMatches.map(m => m.winnerId);
    for (const m of finalMatches) {
      const lId = m.winnerId === m.blueId ? m.redId : m.blueId;
      const lt = state.teams.find(t => t.id === lId);
      if (lt) lt.budget += 75000;
    }
    const all16 = [...(state.worldsDirectIds || []), ...winners].slice(0, 16);
    state.bracket = null;
    state.phase = 'WORLDS_SWISS';
    state.week = 1;
    state.swiss = createWorldsSwissStage(state, all16);

    const wTags = winners.map(id => state.teams.find(t => t.id === id)?.tag).join(' & ');
    addInboxMessage(state, {
      title: `WORLDS ${state.season} — 16 Takımlı İsviçre Aşaması Başlıyor`,
      sender: 'Riot Esports',
      category: 'TOURNAMENT',
      body: `Play-In'den çıkan ${wTags} ile 16 takım tamamlandı! 3 galibiyet alan Çeyrek Final'e yükselir, 3 mağlubiyet alan elenir.`,
    });
    return;
  }

  if (state.phase === 'WORLDS_KNOCKOUT') {
    const worldsWinner = state.teams.find(t => t.id === finalMatches[0].winnerId);
    const runnerId = finalMatches[0].winnerId === finalMatches[0].blueId ? finalMatches[0].redId : finalMatches[0].blueId;
    const worldsRunner = state.teams.find(t => t.id === runnerId);

    // Official $5M Worlds Prize Pool + Champion Skin Share!
    worldsWinner.budget += 1800000;
    worldsWinner.prestige = Math.min(99, worldsWinner.prestige + 3);
    worldsWinner.trophies.push(`WORLDS ${state.season}`);
    if (worldsRunner) worldsRunner.budget += 950000;
    for (const sf of (rounds[1]?.matches || [])) {
      const lId = sf.winnerId === sf.blueId ? sf.redId : sf.blueId;
      const lt = state.teams.find(t => t.id === lId);
      if (lt) lt.budget += 500000;
    }
    for (const qf of (rounds[0]?.matches || [])) {
      const lId = qf.winnerId === qf.blueId ? qf.redId : qf.blueId;
      const lt = state.teams.find(t => t.id === lId);
      if (lt) lt.budget += 320000;
    }
    // Swiss participants who didn't make Knockout still get $150K participation share
    const koIds = new Set((rounds[0]?.matches || []).flatMap(m => [m.blueId, m.redId]));
    for (const st of (state.swiss?.teams || [])) {
      if (!koIds.has(st.teamId)) {
        const t = state.teams.find(x => x.id === st.teamId);
        if (t) t.budget += 150000;
      }
    }

    const worldsMvp = getTeamRoster(state, worldsWinner.id).sort((a, b) => (b.stats.mvps * 12 + b.ovr) - (a.stats.mvps * 12 + a.ovr))[0];
    state.history.push({ season: state.season, event: 'WORLDS', winner: worldsWinner.name, tag: worldsWinner.tag, mvp: worldsMvp?.name || '-' });

    ensureCalendarState(state);
    if (worldsMvp) {
      const existing = state.records.hallOfFame.find(h => h.name === worldsMvp.name);
      if (existing) { existing.titles++; existing.lastSeason = state.season; }
      else state.records.hallOfFame.unshift({ name: worldsMvp.name, role: worldsMvp.role, tag: worldsWinner.tag, titles: 1, lastSeason: state.season, note: `Worlds ${state.season} Finals MVP` });
      if (state.records.hallOfFame.length > 20) state.records.hallOfFame.pop();
    }

    const inKO = koIds.has(uid);
    const inSwiss = (state.swiss?.teams || []).some(st => st.teamId === uid);
    if (inKO || inSwiss) {
      const won = worldsWinner.id === uid;
      if (won) {
        bumpManagerRep(state, 6, 'tacticalRep', 6);
        state.managerProfile.trophiesWon = (state.managerProfile.trophiesWon || 0) + 1;
        state.managerProfile.titleHistory.unshift(`WORLDS ${state.season}`);
      }
      const isRun = runnerId === uid;
      const isSf = (rounds[1]?.matches || []).some(m => m.blueId === uid || m.redId === uid);
      const prize = won ? 1800000 : isRun ? 950000 : isSf ? 500000 : inKO ? 320000 : 150000;
      const spBonus = won ? awardSponsorGoal(userTeam, 'INTL_WIN') : 0;
      state.pendingCelebration = {
        isChampion: won,
        tournament: `WORLDS ${state.season} Dünya Şampiyonası`,
        placement: won ? `WORLDS ${state.season} DÜNYA ŞAMPİYONU` : isRun ? 'WORLDS Finalisti (2.)' : isSf ? 'WORLDS Yarı Finalisti (3.-4.)' : inKO ? 'WORLDS Çeyrek Finalisti (5.-8.)' : 'WORLDS İsviçre Aşaması (9.-16.)',
        prizeMoney: prize,
        sponsorBonus: spBonus,
        mvp: `${worldsMvp?.name || '-'} (${worldsWinner.tag})`,
        subtitle: won
          ? `EFSANE ${state.managerName || 'Koç'}! ${userTeam.name} Sihirdar Kupası'nı kaldırdı! ($1M Ödül + $800K Şampiyon Kostüm Geliri)`
          : `${userTeam.name}, WORLDS ${state.season} sahnesinde büyük bir mücadele verdi ve ${formatMoney(prize)} ödül kazandı.`,
      };
    }

    state.bracket = null;
    state.swiss = null;
    state.phase = 'OFFSEASON';
    state.week = 1;
    setCalendarToMonday(state, 11, 16);
    runOffSeasonProgression(state);
    generateSuccessJobOffers(state);
    maybeGenerateIncomingOffer(state, 0.85);
    maybeGenerateIncomingOffer(state, 0.55);

    const mgr = state.managerName || 'Koç';
    addInboxMessage(state, {
      title: `WORLDS ${state.season} Şampiyonu: ${worldsWinner.name} (Finals MVP: ${worldsMvp?.name || '-'})`,
      sender: 'Riot Esports',
      category: 'TOURNAMENT',
      body: `${worldsWinner.id === userTeam.id ? `TEBRİKLER ${mgr}! Sihirdar Kupası'nı kaldırdın! ` : ''}${worldsWinner.name} WORLDS ${state.season} şampiyonu oldu (+$1.80M Ödül & Kostüm Payı, Finals MVP: ${worldsMvp?.name || '-'})! Şimdi Sezon Arası Transfer Penceresi açıldı.`,
    });
  }
}

function runLivingAITransfers(state, maxMoves = 8) {
  ensureCalendarState(state);
  const aiMoves = [];
  const isOffSeason = state.phase === 'OFFSEASON';
  const richAITeams = state.teams.filter(t => t.id !== state.userTeamId && t.budget >= 1100000).sort(() => Math.random() - 0.5).slice(0, maxMoves * 3);

  for (const buyer of richAITeams) {
    if (aiMoves.length >= maxMoves) break;
    const roster = getTeamRoster(state, buyer.id);
    if (roster.length < 5) continue;
    const weakest = [...roster].sort((a, b) => a.ovr - b.ovr)[0];

    const candidates = state.players.filter(p => {
      if (p.role !== weakest.role || p.teamId === buyer.id || p.teamId === state.userTeamId) return false;
      if (p.ovr < weakest.ovr + 2 || p.marketValue > buyer.budget * 0.65) return false;

      // Mid-season realism: clubs sign Free Agents or benched players (no mid-split superstar raids!)
      if (!isOffSeason && p.teamId && p.isStarter) return false;

      // Realistic player willingness & club/region prestige alignment (same rules as user!)
      const interest = evaluateTransferInterest(state, p, buyer);
      if (!interest.willing) return false;

      // Protect franchise superstars at elite clubs & prevent huge prestige downgrades
      if (p.teamId) {
        const oldClub = state.teams.find(t => t.id === p.teamId);
        if (!oldClub) return false;
        if (oldClub.prestige >= 88 && p.ovr >= 91 && p.isStarter && p.contractYears >= 2) return false;
        if (oldClub.prestige > buyer.prestige + 5 && p.isStarter) return false;
      }

      // Prefer same-region or realistic cross-region tier
      if (p.ovr >= 85 && buyer.prestige < 80) return false;
      return true;
    }).sort((a, b) => {
      // Slight preference for same-region players & higher OVR
      const sameA = (a.lang === REGION_LANG[buyer.region]) ? 2 : 0;
      const sameB = (b.lang === REGION_LANG[buyer.region]) ? 2 : 0;
      return (b.ovr + sameB) - (a.ovr + sameA);
    });

    const target = candidates[0];
    if (target) {
      const oldClub = target.teamId ? state.teams.find(t => t.id === target.teamId) : null;
      const fee = oldClub ? Math.round(target.marketValue * (target.isStarter ? 1.15 : 0.85)) : 0;
      if (fee > buyer.budget * 0.75) continue;

      if (oldClub) {
        buyer.budget -= fee;
        oldClub.budget += fee;
        const oldAvg = getTeamOVR(state, oldClub.id);
        // Only send weakest to oldClub if they actually fit oldClub's level; otherwise release & let oldClub sign a proper replacement!
        if (weakest.ovr >= oldAvg - 5) {
          weakest.teamId = oldClub.id;
          weakest.isStarter = true;
        } else {
          weakest.teamId = null;
          weakest.isStarter = false;
          const repl = state.players
            .filter(x => x.teamId === null && x.role === target.role && evaluateTransferInterest(state, x, oldClub).willing)
            .sort((a, b) => b.ovr - a.ovr)[0]
            || generateRegenPlayer(target.role, oldClub.region, oldClub.facilities.youthAcademy, oldClub.id);
          if (!state.players.includes(repl)) state.players.push(repl);
          repl.teamId = oldClub.id; repl.isStarter = true; repl.contractYears = 2;
        }
      } else {
        weakest.teamId = null;
        weakest.isStarter = false;
      }
      target.teamId = buyer.id;
      target.isStarter = true;
      target.contractYears = 2;
      const text = `${buyer.tag}, ${oldClub ? oldClub.tag + ' takımından' : 'serbest piyasadan'} ${target.name} (${target.role}, ${target.ovr}) transfer etti${fee ? ` (${formatMoney(fee)})` : ''}`;
      aiMoves.push(text);
      state.transferFeed.unshift({
        season: state.season,
        phase: getPhaseLabel(state.phase),
        buyerTag: buyer.tag,
        buyerColor: buyer.color,
        buyerColor2: buyer.color2,
        fromTag: oldClub ? oldClub.tag : 'FA',
        playerName: target.name,
        role: target.role,
        ovr: target.ovr,
        fee,
      });
      if (state.transferFeed.length > 35) state.transferFeed.pop();
      if (target.ovr >= 82 || fee >= 400000) {
        addSocialPost(state, {
          platform: 'X',
          handle: '@LEC_Wooloo',
          author: 'LEC Wooloo (Tier 1)',
          badge: 'TRANSFER',
          body: `[SON DAKİKA] ${buyer.name} (${buyer.region}), ${oldClub ? oldClub.tag : 'serbest pazardan'} ${target.name} (${target.role} · OVR ${target.ovr}) transferini ${fee > 0 ? formatMoney(fee) + ' bonservisle' : 'imza primiyle'} tamamladı!`,
          likes: Math.round(1200 + Math.random() * 5500),
          replies: Math.round(180 + Math.random() * 650),
        });
      }
    }
  }
  return aiMoves;
}

function runOffSeasonProgression(state) {
  const retiredNames = [];
  const remainingPlayers = [];
  const expiringUserNames = [];

  // Annual Riot Global Revenue Pool (GRP) Payout tied to Fanbase, Digital Sales & Prestige (prevents flat cash inflation!)
  let userGrant = 0;
  for (const t of state.teams) {
    const grpBase = t.prestige >= 88 ? 1050000 : t.prestige >= 80 ? 800000 : 580000;
    const grpFanShare = Math.round((t.fanbase || 70) * 6500);
    const grpTrophyShare = (t.trophies || []).filter(tr => tr.includes(String(state.season))).length * 320000;
    const grant = Math.round((grpBase + grpFanShare + grpTrophyShare) / 50000) * 50000;
    t.budget += grant;
    if (t.id === state.userTeamId) userGrant = grant;
  }
  if (userGrant > 0) {
    addInboxMessage(state, {
      title: `Riot Global Revenue Pool (GRP) Geliri Yatırıldı (+${formatMoney(userGrant)})`,
      sender: 'Riot Esports Finans',
      category: 'BOARD',
      body: `Dijital kostüm kapsülleri, taraftar etkileşimi ve sezon performansına bağlı Küresel Gelir Havuzu (GRP) payı kulüp kasasına +${formatMoney(userGrant)} olarak aktarıldı.`,
    });
  }

  for (const p of state.players) {
    // Archive full FM Career History row for this season before resetting stats!
    if (!Array.isArray(p.careerHistory)) p.careerHistory = [];
    const curClub = p.teamId ? state.teams.find(t => t.id === p.teamId) : null;
    if ((p.stats?.games || 0) > 0 || p.loanedTo) {
      const seasonTrophies = curClub ? (curClub.trophies || []).filter(tr => tr.includes(String(state.season))) : [];
      p.careerHistory.unshift({
        season: state.season,
        teamTag: p.loanedTo ? `${curClub?.tag || 'CLB'}→${p.loanedTo.leagueName.split(' ')[0]}` : (curClub?.tag || 'FA'),
        teamName: p.loanedTo ? `${p.loanedTo.clubName} (Kiralık)` : (curClub?.name || 'Serbest'),
        region: curClub?.region || 'FA',
        games: p.loanedTo ? (p.loanedTo.gamesPlayed || 0) : (p.stats?.games || 0),
        wins: p.loanedTo ? Math.round((p.loanedTo.gamesPlayed || 0) * 0.55) : (p.stats?.wins || 0),
        kills: p.stats?.kills || 0,
        deaths: p.stats?.deaths || 0,
        assists: p.stats?.assists || 0,
        mvps: p.stats?.mvps || 0,
        ovr: p.ovr,
        trophies: seasonTrophies.length,
      });
      if (p.careerHistory.length > 20) p.careerHistory.pop();
    }

    // Auto-return loaned players at season end with development summary
    if (p.loanedTo) {
      if (p.teamId === state.userTeamId) {
        addInboxMessage(state, {
          title: `Kiralık Dönüşü: ${p.name} (${p.loanedTo.leagueName})`,
          sender: 'Akademi & Kiralama Koordinatörü',
          category: 'TRANSFER',
          body: `${p.name}, ${p.loanedTo.clubName} (${p.loanedTo.leagueName}) kiralık sezonunu ${p.loanedTo.gamesPlayed} maç ve +${p.loanedTo.growthGained} özellik gelişimiyle tamamlayıp A Takım'a döndü (Güncel OVR: ${p.ovr}).`,
        });
      }
      p.loanedTo = null;
    }

    p.age++;
    p.fatigue = 5;
    p.injuredWeeks = 0;
    p.stats = { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, mvps: 0 };

    // Realistic retirements for veterans (AI 32+, User legends gracefully retire at 36+ so 2026..2100 stays realistic!)
    const isUser = p.teamId === state.userTeamId;
    const retireProb = isUser
      ? (p.age >= 38 ? 0.85 : p.age >= 36 ? 0.45 : 0)
      : (p.age >= 35 ? 0.75 : p.age >= 33 ? 0.42 : p.age >= 32 ? 0.22 : 0);
    if (retireProb > 0 && Math.random() < retireProb) {
      if (p.ovr >= 80 || isUser) retiredNames.push(`${p.name} (${p.age})`);
      continue;
    }

    // Prune aging/low-OVR unsigned free agents so multi-decade saves (up to 2100+) stay fast and lean!
    if (p.teamId === null && (p.age >= 27 || (p.age >= 23 && p.ovr < 75))) {
      continue;
    }

    if (p.age <= 22 && p.ovr < p.pot) {
      for (const k of Object.keys(p.attrs)) p.attrs[k] = Math.min(99, p.attrs[k] + (Math.random() < 0.68 ? 2 : 1));
    } else if (p.age >= 29) {
      for (const k of Object.keys(p.attrs)) p.attrs[k] = Math.max(55, p.attrs[k] - (Math.random() < 0.55 ? 2 : 1));
    }
    p.ovr = calcOVR(p.attrs);
    p.salary = calcWeeklySalary(p.ovr);

    if (p.teamId) {
      p.contractYears--;
      if (p.contractYears <= 0 && p.teamId !== state.userTeamId) {
        if (Math.random() < 0.65) p.contractYears = 2;
        else { p.teamId = null; p.isStarter = false; }
      } else if (p.contractYears <= 0 && p.teamId === state.userTeamId) {
        expiringUserNames.push(`${p.name} (${p.role}, ${p.ovr})`);
      }
    }
    recalculatePlayerMarketValue(state, p, true);
    remainingPlayers.push(p);
  }
  state.players = remainingPlayers;

  // Keep user team valid if a 36+ veteran retired
  const userClub = state.teams.find(t => t.id === state.userTeamId);
  if (userClub) {
    for (const role of ROLES) {
      if (!state.players.some(p => p.teamId === userClub.id && p.role === role)) {
        const acad = generateRegenPlayer(role, userClub.region, userClub.facilities.youthAcademy, userClub.id);
        acad.isStarter = true;
        state.players.push(acad);
      }
    }
  }

  for (let i = 0; i < 25; i++) {
    const reg = REGIONS[i % REGIONS.length].id;
    state.players.push(generateRegenPlayer(ROLES[i % ROLES.length], reg, Math.random() < 0.3 ? 3 : 2, null));
  }
  // Cap unsigned free-agent pool at top 90 so 75-year saves (2026..2100) stay super lightweight!
  const signedPlayers = state.players.filter(p => p.teamId !== null);
  const freeAgents = state.players.filter(p => p.teamId === null).sort((a, b) => (b.ovr + b.pot * 0.3) - (a.ovr + a.pot * 0.3)).slice(0, 90);
  state.players = [...signedPlayers, ...freeAgents];
  if (state.history.length > 150) state.history = state.history.slice(-150);
  if (state.awards.length > 150) state.awards = state.awards.slice(0, 150);
  state.challengerPool = generateChallengerProspects();
  // Head Scout bonus boosts Challenger pool potential
  const uTeam = state.teams.find(t => t.id === state.userTeamId);
  ensureTeamExtras(uTeam);
  const hsBonus = (uTeam?.staff?.headScout || 1) - 1;
  if (hsBonus > 0) {
    state.challengerPool.forEach(c => { c.pot = Math.min(98, c.pot + hsBonus * 2); });
  }

  const aiMoves = runLivingAITransfers(state, 9);

  for (const team of state.teams) {
    if (team.id === state.userTeamId) continue;
    for (const role of ROLES) {
      const has = state.players.some(p => p.teamId === team.id && p.role === role);
      if (!has) {
        const fa = state.players
          .filter(p => p.teamId === null && p.role === role && evaluateTransferInterest(state, p, team).willing)
          .sort((a, b) => b.ovr - a.ovr)[0]
          || generateRegenPlayer(role, team.region, team.facilities.youthAcademy, team.id);
        if (!state.players.includes(fa)) state.players.push(fa);
        fa.teamId = team.id; fa.isStarter = true; fa.contractYears = 2;
      }
    }
  }

  if (expiringUserNames.length) {
    addInboxMessage(state, {
      title: `Sözleşmesi Biten Oyuncuların Var (${expiringUserNames.length})!`,
      sender: 'Sportif Direktör',
      category: 'BOARD',
      body: `Yeni sezon başlamadan sözleşme yenilemezsen şu oyuncular bedelsiz (Free Agent) ayrılacak: ${expiringUserNames.join(', ')}. Kadro ekranından pazarlık masasına oturabilirsin.`,
    });
  }

  if (aiMoves.length || retiredNames.length) {
    addInboxMessage(state, {
      title: `${state.season} Sezon Arası Transfer & Emeklilik Özeti`,
      sender: 'Esports Insider',
      category: 'TRANSFER',
      body: `${aiMoves.length ? 'Öne Çıkan AI Transferleri: ' + aiMoves.slice(0, 7).join(' • ') + '.' : ''}${retiredNames.length ? ' Emekli Olan Efsaneler: ' + retiredNames.slice(0, 6).join(', ') + '.' : ''}`,
    });
  }
}

export function startNewSeason(state) {
  // Any user player whose contract expired and wasn't renewed leaves as Free Agent (auto-filled by academy if needed!)
  const userTeam = state.teams.find(t => t.id === state.userTeamId);
  const departed = [];
  for (const p of state.players) {
    if (p.teamId === state.userTeamId && p.contractYears <= 0) {
      p.teamId = null;
      p.isStarter = false;
      departed.push(p.name);
    }
  }
  if (departed.length) {
    for (const role of ROLES) {
      const has = state.players.some(p => p.teamId === state.userTeamId && p.role === role);
      if (!has) {
        const regen = generateRegenPlayer(role, userTeam.region, userTeam.facilities.youthAcademy, userTeam.id);
        regen.isStarter = true;
        state.players.push(regen);
      }
    }
    addInboxMessage(state, {
      title: `Bedelsiz Ayrılan Oyuncular (Free Agency)`,
      sender: 'Sportif Direktör',
      category: 'TRANSFER',
      body: `Sözleşmesi yenilenmeyen ${departed.join(', ')} serbest oyuncu oldu. Boşalan roller akademi oyuncularıyla dolduruldu.`,
    });
  }

  state.season++;
  setCalendarToMonday(state, 1, 10); // Early January of New Year!
  state.phase = 'SPRING_SPLIT';
  state.week = 1;
  state.patchIndex = 0;
  state.scrimIntel = {};
  state.academyPromotedThisSplit = false;
  const { schedules, standings } = createRegionalSchedules(state.teams);
  state.schedules = schedules;
  state.standings = standings;
  state.bracket = null;
  state.swiss = null;

  const np = getCurrentPatch(state);
  addInboxMessage(state, {
    title: `Sezon ${state.season} Başladı — Yama ${np.version}: ${np.name}`,
    sender: 'Lig Komitesi',
    category: 'NEWS',
    body: `Yeni yıl (${state.season}) fikstürü 7 bölgede çekildi! Yeni sezon metası: ${np.desc}`,
  });
}

// ==================== TRANSFERS, CHALLENGER SCOUTING & CLUB ====================
export function scoutChallengerProspect(state, prospectId) {
  const p = state.challengerPool.find(x => x.id === prospectId);
  const team = state.teams.find(t => t.id === state.userTeamId);
  if (!p) return { ok: false, reason: 'Oyuncu bulunamadı.' };
  if (p.scouted) return { ok: false, reason: 'Bu oyuncu zaten scoutlandı.' };
  ensureTeamExtras(team);
  const cost = (team.facilities.analystDesk >= 3 || team.staff.headScout >= 3) ? 0 : (team.staff.headScout >= 2 ? 7500 : 15000);
  if (team.budget < cost) return { ok: false, reason: `Scout raporu için ${formatMoney(cost)} gerekli.` };
  team.budget -= cost;
  p.scouted = true;
  return { ok: true, reason: `${p.name} scoutlandı! Gerçek Potansiyel: ${p.pot} (${p.trait})` };
}

export function signChallengerProspect(state, prospectId) {
  if (!isTransferWindowOpen(state)) return { ok: false, reason: 'Kadro Kilidi (Roster Lock) aktif! Transfer penceresi açılana kadar imza atılamaz.' };
  const idx = state.challengerPool.findIndex(x => x.id === prospectId);
  const team = state.teams.find(t => t.id === state.userTeamId);
  if (idx === -1) return { ok: false, reason: 'Oyuncu bulunamadı.' };
  const p = state.challengerPool[idx];
  if (team.budget < p.signingFee) return { ok: false, reason: `İmza bedeli için ${formatMoney(p.signingFee)} gerekli.` };

  team.budget -= p.signingFee;
  state.challengerPool.splice(idx, 1);
  if (state.players.some(x => x.id === p.id)) {
    p.id = `p_ch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }
  p.teamId = team.id;
  p.contractYears = 3;
  p.isStarter = false;
  p.teamGames = 0;
  p.scouted = true;
  if (p.lang !== REGION_LANG[team.region]) p.importWeeksLeft = 8;
  team.synergy = Math.max(20, +(team.synergy - 4).toFixed(1));
  state.players.push(p);

  addInboxMessage(state, {
    title: `Challenger Wonderkid İmzası: ${p.name}`,
    sender: 'Scouting Ekibi',
    category: 'TRANSFER',
    body: `${p.server} Challenger (${p.lp} LP) yeteneği ${p.name} (${p.age} yaş, ${p.role}, OVR ${p.ovr}/POT ${p.pot}) ${formatMoney(p.signingFee)} bedelle kadromuza katıldı!`,
  });
  return { ok: true, reason: `${p.name} kadroya katıldı!` };
}

export function getFreeAgentSigningBonus(player) {
  return Math.max(25000, Math.round((player.marketValue * 0.45) / 5000) * 5000);
}

export function evaluateTransferInterest(state, player, userTeam) {
  if (!player || !userTeam) return { level: 'NONE', label: 'İlgisiz', willing: false, salaryMult: 1, reason: 'Geçersiz oyuncu.' };
  const userReg = REGIONS.find(r => r.id === userTeam.region);
  const sellingTeam = player.teamId ? state.teams.find(t => t.id === player.teamId) : null;
  const sellReg = sellingTeam ? REGIONS.find(r => r.id === sellingTeam.region) : null;

  // Club allure grows with prestige, league level, manager reputation, and international trophies!
  const isUserTarget = userTeam.id === state.userTeamId;
  const mgrRepBonus = isUserTarget ? (((state.managerProfile?.reputation ?? 50) - 50) * 0.12) : 0;
  const userAllure = userTeam.prestige * 0.62 + (userReg?.prestige || 75) * 0.38 + Math.min(10, userTeam.trophies.length * 2.5) + mgrRepBonus;
  const sellAllure = sellingTeam ? (sellingTeam.prestige * 0.62 + (sellReg?.prestige || 75) * 0.38) : 72;

  // Free agents demand realistic club prestige + signing bonus + FA salary premium!
  if (!sellingTeam) {
    if (player.ovr >= 82 && userAllure < 82) {
      return {
        level: 'NONE', label: 'İlgisiz', willing: false, salaryMult: 1.5,
        reason: `${player.name} (OVR ${player.ovr}), kariyer hedefleri doğrultusunda ${userTeam.name} (${userTeam.region}) projesini reddetti.`,
      };
    }
    if (player.ovr >= 76 && userAllure < 77) {
      return {
        level: 'HARD', label: 'Zor', willing: true, salaryMult: 1.45,
        reason: `İmza parası ve yüksek maaş (+%45) karşılığında düşünebilir.`,
      };
    }
    return { level: 'HIGH', label: 'İlgili', willing: true, salaryMult: 1.2, reason: 'Görüşmeye açık (İmza parası + serbest oyuncu maaş primi talep eder).' };
  }

  // Contracted player checks
  const allureGap = sellAllure - userAllure; // positive means user club/league is weaker
  const isPrime = player.age <= 26;
  const isVeteran = player.age >= 28;
  const isUnhappyOrBench = !player.isStarter || player.morale < 65;

  // 1. Prime Superstars (89+ OVR) refuse dropping to significantly lower prestige clubs/leagues
  if (player.ovr >= 89 && allureGap > 6 && !isUnhappyOrBench) {
    return {
      level: 'NONE', label: 'İlgisiz', willing: false, salaryMult: 2.0,
      reason: `${player.name}, ${sellingTeam.region} seviyesinden ${userTeam.region} ligine düşmeyi kesinlikle reddetti (Kulüp/Lig prestiji yetersiz — MSI/Worlds başarısı gerekli).`,
    };
  }

  // 2. Strong Starters (84-88 OVR) in their prime won't downgrade massively unless benched/unhappy
  if (player.ovr >= 84 && isPrime && allureGap > 10 && !isUnhappyOrBench) {
    return {
      level: 'NONE', label: 'İlgisiz', willing: false, salaryMult: 1.8,
      reason: `${player.name}, kariyerinin zirvesinde ${userTeam.name} (${userTeam.region}) projesini yeterli bulmadı.`,
    };
  }

  // 3. Moderate downgrade or veteran payday -> HARD (demands 1.5x - 1.9x salary)
  if (allureGap > 4 && !isUnhappyOrBench) {
    const mult = isVeteran ? 1.55 : 1.75;
    return {
      level: 'HARD', label: 'Zor', willing: true, salaryMult: mult,
      reason: `${player.name} ikna olmak için çok yüksek bir maaş bekliyor.`,
    };
  }

  return { level: 'HIGH', label: 'İlgili', willing: true, salaryMult: 1.05, reason: 'Transfer görüşmesine açık.' };
}

export function attemptSignOrTransfer(state, playerId, offeredBuyout, offeredSalary, contractYears) {
  if (!isTransferWindowOpen(state)) return { ok: false, reason: 'Kadro Kilidi (Roster Lock) aktif! Transfer penceresi açılana kadar yeni oyuncu alınamaz.' };
  const player = state.players.find(p => p.id === playerId);
  const userTeam = state.teams.find(t => t.id === state.userTeamId);
  if (!player || !userTeam) return { ok: false, reason: 'Oyuncu bulunamadı.' };
  if (offeredBuyout > userTeam.budget) return { ok: false, reason: 'Yeterli transfer bütçen yok.' };

  // Enforce League Salary Cap with LCK-style Luxury Tax zone (up to 1.20x cap allowed with 2.5x weekly tax!)
  const currentCapHit = getTeamCapHit(state, userTeam.id);
  const wageCap = getTeamWageCap(userTeam);
  const hardLimit = Math.round(wageCap * 1.2);
  if (currentCapHit + offeredSalary > hardLimit) {
    const room = Math.max(0, hardLimit - currentCapHit);
    return {
      ok: false,
      reason: `Sert Maaş Tavanı + Lüks Vergisi Limiti (${formatMoney(hardLimit)}/hf) aşılıyor! Kalan limit: ${formatMoney(room)}/hf.`,
    };
  }

  // Enforce Riot 2-Import Rule (max 2 foreign-language imports per club)
  const teamLang = REGION_LANG[userTeam.region];
  const isImportSigning = Boolean(player.lang && teamLang && player.lang !== teamLang);
  if (isImportSigning) {
    const currentImports = state.players.filter(p => p.teamId === userTeam.id && p.lang && p.lang !== teamLang).length;
    if (currentImports >= 2) {
      return {
        ok: false,
        reason: `Riot Bölge Kuralı (Maks. 2 Yabancı Oyuncu): Kadroda zaten ${currentImports} yabancı dil konuşan oyuncu bulunuyor. Yeni yabancı transferi için önce bir yabancı oyuncuyu göndermelisin.`,
      };
    }
  }

  // Check realistic player willingness first!
  const interest = evaluateTransferInterest(state, player, userTeam);
  if (!interest.willing) {
    return { ok: false, reason: interest.reason };
  }

  // Superteam Spotlight / Resource Pushback: stacking 3+ 88+ OVR stars makes the next star demand a massive premium
  const existingStars = getTeamRoster(state, userTeam.id).filter(p => p.ovr >= 88).length;
  const starTax = (player.ovr >= 88 && existingStars >= 3) ? 1.35 : 1.0;

  const applyImportCheck = () => {
    if (isImportSigning) {
      player.importWeeksLeft = 8;
    } else {
      player.importWeeksLeft = 0;
    }
    player.teamGames = 0;
  };

  const valuation = getPlayerValuationDetails(state, player, userTeam);

  if (player.teamId && player.teamId !== userTeam.id) {
    const sellingTeam = state.teams.find(t => t.id === player.teamId);
    const minBuyout = valuation.minAcceptableBuyout;

    if (offeredBuyout < minBuyout) {
      if (valuation.clubStance === 'UNTOUCHABLE') {
        return {
          ok: false,
          reason: `${sellingTeam.name}, franchise yıldızı ${player.name}'ı bırakmak istemiyor (En az ~${formatMoney(minBuyout)} serbest kalma bedeli gerekli).`,
        };
      }
      return {
        ok: false,
        reason: `${sellingTeam.name}, bonservis teklifini düşük buldu (${valuation.clubStanceLabel}${valuation.sameRegionRival ? ' · lig rakibi primi dahil' : ''}) — en az ~${formatMoney(minBuyout)} istiyorlar.`,
      };
    }

    const minSalary = Math.round((player.salary * interest.salaryMult * starTax) / 500) * 500;
    if (offeredSalary < minSalary) {
      return {
        ok: false,
        reason: `${player.name}, ${userTeam.name} teklifini kabul etmek için haftalık en az ${formatMoney(minSalary)} maaş talep ediyor${starTax > 1 ? ' (kadroda çok fazla yıldız olduğu için ekstra güvence primi istiyor)' : ''}.`,
      };
    }

    const oldTeamId = player.teamId;
    userTeam.budget -= offeredBuyout;
    sellingTeam.budget += offeredBuyout;
    player.teamId = userTeam.id;
    player.salary = offeredSalary;
    player.contractYears = contractYears;
    player.isStarter = false;
    player.morale = 84;
    applyImportCheck();
    recalculatePlayerMarketValue(state, player, true);

    // Realistic Roster Churn Shock: bringing in a new star disrupts team chemistry!
    const synDrop = (isImportSigning ? 13 : 9) + (player.ovr >= 87 && existingStars >= 2 ? 6 : 0);
    userTeam.synergy = Math.max(20, +(userTeam.synergy - synDrop).toFixed(1));

    const sellingHasRole = state.players.some(p => p.teamId === oldTeamId && p.role === player.role);
    if (!sellingHasRole) {
      const replacement = state.players.filter(p => p.teamId === null && p.role === player.role).sort((a, b) => b.ovr - a.ovr)[0]
        || generateRegenPlayer(player.role, sellingTeam.region, sellingTeam.facilities.youthAcademy, oldTeamId);
      if (!state.players.includes(replacement)) state.players.push(replacement);
      replacement.teamId = oldTeamId; replacement.isStarter = true; replacement.contractYears = 2; replacement.teamGames = 0;
      recalculatePlayerMarketValue(state, replacement, false);
    }

    addInboxMessage(state, {
      title: `Transfer Tamamlandı: ${player.name}!`,
      sender: 'Sportif Direktör',
      category: 'TRANSFER',
      body: `${player.name}, ${sellingTeam.name} kulübünden ${formatMoney(offeredBuyout)} bonservisle katıldı! Takım sinerjisi yeni kadro adaptasyonu nedeniyle -${synDrop} etkilendi.${player.importWeeksLeft > 0 ? ' (Dil/iletişim uyumu için 8 hafta adaptasyon süreci olacak.)' : ''}`,
    });
    return { ok: true, reason: `${player.name} takıma katıldı! (Sinerji -${synDrop} — birlikte oynayarak yeniden inşa edilmeli)` };
  }

  const signingBonus = valuation.signingBonus;
  if (offeredBuyout < signingBonus) {
    return { ok: false, reason: `${player.name}, imza primi olarak en az ${formatMoney(signingBonus)} talep ediyor.` };
  }
  const actualBonus = Math.max(signingBonus, offeredBuyout);
  if (userTeam.budget < actualBonus) {
    return { ok: false, reason: `${player.name} imza parası (${formatMoney(actualBonus)}) için yeterli bütçen yok.` };
  }
  const minSalary = Math.round((player.salary * interest.salaryMult * starTax) / 500) * 500;
  if (offeredSalary < minSalary) return { ok: false, reason: `${player.name} haftalık en az ${formatMoney(minSalary)} maaş istiyor.` };
  userTeam.budget -= actualBonus;
  player.teamId = userTeam.id;
  player.salary = offeredSalary;
  player.contractYears = contractYears;
  player.isStarter = false;
  player.morale = 83;
  applyImportCheck();
  recalculatePlayerMarketValue(state, player, true);
  const faSynDrop = isImportSigning ? 10 : 7;
  userTeam.synergy = Math.max(20, +(userTeam.synergy - faSynDrop).toFixed(1));
  addInboxMessage(state, {
    title: `Serbest Transfer: ${player.name}`,
    sender: 'Sportif Direktör',
    category: 'TRANSFER',
    body: `Serbest oyuncu ${player.name} ile ${formatMoney(actualBonus)} imza parası ve ${contractYears} yıllık sözleşme imzalandı. (Takım uyumu -${faSynDrop})`,
  });
  return { ok: true, reason: `${player.name}, ${formatMoney(actualBonus)} imza parasıyla kadroya katıldı! (Sinerji -${faSynDrop})` };
}

export function setStarter(state, playerId) {
  const p = state.players.find(x => x.id === playerId);
  if (!p || p.teamId !== state.userTeamId) return;
  const wasStarter = p.isStarter;
  for (const mate of state.players) {
    if (mate.teamId === state.userTeamId && mate.role === p.role) mate.isStarter = (mate.id === p.id);
  }
  // Changing the starting 5 with an ungelled player causes realistic cohesion disruption
  if (!wasStarter) {
    const team = state.teams.find(t => t.id === state.userTeamId);
    if (team) {
      const gamesTogether = p.teamGames ?? 0;
      const drop = gamesTogether < 5 ? 6 : gamesTogether < 12 ? 3 : 1;
      team.synergy = Math.max(20, +(team.synergy - drop).toFixed(1));
    }
  }
}

export function renewContract(state, playerId, years = 2) {
  const p = state.players.find(x => x.id === playerId);
  const team = state.teams.find(t => t.id === state.userTeamId);
  if (!p || p.teamId !== team?.id) return { ok: false, reason: 'Oyuncu bulunamadı.' };
  const newSalary = Math.round((Math.max(p.salary, calcWeeklySalary(p.ovr, team.prestige)) * 1.08) / 500) * 500;
  return negotiateContractRenewal(state, playerId, newSalary, years, p.isStarter ? 'STAR' : 'ROTATION');
}

export function getRenewalDemand(state, playerId) {
  const p = state.players.find(x => x.id === playerId);
  const team = state.teams.find(t => t.id === state.userTeamId);
  if (!p || !team) return null;
  const base = Math.max(p.salary, calcWeeklySalary(p.ovr, team.prestige));
  const moraleMult = p.morale < 65 ? 1.18 : p.morale >= 85 ? 1.03 : 1.08;
  const minSalary = Math.round((base * moraleMult) / 500) * 500;
  const wantsStar = p.ovr >= 80 || p.trait === 'Ego' || p.isStarter;
  return { minSalary, wantsStar };
}

export function negotiateContractRenewal(state, playerId, offeredSalary, years = 2, rolePromise = 'STAR') {
  const p = state.players.find(x => x.id === playerId);
  const team = state.teams.find(t => t.id === state.userTeamId);
  if (!p || p.teamId !== team?.id) return { ok: false, reason: 'Oyuncu bulunamadı.' };
  const demand = getRenewalDemand(state, playerId);
  let reqSalary = demand.minSalary;
  if (demand.wantsStar && rolePromise !== 'STAR') {
    if (p.ovr >= 85 || p.trait === 'Ego') {
      return { ok: false, reason: `${p.name} ilk 5 (Yıldız Oyuncu) sözü olmadan yeni sözleşme imzalamayı reddetti!` };
    }
    reqSalary = Math.round((reqSalary * 1.15) / 500) * 500;
  }
  if (offeredSalary < reqSalary) {
    return { ok: false, reason: `${p.name} maaş teklifini düşük buldu (En az ${formatMoney(reqSalary)}/hf talep ediyor).` };
  }
  p.salary = offeredSalary;
  p.contractYears = Number(years) || 2;
  p.rolePromise = rolePromise;
  p.morale = Math.min(100, p.morale + 8);
  recalculatePlayerMarketValue(state, p, true);
  return { ok: true, reason: `${p.name} ile ${p.contractYears} yıllık yeni sözleşme imzalandı (${formatMoney(offeredSalary)}/hf, Rol: ${rolePromise === 'STAR' ? 'İlk 5 Yıldız' : 'Rotasyon'}).` };
}

export function renewAllExpiringContracts(state) {
  const expiring = state.players.filter(p => p.teamId === state.userTeamId && p.contractYears <= 1);
  if (expiring.length === 0) return { ok: false, reason: 'Sözleşmesi biten veya son yılına giren oyuncu yok.' };
  let count = 0;
  for (const p of expiring) {
    const demand = getRenewalDemand(state, p.id);
    if (!demand) continue;
    p.salary = demand.minSalary;
    p.contractYears = 2;
    p.rolePromise = demand.wantsStar ? 'STAR' : 'ROTATION';
    p.morale = Math.min(100, p.morale + 6);
    recalculatePlayerMarketValue(state, p, true);
    count++;
  }
  return { ok: true, reason: `${count} oyuncunun sözleşmesi 2 yıl olarak yenilendi!` };
}

// ==================== FM OFFER PLAYER TO CLUBS & SALE NEGOTIATION ====================
export function offerPlayerToClubs(state, playerId, askingPrice) {
  if (!isTransferWindowOpen(state)) {
    return { ok: false, reason: 'Kadro Kilidi (Roster Lock) aktif! Transfer penceresi açılana kadar satış yapılamaz.', offers: [] };
  }
  const p = state.players.find(x => x.id === playerId && x.teamId === state.userTeamId);
  const userTeam = state.teams.find(t => t.id === state.userTeamId);
  if (!p || !userTeam) return { ok: false, reason: 'Oyuncu kadroda bulunamadı.', offers: [] };

  const valInfo = getPlayerValuationDetails(state, p);
  const ask = Math.max(20000, Number(askingPrice) || valInfo.fairSaleValue);
  // Real FM valuation: age, form & contract leverage are already baked into marketValue; shopping signals willingness to sell
  const fairValue = valInfo.fairSaleValue;

  if (ask > fairValue * 1.32) {
    return {
      ok: true,
      reason: `İstediğin bonservis (${formatMoney(ask)}) piyasa talebinin üzerinde (gerçekçi değer ~${formatMoney(fairValue)}). Hiçbir kulüp teklif vermedi.`,
      offers: [],
    };
  }

  // Only clubs that genuinely NEED this player (real upgrade or elite wonderkid) & can afford them will bid!
  const interested = state.teams.filter(t => {
    if (t.id === userTeam.id) return false;
    if (t.budget < ask * 0.85) return false;
    const starter = getTeamRoster(state, t.id).find(x => x.role === p.role);
    const starterOvr = starter ? starter.ovr : 65;
    const isRealUpgrade = p.ovr >= starterOvr + 1;
    const isHotProspect = p.age <= 20 && p.pot >= starterOvr + 6;
    if (!isRealUpgrade && !isHotProspect) return false;

    // Cross-region & league prestige realism
    const sameReg = t.region === userTeam.region;
    if (!sameReg) {
      if ((t.region === 'LCK' || t.region === 'LPL') && p.ovr < 82 && !(p.age <= 20 && p.pot >= 89)) return false;
      if (p.ovr < 74 && !(p.age <= 20 && p.pot >= 84)) return false;
    }
    // Check player would even be willing to join buyer
    if (!evaluateTransferInterest(state, p, t).willing) return false;
    return true;
  }).sort((a, b) => {
    const sameA = a.region === userTeam.region ? 1 : 0;
    const sameB = b.region === userTeam.region ? 1 : 0;
    return (sameB - sameA) || (b.budget - a.budget);
  });

  // Not every player finds a buyer! Older/low-OVR players have real market friction
  const maxClubs = p.ovr >= 84 ? 3 : p.ovr >= 76 ? 2 : 1;
  const marketDemandChance = p.ovr >= 82 ? 0.92 : p.ovr >= 74 ? 0.68 : p.age >= 28 ? 0.35 : 0.48;
  const picked = [];
  for (const club of interested) {
    if (picked.length >= maxClubs) break;
    if (Math.random() < marketDemandChance) picked.push(club);
  }

  if (picked.length === 0) {
    return {
      ok: true,
      reason: `Şu an ${p.name} için ${formatMoney(ask)} bedelle ilgilenen kulüp çıkmadı. Fiyatı düşürebilir (${formatMoney(Math.round((fairValue * 0.72) / 5000) * 5000)} civarı) veya oyuncuyu serbest bırakabilirsin.`,
      offers: [],
    };
  }

  const offers = picked.map(club => {
    // Buyers negotiate from below fairValue (68%..90%) and cap tightly around 92%..108% of fairValue
    const baseRatio = 0.68 + Math.random() * 0.22;
    const amount = Math.min(
      ask,
      Math.floor(club.budget * 0.65),
      Math.max(20000, Math.round((fairValue * baseRatio) / 5000) * 5000)
    );
    const maxWilling = Math.min(
      Math.floor(club.budget * 0.72),
      Math.max(amount, Math.round((fairValue * (0.92 + Math.random() * 0.16)) / 5000) * 5000)
    );
    return {
      buyerTeamId: club.id,
      buyerName: club.name,
      buyerTag: club.tag,
      buyerRegion: club.region,
      buyerColor: club.color,
      buyerColor2: club.color2,
      amount,
      maxWilling,
      status: 'OPEN', // OPEN | COUNTERED | WALKED
      note: `${club.name} (${club.region}) teklif sundu.`,
    };
  });

  return { ok: true, reason: `${offers.length} kulüp ${p.name} için masaya oturdu.`, offers };
}

export function negotiateSaleCounter(offer, counterAmount) {
  const counter = Math.max(20000, Math.round((Number(counterAmount) || 0) / 5000) * 5000);
  if (offer.status === 'COUNTERED' && counter > offer.amount) {
    offer.status = 'WALKED';
    offer.note = 'Son teklifi reddettin — görüşmeden çekildiler.';
    return { ok: false, accepted: false, reason: `${offer.buyerName} son teklifinden yukarı çıkmayı reddetti ve masadan kalktı.` };
  }
  if (counter <= offer.amount) {
    offer.amount = counter;
    offer.status = 'OPEN';
    offer.note = 'Teklifini hemen kabul ettiler!';
    return { ok: true, accepted: true, reason: `${offer.buyerName}, ${formatMoney(counter)} teklifini kabul etti! Şimdi "Kabul Et & Sat" diyebilirsin.` };
  }
  if (counter <= offer.maxWilling) {
    offer.amount = counter;
    offer.status = 'COUNTERED';
    offer.note = `${formatMoney(counter)} kabul edildi (Son fiyat).`;
    return { ok: true, accepted: true, reason: `${offer.buyerName} pazarlığı kabul etti ve teklifini ${formatMoney(counter)} yaptı!` };
  }
  if (counter <= offer.maxWilling * 1.12) {
    const mid = Math.round(((offer.amount + offer.maxWilling) / 2) / 5000) * 5000;
    offer.amount = Math.max(offer.amount, mid);
    offer.status = 'COUNTERED';
    offer.note = `Son teklifleri: ${formatMoney(offer.amount)}`;
    return { ok: true, accepted: false, reason: `${offer.buyerName} o fiyata çıkmadı; son teklifleri ${formatMoney(offer.amount)}.` };
  }
  offer.status = 'WALKED';
  offer.note = 'Çok yüksek fiyat — masadan kalktılar.';
  return { ok: false, accepted: false, reason: `${offer.buyerName} istediğin fiyatı çok yüksek buldu ve masadan kalktı.` };
}

export function completePlayerSale(state, playerId, buyerTeamId, amount) {
  if (!isTransferWindowOpen(state)) return { ok: false, reason: 'Kadro Kilidi aktif, şu an satış yapılamaz.' };
  const p = state.players.find(x => x.id === playerId && x.teamId === state.userTeamId);
  const userTeam = state.teams.find(t => t.id === state.userTeamId);
  const buyer = state.teams.find(t => t.id === buyerTeamId);
  if (!p || !userTeam || !buyer) return { ok: false, reason: 'Satış bilgisi geçersiz.' };

  const sameRoleCount = state.players.filter(x => x.teamId === userTeam.id && x.role === p.role).length;
  if (sameRoleCount <= 1) {
    return { ok: false, reason: `${p.role} rolünde başka oyuncun yok! Önce yedek al veya Akademiden oyuncu çıkar.` };
  }

  userTeam.budget += amount;
  buyer.budget = Math.max(200000, buyer.budget - amount);
  p.teamId = buyer.id;
  p.isStarter = true;
  p.contractYears = 2;
  if (p.lang && p.lang !== REGION_LANG[buyer.region]) p.importWeeksLeft = 5;

  // Promote remaining user player in that role to starter
  const sub = state.players.find(x => x.teamId === userTeam.id && x.role === p.role);
  if (sub) sub.isStarter = true;

  // Remove any pending incoming offers for this player
  state.incomingOffers = (state.incomingOffers || []).filter(o => o.playerId !== p.id);

  ensureCalendarState(state);
  state.transferFeed.unshift({
    season: state.season,
    phase: getPhaseLabel(state.phase),
    buyerTag: buyer.tag,
    buyerColor: buyer.color,
    buyerColor2: buyer.color2,
    fromTag: userTeam.tag,
    playerName: p.name,
    role: p.role,
    ovr: p.ovr,
    fee: amount,
  });
  if (state.transferFeed.length > 35) state.transferFeed.pop();

  addInboxMessage(state, {
    title: `Oyuncu Satışı Tamamlandı: ${p.name} → ${buyer.name}`,
    sender: 'Sportif Direktör',
    category: 'TRANSFER',
    body: `${p.name} (${p.role}, OVR ${p.ovr}), ${formatMoney(amount)} bonservis bedeliyle ${buyer.name} (${buyer.region}) kulübüne satıldı!`,
  });
  return { ok: true, reason: `${p.name}, ${formatMoney(amount)} karşılığında ${buyer.name} kulübüne satıldı!` };
}

export function setPlayerIndividualTraining(state, playerId, indFocus, learningChampId) {
  const p = state.players.find(x => x.id === playerId);
  if (!p || p.teamId !== state.userTeamId) return { ok: false, reason: 'Oyuncu bulunamadı.' };
  p.indFocus = indFocus || null;
  if (learningChampId && learningChampId !== p.learningChampId) {
    if (p.sigChamps.includes(learningChampId)) {
      p.learningChampId = null;
      p.learningProgress = 0;
    } else {
      p.learningChampId = learningChampId;
      p.learningProgress = 0;
    }
  } else if (!learningChampId) {
    p.learningChampId = null;
    p.learningProgress = 0;
  }
  return { ok: true, reason: `${p.name} bireysel antrenman planı güncellendi.` };
}

export function applyPostMatchTeamTalk(state, talkType) {
  const roster = getTeamRoster(state, state.userTeamId);
  const team = state.teams.find(t => t.id === state.userTeamId);
  if (!team) return '';
  if (talkType === 'praise') {
    roster.forEach(p => { p.morale = Math.min(100, p.morale + 5); });
    team.synergy = Math.min(100, team.synergy + 1);
    return 'Takımı tebrik ettin: Moral +5, Sinerji +1.';
  }
  if (talkType === 'criticize') {
    roster.forEach(p => {
      p.form = Math.min(99, p.form + 3);
      p.morale = Math.max(30, p.morale + (p.trait === 'Tilt' ? -6 : -2));
    });
    return 'Sert eleştiri yaptın: Form +3 (disiplin artışı), bazı oyuncularda hafif moral düşüşü.';
  }
  // calm / reset
  roster.forEach(p => {
    p.morale = Math.min(100, p.morale + 2);
    p.fatigue = Math.max(0, p.fatigue - 4);
  });
  return 'Takımı sakinleştirdin: Yorgunluk -4, Moral +2.';
}

export function getBoardConfidence(state) {
  const team = state.teams.find(t => t.id === state.userTeamId);
  const standings = getSortedStandings(state, team.region);
  const rank = standings.findIndex(r => r.teamId === team.id) + 1;
  const row = standings[rank - 1] || { wins: 0, losses: 0 };
  let score = 70;
  if (rank === 1) score += 18;
  else if (rank === 2) score += 12;
  else if (rank <= 4) score += 4;
  else if (rank === 6) score -= 12;
  else if (rank >= 7) score -= 24;
  if (row.losses >= 4 && row.wins <= 1) score -= 12;
  if (team.budget < 0) score -= 14;
  if (team.trophies.length > 0) score += Math.min(12, team.trophies.length * 4);
  score = Math.max(18, Math.min(99, score));
  const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B+' : score >= 58 ? 'B' : score >= 45 ? 'C' : 'D';
  return { score, grade, rank };
}

export function buildJobOffers(state, excludeTeamId) {
  const curTeam = state.teams.find(t => t.id === excludeTeamId);
  const curP = curTeam?.prestige || 75;
  const maxP = Math.min(84, curP + 2);
  let candidates = state.teams
    .filter(t => t.id !== excludeTeamId && t.prestige <= maxP && t.prestige >= Math.max(60, curP - 10))
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);
  if (candidates.length < 3) {
    candidates = state.teams.filter(t => t.id !== excludeTeamId && t.prestige <= maxP).sort(() => Math.random() - 0.5).slice(0, 4);
  }
  return candidates.map(t => ({
    teamId: t.id,
    name: t.name,
    tag: t.tag,
    region: t.region,
    color: t.color,
    color2: t.color2,
    prestige: t.prestige,
    budget: t.budget,
    ovr: getTeamOVR(state, t.id),
  }));
}

export function evaluateBoardJobSecurity(state) {
  if (state.sackedState) return;
  if (state.phase !== 'SPRING_SPLIT' && state.phase !== 'SUMMER_SPLIT') return;
  if (state.week < 3) return; // Give at least 3 weeks grace period

  const conf = getBoardConfidence(state);
  const team = state.teams.find(t => t.id === state.userTeamId);
  const mgr = state.managerName || 'Koç';

  if (conf.score < 45) {
    state.boardWarnings = (state.boardWarnings || 0) + 1;
    if (state.boardWarnings === 1) {
      addInboxMessage(state, {
        title: `RESMİ ÜLTİMATOM — Yönetim Kurulu Uyarısı`,
        sender: `${team.name} Yönetim Kurulu`,
        category: 'BOARD',
        body: `${mgr}, takımın gidişatından ciddi şekilde endişeliyiz (Sıralama #${conf.rank}, Güven %${conf.score}). Önümüzdeki haftada toparlayamazsan görevine son verilecek!`,
      });
    } else if (state.boardWarnings >= 2) {
      state.sackedState = {
        resigned: false,
        oldTeamName: team.name,
        oldTeamTag: team.tag,
        reason: `Kötü lig performansı (#${conf.rank}, Güven %${conf.score}) nedeniyle ${team.name} Yönetim Kurulu sözleşmeni feshetti.`,
        offers: buildJobOffers(state, team.id),
      };
    }
  } else {
    state.boardWarnings = 0;
  }
}

export function resignFromClub(state) {
  const team = state.teams.find(t => t.id === state.userTeamId);
  state.sackedState = {
    resigned: true,
    oldTeamName: team.name,
    oldTeamTag: team.tag,
    reason: `${team.name} görevinden kendi isteğinle istifa ettin. Aşağıdaki kulüplerden biriyle yeni bir sayfa açabilirsin.`,
    offers: buildJobOffers(state, team.id),
  };
}

export function generateSuccessJobOffers(state) {
  const userTeam = state.teams.find(t => t.id === state.userTeamId);
  const conf = getBoardConfidence(state);
  const seasonStr = String(state.season);
  const wonIntlThisYear = userTeam.trophies.some(t => t.includes(seasonStr) && (t.startsWith('MSI') || t.startsWith('WORLDS')));
  const wonTrophyThisYear = userTeam.trophies.some(t => t.includes(seasonStr));
  if (!wonTrophyThisYear && conf.rank > 2 && conf.score < 82) {
    state.managerJobOffers = [];
    return;
  }

  // Realistic FM Coaching Ladder:
  // - Minor regions (TCL/LCO/CBLOL) step up to top minor clubs or bottom/mid LEC/LCS (NOT LCK/LPL giants unless you won MSI/Worlds!)
  // - Mid LEC/LCS step up to top LEC/LCS or lower LCK/LPL
  // - Top LEC/LCS & LCK/LPL step up to elite LCK/LPL contenders
  const isMinor = ['TCL', 'LCO', 'CBLOL'].includes(userTeam.region);
  const isWest = ['LEC', 'LCS'].includes(userTeam.region);

  const minP = userTeam.prestige >= 90 ? 88 : Math.max(68, userTeam.prestige + 1);
  const maxStep = wonIntlThisYear ? 14 : (wonTrophyThisYear ? 7 : 5);
  const hardCap = (isMinor && !wonIntlThisYear) ? 80 : (isWest && !wonIntlThisYear && userTeam.prestige < 84) ? 86 : 99;
  const maxP = userTeam.prestige >= 90 ? 99 : Math.min(hardCap, userTeam.prestige + maxStep);

  let cands = state.teams.filter(t => {
    if (t.id === userTeam.id) return false;
    if (t.prestige < minP || t.prestige > maxP) return false;
    // LCK & LPL clubs don't hire directly from TCL/LCO/CBLOL unless you won MSI/Worlds!
    if (isMinor && !wonIntlThisYear && (t.region === 'LCK' || t.region === 'LPL')) return false;
    return true;
  });

  if (cands.length === 0) {
    cands = state.teams.filter(t => {
      if (t.id === userTeam.id) return false;
      if (isMinor && !wonIntlThisYear && (t.region === 'LCK' || t.region === 'LPL')) return false;
      return t.prestige >= userTeam.prestige - 2 && t.prestige <= maxP + 2;
    });
  }

  // Prefer realistic geographic/tier progression (e.g. TCL -> LEC/LCS bottom-mid or top TCL/CBLOL)
  const picked = cands.sort(() => Math.random() - 0.5).slice(0, 3);
  state.managerJobOffers = picked.map(t => ({
    teamId: t.id,
    name: t.name,
    tag: t.tag,
    region: t.region,
    color: t.color,
    color2: t.color2,
    prestige: t.prestige,
    budget: t.budget,
    ovr: getTeamOVR(state, t.id),
  }));

  if (state.managerJobOffers.length) {
    const mgr = state.managerName || 'Koç';
    const names = state.managerJobOffers.map(o => `${o.name} (${o.region})`).join(', ');
    addInboxMessage(state, {
      title: `Başarılı Sezon Sonrası Sana Koçluk Teklifleri Geldi!`,
      sender: 'Menajerlik Ajansı',
      category: 'BOARD',
      body: `Tebrikler ${mgr}! Gösterdiğin performans kulüplerin dikkatini çekti. Şu kulüpler seni Baş Koç olarak istiyor: ${names}. Genel Bakış ekranından teklifleri değerlendirebilir veya ${userTeam.name} ile yola devam edebilirsin.`,
    });
  }
}

export function dismissManagerJobOffer(state, teamId) {
  state.managerJobOffers = (state.managerJobOffers || []).filter(o => o.teamId !== teamId);
}

export function acceptJobOffer(state, newTeamId) {
  const newTeam = state.teams.find(t => t.id === newTeamId);
  if (!newTeam) return;
  state.userTeamId = newTeam.id;
  if (!newTeam.sponsor) newTeam.sponsor = SPONSORS[0];
  state.boardWarnings = 0;
  state.sackedState = null;
  state.managerJobOffers = [];
  state.incomingOffers = [];
  const mgr = state.managerName || 'Koç';
  addInboxMessage(state, {
    title: `Yeni Görev: ${newTeam.name} Baş Koçluğu`,
    sender: `${newTeam.name} Yönetim Kurulu`,
    category: 'BOARD',
    body: `Hoş geldin ${mgr}! ${newTeam.name} (${newTeam.region}) ile yeni bir başlangıç yapıyorsun. Bütçen ${formatMoney(newTeam.budget)}. Başarılar!`,
  });
}

export function getTransferRoomOpportunities(state) {
  const userTeam = state.teams.find(t => t.id === state.userTeamId);
  return state.players
    .filter(p => p.teamId && p.teamId !== state.userTeamId && (p.contractYears <= 1 || p.morale < 75) && evaluateTransferInterest(state, p, userTeam).willing)
    .sort((a, b) => b.ovr - a.ovr)
    .slice(0, 8)
    .map(p => {
      const club = state.teams.find(t => t.id === p.teamId);
      const val = getPlayerValuationDetails(state, p, userTeam);
      const discountPrice = val.minAcceptableBuyout;
      return {
        player: p,
        club,
        discountPrice,
        reason: p.contractYears <= 1 ? 'Kontrat Son Yılı (İndirimli Bonservis)' : 'Kulüpte Mutsuz (Pazarlığa Açık)',
      };
    });
}

export function getLeagueStatLeaders(state, regionId) {
  const regTeams = new Set(state.teams.filter(t => t.region === regionId).map(t => t.id));
  const list = state.players.filter(p => regTeams.has(p.teamId) && p.stats.games > 0).map(p => {
    const team = state.teams.find(t => t.id === p.teamId);
    const kda = +((p.stats.kills + p.stats.assists) / Math.max(1, p.stats.deaths)).toFixed(2);
    const kpg = +(p.stats.kills / p.stats.games).toFixed(1);
    return { ...p, teamTag: team?.tag || '?', teamColor: team?.color || '#334155', teamColor2: team?.color2 || '#fff', kda, kpg };
  });
  return {
    byKda: [...list].sort((a, b) => b.kda - a.kda).slice(0, 5),
    byMvp: [...list].sort((a, b) => (b.stats.mvps - a.stats.mvps) || (b.kda - a.kda)).slice(0, 5),
  };
}

export function releasePlayer(state, playerId) {
  const p = state.players.find(x => x.id === playerId);
  if (!p || p.teamId !== state.userTeamId) return { ok: false, reason: 'Oyuncu bulunamadı.' };
  const sameRoleCount = state.players.filter(x => x.teamId === state.userTeamId && x.role === p.role).length;
  if (sameRoleCount <= 1) return { ok: false, reason: `Bu rolde (${p.role}) başka oyuncun yok! Önce yedek al.` };
  p.teamId = null; p.isStarter = false; p.contractYears = 0;
  recalculatePlayerMarketValue(state, p, true);
  const sub = state.players.find(x => x.teamId === state.userTeamId && x.role === p.role);
  if (sub) sub.isStarter = true;
  return { ok: true, reason: `${p.name} serbest bırakıldı.` };
}

export function promoteAcademyPlayer(state, role) {
  if (state.academyPromotedThisSplit) return { ok: false, reason: 'Bu mevsimde akademiden zaten bir oyuncu çıkardın.' };
  const team = state.teams.find(t => t.id === state.userTeamId);
  const regen = generateRegenPlayer(role, team.region, team.facilities.youthAcademy, team.id);
  state.players.push(regen);
  state.academyPromotedThisSplit = true;
  addInboxMessage(state, {
    title: `Akademiden Yükselen Yıldız: ${regen.name}`,
    sender: 'Akademi Koçu',
    category: 'NEWS',
    body: `${regen.age} yaşındaki ${regen.role} oyuncusu ${regen.name} (OVR ${regen.ovr}, POT ${regen.pot}) A takıma yükseltildi!`,
  });
  return { ok: true, player: regen };
}

export function playWeeklyScrim(state, opponentTeamId) {
  if (state.scrimDoneThisWeek) return { ok: false, reason: 'Bu hafta zaten hazırlık maçı (Scrim) yaptın.' };
  ensureCalendarState(state);
  const userTeam = state.teams.find(t => t.id === state.userTeamId);
  const oppTeam = state.teams.find(t => t.id === opponentTeamId);
  // Real Esports Scrim Gatekeeping: Elite LCK/LPL clubs reject low-prestige scrim requests unless Korean Bootcamp is active or Scrim Rep >= 72!
  const isEliteEastern = (oppTeam.region === 'LCK' || oppTeam.region === 'LPL') && oppTeam.prestige >= 88;
  const scrimRep = userTeam.scrimRep ?? Math.min(85, Math.max(52, userTeam.prestige - 8));
  if (isEliteEastern && userTeam.prestige < 78 && scrimRep < 72 && !(state.koreanBootcampWeeks > 0)) {
    return {
      ok: false,
      reason: `${oppTeam.name} (${oppTeam.region}) scrim teklifini reddetti! Elit LCK/LPL devleriyle scrim yapabilmek için Scrim İtibarın 72+ olmalı (Mevcut: ${scrimRep}) veya Kore Bootcamp'i başlatmalısın.`,
    };
  }
  const userRoster = getTeamRoster(state, userTeam.id);
  const oppRoster = getTeamRoster(state, oppTeam.id);
  const { match: m } = quickSimulateGame(userTeam, oppTeam, userRoster, oppRoster, getCurrentPatch(state));
  state.scrimDoneThisWeek = true;
  userTeam.scrimRep = Math.min(100, scrimRep + (m.winner === 'blue' ? 4 : 2));

  const won = m.winner === 'blue';
  const scrimSynGain = userTeam.synergy >= 80 ? (won ? 0.9 : 0.4) : (won ? 1.8 : 0.9);
  userTeam.synergy = Math.min(100, +(userTeam.synergy + scrimSynGain).toFixed(1));
  ensureTeamExtras(userTeam);
  // Scrim builds Duo Synergy, team cohesion & Champion Learning progress gradually!
  const jgl = userRoster.find(p => p.role === 'JGL');
  const mid = userRoster.find(p => p.role === 'MID');
  const bot = userRoster.find(p => p.role === 'BOT');
  const sup = userRoster.find(p => p.role === 'SUP');
  if (jgl && mid) {
    const k = getDuoPairKey(jgl.id, mid.id);
    userTeam.duoSynergy[k] = Math.min(30, +( (userTeam.duoSynergy[k] || 0) + 0.85 ).toFixed(2));
  }
  if (bot && sup) {
    const k = getDuoPairKey(bot.id, sup.id);
    userTeam.duoSynergy[k] = Math.min(30, +( (userTeam.duoSynergy[k] || 0) + 0.85 ).toFixed(2));
  }

  for (const p of userRoster) {
    const ageProf = getAgeFatigueProfile(p.age);
    p.teamGames = (p.teamGames ?? 10) + 0.5;
    p.form = Math.min(99, Math.max(45, p.form + (won ? 2 : 1)));
    const baseScrimFatigue = Math.max(3, 7 - ((userTeam.staff?.perfCoach || 1) - 1) * 1.5);
    p.fatigue = Math.min(100, Math.round(p.fatigue + baseScrimFatigue * ageProf.gainMult));
    if (p.learningChampId) p.learningProgress = Math.min(99, (p.learningProgress || 0) + 12);
    recalculatePlayerMarketValue(state, p, true);
  }

  // Unlock Scrim Intel against this opponent!
  const planMap = { aggressive: 'Erken Baskı', balanced: 'Dengeli', scaling: 'Scaling', split: 'Split-Push' };
  const topSigs = oppRoster.slice(0, 3).map(p => `${p.name}: ${CHAMPION_MAP[p.sigChamps[0]]?.name || p.sigChamps[0]}`).join(', ');
  state.scrimIntel[oppTeam.id] = {
    season: state.season,
    week: state.week,
    oppTag: oppTeam.tag,
    oppName: oppTeam.name,
    gameplan: planMap[oppTeam.tactics?.gameplan] || 'Dengeli',
    laneFocus: oppTeam.tactics?.laneFocus || 'MID',
    topSigs,
  };

  return {
    ok: true,
    won,
    text: `Scrim Sonucu: ${userTeam.tag} ${m.blueKills} - ${m.redKills} ${oppTeam.tag} (${m.minute} dk) — ${won ? `GALİBİYET (+${scrimSynGain} Sinerji, +2 Form)` : `MAĞLUBİYET (+${scrimSynGain} Sinerji, +1 Form)`} · ${oppTeam.tag} Taktik İstihbaratı Açıldı!`,
  };
}

export function upgradeStaff(state, staffKey) {
  const team = state.teams.find(t => t.id === state.userTeamId);
  ensureTeamExtras(team);
  const info = STAFF_INFO[staffKey];
  if (!info) return { ok: false, reason: 'Geçersiz personel.' };
  const lvl = team.staff[staffKey] || 1;
  if (lvl >= 3) return { ok: false, reason: 'Bu teknik ekip pozisyonu zaten maksimum seviyede (Sv. 3).' };
  const cost = info.costs[lvl];
  if (team.budget < cost) return { ok: false, reason: `Yetersiz bütçe (${formatMoney(cost)} gerekli).` };
  team.budget -= cost;
  team.staff[staffKey] = lvl + 1;
  return { ok: true, reason: `${info.name} Seviye ${lvl + 1} oldu! (Haftalık maaş: ${formatMoney(info.wages[lvl + 1])})` };
}

export function upgradeFacility(state, facilityKey) {
  const team = state.teams.find(t => t.id === state.userTeamId);
  const lvl = team.facilities[facilityKey];
  if (lvl >= 3) return { ok: false, reason: 'Bu tesis zaten maksimum seviyede (Sv. 3).' };
  const cost = FACILITY_INFO[facilityKey].costs[lvl];
  if (team.budget < cost) return { ok: false, reason: `Yetersiz bütçe (${formatMoney(cost)} gerekli).` };
  team.budget -= cost;
  team.facilities[facilityKey]++;
  return { ok: true, reason: `${FACILITY_INFO[facilityKey].name} Seviye ${lvl + 1} oldu!` };
}

function readAllSlots() {
  try {
    const raw = localStorage.getItem(SLOTS_KEY);
    const slots = raw ? JSON.parse(raw) : {};
    // Migrate legacy single save if autosave doesn't exist yet
    if (!slots.autosave) {
      const legacy = localStorage.getItem(SAVE_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (parsed && parsed.userTeamId) {
          slots.autosave = buildSlotRecord(parsed, 'Otomatik Kayıt');
          localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
        }
      }
    }
    return slots;
  } catch (e) {
    return {};
  }
}

function buildSlotRecord(state, customName) {
  const team = state.teams.find(t => t.id === state.userTeamId);
  const copy = { ...state, pendingEvent: null };
  return {
    name: customName || `${team?.name || 'Kariyer'} — S${state.season}`,
    managerName: state.managerName || 'Koç',
    savedAt: new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    teamName: team?.name || 'Bilinmeyen',
    teamTag: team?.tag || '?',
    teamColor: team?.color || '#38bdf8',
    teamColor2: team?.color2 || '#ffffff',
    region: team?.region || '',
    season: state.season,
    phaseLabel: getPhaseLabel(state.phase),
    week: state.week,
    ovr: getTeamOVR(state, state.userTeamId),
    budget: team?.budget || 0,
    data: copy,
  };
}

export function listSaveSlots() {
  const slots = readAllSlots();
  return SAVE_SLOT_IDS.map(id => ({
    slotId: id,
    label: id === 'autosave' ? 'Otomatik Kayıt' : `Kayıt Slotu ${id.replace('slot', '')}`,
    record: slots[id] || null,
  }));
}

export function saveToSlot(state, slotId, customName = '') {
  try {
    const slots = readAllSlots();
    const fallbackName = slotId === 'autosave' ? 'Otomatik Kayıt' : customName.trim();
    slots[slotId] = buildSlotRecord(state, fallbackName);
    try {
      localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
    } catch (quotaErr) {
      // Compact archive/inbox if localStorage nears 5MB quota on very long 2026..2100 saves!
      const compact = { ...state, inbox: (state.inbox || []).slice(0, 25), tournamentArchive: (state.tournamentArchive || []).slice(0, 8) };
      slots[slotId] = buildSlotRecord(compact, fallbackName);
      localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
    }
    return true;
  } catch (e) {
    console.error('Save slot failed', e);
    return false;
  }
}

export function loadFromSlot(slotId) {
  try {
    const slots = readAllSlots();
    const data = slots[slotId]?.data || null;
    if (data) ensureCalendarState(data);
    return data;
  } catch (e) {
    return null;
  }
}

export function deleteSaveSlot(slotId) {
  try {
    const slots = readAllSlots();
    delete slots[slotId];
    localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
    return true;
  } catch (e) {
    return false;
  }
}

export function saveGame(state) {
  return saveToSlot(state, 'autosave', 'Otomatik Kayıt');
}

export function loadGame() {
  return loadFromSlot('autosave') || listSaveSlots().find(s => s.record)?.record?.data || null;
}

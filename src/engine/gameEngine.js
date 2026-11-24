// LoL Esports Manager v2.0 — Career Engine (7 Regions, 16-Team Swiss Worlds, Drama Events, Challenger Scouting, AI Bids, Language Barrier & Awards)
import { PATCHES, CHAMPION_MAP } from '../data/champions.js';
import {
  ROLES, REGIONS, REGION_LANG, getRivalryName,
  createInitialDatabase, calcOVR, calcMarketValue, calcWeeklySalary,
  generateRegenPlayer, generateChallengerProspects
} from '../data/teamsAndPlayers.js';
import { quickSimulateGame, applyMatchOutcomeToPlayers } from './matchEngine.js';

export const SAVE_KEY = 'lol_esports_manager_save_v2';
export const SLOTS_KEY = 'lol_esports_manager_slots_v2';
export const SAVE_SLOT_IDS = ['autosave', 'slot1', 'slot2', 'slot3', 'slot4', 'slot5'];

export const SPONSORS = [
  { id: 'sp_safe', name: 'LogiTech Gear', weekly: 95000, bonus: 350000, goal: 'Playofflara Kal', minPrestige: 0, desc: 'Garanti yüksek haftalık gelir, düşük baskı.' },
  { id: 'sp_mid', name: 'RedBull Gaming', weekly: 155000, bonus: 750000, goal: 'Bölge Finali Oyna', minPrestige: 76, desc: 'Güçlü haftalık gelir ve bölge finali primi.' },
  { id: 'sp_elite', name: 'Mercedes-Benz Esports', weekly: 240000, bonus: 1500000, goal: 'MSI veya Worlds Kupası', minPrestige: 85, desc: 'Elit kulüpler için dev bütçe ve kupa primi.' },
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
  if (action === 'praise') {
    p.morale = Math.min(100, p.morale + 6);
    return { ok: true, reason: `${p.name} övgünden çok memnun oldu (Moral +6).` };
  }
  if (action === 'push') {
    p.form = Math.min(99, p.form + 4);
    p.morale = Math.max(30, p.morale - (p.trait === 'Grinder' ? 0 : 3));
    return { ok: true, reason: `${p.name} antrenman temposunu artırdı (Form +4${p.trait === 'Grinder' ? ', Grinder olduğu için moral kaybetmedi' : ', Moral -3'}).` };
  }
  // rest/calm
  p.fatigue = Math.max(0, p.fatigue - 8);
  p.morale = Math.min(100, p.morale + 3);
  return { ok: true, reason: `${p.name} üzerindeki baskı azaldı (Yorgunluk -8, Moral +3).` };
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

export function getTeamRoster(state, teamId) {
  const all = state.players.filter(p => p.teamId === teamId);
  const starters = [];
  for (const role of ROLES) {
    const st = all.find(p => p.role === role && p.isStarter) || all.find(p => p.role === role);
    if (st) {
      st.isStarter = true;
      starters.push(st);
    }
  }
  return starters;
}

export function getTeamOVR(state, teamId) {
  const roster = getTeamRoster(state, teamId);
  if (roster.length === 0) return 0;
  return Math.round(roster.reduce((s, p) => s + p.ovr, 0) / roster.length);
}

export function getTeamWeeklyWages(state, teamId) {
  const playerWages = state.players.filter(p => p.teamId === teamId).reduce((s, p) => s + p.salary, 0);
  const team = state.teams.find(t => t.id === teamId);
  if (!team) return playerWages;
  ensureTeamExtras(team);
  const staffWages = Object.entries(STAFF_INFO).reduce((s, [k, info]) => s + (info.wages[team.staff[k] || 1] || 0), 0);
  return playerWages + staffWages;
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

export function addInboxMessage(state, { title, sender, category, body }) {
  state.inbox.unshift({
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    date: `Sezon ${state.season} — ${getPhaseLabel(state.phase)} H${state.week}`,
    title, sender, category, body, read: false,
  });
  if (state.inbox.length > 70) state.inbox.pop();
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
  if (!state.currentDate) state.currentDate = `${state.season || 2026}-01-12`; // Monday
  if (!state.scrimIntel) state.scrimIntel = {};
  if (!state.transferFeed) state.transferFeed = [];
  if (!state.tournamentArchive) state.tournamentArchive = [];
  if (!state.managerJobOffers) state.managerJobOffers = [];
  if (!state.incomingOffers) state.incomingOffers = [];
  if (!state.recentEventIds) state.recentEventIds = [];
  if (!state.recentNewsIds) state.recentNewsIds = [];
  if (!state.financeLog) state.financeLog = [];
  if (!state.records) state.records = { careerWins: 0, careerLosses: 0, currentStreak: 0, bestStreak: 0, hallOfFame: [] };
  if (Array.isArray(state.teams)) state.teams.forEach(t => ensureTeamExtras(t));
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
  const dt = parseISO(iso || '2026-01-12');
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

  // Daily light recovery for user roster
  for (const p of state.players) {
    if (p.teamId === state.userTeamId) {
      p.fatigue = Math.max(0, p.fatigue - (newDow === 0 ? 4 : 1));
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
  const userTeam = teams.find(t => t.id === userTeamId);
  userTeam.sponsor = SPONSORS[0];
  teams.forEach(t => ensureTeamExtras(t));

  const state = {
    season: 2026,
    currentDate: '2026-01-12',
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
    history: [],
    awards: [],
    inbox: [],
  };

  addInboxMessage(state, {
    title: `Hoş Geldin ${cleanName} — ${userTeam.name} Görev Başlangıcı`,
    sender: 'Yönetim Kurulu',
    category: 'BOARD',
    body: `Hoş geldin ${cleanName}! ${userTeam.name} Genel Menajeri ve Baş Koçu olarak göreve başladın. Bütçen ${formatMoney(userTeam.budget)}. Hedefimiz ${userTeam.region} şampiyonluğu, MSI ve Worlds 2026 kupası!`,
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

export function getCurrentPatch(state) {
  const base = PATCHES[state.patchIndex % PATCHES.length];
  const yr = String(state.season || 2026).slice(-2);
  const sub = (state.patchIndex % PATCHES.length) + 1;
  // Procedurally shift meta slightly on future seasons (2027+) so every year feels fresh!
  const offset = (state.season - 2026) % PATCHES.length;
  const shifted = PATCHES[(state.patchIndex + offset) % PATCHES.length];
  return {
    ...shifted,
    version: `${yr}.${sub}`,
  };
}

export function getUserNextMatch(state) {
  const uid = state.userTeamId;
  const userTeam = state.teams.find(t => t.id === uid);

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

  // Career records & streak tracking for user team
  if (match.blueId === state.userTeamId || match.redId === state.userTeamId) {
    ensureCalendarState(state);
    if (match.winnerId === state.userTeamId) {
      state.records.careerWins++;
      state.records.currentStreak++;
      if (state.records.currentStreak > state.records.bestStreak) state.records.bestStreak = state.records.currentStreak;
    } else {
      state.records.careerLosses++;
      state.records.currentStreak = 0;
    }
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

  // Tuesday / Wednesday: Varied World & Club Stories (38% chance so inbox feels alive, not spammed)
  if (Math.random() > 0.38) return;
  const stories = [
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
  for (const team of state.teams) {
    ensureTeamExtras(team);
    const wages = getTeamWeeklyWages(state, team.id);
    const roster = state.players.filter(p => p.teamId === team.id);
    const streamerBonus = roster.filter(p => p.trait === 'Streamer').length * 18000;
    const fanIncome = team.fanbase * 950 + streamerBonus;
    const sponsorIncome = team.sponsor ? team.sponsor.weekly : 45000;
    const netCash = fanIncome + sponsorIncome - wages;
    team.budget += netCash;
    if (team.id === state.userTeamId) {
      state.financeLog.unshift({
        label: `S${state.season} ${getPhaseLabel(state.phase).split(' ')[0]} H${state.week}`,
        income: fanIncome + sponsorIncome,
        expenses: wages,
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
      // Injury / Burnout recovery
      if ((p.injuredWeeks || 0) > 0) {
        p.injuredWeeks = Math.max(0, p.injuredWeeks - 1);
        p.fatigue = Math.max(0, p.fatigue - 16);
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
        p.fatigue = Math.max(0, p.fatigue - 22 - team.facilities.gamingHouse * 3 - (perfLvl - 1) * 3);
        p.morale = Math.min(100, p.morale + 6 + psychBonus);
      } else {
        const netFatigue = -(6 + team.facilities.gamingHouse * 2 + (perfLvl - 1) * 2) + (focus === 'mechanics' ? 8 : 4) + intensityFatigue;
        p.fatigue = Math.max(0, Math.min(100, p.fatigue + netFatigue));

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
          else if (focus === 'macro') { p.attrs.macro = Math.min(99, p.attrs.macro + 1); p.attrs.teamfight = Math.min(99, p.attrs.teamfight + 1); team.synergy = Math.min(100, team.synergy + 1); }
          else if (focus === 'pool') { p.attrs.pool = Math.min(99, p.attrs.pool + 1); }
          else {
            const keys = Object.keys(p.attrs);
            const k = keys[Math.floor(Math.random() * keys.length)];
            p.attrs[k] = Math.min(99, p.attrs[k] + 1);
          }
          p.ovr = calcOVR(p.attrs);
          p.marketValue = calcMarketValue(p.ovr, p.age, p.pot);
        }
      }

      // Burnout / Wrist Strain injury risk when over-fatigued
      if (p.fatigue >= 82 && !(p.injuredWeeks > 0)) {
        const injChance = Math.max(0.03, (p.fatigue - 78) * 0.012 - (perfLvl - 1) * 0.035);
        if (Math.random() < injChance) {
          p.injuredWeeks = Math.random() < 0.6 ? 1 : 2;
          p.morale = Math.max(30, p.morale - 6);
          if (team.id === state.userTeamId) {
            addInboxMessage(state, {
              title: `SAĞLIK RAPORU: ${p.name} Bilek Zorlanması / Burnout`,
              sender: 'Performans & Sağlık Ekibi',
              category: 'BOARD',
              body: `${p.name} aşırı yorgunluk (%${p.fatigue}) nedeniyle ${p.injuredWeeks} hafta süreyle hafif bilek zorlanması / tükenmişlik yaşayacak. Yedek oyuncu oynatabilir veya antrenman yoğunluğunu düşürebilirsin.`,
            });
          }
        }
      }
    }
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
export function advanceWeekOrRound(state) {
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
      return;
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
      addInboxMessage(state, { title: 'Yaz Playoffları Başlıyor!', sender: 'Lig Komitesi', category: 'TOURNAMENT', body: 'Yaz Mevsimi bitti! Şimdi Worlds 2026 öncesi bölge finalleri!' });
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

    // Swiss Finished -> Top 8 to Knockout!
    const qualified = state.swiss.teams.filter(t => t.status === 'QUALIFIED').map(t => t.teamId);
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
  const finalMatches = state.bracket.rounds[state.bracket.rounds.length - 1].matches;

  if (state.phase === 'SPRING_PLAYOFFS') {
    const champs = [];
    const champByRegion = {};
    for (const fm of finalMatches) {
      const champ = state.teams.find(t => t.id === fm.winnerId);
      champ.budget += 300000;
      champ.trophies.push(`${state.season} ${fm.region} Bahar`);
      champs.push(`${fm.region}: ${champ.tag}`);
      champByRegion[fm.region] = champ.id;
    }
    state.patchIndex = (state.patchIndex + 1) % PATCHES.length;
    const msiPatch = getCurrentPatch(state);
    addInboxMessage(state, {
      title: `Bahar Şampiyonları Belli Oldu — MSI Yaması ${msiPatch.version} (${msiPatch.name})`,
      sender: 'Riot Esports',
      category: 'TOURNAMENT',
      body: `Bölge Şampiyonları: ${champs.join(' • ')}. MSI Özel Yaması (${msiPatch.version}): ${msiPatch.desc}`,
    });
    state.phase = 'MSI';
    state.week = 1;
    setCalendarToMonday(state, 5, 2); // May MSI!
    state.bracket = createMSIBracket(state, champByRegion);
    return;
  }

  if (state.phase === 'MSI') {
    const msiWinner = state.teams.find(t => t.id === finalMatches[0].winnerId);
    state.msiWinnerRegion = msiWinner.region;
    msiWinner.budget += 650000;
    msiWinner.prestige = Math.min(99, msiWinner.prestige + 2);
    msiWinner.trophies.push(`MSI ${state.season}`);
    const msiMvp = getTeamRoster(state, msiWinner.id).sort((a, b) => (b.stats.mvps * 10 + b.ovr) - (a.stats.mvps * 10 + a.ovr))[0];
    state.history.push({ season: state.season, event: 'MSI', winner: msiWinner.name, tag: msiWinner.tag, mvp: msiMvp?.name || '-' });

    state.patchIndex = (state.patchIndex + 1) % PATCHES.length;
    const { schedules, standings } = createRegionalSchedules(state.teams);
    state.schedules = schedules;
    state.standings = standings;
    state.bracket = null;
    state.phase = 'SUMMER_SPLIT';
    state.week = 1;
    setCalendarToMonday(state, 6, 5); // June Summer Split!
    state.academyPromotedThisSplit = false;
    state.challengerPool = generateChallengerProspects();
    const sumPatch = getCurrentPatch(state);

    addInboxMessage(state, {
      title: `MSI ${state.season} Şampiyonu: ${msiWinner.name} (Finals MVP: ${msiMvp?.name || '-'})`,
      sender: 'Riot Esports',
      category: 'TOURNAMENT',
      body: `${msiWinner.name} MSI kupasını kaldırdı ve ${msiWinner.region} bölgesine Worlds ${state.season} için +1 bonus slot kazandırdı! Yeni Yaz Yaması ${sumPatch.version} (${sumPatch.name}): ${sumPatch.desc}`,
    });
    return;
  }

  if (state.phase === 'SUMMER_PLAYOFFS') {
    const champs = [];
    for (const fm of finalMatches) {
      const champ = state.teams.find(t => t.id === fm.winnerId);
      champ.budget += 350000;
      champ.trophies.push(`${state.season} ${fm.region} Yaz`);
      champs.push(`${fm.region}: ${champ.tag}`);
    }
    state.patchIndex = 4;
    const { directIds, playInIds, playInBracket, bonusReg } = buildWorlds2026Qualification(state, finalMatches);
    state.worldsDirectIds = directIds;
    state.phase = 'WORLDS_PLAYIN';
    state.week = 1;
    setCalendarToMonday(state, 10, 2); // October Worlds Play-In!
    state.bracket = playInBracket;

    const uid = state.userTeamId;
    const userStatus = directIds.includes(uid)
      ? 'Tebrikler! Takımın Worlds İsviçre Aşaması\'na DOĞRUDAN katılmaya hak kazandı! Play-In maçları bitince sahneye çıkacaksın.'
      : playInIds.includes(uid)
        ? 'Takımın Worlds Ön Eleme (Play-In) bileti aldı! BO5 serisini kazanıp 16 takımlı İsviçre Aşaması\'na çıkmalısın.'
        : 'Maalesef bu sezon Worlds 2026 biletini kaçırdın. Turnuvayı dışarıdan takip edip Sezon Arası\'nda kadronu güçlendirebilirsin.';

    addInboxMessage(state, {
      title: `WORLDS ${state.season} Katılımcıları Belli Oldu (Ön Eleme Başlıyor)`,
      sender: 'Riot Esports',
      category: 'TOURNAMENT',
      body: `Yaz Şampiyonları: ${champs.join(' • ')}. MSI Bonus Slotu: ${bonusReg}. ${userStatus}`,
    });
    return;
  }

  if (state.phase === 'WORLDS_PLAYIN') {
    const winners = finalMatches.map(m => m.winnerId);
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
    worldsWinner.budget += 1500000;
    worldsWinner.prestige = Math.min(99, worldsWinner.prestige + 3);
    worldsWinner.trophies.push(`WORLDS ${state.season}`);
    const worldsMvp = getTeamRoster(state, worldsWinner.id).sort((a, b) => (b.stats.mvps * 12 + b.ovr) - (a.stats.mvps * 12 + a.ovr))[0];
    state.history.push({ season: state.season, event: 'WORLDS', winner: worldsWinner.name, tag: worldsWinner.tag, mvp: worldsMvp?.name || '-' });

    // Record Hall of Fame inductee
    ensureCalendarState(state);
    if (worldsMvp) {
      const existing = state.records.hallOfFame.find(h => h.name === worldsMvp.name);
      if (existing) { existing.titles++; existing.lastSeason = state.season; }
      else state.records.hallOfFame.unshift({ name: worldsMvp.name, role: worldsMvp.role, tag: worldsWinner.tag, titles: 1, lastSeason: state.season, note: `Worlds ${state.season} Finals MVP` });
      if (state.records.hallOfFame.length > 20) state.records.hallOfFame.pop();
    }

    const userTeam = state.teams.find(t => t.id === state.userTeamId);
    if (userTeam.sponsor && worldsWinner.id === userTeam.id) userTeam.budget += userTeam.sponsor.bonus;

    state.bracket = null;
    state.swiss = null;
    state.phase = 'OFFSEASON';
    state.week = 1;
    setCalendarToMonday(state, 11, 16); // Mid-November Off-Season Transfer Window!
    runOffSeasonProgression(state);
    generateSuccessJobOffers(state);
    // Rostermania: generate realistic off-season transfer bids for user's players!
    maybeGenerateIncomingOffer(state, 0.85);
    maybeGenerateIncomingOffer(state, 0.55);

    const mgr = state.managerName || 'Koç';
    addInboxMessage(state, {
      title: `WORLDS ${state.season} Şampiyonu: ${worldsWinner.name} (Finals MVP: ${worldsMvp?.name || '-'})`,
      sender: 'Riot Esports',
      category: 'TOURNAMENT',
      body: `${worldsWinner.id === userTeam.id ? `TEBRİKLER ${mgr}! Sihirdar Kupası'nı kaldırdın! ` : ''}${worldsWinner.name} WORLDS ${state.season} şampiyonu oldu (Finals MVP: ${worldsMvp?.name || '-'})! Şimdi Sezon Arası Transfer Penceresi açıldı; AI kulüpleri büyük transfer hamleleri yapıyor. Hazır olduğunda ${state.season + 1} sezonuna başlayabilirsin.`,
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
    }
  }
  return aiMoves;
}

function runOffSeasonProgression(state) {
  const retiredNames = [];
  const remainingPlayers = [];
  const expiringUserNames = [];

  // Annual Board Transfer Budget Allocation for all clubs!
  let userGrant = 0;
  for (const t of state.teams) {
    const grant = Math.round((t.prestige >= 90 ? 3500000 : t.prestige >= 82 ? 2500000 : t.prestige >= 75 ? 1800000 : 1300000) / 50000) * 50000;
    t.budget += grant;
    if (t.id === state.userTeamId) userGrant = grant;
  }
  if (userGrant > 0) {
    addInboxMessage(state, {
      title: `Yeni Sezon Transfer Bütçesi Onaylandı (+${formatMoney(userGrant)})`,
      sender: 'Yönetim Kurulu',
      category: 'BOARD',
      body: `Yönetim Kurulu, sezon arası transfer dönemi için kulüp kasasına +${formatMoney(userGrant)} yeni sezon bütçesi aktardı!`,
    });
  }

  for (const p of state.players) {
    p.age++;
    p.fatigue = 5;
    p.injuredWeeks = 0;
    p.stats = { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, mvps: 0 };

    const retireProb = p.age >= 35 ? 0.75 : p.age >= 33 ? 0.42 : p.age >= 32 ? 0.22 : 0;
    if (retireProb > 0 && p.teamId !== state.userTeamId && Math.random() < retireProb) {
      if (p.ovr >= 80) retiredNames.push(`${p.name} (${p.age})`);
      continue;
    }

    if (p.age <= 22 && p.ovr < p.pot) {
      for (const k of Object.keys(p.attrs)) p.attrs[k] = Math.min(99, p.attrs[k] + (Math.random() < 0.68 ? 2 : 1));
    } else if (p.age >= 29) {
      for (const k of Object.keys(p.attrs)) p.attrs[k] = Math.max(55, p.attrs[k] - (Math.random() < 0.55 ? 2 : 1));
    }
    p.ovr = calcOVR(p.attrs);
    p.marketValue = calcMarketValue(p.ovr, p.age, p.pot);
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
    remainingPlayers.push(p);
  }
  state.players = remainingPlayers;

  for (let i = 0; i < 25; i++) {
    const reg = REGIONS[i % REGIONS.length].id;
    state.players.push(generateRegenPlayer(ROLES[i % ROLES.length], reg, Math.random() < 0.3 ? 3 : 2, null));
  }
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
  p.scouted = true;
  if (p.lang !== REGION_LANG[team.region]) p.importWeeksLeft = 5;
  state.players.push(p);

  addInboxMessage(state, {
    title: `Challenger Wonderkid İmzası: ${p.name}`,
    sender: 'Scouting Ekibi',
    category: 'TRANSFER',
    body: `${p.server} Challenger (${p.lp} LP) yeteneği ${p.name} (${p.age} yaş, ${p.role}, OVR ${p.ovr}/POT ${p.pot}) ${formatMoney(p.signingFee)} bedelle kadromuza katıldı!`,
  });
  return { ok: true, reason: `${p.name} kadroya katıldı!` };
}

export function evaluateTransferInterest(state, player, userTeam) {
  if (!player || !userTeam) return { level: 'NONE', label: 'İlgisiz', willing: false, salaryMult: 1, reason: 'Geçersiz oyuncu.' };
  const userReg = REGIONS.find(r => r.id === userTeam.region);
  const sellingTeam = player.teamId ? state.teams.find(t => t.id === player.teamId) : null;
  const sellReg = sellingTeam ? REGIONS.find(r => r.id === sellingTeam.region) : null;

  // Club allure grows with prestige, league level, and international trophies!
  const userAllure = userTeam.prestige * 0.62 + (userReg?.prestige || 75) * 0.38 + Math.min(10, userTeam.trophies.length * 2.5);
  const sellAllure = sellingTeam ? (sellingTeam.prestige * 0.62 + (sellReg?.prestige || 75) * 0.38) : 72;

  // Free agents are more flexible, though elite superstars still want decent prestige
  if (!sellingTeam) {
    if (player.ovr >= 88 && userAllure < 82) {
      return {
        level: 'NONE', label: 'İlgisiz', willing: false, salaryMult: 1.5,
        reason: `${player.name} (OVR ${player.ovr}), kariyer hedefleri doğrultusunda ${userTeam.name} (${userTeam.region}) teklifini reddetti.`,
      };
    }
    if (player.ovr >= 83 && userAllure < 79) {
      return { level: 'HARD', label: 'Zor', willing: true, salaryMult: 1.45, reason: 'Yüksek maaş şartıyla düşünebilir.' };
    }
    return { level: 'HIGH', label: 'İlgili', willing: true, salaryMult: 1.0, reason: 'Görüşmeye açık.' };
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

  // Check realistic player willingness first!
  const interest = evaluateTransferInterest(state, player, userTeam);
  if (!interest.willing) {
    return { ok: false, reason: interest.reason };
  }

  const applyImportCheck = () => {
    if (player.lang && player.lang !== REGION_LANG[userTeam.region]) {
      player.importWeeksLeft = 5;
    } else {
      player.importWeeksLeft = 0;
    }
  };

  if (player.teamId && player.teamId !== userTeam.id) {
    const sellingTeam = state.teams.find(t => t.id === player.teamId);

    // Elite clubs refuse to sell untouchable franchise superstars with 2+ years left
    if (sellingTeam.prestige >= 88 && player.ovr >= 91 && player.isStarter && player.contractYears >= 2 && offeredBuyout < player.marketValue * 2.1) {
      return {
        ok: false,
        reason: `${sellingTeam.name}, kulübün franchise yıldızı ${player.name}'ı satılık listesine koymuyor (En az ~${formatMoney(Math.round(player.marketValue * 2.1 / 5000) * 5000)} serbest kalma bedeli gerekli).`,
      };
    }

    const minBuyout = Math.round(player.marketValue * (player.isStarter ? 1.2 : 0.85));
    if (offeredBuyout < minBuyout) return { ok: false, reason: `${sellingTeam.name}, teklifi düşük buldu (En az ~${formatMoney(minBuyout)} istiyorlar).` };
    const minSalary = Math.round((player.salary * interest.salaryMult) / 500) * 500;
    if (offeredSalary < minSalary) return { ok: false, reason: `${player.name}, ${userTeam.name} teklifini kabul etmek için haftalık en az ${formatMoney(minSalary)} maaş talep ediyor.` };

    const oldTeamId = player.teamId;
    userTeam.budget -= offeredBuyout;
    sellingTeam.budget += offeredBuyout;
    player.teamId = userTeam.id;
    player.salary = offeredSalary;
    player.contractYears = contractYears;
    player.isStarter = false;
    player.morale = 88;
    applyImportCheck();
    userTeam.synergy = Math.max(45, userTeam.synergy - 4);

    const sellingHasRole = state.players.some(p => p.teamId === oldTeamId && p.role === player.role);
    if (!sellingHasRole) {
      const replacement = state.players.filter(p => p.teamId === null && p.role === player.role).sort((a, b) => b.ovr - a.ovr)[0]
        || generateRegenPlayer(player.role, sellingTeam.region, sellingTeam.facilities.youthAcademy, oldTeamId);
      if (!state.players.includes(replacement)) state.players.push(replacement);
      replacement.teamId = oldTeamId; replacement.isStarter = true; replacement.contractYears = 2;
    }

    addInboxMessage(state, {
      title: `Transfer Tamamlandı: ${player.name}!`,
      sender: 'Sportif Direktör',
      category: 'TRANSFER',
      body: `${player.name}, ${sellingTeam.name} kulübünden ${formatMoney(offeredBuyout)} bonservisle katıldı!${player.importWeeksLeft > 0 ? ' (Dil/iletişim uyumu için 5 hafta adaptasyon süreci olacak.)' : ''}`,
    });
    return { ok: true, reason: `${player.name} takıma katıldı!` };
  }

  const minSalary = Math.round((player.salary * interest.salaryMult) / 500) * 500;
  if (offeredSalary < minSalary) return { ok: false, reason: `${player.name} haftalık en az ${formatMoney(minSalary)} maaş istiyor.` };
  player.teamId = userTeam.id;
  player.salary = offeredSalary;
  player.contractYears = contractYears;
  player.isStarter = false;
  player.morale = 86;
  applyImportCheck();
  addInboxMessage(state, {
    title: `Serbest Transfer: ${player.name}`,
    sender: 'Sportif Direktör',
    category: 'TRANSFER',
    body: `Serbest oyuncu ${player.name} ile ${contractYears} yıllık sözleşme imzalandı.`,
  });
  return { ok: true, reason: `${player.name} serbest transferle kadroya katıldı!` };
}

export function setStarter(state, playerId) {
  const p = state.players.find(x => x.id === playerId);
  if (!p || p.teamId !== state.userTeamId) return;
  for (const mate of state.players) {
    if (mate.teamId === state.userTeamId && mate.role === p.role) mate.isStarter = (mate.id === p.id);
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
  return { ok: true, reason: `${p.name} ile ${p.contractYears} yıllık yeni sözleşme imzalandı (${formatMoney(offeredSalary)}/hf, Rol: ${rolePromise === 'STAR' ? 'İlk 5 Yıldız' : 'Rotasyon'}).` };
}

export function renewAllExpiringContracts(state) {
  const expiring = state.players.filter(p => p.teamId === state.userTeamId && p.contractYears <= 0);
  if (expiring.length === 0) return { ok: false, reason: 'Sözleşmesi biten oyuncu yok.' };
  let count = 0;
  for (const p of expiring) {
    const demand = getRenewalDemand(state, p.id);
    if (!demand) continue;
    p.salary = demand.minSalary;
    p.contractYears = 2;
    p.rolePromise = demand.wantsStar ? 'STAR' : 'ROTATION';
    p.morale = Math.min(100, p.morale + 6);
    count++;
  }
  return { ok: true, reason: `${count} oyuncunun sözleşmesi 2 yıl daha uzatıldı!` };
}

// ==================== FM OFFER PLAYER TO CLUBS & SALE NEGOTIATION ====================
export function offerPlayerToClubs(state, playerId, askingPrice) {
  if (!isTransferWindowOpen(state)) {
    return { ok: false, reason: 'Kadro Kilidi (Roster Lock) aktif! Transfer penceresi açılana kadar satış yapılamaz.', offers: [] };
  }
  const p = state.players.find(x => x.id === playerId && x.teamId === state.userTeamId);
  const userTeam = state.teams.find(t => t.id === state.userTeamId);
  if (!p || !userTeam) return { ok: false, reason: 'Oyuncu kadroda bulunamadı.', offers: [] };

  const ask = Math.max(25000, Number(askingPrice) || p.marketValue);
  if (ask > p.marketValue * 1.85) {
    return { ok: true, reason: 'İstediğin bonservis piyasa değerinin çok üzerinde — hiçbir kulüp teklif vermedi. Fiyatı biraz düşür.', offers: [] };
  }

  const interested = state.teams.filter(t => {
    if (t.id === userTeam.id) return false;
    if (t.budget < ask * 0.72) return false;
    const starter = getTeamRoster(state, t.id).find(x => x.role === p.role);
    const starterOvr = starter ? starter.ovr : 70;
    const goodFit = p.ovr >= starterOvr - 3 || (p.age <= 21 && p.pot >= starterOvr + 3);
    if (!goodFit) return false;
    // Realistic league/prestige check
    if ((t.region === 'LCK' || t.region === 'LPL') && p.ovr < 81 && !(p.age <= 20 && p.pot >= 89)) return false;
    return true;
  }).sort((a, b) => {
    const sameA = a.region === userTeam.region ? 1 : 0;
    const sameB = b.region === userTeam.region ? 1 : 0;
    return (sameB - sameA) || (b.budget - a.budget);
  });

  const picked = interested.slice(0, 4);
  if (picked.length === 0) {
    return { ok: true, reason: 'Şu an bu fiyata talip olan bir kulüp çıkmadı. İstenen bedeli biraz düşürüp tekrar önerebilirsin.', offers: [] };
  }

  const offers = picked.map(club => {
    const ratio = ask / Math.max(25000, p.marketValue);
    const mult = ratio <= 0.9 ? 1.0 : ratio <= 1.15 ? (0.88 + Math.random() * 0.14) : (0.76 + Math.random() * 0.12);
    const amount = Math.min(Math.floor(club.budget * 0.8), Math.max(25000, Math.round((ask * mult) / 5000) * 5000));
    const maxWilling = Math.min(Math.floor(club.budget * 0.85), Math.round((p.marketValue * (1.18 + Math.random() * 0.18)) / 5000) * 5000);
    return {
      buyerTeamId: club.id,
      buyerName: club.name,
      buyerTag: club.tag,
      buyerRegion: club.region,
      buyerColor: club.color,
      buyerColor2: club.color2,
      amount,
      maxWilling: Math.max(amount, maxWilling),
      status: 'OPEN', // OPEN | COUNTERED | WALKED
      note: `${club.name} (${club.region}) masada!`,
    };
  });

  return { ok: true, reason: `${offers.length} kulüp ${p.name} için teklif sundu!`, offers };
}

export function negotiateSaleCounter(offer, counterAmount) {
  const counter = Math.max(25000, Math.round((Number(counterAmount) || 0) / 5000) * 5000);
  if (counter <= offer.amount) {
    offer.amount = counter;
    offer.status = 'OPEN';
    offer.note = 'Teklifini hemen kabul ettiler!';
    return { ok: true, accepted: true, reason: `${offer.buyerName}, ${formatMoney(counter)} teklifini kabul etti! Şimdi "Kabul Et & Sat" diyebilirsin.` };
  }
  if (counter <= offer.maxWilling) {
    offer.amount = counter;
    offer.status = 'OPEN';
    offer.note = `${formatMoney(counter)} kabul edildi!`;
    return { ok: true, accepted: true, reason: `${offer.buyerName} pazarlığı kabul etti ve teklifini ${formatMoney(counter)} seviyesine çıkardı!` };
  }
  if (counter <= offer.maxWilling * 1.18) {
    const mid = Math.round(((offer.amount + offer.maxWilling) / 2) / 5000) * 5000;
    offer.amount = Math.max(offer.amount, mid);
    offer.status = 'COUNTERED';
    offer.note = `Son teklifleri: ${formatMoney(offer.amount)}`;
    return { ok: true, accepted: false, reason: `${offer.buyerName} o kadar çıkmadı ama son teklifini ${formatMoney(offer.amount)} olarak güncelledi.` };
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
  const candidates = state.teams
    .filter(t => t.id !== excludeTeamId && t.prestige <= 86)
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);
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
  const wonTrophyThisYear = userTeam.trophies.some(t => t.includes(String(state.season)));
  if (!wonTrophyThisYear && conf.rank > 2 && conf.score < 82) {
    state.managerJobOffers = [];
    return;
  }

  // Step-up clubs: higher prestige than current club (or rival elite giants if already 90+)
  const minP = userTeam.prestige >= 90 ? 88 : userTeam.prestige + 2;
  const maxP = userTeam.prestige >= 90 ? 99 : Math.min(99, userTeam.prestige + 14 + (wonTrophyThisYear ? 5 : 0));

  let cands = state.teams.filter(t => t.id !== userTeam.id && t.prestige >= minP && t.prestige <= maxP);
  if (cands.length < 2) {
    cands = state.teams.filter(t => t.id !== userTeam.id && t.prestige >= userTeam.prestige - 2);
  }
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
      body: `Tebrikler ${mgr}! Gösterdiğin üstün performans büyük kulüplerin dikkatini çekti. Şu kulüpler seni Baş Koç olarak istiyor: ${names}. Genel Bakış ekranından teklifleri değerlendirebilir veya ${userTeam.name} ile yola devam edebilirsin.`,
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
    .slice(0, 6)
    .map(p => {
      const club = state.teams.find(t => t.id === p.teamId);
      const discountPrice = Math.round((p.marketValue * 0.78) / 5000) * 5000;
      return { player: p, club, discountPrice, reason: p.contractYears <= 1 ? 'Kontrat Son Yılı' : 'Düşük Moral' };
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
  const userRoster = getTeamRoster(state, userTeam.id);
  const oppRoster = getTeamRoster(state, oppTeam.id);
  const { match: m } = quickSimulateGame(userTeam, oppTeam, userRoster, oppRoster, getCurrentPatch(state));
  state.scrimDoneThisWeek = true;

  const won = m.winner === 'blue';
  userTeam.synergy = Math.min(100, userTeam.synergy + (won ? 4 : 2));
  ensureTeamExtras(userTeam);
  // Scrim builds Duo Synergy & Champion Learning progress too!
  const jgl = userRoster.find(p => p.role === 'JGL');
  const mid = userRoster.find(p => p.role === 'MID');
  const bot = userRoster.find(p => p.role === 'BOT');
  const sup = userRoster.find(p => p.role === 'SUP');
  if (jgl && mid) {
    const k = getDuoPairKey(jgl.id, mid.id);
    userTeam.duoSynergy[k] = Math.min(30, (userTeam.duoSynergy[k] || 0) + 1.5);
  }
  if (bot && sup) {
    const k = getDuoPairKey(bot.id, sup.id);
    userTeam.duoSynergy[k] = Math.min(30, (userTeam.duoSynergy[k] || 0) + 1.5);
  }

  for (const p of userRoster) {
    p.form = Math.min(99, Math.max(45, p.form + (won ? 3 : 1)));
    p.fatigue = Math.min(100, p.fatigue + Math.max(3, 7 - ((userTeam.staff?.perfCoach || 1) - 1) * 1.5));
    if (p.learningChampId) p.learningProgress = Math.min(99, (p.learningProgress || 0) + 12);
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
    text: `Scrim Sonucu: ${userTeam.tag} ${m.blueKills} - ${m.redKills} ${oppTeam.tag} (${m.minute} dk) — ${won ? 'GALİBİYET! (+4 Sinerji, +3 Form)' : 'MAĞLUBİYET (+2 Sinerji, +1 Form)'} • ${oppTeam.tag} Taktik İstihbaratı Açıldı!`,
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
    localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
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

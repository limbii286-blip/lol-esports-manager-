// LoL Esports Manager v2.0 — Career Engine (7 Regions, 16-Team Swiss Worlds, Drama Events, Challenger Scouting, AI Bids, Language Barrier & Awards)
import { PATCHES } from '../data/champions.js';
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
  { id: 'sp_safe', name: 'LogiTech Gear', weekly: 55000, bonus: 180000, goal: 'Playofflara Kal', minPrestige: 0, desc: 'Garanti haftalık gelir, düşük baskı.' },
  { id: 'sp_mid', name: 'RedBull Gaming', weekly: 85000, bonus: 400000, goal: 'Bölge Finali Oyna', minPrestige: 76, desc: 'Yüksek haftalık gelir ve final primi.' },
  { id: 'sp_elite', name: 'Mercedes-Benz Esports', weekly: 125000, bonus: 850000, goal: 'MSI veya Worlds Kupası', minPrestige: 85, desc: 'Elit kulüpler için dev bütçe ve kupa primi.' },
];

export const FACILITY_INFO = {
  gamingHouse: { name: 'Gaming House', desc: 'Oyuncu yorgunluğunu azaltır ve toparlanmayı hızlandırır.', costs: [0, 350000, 750000, 1400000] },
  analystDesk: { name: 'Analist Ekibi', desc: 'Maç içi performans, draft analizi ve Sv.3\'te ücretsiz Challenger scouting verir.', costs: [0, 400000, 850000, 1600000] },
  youthAcademy: { name: 'Gençlik Akademisi', desc: 'Daha yüksek potansiyelli genç yetenekler üretir.', costs: [0, 300000, 650000, 1200000] },
  psychologist: { name: 'Spor Psikoloğu', desc: 'Moral düşüşlerini önler ve dil/uyum sürecini hızlandırır.', costs: [0, 280000, 600000, 1100000] },
};

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
  return state.players.filter(p => p.teamId === teamId).reduce((s, p) => s + p.salary, 0);
}

function generateRoundRobin(teamIds) {
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
        bestOf: 3,
        fearless: true,
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
    schedules[reg.id] = generateRoundRobin(rTeams.map(t => t.id));
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

export function getPhaseLabel(phase) {
  const map = {
    SPRING_SPLIT: 'Bahar Mevsimi',
    SPRING_PLAYOFFS: 'Bahar Playoff',
    MSI: 'MSI Uluslararası',
    SUMMER_SPLIT: 'Yaz Mevsimi',
    SUMMER_PLAYOFFS: 'Yaz Playoff',
    WORLDS_SWISS: 'WORLDS İsviçre Aşaması',
    WORLDS_KNOCKOUT: 'WORLDS Eleme Aşaması',
    OFFSEASON: 'Sezon Arası & Transfer',
  };
  return map[phase] || phase;
}

export function createNewCareer(userTeamId) {
  const { teams, players } = createInitialDatabase();
  const { schedules, standings } = createRegionalSchedules(teams);
  const userTeam = teams.find(t => t.id === userTeamId);
  userTeam.sponsor = SPONSORS[0];

  const state = {
    season: 2026,
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
    bracket: null,   // Playoffs / MSI / Worlds Knockout
    challengerPool: generateChallengerProspects(),
    incomingOffers: [],
    pendingEvent: null,
    scrimDoneThisWeek: false,
    academyPromotedThisSplit: false,
    history: [],
    awards: [],
    inbox: [],
  };

  addInboxMessage(state, {
    title: `${userTeam.name} Yönetim Kurulu'na Hoş Geldin!`,
    sender: 'Yönetim Kurulu',
    category: 'BOARD',
    body: `${userTeam.name} Genel Menajeri ve Baş Koçu olarak göreve başladın. Bütçen ${formatMoney(userTeam.budget)}. Fearless Draft aktif! Hedefimiz ${userTeam.region} şampiyonluğu, MSI ve 16 takımlı Worlds kupası!`,
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
  return PATCHES[state.patchIndex % PATCHES.length];
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

// ==================== DRAMA & PRESS CONFERENCE EVENTS ====================
function maybeTriggerDramaEvent(state) {
  if (state.pendingEvent || Math.random() > 0.42) return;
  const team = state.teams.find(t => t.id === state.userTeamId);
  const roster = getTeamRoster(state, team.id);
  const p1 = roster[Math.floor(Math.random() * roster.length)];
  const p2 = roster.find(p => p.id !== p1.id) || p1;

  const templates = [
    {
      title: 'Gece Yarısı Yayın Krizi',
      desc: `${p1.name}, önemli maç haftasında sabah 4'e kadar SoloQ yayını yaptığı için antrenmana uykusuz geldi. Nasıl tepki vereceksin?`,
      choices: [
        { label: 'Para Cezası & Disiplin (Form +2, Moral -8, Bütçe +$15K)', effect: () => { p1.form = Math.min(99, p1.form + 2); p1.morale = Math.max(30, p1.morale - 8); team.budget += 15000; } },
        { label: 'Birebir Uyarı Konuşması (Yorgunluk -5, Moral -2)', effect: () => { p1.fatigue = Math.max(0, p1.fatigue - 5); p1.morale = Math.max(30, p1.morale - 2); } },
        { label: 'Görmezden Gel (Taraftar +2, Yorgunluk +8)', effect: () => { team.fanbase = Math.min(100, team.fanbase + 2); p1.fatigue = Math.min(100, p1.fatigue + 8); } },
      ],
    },
    {
      title: 'Scrim Sonrası Tartışma',
      desc: `Scrim değerlendirmesinde ${p1.name} ve ${p2.name} harita çağrısı yüzünden sertçe tartıştı. Takım atmosferi gergin!`,
      choices: [
        { label: 'Takım Yemeği Düzenle (-$20K, Sinerji +5, Moral +6)', effect: () => { team.budget -= 20000; team.synergy = Math.min(100, team.synergy + 5); roster.forEach(p => { p.morale = Math.min(100, p.morale + 6); }); } },
        { label: `${p1.name}'ı Haklı Bul (${p1.name} Moral +6, ${p2.name} Moral -7)`, effect: () => { p1.morale = Math.min(100, p1.morale + 6); p2.morale = Math.max(30, p2.morale - 7); } },
        { label: 'Profesyonel Kalın Deyip Kapat (Sinerji -2)', effect: () => { team.synergy = Math.max(40, team.synergy - 2); } },
      ],
    },
    {
      title: 'Basın Toplantısı & Trash Talk',
      desc: `Rakip koç, röportajda ${team.name} için "Sadece şansla kazanıyorlar, bizi asla yenemezler" dedi. Mikrofon sende!`,
      choices: [
        { label: 'Sert Trash Talk Yap (Taraftar +3, Takım Moral +5)', effect: () => { team.fanbase = Math.min(100, team.fanbase + 3); roster.forEach(p => { p.morale = Math.min(100, p.morale + 5); }); } },
        { label: 'Vadi\'de Cevap Vereceğiz (Sinerji +3, Form +2)', effect: () => { team.synergy = Math.min(100, team.synergy + 3); roster.forEach(p => { p.form = Math.min(99, p.form + 2); }); } },
      ],
    },
    {
      title: 'Sponsor Reklam Çekimi',
      desc: `Ana sponsorunuz hafta ortasında tam günlük reklam çekimi talep ediyor. Kabul ederseniz nakit prim var ama antrenman aksayacak.`,
      choices: [
        { label: 'Çekimi Kabul Et (Bütçe +$85K, Yorgunluk +9)', effect: () => { team.budget += 85000; roster.forEach(p => { p.fatigue = Math.min(100, p.fatigue + 9); }); } },
        { label: 'Reddet & Antrenmana Odaklan (Form +3, Sinerji +2)', effect: () => { team.synergy = Math.min(100, team.synergy + 2); roster.forEach(p => { p.form = Math.min(99, p.form + 3); }); } },
      ],
    },
  ];

  const chosen = templates[Math.floor(Math.random() * templates.length)];
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
function maybeGenerateIncomingOffer(state) {
  if (state.incomingOffers.length >= 2 || Math.random() > 0.28) return;
  const userPlayers = state.players.filter(p => p.teamId === state.userTeamId);
  if (userPlayers.length === 0) return;
  const target = userPlayers[Math.floor(Math.random() * userPlayers.length)];
  const buyers = state.teams.filter(t => t.id !== state.userTeamId && t.budget >= target.marketValue * 0.9);
  if (buyers.length === 0) return;
  const buyer = buyers[Math.floor(Math.random() * buyers.length)];
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
  state.scrimDoneThisWeek = false;
  for (const team of state.teams) {
    const wages = getTeamWeeklyWages(state, team.id);
    const roster = state.players.filter(p => p.teamId === team.id);
    const streamerBonus = roster.filter(p => p.trait === 'Streamer').length * 18000;
    const fanIncome = team.fanbase * 950 + streamerBonus;
    const sponsorIncome = team.sponsor ? team.sponsor.weekly : 45000;
    team.budget += (fanIncome + sponsorIncome - wages);
    if (team.id !== state.userTeamId && team.budget < 250000) team.budget = 250000;

    const focus = team.trainingFocus || 'balanced';
    for (const p of roster) {
      // Language adaptation decay
      if (p.importWeeksLeft > 0) {
        p.importWeeksLeft = Math.max(0, p.importWeeksLeft - (team.facilities.psychologist >= 2 ? 2 : 1));
      }
      // Ego players dislike being benched
      if (p.trait === 'Ego' && !p.isStarter) {
        p.morale = Math.max(25, p.morale - 6);
      }

      const grinderMult = p.trait === 'Grinder' ? 1.4 : 1.0;
      const growthChance = (p.ovr < p.pot ? (p.age <= 21 ? 0.35 : p.age <= 24 ? 0.22 : 0.10) : 0.03) * grinderMult;
      const psychBonus = (team.facilities.psychologist - 1) * 1.5;

      if (focus === 'rest') {
        p.fatigue = Math.max(0, p.fatigue - 22 - team.facilities.gamingHouse * 3);
        p.morale = Math.min(100, p.morale + 6 + psychBonus);
      } else {
        p.fatigue = Math.max(0, p.fatigue - (6 + team.facilities.gamingHouse * 2) + (focus === 'mechanics' ? 8 : 4));
        if (Math.random() < growthChance) {
          if (focus === 'mechanics') { p.attrs.mechanics = Math.min(99, p.attrs.mechanics + 1); p.attrs.laning = Math.min(99, p.attrs.laning + 1); }
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
    }
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

function createWorldsSwissStage(state) {
  // 16 Teams: Top 3 LCK/LPL/LEC/LCS (12) + TCL #1 + CBLOL #1, #2 + LCO #1
  const picks = [
    ...getSortedStandings(state, 'LCK').slice(0, 3),
    ...getSortedStandings(state, 'LPL').slice(0, 3),
    ...getSortedStandings(state, 'LEC').slice(0, 3),
    ...getSortedStandings(state, 'LCS').slice(0, 3),
    ...getSortedStandings(state, 'TCL').slice(0, 1),
    ...getSortedStandings(state, 'CBLOL').slice(0, 2),
    ...getSortedStandings(state, 'LCO').slice(0, 1),
  ];

  const swissTeams = picks.map(r => ({
    teamId: r.teamId,
    wins: 0,
    losses: 0,
    status: 'ACTIVE', // ACTIVE | QUALIFIED | ELIMINATED
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
    maybeTriggerDramaEvent(state);
    maybeGenerateIncomingOffer(state);

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
      state.bracket = createRegionalPlayoffsBracket(state, `Sezon ${state.season} Bahar Playoffları`);
      addInboxMessage(state, { title: 'Bahar Playoffları Başlıyor!', sender: 'Lig Komitesi', category: 'TOURNAMENT', body: '7 bölgede ilk 4 takımlar BO5 Playoff ve MSI bileti için sahneye çıkıyor!' });
    } else {
      awardSplitHonors(state, 'Yaz');
      state.phase = 'SUMMER_PLAYOFFS';
      state.week = 1;
      state.bracket = createRegionalPlayoffsBracket(state, `Sezon ${state.season} Yaz Playoffları`);
      addInboxMessage(state, { title: 'Yaz Playoffları Başlıyor!', sender: 'Lig Komitesi', category: 'TOURNAMENT', body: 'Yaz Mevsimi bitti! Şimdi 16 takımlı Worlds İsviçre Aşaması öncesi bölge finalleri!' });
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

function finishBracketAndTransition(state) {
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
    addInboxMessage(state, {
      title: 'Bahar Şampiyonları Belli Oldu — MSI Başlıyor!',
      sender: 'Riot Esports',
      category: 'TOURNAMENT',
      body: `Bölge Şampiyonları: ${champs.join(' • ')}. Şimdi 7 bölgenin şampiyonu + LCK #2 MSI kupası için karşı karşıya!`,
    });
    state.phase = 'MSI';
    state.week = 1;
    state.bracket = createMSIBracket(state, champByRegion);
    return;
  }

  if (state.phase === 'MSI') {
    const msiWinner = state.teams.find(t => t.id === finalMatches[0].winnerId);
    msiWinner.budget += 650000;
    msiWinner.prestige = Math.min(99, msiWinner.prestige + 2);
    msiWinner.trophies.push(`MSI ${state.season}`);
    state.history.push({ season: state.season, event: 'MSI', winner: msiWinner.name, tag: msiWinner.tag });

    state.patchIndex = (state.patchIndex + 1) % PATCHES.length;
    const { schedules, standings } = createRegionalSchedules(state.teams);
    state.schedules = schedules;
    state.standings = standings;
    state.bracket = null;
    state.phase = 'SUMMER_SPLIT';
    state.week = 1;
    state.academyPromotedThisSplit = false;
    state.challengerPool = generateChallengerProspects();

    addInboxMessage(state, {
      title: `MSI ${state.season} Şampiyonu: ${msiWinner.name}!`,
      sender: 'Riot Esports',
      category: 'TOURNAMENT',
      body: `${msiWinner.name} MSI kupasını kaldırdı! Yeni Yama ${getCurrentPatch(state).version} ve taze SoloQ Challenger genç yetenekleriyle Yaz Mevsimi başlıyor.`,
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
    state.bracket = null;
    state.phase = 'WORLDS_SWISS';
    state.week = 1;
    state.swiss = createWorldsSwissStage(state);

    addInboxMessage(state, {
      title: `WORLDS ${state.season} — 16 Takımlı İsviçre Aşaması Başlıyor`,
      sender: 'Riot Esports',
      category: 'TOURNAMENT',
      body: `Yaz Şampiyonları: ${champs.join(' • ')}. 3 galibiyet alan Çeyrek Final'e çıkar, 3 mağlubiyet alan elenir!`,
    });
    return;
  }

  if (state.phase === 'WORLDS_KNOCKOUT') {
    const worldsWinner = state.teams.find(t => t.id === finalMatches[0].winnerId);
    worldsWinner.budget += 1500000;
    worldsWinner.prestige = Math.min(99, worldsWinner.prestige + 3);
    worldsWinner.trophies.push(`WORLDS ${state.season}`);
    state.history.push({ season: state.season, event: 'WORLDS', winner: worldsWinner.name, tag: worldsWinner.tag });

    const userTeam = state.teams.find(t => t.id === state.userTeamId);
    if (userTeam.sponsor && worldsWinner.id === userTeam.id) userTeam.budget += userTeam.sponsor.bonus;

    state.bracket = null;
    state.swiss = null;
    state.phase = 'OFFSEASON';
    state.week = 1;
    runOffSeasonProgression(state);

    addInboxMessage(state, {
      title: `WORLDS ${state.season} Şampiyonu: ${worldsWinner.name}`,
      sender: 'Riot Esports',
      category: 'TOURNAMENT',
      body: `${worldsWinner.name} Sihirdar Kupası'nı kazandı! Sezon arası transfer dönemi açıldı, AI takımları transfer hamlelerini yapıyor ve yeni Challenger yetenekleri ortaya çıktı.`,
    });
  }
}

function runOffSeasonProgression(state) {
  for (const p of state.players) {
    p.age++;
    p.fatigue = 5;
    p.stats = { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, mvps: 0 };

    if (p.age <= 22 && p.ovr < p.pot) {
      for (const k of Object.keys(p.attrs)) p.attrs[k] = Math.min(99, p.attrs[k] + (Math.random() < 0.65 ? 2 : 1));
    } else if (p.age >= 29) {
      for (const k of Object.keys(p.attrs)) p.attrs[k] = Math.max(55, p.attrs[k] - (Math.random() < 0.55 ? 2 : 1));
    }
    p.ovr = calcOVR(p.attrs);
    p.marketValue = calcMarketValue(p.ovr, p.age, p.pot);
    p.salary = calcWeeklySalary(p.ovr);

    if (p.teamId) {
      p.contractYears--;
      if (p.contractYears <= 0 && p.teamId !== state.userTeamId) {
        if (Math.random() < 0.72) p.contractYears = 2;
        else { p.teamId = null; p.isStarter = false; }
      }
    }
  }

  // Generate fresh regens + refresh Challenger pool
  for (let i = 0; i < 14; i++) {
    const reg = REGIONS[i % REGIONS.length].id;
    state.players.push(generateRegenPlayer(ROLES[i % ROLES.length], reg, 2, null));
  }
  state.challengerPool = generateChallengerProspects();

  // AI-to-AI Off-Season Transfers!
  const aiMoves = [];
  for (const team of state.teams) {
    if (team.id === state.userTeamId) continue;
    for (const role of ROLES) {
      const has = state.players.some(p => p.teamId === team.id && p.role === role);
      if (!has) {
        const fa = state.players.filter(p => p.teamId === null && p.role === role).sort((a, b) => b.ovr - a.ovr)[0];
        if (fa) {
          fa.teamId = team.id; fa.isStarter = true; fa.contractYears = 2;
          if (aiMoves.length < 5) aiMoves.push(`${team.tag} → ${fa.name} (${fa.role}, ${fa.ovr})`);
        }
      }
    }
  }
  if (aiMoves.length) {
    addInboxMessage(state, {
      title: 'Sezon Arası Transfer Özeti',
      sender: 'Esports Insider',
      category: 'TRANSFER',
      body: `Öne çıkan AI transferleri: ${aiMoves.join(' • ')}`,
    });
  }
}

export function startNewSeason(state) {
  state.season++;
  state.phase = 'SPRING_SPLIT';
  state.week = 1;
  state.patchIndex = 0;
  state.academyPromotedThisSplit = false;
  const { schedules, standings } = createRegionalSchedules(state.teams);
  state.schedules = schedules;
  state.standings = standings;
  state.bracket = null;
  state.swiss = null;

  addInboxMessage(state, {
    title: `Sezon ${state.season} Başladı!`,
    sender: 'Lig Komitesi',
    category: 'NEWS',
    body: `7 bölgede yeni sezon fikstürü çekildi. Bahar Mevsimi'nde başarılar!`,
  });
}

// ==================== TRANSFERS, CHALLENGER SCOUTING & CLUB ====================
export function scoutChallengerProspect(state, prospectId) {
  const p = state.challengerPool.find(x => x.id === prospectId);
  const team = state.teams.find(t => t.id === state.userTeamId);
  if (!p) return { ok: false, reason: 'Oyuncu bulunamadı.' };
  if (p.scouted) return { ok: false, reason: 'Bu oyuncu zaten scoutlandı.' };
  const cost = team.facilities.analystDesk >= 3 ? 0 : 15000;
  if (team.budget < cost) return { ok: false, reason: `Scout raporu için ${formatMoney(cost)} gerekli.` };
  team.budget -= cost;
  p.scouted = true;
  return { ok: true, reason: `${p.name} scoutlandı! Gerçek Potansiyel: ${p.pot} (${p.trait})` };
}

export function signChallengerProspect(state, prospectId) {
  const idx = state.challengerPool.findIndex(x => x.id === prospectId);
  const team = state.teams.find(t => t.id === state.userTeamId);
  if (idx === -1) return { ok: false, reason: 'Oyuncu bulunamadı.' };
  const p = state.challengerPool[idx];
  if (team.budget < p.signingFee) return { ok: false, reason: `İmza bedeli için ${formatMoney(p.signingFee)} gerekli.` };

  team.budget -= p.signingFee;
  state.challengerPool.splice(idx, 1);
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

export function attemptSignOrTransfer(state, playerId, offeredBuyout, offeredSalary, contractYears) {
  const player = state.players.find(p => p.id === playerId);
  const userTeam = state.teams.find(t => t.id === state.userTeamId);
  if (!player || !userTeam) return { ok: false, reason: 'Oyuncu bulunamadı.' };
  if (offeredBuyout > userTeam.budget) return { ok: false, reason: 'Yeterli transfer bütçen yok.' };

  const applyImportCheck = () => {
    if (player.lang && player.lang !== REGION_LANG[userTeam.region]) {
      player.importWeeksLeft = 5;
    } else {
      player.importWeeksLeft = 0;
    }
  };

  if (player.teamId && player.teamId !== userTeam.id) {
    const sellingTeam = state.teams.find(t => t.id === player.teamId);
    const minBuyout = Math.round(player.marketValue * (player.isStarter ? 1.15 : 0.85));
    if (offeredBuyout < minBuyout) return { ok: false, reason: `${sellingTeam.name}, teklifi düşük buldu (En az ~${formatMoney(minBuyout)} istiyorlar).` };
    const minSalary = Math.round(player.salary * (userTeam.prestige >= sellingTeam.prestige ? 1.0 : 1.2));
    if (offeredSalary < minSalary) return { ok: false, reason: `${player.name}, haftalık en az ${formatMoney(minSalary)} maaş talep ediyor.` };

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

  const minSalary = Math.round(player.salary * (userTeam.prestige >= 85 ? 0.92 : 1.05));
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
  p.salary = newSalary;
  p.contractYears = years;
  p.morale = Math.min(100, p.morale + 6);
  return { ok: true, reason: `${p.name} ile ${years} yıllık yeni sözleşme imzalandı (${formatMoney(newSalary)}/hf).` };
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
  const userTeam = state.teams.find(t => t.id === state.userTeamId);
  const oppTeam = state.teams.find(t => t.id === opponentTeamId);
  const { match: m } = quickSimulateGame(userTeam, oppTeam, getTeamRoster(state, userTeam.id), getTeamRoster(state, oppTeam.id), getCurrentPatch(state));
  state.scrimDoneThisWeek = true;

  const won = m.winner === 'blue';
  userTeam.synergy = Math.min(100, userTeam.synergy + (won ? 4 : 2));
  for (const p of getTeamRoster(state, userTeam.id)) {
    p.form = Math.min(99, Math.max(45, p.form + (won ? 3 : 1)));
    p.fatigue = Math.min(100, p.fatigue + 7);
  }
  return {
    ok: true,
    won,
    text: `Scrim Sonucu: ${userTeam.tag} ${m.blueKills} - ${m.redKills} ${oppTeam.tag} (${m.minute} dk) — ${won ? 'GALİBİYET! (+4 Sinerji, +3 Form)' : 'MAĞLUBİYET (+2 Sinerji, +1 Form)'}`,
  };
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
    return slots[slotId]?.data || null;
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

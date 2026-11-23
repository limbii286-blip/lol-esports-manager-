// LoL Esports Manager — Career State, Calendar, Tournaments (Split, Playoffs, MSI, Worlds), Transfers & Economy
import { PATCHES } from '../data/champions.js';
import {
  ROLES, REGIONS, createInitialDatabase, calcOVR, calcMarketValue, calcWeeklySalary, generateRegenPlayer
} from '../data/teamsAndPlayers.js';
import { quickSimulateGame, applyMatchOutcomeToPlayers } from './matchEngine.js';

export const SAVE_KEY = 'lol_esports_manager_save_v1';

export const SPONSORS = [
  { id: 'sp_safe', name: 'LogiTech Gear', weekly: 45000, bonus: 150000, goal: 'Playofflara Kal', minPrestige: 0, desc: 'Garanti haftalık gelir, düşük baskı.' },
  { id: 'sp_mid', name: 'RedBull Gaming', weekly: 70000, bonus: 350000, goal: 'Bölge Finali Oyna', minPrestige: 78, desc: 'Yüksek haftalık gelir ve final primi.' },
  { id: 'sp_elite', name: 'Mercedes-Benz Esports', weekly: 105000, bonus: 750000, goal: 'MSI veya Worlds Kupası', minPrestige: 86, desc: 'Elit kulüpler için dev bütçe ve kupa primi.' },
];

export const FACILITY_INFO = {
  gamingHouse: { name: 'Gaming House', desc: 'Oyuncu yorgunluğunu azaltır ve toparlanmayı hızlandırır.', costs: [0, 350000, 750000, 1400000] },
  analystDesk: { name: 'Analist Ekibi', desc: 'Maç içi performans ve draft analiz bonusu verir.', costs: [0, 400000, 850000, 1600000] },
  youthAcademy: { name: 'Gençlik Akademisi', desc: 'Daha yüksek potansiyelli genç yetenekler üretir.', costs: [0, 300000, 650000, 1200000] },
  psychologist: { name: 'Spor Psikoloğu', desc: 'Moral düşüşlerini önler ve baskı altında clutch bonusu sağlar.', costs: [0, 280000, 600000, 1100000] },
};

export const TRAINING_MODES = [
  { id: 'balanced', name: 'Dengeli Antrenman', desc: 'Tüm özelliklerde dengeli gelişim, normal yorgunluk.' },
  { id: 'mechanics', name: 'SoloQ & Mekanik', desc: 'Mekanik ve Koridor odaklı (+yüksek yorgunluk).' },
  { id: 'macro', name: 'VOD & Makro Analiz', desc: 'Makro, Takım Savaşı ve Sinerji odaklı.' },
  { id: 'pool', name: 'Şampiyon Havuzu', desc: 'Şampiyon havuzunu genişletir, yama uyumunu artırır.' },
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

// Generate 7-round Round-Robin schedule for 8 teams
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
        blueScore: 0,
        redScore: 0,
        played: false,
        winnerId: null,
      });
    }
    weeks.push(matches);
    // Rotate all except index 0
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
      teamId: t.id,
      wins: 0,
      losses: 0,
      gameWins: 0,
      gameLosses: 0,
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
    title,
    sender,
    category, // 'NEWS' | 'BOARD' | 'PATCH' | 'TRANSFER' | 'TOURNAMENT'
    body,
    read: false,
  });
  if (state.inbox.length > 60) state.inbox.pop();
}

export function getPhaseLabel(phase) {
  const map = {
    SPRING_SPLIT: 'Bahar Mevsimi',
    SPRING_PLAYOFFS: 'Bahar Playoff',
    MSI: 'MSI 2026',
    SUMMER_SPLIT: 'Yaz Mevsimi',
    SUMMER_PLAYOFFS: 'Yaz Playoff',
    WORLDS: 'WORLDS Şampiyonası',
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
    week: 1, // 1..7 for split, 1..2 for playoffs, 1..3 for MSI/Worlds
    patchIndex: 0,
    userTeamId,
    teams,
    players,
    schedules,
    standings,
    bracket: null, // active playoff / MSI / Worlds bracket
    scrimDoneThisWeek: false,
    academyPromotedThisSplit: false,
    history: [], // past champions & user finishes
    inbox: [],
  };

  addInboxMessage(state, {
    title: `${userTeam.name} Yönetim Kurulu'na Hoş Geldin!`,
    sender: 'Yönetim Kurulu',
    category: 'BOARD',
    body: `${userTeam.name} Genel Menajeri ve Baş Koçu olarak göreve başladın. Bütçen ${formatMoney(userTeam.budget)}. İlk hedefimiz ${userTeam.region} Bahar Mevsimi'nde ilk 4'e girip Playoff oynamak ve ardından MSI & Worlds kupalarını kaldırmak!`,
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

// Get user's next unplayed match in the current week/round
export function getUserNextMatch(state) {
  const uid = state.userTeamId;
  const userTeam = state.teams.find(t => t.id === uid);

  if (state.phase === 'SPRING_SPLIT' || state.phase === 'SUMMER_SPLIT') {
    const regMatches = state.schedules[userTeam.region]?.[state.week - 1] || [];
    return regMatches.find(m => !m.played && (m.blueId === uid || m.redId === uid)) || null;
  }

  if (state.bracket) {
    const round = state.bracket.rounds[state.bracket.currentRound];
    if (!round) return null;
    return round.matches.find(m => !m.played && (m.blueId === uid || m.redId === uid)) || null;
  }

  return null;
}

// Record a finished series result (either from live play or quick sim)
export function recordSeriesResult(state, match, blueScore, redScore) {
  match.blueScore = blueScore;
  match.redScore = redScore;
  match.played = true;
  match.winnerId = blueScore > redScore ? match.blueId : match.redId;

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
  }
}

export function quickSimSeries(state, match) {
  const blueTeam = state.teams.find(t => t.id === match.blueId);
  const redTeam = state.teams.find(t => t.id === match.redId);
  const blueRoster = getTeamRoster(state, match.blueId);
  const redRoster = getTeamRoster(state, match.redId);
  const patch = getCurrentPatch(state);
  const needed = Math.ceil(match.bestOf / 2);

  let bScore = 0, rScore = 0;
  while (bScore < needed && rScore < needed) {
    const m = quickSimulateGame(blueTeam, redTeam, blueRoster, redRoster, patch);
    applyMatchOutcomeToPlayers(m);
    if (m.winner === 'blue') bScore++;
    else rScore++;
  }
  recordSeriesResult(state, match, bScore, rScore);
}

// Weekly tick: training, salaries, sponsor income
function runWeeklyClubTick(state) {
  state.scrimDoneThisWeek = false;
  for (const team of state.teams) {
    const wages = getTeamWeeklyWages(state, team.id);
    const fanIncome = team.fanbase * 950;
    const sponsorIncome = team.sponsor ? team.sponsor.weekly : 30000;
    team.budget += (fanIncome + sponsorIncome - wages);

    // Training effect on players
    const focus = team.trainingFocus || 'balanced';
    const roster = state.players.filter(p => p.teamId === team.id);
    for (const p of roster) {
      const growthChance = p.ovr < p.pot ? (p.age <= 21 ? 0.35 : p.age <= 24 ? 0.22 : 0.10) : 0.03;
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

function createInternationalBracket(state, title, type) {
  // Top 2 from each region (8 teams total)
  const seeds = {};
  for (const reg of REGIONS) {
    const sorted = getSortedStandings(state, reg.id);
    seeds[reg.id] = [sorted[0].teamId, sorted[1].teamId];
  }
  // Cross-region Quarterfinals (1st seed vs 2nd seed from another region)
  const qf = [
    { id: `${type}_qf1`, blueId: seeds.LCK[0], redId: seeds.LCS[1], bestOf: 5, blueScore: 0, redScore: 0, played: false, winnerId: null },
    { id: `${type}_qf2`, blueId: seeds.LPL[0], redId: seeds.LEC[1], bestOf: 5, blueScore: 0, redScore: 0, played: false, winnerId: null },
    { id: `${type}_qf3`, blueId: seeds.LEC[0], redId: seeds.LPL[1], bestOf: 5, blueScore: 0, redScore: 0, played: false, winnerId: null },
    { id: `${type}_qf4`, blueId: seeds.LCS[0], redId: seeds.LCK[1], bestOf: 5, blueScore: 0, redScore: 0, played: false, winnerId: null },
  ];
  return {
    title,
    type,
    currentRound: 0,
    rounds: [
      { name: 'Çeyrek Finaller', matches: qf },
      { name: 'Yarı Finaller', matches: [] },
      { name: 'Büyük Final', matches: [] },
    ],
  };
}

// Simulate remaining AI matches in current week/round and advance calendar
export function advanceWeekOrRound(state) {
  // 1. Simulate any remaining unplayed matches this week/round
  if (state.phase === 'SPRING_SPLIT' || state.phase === 'SUMMER_SPLIT') {
    for (const reg of REGIONS) {
      const weekMatches = state.schedules[reg.id][state.week - 1] || [];
      for (const m of weekMatches) {
        if (!m.played) quickSimSeries(state, m);
      }
    }
    runWeeklyClubTick(state);

    // Mid-split Patch Drop on week 4
    if (state.week === 4) {
      state.patchIndex = (state.patchIndex + 1) % PATCHES.length;
      const np = getCurrentPatch(state);
      addInboxMessage(state, {
        title: `Yeni Yama ${np.version}: ${np.name}`,
        sender: 'Riot Denge Ekibi',
        category: 'PATCH',
        body: np.desc,
      });
    }

    if (state.week < 7) {
      state.week++;
      return;
    }

    // End of Split -> Move to Playoffs
    if (state.phase === 'SPRING_SPLIT') {
      state.phase = 'SPRING_PLAYOFFS';
      state.week = 1;
      state.bracket = createRegionalPlayoffsBracket(state, `Sezon ${state.season} Bahar Playoffları`);
      addInboxMessage(state, {
        title: 'Bahar Playoffları Başlıyor!',
        sender: 'Lig Komitesi',
        category: 'TOURNAMENT',
        body: 'Normal sezon tamamlandı! Her bölgenin ilk 4 takımı BO5 formatında şampiyonluk ve MSI bileti için mücadele edecek.',
      });
    } else {
      state.phase = 'SUMMER_PLAYOFFS';
      state.week = 1;
      state.bracket = createRegionalPlayoffsBracket(state, `Sezon ${state.season} Yaz Playoffları`);
      addInboxMessage(state, {
        title: 'Yaz Playoffları Başlıyor!',
        sender: 'Lig Komitesi',
        category: 'TOURNAMENT',
        body: 'Yaz Mevsimi tamamlandı! Her bölgenin en iyi 2 takımı Worlds biletini kapacak.',
      });
    }
    return;
  }

  // 2. Bracket Phases (Playoffs, MSI, Worlds)
  if (state.bracket) {
    const round = state.bracket.rounds[state.bracket.currentRound];
    for (const m of round.matches) {
      if (!m.played) quickSimSeries(state, m);
    }
    runWeeklyClubTick(state);

    // Advance to next round in bracket if not final
    if (state.bracket.currentRound < state.bracket.rounds.length - 1) {
      const nextIdx = state.bracket.currentRound + 1;
      const nextMatches = [];
      if (state.bracket.type === 'REGIONAL_PLAYOFFS') {
        for (const reg of REGIONS) {
          const sfs = round.matches.filter(m => m.region === reg.id);
          nextMatches.push({
            id: `po_${reg.id}_fin`,
            region: reg.id,
            blueId: sfs[0].winnerId,
            redId: sfs[1].winnerId,
            bestOf: 5, blueScore: 0, redScore: 0, played: false, winnerId: null,
          });
        }
      } else {
        for (let i = 0; i < round.matches.length; i += 2) {
          nextMatches.push({
            id: `${state.bracket.type}_r${nextIdx}_${i}`,
            blueId: round.matches[i].winnerId,
            redId: round.matches[i + 1].winnerId,
            bestOf: 5, blueScore: 0, redScore: 0, played: false, winnerId: null,
          });
        }
      }
      state.bracket.rounds[nextIdx].matches = nextMatches;
      state.bracket.currentRound = nextIdx;
      state.week++;
      return;
    }

    // Bracket Finished! Award trophies & prize money, transition to next phase
    finishBracketAndTransition(state);
    return;
  }

  // 3. Off-season -> Start Next Season
  if (state.phase === 'OFFSEASON') {
    startNewSeason(state);
  }
}

function finishBracketAndTransition(state) {
  const finalMatches = state.bracket.rounds[state.bracket.rounds.length - 1].matches;

  if (state.phase === 'SPRING_PLAYOFFS') {
    const champs = [];
    for (const fm of finalMatches) {
      const champ = state.teams.find(t => t.id === fm.winnerId);
      champ.budget += 300000;
      champ.trophies.push(`${state.season} ${fm.region} Bahar`);
      champs.push(`${fm.region}: ${champ.tag}`);
    }
    addInboxMessage(state, {
      title: 'Bahar Şampiyonları Belli Oldu — MSI Başlıyor!',
      sender: 'Riot Esports',
      category: 'TOURNAMENT',
      body: `Bölge Şampiyonları: ${champs.join(' • ')}. Şimdi 4 bölgenin en iyi 2 takımı MSI kupası için karşı karşıya geliyor!`,
    });
    state.phase = 'MSI';
    state.week = 1;
    state.bracket = createInternationalBracket(state, `MSI ${state.season}`, 'MSI');
    return;
  }

  if (state.phase === 'MSI') {
    const msiWinner = state.teams.find(t => t.id === finalMatches[0].winnerId);
    msiWinner.budget += 650000;
    msiWinner.prestige = Math.min(99, msiWinner.prestige + 2);
    msiWinner.trophies.push(`MSI ${state.season}`);
    state.history.push({ season: state.season, event: 'MSI', winner: msiWinner.name, tag: msiWinner.tag });

    // New Patch + Reset schedules for Summer Split
    state.patchIndex = (state.patchIndex + 1) % PATCHES.length;
    const { schedules, standings } = createRegionalSchedules(state.teams);
    state.schedules = schedules;
    state.standings = standings;
    state.bracket = null;
    state.phase = 'SUMMER_SPLIT';
    state.week = 1;
    state.academyPromotedThisSplit = false;

    addInboxMessage(state, {
      title: `MSI ${state.season} Şampiyonu: ${msiWinner.name}!`,
      sender: 'Riot Esports',
      category: 'TOURNAMENT',
      body: `${msiWinner.name} uluslararası sahnede kupayı kaldırdı! Yeni Yama ${getCurrentPatch(state).version} ile birlikte Yaz Mevsimi başlıyor.`,
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
    state.patchIndex = 4; // Worlds Balanced Meta
    state.phase = 'WORLDS';
    state.week = 1;
    state.bracket = createInternationalBracket(state, `WORLDS ${state.season}`, 'WORLDS');

    addInboxMessage(state, {
      title: `WORLDS ${state.season} BAŞLIYOR!`,
      sender: 'Riot Esports',
      category: 'TOURNAMENT',
      body: `Yaz Şampiyonları: ${champs.join(' • ')}. Sihirdar Kupası için 8 dev takım Worlds Çeyrek Finalleri'nde!`,
    });
    return;
  }

  if (state.phase === 'WORLDS') {
    const worldsWinner = state.teams.find(t => t.id === finalMatches[0].winnerId);
    worldsWinner.budget += 1500000;
    worldsWinner.prestige = Math.min(99, worldsWinner.prestige + 3);
    worldsWinner.trophies.push(`WORLDS ${state.season}`);
    state.history.push({ season: state.season, event: 'WORLDS', winner: worldsWinner.name, tag: worldsWinner.tag });

    // Sponsor bonus check for user
    const userTeam = state.teams.find(t => t.id === state.userTeamId);
    if (userTeam.sponsor && worldsWinner.id === userTeam.id) {
      userTeam.budget += userTeam.sponsor.bonus;
    }

    state.bracket = null;
    state.phase = 'OFFSEASON';
    state.week = 1;
    runOffSeasonProgression(state);

    addInboxMessage(state, {
      title: `🏆 WORLDS ${state.season} ŞAMPİYONU: ${worldsWinner.name}!`,
      sender: 'Riot Esports',
      category: 'TOURNAMENT',
      body: `${worldsWinner.name} Sihirdar Kupası'nı kazandı! Sezon arası transfer dönemi açıldı. Oyuncular yaşlandı, kontratı bitenler serbest kaldı ve yeni akademi yetenekleri piyasaya çıktı. Hazır olduğunda yeni sezona geçebilirsin.`,
    });
  }
}

function runOffSeasonProgression(state) {
  // Age players, update attributes, expire contracts
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
        // AI auto-renews 75% of starters, releases 25%
        if (Math.random() < 0.75) p.contractYears = 2;
        else { p.teamId = null; p.isStarter = false; }
      }
    }
  }

  // Generate 10 fresh young regens into Free Agency
  for (let i = 0; i < 10; i++) {
    const reg = REGIONS[i % REGIONS.length].id;
    const role = ROLES[i % ROLES.length];
    state.players.push(generateRegenPlayer(role, reg, 2, null));
  }

  // Ensure every AI team has 5 starters
  for (const team of state.teams) {
    if (team.id === state.userTeamId) continue;
    for (const role of ROLES) {
      const has = state.players.some(p => p.teamId === team.id && p.role === role);
      if (!has) {
        const fa = state.players
          .filter(p => p.teamId === null && p.role === role)
          .sort((a, b) => b.ovr - a.ovr)[0];
        if (fa) {
          fa.teamId = team.id;
          fa.isStarter = true;
          fa.contractYears = 2;
        }
      }
    }
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

  addInboxMessage(state, {
    title: `Sezon ${state.season} Başladı!`,
    sender: 'Lig Komitesi',
    category: 'NEWS',
    body: `Yeni sezon fikstürü çekildi. Tüm takımlara Bahar Mevsimi'nde başarılar!`,
  });
}

// ==================== CLUB & TRANSFER ACTIONS ====================

export function attemptSignOrTransfer(state, playerId, offeredBuyout, offeredSalary, contractYears) {
  const player = state.players.find(p => p.id === playerId);
  const userTeam = state.teams.find(t => t.id === state.userTeamId);
  if (!player || !userTeam) return { ok: false, reason: 'Oyuncu bulunamadı.' };

  if (offeredBuyout > userTeam.budget) {
    return { ok: false, reason: 'Yeterli transfer bütçen yok.' };
  }

  // If contracted to another team, check buyout
  if (player.teamId && player.teamId !== userTeam.id) {
    const sellingTeam = state.teams.find(t => t.id === player.teamId);
    const minBuyout = Math.round(player.marketValue * (player.isStarter ? 1.15 : 0.85));
    if (offeredBuyout < minBuyout) {
      return { ok: false, reason: `${sellingTeam.name}, teklifi düşük buldu (En az ~${formatMoney(minBuyout)} istiyorlar).` };
    }
    // Check player interest (salary + prestige)
    const minSalary = Math.round(player.salary * (userTeam.prestige >= sellingTeam.prestige ? 1.0 : 1.2));
    if (offeredSalary < minSalary) {
      return { ok: false, reason: `${player.name}, haftalık en az ${formatMoney(minSalary)} maaş talep ediyor.` };
    }

    // Complete transfer! Replace selling team's gap if needed
    const oldTeamId = player.teamId;
    userTeam.budget -= offeredBuyout;
    sellingTeam.budget += offeredBuyout;
    player.teamId = userTeam.id;
    player.salary = offeredSalary;
    player.contractYears = contractYears;
    player.isStarter = false;
    player.morale = 88;
    userTeam.synergy = Math.max(45, userTeam.synergy - 4);

    // Ensure selling team still has someone in that role
    const sellingHasRole = state.players.some(p => p.teamId === oldTeamId && p.role === player.role);
    if (!sellingHasRole) {
      const replacement = state.players.filter(p => p.teamId === null && p.role === player.role).sort((a, b) => b.ovr - a.ovr)[0]
        || generateRegenPlayer(player.role, sellingTeam.region, sellingTeam.facilities.youthAcademy, oldTeamId);
      if (!state.players.includes(replacement)) state.players.push(replacement);
      replacement.teamId = oldTeamId;
      replacement.isStarter = true;
      replacement.contractYears = 2;
    }

    addInboxMessage(state, {
      title: `Transfer Tamamlandı: ${player.name}!`,
      sender: 'Sportif Direktör',
      category: 'TRANSFER',
      body: `${player.name}, ${sellingTeam.name} kulübünden ${formatMoney(offeredBuyout)} bonservis ve haftalık ${formatMoney(offeredSalary)} maaşla kadromuza katıldı!`,
    });
    return { ok: true, reason: `${player.name} takıma katıldı!` };
  }

  // Free Agent Signing
  const minSalary = Math.round(player.salary * (userTeam.prestige >= 85 ? 0.92 : 1.05));
  if (offeredSalary < minSalary) {
    return { ok: false, reason: `${player.name} haftalık en az ${formatMoney(minSalary)} maaş istiyor.` };
  }
  player.teamId = userTeam.id;
  player.salary = offeredSalary;
  player.contractYears = contractYears;
  player.isStarter = false;
  player.morale = 86;
  addInboxMessage(state, {
    title: `Serbest Transfer: ${player.name}`,
    sender: 'Sportif Direktör',
    category: 'TRANSFER',
    body: `Serbest oyuncu ${player.name} ile ${contractYears} yıllık (haftalık ${formatMoney(offeredSalary)}) sözleşme imzalandı.`,
  });
  return { ok: true, reason: `${player.name} serbest transferle kadroya katıldı!` };
}

export function setStarter(state, playerId) {
  const p = state.players.find(x => x.id === playerId);
  if (!p || p.teamId !== state.userTeamId) return;
  for (const mate of state.players) {
    if (mate.teamId === state.userTeamId && mate.role === p.role) {
      mate.isStarter = (mate.id === p.id);
    }
  }
}

export function releasePlayer(state, playerId) {
  const p = state.players.find(x => x.id === playerId);
  if (!p || p.teamId !== state.userTeamId) return { ok: false, reason: 'Oyuncu bulunamadı.' };
  const sameRoleCount = state.players.filter(x => x.teamId === state.userTeamId && x.role === p.role).length;
  if (sameRoleCount <= 1) return { ok: false, reason: `Bu rolde (${p.role}) başka oyuncun yok! Önce yedek al.` };
  p.teamId = null;
  p.isStarter = false;
  p.contractYears = 0;
  // Make sure someone else is starter
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
  const uRoster = getTeamRoster(state, userTeam.id);
  const oRoster = getTeamRoster(state, oppTeam.id);
  const m = quickSimulateGame(userTeam, oppTeam, uRoster, oRoster, getCurrentPatch(state));
  state.scrimDoneThisWeek = true;

  const won = m.winner === 'blue';
  userTeam.synergy = Math.min(100, userTeam.synergy + (won ? 4 : 2));
  for (const p of uRoster) {
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

export function saveGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.error('Save failed', e);
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

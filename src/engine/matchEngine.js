// LoL Esports Manager v3.0 — Pro-Calibrated Live Match Engine
// Features: Realistic snowball & comeback math, Shutdown Bounties, Jungle Smite Steals,
// Elder Dragon, Attribute-driven 1v1/Gank/5v5 resolution, True Role Resource Allocation,
// Calibrated FM Ratings, and Automatic Post-Match Coaching Analysis.

import { CHAMPION_MAP, getChampionMetaTier, getTierBonus, getMatchupAdvantage } from '../data/champions.js';
import { ROLES, getAgeFatigueProfile } from '../data/teamsAndPlayers.js';
import { createDraftState, autoCompleteDraft, analyzeDraftSide } from './draftEngine.js';

function rand(min, max) { return min + Math.random() * (max - min); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

export const DRAGON_ELEMENTS = [
  { id: 'INFERNAL', name: 'Alev Ejderi', soulName: 'Alev Ruhu', color: '#EF4444', bonusDesc: 'Takım savaşlarında ekstra patlama hasarı (+4.0)' },
  { id: 'MOUNTAIN', name: 'Dağ Ejderi', soulName: 'Dağ Ruhu', color: '#D97706', bonusDesc: 'Kalkan ve kule savunması direnci (+3.8)' },
  { id: 'OCEAN', name: 'Okyanus Ejderi', soulName: 'Okyanus Ruhu', color: '#0EA5E9', bonusDesc: 'Uzun takım savaşlarında yüksek can yenilenmesi (+4.2)' },
  { id: 'CLOUD', name: 'Bulut Ejderi', soulName: 'Bulut Ruhu', color: '#94A3B8', bonusDesc: 'Harita rotasyonu ve objektif temposu (+3.6)' },
  { id: 'HEXTECH', name: 'Hextech Ejderi', soulName: 'Hextech Ruhu', color: '#38BDF8', bonusDesc: 'Yetenek hızı ve zincirleme engage gücü (+4.1)' },
  { id: 'CHEMTECH', name: 'Kimya Ejderi', soulName: 'Kimya Ruhu', color: '#22C55E', bonusDesc: 'Düşük canda clutch direnç ve geri dönüş gücü (+3.9)' },
];

const ROLE_ITEM_BUILDS = {
  TOP_AD: ['Black Cleaver', 'Sterak', 'Death Dance', 'Guardian Angel', 'Maw', 'JakSho'],
  TOP_AP: ['Riftmaker', 'Liandry', 'Zhonya', 'Rabadon', 'Void Staff', 'Banshee'],
  TOP_Tank: ['Sunfire', 'JakSho', 'Thornmail', 'Randuin', 'Kaenic', 'Warmog'],
  JGL_AD: ['Eclipse', 'Sundered Sky', 'Black Cleaver', 'Sterak', 'Guardian Angel', 'Death Dance'],
  JGL_AP: ['Liandry', 'Zhonya', 'Shadowflame', 'Rabadon', 'Void Staff', 'Banshee'],
  JGL_Tank: ['Sunfire', 'Kaenic', 'Thornmail', 'Frozen Heart', 'JakSho', 'Locket'],
  MID_AP: ['Luden', 'Shadowflame', 'Zhonya', 'Rabadon', 'Void Staff', 'Banshee'],
  MID_AD: ['Eclipse', 'Muramana', 'Serylda', 'Edge of Night', 'Guardian Angel', 'Maw'],
  BOT_AD: ['Kraken', 'Infinity Edge', 'Lord Dominik', 'Bloodthirster', 'Guardian Angel', 'Rapid Fire'],
  BOT_AP: ['Nashor', 'Shadowflame', 'Zhonya', 'Rabadon', 'Void Staff', 'Banshee'],
  SUP_Tank: ['Locket', 'Zeke', 'Knight Vow', 'Redemption', 'Frozen Heart', 'Wardstone'],
  SUP_AP: ['Shurelya', 'Ardent', 'Redemption', 'Mikael', 'Zhonya', 'Wardstone'],
};

export function getPlayerItems(gold, role, dmg = 'AD') {
  const thresholds = [3100, 6200, 9400, 12600, 15800, 18800];
  let count = 0;
  for (const th of thresholds) {
    if (gold >= th) count++;
  }
  const key = `${role}_${dmg === 'Tank' ? 'Tank' : dmg === 'AP' ? 'AP' : 'AD'}`;
  const pool = ROLE_ITEM_BUILDS[key] || ROLE_ITEM_BUILDS.MID_AP;
  return pool.slice(0, count);
}

const HOME_POS = {
  blue: { TOP: [18, 28], JGL: [34, 62], MID: [44, 56], BOT: [70, 82], SUP: [66, 84] },
  red:  { TOP: [28, 18], JGL: [66, 38], MID: [56, 44], BOT: [82, 70], SUP: [84, 66] },
};

const LANE_COORDS = {
  TOP: { x: 22, y: 20 },
  JGL: { x: 45, y: 42 },
  MID: { x: 50, y: 50 },
  BOT: { x: 78, y: 80 },
  DRAGON: { x: 66, y: 70 },
  BARON: { x: 34, y: 30 },
  BLUE_BASE: { x: 14, y: 86 },
  RED_BASE: { x: 86, y: 14 },
};

export function getEffectivePlayerRating(player, champId, oppChampId, patch, team, ctx = {}) {
  const champ = CHAMPION_MAP[champId];
  const tier = champ ? getChampionMetaTier(champ, patch) : 'B';
  const tierBonus = getTierBonus(tier) * 0.75;
  const sigBonus = player.sigChamps.includes(champId) ? 3.2 : (player.attrs.pool - 78) * 0.1;
  const masteryBonus = Math.min(2.5, (player.mastery?.[champId] || 0) * 0.45);
  const counterBonus = oppChampId ? getMatchupAdvantage(champId, oppChampId) * 0.8 : 0;
  const formMod = (player.form - 75) * 0.12;
  const moraleMod = (player.morale - 75) * 0.08;
  const ageProfile = getAgeFatigueProfile(player.age);
  const fatiguePen = Math.max(0, player.fatigue - ageProfile.perfThreshold) * (player.age >= 28 ? 0.19 : 0.15);
  const facilityMod = (team.facilities.analystDesk - 1) * 0.45 + ((team.staff?.draftAnalyst || 1) - 1) * 0.45;
  const importPen = (player.importWeeksLeft || 0) > 0 ? -3.0 : 0;
  const injuryPen = (player.injuredWeeks || 0) > 0 ? -4.5 : 0;
  const gamesWithTeam = player.teamGames ?? 20;
  const newcomerPen = gamesWithTeam < 10 ? -(10 - gamesWithTeam) * 0.28 : 0;

  let traitMod = 0;
  if (player.trait === 'Clutch' && ctx.highStakes) traitMod += 2.6;
  if (player.trait === 'Ego' && player.isStarter) traitMod += 1.0;
  if (player.trait === 'Tilt') {
    if ((ctx.goldDiff || 0) < -3500) traitMod -= 2.2;
    else if ((ctx.goldDiff || 0) > 3500) traitMod += 1.4;
  }

  // Pre-match Team Talk modifier
  let talkMod = 0;
  if (ctx.teamTalk === 'pressure') {
    if (player.trait === 'Clutch' || player.trait === 'Leader') talkMod += 2.2;
    else if (player.trait === 'Tilt') talkMod -= 1.6;
    else talkMod += 0.5;
  } else if (ctx.teamTalk === 'calm') {
    if (player.trait === 'Tilt') talkMod += 1.8;
    else talkMod += 0.4;
  } else if (ctx.teamTalk === 'praise') {
    talkMod += 1.1;
  } else if (ctx.teamTalk === 'fire') {
    talkMod += ctx.highStakes ? 2.4 : 0.9;
  }

  // Duo Synergy (JGL+MID & BOT+SUP bond)
  const duoMod = ctx.duoBonus || 0;
  const intelMod = ctx.hasScrimIntel ? 1.2 : 0;
  const reqMod = ctx.requestGranted ? 2.0 : 0;

  return player.ovr + tierBonus + sigBonus + masteryBonus + counterBonus + formMod + moraleMod - fatiguePen + facilityMod + importPen + injuryPen + newcomerPen + traitMod + talkMod + duoMod + intelMod + reqMod;
}

// Football Manager-grade Team Cohesion, Role Balance & Anti-Superteam Chemistry Evaluator
export function computeTeamChemistry(team, rosterOrMatchPlayers) {
  const list = (rosterOrMatchPlayers || []).map(x => x.playerRef || x).filter(Boolean).slice(0, 5);
  const syn = clamp(team?.synergy ?? 68, 15, 100);

  // 1. Core Synergy Curve: low cohesion severely punishes teamplay; high cohesion rewards long-term cores
  const synImpact = syn < 66 ? (syn - 66) * 0.26 : (syn - 66) * 0.18;

  // 2. Resource Starvation / "Superteam Trap": 4-5 carry-hungry stars fight over gold & jungle attention
  const resourceHungry = list.filter(
    p => p.ovr >= 85 && (p.style === 'Aggressive' || p.style === 'Playmaker' || p.trait === 'Ego')
  );
  const weaksideGlue = list.filter(p => p.style === 'Weakside' || p.style === 'Consistent' || p.trait === 'Leader');
  let resourceClash = 0;
  if (resourceHungry.length >= 5) resourceClash = -4.6;
  else if (resourceHungry.length === 4) resourceClash = -2.8;
  else if (resourceHungry.length === 3 && weaksideGlue.length === 0) resourceClash = -1.4;

  // Role balance reward when roster has selfless weakside/consistent glue players alongside carries
  const roleBalanceBonus = weaksideGlue.length >= 2 ? 1.4 : weaksideGlue.length === 1 ? 0.6 : 0;

  // 3. Ego Clash vs Leadership
  const egoCount = list.filter(p => p.trait === 'Ego').length;
  const hasLeader = list.some(p => p.trait === 'Leader');
  let egoImpact = 0;
  if (egoCount >= 3) egoImpact = hasLeader ? -2.6 : -4.2;
  else if (egoCount === 2) egoImpact = hasLeader ? -0.8 : -1.9;
  else if (hasLeader) egoImpact = 0.8;

  // 4. Language & Voice-Comms Cohesion
  const langs = new Set(list.map(p => p.lang).filter(Boolean));
  let commImpact = 0;
  if (langs.size <= 1) commImpact = 1.1;
  else if (langs.size === 2) commImpact = -0.9;
  else if (langs.size >= 3) commImpact = -2.7;

  // 5. Roster Continuity (Average games played together in this club)
  const avgTeamGames = list.length
    ? list.reduce((s, p) => s + Math.min(35, p.teamGames ?? 20), 0) / list.length
    : 15;
  const continuityImpact = avgTeamGames < 8
    ? -(8 - avgTeamGames) * 0.32
    : avgTeamGames >= 22
    ? Math.min(2.2, (avgTeamGames - 20) * 0.14)
    : 0;

  const totalImpact = +(synImpact + resourceClash + roleBalanceBonus + egoImpact + commImpact + continuityImpact).toFixed(1);

  const issues = [];
  const strengths = [];
  if (syn < 58) issues.push(`Düşük takım uyumu (${Math.round(syn)}/100) — harita ve takım savaşı koordinasyonu kopuk.`);
  else if (syn >= 84) strengths.push(`Elit takım oyunu (${Math.round(syn)}/100) — refleksif rotasyon ve objektif uyumu.`);
  if (resourceClash <= -2.5) issues.push(`Süper Takım Kaynak Çatışması (${resourceHungry.length} taşıyıcı yıldız) — herkes altın ve orman desteği istiyor.`);
  else if (roleBalanceBonus >= 1.2) strengths.push('Dengeli rol paylaşımı — özverili weakside/denge oyuncuları taşıyıcılara alan açıyor.');
  if (egoImpact <= -1.5) issues.push(`Soyunma odasında ego sürtüşmesi (${egoCount} Ego karakter${hasLeader ? ', Lider kısmen dengeliyor' : ', Lider eksik'}).`);
  else if (hasLeader) strengths.push('Güçlü takım içi liderlik — zor anlarda iletişim ve disiplin korunuyor.');
  if (langs.size >= 3) issues.push(`Çok dilli iletişim bariyeri (${langs.size} farklı dil) — hızlı çağrılarda gecikme.`);
  else if (langs.size === 2) issues.push('İki dilli kadro — tam iletişim akıcılığı için zaman gerekiyor.');
  else strengths.push('Tek dilde akıcı sesli iletişim (+İletişim uyumu).');
  if (avgTeamGames < 8) issues.push(`Yeni kurulmuş ilk 5 (ort. ${avgTeamGames.toFixed(0)} maç birlikte) — birlikte oynama alışkanlığı zayıf.`);
  else if (avgTeamGames >= 22) strengths.push(`Oturmuş çekirdek kadro (ort. ${avgTeamGames.toFixed(0)}+ maç birlikte).`);

  // Visual 0-100 Chemistry Index for UI clarity
  const chemIndex = clamp(Math.round(62 + totalImpact * 3.8), 18, 99);

  return {
    chemIndex,
    totalImpact,
    synImpact: +synImpact.toFixed(1),
    resourceClash: +resourceClash.toFixed(1),
    roleBalanceBonus: +roleBalanceBonus.toFixed(1),
    egoImpact: +egoImpact.toFixed(1),
    commImpact: +commImpact.toFixed(1),
    continuityImpact: +continuityImpact.toFixed(1),
    resourceHungryCount: resourceHungry.length,
    egoCount,
    langCount: langs.size,
    avgTeamGames: Math.round(avgTeamGames),
    issues,
    strengths,
  };
}

export function createLiveMatchState(blueTeam, redTeam, blueRoster, redRoster, bluePicks, redPicks, patch, userSide = null, highStakes = false, options = {}) {
  const makePlayers = (roster, picks, oppPicks, side) =>
    ROLES.map(role => {
      const p = roster.find(x => x.role === role) || roster[0];
      const champId = picks[role];
      const [hx, hy] = HOME_POS[side][role];
      return {
        playerId: p.id,
        name: p.name,
        role,
        side,
        champId,
        oppChampId: oppPicks[role] || null,
        champName: CHAMPION_MAP[champId]?.name || champId,
        champDmg: CHAMPION_MAP[champId]?.dmg || 'AD',
        champColor: CHAMPION_MAP[champId]?.color || '#64748b',
        playerRef: p,
        kills: 0,
        deaths: 0,
        assists: 0,
        spree: 0,
        cs: 0,
        gold: 500,
        items: [],
        itemCount: 0,
        deadUntilMin: 0,
        dmg: 0,
        vision: 0,
        rating: 6.4,
        x: hx,
        y: hy,
      };
    });

  const blueAnalysis = analyzeDraftSide(bluePicks, blueRoster, patch, redPicks);
  const redAnalysis = analyzeDraftSide(redPicks, redRoster, patch, bluePicks);

  const defaultTactics = (t) => ({
    gameplan: t.tactics?.gameplan || 'balanced',
    laneFocus: t.tactics?.laneFocus || 'MID',
    objective: t.tactics?.objective || 'dragon',
    topStyle: t.tactics?.topStyle || 'balanced',
    supStyle: t.tactics?.supStyle || 'balanced',
    adcStyle: t.tactics?.adcStyle || 'balanced',
    aheadPlan: t.tactics?.aheadPlan || 'choke',     // choke | split131 | dive
    behindPlan: t.tactics?.behindPlan || 'scale',   // crossmap | scale | pick
  });

  const riftElement = pick(DRAGON_ELEMENTS);
  const openingPlan = {
    junglePath: options.junglePath || 'bot', // 'bot' | 'top' | 'invade'
    laneSwap: Boolean(options.laneSwap),
  };
  const initEvents = [
    {
      min: 0,
      type: 'SYSTEM',
      tag: 'BAŞLANGIÇ',
      text: `${blueTeam.tag} (Mavi · ${blueAnalysis.compLabel}) vs ${redTeam.tag} (Kırmızı · ${redAnalysis.compLabel}) · Vadi Elementi: ${riftElement.name}.`,
    },
  ];
  if (openingPlan.laneSwap) {
    initEvents.push({
      min: 1,
      type: 'TACTIC',
      tag: 'LANE SWAP',
      text: `Koç kararıyla Lane Swap uygulanıyor! Alt koridor ikilisi erken eşleşmeyi kırmak için üst koridora geçti.`,
    });
  } else if (openingPlan.junglePath === 'invade') {
    initEvents.push({
      min: 1,
      type: 'TACTIC',
      tag: 'INVADE',
      text: `Agresif Seviye 1–3 Orman Baskını planı seçildi; erken nehir çatışması bekleniyor.`,
    });
  }

  return {
    minute: 0,
    finished: false,
    winner: null,
    userSide,
    highStakes,
    teamTalk: options.teamTalk || 'none',
    openingPlan,
    riftElement,
    hasScrimIntel: !!options.hasScrimIntel,
    grantedRequestIds: options.grantedRequestIds || [],
    ignoredEgoIds: options.ignoredEgoIds || [],
    patch,
    blueTeam,
    redTeam,
    bluePlayers: makePlayers(blueRoster, bluePicks, redPicks, 'blue'),
    redPlayers: makePlayers(redRoster, redPicks, bluePicks, 'red'),
    blueAnalysis,
    redAnalysis,
    blueTactics: defaultTactics(blueTeam),
    redTactics: defaultTactics(redTeam),

    blueKills: 0,
    redKills: 0,
    blueGold: 2500,
    redGold: 2500,
    gd15: null,
    gd25: null,
    goldHistory: [0],
    blueDragons: 0,
    redDragons: 0,
    blueBarons: 0,
    redBarons: 0,
    blueElders: 0,
    redElders: 0,
    blueGrubs: 0,
    redGrubs: 0,
    blueTowers: 0,
    redTowers: 0,
    stealsCount: 0,
    shutdownsCount: 0,
    firstBloodDone: false,
    dragonTimer: 5,
    baronTimer: 20,
    elderTimer: 999,
    baronBuffSide: null,
    baronBuffUntil: 0,
    elderBuffSide: null,
    elderBuffUntil: 0,
    soulSide: null,

    blueLaneTowers: { TOP: 3, MID: 3, BOT: 3 },
    redLaneTowers: { TOP: 3, MID: 3, BOT: 3 },
    blueNexusHP: 100,
    redNexusHP: 100,

    lastEventPos: null,
    events: initEvents,
    mvp: null,
    coachReport: null,
  };
}

// Calibrated single-sided strength differential (prevents double-counted snowball!)
function getMatchStrengthPair(state) {
  const m = state.minute;
  const goldDiff = state.blueGold - state.redGold;

  const sideBase = (side) => {
    const players = side === 'blue' ? state.bluePlayers : state.redPlayers;
    const team = side === 'blue' ? state.blueTeam : state.redTeam;
    const analysis = side === 'blue' ? state.blueAnalysis : state.redAnalysis;
    const tactics = side === 'blue' ? state.blueTactics : state.redTactics;
    const myGoldDiff = side === 'blue' ? goldDiff : -goldDiff;

    const duoMap = team.duoSynergy || {};
    const pairKey = (a, b) => [a, b].sort().join('|');
    const jgl = players.find(x => x.role === 'JGL');
    const mid = players.find(x => x.role === 'MID');
    const bot = players.find(x => x.role === 'BOT');
    const sup = players.find(x => x.role === 'SUP');
    const jmVal = (jgl && mid) ? (duoMap[pairKey(jgl.playerId, mid.playerId)] || 0) : 0;
    const bsVal = (bot && sup) ? (duoMap[pairKey(bot.playerId, sup.playerId)] || 0) : 0;
    const isUser = state.userSide === side;

    let avg = 0;
    for (const pl of players) {
      let duoBonus = 0;
      if (pl.role === 'JGL' || pl.role === 'MID') duoBonus = jmVal < 5 ? -1.1 : Math.min(2.6, (jmVal - 4) * 0.11);
      if (pl.role === 'BOT' || pl.role === 'SUP') duoBonus = bsVal < 5 ? -1.1 : Math.min(2.6, (bsVal - 4) * 0.11);
      avg += getEffectivePlayerRating(pl.playerRef, pl.champId, pl.oppChampId, state.patch, team, {
        highStakes: state.highStakes,
        goldDiff: myGoldDiff,
        teamTalk: isUser ? state.teamTalk : 'none',
        hasScrimIntel: isUser && state.hasScrimIntel,
        requestGranted: isUser && (state.grantedRequestIds || []).includes(pl.playerId),
        duoBonus,
      });
    }
    avg /= 5;
    // Compress raw individual OVR slightly so teamplay + tactics can genuinely upset ungelled superteams
    const ovrCompressed = 75 + (avg - 75) * 0.84;
    const chem = computeTeamChemistry(team, players);
    // Teamplay / chemistry matters even more in mid-to-late game 5v5 macro (15+ min)!
    const chemPhaseMult = m < 14 ? 0.85 : m < 24 ? 1.15 : 1.3;
    const chemMod = chem.totalImpact * chemPhaseMult;

    let phaseScore = 0;
    if (m < 15) phaseScore = analysis.early * state.patch.earlyWeight;
    else if (m < 25) phaseScore = analysis.mid * state.patch.midWeight;
    else phaseScore = analysis.late * state.patch.lateWeight;

    // 1. Base Gameplan Phase Impact (Amplified for real FM-grade tactical agency)
    let tacticMod = 0;
    if (tactics.gameplan === 'aggressive') tacticMod += m < 17 ? 3.8 : -1.4;
    if (tactics.gameplan === 'scaling') tacticMod += m < 15 ? -2.4 : m >= 24 ? 4.2 : 0.8;
    if (tactics.gameplan === 'split') tacticMod += m >= 17 ? 3.2 : -0.6;
    if (tactics.gameplan === 'balanced') tacticMod += 1.0;

    // 2. Rock-Paper-Scissors Counter-Tactics Matrix vs Opponent's Gameplan!
    const oppTactics = side === 'blue' ? state.redTactics : state.blueTactics;
    let counterMod = 0;
    if (tactics.gameplan === 'aggressive' && oppTactics.gameplan === 'scaling') counterMod = m < 21 ? 3.4 : -0.6;
    else if (tactics.gameplan === 'scaling' && oppTactics.gameplan === 'balanced') counterMod = m >= 20 ? 3.0 : -0.4;
    else if (tactics.gameplan === 'balanced' && oppTactics.gameplan === 'aggressive') counterMod = 2.6;
    else if (tactics.gameplan === 'split' && oppTactics.gameplan === 'scaling') counterMod = m >= 16 ? 3.3 : 0.4;
    else if (tactics.gameplan === 'aggressive' && oppTactics.gameplan === 'split') counterMod = m < 20 ? 2.5 : 0;

    // 3. Lane Focus Matchup Exploitation (Targeting opponent's weak link!)
    const oppPlayers = side === 'blue' ? state.redPlayers : state.bluePlayers;
    const focusRole = tactics.laneFocus || 'MID';
    const myFocusP = players.find(x => x.role === focusRole);
    const oppFocusP = oppPlayers.find(x => x.role === focusRole);
    let laneFocusMod = 0;
    if (myFocusP && oppFocusP) {
      const ovrEdge = (myFocusP.playerRef.ovr - oppFocusP.playerRef.ovr) * 0.24;
      const counterEdge = getMatchupAdvantage(myFocusP.champId, oppFocusP.champId) * 0.5;
      laneFocusMod = clamp(ovrEdge + counterEdge + 0.6, -2.2, 3.6);
    }

    // 4. Individual Role Directives & Player-Style Fluency + Contradiction Penalty
    let fitMod = 0;
    const topP = players.find(x => x.role === 'TOP');
    if (tactics.supStyle === 'roam') fitMod += m < 19 ? 1.5 : -0.3;
    if (tactics.supStyle === 'peel') fitMod += m >= 19 ? 1.8 : -0.3;
    if (tactics.adcStyle === 'safe') fitMod += m >= 21 ? 1.6 : -0.4;
    if (tactics.adcStyle === 'aggressive') fitMod += m < 18 ? 1.6 : -0.3;
    if (tactics.topStyle === 'carry') fitMod += topP?.playerRef?.style === 'Aggressive' || topP?.playerRef?.style === 'Playmaker' ? 1.6 : 0.7;
    if (tactics.topStyle === 'weakside') fitMod += topP?.playerRef?.style === 'Weakside' ? 1.5 : 0.5;

    // Structural Synergy / Contradiction check (FM Tactical Coherence directly impacts match!)
    if (tactics.laneFocus === 'TOP' && tactics.topStyle === 'weakside') fitMod -= 2.4;
    if (tactics.laneFocus === 'TOP' && tactics.topStyle === 'carry') fitMod += 1.6;
    if (tactics.laneFocus === 'BOT' && tactics.adcStyle === 'aggressive') fitMod += 1.5;
    if (tactics.laneFocus === 'MID' && tactics.supStyle === 'roam') fitMod += 1.5;
    if (tactics.gameplan === 'split' && tactics.topStyle === 'weakside') fitMod -= 1.8;

    // 5. Draft-to-Tactic Alignment Bonus!
    let draftFitMod = 0;
    if (tactics.gameplan === 'aggressive' && analysis.early >= 7.4) draftFitMod += 2.2;
    else if (tactics.gameplan === 'scaling' && analysis.late >= 7.6) draftFitMod += 2.4;
    else if (tactics.gameplan === 'balanced' && analysis.mid >= 7.5) draftFitMod += 1.8;
    else if (tactics.gameplan === 'split' && analysis.early + analysis.late >= 14.8) draftFitMod += 1.8;

    // 6. FM26 Dual-Phase Tactics: Ahead Plan (> +1200g) vs Behind Plan (< -1200g)
    let statePlanMod = 0;
    if (myGoldDiff > 1200) {
      if (tactics.aheadPlan === 'choke') statePlanMod += m >= 17 ? 2.4 : 1.0;
      else if (tactics.aheadPlan === 'split131') statePlanMod += m >= 19 ? 2.6 : 0.8;
      else if (tactics.aheadPlan === 'dive') statePlanMod += m < 23 ? 2.6 : 0.5;
    } else if (myGoldDiff < -1200) {
      if (tactics.behindPlan === 'scale') statePlanMod += m >= 22 ? 2.8 : 0.6;
      else if (tactics.behindPlan === 'pick') statePlanMod += 2.2;
      else if (tactics.behindPlan === 'crossmap') statePlanMod += 2.0;
    }

    // 7. Live Touchline Shout Surge (4-minute active coaching boost!)
    const shoutObj = side === 'blue' ? state.blueShoutBoost : state.redShoutBoost;
    const shoutMod = shoutObj && m <= shoutObj.until ? shoutObj.power : 0;

    const totalTacticImpact = tacticMod + counterMod + laneFocusMod + fitMod + draftFitMod + statePlanMod + shoutMod;

    const baronMod = state.baronBuffSide === side && m <= state.baronBuffUntil ? 4.2 : 0;
    const elderMod = state.elderBuffSide === side && m <= state.elderBuffUntil ? 6.5 : 0;

    // Elemental Dragon Soul identity bonus!
    const elId = state.riftElement?.id || 'INFERNAL';
    let soulMod = 0;
    if (state.soulSide === side) {
      if (elId === 'INFERNAL') soulMod = 4.0;
      else if (elId === 'OCEAN') soulMod = m >= 26 ? 4.3 : 3.5;
      else if (elId === 'HEXTECH') soulMod = 4.1;
      else if (elId === 'CHEMTECH') soulMod = myGoldDiff < 0 ? 4.6 : 3.4;
      else if (elId === 'MOUNTAIN') soulMod = 3.8;
      else soulMod = 3.6;
    }

    // Pro Comp Archetype Matchup Edge (Engage > Poke > Disengage > Engage) + Item Power Spike bonus
    const compMatchupMod = (analysis.compCounterEdge || 0) * (m >= 16 ? 1.0 : 0.45);
    const myItems = players.reduce((s, p) => s + (p.itemCount || 0), 0);
    const oppItems = oppPlayers.reduce((s, p) => s + (p.itemCount || 0), 0);
    const itemSpikeMod = clamp((myItems - oppItems) * 0.55, -2.5, 2.5);

    // Pre-Game Opening Plan (Lane Swap & Jungle Pathing)
    let openingMod = 0;
    if (isUser && state.openingPlan) {
      if (state.openingPlan.laneSwap && m <= 12) openingMod += 1.4;
      if (state.openingPlan.junglePath === 'invade' && m <= 9) openingMod += 1.8;
      if (state.openingPlan.junglePath === 'top' && m <= 13 && tactics.laneFocus === 'TOP') openingMod += 1.2;
      if (state.openingPlan.junglePath === 'bot' && m <= 13 && tactics.laneFocus === 'BOT') openingMod += 1.2;
    }

    // Weekly Match Preparation Focus bonus (amplified!)
    let prepMod = 0;
    const prep = team.matchPrep || 'none';
    if (prep === 'laning' && m < 16) prepMod = 2.4;
    else if (prep === 'objectives' && (m === 6 || m === 11 || m === 15 || m >= state.dragonTimer - 1 || m >= state.baronTimer - 1)) prepMod = 2.6;
    else if (prep === 'teamfight' && m >= 15) prepMod = 2.4;
    else if (prep === 'comeback' && myGoldDiff < -1200) prepMod = 3.0;

    return {
      total: ovrCompressed + chemMod + phaseScore * 0.95 + totalTacticImpact + compMatchupMod + itemSpikeMod + openingMod + baronMod + elderMod + soulMod + prepMod,
      tacticOnly: +(totalTacticImpact + prepMod + openingMod).toFixed(1),
      chemOnly: +chemMod.toFixed(1),
      chemIndex: chem.chemIndex,
      counterMod: +counterMod.toFixed(1),
      laneFocusMod: +laneFocusMod.toFixed(1),
      draftFitMod: +draftFitMod.toFixed(1),
      shoutMod: +shoutMod.toFixed(1),
    };
  };

  const bRes = sideBase('blue');
  const rRes = sideBase('red');
  const bBase = bRes.total;
  const rBase = rRes.total;

  // Expose real-time Tactical & Teamplay Telemetry for the Broadcast HUD!
  state.tacticalEdge = {
    blueTactic: bRes.tacticOnly,
    redTactic: rRes.tacticOnly,
    diff: +(bRes.tacticOnly - rRes.tacticOnly).toFixed(1),
    blueChem: bRes.chemOnly,
    redChem: rRes.chemOnly,
    blueChemIndex: bRes.chemIndex,
    redChemIndex: rRes.chemIndex,
    blueCounter: bRes.counterMod,
    redCounter: rRes.counterMod,
    blueLaneFocus: bRes.laneFocusMod,
    redLaneFocus: rRes.laneFocusMod,
    blueShout: bRes.shoutMod,
    redShout: rRes.shoutMod,
  };

  // Realistic pro LoL gold-to-strength curve (diminishes post-30m as carries hit item caps)
  const lateDiminish = m >= 36 ? 0.68 : m >= 30 ? 0.84 : 1.0;
  const goldMod = clamp((goldDiff / 1450) * lateDiminish, -18, 18);
  const netDiff = (bBase - rBase) + goldMod;
  // Realistic logistic curve: close games stay 50/50, +4k gold = ~68%, +10k gold = ~88%
  const blueWinProb = clamp(1 / (1 + Math.exp(-netDiff / 9.2)), 0.05, 0.95);
  return { blueStr: bBase + goldMod * 0.45, redStr: rBase - goldMod * 0.45, blueWinProb, netDiff };
}

function updatePlayerPositions(state, focusPoint = null) {
  const m = state.minute;
  const moveTeam = (players, side, tactics, oppTowers) => {
    for (const pl of players) {
      let [tx, ty] = HOME_POS[side][pl.role];
      const pushShift = (side === 'blue' ? 1 : -1) * Math.min(16, (m / 35) * 14 + (9 - (oppTowers.TOP + oppTowers.MID + oppTowers.BOT)) * 1.5);

      if (focusPoint && m >= 12 && Math.random() < 0.72) {
        tx = focusPoint.x + rand(-6, 6);
        ty = focusPoint.y + rand(-6, 6);
      } else {
        if (pl.role === 'JGL') {
          const fl = LANE_COORDS[tactics.laneFocus] || LANE_COORDS.MID;
          tx = (tx + fl.x) / 2 + rand(-7, 7);
          ty = (ty + fl.y) / 2 + rand(-7, 7);
        } else if (pl.role === 'SUP' && tactics.supStyle === 'roam' && m >= 6) {
          tx = 50 + rand(-10, 10);
          ty = 50 + rand(-10, 10);
        } else if (pl.role === 'TOP' && (tactics.gameplan === 'split' || tactics.topStyle === 'carry') && m >= 16) {
          tx = side === 'blue' ? 58 + rand(-6, 8) : 25 + rand(-6, 6);
          ty = 16 + rand(-3, 4);
        } else if (m >= 20) {
          tx = 50 + pushShift * 0.7 + rand(-12, 12);
          ty = 50 - pushShift * 0.7 + rand(-12, 12);
        } else {
          tx += pushShift * 0.35 + rand(-4, 4);
          ty -= pushShift * 0.35 + rand(-4, 4);
        }
      }
      pl.x = clamp(Math.round(tx), 10, 90);
      pl.y = clamp(Math.round(ty), 10, 90);
    }
  };
  moveTeam(state.bluePlayers, 'blue', state.blueTactics, state.redLaneTowers);
  moveTeam(state.redPlayers, 'red', state.redTactics, state.blueLaneTowers);
}

function awardKill(state, killerSide, killerRole, victimRole, assistRoles = []) {
  const kTeam = killerSide === 'blue' ? state.bluePlayers : state.redPlayers;
  const vTeam = killerSide === 'blue' ? state.redPlayers : state.bluePlayers;
  const killer = kTeam.find(p => p.role === killerRole) || kTeam[0];
  const victim = vTeam.find(p => p.role === victimRole) || vTeam[0];

  const isFB = !state.firstBloodDone;
  if (isFB) state.firstBloodDone = true;

  // Shutdown Bounty check!
  let shutdownGold = 0;
  if (victim.spree >= 3) {
    shutdownGold = Math.min(700, 150 + (victim.spree - 2) * 150);
    state.shutdownsCount++;
  }
  victim.spree = 0;

  killer.kills++;
  killer.spree++;
  killer.gold += (isFB ? 400 : 300) + shutdownGold;
  killer.dmg += Math.round(rand(780, 1320));

  victim.deaths++;
  victim.deadUntilMin = state.minute + 1;
  victim.dmg += Math.round(rand(260, 580));

  // Real League of Legends rule: 150g total assist pool split among unique assisters
  const uniqueAssisters = [];
  for (const ar of assistRoles) {
    if (ar === killerRole) continue;
    const assister = kTeam.find(p => p.role === ar);
    if (assister && !uniqueAssisters.includes(assister)) {
      uniqueAssisters.push(assister);
    }
  }
  const assistShare = uniqueAssisters.length > 0 ? Math.round(150 / uniqueAssisters.length) : 0;
  for (const assister of uniqueAssisters) {
    assister.assists++;
    assister.gold += assistShare;
    assister.dmg += Math.round(rand(380, 760));
  }

  if (killerSide === 'blue') state.blueKills++;
  else state.redKills++;

  return { killer, victim, isFB, shutdownGold };
}

// Calibrated FM Rating (3.5 - 10.0) computed from real performance telemetry
function recomputePlayerRatings(state) {
  const calcSide = (players, oppPlayers, teamKills, wonBonus = 0) => {
    const totalDmg = players.reduce((s, p) => s + p.dmg, 0) || 1;
    for (const p of players) {
      const opp = oppPlayers.find(o => o.role === p.role);
      const kp = teamKills > 0 ? (p.kills + p.assists) / teamKills : 0.5;
      const kdaScore = (p.kills * 0.42 + p.assists * 0.22 - p.deaths * 0.36);
      const goldLeadScore = opp ? clamp((p.gold - opp.gold) / 2200, -0.8, 0.9) : 0;
      const dmgScore = p.role === 'SUP' ? clamp(p.vision / Math.max(1, state.minute) * 0.22, 0, 0.6) : clamp(((p.dmg / totalDmg) - 0.18) * 3.0, -0.4, 0.7);
      const raw = 6.2 + kdaScore + goldLeadScore + dmgScore + (kp - 0.5) * 0.6 + wonBonus;
      p.rating = +clamp(raw, 3.5, 9.9).toFixed(1);
    }
  };
  calcSide(state.bluePlayers, state.redPlayers, state.blueKills, state.finished ? (state.winner === 'blue' ? 0.4 : -0.3) : 0);
  calcSide(state.redPlayers, state.bluePlayers, state.redKills, state.finished ? (state.winner === 'red' ? 0.4 : -0.3) : 0);
}

function buildCoachAnalysis(state) {
  const userSide = state.userSide || 'blue';
  const myTeam = userSide === 'blue' ? state.blueTeam : state.redTeam;
  const oppTeam = userSide === 'blue' ? state.redTeam : state.blueTeam;
  const myPlayers = userSide === 'blue' ? state.bluePlayers : state.redPlayers;
  const myDraft = userSide === 'blue' ? state.blueAnalysis : state.redAnalysis;
  const oppDraft = userSide === 'blue' ? state.redAnalysis : state.blueAnalysis;
  const sign = userSide === 'blue' ? 1 : -1;

  const gd15 = state.gd15 !== null ? state.gd15 * sign : 0;
  const gd25 = state.gd25 !== null ? state.gd25 * sign : ((state.blueGold - state.redGold) * sign);
  const gdEnd = (state.blueGold - state.redGold) * sign;

  const midSwing = gd25 - gd15;
  const lateSwing = gdEnd - gd25;

  const sortedByRating = [...myPlayers].sort((a, b) => b.rating - a.rating);
  const bestP = sortedByRating[0];
  const worstP = sortedByRating[sortedByRating.length - 1];

  const notes = [];
  const draftDiff = myDraft.score - oppDraft.score;
  if (draftDiff >= 4) notes.push(`Draft avantajı (+${draftDiff} puan) kompozisyon üstünlüğü sağladı.`);
  else if (draftDiff <= -4) notes.push(`Draft dezavantajı (${draftDiff} puan) özellikle takım savaşlarında işi zorlaştırdı.`);

  if (gd15 >= 1800) notes.push(`Erken oyunda (0-15') +${(gd15 / 1000).toFixed(1)}k altın farkıyla koridor hakimiyeti kuruldu.`);
  else if (gd15 <= -1800) notes.push(`Erken oyunda (0-15') ${(gd15 / 1000).toFixed(1)}k geriye düşüldü; erken baskıya karşı savunma zayıf kaldı.`);

  if (midSwing >= 2200) notes.push(`Orta oyunda (15-25') objektif savaşlarıyla +${(midSwing / 1000).toFixed(1)}k büyük ivme yakalandı.`);
  else if (midSwing <= -2200) notes.push(`Orta oyunda (15-25') ${(midSwing / 1000).toFixed(1)}k altın kaybıyla maçın kontrolü rakibe geçti.`);

  if (worstP && worstP.playerRef.fatigue >= 65) {
    notes.push(`${worstP.name} (%${worstP.playerRef.fatigue} yorgunluk) maçta düşük performans gösterdi — dinlendirme antrenmanı önerilir.`);
  } else if (worstP && (worstP.playerRef.importWeeksLeft || 0) > 0) {
    notes.push(`${worstP.name} henüz dil/iletişim uyum sürecinde (${worstP.playerRef.importWeeksLeft} hafta kaldı).`);
  }

  if (notes.length === 0) notes.push(`Dengeli geçen maçta karar anlarındaki takım savaşı infazı skoru belirledi.`);

  return {
    draftDiff,
    gd15,
    midSwing,
    lateSwing,
    bestPlayer: `${bestP.name} (${bestP.role}, ${bestP.rating})`,
    weakestPlayer: `${worstP.name} (${worstP.role}, ${worstP.rating})`,
    notes,
  };
}

export function stepMatchMinute(state) {
  if (state.finished) return state;
  state.minute++;
  const m = state.minute;

  const { blueStr, redStr, blueWinProb } = getMatchStrengthPair(state);

  // 1. Calibrated Pro LoL Passive CS, Gold, Damage & Vision (Minions spawn 1:05, collide 1:35)
  const updateFarm = (players, tactics, teamStr, oppStr) => {
    const earlyDampen = m <= 14 ? 0.55 : 0.82;
    const adv = clamp((teamStr - oppStr) * 0.015 * earlyDampen, -0.35, 0.35);
    const waveScale = m === 1 ? 0 : m === 2 ? 0.35 : m === 3 ? 0.8 : 1.0;

    for (const pl of players) {
      let baseCS =
        pl.role === 'SUP'
          ? rand(0.7, 1.2)
          : pl.role === 'JGL'
          ? rand(5.1, 6.2)
          : rand(7.6, 8.9);

      // Role Micro-Tactic resource shifts (balanced zero-sum feel)
      if (pl.role === 'TOP' && tactics.topStyle === 'carry') baseCS *= 1.06;
      if (pl.role === 'TOP' && tactics.topStyle === 'weakside') baseCS *= 0.94;
      if (pl.role === 'BOT' && tactics.topStyle === 'weakside') baseCS *= 1.04;
      if (pl.role === 'BOT' && tactics.adcStyle === 'safe') baseCS *= 1.03;

      const laningBonus = (pl.playerRef.attrs.laning - 80) * 0.024 * earlyDampen;
      const gainedCS = waveScale === 0 ? 0 : Math.max(0, Math.round((baseCS + laningBonus + adv) * waveScale));
      pl.cs += gainedCS;

      // Ambient gold (~122g/min after 1:50) + CS gold (~20g avg) + Support item gold
      const ambientGold = m === 1 ? 30 : 122;
      const supItemGold = pl.role === 'SUP' && m >= 2 && m <= 22 ? 85 : pl.role === 'SUP' ? 40 : 0;
      pl.gold += Math.round(ambientGold + gainedCS * 20 + supItemGold);
      pl.items = getPlayerItems(pl.gold, pl.role, pl.champDmg);
      pl.itemCount = pl.items.length;

      let dmgMult = pl.role === 'BOT' || pl.role === 'MID' ? 1.32 : pl.role === 'TOP' ? 1.05 : pl.role === 'JGL' ? 0.88 : 0.45;
      if (pl.role === 'BOT' && tactics.supStyle === 'peel' && m >= 18) dmgMult *= 1.1;
      if (pl.role === 'TOP' && tactics.topStyle === 'carry') dmgMult *= 1.1;
      pl.dmg += m === 1 ? Math.round(rand(40, 120)) : Math.round(rand(210, 420) * dmgMult * (1 + m * 0.022));

      let visMult = pl.role === 'SUP' ? 2.4 : pl.role === 'JGL' ? 1.4 : 0.85;
      if (pl.role === 'SUP' && tactics.supStyle === 'roam') visMult *= 1.15;
      pl.vision += +(rand(0.7, 1.3) * visMult).toFixed(1);
    }
  };
  updateFarm(state.bluePlayers, state.blueTactics, blueStr, redStr);
  updateFarm(state.redPlayers, state.redTactics, redStr, blueStr);

  // Subtle Turret Plating income (minutes 7-13, realistic ~125g-250g max per event)
  if (m >= 7 && m <= 13 && Math.random() < 0.26) {
    const plateSide = Math.random() < blueWinProb ? 'blue' : 'red';
    const plateTeam = plateSide === 'blue' ? state.bluePlayers : state.redPlayers;
    const plateLane = pick(['TOP', 'MID', 'BOT']);
    const laneCarry = plateTeam.find(p => p.role === plateLane);
    if (laneCarry) {
      if (plateLane === 'BOT') {
        laneCarry.gold += 80;
        const sup = plateTeam.find(p => p.role === 'SUP');
        if (sup) sup.gold += 80;
      } else {
        laneCarry.gold += 140;
      }
    }
  }

  let focusPoint = null;

  // 2. Attribute-Driven Lane Skirmishes, Ganks & 1v1 Solo Kills (Authentic LCK/Pro pacing)
  const aggroMod = (state.blueTactics.gameplan === 'aggressive' ? 0.045 : 0) + (state.redTactics.gameplan === 'aggressive' ? 0.045 : 0);
  const earlyTempo = m <= 12 ? 0.17 : 0.24;
  if (m >= 4 && Math.random() < earlyTempo + aggroMod) {
    const isGank = Math.random() < 0.64;
    if (isGank) {
      // Pick attacking side using calibrated probability
      const killerSide = Math.random() < blueWinProb ? 'blue' : 'red';
      const tactics = killerSide === 'blue' ? state.blueTactics : state.redTactics;
      const oppTactics = killerSide === 'blue' ? state.redTactics : state.blueTactics;

      let targetLane = Math.random() < 0.55 ? tactics.laneFocus : pick(['TOP', 'MID', 'BOT']);
      if (tactics.topStyle === 'carry' && Math.random() < 0.35) targetLane = 'TOP';
      // Weakside Top / Safe ADC harder to gank!
      const dodged = (targetLane === 'TOP' && oppTactics.topStyle === 'weakside' && Math.random() < 0.32)
        || (targetLane === 'BOT' && oppTactics.adcStyle === 'safe' && Math.random() < 0.28);

      if (!dodged) {
        const killerRole = Math.random() < 0.42 ? 'JGL' : targetLane;
        const assists = targetLane === 'BOT' ? ['JGL', 'BOT', 'SUP'] : ['JGL', targetLane];
        if (tactics.supStyle === 'roam' && (targetLane === 'MID' || targetLane === 'TOP')) assists.push('SUP');
        const victimRole = targetLane === 'BOT' ? (Math.random() < 0.55 ? 'BOT' : 'SUP') : targetLane;
        const { killer, victim, isFB, shutdownGold } = awardKill(state, killerSide, killerRole, victimRole, assists);
        const tag = killerSide === 'blue' ? state.blueTeam.tag : state.redTeam.tag;
        const oppTag = killerSide === 'blue' ? state.redTeam.tag : state.blueTeam.tag;

        // 25% chance of return trade kill on gank (makes scores realistic like 15-10!)
        let tradeText = '';
        if (Math.random() < 0.26) {
          const oppSide = killerSide === 'blue' ? 'red' : 'blue';
          const ret = awardKill(state, oppSide, targetLane === 'BOT' ? 'BOT' : targetLane, Math.random() < 0.5 ? 'JGL' : targetLane, ['SUP']);
          tradeText = ` (${oppTag} ${ret.killer.name} takas skoru çıkardı)`;
        }

        state.events.push({
          min: m,
          type: shutdownGold > 0 ? 'SHUTDOWN' : isFB ? 'FIRST_BLOOD' : 'KILL',
          tag: shutdownGold > 0 ? `SHUTDOWN +${shutdownGold}` : isFB ? 'İLK KAN' : 'BASKIN',
          side: killerSide,
          text: `${tag} ${killer.name} (${killer.champName}), ${targetLane} baskınında ${oppTag} ${victim.name}'ı düşürdü${tradeText}.`,
        });
        focusPoint = LANE_COORDS[targetLane];
        state.lastEventPos = { ...focusPoint, color: killerSide === 'blue' ? '#38bdf8' : '#f43f5e' };
      }
    } else {
      // True 1v1 Attribute & Counter Matchup Duel!
      const laneRole = pick(['TOP', 'MID', 'BOT']);
      const bp = state.bluePlayers.find(p => p.role === laneRole);
      const rp = state.redPlayers.find(p => p.role === laneRole);
      const laneGoldEdge = clamp((bp.gold - rp.gold) / 260, -14, 14);
      const bDuel = bp.playerRef.attrs.mechanics * 0.55 + bp.playerRef.attrs.laning * 0.45 + getMatchupAdvantage(bp.champId, rp.champId) * 2.2 + laneGoldEdge;
      const rDuel = rp.playerRef.attrs.mechanics * 0.55 + rp.playerRef.attrs.laning * 0.45 + getMatchupAdvantage(rp.champId, bp.champId) * 2.2;
      const bSoloProb = clamp(1 / (1 + Math.exp(-(bDuel - rDuel) / 9)), 0.08, 0.92);
      const killerSide = Math.random() < bSoloProb ? 'blue' : 'red';
      const { killer, victim, isFB, shutdownGold } = awardKill(state, killerSide, laneRole, laneRole, laneRole === 'BOT' ? ['SUP'] : []);
      const tag = killerSide === 'blue' ? state.blueTeam.tag : state.redTeam.tag;
      state.events.push({
        min: m,
        type: shutdownGold > 0 ? 'SHUTDOWN' : isFB ? 'FIRST_BLOOD' : 'SOLO',
        tag: shutdownGold > 0 ? `SHUTDOWN +${shutdownGold}` : isFB ? 'İLK KAN' : 'SOLO KILL',
        side: killerSide,
        text: `${tag} ${killer.name} (${killer.champName}), 1v1 koridor eşleşmesinde ${victim.name} (${victim.champName}) karşısında üstünlük kurdu.`,
      });
      focusPoint = LANE_COORDS[laneRole];
      state.lastEventPos = { ...focusPoint, color: killerSide === 'blue' ? '#38bdf8' : '#f43f5e' };
    }
  }

  // 3. Voidgrubs / Rift Herald (Objective tactic heavily steers control!)
  if (m === 6 || m === 11 || m === 15) {
    let grubsProb = blueWinProb + (state.blueTactics.objective === 'baron' ? 0.14 : 0) - (state.redTactics.objective === 'baron' ? 0.14 : 0);
    const side = Math.random() < clamp(grubsProb, 0.08, 0.92) ? 'blue' : 'red';
    const objName = m === 15 ? 'Vadi Alameti' : 'Hiçlik Kurtçukları';
    if (side === 'blue') { state.blueGrubs++; state.bluePlayers.forEach(p => { p.gold += 45; }); }
    else { state.redGrubs++; state.redPlayers.forEach(p => { p.gold += 45; }); }
    const tag = side === 'blue' ? state.blueTeam.tag : state.redTeam.tag;
    state.events.push({ min: m, type: 'OBJECTIVE', tag: 'OBJEKTİF', side, text: `${tag}, ${objName} objektifini kontrol altına aldı.` });
    focusPoint = LANE_COORDS.BARON;
    state.lastEventPos = { ...focusPoint, color: '#a855f7' };
  }

  // 4. Dragon & Smite Steals (Dragon objective priority strongly boosts contest winrate!)
  if (m >= state.dragonTimer && !state.soulSide) {
    let dragProb = blueWinProb + (state.blueTactics.objective === 'dragon' ? 0.14 : 0) - (state.redTactics.objective === 'dragon' ? 0.14 : 0);
    let winner = Math.random() < clamp(dragProb, 0.08, 0.92) ? 'blue' : 'red';
    const contested = m >= 10 ? Math.random() < 0.62 : Math.random() < 0.35;
    let stolen = false;

    if (contested) {
      const loser = winner === 'blue' ? 'red' : 'blue';
      const wKills = 1 + (Math.random() < 0.45 ? 1 : 0);
      const lKills = Math.random() < 0.65 ? 1 : 0;
      for (let i = 0; i < wKills; i++) awardKill(state, winner, pick(['MID', 'BOT', 'JGL']), pick(['SUP', 'JGL', 'BOT', 'TOP']), ['SUP', 'JGL', 'MID']);
      for (let i = 0; i < lKills; i++) awardKill(state, loser, pick(['MID', 'BOT', 'TOP']), pick(['SUP', 'TOP', 'JGL']), ['SUP', 'JGL']);

      // Smite Steal check by losing jungler!
      const lJgl = (loser === 'blue' ? state.bluePlayers : state.redPlayers).find(p => p.role === 'JGL');
      const stealChance = 0.07 + Math.max(0, (lJgl.playerRef.attrs.clutch - 78) * 0.004);
      if (Math.random() < stealChance) {
        winner = loser;
        stolen = true;
        state.stealsCount++;
      }
    }

    const curGD = state.blueGold - state.redGold;
    const isUnderdog = (winner === 'blue' && curGD <= -2500) || (winner === 'red' && curGD >= 2500);
    const dragPerPlayer = isUnderdog ? 85 : 40;
    if (winner === 'blue') { state.blueDragons++; state.bluePlayers.forEach(p => { p.gold += dragPerPlayer; }); }
    else { state.redDragons++; state.redPlayers.forEach(p => { p.gold += dragPerPlayer; }); }

    const dCount = winner === 'blue' ? state.blueDragons : state.redDragons;
    const tag = winner === 'blue' ? state.blueTeam.tag : state.redTeam.tag;
    const jglName = (winner === 'blue' ? state.bluePlayers : state.redPlayers).find(p => p.role === 'JGL')?.name;
    const isSoul = dCount >= 4;
    if (isSoul) {
      state.soulSide = winner;
      state.elderTimer = m + 6;
    }

    state.events.push({
      min: m,
      type: isSoul ? 'SOUL' : 'DRAGON',
      tag: stolen ? 'EJDER ÇALDI' : isSoul ? 'EJDER RUHU' : 'EJDER',
      side: winner,
      text: stolen
        ? `${tag} ${jglName}, kritik Çarp (Smite) ile Ejder'i çukurdan çaldı (${dCount}/4)!`
        : isSoul
          ? `${tag}, 4. ejderi alarak Ejder Ruhu'nu tamamladı. Kadim Ejder 6 dakika sonra doğacak.`
          : `${tag}, Ejder'i aldı (${dCount}/4)${contested ? ' ve çukur etrafındaki savaştan üstün çıktı.' : '.'}`,
    });
    focusPoint = LANE_COORDS.DRAGON;
    state.lastEventPos = { ...focusPoint, color: '#f59e0b' };
    state.dragonTimer = m + 5 + Math.floor(Math.random() * 2);
  }

  // 4b. Elder Dragon (after Soul!)
  if (state.soulSide && m >= state.elderTimer) {
    const winner = Math.random() < blueWinProb ? 'blue' : 'red';
    const loser = winner === 'blue' ? 'red' : 'blue';
    for (let i = 0; i < 3; i++) awardKill(state, winner, pick(['BOT', 'MID', 'TOP']), pick(ROLES), ['SUP', 'JGL']);
    awardKill(state, loser, pick(['BOT', 'MID']), pick(['SUP', 'JGL']), ['SUP']);

    if (winner === 'blue') state.blueElders++;
    else state.redElders++;
    state.elderBuffSide = winner;
    state.elderBuffUntil = m + 3;
    state.elderTimer = m + 6;

    const tag = winner === 'blue' ? state.blueTeam.tag : state.redTeam.tag;
    state.events.push({
      min: m,
      type: 'SOUL',
      tag: 'KADİM EJDER',
      side: winner,
      text: `${tag}, büyük 5v5 savaşının ardından Kadim Ejder güçlendirmesini aldı!`,
    });
    focusPoint = LANE_COORDS.DRAGON;
    state.lastEventPos = { ...focusPoint, color: '#f59e0b' };
  }

  // 5. Tower Takes (First turret starts ~13m+, Tower/Split tactics strongly accelerate siege!)
  const baseTowerChance = m < 16 ? 0.16 : 0.24;
  if (m >= 13 && Math.random() < baseTowerChance + (state.baronBuffSide ? 0.24 : 0)) {
    const baronTowerBoost = state.baronBuffSide === 'blue' ? 0.16 : state.baronBuffSide === 'red' ? -0.16 : 0;
    let towerProb = blueWinProb + baronTowerBoost + (state.blueTactics.objective === 'towers' || state.blueTactics.gameplan === 'split' ? 0.14 : 0) - (state.redTactics.objective === 'towers' || state.redTactics.gameplan === 'split' ? 0.14 : 0);
    const side = Math.random() < clamp(towerProb, 0.08, 0.92) ? 'blue' : 'red';
    const oppLanes = side === 'blue' ? state.redLaneTowers : state.blueLaneTowers;
    const availableLanes = ['TOP', 'MID', 'BOT'].filter(l => oppLanes[l] > 0);

    if (availableLanes.length > 0) {
      const lane = pick(availableLanes);
      oppLanes[lane]--;
      const curGD = state.blueGold - state.redGold;
      const isUnderdog = (side === 'blue' && curGD <= -2800) || (side === 'red' && curGD >= 2800);
      const isFirstTower = state.blueTowers + state.redTowers === 0;
      const perPlayerGold = 125 + (isFirstTower ? 30 : 0) + (isUnderdog ? 60 : 0);
      if (side === 'blue') { state.blueTowers++; state.bluePlayers.forEach(p => { p.gold += perPlayerGold; }); }
      else { state.redTowers++; state.redPlayers.forEach(p => { p.gold += perPlayerGold; }); }
      const tag = side === 'blue' ? state.blueTeam.tag : state.redTeam.tag;
      const tierText = oppLanes[lane] === 2 ? 'dış kulesini' : oppLanes[lane] === 1 ? 'iç kulesini' : 'inhibitör kulesini ve inhibitörü';
      state.events.push({
        min: m,
        type: 'TOWER',
        tag: isUnderdog ? 'ÖDÜL KULE' : 'KULE',
        side,
        text: `${tag}, ${lane} koridorundaki ${tierText} yıktı${isUnderdog ? ' (Geri Dönüş Ödülü!)' : '.'}`,
      });
      focusPoint = LANE_COORDS[lane];
      state.lastEventPos = { ...focusPoint, color: side === 'blue' ? '#38bdf8' : '#f43f5e' };
    }
  }

  // 6. Baron Nashor & Smite Steals
  if (m >= state.baronTimer && Math.random() < 0.32) {
    let baronProb = blueWinProb + (state.blueTactics.objective === 'baron' ? 0.14 : 0) - (state.redTactics.objective === 'baron' ? 0.14 : 0);
    let winner = Math.random() < clamp(baronProb, 0.16, 0.84) ? 'blue' : 'red';
    const loser = winner === 'blue' ? 'red' : 'blue';

    const wKills = 2 + Math.floor(Math.random() * 2);
    const lKills = 1 + Math.floor(Math.random() * 2); // realistic teamfight trades!
    const rolesShuffled = [...ROLES].sort(() => Math.random() - 0.5);
    for (let i = 0; i < wKills; i++) awardKill(state, winner, pick(['BOT', 'MID', 'TOP', 'JGL']), rolesShuffled[i], ROLES.slice(0, 3));
    for (let i = 0; i < lKills; i++) awardKill(state, loser, pick(['BOT', 'MID']), pick(['SUP', 'JGL', 'TOP']), ['SUP', 'MID']);

    // Baron Smite Steal!
    let stolen = false;
    const lJgl = (loser === 'blue' ? state.bluePlayers : state.redPlayers).find(p => p.role === 'JGL');
    const stealChance = 0.08 + Math.max(0, (lJgl.playerRef.attrs.clutch - 78) * 0.004);
    if (Math.random() < stealChance) {
      winner = loser;
      stolen = true;
      state.stealsCount++;
    }

    if (winner === 'blue') { state.blueBarons++; state.bluePlayers.forEach(p => { p.gold += 300; }); }
    else { state.redBarons++; state.redPlayers.forEach(p => { p.gold += 300; }); }
    state.baronBuffSide = winner;
    state.baronBuffUntil = m + 3;
    state.baronTimer = m + 7;

    const tag = winner === 'blue' ? state.blueTeam.tag : state.redTeam.tag;
    const jglName = (winner === 'blue' ? state.bluePlayers : state.redPlayers).find(p => p.role === 'JGL')?.name;
    state.events.push({
      min: m,
      type: 'BARON',
      tag: stolen ? 'BARON ÇALDI' : 'BARON',
      side: winner,
      text: stolen
        ? `İNANILMAZ! ${tag} ${jglName}, rakibin elinden Baron Nashor'u çaldı ve maçın dengesini değiştirdi!`
        : `${tag}, büyük 5v5 takım savaşını ${wKills}-${lKills} kazanıp Baron Nashor güçlendirmesini aldı.`,
    });
    focusPoint = LANE_COORDS.BARON;
    state.lastEventPos = { ...focusPoint, color: '#a855f7' };
  }

  // 7. Recalculate Gold, GD@15, GD@25, Ratings & Positions
  state.blueGold = state.bluePlayers.reduce((s, p) => s + p.gold, 0);
  state.redGold = state.redPlayers.reduce((s, p) => s + p.gold, 0);
  state.goldHistory.push(state.blueGold - state.redGold);
  if (m === 15) state.gd15 = state.blueGold - state.redGold;
  if (m === 25) state.gd25 = state.blueGold - state.redGold;

  recomputePlayerRatings(state);
  updatePlayerPositions(state, focusPoint);

  // 8. Nexus Push / Game End Check (Only a side with real tower/gold/buff map control can destroy Nexus!)
  if (m >= 23) {
    const blueAdv = state.blueGold - state.redGold;
    const blueHasBuff = state.baronBuffSide === 'blue' || state.elderBuffSide === 'blue';
    const redHasBuff = state.baronBuffSide === 'red' || state.elderBuffSide === 'red';
    const blueCanEnd = (state.blueTowers >= 6 && blueAdv >= 2500)
      || (state.blueTowers >= 5 && blueHasBuff && blueAdv >= -1500)
      || (state.blueTowers >= 4 && blueAdv >= 9000)
      || (m >= 36 && state.blueTowers >= 4 && blueAdv >= -1000)
      || (m >= 44 && blueAdv >= 0);
    const redCanEnd = (state.redTowers >= 6 && blueAdv <= -2500)
      || (state.redTowers >= 5 && redHasBuff && blueAdv <= 1500)
      || (state.redTowers >= 4 && blueAdv <= -9000)
      || (m >= 36 && state.redTowers >= 4 && blueAdv <= 1000)
      || (m >= 44 && blueAdv < 0);

    const isStomp = Math.abs(blueAdv) >= 12000;
    const endChance = m >= 50 ? 1.0 : m >= 38 ? 0.65 : isStomp ? 0.52 : (blueHasBuff || redHasBuff) ? 0.36 : 0.24;

    if ((blueCanEnd || redCanEnd) && Math.random() < endChance) {
      let winner;
      if (blueCanEnd && !redCanEnd) winner = 'blue';
      else if (redCanEnd && !blueCanEnd) winner = 'red';
      else winner = Math.random() < blueWinProb ? 'blue' : 'red';
      const loser = winner === 'blue' ? 'red' : 'blue';
      // Final teamfight (3-1 realistic finish)
      for (const r of ROLES.slice(0, 3)) awardKill(state, winner, pick(['BOT', 'MID', 'TOP']), r, ['SUP', 'JGL']);
      awardKill(state, loser, pick(['BOT', 'MID']), pick(['SUP', 'TOP']), ['SUP']);

      if (winner === 'blue') { state.redNexusHP = 0; state.blueTowers = Math.max(state.blueTowers, 9); }
      else { state.blueNexusHP = 0; state.redTowers = Math.max(state.redTowers, 9); }

      state.blueGold = state.bluePlayers.reduce((s, p) => s + p.gold, 0);
      state.redGold = state.redPlayers.reduce((s, p) => s + p.gold, 0);
      state.goldHistory[state.goldHistory.length - 1] = state.blueGold - state.redGold;

      const finalizeShares = (list, totalGold) => {
        const totalDmg = list.reduce((s, p) => s + p.dmg, 0) || 1;
        for (const p of list) {
          p.dmgShare = Math.round((p.dmg / totalDmg) * 100);
          p.goldShare = Math.round((p.gold / (totalGold || 1)) * 100);
          p.vision = Math.round(p.vision);
        }
      };
      finalizeShares(state.bluePlayers, state.blueGold);
      finalizeShares(state.redPlayers, state.redGold);

      state.finished = true;
      state.winner = winner;
      recomputePlayerRatings(state);

      const winPlayers = winner === 'blue' ? state.bluePlayers : state.redPlayers;
      const mvp = [...winPlayers].sort((a, b) => (b.rating * 10 + b.kills * 1.5 + b.assists - b.deaths) - (a.rating * 10 + a.kills * 1.5 + a.assists - a.deaths))[0];
      state.mvp = mvp;
      state.coachReport = buildCoachAnalysis(state);

      const winTeam = winner === 'blue' ? state.blueTeam : state.redTeam;
      state.events.push({
        min: m,
        type: 'NEXUS',
        tag: 'NEXUS',
        side: winner,
        text: `${winTeam.name} (${winTeam.tag}) ${m}. dakikada galibiyete uzandı. MVP: ${mvp.name} (${mvp.champName}, ${mvp.kills}/${mvp.deaths}/${mvp.assists})`,
      });
      const baseCoord = winner === 'blue' ? LANE_COORDS.RED_BASE : LANE_COORDS.BLUE_BASE;
      state.lastEventPos = { ...baseCoord, color: winner === 'blue' ? '#38bdf8' : '#f43f5e' };
      updatePlayerPositions(state, baseCoord);
    }
  }

  return state;
}

export function finishMatchInstantly(state) {
  while (!state.finished && state.minute < 55) {
    stepMatchMinute(state);
  }
  return state;
}

export function applyPlayerInGameDecision(matchState, userPlayerId, option) {
  if (!matchState || matchState.finished || !option) return { success: false, text: '' };
  const side = matchState.userSide || 'blue';
  const myPlayers = side === 'blue' ? matchState.bluePlayers : matchState.redPlayers;
  const oppPlayers = side === 'blue' ? matchState.redPlayers : matchState.bluePlayers;
  const mp = myPlayers.find(p => p.playerId === userPlayerId) || myPlayers[0];
  if (!mp) return { success: false, text: '' };

  const opp = oppPlayers.find(p => p.role === mp.role) || oppPlayers[0];
  const attrVal = mp.playerRef?.attrs?.[option.attr || 'mechanics'] ?? mp.playerRef?.ovr ?? 76;
  const successProb = clamp((option.baseProb ?? 0.62) + (attrVal - 75) * 0.012, 0.25, 0.92);
  const ok = Math.random() < successProb;
  const m = matchState.minute;
  const teamTag = side === 'blue' ? matchState.blueTeam.tag : matchState.redTeam.tag;

  let text = '';
  if (option.kind === 'AGGRO') {
    if (ok) {
      mp.kills++;
      if (opp) opp.deaths++;
      if (side === 'blue') { matchState.blueKills++; matchState.blueGold += 450; }
      else { matchState.redKills++; matchState.redGold += 450; }
      mp.gold += 450;
      mp.dmg += 1400;
      mp.rating = Math.min(10, +(mp.rating + 0.55).toFixed(1));
      text = `${mp.name} (${mp.champName}) agresif takası kazandı ve ${opp ? opp.name : 'rakibini'} avladı! (+450g)`;
    } else {
      mp.deaths++;
      if (opp) opp.kills++;
      if (side === 'blue') { matchState.redKills++; matchState.redGold += 350; }
      else { matchState.blueKills++; matchState.blueGold += 350; }
      mp.rating = Math.max(4.0, +(mp.rating - 0.35).toFixed(1));
      text = `${mp.name} aşırı agresif oynadı ve rakip ormancının da desteğiyle yakalandı.`;
    }
  } else if (option.kind === 'ROAM') {
    if (ok) {
      mp.assists += 2;
      const ally = myPlayers.find(p => p.playerId !== mp.playerId && p.role !== 'SUP') || myPlayers[0];
      if (ally) ally.kills++;
      if (side === 'blue') { matchState.blueKills++; matchState.blueGold += 520; }
      else { matchState.redKills++; matchState.redGold += 520; }
      mp.gold += 260;
      mp.vision += 3;
      mp.rating = Math.min(10, +(mp.rating + 0.5).toFixed(1));
      text = `${mp.name} zamanında roam atarak ${teamTag} adına skor üretti (+2 Asist, +520 Takım Altını).`;
    } else {
      mp.cs = Math.max(0, mp.cs - 6);
      mp.rating = Math.max(4.5, +(mp.rating - 0.15).toFixed(1));
      text = `${mp.name} roam denemesinden sonuç alamadı ve koridorda biraz minyon kaybetti.`;
    }
  } else if (option.kind === 'SAFE') {
    mp.cs += 18;
    mp.gold += 340;
    if (side === 'blue') matchState.blueGold += 340;
    else matchState.redGold += 340;
    mp.rating = Math.min(10, +(mp.rating + 0.25).toFixed(1));
    text = `${mp.name} dalgayı kusursuz yönetip +18 CS ve +340g çıkardı.`;
  } else if (option.kind === 'OBJECTIVE') {
    if (ok) {
      mp.assists += 1;
      mp.dmg += 1200;
      mp.vision += 4;
      if (side === 'blue') matchState.blueGold += 600;
      else matchState.redGold += 600;
      mp.gold += 300;
      mp.rating = Math.min(10, +(mp.rating + 0.5).toFixed(1));
      text = `${mp.name} objektif öncesi pozisyonlamasıyla ${teamTag} takımına harita kontrolü ve +600g kazandırdı!`;
    } else {
      mp.deaths++;
      if (side === 'blue') { matchState.redKills++; matchState.redGold += 300; }
      else { matchState.blueKills++; matchState.blueGold += 300; }
      mp.rating = Math.max(4.5, +(mp.rating - 0.3).toFixed(1));
      text = `${mp.name} objektif kontrolü kurarken yakalandı.`;
    }
  }

  matchState.events.push({
    min: m,
    type: 'TACTIC',
    tag: ok ? 'OYUNCU KARARI' : 'RİSKLİ HAMLE',
    side,
    text,
  });

  return { success: ok, text };
}

export function quickSimulateGame(blueTeam, redTeam, blueRoster, redRoster, patch, fearlessLocked = new Set(), highStakes = false) {
  const draft = createDraftState(blueTeam, redTeam, blueRoster, redRoster, patch, null, fearlessLocked);
  autoCompleteDraft(draft);
  const match = createLiveMatchState(blueTeam, redTeam, blueRoster, redRoster, draft.bluePicks, draft.redPicks, patch, null, highStakes);
  finishMatchInstantly(match);
  return { match, draft };
}

export function applyMatchOutcomeToPlayers(matchState) {
  const applySide = (players, won, team) => {
    const hasLeader = players.some(mp => mp.playerRef.trait === 'Leader');
    const egoCount = players.filter(mp => mp.playerRef.trait === 'Ego').length;
    const chem = computeTeamChemistry(team, players);

    for (const mp of players) {
      const p = mp.playerRef;
      p.stats.games++;
      p.teamGames = (p.teamGames ?? 20) + 1;
      if (won) p.stats.wins++;
      p.stats.kills += mp.kills;
      p.stats.deaths += mp.deaths;
      p.stats.assists += mp.assists;
      if (matchState.mvp && matchState.mvp.playerId === p.id) p.stats.mvps++;

      if (!p.mastery) p.mastery = {};
      p.mastery[mp.champId] = Math.min(5, (p.mastery[mp.champId] || 0) + (won ? 1 : 0.5));

      // Superteams with Ego/Resource clashes lose morale much faster on defeats!
      let moraleDelta = won ? 3 : (hasLeader ? -2 : -4);
      if (!won && (egoCount >= 2 || chem.resourceClash <= -2.5)) moraleDelta -= 2;
      if ((matchState.grantedRequestIds || []).includes(p.id)) moraleDelta += 3;
      if ((matchState.ignoredEgoIds || []).includes(p.id)) moraleDelta -= 2;
      p.morale = clamp(p.morale + moraleDelta, 25, 100);
      p.form = clamp(p.form + (mp.rating >= 7.8 ? 3 : mp.rating <= 5.6 ? -3 : 0), 45, 99);
      const perfReduction = ((team.staff?.perfCoach || 1) - 1) * 1.5;
      const calmReduction = (matchState.teamTalk === 'calm' && matchState.userSide === (team.id === matchState.blueTeam.id ? 'blue' : 'red')) ? 2 : 0;
      const restReduction = (team.facilities.gamingHouse - 1) * 1.4 + perfReduction + calmReduction;
      const ageProf = getAgeFatigueProfile(p.age);
      const durationMult = (matchState.minute || 28) >= 35 ? 1.24 : (matchState.minute || 28) >= 28 ? 1.05 : 0.90;
      const rawGain = Math.max(2.5, (9.5 - restReduction) * ageProf.gainMult * durationMult);
      p.fatigue = Math.min(100, Math.round(p.fatigue + rawGain));
    }

    // Harder, diminishing-returns synergy progression!
    let synDelta;
    if (won) {
      synDelta = team.synergy < 65 ? 0.9 : team.synergy < 82 ? 0.55 : 0.25;
      if (chem.resourceClash <= -2.5) synDelta *= 0.6;
    } else {
      synDelta = hasLeader ? -0.6 : -1.3;
      if (egoCount >= 2 || chem.resourceClash <= -2.5) synDelta -= 0.9;
    }
    team.synergy = clamp(+(team.synergy + synDelta).toFixed(1), 20, 100);

    // Slower, earned JGL+MID and BOT+SUP Duo Synergy!
    if (!team.duoSynergy) team.duoSynergy = {};
    const pk = (a, b) => [a, b].sort().join('|');
    const jgl = players.find(x => x.role === 'JGL');
    const mid = players.find(x => x.role === 'MID');
    const bot = players.find(x => x.role === 'BOT');
    const sup = players.find(x => x.role === 'SUP');
    const duoDelta = won ? 0.85 : 0.35;
    if (jgl && mid) { const k = pk(jgl.playerId, mid.playerId); team.duoSynergy[k] = Math.min(30, +( (team.duoSynergy[k] || 0) + duoDelta ).toFixed(2)); }
    if (bot && sup) { const k = pk(bot.playerId, sup.playerId); team.duoSynergy[k] = Math.min(30, +( (team.duoSynergy[k] || 0) + duoDelta ).toFixed(2)); }
  };

  applySide(matchState.bluePlayers, matchState.winner === 'blue', matchState.blueTeam);
  applySide(matchState.redPlayers, matchState.winner === 'red', matchState.redTeam);
}

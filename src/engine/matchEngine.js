// LoL Esports Manager v3.0 — Pro-Calibrated Live Match Engine
// Features: Realistic snowball & comeback math, Shutdown Bounties, Jungle Smite Steals,
// Elder Dragon, Attribute-driven 1v1/Gank/5v5 resolution, True Role Resource Allocation,
// Calibrated FM Ratings, and Automatic Post-Match Coaching Analysis.

import { CHAMPION_MAP, getChampionMetaTier, getTierBonus, getMatchupAdvantage } from '../data/champions.js';
import { ROLES } from '../data/teamsAndPlayers.js';
import { createDraftState, autoCompleteDraft, analyzeDraftSide } from './draftEngine.js';

function rand(min, max) { return min + Math.random() * (max - min); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

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
  const fatiguePen = Math.max(0, player.fatigue - 55) * 0.16;
  const synMod = (team.synergy - 70) * 0.10;
  const facilityMod = (team.facilities.analystDesk - 1) * 0.5 + ((team.staff?.draftAnalyst || 1) - 1) * 0.5;
  const importPen = (player.importWeeksLeft || 0) > 0 ? -2.4 : 0;
  const injuryPen = (player.injuredWeeks || 0) > 0 ? -4.5 : 0;

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

  return player.ovr + tierBonus + sigBonus + masteryBonus + counterBonus + formMod + moraleMod - fatiguePen + synMod + facilityMod + importPen + injuryPen + traitMod + talkMod + duoMod + intelMod + reqMod;
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
        champColor: CHAMPION_MAP[champId]?.color || '#64748b',
        playerRef: p,
        kills: 0,
        deaths: 0,
        assists: 0,
        spree: 0,
        cs: 0,
        gold: 500,
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

  return {
    minute: 0,
    finished: false,
    winner: null,
    userSide,
    highStakes,
    teamTalk: options.teamTalk || 'none',
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
    events: [
      { min: 0, type: 'SYSTEM', tag: 'BAŞLANGIÇ', text: `${blueTeam.tag} (Mavi) vs ${redTeam.tag} (Kırmızı)${highStakes ? ' — Yüksek gerilimli karşılaşma' : ''} başladı.` }
    ],
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
      if (pl.role === 'JGL' || pl.role === 'MID') duoBonus = Math.min(2.2, jmVal * 0.09);
      if (pl.role === 'BOT' || pl.role === 'SUP') duoBonus = Math.min(2.2, bsVal * 0.09);
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

    let phaseScore = 0;
    if (m < 15) phaseScore = analysis.early * state.patch.earlyWeight;
    else if (m < 25) phaseScore = analysis.mid * state.patch.midWeight;
    else phaseScore = analysis.late * state.patch.lateWeight;

    let tacticMod = 0;
    if (tactics.gameplan === 'aggressive') tacticMod += m < 16 ? 2.2 : -1.0;
    if (tactics.gameplan === 'scaling') tacticMod += m < 15 ? -1.6 : m > 25 ? 2.5 : 0.4;
    if (tactics.gameplan === 'split') tacticMod += m > 18 ? 1.4 : 0;
    if (tactics.supStyle === 'roam') tacticMod += m < 18 ? 0.8 : -0.2;
    if (tactics.supStyle === 'peel') tacticMod += m >= 20 ? 1.1 : -0.2;
    if (tactics.adcStyle === 'safe') tacticMod += m >= 22 ? 1.0 : -0.2;

    // FM26 Dual-Phase Tactics: Ahead Plan (> +1500g) vs Behind Plan (< -1500g)
    if (myGoldDiff > 1500) {
      if (tactics.aheadPlan === 'choke') tacticMod += m >= 18 ? 1.4 : 0.6;
      else if (tactics.aheadPlan === 'split131') tacticMod += m >= 20 ? 1.5 : 0.4;
      else if (tactics.aheadPlan === 'dive') tacticMod += m < 22 ? 1.6 : 0.2;
    } else if (myGoldDiff < -1500) {
      if (tactics.behindPlan === 'scale') tacticMod += m >= 24 ? 1.8 : 0.3;
      else if (tactics.behindPlan === 'pick') tacticMod += 1.2;
      else if (tactics.behindPlan === 'crossmap') tacticMod += 1.0;
    }

    const baronMod = state.baronBuffSide === side && m <= state.baronBuffUntil ? 4.2 : 0;
    const elderMod = state.elderBuffSide === side && m <= state.elderBuffUntil ? 6.5 : 0;
    const soulMod = state.soulSide === side ? 3.2 : 0;

    return avg + phaseScore * 0.95 + tacticMod + baronMod + elderMod + soulMod;
  };

  const bBase = sideBase('blue');
  const rBase = sideBase('red');
  // Realistic pro LoL gold-to-strength curve (diminishes slightly post-35m as both teams approach 6 items)
  const lateDiminish = m >= 36 ? 0.72 : m >= 30 ? 0.86 : 1.0;
  const goldMod = clamp((goldDiff / 950) * lateDiminish, -22, 22);
  const netDiff = (bBase - rBase) + goldMod;
  // Realistic logistic curve: close games stay 50/50, +10k gold = ~90%, +20k gold = ~97%
  const blueWinProb = clamp(1 / (1 + Math.exp(-netDiff / 8.5)), 0.03, 0.97);
  return { blueStr: bBase + goldMod * 0.5, redStr: rBase - goldMod * 0.5, blueWinProb, netDiff };
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
  killer.dmg += Math.round(rand(850, 1450));

  victim.deaths++;
  victim.dmg += Math.round(rand(280, 620));

  for (const ar of assistRoles) {
    if (ar === killerRole) continue;
    const assister = kTeam.find(p => p.role === ar);
    if (assister) {
      assister.assists++;
      assister.gold += 150;
      assister.dmg += Math.round(rand(420, 860));
    }
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

  // 1. Passive CS, Gold, Damage & Vision — with True Role Micro-Tactics Resource Allocation!
  const updateFarm = (players, tactics, teamStr, oppStr) => {
    const adv = clamp((teamStr - oppStr) * 0.035, -0.8, 0.8);
    for (const pl of players) {
      let baseCS = pl.role === 'SUP' ? rand(0.9, 1.4) : pl.role === 'JGL' ? rand(5.3, 6.7) : rand(7.4, 9.6);

      // Role Micro-Tactic resource shifts!
      if (pl.role === 'TOP' && tactics.topStyle === 'carry') baseCS *= 1.13;
      if (pl.role === 'TOP' && tactics.topStyle === 'weakside') baseCS *= 0.90;
      if (pl.role === 'BOT' && tactics.topStyle === 'weakside') baseCS *= 1.07;
      if (pl.role === 'BOT' && tactics.adcStyle === 'safe') baseCS *= 1.05;

      const laningBonus = (pl.playerRef.attrs.laning - 80) * 0.055;
      const gainedCS = Math.max(0, Math.round(baseCS + laningBonus + adv));
      pl.cs += gainedCS;
      pl.gold += Math.round(115 + gainedCS * 21 + (pl.role === 'SUP' ? 95 : 0));

      let dmgMult = pl.role === 'BOT' || pl.role === 'MID' ? 1.35 : pl.role === 'TOP' ? 1.05 : pl.role === 'JGL' ? 0.9 : 0.48;
      if (pl.role === 'BOT' && tactics.supStyle === 'peel' && m >= 18) dmgMult *= 1.12;
      if (pl.role === 'TOP' && tactics.topStyle === 'carry') dmgMult *= 1.12;
      pl.dmg += Math.round(rand(220, 460) * dmgMult * (1 + m * 0.024));

      let visMult = pl.role === 'SUP' ? 2.4 : pl.role === 'JGL' ? 1.4 : 0.85;
      if (pl.role === 'SUP' && tactics.supStyle === 'roam') visMult *= 1.15;
      pl.vision += +(rand(0.7, 1.3) * visMult).toFixed(1);
    }
  };
  updateFarm(state.bluePlayers, state.blueTactics, blueStr, redStr);
  updateFarm(state.redPlayers, state.redTactics, redStr, blueStr);

  let focusPoint = null;

  // 2. Attribute-Driven Lane Skirmishes, Ganks & 1v1 Solo Kills
  const aggroMod = (state.blueTactics.gameplan === 'aggressive' ? 0.06 : 0) + (state.redTactics.gameplan === 'aggressive' ? 0.06 : 0);
  if (m >= 3 && Math.random() < 0.28 + aggroMod) {
    const isGank = Math.random() < 0.62;
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

  // 3. Voidgrubs / Rift Herald
  if (m === 6 || m === 11 || m === 15) {
    let grubsProb = blueWinProb + (state.blueTactics.objective === 'baron' ? 0.06 : 0) - (state.redTactics.objective === 'baron' ? 0.06 : 0);
    const side = Math.random() < clamp(grubsProb, 0.06, 0.94) ? 'blue' : 'red';
    const objName = m === 15 ? 'Vadi Alameti' : 'Hiçlik Kurtçukları';
    if (side === 'blue') { state.blueGrubs++; state.bluePlayers.forEach(p => { p.gold += 120; }); }
    else { state.redGrubs++; state.redPlayers.forEach(p => { p.gold += 120; }); }
    const tag = side === 'blue' ? state.blueTeam.tag : state.redTeam.tag;
    state.events.push({ min: m, type: 'OBJECTIVE', tag: 'OBJEKTİF', side, text: `${tag}, ${objName} objektifini kontrol altına aldı.` });
    focusPoint = LANE_COORDS.BARON;
    state.lastEventPos = { ...focusPoint, color: '#a855f7' };
  }

  // 4. Dragon & Smite Steals
  if (m >= state.dragonTimer && !state.soulSide) {
    let dragProb = blueWinProb + (state.blueTactics.objective === 'dragon' ? 0.06 : 0) - (state.redTactics.objective === 'dragon' ? 0.06 : 0);
    let winner = Math.random() < clamp(dragProb, 0.05, 0.95) ? 'blue' : 'red';
    const contested = Math.random() < 0.68;
    let stolen = false;

    if (contested) {
      const loser = winner === 'blue' ? 'red' : 'blue';
      const wKills = 1 + Math.floor(Math.random() * 2);
      const lKills = Math.random() < 0.7 ? 1 : 0;
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

    if (winner === 'blue') { state.blueDragons++; state.bluePlayers.forEach(p => { p.gold += 150; }); }
    else { state.redDragons++; state.redPlayers.forEach(p => { p.gold += 150; }); }

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

  // 5. Tower Takes
  if (m >= 10 && Math.random() < 0.28 + (state.baronBuffSide ? 0.22 : 0)) {
    const baronTowerBoost = state.baronBuffSide === 'blue' ? 0.16 : state.baronBuffSide === 'red' ? -0.16 : 0;
    let towerProb = blueWinProb + baronTowerBoost + (state.blueTactics.objective === 'towers' || state.blueTactics.gameplan === 'split' ? 0.06 : 0) - (state.redTactics.objective === 'towers' || state.redTactics.gameplan === 'split' ? 0.06 : 0);
    const side = Math.random() < clamp(towerProb, 0.04, 0.96) ? 'blue' : 'red';
    const oppLanes = side === 'blue' ? state.redLaneTowers : state.blueLaneTowers;
    const availableLanes = ['TOP', 'MID', 'BOT'].filter(l => oppLanes[l] > 0);

    if (availableLanes.length > 0) {
      const lane = pick(availableLanes);
      oppLanes[lane]--;
      if (side === 'blue') { state.blueTowers++; state.bluePlayers.forEach(p => { p.gold += 220; }); }
      else { state.redTowers++; state.redPlayers.forEach(p => { p.gold += 220; }); }
      const tag = side === 'blue' ? state.blueTeam.tag : state.redTeam.tag;
      const tierText = oppLanes[lane] === 2 ? 'dış kulesini' : oppLanes[lane] === 1 ? 'iç kulesini' : 'inhibitör kulesini ve inhibitörü';
      state.events.push({ min: m, type: 'TOWER', tag: 'KULE', side, text: `${tag}, ${lane} koridorundaki ${tierText} yıktı.` });
      focusPoint = LANE_COORDS[lane];
      state.lastEventPos = { ...focusPoint, color: side === 'blue' ? '#38bdf8' : '#f43f5e' };
    }
  }

  // 6. Baron Nashor & Smite Steals
  if (m >= state.baronTimer && Math.random() < 0.32) {
    let baronProb = blueWinProb + (state.blueTactics.objective === 'baron' ? 0.06 : 0) - (state.redTactics.objective === 'baron' ? 0.06 : 0);
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

    if (winner === 'blue') { state.blueBarons++; state.bluePlayers.forEach(p => { p.gold += 350; }); }
    else { state.redBarons++; state.redPlayers.forEach(p => { p.gold += 350; }); }
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
    for (const mp of players) {
      const p = mp.playerRef;
      p.stats.games++;
      if (won) p.stats.wins++;
      p.stats.kills += mp.kills;
      p.stats.deaths += mp.deaths;
      p.stats.assists += mp.assists;
      if (matchState.mvp && matchState.mvp.playerId === p.id) p.stats.mvps++;

      if (!p.mastery) p.mastery = {};
      p.mastery[mp.champId] = Math.min(5, (p.mastery[mp.champId] || 0) + (won ? 1 : 0.5));

      let moraleDelta = won ? 4 : (hasLeader ? -2 : -4);
      if ((matchState.grantedRequestIds || []).includes(p.id)) moraleDelta += 3;
      if ((matchState.ignoredEgoIds || []).includes(p.id)) moraleDelta -= 2;
      p.morale = clamp(p.morale + moraleDelta, 30, 100);
      p.form = clamp(p.form + (mp.rating >= 7.8 ? 3 : mp.rating <= 5.6 ? -3 : 0), 45, 99);
      const perfReduction = ((team.staff?.perfCoach || 1) - 1) * 1.6;
      const calmReduction = (matchState.teamTalk === 'calm' && matchState.userSide === (team.id === matchState.blueTeam.id ? 'blue' : 'red')) ? 2 : 0;
      const restReduction = (team.facilities.gamingHouse - 1) * 1.5 + perfReduction + calmReduction;
      p.fatigue = Math.min(100, Math.round(p.fatigue + Math.max(3, 9 - restReduction)));
    }
    team.synergy = clamp(team.synergy + (won ? 1.5 : (hasLeader ? 0 : -0.5)), 40, 100);
    // Grow JGL+MID and BOT+SUP Duo Synergy!
    if (!team.duoSynergy) team.duoSynergy = {};
    const pk = (a, b) => [a, b].sort().join('|');
    const jgl = players.find(x => x.role === 'JGL');
    const mid = players.find(x => x.role === 'MID');
    const bot = players.find(x => x.role === 'BOT');
    const sup = players.find(x => x.role === 'SUP');
    const delta = won ? 1.5 : 0.8;
    if (jgl && mid) { const k = pk(jgl.playerId, mid.playerId); team.duoSynergy[k] = Math.min(30, (team.duoSynergy[k] || 0) + delta); }
    if (bot && sup) { const k = pk(bot.playerId, sup.playerId); team.duoSynergy[k] = Math.min(30, (team.duoSynergy[k] || 0) + delta); }
  };

  applySide(matchState.bluePlayers, matchState.winner === 'blue', matchState.blueTeam);
  applySide(matchState.redPlayers, matchState.winner === 'red', matchState.redTeam);
}

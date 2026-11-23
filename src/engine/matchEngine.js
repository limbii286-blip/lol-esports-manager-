// LoL Esports Manager v2.0 — Live Match Engine (No Timeout/Mola, Role Micro-Tactics, 10-Player 2D Minimap, Traits, Counters, Deep Analytics)
import { CHAMPION_MAP, getChampionMetaTier, getTierBonus, getMatchupAdvantage } from '../data/champions.js';
import { ROLES } from '../data/teamsAndPlayers.js';
import { createDraftState, autoCompleteDraft, analyzeDraftSide } from './draftEngine.js';

function rand(min, max) { return min + Math.random() * (max - min); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

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
  const tierBonus = getTierBonus(tier);
  const sigBonus = player.sigChamps.includes(champId) ? 4.2 : (player.attrs.pool - 78) * 0.12;
  const masteryBonus = Math.min(3.5, (player.mastery?.[champId] || 0) * 0.6);
  const counterBonus = oppChampId ? getMatchupAdvantage(champId, oppChampId) : 0;
  const formMod = (player.form - 75) * 0.14;
  const moraleMod = (player.morale - 75) * 0.10;
  const fatiguePen = Math.max(0, player.fatigue - 55) * 0.18;
  const synMod = (team.synergy - 70) * 0.12;
  const facilityMod = (team.facilities.analystDesk - 1) * 0.6;
  const importPen = (player.importWeeksLeft || 0) > 0 ? -2.8 : 0;

  // Trait modifiers
  let traitMod = 0;
  if (player.trait === 'Clutch' && ctx.highStakes) traitMod += 3.2;
  if (player.trait === 'Ego' && player.isStarter) traitMod += 1.4;
  if (player.trait === 'Tilt') {
    if ((ctx.goldDiff || 0) < -3000) traitMod -= 2.8;
    else if ((ctx.goldDiff || 0) > 3000) traitMod += 1.6;
  }

  return player.ovr + tierBonus + sigBonus + masteryBonus + counterBonus + formMod + moraleMod - fatiguePen + synMod + facilityMod + importPen + traitMod;
}

export function createLiveMatchState(blueTeam, redTeam, blueRoster, redRoster, bluePicks, redPicks, patch, userSide = null, highStakes = false) {
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
        cs: 0,
        gold: 500,
        dmg: 0,
        vision: 0,
        rating: 6.5,
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
  });

  return {
    minute: 0,
    finished: false,
    winner: null,
    userSide,
    highStakes,
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
    gd15: null, // Gold diff at minute 15
    goldHistory: [0],
    blueDragons: 0,
    redDragons: 0,
    blueBarons: 0,
    redBarons: 0,
    blueGrubs: 0,
    redGrubs: 0,
    blueTowers: 0,
    redTowers: 0,
    firstBloodDone: false,
    dragonTimer: 5,
    baronTimer: 20,
    baronBuffSide: null,
    baronBuffUntil: 0,
    soulSide: null,

    blueLaneTowers: { TOP: 3, MID: 3, BOT: 3 },
    redLaneTowers: { TOP: 3, MID: 3, BOT: 3 },
    blueNexusHP: 100,
    redNexusHP: 100,

    lastEventPos: null,
    events: [
      { min: 0, type: 'SYSTEM', text: `Vadiye hoş geldiniz! ${blueTeam.tag} (Mavi) vs ${redTeam.tag} (Kırmızı)${highStakes ? ' — 🔥 YÜKSEK GERİLİMLİ MAÇ!' : ''} başlıyor.` }
    ],
    mvp: null,
  };
}

function getTeamPhaseStrength(state, side) {
  const players = side === 'blue' ? state.bluePlayers : state.redPlayers;
  const team = side === 'blue' ? state.blueTeam : state.redTeam;
  const analysis = side === 'blue' ? state.blueAnalysis : state.redAnalysis;
  const tactics = side === 'blue' ? state.blueTactics : state.redTactics;
  const m = state.minute;
  const goldDiff = side === 'blue' ? state.blueGold - state.redGold : state.redGold - state.blueGold;

  let avg = 0;
  for (const pl of players) {
    avg += getEffectivePlayerRating(pl.playerRef, pl.champId, pl.oppChampId, state.patch, team, {
      highStakes: state.highStakes,
      goldDiff,
    });
  }
  avg /= 5;

  let phaseScore = 0;
  if (m < 15) phaseScore = analysis.early * state.patch.earlyWeight;
  else if (m < 26) phaseScore = analysis.mid * state.patch.midWeight;
  else phaseScore = analysis.late * state.patch.lateWeight;

  // Team & Role Micro-Tactics effect
  let tacticMod = 0;
  if (tactics.gameplan === 'aggressive') tacticMod += m < 16 ? 2.6 : -1.2;
  if (tactics.gameplan === 'scaling') tacticMod += m < 15 ? -1.8 : m > 25 ? 3.0 : 0.4;
  if (tactics.gameplan === 'split') tacticMod += m > 18 ? 1.6 : 0;

  if (tactics.topStyle === 'carry') tacticMod += m < 18 ? 0.9 : 0.4;
  if (tactics.topStyle === 'weakside') tacticMod += m >= 18 ? 1.1 : -0.3;
  if (tactics.supStyle === 'roam') tacticMod += m < 20 ? 1.0 : -0.3;
  if (tactics.supStyle === 'peel') tacticMod += m >= 20 ? 1.3 : -0.2;
  if (tactics.adcStyle === 'aggressive') tacticMod += m < 16 ? 1.0 : -0.4;
  if (tactics.adcStyle === 'safe') tacticMod += m >= 22 ? 1.2 : -0.3;

  const goldMod = Math.max(-14, Math.min(14, goldDiff / 750));
  const baronMod = state.baronBuffSide === side && m <= state.baronBuffUntil ? 5.5 : 0;
  const soulMod = state.soulSide === side ? 4.5 : 0;

  return avg + phaseScore * 1.15 + tacticMod + goldMod + baronMod + soulMod;
}

function updatePlayerPositions(state, focusPoint = null) {
  const m = state.minute;
  const moveTeam = (players, side, tactics, oppTowers) => {
    for (const pl of players) {
      let [tx, ty] = HOME_POS[side][pl.role];
      const pushShift = (side === 'blue' ? 1 : -1) * Math.min(16, (m / 35) * 14 + (9 - (oppTowers.TOP + oppTowers.MID + oppTowers.BOT)) * 1.5);

      if (focusPoint && m >= 12 && Math.random() < 0.72) {
        // Group around active objective/teamfight
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
        } else if (pl.role === 'TOP' && tactics.gameplan === 'split' && m >= 16) {
          tx = side === 'blue' ? 58 + rand(-6, 8) : 25 + rand(-6, 6);
          ty = 16 + rand(-3, 4);
        } else if (m >= 20) {
          // Mid/Late game ARAM / objective positioning
          tx = 50 + pushShift * 0.7 + rand(-12, 12);
          ty = 50 - pushShift * 0.7 + rand(-12, 12);
        } else {
          tx += pushShift * 0.35 + rand(-4, 4);
          ty -= pushShift * 0.35 + rand(-4, 4);
        }
      }
      pl.x = Math.max(10, Math.min(90, Math.round(tx)));
      pl.y = Math.max(10, Math.min(90, Math.round(ty)));
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

  killer.kills++;
  killer.gold += isFB ? 400 : 300;
  killer.dmg += Math.round(rand(850, 1450));
  killer.rating = Math.min(10, +(killer.rating + 0.45).toFixed(1));

  victim.deaths++;
  victim.dmg += Math.round(rand(250, 600));
  victim.rating = Math.max(3.0, +(victim.rating - 0.35).toFixed(1));

  for (const ar of assistRoles) {
    if (ar === killerRole) continue;
    const assister = kTeam.find(p => p.role === ar);
    if (assister) {
      assister.assists++;
      assister.gold += 150;
      assister.dmg += Math.round(rand(400, 850));
      assister.rating = Math.min(10, +(assister.rating + 0.22).toFixed(1));
    }
  }

  if (killerSide === 'blue') state.blueKills++;
  else state.redKills++;

  return { killer, victim, isFB };
}

export function stepMatchMinute(state) {
  if (state.finished) return state;
  state.minute++;
  const m = state.minute;

  const blueStr = getTeamPhaseStrength(state, 'blue');
  const redStr = getTeamPhaseStrength(state, 'red');
  const blueWinProb = 1 / (1 + Math.exp(-(blueStr - redStr) / 7.5));

  // 1. Passive CS, Gold, Damage & Vision per minute
  const updateFarm = (players, teamStr, oppStr) => {
    const adv = (teamStr - oppStr) * 0.04;
    for (const pl of players) {
      const baseCS = pl.role === 'SUP' ? rand(0.9, 1.5) : pl.role === 'JGL' ? rand(5.2, 6.8) : rand(7.2, 9.8);
      const laningBonus = (pl.playerRef.attrs.laning - 80) * 0.06;
      const gainedCS = Math.max(0, Math.round(baseCS + laningBonus + adv));
      pl.cs += gainedCS;
      pl.gold += Math.round(115 + gainedCS * 21 + (pl.role === 'SUP' ? 95 : 0));
      const dmgMult = pl.role === 'BOT' || pl.role === 'MID' ? 1.35 : pl.role === 'TOP' ? 1.05 : pl.role === 'JGL' ? 0.9 : 0.48;
      pl.dmg += Math.round(rand(220, 480) * dmgMult * (1 + m * 0.025));
      const visMult = pl.role === 'SUP' ? 2.4 : pl.role === 'JGL' ? 1.4 : 0.85;
      pl.vision += +(rand(0.7, 1.35) * visMult).toFixed(1);
    }
  };
  updateFarm(state.bluePlayers, blueStr, redStr);
  updateFarm(state.redPlayers, redStr, blueStr);

  let focusPoint = null;

  // 2. Lane Skirmishes / Ganks / Solo Kills
  const aggroMod = (state.blueTactics.gameplan === 'aggressive' ? 0.07 : 0) + (state.redTactics.gameplan === 'aggressive' ? 0.07 : 0);
  if (m >= 3 && Math.random() < 0.30 + aggroMod) {
    const killerSide = Math.random() < blueWinProb ? 'blue' : 'red';
    const tactics = killerSide === 'blue' ? state.blueTactics : state.redTactics;
    const targetLane = Math.random() < 0.52 ? tactics.laneFocus : pick(['TOP', 'MID', 'BOT']);
    const isGank = Math.random() < 0.62;

    if (isGank) {
      const killerRole = Math.random() < 0.45 ? 'JGL' : targetLane;
      const assists = targetLane === 'BOT' ? ['JGL', 'BOT', 'SUP'] : ['JGL', targetLane];
      if (tactics.supStyle === 'roam' && targetLane === 'MID') assists.push('SUP');
      const victimRole = targetLane === 'BOT' ? (Math.random() < 0.55 ? 'BOT' : 'SUP') : targetLane;
      const { killer, victim, isFB } = awardKill(state, killerSide, killerRole, victimRole, assists);
      const tag = killerSide === 'blue' ? state.blueTeam.tag : state.redTeam.tag;
      const oppTag = killerSide === 'blue' ? state.redTeam.tag : state.blueTeam.tag;
      state.events.push({
        min: m,
        type: isFB ? 'FIRST_BLOOD' : 'KILL',
        side: killerSide,
        text: `${isFB ? '🩸 İLK KAN! ' : ''}${tag} ${killer.name} (${killer.champName}), ${targetLane} koridorunda başarılı baskınla ${oppTag} ${victim.name}'ı düşürdü!`,
      });
      focusPoint = LANE_COORDS[targetLane];
      state.lastEventPos = { ...focusPoint, color: killerSide === 'blue' ? '#38bdf8' : '#ef4444' };
    } else {
      const laneRole = pick(['TOP', 'MID', 'BOT']);
      const { killer, victim, isFB } = awardKill(state, killerSide, laneRole, laneRole, laneRole === 'BOT' ? ['SUP'] : []);
      const tag = killerSide === 'blue' ? state.blueTeam.tag : state.redTeam.tag;
      state.events.push({
        min: m,
        type: isFB ? 'FIRST_BLOOD' : 'SOLO',
        side: killerSide,
        text: `${isFB ? '🩸 İLK KAN! ' : '⚔️ SOLO KILL! '}${tag} ${killer.name} (${killer.champName}), 1v1'de ${victim.name} (${victim.champName}) karşısında üstünlük kurdu!`,
      });
      focusPoint = LANE_COORDS[laneRole];
      state.lastEventPos = { ...focusPoint, color: killerSide === 'blue' ? '#38bdf8' : '#ef4444' };
    }
  }

  // 3. Voidgrubs / Rift Herald
  if (m === 6 || m === 11 || m === 15) {
    let grubsProb = blueWinProb;
    if (state.blueTactics.objective === 'baron') grubsProb += 0.06;
    if (state.redTactics.objective === 'baron') grubsProb -= 0.06;
    const side = Math.random() < grubsProb ? 'blue' : 'red';
    const objName = m === 15 ? 'Vadi Alameti' : 'Hiçlik Kurtçukları';
    if (side === 'blue') { state.blueGrubs++; state.bluePlayers.forEach(p => { p.gold += 120; }); }
    else { state.redGrubs++; state.redPlayers.forEach(p => { p.gold += 120; }); }
    const tag = side === 'blue' ? state.blueTeam.tag : state.redTeam.tag;
    state.events.push({ min: m, type: 'OBJECTIVE', side, text: `🟣 ${tag}, ${objName} objektifini kontrol altına aldı!` });
    focusPoint = LANE_COORDS.BARON;
    state.lastEventPos = { ...focusPoint, color: '#a855f7' };
  }

  // 4. Dragon Fights
  if (m >= state.dragonTimer && !state.soulSide) {
    let dragProb = blueWinProb;
    if (state.blueTactics.objective === 'dragon') dragProb += 0.07;
    if (state.redTactics.objective === 'dragon') dragProb -= 0.07;
    const winner = Math.random() < dragProb ? 'blue' : 'red';
    const contested = Math.random() < 0.65;

    if (contested) {
      const wKills = 1 + Math.floor(Math.random() * 2);
      const lKills = Math.floor(Math.random() * 2);
      for (let i = 0; i < wKills; i++) awardKill(state, winner, pick(['MID', 'BOT', 'JGL']), pick(['SUP', 'JGL', 'BOT', 'TOP']), ['SUP', 'JGL', 'MID']);
      for (let i = 0; i < lKills; i++) awardKill(state, winner === 'blue' ? 'red' : 'blue', pick(['MID', 'BOT']), pick(['SUP', 'TOP', 'JGL']), ['SUP', 'JGL']);
    }

    if (winner === 'blue') { state.blueDragons++; state.bluePlayers.forEach(p => { p.gold += 150; p.rating = Math.min(10, +(p.rating + 0.15).toFixed(1)); }); }
    else { state.redDragons++; state.redPlayers.forEach(p => { p.gold += 150; p.rating = Math.min(10, +(p.rating + 0.15).toFixed(1)); }); }

    const dCount = winner === 'blue' ? state.blueDragons : state.redDragons;
    const tag = winner === 'blue' ? state.blueTeam.tag : state.redTeam.tag;
    const isSoul = dCount >= 4;
    if (isSoul) state.soulSide = winner;

    state.events.push({
      min: m,
      type: isSoul ? 'SOUL' : 'DRAGON',
      side: winner,
      text: isSoul
        ? `🔥 EJDER RUHU! ${tag}, 4. ejderi alarak Ejder Ruhu'nu tamamladı!`
        : `🐉 ${tag}, Ejderi aldı (${dCount}/4)${contested ? ' ve çukur etrafındaki savaştan karlı çıktı!' : '.'}`,
    });
    focusPoint = LANE_COORDS.DRAGON;
    state.lastEventPos = { ...focusPoint, color: '#f59e0b' };
    state.dragonTimer = m + 5 + Math.floor(Math.random() * 2);
  }

  // 5. Tower Takes
  if (m >= 10 && Math.random() < 0.28 + (state.baronBuffSide ? 0.18 : 0)) {
    let towerProb = blueWinProb;
    if (state.blueTactics.objective === 'towers' || state.blueTactics.gameplan === 'split') towerProb += 0.06;
    if (state.redTactics.objective === 'towers' || state.redTactics.gameplan === 'split') towerProb -= 0.06;
    const side = Math.random() < towerProb ? 'blue' : 'red';
    const oppLanes = side === 'blue' ? state.redLaneTowers : state.blueLaneTowers;
    const availableLanes = ['TOP', 'MID', 'BOT'].filter(l => oppLanes[l] > 0);

    if (availableLanes.length > 0) {
      const lane = pick(availableLanes);
      oppLanes[lane]--;
      if (side === 'blue') { state.blueTowers++; state.bluePlayers.forEach(p => { p.gold += 220; }); }
      else { state.redTowers++; state.redPlayers.forEach(p => { p.gold += 220; }); }
      const tag = side === 'blue' ? state.blueTeam.tag : state.redTeam.tag;
      const tierText = oppLanes[lane] === 2 ? 'dış kulesini' : oppLanes[lane] === 1 ? 'iç kulesini' : 'inhibitör kulesini ve inhibitörü';
      state.events.push({ min: m, type: 'TOWER', side, text: `🏰 ${tag}, ${lane} koridorundaki ${tierText} yıktı!` });
      focusPoint = LANE_COORDS[lane];
      state.lastEventPos = { ...focusPoint, color: side === 'blue' ? '#38bdf8' : '#ef4444' };
    }
  }

  // 6. Baron Nashor & Big 5v5 Teamfights
  if (m >= state.baronTimer && Math.random() < 0.34) {
    let baronProb = blueWinProb;
    if (state.blueTactics.objective === 'baron') baronProb += 0.06;
    if (state.redTactics.objective === 'baron') baronProb -= 0.06;
    const winner = Math.random() < baronProb ? 'blue' : 'red';
    const loser = winner === 'blue' ? 'red' : 'blue';

    const wKills = 2 + Math.floor(Math.random() * 3);
    const lKills = Math.floor(Math.random() * 2);
    const rolesShuffled = [...ROLES].sort(() => Math.random() - 0.5);
    for (let i = 0; i < wKills; i++) awardKill(state, winner, pick(['BOT', 'MID', 'TOP', 'JGL']), rolesShuffled[i], ROLES.slice(0, 3));
    for (let i = 0; i < lKills; i++) awardKill(state, loser, pick(['BOT', 'MID']), pick(['SUP', 'JGL', 'TOP']), ['SUP', 'MID']);

    if (winner === 'blue') { state.blueBarons++; state.bluePlayers.forEach(p => { p.gold += 350; p.rating = Math.min(10, +(p.rating + 0.35).toFixed(1)); }); }
    else { state.redBarons++; state.redPlayers.forEach(p => { p.gold += 350; p.rating = Math.min(10, +(p.rating + 0.35).toFixed(1)); }); }
    state.baronBuffSide = winner;
    state.baronBuffUntil = m + 3;
    state.baronTimer = m + 7;

    const tag = winner === 'blue' ? state.blueTeam.tag : state.redTeam.tag;
    state.events.push({ min: m, type: 'BARON', side: winner, text: `👑 BARON NASHOR! ${tag}, büyük 5v5 takım savaşını ${wKills}-${lKills} kazanıp Baron güçlendirmesini aldı!` });
    focusPoint = LANE_COORDS.BARON;
    state.lastEventPos = { ...focusPoint, color: '#c084fc' };
  }

  // 7. Recalculate Gold, GD@15 & 10-Player Positions
  state.blueGold = state.bluePlayers.reduce((s, p) => s + p.gold, 0);
  state.redGold = state.redPlayers.reduce((s, p) => s + p.gold, 0);
  state.goldHistory.push(state.blueGold - state.redGold);
  if (m === 15) state.gd15 = state.blueGold - state.redGold;

  updatePlayerPositions(state, focusPoint);

  // 8. Nexus Push / End Check
  if (m >= 23) {
    const blueAdv = state.blueGold - state.redGold;
    const blueCanEnd = (state.blueTowers >= 6 && blueAdv > 3500) || (m >= 31 && blueWinProb > 0.54) || m >= 42;
    const redCanEnd = (state.redTowers >= 6 && blueAdv < -3500) || (m >= 31 && blueWinProb < 0.46) || m >= 42;

    if ((blueCanEnd || redCanEnd) && Math.random() < (m >= 38 ? 0.65 : 0.28)) {
      const winner = Math.random() < blueWinProb ? 'blue' : 'red';
      for (const r of ROLES.slice(0, 4)) awardKill(state, winner, pick(['BOT', 'MID', 'TOP']), r, ['SUP', 'JGL']);
      if (winner === 'blue') { state.redNexusHP = 0; state.blueTowers = Math.max(state.blueTowers, 9); }
      else { state.blueNexusHP = 0; state.redTowers = Math.max(state.redTowers, 9); }

      state.blueGold = state.bluePlayers.reduce((s, p) => s + p.gold, 0);
      state.redGold = state.redPlayers.reduce((s, p) => s + p.gold, 0);
      state.goldHistory[state.goldHistory.length - 1] = state.blueGold - state.redGold;

      // Compute final DMG% & GOLD% shares
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
      const winPlayers = winner === 'blue' ? state.bluePlayers : state.redPlayers;
      const mvp = [...winPlayers].sort((a, b) => (b.rating * 10 + b.kills * 2 + b.assists - b.deaths * 1.5) - (a.rating * 10 + a.kills * 2 + a.assists - a.deaths * 1.5))[0];
      state.mvp = mvp;

      const winTeam = winner === 'blue' ? state.blueTeam : state.redTeam;
      state.events.push({
        min: m,
        type: 'NEXUS',
        side: winner,
        text: `🏆 NEXUS YIKILDI! ${winTeam.name} (${winTeam.tag}) ${m}. dakikada galibiyete uzandı! Maçın MVP'si: ${mvp.name} (${mvp.champName}, ${mvp.kills}/${mvp.deaths}/${mvp.assists})`,
      });
      const baseCoord = winner === 'blue' ? LANE_COORDS.RED_BASE : LANE_COORDS.BLUE_BASE;
      state.lastEventPos = { ...baseCoord, color: winner === 'blue' ? '#38bdf8' : '#ef4444' };
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

      // Champion Mastery growth!
      if (!p.mastery) p.mastery = {};
      p.mastery[mp.champId] = Math.min(5, (p.mastery[mp.champId] || 0) + (won ? 1 : 0.5));

      const moraleDelta = won ? 4 : (hasLeader ? -2 : -4);
      p.morale = Math.max(30, Math.min(100, p.morale + moraleDelta));
      p.form = Math.max(45, Math.min(99, p.form + (mp.rating >= 7.5 ? 3 : mp.rating <= 5.5 ? -3 : 0)));
      const restReduction = (team.facilities.gamingHouse - 1) * 1.5;
      p.fatigue = Math.min(100, Math.round(p.fatigue + Math.max(4, 9 - restReduction)));
    }
    team.synergy = Math.max(40, Math.min(100, team.synergy + (won ? 1.5 : (hasLeader ? 0 : -0.5))));
  };

  applySide(matchState.bluePlayers, matchState.winner === 'blue', matchState.blueTeam);
  applySide(matchState.redPlayers, matchState.winner === 'red', matchState.redTeam);
}

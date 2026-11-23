// LoL Esports Manager — Minute-by-Minute Live Match Engine & Instant Simulator
import { CHAMPION_MAP, getChampionMetaTier, getTierBonus } from '../data/champions.js';
import { ROLES } from '../data/teamsAndPlayers.js';
import { createDraftState, autoCompleteDraft, analyzeDraftSide } from './draftEngine.js';

function rand(min, max) {
  return min + Math.random() * (max - min);
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getEffectivePlayerRating(player, champId, patch, team, moraleBoost = 0) {
  const champ = CHAMPION_MAP[champId];
  const tier = champ ? getChampionMetaTier(champ, patch) : 'B';
  const tierBonus = getTierBonus(tier);
  const sigBonus = player.sigChamps.includes(champId) ? 4.5 : (player.attrs.pool - 78) * 0.12;
  const formMod = (player.form - 75) * 0.14;
  const moraleMod = ((player.morale + moraleBoost) - 75) * 0.10;
  const fatiguePen = Math.max(0, player.fatigue - 55) * 0.18;
  const synMod = (team.synergy - 70) * 0.12;
  const facilityMod = (team.facilities.analystDesk - 1) * 0.6;
  return player.ovr + tierBonus + sigBonus + formMod + moraleMod - fatiguePen + synMod + facilityMod;
}

export function createLiveMatchState(blueTeam, redTeam, blueRoster, redRoster, bluePicks, redPicks, patch, userSide = null) {
  const makePlayers = (roster, picks, side) =>
    ROLES.map(role => {
      const p = roster.find(x => x.role === role) || roster[0];
      const champId = picks[role];
      return {
        playerId: p.id,
        name: p.name,
        role,
        side,
        champId,
        champName: CHAMPION_MAP[champId]?.name || champId,
        champColor: CHAMPION_MAP[champId]?.color || '#64748b',
        playerRef: p,
        kills: 0,
        deaths: 0,
        assists: 0,
        cs: 0,
        gold: 500,
        rating: 6.5,
      };
    });

  const blueAnalysis = analyzeDraftSide(bluePicks, blueRoster, patch);
  const redAnalysis = analyzeDraftSide(redPicks, redRoster, patch);

  return {
    minute: 0,
    finished: false,
    winner: null, // 'blue' | 'red'
    userSide,
    patch,
    blueTeam,
    redTeam,
    bluePlayers: makePlayers(blueRoster, bluePicks, 'blue'),
    redPlayers: makePlayers(redRoster, redPicks, 'red'),
    blueAnalysis,
    redAnalysis,
    blueTactics: { ...blueTeam.tactics },
    redTactics: { ...redTeam.tactics },
    blueTalkUsed: false,
    redTalkUsed: false,
    blueTalkBoost: 0,
    redTalkBoost: 0,

    // Scoreboard & Objectives
    blueKills: 0,
    redKills: 0,
    blueGold: 2500,
    redGold: 2500,
    goldHistory: [0], // blueGold - redGold per minute
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

    // Turret map state (3 lanes x 3 tiers: outer, inner, inhib)
    blueLaneTowers: { TOP: 3, MID: 3, BOT: 3 }, // remaining towers
    redLaneTowers: { TOP: 3, MID: 3, BOT: 3 },
    blueNexusHP: 100,
    redNexusHP: 100,

    // Visual highlight for minimap pulse
    lastEventPos: null, // { x, y, type, color }
    events: [
      { min: 0, type: 'SYSTEM', text: `Vadiye hoş geldiniz! ${blueTeam.tag} (Mavi) vs ${redTeam.tag} (Kırmızı) karşılaşması başlıyor.` }
    ],
    mvp: null,
  };
}

function getTeamPhaseStrength(state, side) {
  const players = side === 'blue' ? state.bluePlayers : state.redPlayers;
  const team = side === 'blue' ? state.blueTeam : state.redTeam;
  const analysis = side === 'blue' ? state.blueAnalysis : state.redAnalysis;
  const tactics = side === 'blue' ? state.blueTactics : state.redTactics;
  const talkBoost = side === 'blue' ? state.blueTalkBoost : state.redTalkBoost;
  const m = state.minute;

  // Average effective player rating
  let avg = 0;
  for (const pl of players) {
    avg += getEffectivePlayerRating(pl.playerRef, pl.champId, state.patch, team, talkBoost);
  }
  avg /= 5;

  // Phase scaling (early < 15, mid 15-26, late > 26)
  let phaseScore = 0;
  if (m < 15) phaseScore = analysis.early * state.patch.earlyWeight;
  else if (m < 26) phaseScore = analysis.mid * state.patch.midWeight;
  else phaseScore = analysis.late * state.patch.lateWeight;

  // Tactics effect
  let tacticMod = 0;
  if (tactics.gameplan === 'aggressive') tacticMod += m < 16 ? 2.6 : -1.2;
  if (tactics.gameplan === 'scaling') tacticMod += m < 15 ? -1.8 : m > 25 ? 3.0 : 0.4;
  if (tactics.gameplan === 'split') tacticMod += m > 18 ? 1.4 : 0;

  // Gold & objective snowball
  const goldDiff = (side === 'blue' ? state.blueGold - state.redGold : state.redGold - state.blueGold);
  const goldMod = Math.max(-14, Math.min(14, goldDiff / 750));
  const baronMod = state.baronBuffSide === side && m <= state.baronBuffUntil ? 5.5 : 0;
  const soulMod = state.soulSide === side ? 4.5 : 0;

  return avg + phaseScore * 1.15 + tacticMod + goldMod + baronMod + soulMod;
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
  killer.rating = Math.min(10, +(killer.rating + 0.45).toFixed(1));

  victim.deaths++;
  victim.rating = Math.max(3.0, +(victim.rating - 0.35).toFixed(1));

  for (const ar of assistRoles) {
    if (ar === killerRole) continue;
    const assister = kTeam.find(p => p.role === ar);
    if (assister) {
      assister.assists++;
      assister.gold += 150;
      assister.rating = Math.min(10, +(assister.rating + 0.22).toFixed(1));
    }
  }

  if (killerSide === 'blue') state.blueKills++;
  else state.redKills++;

  return { killer, victim, isFB };
}

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

export function stepMatchMinute(state) {
  if (state.finished) return state;
  state.minute++;
  const m = state.minute;

  // Decay tactical talk boost slowly
  if (state.blueTalkBoost > 0) state.blueTalkBoost = Math.max(0, state.blueTalkBoost - 0.6);
  if (state.redTalkBoost > 0) state.redTalkBoost = Math.max(0, state.redTalkBoost - 0.6);

  const blueStr = getTeamPhaseStrength(state, 'blue');
  const redStr = getTeamPhaseStrength(state, 'red');
  const blueWinProb = 1 / (1 + Math.exp(-(blueStr - redStr) / 7.5));

  // 1. Passive CS & Gold per minute
  const updateFarm = (players, teamStr, oppStr) => {
    const adv = (teamStr - oppStr) * 0.04;
    for (const pl of players) {
      const baseCS = pl.role === 'SUP' ? rand(0.9, 1.5) : pl.role === 'JGL' ? rand(5.2, 6.8) : rand(7.2, 9.8);
      const laningBonus = (pl.playerRef.attrs.laning - 80) * 0.06;
      const gainedCS = Math.max(0, Math.round(baseCS + laningBonus + adv));
      pl.cs += gainedCS;
      pl.gold += Math.round(115 + gainedCS * 21 + (pl.role === 'SUP' ? 95 : 0));
    }
  };
  updateFarm(state.bluePlayers, blueStr, redStr);
  updateFarm(state.redPlayers, redStr, blueStr);

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
      state.lastEventPos = { ...LANE_COORDS[targetLane], color: killerSide === 'blue' ? '#38bdf8' : '#ef4444' };
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
      state.lastEventPos = { ...LANE_COORDS[laneRole], color: killerSide === 'blue' ? '#38bdf8' : '#ef4444' };
    }
  }

  // 3. Voidgrubs / Rift Herald (minutes 6, 11, 15)
  if (m === 6 || m === 11 || m === 15) {
    let grubsProb = blueWinProb;
    if (state.blueTactics.objective === 'baron') grubsProb += 0.06;
    if (state.redTactics.objective === 'baron') grubsProb -= 0.06;
    const side = Math.random() < grubsProb ? 'blue' : 'red';
    const objName = m === 15 ? 'Vadi Alameti' : 'Hiçlik Kurtçukları';
    if (side === 'blue') {
      state.blueGrubs++;
      state.bluePlayers.forEach(p => { p.gold += 120; });
    } else {
      state.redGrubs++;
      state.redPlayers.forEach(p => { p.gold += 120; });
    }
    const tag = side === 'blue' ? state.blueTeam.tag : state.redTeam.tag;
    state.events.push({
      min: m,
      type: 'OBJECTIVE',
      side,
      text: `🟣 ${tag}, ${objName} objektifini kontrol altına aldı!`,
    });
    state.lastEventPos = { ...LANE_COORDS.BARON, color: '#a855f7' };
  }

  // 4. Dragon Fights (every 5-6 mins starting min 5)
  if (m >= state.dragonTimer && !state.soulSide) {
    let dragProb = blueWinProb;
    if (state.blueTactics.objective === 'dragon') dragProb += 0.07;
    if (state.redTactics.objective === 'dragon') dragProb -= 0.07;
    const winner = Math.random() < dragProb ? 'blue' : 'red';
    const contested = Math.random() < 0.65;

    if (contested) {
      // Skirmish around dragon pit
      const wKills = 1 + Math.floor(Math.random() * 2);
      const lKills = Math.floor(Math.random() * 2);
      for (let i = 0; i < wKills; i++) {
        awardKill(state, winner, pick(['MID', 'BOT', 'JGL']), pick(['SUP', 'JGL', 'BOT', 'TOP']), ['SUP', 'JGL', 'MID']);
      }
      for (let i = 0; i < lKills; i++) {
        awardKill(state, winner === 'blue' ? 'red' : 'blue', pick(['MID', 'BOT']), pick(['SUP', 'TOP', 'JGL']), ['SUP', 'JGL']);
      }
    }

    if (winner === 'blue') {
      state.blueDragons++;
      state.bluePlayers.forEach(p => { p.gold += 150; p.rating = Math.min(10, +(p.rating + 0.15).toFixed(1)); });
    } else {
      state.redDragons++;
      state.redPlayers.forEach(p => { p.gold += 150; p.rating = Math.min(10, +(p.rating + 0.15).toFixed(1)); });
    }

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
    state.lastEventPos = { ...LANE_COORDS.DRAGON, color: '#f59e0b' };
    state.dragonTimer = m + 5 + Math.floor(Math.random() * 2);
  }

  // 5. Tower Takes (after min 10)
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
      if (side === 'blue') {
        state.blueTowers++;
        state.bluePlayers.forEach(p => { p.gold += 220; });
      } else {
        state.redTowers++;
        state.redPlayers.forEach(p => { p.gold += 220; });
      }
      const tag = side === 'blue' ? state.blueTeam.tag : state.redTeam.tag;
      const tierText = oppLanes[lane] === 2 ? 'dış kulesini' : oppLanes[lane] === 1 ? 'iç kulesini' : 'inhibitör kulesini ve inhibitörü';
      state.events.push({
        min: m,
        type: 'TOWER',
        side,
        text: `🏰 ${tag}, ${lane} koridorundaki ${tierText} yıktı!`,
      });
      state.lastEventPos = { ...LANE_COORDS[lane], color: side === 'blue' ? '#38bdf8' : '#ef4444' };
    }
  }

  // 6. Baron Nashor & Big 5v5 Teamfights (after min 20)
  if (m >= state.baronTimer && Math.random() < 0.34) {
    let baronProb = blueWinProb;
    if (state.blueTactics.objective === 'baron') baronProb += 0.06;
    if (state.redTactics.objective === 'baron') baronProb -= 0.06;
    const winner = Math.random() < baronProb ? 'blue' : 'red';
    const loser = winner === 'blue' ? 'red' : 'blue';

    const wKills = 2 + Math.floor(Math.random() * 3); // 2-4 kills
    const lKills = Math.floor(Math.random() * 2);
    const rolesShuffled = [...ROLES].sort(() => Math.random() - 0.5);
    for (let i = 0; i < wKills; i++) {
      awardKill(state, winner, pick(['BOT', 'MID', 'TOP', 'JGL']), rolesShuffled[i], ROLES.slice(0, 3));
    }
    for (let i = 0; i < lKills; i++) {
      awardKill(state, loser, pick(['BOT', 'MID']), pick(['SUP', 'JGL', 'TOP']), ['SUP', 'MID']);
    }

    if (winner === 'blue') {
      state.blueBarons++;
      state.bluePlayers.forEach(p => { p.gold += 350; p.rating = Math.min(10, +(p.rating + 0.35).toFixed(1)); });
    } else {
      state.redBarons++;
      state.redPlayers.forEach(p => { p.gold += 350; p.rating = Math.min(10, +(p.rating + 0.35).toFixed(1)); });
    }
    state.baronBuffSide = winner;
    state.baronBuffUntil = m + 3;
    state.baronTimer = m + 7;

    const tag = winner === 'blue' ? state.blueTeam.tag : state.redTeam.tag;
    state.events.push({
      min: m,
      type: 'BARON',
      side: winner,
      text: `👑 BARON NASHOR! ${tag}, büyük 5v5 takım savaşını ${wKills}-${lKills} kazanıp Baron güçlendirmesini aldı!`,
    });
    state.lastEventPos = { ...LANE_COORDS.BARON, color: '#c084fc' };
  }

  // 7. Recalculate team gold totals
  state.blueGold = state.bluePlayers.reduce((s, p) => s + p.gold, 0);
  state.redGold = state.redPlayers.reduce((s, p) => s + p.gold, 0);
  state.goldHistory.push(state.blueGold - state.redGold);

  // 8. Nexus Push / Game End Check (after min 23)
  if (m >= 23) {
    const blueAdv = state.blueGold - state.redGold;
    const blueCanEnd = (state.blueTowers >= 6 && blueAdv > 3500) || (m >= 31 && blueWinProb > 0.54) || m >= 42;
    const redCanEnd = (state.redTowers >= 6 && blueAdv < -3500) || (m >= 31 && blueWinProb < 0.46) || m >= 42;

    if ((blueCanEnd || redCanEnd) && Math.random() < (m >= 38 ? 0.65 : 0.28)) {
      const winner = Math.random() < blueWinProb ? 'blue' : 'red';
      // Final teamfight & Ace
      const loser = winner === 'blue' ? 'red' : 'blue';
      for (const r of ROLES.slice(0, 4)) {
        awardKill(state, winner, pick(['BOT', 'MID', 'TOP']), r, ['SUP', 'JGL']);
      }
      if (winner === 'blue') {
        state.redNexusHP = 0;
        state.blueTowers = Math.max(state.blueTowers, 9);
      } else {
        state.blueNexusHP = 0;
        state.redTowers = Math.max(state.redTowers, 9);
      }

      state.blueGold = state.bluePlayers.reduce((s, p) => s + p.gold, 0);
      state.redGold = state.redPlayers.reduce((s, p) => s + p.gold, 0);
      state.goldHistory[state.goldHistory.length - 1] = state.blueGold - state.redGold;

      state.finished = true;
      state.winner = winner;

      // Determine MVP from winning side
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
      state.lastEventPos = winner === 'blue' ? { ...LANE_COORDS.RED_BASE, color: '#38bdf8' } : { ...LANE_COORDS.BLUE_BASE, color: '#ef4444' };
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

export function quickSimulateGame(blueTeam, redTeam, blueRoster, redRoster, patch) {
  const draft = createDraftState(blueTeam, redTeam, blueRoster, redRoster, patch, null);
  autoCompleteDraft(draft);
  const match = createLiveMatchState(blueTeam, redTeam, blueRoster, redRoster, draft.bluePicks, draft.redPicks, patch, null);
  finishMatchInstantly(match);
  return match;
}

// Apply match stats & morale/fatigue back to persistent player objects
export function applyMatchOutcomeToPlayers(matchState) {
  const applySide = (players, won, team) => {
    for (const mp of players) {
      const p = mp.playerRef;
      p.stats.games++;
      if (won) p.stats.wins++;
      p.stats.kills += mp.kills;
      p.stats.deaths += mp.deaths;
      p.stats.assists += mp.assists;
      if (matchState.mvp && matchState.mvp.playerId === p.id) p.stats.mvps++;

      // Form, morale, fatigue
      p.morale = Math.max(30, Math.min(100, p.morale + (won ? 4 : -4)));
      p.form = Math.max(45, Math.min(99, p.form + (mp.rating >= 7.5 ? 3 : mp.rating <= 5.5 ? -3 : 0)));
      const restReduction = (team.facilities.gamingHouse - 1) * 1.5;
      p.fatigue = Math.min(100, Math.round(p.fatigue + Math.max(4, 9 - restReduction)));
    }
    team.synergy = Math.max(40, Math.min(100, team.synergy + (won ? 1.5 : -0.5)));
  };

  applySide(matchState.bluePlayers, matchState.winner === 'blue', matchState.blueTeam);
  applySide(matchState.redPlayers, matchState.winner === 'red', matchState.redTeam);
}

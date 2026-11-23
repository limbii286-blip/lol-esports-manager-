// LoL Esports Manager v2.0 — Fearless Draft + Counter Matchups + Mastery Draft Engine
import { CHAMPIONS, CHAMPION_MAP, getChampionMetaTier, getTierBonus, getMatchupAdvantage } from '../data/champions.js';
import { ROLES } from '../data/teamsAndPlayers.js';

export const DRAFT_STEPS = [
  // Ban Phase 1
  { side: 'blue', type: 'ban', label: 'Mavi Yasaklama 1' },
  { side: 'red', type: 'ban', label: 'Kırmızı Yasaklama 1' },
  { side: 'blue', type: 'ban', label: 'Mavi Yasaklama 2' },
  { side: 'red', type: 'ban', label: 'Kırmızı Yasaklama 2' },
  { side: 'blue', type: 'ban', label: 'Mavi Yasaklama 3' },
  { side: 'red', type: 'ban', label: 'Kırmızı Yasaklama 3' },
  // Pick Phase 1
  { side: 'blue', type: 'pick', label: 'Mavi Seçim 1' },
  { side: 'red', type: 'pick', label: 'Kırmızı Seçim 1' },
  { side: 'red', type: 'pick', label: 'Kırmızı Seçim 2' },
  { side: 'blue', type: 'pick', label: 'Mavi Seçim 2' },
  { side: 'blue', type: 'pick', label: 'Mavi Seçim 3' },
  { side: 'red', type: 'pick', label: 'Kırmızı Seçim 3' },
  // Ban Phase 2
  { side: 'red', type: 'ban', label: 'Kırmızı Yasaklama 4' },
  { side: 'blue', type: 'ban', label: 'Mavi Yasaklama 4' },
  { side: 'red', type: 'ban', label: 'Kırmızı Yasaklama 5' },
  { side: 'blue', type: 'ban', label: 'Mavi Yasaklama 5' },
  // Pick Phase 2
  { side: 'red', type: 'pick', label: 'Kırmızı Seçim 4' },
  { side: 'blue', type: 'pick', label: 'Mavi Seçim 4' },
  { side: 'blue', type: 'pick', label: 'Mavi Seçim 5' },
  { side: 'red', type: 'pick', label: 'Kırmızı Seçim 5' },
];

export function createDraftState(blueTeam, redTeam, blueRoster, redRoster, patch, userSide, fearlessLocked = new Set()) {
  return {
    stepIndex: 0,
    blueTeam,
    redTeam,
    blueRoster,
    redRoster,
    patch,
    userSide,
    blueBans: [],
    redBans: [],
    bluePicks: {},
    redPicks: {},
    fearlessLocked: new Set(fearlessLocked),
    usedChamps: new Set(fearlessLocked),
    finished: false,
  };
}

export function getMissingRoles(picksObj) {
  return ROLES.filter(r => !picksObj[r]);
}

export function assignRoleForChamp(champ, picksObj) {
  const missing = getMissingRoles(picksObj);
  for (const r of champ.roles) {
    if (missing.includes(r)) return r;
  }
  return missing[0] || null;
}

export function applyDraftAction(draft, champId, forcedRole = null) {
  if (draft.finished || draft.usedChamps.has(champId)) return false;
  const step = DRAFT_STEPS[draft.stepIndex];
  const champ = CHAMPION_MAP[champId];
  if (!champ) return false;

  if (step.type === 'ban') {
    if (step.side === 'blue') draft.blueBans.push(champId);
    else draft.redBans.push(champId);
  } else {
    const picksObj = step.side === 'blue' ? draft.bluePicks : draft.redPicks;
    const role = forcedRole && !picksObj[forcedRole] ? forcedRole : assignRoleForChamp(champ, picksObj);
    if (!role) return false;
    picksObj[role] = champId;
  }

  draft.usedChamps.add(champId);
  draft.stepIndex++;
  if (draft.stepIndex >= DRAFT_STEPS.length) {
    draft.finished = true;
  }
  return true;
}

export function chooseAIDraftAction(draft) {
  const step = DRAFT_STEPS[draft.stepIndex];
  if (!step) return null;

  const isBlue = step.side === 'blue';
  const ownRoster = isBlue ? draft.blueRoster : draft.redRoster;
  const oppRoster = isBlue ? draft.redRoster : draft.blueRoster;
  const ownPicks = isBlue ? draft.bluePicks : draft.redPicks;
  const oppPicks = isBlue ? draft.redPicks : draft.bluePicks;

  const available = CHAMPIONS.filter(c => !draft.usedChamps.has(c.id));

  if (step.type === 'ban') {
    const oppMissing = getMissingRoles(oppPicks);
    let best = null;
    let bestScore = -999;

    for (const c of available) {
      const fitsOpp = c.roles.some(r => oppMissing.includes(r));
      if (!fitsOpp) continue;

      const tier = getChampionMetaTier(c, draft.patch);
      let score = getTierBonus(tier) * 3 + Math.random() * 4;

      for (const p of oppRoster) {
        if (oppMissing.includes(p.role)) {
          if (p.sigChamps.includes(c.id)) score += 7 + (p.ovr - 75) * 0.25;
          if ((p.mastery?.[c.id] || 0) >= 4) score += 4;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        best = c.id;
      }
    }
    return { champId: best || available[0].id, role: null };
  } else {
    const missing = getMissingRoles(ownPicks);
    const pickedChamps = Object.values(ownPicks).map(id => CHAMPION_MAP[id]);
    const hasTank = pickedChamps.some(c => c.dmg === 'Tank');
    const apCount = pickedChamps.filter(c => c.dmg === 'AP').length;
    const adCount = pickedChamps.filter(c => c.dmg === 'AD').length;

    let best = null;
    let bestRole = null;
    let bestScore = -999;

    for (const role of missing) {
      const player = ownRoster.find(p => p.role === role);
      const oppLaneChamp = oppPicks[role];
      for (const c of available) {
        if (!c.roles.includes(role)) continue;
        const tier = getChampionMetaTier(c, draft.patch);
        let score = getTierBonus(tier) * 3.2 + Math.random() * 3.5;

        if (c.roles[0] === role) score += 2.5;
        if (player && player.sigChamps.includes(c.id)) score += 7.0;
        if (player && player.mastery?.[c.id]) score += Math.min(5, player.mastery[c.id] * 1.2);
        if (oppLaneChamp) score += getMatchupAdvantage(c.id, oppLaneChamp) * 2.2;
        if (!hasTank && c.dmg === 'Tank' && (role === 'TOP' || role === 'JGL' || role === 'SUP')) score += 3.5;
        if (apCount === 0 && c.dmg === 'AP' && (role === 'MID' || role === 'TOP' || role === 'JGL')) score += 2.5;
        if (adCount === 0 && c.dmg === 'AD' && (role === 'BOT' || role === 'TOP' || role === 'JGL')) score += 2.5;

        if (score > bestScore) {
          bestScore = score;
          best = c.id;
          bestRole = role;
        }
      }
    }

    if (!best) {
      best = available[0].id;
      bestRole = missing[0];
    }
    return { champId: best, role: bestRole };
  }
}

export function autoCompleteDraft(draft) {
  while (!draft.finished) {
    const move = chooseAIDraftAction(draft);
    if (!move) break;
    applyDraftAction(draft, move.champId, move.role);
  }
  return draft;
}

export function analyzeDraftSide(picksObj, roster, patch, oppPicksObj = {}) {
  const entries = ROLES.map(role => ({
    role,
    champ: picksObj[role] ? CHAMPION_MAP[picksObj[role]] : null,
    oppChampId: oppPicksObj[role] || null,
    player: roster.find(p => p.role === role),
  })).filter(e => e.champ);

  if (entries.length === 0) {
    return { early: 0, mid: 0, late: 0, engage: 0, sigCount: 0, counterEdge: 0, metaBonus: 0, score: 0, warnings: [] };
  }

  let early = 0, mid = 0, late = 0, engage = 0, sigCount = 0, metaBonus = 0, counterEdge = 0;
  let ad = 0, ap = 0, tank = 0;

  for (const { champ, oppChampId, player } of entries) {
    early += champ.early;
    mid += champ.mid;
    late += champ.late;
    engage += champ.engage;
    const tier = getChampionMetaTier(champ, patch);
    metaBonus += getTierBonus(tier);
    if (player && player.sigChamps.includes(champ.id)) sigCount++;
    if (oppChampId) counterEdge += getMatchupAdvantage(champ.id, oppChampId);
    if (champ.dmg === 'AD') ad++;
    if (champ.dmg === 'AP') ap++;
    if (champ.dmg === 'Tank') tank++;
  }

  const n = entries.length;
  const warnings = [];
  let compPenalty = 0;
  if (n === 5) {
    if (tank === 0) { warnings.push('Ön saf (Tank) eksik'); compPenalty -= 2.5; }
    if (ap === 0) { warnings.push('Full AD (AP hasar yok)'); compPenalty -= 3.0; }
    if (ad === 0) { warnings.push('Full AP (AD hasar yok)'); compPenalty -= 3.0; }
    if (engage / n < 5.5) { warnings.push('Düşük savaş başlatma (Engage)'); compPenalty -= 1.5; }
  }

  const score = Math.round(
    (early / n) * 3.1 * patch.earlyWeight +
    (mid / n) * 3.3 * patch.midWeight +
    (late / n) * 3.3 * patch.lateWeight +
    sigCount * 2.3 +
    counterEdge * 1.1 +
    metaBonus * 0.7 +
    compPenalty
  );

  return {
    early: +(early / n).toFixed(1),
    mid: +(mid / n).toFixed(1),
    late: +(late / n).toFixed(1),
    engage: +(engage / n).toFixed(1),
    sigCount,
    counterEdge: +counterEdge.toFixed(1),
    metaBonus: +metaBonus.toFixed(1),
    score: Math.max(40, Math.min(99, score)),
    warnings,
  };
}

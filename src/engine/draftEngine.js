// LoL Esports Manager v3.0 — Pro Fearless Draft + Flex Role-Swaps + Comp Identity Matrix + Role-Pinch AI
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
  { side: 'blue', type: 'pick', label: 'Mavi Seçim 1 (B1)' },
  { side: 'red', type: 'pick', label: 'Kırmızı Seçim 1 (R1)' },
  { side: 'red', type: 'pick', label: 'Kırmızı Seçim 2 (R2)' },
  { side: 'blue', type: 'pick', label: 'Mavi Seçim 2 (B2)' },
  { side: 'blue', type: 'pick', label: 'Mavi Seçim 3 (B3)' },
  { side: 'red', type: 'pick', label: 'Kırmızı Seçim 3 (R3)' },
  // Ban Phase 2
  { side: 'red', type: 'ban', label: 'Kırmızı Yasaklama 4' },
  { side: 'blue', type: 'ban', label: 'Mavi Yasaklama 4' },
  { side: 'red', type: 'ban', label: 'Kırmızı Yasaklama 5' },
  { side: 'blue', type: 'ban', label: 'Mavi Yasaklama 5' },
  // Pick Phase 2
  { side: 'red', type: 'pick', label: 'Kırmızı Seçim 4 (R4)' },
  { side: 'blue', type: 'pick', label: 'Mavi Seçim 4 (B4)' },
  { side: 'blue', type: 'pick', label: 'Mavi Seçim 5 (B5)' },
  { side: 'red', type: 'pick', label: 'Kırmızı Seçim 5 (R5 Counter)' },
];

export const COMP_ARCHETYPES = {
  ENGAGE: { id: 'ENGAGE', label: 'Engage / Dive', beats: 'POKE', desc: 'Sert savaş başlatma ile kırılgan Poke/Siege kadrolarını ezer.' },
  POKE: { id: 'POKE', label: 'Poke / Siege', beats: 'DISENGAGE', desc: 'Menzil ve kule kuşatmasıyla savunmacı Protect kadrolarını eritir.' },
  DISENGAGE: { id: 'DISENGAGE', label: 'Protect / Disengage', beats: 'ENGAGE', desc: 'Peel ve karşı-engage ile Dive kompozisyonlarını boşa çıkarır.' },
  PICK: { id: 'PICK', label: 'Pick / Skirmish', beats: 'SPLIT', desc: 'Harita pusuları ve hızlı 2v2/3v3 ile 1-3-1 ayrık itmeyi cezalandırır.' },
  SPLIT: { id: 'SPLIT', label: '1-3-1 Split-Push', beats: 'ENGAGE', desc: 'Yan koridor baskısıyla 5v5 Engage kadrolarını haritada böler.' },
};

export function getCompMatchupEdge(myCompId, oppCompId) {
  if (!myCompId || !oppCompId || myCompId === oppCompId) return 0;
  const mine = COMP_ARCHETYPES[myCompId];
  const opp = COMP_ARCHETYPES[oppCompId];
  if (mine?.beats === oppCompId) return 2.4;
  if (opp?.beats === myCompId) return -2.4;
  return 0;
}

export function classifyCompArchetype(champs) {
  if (!champs || champs.length === 0) return COMP_ARCHETYPES.ENGAGE;
  let engageSum = 0;
  let earlySum = 0;
  let lateSum = 0;
  let pokeCnt = 0;
  let peelCnt = 0;
  let pickCnt = 0;
  let splitCnt = 0;

  for (const c of champs) {
    engageSum += c.engage || 6;
    earlySum += c.early || 6;
    lateSum += c.late || 6;
    const tag = String(c.classTag || '').toLowerCase();
    if (tag.includes('poke') || tag.includes('artillery') || tag.includes('control') || tag.includes('mage')) pokeCnt++;
    if (tag.includes('enchanter') || tag.includes('warden') || tag.includes('peel') || tag.includes('hyper')) peelCnt++;
    if (tag.includes('assassin') || tag.includes('skirmish') || tag.includes('catch') || tag.includes('burst')) pickCnt++;
    if (tag.includes('split') || tag.includes('duelist') || tag.includes('fighter') || tag.includes('bruiser')) splitCnt++;
  }

  const n = champs.length;
  const avgEng = engageSum / n;
  const avgEarly = earlySum / n;
  const avgLate = lateSum / n;

  if (avgEng >= 7.6) return COMP_ARCHETYPES.ENGAGE;
  if (peelCnt >= 2 && avgLate >= 7.3) return COMP_ARCHETYPES.DISENGAGE;
  if (pokeCnt >= 2) return COMP_ARCHETYPES.POKE;
  if (splitCnt >= 2 && avgLate >= 7.0) return COMP_ARCHETYPES.SPLIT;
  if (pickCnt >= 2 || avgEarly >= 7.6) return COMP_ARCHETYPES.PICK;
  return avgEng >= 6.8 ? COMP_ARCHETYPES.ENGAGE : COMP_ARCHETYPES.DISENGAGE;
}

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

// Pro LoL Flex-Pick & Role-Swap between two roles on the same side!
export function swapDraftRoles(draft, side, roleA, roleB) {
  if (!draft || !roleA || !roleB || roleA === roleB) return false;
  const picksObj = side === 'blue' ? draft.bluePicks : draft.redPicks;
  if (!picksObj) return false;
  const champA = picksObj[roleA] || null;
  const champB = picksObj[roleB] || null;
  if (!champA && !champB) return false;
  if (champB) picksObj[roleA] = champB;
  else delete picksObj[roleA];
  if (champA) picksObj[roleB] = champA;
  else delete picksObj[roleB];
  return true;
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

  let available = CHAMPIONS.filter(c => !draft.usedChamps.has(c.id));
  if (available.length === 0) {
    const curPicked = new Set([...Object.values(draft.bluePicks), ...Object.values(draft.redPicks), ...draft.blueBans, ...draft.redBans]);
    available = CHAMPIONS.filter(c => !curPicked.has(c.id));
  }
  if (available.length === 0) return null;

  const isDeepFearless = (draft.fearlessLocked?.size || 0) >= 15;

  if (step.type === 'ban') {
    const oppMissing = getMissingRoles(oppPicks);
    // In Game 3-5 Fearless Draft, check which missing opponent role has the thinnest S/A-tier pool (Role Pinch!)
    const rolePoolDepth = {};
    if (isDeepFearless) {
      for (const r of oppMissing) {
        rolePoolDepth[r] = available.filter(c => c.roles.includes(r) && ['S', 'A'].includes(getChampionMetaTier(c, draft.patch))).length;
      }
    }

    let best = null;
    let bestScore = -999;

    for (const c of available) {
      const fitsOpp = c.roles.some(r => oppMissing.includes(r));
      if (!fitsOpp) continue;

      const tier = getChampionMetaTier(c, draft.patch);
      let score = getTierBonus(tier) * 3 + Math.random() * 4;
      // Flex-pick champions are high-priority pro bans!
      if (c.roles.length >= 2) score += 2.2;

      for (const p of oppRoster) {
        if (oppMissing.includes(p.role)) {
          if (p.sigChamps.includes(c.id)) score += 7 + (p.ovr - 75) * 0.25;
          if ((p.mastery?.[c.id] || 0) >= 4) score += 4;
          if (isDeepFearless && (rolePoolDepth[p.role] ?? 10) <= 5 && c.roles.includes(p.role)) {
            score += 4.5; // Fearless Role-Pinch ban!
          }
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
    const pickedChamps = Object.values(ownPicks).map(id => CHAMPION_MAP[id]).filter(Boolean);
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
        // Early-rotation flex picks are valued in pro draft
        if (draft.stepIndex <= 10 && c.roles.length >= 2) score += 2.0;
        if (player && player.sigChamps.includes(c.id)) score += 7.0;
        if (player && player.mastery?.[c.id]) score += Math.min(5, player.mastery[c.id] * 1.2);
        if (oppLaneChamp) score += getMatchupAdvantage(c.id, oppLaneChamp) * 2.4;
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
    return {
      early: 0, mid: 0, late: 0, engage: 0, sigCount: 0, counterEdge: 0, metaBonus: 0,
      score: 0, warnings: [], compArchetype: 'ENGAGE', compLabel: 'Belirleniyor', compCounterEdge: 0, flexCount: 0,
    };
  }

  let early = 0, mid = 0, late = 0, engage = 0, sigCount = 0, metaBonus = 0, counterEdge = 0;
  let ad = 0, ap = 0, tank = 0, flexCount = 0;

  for (const { champ, oppChampId, player } of entries) {
    early += champ.early;
    mid += champ.mid;
    late += champ.late;
    engage += champ.engage;
    const tier = getChampionMetaTier(champ, patch);
    metaBonus += getTierBonus(tier);
    if (champ.roles.length >= 2) flexCount++;
    if (player && player.sigChamps.includes(champ.id)) sigCount++;
    if (oppChampId) counterEdge += getMatchupAdvantage(champ.id, oppChampId);
    if (champ.dmg === 'AD') ad++;
    if (champ.dmg === 'AP') ap++;
    if (champ.dmg === 'Tank') tank++;
  }

  const myComp = classifyCompArchetype(entries.map(e => e.champ));
  const oppChamps = ROLES.map(r => (oppPicksObj[r] ? CHAMPION_MAP[oppPicksObj[r]] : null)).filter(Boolean);
  const oppComp = oppChamps.length >= 3 ? classifyCompArchetype(oppChamps) : null;
  const compCounterEdge = oppComp ? getCompMatchupEdge(myComp.id, oppComp.id) : 0;

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
    compCounterEdge * 1.4 +
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
    compArchetype: myComp.id,
    compLabel: myComp.label,
    compCounterEdge,
    flexCount,
    metaBonus: +metaBonus.toFixed(1),
    score: Math.max(40, Math.min(99, score)),
    warnings,
  };
}

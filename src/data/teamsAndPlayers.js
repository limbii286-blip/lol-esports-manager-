// LoL Esports Manager v2.0 — 7 Regions (LCK, LPL, LEC, LCS, TCL, CBLOL, LCO), 56 Teams, 280+ Players, Traits, Rivalries & Worlds Mayhem Legends

export const ROLES = ['TOP', 'JGL', 'MID', 'BOT', 'SUP'];
export const ROLE_LABELS = {
  TOP: 'Üst Koridor',
  JGL: 'Ormancı',
  MID: 'Orta Koridor',
  BOT: 'Nişancı',
  SUP: 'Destek',
};

export const REGIONS = [
  { id: 'LCK', name: 'LCK (Kore)', color: '#38bdf8', prestige: 96, lang: 'KR', splitBestOf: 3, worldsSlots: 3, desc: 'Dünyanın en disiplinli makro ve bireysel yetenek ligi (BO3).' },
  { id: 'LPL', name: 'LPL (Çin)', color: '#ef4444', prestige: 95, lang: 'CN', splitBestOf: 3, worldsSlots: 3, desc: 'Agresif takım savaşları ve yüksek mekanik temposu (BO3).' },
  { id: 'LEC', name: 'LEC (Avrupa)', color: '#10b981', prestige: 84, lang: 'EN', splitBestOf: 1, worldsSlots: 3, desc: 'Yaratıcı draftlar ve sürpriz stratejilerin sahnesi (BO1).' },
  { id: 'LCS', name: 'LCS (K. Amerika)', color: '#f59e0b', prestige: 80, lang: 'EN', splitBestOf: 3, worldsSlots: 3, desc: 'Yüksek bütçeler, yıldız transferler ve şov kültürü (BO3).' },
  { id: 'TCL', name: 'TCL (Türkiye)', color: '#e11d48', prestige: 75, lang: 'TR', splitBestOf: 1, worldsSlots: 1, desc: 'Tutkulu taraftarlar, tek maçlık lig (BO1) ve sadece şampiyona Worlds bileti.' },
  { id: 'CBLOL', name: 'CBLOL (Brezilya)', color: '#22c55e', prestige: 76, lang: 'PT', splitBestOf: 1, worldsSlots: 2, desc: 'Dünyanın en coşkulu arenaları, tek maçlık lig (BO1) ve 2 Worlds slotu.' },
  { id: 'LCO', name: 'LCO (Okyanusya)', color: '#06b6d4', prestige: 72, lang: 'EN', splitBestOf: 1, worldsSlots: 1, desc: 'Tek maçlık lig (BO1) ve sadece şampiyona Worlds Play-In bileti.' },
];

export const REGION_LANG = Object.fromEntries(REGIONS.map(r => [r.id, r.lang]));

export const TRAITS = {
  Clutch: { label: 'Büyük Maç', desc: 'Playoff, Derbi ve Worlds maçlarında +3 performans.' },
  Leader: { label: 'Lider', desc: 'Takım sinerjisini ve moralini korur.' },
  Grinder: { label: 'Çalışkan', desc: 'Antrenmanlarda %40 daha hızlı gelişir.' },
  Streamer: { label: 'Yayıncı', desc: 'Kulübe ekstra haftalık taraftar geliri getirir.' },
  Tilt: { label: 'Tilt Meyilli', desc: 'Gerideyken performansı düşebilir ama öndeyken parlar.' },
  Ego: { label: 'Egoist', desc: 'Yedek kalırsa hızlıca mutsuz olur; ilk 5 iken yüksek clutch.' },
};

export const RIVALRIES = [
  ['t1', 'geng', 'Telecom / LCK El Clasico'],
  ['t1', 'kt', 'Telecom War'],
  ['blg', 'tes', 'LPL Zirve Derbisi'],
  ['ig', 'rng', 'LPL Klasik'],
  ['g2', 'fnc', 'LEC El Clasico'],
  ['kc', 'vit', 'Fransa Derbisi'],
  ['fly', 'tl', 'LCS Şampiyonluk Derbisi'],
  ['c9', 'tl', 'Kuzey Amerika Klasiği'],
  ['sup', 'bjk', 'TCL Büyük Derbi'],
  ['sup', 'dp', 'TCL Şampiyonlar Klasiği'],
  ['lll', 'png', 'CBLOL Süper Derbi'],
  ['red', 'png', 'Brezilya Ateşi'],
  ['chf', 'dw', 'Okyanusya Derbisi'],
];

export function getRivalryName(teamIdA, teamIdB) {
  const found = RIVALRIES.find(([a, b]) => (a === teamIdA && b === teamIdB) || (a === teamIdB && b === teamIdA));
  return found ? found[2] : null;
}

export function getPlayerLang(nat) {
  if (nat === 'KR') return 'KR';
  if (nat === 'CN' || nat === 'TW') return 'CN';
  if (nat === 'TR') return 'TR';
  if (nat === 'BR') return 'PT';
  return 'EN';
}

export function calcOVR(attrs) {
  return Math.round(
    attrs.mechanics * 0.22 +
    attrs.laning * 0.18 +
    attrs.macro * 0.18 +
    attrs.teamfight * 0.20 +
    attrs.clutch * 0.12 +
    attrs.pool * 0.10
  );
}

export function getAgeFatigueProfile(age = 22) {
  const a = Number(age) || 22;
  if (a <= 20) {
    return {
      gainMult: 0.78,
      recMult: 1.26,
      injuryThreshold: 87,
      perfThreshold: 58,
      label: 'Genç Dayanıklılık',
      desc: 'Maç ve yoğun antrenmanlarda daha az yorulur, çok hızlı toparlanır.',
    };
  }
  if (a <= 23) {
    return {
      gainMult: 0.90,
      recMult: 1.12,
      injuryThreshold: 84,
      perfThreshold: 56,
      label: 'Yüksek Kondisyon',
      desc: 'Yoğun maç takviminde yüksek tempo ve hızlı yenilenme sağlar.',
    };
  }
  if (a <= 26) {
    return {
      gainMult: 1.02,
      recMult: 1.00,
      injuryThreshold: 81,
      perfThreshold: 54,
      label: 'Dengeli Kondisyon',
      desc: 'Standart profesyonel maç yükü ve toparlanma dengesi.',
    };
  }
  if (a <= 28) {
    return {
      gainMult: 1.24,
      recMult: 0.85,
      injuryThreshold: 77,
      perfThreshold: 51,
      label: 'Tecrübeli Yük',
      desc: 'Uzun serilerde ve yoğun antrenmanda daha hızlı yorulur; rotasyon faydalıdır.',
    };
  }
  return {
    gainMult: 1.46,
    recMult: 0.70,
    injuryThreshold: 72,
    perfThreshold: 47,
    label: 'Veteran Yük Yönetimi',
    desc: 'Yorgunluk hızla birikir, toparlanma yavaştır; dinlenme ve bilek sağlığı kritik.',
  };
}

export function calcMarketValue(ovr, age, pot, opts = {}) {
  const safeOvr = Math.max(48, Number(ovr) || 70);
  const safeAge = Math.max(16, Number(age) || 22);
  const safePot = Math.max(safeOvr, Number(pot) || safeOvr);
  const form = opts.form ?? 75;
  const hasTeam = opts.teamId !== undefined ? Boolean(opts.teamId) : true;
  const contractYears = opts.contractYears ?? 2;
  const leaguePrestige = opts.leaguePrestige ?? 82;
  const stats = opts.stats || null;

  // 1. Exponential OVR baseline (separates generational superstars from average starters)
  const ovrBase = Math.pow(Math.max(1, safeOvr - 48), 2.42) * 110;

  // 2. Age valuation curve (Wonderkid premium -> Prime peak -> Steep veteran depreciation)
  const ageMult =
    safeAge <= 19 ? 1.34 :
    safeAge <= 21 ? 1.24 :
    safeAge <= 24 ? 1.12 :
    safeAge <= 26 ? 1.00 :
    safeAge <= 28 ? 0.81 :
    safeAge <= 30 ? 0.63 : 0.45;

  // 3. Potential & growth headroom (age-weighted upside)
  const headroom = Math.max(0, safePot - safeOvr);
  const potSlope = safeAge <= 20 ? 0.044 : safeAge <= 23 ? 0.028 : safeAge <= 26 ? 0.014 : 0.004;
  const eliteCeilingBonus = safePot >= 91 && safeAge <= 22 ? 0.11 : safePot >= 87 && safeAge <= 21 ? 0.06 : 0;
  const potMult = 1 + Math.min(0.56, headroom * potSlope) + eliteCeilingBonus;

  // 4. Rolling Form & Season Performance multiplier
  let formMult = form >= 75
    ? 1 + Math.min(0.28, (form - 75) * 0.0115)
    : 1 - Math.min(0.26, (75 - form) * 0.009);
  if (stats && stats.games >= 3) {
    const kda = (stats.kills + stats.assists) / Math.max(1, stats.deaths);
    const mvpRate = (stats.mvps || 0) / stats.games;
    const perfBoost = Math.max(-0.07, Math.min(0.10, (kda - 3.2) * 0.018 + mvpRate * 0.12));
    formMult += perfBoost;
  }

  // 5. Contract Length Leverage (FM-style: final year plummets transfer value; 3+ yrs protects club!)
  let contractMult = 1.0;
  if (!hasTeam || contractYears <= 0) contractMult = 0.78;
  else if (contractYears === 1) contractMult = 0.68;
  else if (contractYears === 2) contractMult = 1.00;
  else contractMult = 1.22;

  // 6. League Reputation scale
  const repMult = 0.84 + Math.max(0, Math.min(1, (leaguePrestige - 70) / 28)) * 0.26;

  const raw = ovrBase * ageMult * potMult * formMult * contractMult * repMult;
  return Math.max(25000, Math.round(raw / 5000) * 5000);
}

export function calcWeeklySalary(ovr, prestige = 80) {
  const base = Math.pow(Math.max(1, ovr - 48), 2.05) * 19;
  return Math.max(2500, Math.round((base * (0.85 + prestige / 400)) / 500) * 500);
}

let _pid = 1;
const TRAIT_KEYS = Object.keys(TRAITS);

function stretchRating(r) {
  return Math.max(48, Math.min(97, Math.round(95 - (95 - r) * 1.48)));
}

function mkPlayer(name, role, nat, age, rawBaseOvr, rawPot, style, sigChamps, teamId, overrides = {}) {
  const clamp = (v) => Math.max(45, Math.min(99, Math.round(v)));
  const j = () => Math.floor(Math.random() * 7) - 3;
  const baseOvr = stretchRating(rawBaseOvr);
  const pot = stretchRating(rawPot);

  let m = baseOvr + j();
  let l = baseOvr + j();
  let ma = baseOvr + j();
  let tf = baseOvr + j();
  let cl = baseOvr + j();
  let pl = baseOvr + j();

  if (style === 'Aggressive') { m += 3; l += 2; ma -= 2; }
  if (style === 'Scaling') { tf += 3; l -= 1; cl += 2; }
  if (style === 'Playmaker') { m += 2; cl += 3; tf += 1; }
  if (style === 'Weakside') { ma += 3; tf += 2; l -= 1; }
  if (style === 'Shotcaller') { ma += 4; cl += 2; m -= 1; }

  const attrs = {
    mechanics: clamp(overrides.mechanics ?? m),
    laning: clamp(overrides.laning ?? l),
    macro: clamp(overrides.macro ?? ma),
    teamfight: clamp(overrides.teamfight ?? tf),
    clutch: clamp(overrides.clutch ?? cl),
    pool: clamp(overrides.pool ?? pl),
  };

  const ovr = calcOVR(attrs);
  const finalPot = Math.max(ovr, pot);
  const salary = calcWeeklySalary(ovr);
  const contractYears = overrides.contractYears ?? (teamId ? (Math.random() < 0.35 ? 1 : Math.random() < 0.74 ? 2 : 3) : 0);
  const initForm = 72 + Math.floor(Math.random() * 16);
  const marketValue = calcMarketValue(ovr, age, finalPot, {
    form: initForm,
    contractYears,
    teamId,
  });

  // Assign a fitting trait
  let trait = overrides.trait;
  if (!trait) {
    if (style === 'Shotcaller') trait = 'Leader';
    else if (ovr >= 90) trait = Math.random() < 0.65 ? 'Clutch' : 'Ego';
    else if (age <= 20) trait = Math.random() < 0.6 ? 'Grinder' : 'Tilt';
    else trait = TRAIT_KEYS[Math.floor(Math.random() * TRAIT_KEYS.length)];
  }

  // Initial champion mastery on signature champs
  const mastery = {};
  for (const cid of sigChamps) mastery[cid] = 3;

  return {
    id: `p_${Date.now().toString(36)}_${_pid++}_${Math.random().toString(36).slice(2, 5)}`,
    name,
    role,
    nat,
    lang: getPlayerLang(nat),
    importWeeksLeft: 0,
    age,
    attrs,
    ovr,
    pot: finalPot,
    style,
    trait,
    sigChamps,
    mastery,
    teamId,
    salary,
    contractYears,
    marketValue,
    prevMarketValue: marketValue,
    morale: 78 + Math.floor(Math.random() * 14),
    form: initForm,
    fatigue: 8 + Math.floor(Math.random() * 10),
    isStarter: teamId !== null,
    stats: { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, mvps: 0 },
  };
}

const RAW_TEAMS = [
  // ==================== LCK (8 Teams — 2027 Stove League Rosters) ====================
  {
    id: 't1', name: 'T1', tag: 'T1', region: 'LCK', color: '#e2012d', color2: '#ffffff',
    budget: 3900000, prestige: 98, fanbase: 99,
    roster: [
      ['Zeus', 'TOP', 'KR', 23, 94, 96, 'Aggressive', ['rumble', 'aatrox', 'jayce', 'gnar']],
      ['Oner', 'JGL', 'KR', 24, 91, 93, 'Playmaker', ['leesin', 'vi', 'viego']],
      ['Faker', 'MID', 'KR', 30, 93, 94, 'Shotcaller', ['azir', 'orianna', 'ahri', 'sylas']],
      ['Peyz', 'BOT', 'KR', 21, 91, 96, 'Scaling', ['kaisa', 'zeri', 'kalista', 'ezreal']],
      ['Keria', 'SUP', 'KR', 24, 94, 95, 'Playmaker', ['renata', 'bard', 'rakan', 'thresh']],
    ],
  },
  {
    id: 'geng', name: 'Gen.G Esports', tag: 'GEN', region: 'LCK', color: '#aa8a00', color2: '#111111',
    budget: 3600000, prestige: 95, fanbase: 90,
    roster: [
      ['Siwoo', 'TOP', 'KR', 19, 85, 94, 'Aggressive', ['ambessa', 'jax', 'ksante']],
      ['Sharvel', 'JGL', 'KR', 20, 83, 91, 'Playmaker', ['viego', 'vi', 'leesin']],
      ['Chovy', 'MID', 'KR', 25, 96, 96, 'Scaling', ['azir', 'yone', 'aurora', 'corki']],
      ['Ruler', 'BOT', 'KR', 28, 92, 92, 'Scaling', ['kaisa', 'zeri', 'xayah', 'varus']],
      ['Cloud', 'SUP', 'KR', 20, 82, 90, 'Playmaker', ['rell', 'rakan', 'alistar']],
    ],
  },
  {
    id: 'hle', name: 'Hanwha Life Esports', tag: 'HLE', region: 'LCK', color: '#f37321', color2: '#ffffff',
    budget: 3750000, prestige: 95, fanbase: 88,
    roster: [
      ['Kiin', 'TOP', 'KR', 27, 92, 92, 'Weakside', ['ksante', 'rumble', 'jax']],
      ['Canyon', 'JGL', 'KR', 25, 93, 94, 'Playmaker', ['nidalee', 'viego', 'skarner']],
      ['Zeka', 'MID', 'KR', 24, 91, 93, 'Playmaker', ['sylas', 'yone', 'akali', 'azir']],
      ['Gumayusi', 'BOT', 'KR', 24, 92, 94, 'Aggressive', ['varus', 'xayah', 'kalista', 'jinx']],
      ['Delight', 'SUP', 'KR', 24, 90, 91, 'Playmaker', ['rell', 'rakan', 'alistar']],
    ],
  },
  {
    id: 'dk', name: 'Dplus KIA', tag: 'DK', region: 'LCK', color: '#00d2be', color2: '#111111',
    budget: 2800000, prestige: 89, fanbase: 85,
    roster: [
      ['Doran', 'TOP', 'KR', 26, 87, 88, 'Weakside', ['gnar', 'ksante', 'ambessa']],
      ['Kanavi', 'JGL', 'KR', 26, 91, 92, 'Aggressive', ['viego', 'nidalee', 'vi']],
      ['ShowMaker', 'MID', 'KR', 26, 89, 90, 'Playmaker', ['syndra', 'ahri', 'leblanc', 'taliyah']],
      ['Smash', 'BOT', 'KR', 20, 86, 93, 'Aggressive', ['kaisa', 'ezreal', 'zeri']],
      ['Career', 'SUP', 'KR', 21, 83, 89, 'Playmaker', ['nautilus', 'rell', 'rakan']],
    ],
  },
  {
    id: 'kt', name: 'KT Rolster', tag: 'KT', region: 'LCK', color: '#ff0a0a', color2: '#111111',
    budget: 2400000, prestige: 86, fanbase: 81,
    roster: [
      ['PerfecT', 'TOP', 'KR', 22, 84, 89, 'Weakside', ['ksante', 'renekton', 'ornn']],
      ['Lucid', 'JGL', 'KR', 21, 86, 92, 'Playmaker', ['leesin', 'vi', 'viego']],
      ['Bdd', 'MID', 'KR', 27, 90, 90, 'Playmaker', ['azir', 'taliyah', 'orianna']],
      ['Taeyoon', 'BOT', 'KR', 24, 83, 86, 'Scaling', ['aphelios', 'jinx', 'varus']],
      ['Kellin', 'SUP', 'KR', 26, 84, 85, 'Weakside', ['lulu', 'renata', 'rakan']],
    ],
  },
  {
    id: 'kdf', name: 'DN SOOPers', tag: 'DNS', region: 'LCK', color: '#2563eb', color2: '#ffffff',
    budget: 1950000, prestige: 80, fanbase: 72,
    roster: [
      ['DuDu', 'TOP', 'KR', 25, 83, 85, 'Aggressive', ['rumble', 'renekton', 'gnar']],
      ['Cuzz', 'JGL', 'KR', 27, 86, 86, 'Shotcaller', ['sejuani', 'maokai', 'vi']],
      ['BuLLDoG', 'MID', 'KR', 21, 82, 88, 'Aggressive', ['ahri', 'yone', 'syndra']],
      ['Aiming', 'BOT', 'KR', 26, 88, 89, 'Scaling', ['kaisa', 'ezreal', 'smolder']],
      ['Life', 'SUP', 'KR', 26, 82, 83, 'Playmaker', ['rakan', 'nautilus', 'thresh']],
    ],
  },
  {
    id: 'ns', name: 'Nongshim RedForce', tag: 'NS', region: 'LCK', color: '#dc2626', color2: '#fbbf24',
    budget: 1900000, prestige: 79, fanbase: 71,
    roster: [
      ['Kingen', 'TOP', 'KR', 26, 85, 86, 'Weakside', ['aatrox', 'ksante', 'ornn']],
      ['Pyosik', 'JGL', 'KR', 26, 84, 85, 'Playmaker', ['leesin', 'viego', 'jarvan']],
      ['Fisher', 'MID', 'KR', 22, 81, 87, 'Playmaker', ['ahri', 'azir', 'sylas']],
      ['Deft', 'BOT', 'KR', 30, 84, 84, 'Scaling', ['ezreal', 'jinx', 'varus']],
      ['Andil', 'SUP', 'KR', 24, 81, 84, 'Weakside', ['rell', 'leona', 'braum']],
    ],
  },
  {
    id: 'drx', name: 'DRX', tag: 'DRX', region: 'LCK', color: '#3b82f6', color2: '#ffffff',
    budget: 1800000, prestige: 80, fanbase: 74,
    roster: [
      ['Rich', 'TOP', 'KR', 28, 80, 80, 'Aggressive', ['aatrox', 'gnar', 'rumble']],
      ['Sponge', 'JGL', 'KR', 21, 80, 87, 'Playmaker', ['vi', 'leesin', 'skarner']],
      ['Ucal', 'MID', 'KR', 25, 83, 85, 'Aggressive', ['taliyah', 'orianna', 'sylas']],
      ['Teddy', 'BOT', 'KR', 28, 84, 84, 'Scaling', ['ezreal', 'varus', 'aphelios']],
      ['Lehends', 'SUP', 'KR', 28, 87, 87, 'Shotcaller', ['nautilus', 'braum', 'alistar']],
    ],
  },

  // ==================== LPL (8 Teams — 2027 Rosters) ====================
  {
    id: 'blg', name: 'Bilibili Gaming', tag: 'BLG', region: 'LPL', color: '#00a1d6', color2: '#fb7299',
    budget: 3850000, prestige: 96, fanbase: 95,
    roster: [
      ['Bin', 'TOP', 'CN', 24, 95, 96, 'Aggressive', ['jax', 'camille', 'rumble', 'renekton']],
      ['Xun', 'JGL', 'CN', 24, 89, 91, 'Aggressive', ['nidalee', 'vi', 'xinzhao']],
      ['knight', 'MID', 'CN', 26, 95, 95, 'Playmaker', ['ahri', 'syndra', 'sylas', 'aurora']],
      ['Viper', 'BOT', 'KR', 26, 94, 94, 'Scaling', ['kaisa', 'ezreal', 'xayah', 'ashe']],
      ['ON', 'SUP', 'CN', 23, 90, 92, 'Playmaker', ['rakan', 'rell', 'nautilus']],
    ],
  },
  {
    id: 'tes', name: 'Top Esports', tag: 'TES', region: 'LPL', color: '#e60012', color2: '#ffffff',
    budget: 3350000, prestige: 91, fanbase: 88,
    roster: [
      ['369', 'TOP', 'CN', 25, 90, 91, 'Weakside', ['ksante', 'ornn', 'renekton']],
      ['Tian', 'JGL', 'CN', 26, 88, 88, 'Playmaker', ['leesin', 'viego', 'jarvan']],
      ['Creme', 'MID', 'CN', 23, 88, 92, 'Aggressive', ['yone', 'akali', 'sylas']],
      ['JackeyLove', 'BOT', 'CN', 26, 91, 91, 'Aggressive', ['kaisa', 'lucian', 'varus', 'ezreal']],
      ['Crisp', 'SUP', 'CN', 28, 87, 87, 'Playmaker', ['thresh', 'nautilus', 'renata']],
    ],
  },
  {
    id: 'jdg', name: 'JD Gaming', tag: 'JDG', region: 'LPL', color: '#c8102e', color2: '#111111',
    budget: 3400000, prestige: 91, fanbase: 86,
    roster: [
      ['Xiaoxu', 'TOP', 'CN', 22, 85, 90, 'Aggressive', ['jax', 'camille', 'ambessa']],
      ['JunJia', 'JGL', 'TW', 24, 87, 90, 'Playmaker', ['vi', 'viego', 'skarner']],
      ['HongQ', 'MID', 'TW', 19, 85, 93, 'Playmaker', ['azir', 'ahri', 'yone']],
      ['Elk', 'BOT', 'CN', 25, 92, 93, 'Aggressive', ['kaisa', 'kalista', 'ezreal', 'ashe']],
      ['Vampire', 'SUP', 'CN', 21, 84, 89, 'Playmaker', ['rakan', 'renata', 'rell']],
    ],
  },
  {
    id: 'wbg', name: 'Weibo Gaming', tag: 'WBG', region: 'LPL', color: '#f97316', color2: '#ffffff',
    budget: 2800000, prestige: 88, fanbase: 85,
    roster: [
      ['Breathe', 'TOP', 'CN', 25, 86, 88, 'Aggressive', ['ksante', 'gnar', 'rumble']],
      ['Jiejie', 'JGL', 'CN', 25, 87, 88, 'Playmaker', ['jarvan', 'viego', 'xinzhao']],
      ['Xiaohu', 'MID', 'CN', 28, 88, 88, 'Shotcaller', ['taliyah', 'orianna', 'corki']],
      ['Light', 'BOT', 'CN', 25, 88, 89, 'Scaling', ['xayah', 'varus', 'ashe']],
      ['MISSING', 'SUP', 'CN', 25, 87, 89, 'Playmaker', ['nautilus', 'thresh', 'rakan']],
    ],
  },
  {
    id: 'ig', name: 'Invictus Gaming', tag: 'IG', region: 'LPL', color: '#e2e8f0', color2: '#111111',
    budget: 3150000, prestige: 90, fanbase: 92,
    roster: [
      ['TheShy', 'TOP', 'KR', 27, 88, 89, 'Aggressive', ['aatrox', 'jayce', 'rumble', 'kennen']],
      ['Wei', 'JGL', 'CN', 24, 88, 90, 'Shotcaller', ['skarner', 'sejuani', 'vi']],
      ['Rookie', 'MID', 'KR', 29, 89, 89, 'Playmaker', ['orianna', 'leblanc', 'syndra', 'ahri']],
      ['GALA', 'BOT', 'CN', 25, 90, 91, 'Scaling', ['kaisa', 'xayah', 'jinx']],
      ['Meiko', 'SUP', 'CN', 28, 89, 89, 'Shotcaller', ['renata', 'nautilus', 'braum']],
    ],
  },
  {
    id: 'al', name: "Anyone's Legend", tag: 'AL', region: 'LPL', color: '#b91c1c', color2: '#fbbf24',
    budget: 2450000, prestige: 86, fanbase: 79,
    roster: [
      ['Flandre', 'TOP', 'CN', 28, 85, 85, 'Weakside', ['gnar', 'ksante', 'ornn']],
      ['Tarzan', 'JGL', 'KR', 27, 91, 91, 'Shotcaller', ['skarner', 'sejuani', 'viego']],
      ['Shanks', 'MID', 'CN', 25, 87, 89, 'Playmaker', ['azir', 'taliyah', 'ahri']],
      ['Hope', 'BOT', 'CN', 26, 85, 86, 'Scaling', ['jinx', 'varus', 'ashe']],
      ['Kael', 'SUP', 'KR', 22, 86, 90, 'Playmaker', ['rell', 'alistar', 'rakan']],
    ],
  },
  {
    id: 'lng', name: 'LNG Esports', tag: 'LNG', region: 'LPL', color: '#0ea5e9', color2: '#ffffff',
    budget: 2150000, prestige: 83, fanbase: 76,
    roster: [
      ['Zika', 'TOP', 'CN', 23, 86, 91, 'Aggressive', ['jax', 'ambessa', 'renekton']],
      ['Weiwei', 'JGL', 'CN', 26, 84, 85, 'Weakside', ['maokai', 'sejuani', 'vi']],
      ['Scout', 'MID', 'KR', 28, 89, 89, 'Playmaker', ['azir', 'orianna', 'yone']],
      ['Photic', 'BOT', 'CN', 24, 83, 86, 'Aggressive', ['lucian', 'ezreal', 'kaisa']],
      ['Zhuo', 'SUP', 'CN', 25, 82, 84, 'Weakside', ['nautilus', 'leona', 'braum']],
    ],
  },
  {
    id: 'nip', name: 'Ninjas in Pyjamas', tag: 'NIP', region: 'LPL', color: '#eab308', color2: '#111111',
    budget: 2050000, prestige: 80, fanbase: 74,
    roster: [
      ['Shanji', 'TOP', 'CN', 25, 84, 86, 'Aggressive', ['rumble', 'ksante', 'aatrox']],
      ['Aki', 'JGL', 'CN', 26, 82, 84, 'Playmaker', ['vi', 'leesin', 'jarvan']],
      ['Doinb', 'MID', 'KR', 29, 85, 85, 'Shotcaller', ['taliyah', 'sylas', 'orianna']],
      ['Leave', 'BOT', 'CN', 22, 84, 88, 'Aggressive', ['kaisa', 'lucian', 'zeri']],
      ['ppgod', 'SUP', 'CN', 26, 82, 83, 'Playmaker', ['rell', 'rakan', 'nautilus']],
    ],
  },

  // ==================== LEC (8 Teams — 2027 Rosters) ====================
  {
    id: 'g2', name: 'G2 Esports', tag: 'G2', region: 'LEC', color: '#ef4444', color2: '#111111',
    budget: 2950000, prestige: 90, fanbase: 95,
    roster: [
      ['BrokenBlade', 'TOP', 'DE', 26, 87, 88, 'Aggressive', ['ksante', 'jax', 'aatrox']],
      ['SkewMond', 'JGL', 'FR', 21, 84, 91, 'Playmaker', ['viego', 'vi', 'skarner']],
      ['Caps', 'MID', 'DK', 27, 91, 92, 'Playmaker', ['sylas', 'orianna', 'leblanc', 'ahri']],
      ['Hans Sama', 'BOT', 'FR', 27, 86, 87, 'Aggressive', ['kalista', 'varus', 'lucian']],
      ['Labrov', 'SUP', 'GR', 24, 85, 88, 'Playmaker', ['rell', 'nautilus', 'rakan']],
    ],
  },
  {
    id: 'fnc', name: 'Fnatic', tag: 'FNC', region: 'LEC', color: '#ff5900', color2: '#111111',
    budget: 2550000, prestige: 87, fanbase: 91,
    roster: [
      ['Soboro', 'TOP', 'KR', 21, 82, 89, 'Aggressive', ['rumble', 'ksante', 'renekton']],
      ['Yike', 'JGL', 'SE', 26, 86, 88, 'Aggressive', ['viego', 'maokai', 'vi']],
      ['Vladi', 'MID', 'GR', 21, 85, 91, 'Playmaker', ['ahri', 'yone', 'syndra']],
      ['Upset', 'BOT', 'DE', 26, 86, 87, 'Scaling', ['ezreal', 'kaisa', 'xayah']],
      ['Lospa', 'SUP', 'KR', 22, 83, 88, 'Playmaker', ['rakan', 'nautilus', 'rell']],
    ],
  },
  {
    id: 'kc', name: 'Karmine Corp', tag: 'KC', region: 'LEC', color: '#0284c7', color2: '#ffffff',
    budget: 2500000, prestige: 85, fanbase: 94,
    roster: [
      ['Canna', 'TOP', 'KR', 26, 85, 86, 'Weakside', ['gnar', 'jayce', 'ksante']],
      ['Razork', 'JGL', 'ES', 26, 86, 87, 'Aggressive', ['vi', 'poppy', 'sejuani']],
      ['kyeahoo', 'MID', 'KR', 21, 83, 90, 'Playmaker', ['ahri', 'azir', 'sylas']],
      ['Caliste', 'BOT', 'FR', 20, 86, 94, 'Aggressive', ['kaisa', 'ezreal', 'kalista']],
      ['Busio', 'SUP', 'US', 23, 84, 89, 'Playmaker', ['rell', 'rakan', 'bard']],
    ],
  },
  {
    id: 'mkoi', name: 'Movistar KOI', tag: 'MKOI', region: 'LEC', color: '#6366f1', color2: '#ffffff',
    budget: 2300000, prestige: 84, fanbase: 87,
    roster: [
      ['Myrwn', 'TOP', 'ES', 23, 83, 88, 'Aggressive', ['rumble', 'ambessa', 'kennen']],
      ['Elyoya', 'JGL', 'ES', 26, 86, 87, 'Shotcaller', ['vi', 'viego', 'jarvan']],
      ['Jojopyun', 'MID', 'CA', 22, 86, 91, 'Aggressive', ['ahri', 'yone', 'sylas']],
      ['Supa', 'BOT', 'ES', 25, 83, 86, 'Aggressive', ['varus', 'kaisa', 'ezreal']],
      ['Alvaro', 'SUP', 'ES', 23, 83, 88, 'Playmaker', ['rell', 'nautilus', 'alistar']],
    ],
  },
  {
    id: 'bds', name: 'Shifters (ex-BDS)', tag: 'SHF', region: 'LEC', color: '#ec4899', color2: '#ffffff',
    budget: 1950000, prestige: 79, fanbase: 74,
    roster: [
      ['Irrelevant', 'TOP', 'DE', 24, 83, 85, 'Weakside', ['gnar', 'ksante', 'ornn']],
      ['Sheo', 'JGL', 'FR', 24, 81, 85, 'Shotcaller', ['sejuani', 'maokai', 'vi']],
      ['nuc', 'MID', 'FR', 24, 82, 85, 'Scaling', ['azir', 'orianna', 'corki']],
      ['Ice', 'BOT', 'KR', 25, 84, 86, 'Scaling', ['jinx', 'kaisa', 'aphelios']],
      ['Parus', 'SUP', 'TR', 22, 82, 88, 'Playmaker', ['rakan', 'rell', 'nautilus']],
    ],
  },
  {
    id: 'vit', name: 'Team Vitality', tag: 'VIT', region: 'LEC', color: '#facc15', color2: '#111111',
    budget: 2150000, prestige: 79, fanbase: 78,
    roster: [
      ['Naak Nako', 'TOP', 'FR', 20, 81, 89, 'Aggressive', ['jax', 'ambessa', 'aatrox']],
      ['Lyncas', 'JGL', 'LT', 22, 81, 88, 'Playmaker', ['viego', 'vi', 'nidalee']],
      ['FIESTA', 'MID', 'KR', 23, 82, 87, 'Playmaker', ['syndra', 'ahri', 'orianna']],
      ['Carzzy', 'BOT', 'CZ', 24, 84, 86, 'Aggressive', ['ezreal', 'kalista', 'xayah']],
      ['Fleshy', 'SUP', 'TR', 23, 81, 86, 'Playmaker', ['rakan', 'nautilus', 'thresh']],
    ],
  },
  {
    id: 'gx', name: 'GIANTX', tag: 'GX', region: 'LEC', color: '#38bdf8', color2: '#111111',
    budget: 1900000, prestige: 78, fanbase: 74,
    roster: [
      ['Oscarinin', 'TOP', 'ES', 23, 83, 88, 'Aggressive', ['rumble', 'ksante', 'renekton']],
      ['ISMA', 'JGL', 'BE', 23, 81, 86, 'Playmaker', ['leesin', 'viego', 'vi']],
      ['Jackies', 'MID', 'CZ', 21, 83, 89, 'Aggressive', ['yone', 'sylas', 'aurora']],
      ['Flakked', 'BOT', 'ES', 25, 82, 84, 'Scaling', ['xayah', 'kaisa', 'ashe']],
      ['Jun', 'SUP', 'KR', 25, 84, 87, 'Playmaker', ['rell', 'nautilus', 'renata']],
    ],
  },
  {
    id: 'th', name: 'Team Heretics', tag: 'TH', region: 'LEC', color: '#f43f5e', color2: '#ffffff',
    budget: 1800000, prestige: 77, fanbase: 78,
    roster: [
      ['Tracyn', 'TOP', 'PL', 20, 79, 87, 'Weakside', ['ksante', 'ornn', 'gnar']],
      ['Daglas', 'JGL', 'PL', 21, 80, 87, 'Playmaker', ['sejuani', 'maokai', 'vi']],
      ['Serin', 'MID', 'TR', 24, 81, 85, 'Playmaker', ['ahri', 'orianna', 'taliyah']],
      ['Hype', 'BOT', 'KR', 22, 82, 88, 'Aggressive', ['kaisa', 'varus', 'ezreal']],
      ['Way', 'SUP', 'KR', 21, 81, 88, 'Playmaker', ['rakan', 'leona', 'braum']],
    ],
  },

  // ==================== LCS / LTA NORTH (8 Teams — 2027 Rosters) ====================
  {
    id: 'fly', name: 'FlyQuest', tag: 'FLY', region: 'LCS', color: '#16a34a', color2: '#ffffff',
    budget: 2700000, prestige: 86, fanbase: 84,
    roster: [
      ['Gakgos', 'TOP', 'TR', 21, 81, 88, 'Aggressive', ['renekton', 'rumble', 'gnar']],
      ['Gryffinn', 'JGL', 'US', 20, 82, 90, 'Playmaker', ['viego', 'skarner', 'vi']],
      ['Quad', 'MID', 'KR', 24, 85, 88, 'Scaling', ['orianna', 'azir', 'syndra']],
      ['Massu', 'BOT', 'CA', 21, 86, 92, 'Scaling', ['kaisa', 'varus', 'kalista']],
      ['Cryogen', 'SUP', 'US', 21, 80, 87, 'Playmaker', ['rell', 'rakan', 'bard']],
    ],
  },
  {
    id: 'tl', name: 'Team Liquid', tag: 'TL', region: 'LCS', color: '#1d4ed8', color2: '#ffffff',
    budget: 2950000, prestige: 87, fanbase: 86,
    roster: [
      ['Morgan', 'TOP', 'KR', 25, 84, 86, 'Weakside', ['ksante', 'ornn', 'renekton']],
      ['Josedeodo', 'JGL', 'AR', 26, 83, 84, 'Playmaker', ['sejuani', 'viego', 'vi']],
      ['Quid', 'MID', 'KR', 22, 86, 90, 'Playmaker', ['ahri', 'sylas', 'azir']],
      ['Yeon', 'BOT', 'US', 25, 87, 89, 'Aggressive', ['varus', 'kalista', 'lucian']],
      ['CoreJJ', 'SUP', 'KR', 32, 85, 85, 'Shotcaller', ['rakan', 'nautilus', 'braum']],
    ],
  },
  {
    id: 'c9', name: 'Cloud9', tag: 'C9', region: 'LCS', color: '#0ea5e9', color2: '#ffffff',
    budget: 2650000, prestige: 85, fanbase: 88,
    roster: [
      ['Thanatos', 'TOP', 'KR', 22, 85, 91, 'Aggressive', ['jax', 'ambessa', 'ksante']],
      ['Blaber', 'JGL', 'US', 26, 85, 86, 'Aggressive', ['nocturne', 'viego', 'vi']],
      ['Loki', 'MID', 'KR', 21, 83, 90, 'Playmaker', ['yone', 'ahri', 'azir']],
      ['Tactical', 'BOT', 'US', 26, 82, 83, 'Scaling', ['ezreal', 'jinx', 'ashe']],
      ['Vulcan', 'SUP', 'CA', 27, 83, 83, 'Playmaker', ['nautilus', 'alistar', 'rell']],
    ],
  },
  {
    id: '100t', name: 'Sentinels (ex-100T)', tag: 'SEN', region: 'LCS', color: '#dc2626', color2: '#111111',
    budget: 2400000, prestige: 82, fanbase: 86,
    roster: [
      ['Impact', 'TOP', 'KR', 31, 84, 84, 'Weakside', ['ksante', 'ornn', 'renekton']],
      ['River', 'JGL', 'KR', 27, 84, 84, 'Playmaker', ['vi', 'leesin', 'jarvan']],
      ['APA', 'MID', 'US', 24, 83, 86, 'Aggressive', ['taliyah', 'corki', 'aurora']],
      ['FBI', 'BOT', 'AU', 27, 82, 83, 'Scaling', ['varus', 'xayah', 'ashe']],
      ['huhi', 'SUP', 'KR', 31, 81, 81, 'Shotcaller', ['nautilus', 'renata', 'braum']],
    ],
  },
  {
    id: 'sr', name: 'Shopify Rebellion', tag: 'SR', region: 'LCS', color: '#14b8a6', color2: '#111111',
    budget: 2100000, prestige: 78, fanbase: 72,
    roster: [
      ['Fudge', 'TOP', 'AU', 24, 82, 84, 'Weakside', ['ksante', 'gnar', 'jayce']],
      ['Contractz', 'JGL', 'US', 27, 82, 82, 'Aggressive', ['vi', 'viego', 'xinzhao']],
      ['Zinie', 'MID', 'KR', 21, 83, 90, 'Playmaker', ['azir', 'sylas', 'ahri']],
      ['Bvoy', 'BOT', 'KR', 27, 81, 82, 'Scaling', ['kaisa', 'jinx', 'ezreal']],
      ['Zeyzal', 'SUP', 'US', 27, 80, 81, 'Shotcaller', ['nautilus', 'rakan', 'leona']],
    ],
  },
  {
    id: 'dig', name: 'Dignitas', tag: 'DIG', region: 'LCS', color: '#eab308', color2: '#111111',
    budget: 1800000, prestige: 75, fanbase: 72,
    roster: [
      ['Srtty', 'TOP', 'US', 22, 79, 85, 'Aggressive', ['rumble', 'renekton', 'ambessa']],
      ['Spica', 'JGL', 'CN', 25, 81, 83, 'Playmaker', ['viego', 'leesin', 'vi']],
      ['Keine', 'MID', 'KR', 24, 80, 85, 'Scaling', ['azir', 'syndra', 'orianna']],
      ['Tomo', 'BOT', 'US', 25, 80, 83, 'Scaling', ['jinx', 'kaisa', 'varus']],
      ['Eyla', 'SUP', 'AU', 26, 80, 82, 'Weakside', ['rell', 'braum', 'renata']],
    ],
  },
  {
    id: 'lyon', name: 'LYON Gaming', tag: 'LYON', region: 'LCS', color: '#f59e0b', color2: '#111111',
    budget: 2250000, prestige: 80, fanbase: 77,
    roster: [
      ['Dhokla', 'TOP', 'US', 27, 81, 82, 'Aggressive', ['ksante', 'ornn', 'gnar']],
      ['Inspired', 'JGL', 'PL', 24, 89, 90, 'Shotcaller', ['viego', 'skarner', 'sejuani']],
      ['Saint', 'MID', 'KR', 21, 82, 89, 'Playmaker', ['sylas', 'ahri', 'yone']],
      ['Berserker', 'BOT', 'KR', 23, 86, 90, 'Scaling', ['kaisa', 'zeri', 'jinx']],
      ['Isles', 'SUP', 'AU', 25, 80, 82, 'Weakside', ['rell', 'braum', 'lulu']],
    ],
  },
  {
    id: 'disg', name: 'Disguised', tag: 'DSG', region: 'LCS', color: '#64748b', color2: '#ffffff',
    budget: 1700000, prestige: 74, fanbase: 79,
    roster: [
      ['Castle', 'TOP', 'KR', 23, 79, 85, 'Weakside', ['ksante', 'renekton', 'aatrox']],
      ['eXyu', 'JGL', 'US', 23, 79, 84, 'Aggressive', ['viego', 'vi', 'jarvan']],
      ['Palafox', 'MID', 'US', 26, 81, 82, 'Playmaker', ['orianna', 'taliyah', 'ahri']],
      ['ScaryJerry', 'BOT', 'US', 21, 78, 86, 'Aggressive', ['kaisa', 'lucian', 'ezreal']],
      ['Lyonz', 'SUP', 'AR', 23, 79, 84, 'Playmaker', ['rakan', 'nautilus', 'alistar']],
    ],
  },

  // ==================== TCL — TÜRKİYE (8 Teams — 2027 Rosters) ====================
  {
    id: 'sup', name: 'Papara SuperMassive', tag: 'SUP', region: 'TCL', color: '#e11d48', color2: '#ffffff',
    budget: 1850000, prestige: 80, fanbase: 88,
    roster: [
      ['Armut', 'TOP', 'TR', 27, 81, 82, 'Aggressive', ['gnar', 'rumble', 'ksante']],
      ['Closer', 'JGL', 'TR', 27, 82, 83, 'Playmaker', ['leesin', 'viego', 'vi']],
      ['Blue', 'MID', 'TR', 25, 80, 83, 'Playmaker', ['ahri', 'syndra', 'leblanc']],
      ['Luger', 'BOT', 'TR', 25, 81, 84, 'Scaling', ['kaisa', 'jinx', 'varus']],
      ['Carry', 'SUP', 'TR', 23, 78, 84, 'Playmaker', ['rakan', 'rell', 'nautilus']],
    ],
  },
  {
    id: 'bjk', name: 'Beşiktaş Esports', tag: 'BJK', region: 'TCL', color: '#f8fafc', color2: '#111111',
    budget: 1750000, prestige: 79, fanbase: 90,
    roster: [
      ['StarScreen', 'TOP', 'TR', 25, 79, 83, 'Aggressive', ['aatrox', 'jax', 'renekton']],
      ['Elramir', 'JGL', 'TR', 23, 79, 85, 'Playmaker', ['viego', 'leesin', 'vi']],
      ['Kofte', 'MID', 'TR', 24, 80, 84, 'Scaling', ['azir', 'orianna', 'taliyah']],
      ['Kaori', 'BOT', 'TR', 24, 81, 85, 'Aggressive', ['kaisa', 'ezreal', 'lucian']],
      ['Farfetch', 'SUP', 'TR', 26, 79, 81, 'Shotcaller', ['nautilus', 'alistar', 'braum']],
    ],
  },
  {
    id: 'dp', name: 'BBL Dark Passage', tag: 'DP', region: 'TCL', color: '#0ea5e9', color2: '#111111',
    budget: 1650000, prestige: 78, fanbase: 84,
    roster: [
      ['fabFabulous', 'TOP', 'TR', 28, 78, 78, 'Weakside', ['ksante', 'ornn', 'gnar']],
      ['Kireas', 'JGL', 'TR', 23, 79, 85, 'Aggressive', ['leesin', 'viego', 'xinzhao']],
      ['KSAEZ', 'MID', 'TR', 22, 78, 85, 'Playmaker', ['sylas', 'ahri', 'yone']],
      ['Neramin', 'BOT', 'TR', 23, 79, 84, 'Scaling', ['jinx', 'xayah', 'varus']],
      ['Beplush', 'SUP', 'TR', 22, 77, 83, 'Weakside', ['rell', 'leona', 'renata']],
    ],
  },
  {
    id: 'fut', name: 'FUT Esports', tag: 'FUT', region: 'TCL', color: '#111827', color2: '#facc15',
    budget: 1650000, prestige: 77, fanbase: 82,
    roster: [
      ['NuQ', 'TOP', 'TR', 24, 78, 82, 'Weakside', ['ksante', 'renekton', 'ornn']],
      ['Ferret', 'JGL', 'TR', 23, 78, 84, 'Aggressive', ['vi', 'viego', 'xinzhao']],
      ['Bolulu', 'MID', 'TR', 26, 79, 81, 'Playmaker', ['orianna', 'syndra', 'azir']],
      ['BAO', 'BOT', 'KR', 24, 80, 84, 'Aggressive', ['kaisa', 'kalista', 'ezreal']],
      ['Zergsting', 'SUP', 'TR', 26, 78, 80, 'Playmaker', ['thresh', 'rakan', 'nautilus']],
    ],
  },
  {
    id: 'bgt', name: 'Boostgate Esports', tag: 'BGT', region: 'TCL', color: '#f97316', color2: '#ffffff',
    budget: 1500000, prestige: 75, fanbase: 75,
    roster: [
      ['Madly', 'TOP', 'TR', 22, 77, 84, 'Aggressive', ['ambessa', 'jax', 'rumble']],
      ['Typhoon', 'JGL', 'TR', 23, 78, 83, 'Playmaker', ['vi', 'sejuani', 'jarvan']],
      ['Kachanava', 'MID', 'TR', 21, 77, 84, 'Scaling', ['azir', 'yone', 'aurora']],
      ['Focus', 'BOT', 'TR', 22, 78, 84, 'Scaling', ['aphelios', 'jinx', 'kaisa']],
      ['Berebo', 'SUP', 'TR', 22, 76, 82, 'Playmaker', ['rell', 'rakan', 'alistar']],
    ],
  },
  {
    id: 'ef', name: 'Eternal Fire', tag: 'EF', region: 'TCL', color: '#facc15', color2: '#111111',
    budget: 1550000, prestige: 76, fanbase: 85,
    roster: [
      ['Boda', 'TOP', 'TR', 22, 77, 83, 'Aggressive', ['aatrox', 'ksante', 'gnar']],
      ['Mojito', 'JGL', 'TR', 26, 78, 80, 'Shotcaller', ['maokai', 'sejuani', 'vi']],
      ['Umut', 'MID', 'TR', 22, 78, 85, 'Playmaker', ['ahri', 'taliyah', 'leblanc']],
      ['HolyPhoenix', 'BOT', 'TR', 29, 80, 80, 'Scaling', ['varus', 'ashe', 'ezreal']],
      ['Absolute', 'SUP', 'TR', 24, 76, 81, 'Weakside', ['braum', 'nautilus', 'leona']],
    ],
  },
  {
    id: 'gal', name: 'Galakticos', tag: 'GAL', region: 'TCL', color: '#3b82f6', color2: '#ffffff',
    budget: 1350000, prestige: 73, fanbase: 70,
    roster: [
      ['Skewer', 'TOP', 'TR', 21, 76, 83, 'Aggressive', ['renekton', 'rumble', 'jax']],
      ['Robin', 'JGL', 'TR', 22, 76, 82, 'Playmaker', ['jarvan', 'vi', 'sejuani']],
      ['Stillnumb', 'MID', 'TR', 23, 76, 82, 'Scaling', ['orianna', 'syndra', 'corki']],
      ['Coldraa', 'BOT', 'TR', 21, 76, 83, 'Aggressive', ['kaisa', 'lucian', 'ezreal']],
      ['Pbd', 'SUP', 'TR', 25, 77, 80, 'Playmaker', ['rakan', 'thresh', 'nautilus']],
    ],
  },
  {
    id: 'misa', name: 'Misa Esports', tag: 'MISA', region: 'TCL', color: '#ec4899', color2: '#ffffff',
    budget: 1750000, prestige: 79, fanbase: 80,
    roster: [
      ['Ragner', 'TOP', 'TR', 24, 81, 85, 'Aggressive', ['ksante', 'ambessa', 'aatrox']],
      ['113', 'JGL', 'TR', 22, 81, 87, 'Aggressive', ['leesin', 'viego', 'vi']],
      ['Callme', 'MID', 'KR', 23, 80, 85, 'Playmaker', ['sylas', 'ahri', 'azir']],
      ['Ruep', 'BOT', 'TR', 22, 78, 84, 'Scaling', ['xayah', 'jinx', 'varus']],
      ['Stend', 'SUP', 'FR', 23, 80, 86, 'Shotcaller', ['rell', 'nautilus', 'renata']],
    ],
  },

  // ==================== CBLOL — BREZİLYA (8 Teams — 2027 Rosters) ====================
  {
    id: 'lll', name: 'LOUD', tag: 'LLL', region: 'CBLOL', color: '#22c55e', color2: '#111111',
    budget: 2150000, prestige: 82, fanbase: 94,
    roster: [
      ['Xyno', 'TOP', 'BR', 22, 80, 86, 'Aggressive', ['renekton', 'aatrox', 'rumble']],
      ['Sinatra', 'JGL', 'BR', 22, 80, 85, 'Playmaker', ['vi', 'viego', 'sejuani']],
      ['Kaze', 'MID', 'BR', 23, 81, 85, 'Shotcaller', ['azir', 'orianna', 'ahri']],
      ['Rabelo', 'BOT', 'BR', 22, 81, 86, 'Scaling', ['kaisa', 'ezreal', 'varus']],
      ['uZent', 'SUP', 'BR', 23, 79, 84, 'Weakside', ['nautilus', 'rell', 'braum']],
    ],
  },
  {
    id: 'png', name: 'paiN Gaming', tag: 'PNG', region: 'CBLOL', color: '#dc2626', color2: '#111111',
    budget: 2150000, prestige: 83, fanbase: 93,
    roster: [
      ['Boal', 'TOP', 'BR', 23, 81, 85, 'Weakside', ['ksante', 'gnar', 'ornn']],
      ['Cariok', 'JGL', 'BR', 26, 82, 83, 'Playmaker', ['leesin', 'vi', 'skarner']],
      ['Namiru', 'MID', 'BR', 22, 80, 86, 'Playmaker', ['taliyah', 'orianna', 'sylas']],
      ['Hena', 'BOT', 'KR', 26, 82, 83, 'Scaling', ['kaisa', 'lucian', 'kalista']],
      ['Ceos', 'SUP', 'BR', 27, 81, 82, 'Shotcaller', ['rakan', 'rell', 'alistar']],
    ],
  },
  {
    id: 'red', name: 'RED Canids', tag: 'RED', region: 'CBLOL', color: '#b91c1c', color2: '#ffffff',
    budget: 1800000, prestige: 79, fanbase: 82,
    roster: [
      ['zynts', 'TOP', 'BR', 22, 79, 85, 'Aggressive', ['jax', 'aatrox', 'rumble']],
      ['STEPZ', 'JGL', 'BR', 22, 80, 85, 'Aggressive', ['viego', 'leesin', 'vi']],
      ['Fuuu', 'MID', 'BR', 22, 79, 85, 'Playmaker', ['ahri', 'sylas', 'yone']],
      ['Morttheus', 'BOT', 'BR', 21, 80, 86, 'Aggressive', ['kaisa', 'ezreal', 'jinx']],
      ['Manel', 'SUP', 'BR', 22, 78, 83, 'Playmaker', ['nautilus', 'thresh', 'rakan']],
    ],
  },
  {
    id: 'vks', name: 'Vivo Keyd Stars', tag: 'VKS', region: 'CBLOL', color: '#7c3aed', color2: '#ffffff',
    budget: 1900000, prestige: 80, fanbase: 82,
    roster: [
      ['Wizer', 'TOP', 'KR', 27, 81, 82, 'Weakside', ['ksante', 'ambessa', 'gnar']],
      ['Disamis', 'JGL', 'BR', 22, 81, 86, 'Playmaker', ['vi', 'viego', 'skarner']],
      ['Mireu', 'MID', 'KR', 23, 82, 86, 'Scaling', ['orianna', 'azir', 'syndra']],
      ['Smiley', 'BOT', 'SE', 24, 80, 83, 'Scaling', ['varus', 'xayah', 'ashe']],
      ['ProDelta', 'SUP', 'BR', 23, 79, 83, 'Shotcaller', ['rell', 'leona', 'braum']],
    ],
  },
  {
    id: 'fur', name: 'FURIA', tag: 'FUR', region: 'CBLOL', color: '#334155', color2: '#ffffff',
    budget: 1850000, prestige: 80, fanbase: 85,
    roster: [
      ['Guigo', 'TOP', 'BR', 24, 81, 84, 'Aggressive', ['ornn', 'ksante', 'renekton']],
      ['Tatu', 'JGL', 'BR', 20, 81, 88, 'Aggressive', ['leesin', 'viego', 'nidalee']],
      ['Tutsz', 'MID', 'BR', 24, 80, 83, 'Playmaker', ['ahri', 'taliyah', 'aurora']],
      ['Ayu', 'BOT', 'BR', 20, 81, 89, 'Scaling', ['kaisa', 'zeri', 'jinx']],
      ['JoJo', 'SUP', 'BR', 25, 79, 81, 'Playmaker', ['rakan', 'nautilus', 'renata']],
    ],
  },
  {
    id: 'kbm', name: 'KaBuM! Esports', tag: 'KBM', region: 'CBLOL', color: '#f97316', color2: '#111111',
    budget: 1650000, prestige: 76, fanbase: 79,
    roster: [
      ['Lonely', 'TOP', 'KR', 25, 79, 82, 'Aggressive', ['rumble', 'aatrox', 'jayce']],
      ['Malrang', 'JGL', 'KR', 27, 81, 81, 'Aggressive', ['jarvan', 'vi', 'leesin']],
      ['Hauz', 'MID', 'BR', 24, 78, 82, 'Scaling', ['azir', 'syndra', 'orianna']],
      ['TitaN', 'BOT', 'BR', 26, 83, 85, 'Aggressive', ['ezreal', 'varus', 'lucian']],
      ['Kuri', 'SUP', 'KR', 25, 81, 83, 'Shotcaller', ['nautilus', 'alistar', 'rell']],
    ],
  },
  {
    id: 'fx', name: 'Fluxo', tag: 'FX', region: 'CBLOL', color: '#a855f7', color2: '#ffffff',
    budget: 1550000, prestige: 75, fanbase: 80,
    roster: [
      ['fNb', 'TOP', 'BR', 26, 79, 81, 'Weakside', ['ksante', 'gnar', 'ornn']],
      ['Shini', 'JGL', 'BR', 27, 78, 78, 'Shotcaller', ['sejuani', 'maokai', 'vi']],
      ['Grevthar', 'MID', 'BR', 25, 78, 81, 'Playmaker', ['yone', 'sylas', 'ahri']],
      ['Brance', 'BOT', 'BR', 22, 81, 86, 'Aggressive', ['jinx', 'aphelios', 'xayah']],
      ['Frosty', 'SUP', 'BR', 23, 78, 83, 'Playmaker', ['rakan', 'leona', 'braum']],
    ],
  },
  {
    id: 'los', name: 'LOS', tag: 'LOS', region: 'CBLOL', color: '#f59e0b', color2: '#111111',
    budget: 1500000, prestige: 74, fanbase: 78,
    roster: [
      ['SuperCleber', 'TOP', 'BR', 22, 77, 83, 'Aggressive', ['renekton', 'ambessa', 'jax']],
      ['Aegis', 'JGL', 'BR', 25, 80, 82, 'Playmaker', ['viego', 'vi', 'xinzhao']],
      ['Envy', 'MID', 'BR', 26, 78, 80, 'Scaling', ['orianna', 'azir', 'taliyah']],
      ['Netuno', 'BOT', 'BR', 24, 79, 83, 'Aggressive', ['kaisa', 'varus', 'ashe']],
      ['RedBert', 'SUP', 'BR', 27, 79, 80, 'Playmaker', ['rell', 'nautilus', 'thresh']],
    ],
  },

  // ==================== LCO — OKYANUSYA (8 Teams) ====================
  {
    id: 'chf', name: 'Chiefs Esports Club', tag: 'CHF', region: 'LCO', color: '#06b6d4', color2: '#111111',
    budget: 1550000, prestige: 76, fanbase: 78,
    roster: [
      ['BioPanther', 'TOP', 'AU', 24, 78, 81, 'Weakside', ['ksante', 'ornn', 'gnar']],
      ['Mir', 'JGL', 'KR', 23, 79, 83, 'Playmaker', ['vi', 'viego', 'leesin']],
      ['JimieN', 'MID', 'TW', 23, 79, 83, 'Playmaker', ['ahri', 'azir', 'sylas']],
      ['Raes', 'BOT', 'NZ', 27, 79, 80, 'Scaling', ['jinx', 'xayah', 'varus']],
      ['Aladoric', 'SUP', 'AU', 25, 78, 80, 'Shotcaller', ['nautilus', 'rell', 'braum']],
    ],
  },
  {
    id: 'dw', name: 'Dire Wolves', tag: 'DW', region: 'LCO', color: '#e2e8f0', color2: '#111111',
    budget: 1450000, prestige: 75, fanbase: 76,
    roster: [
      ['Zorenous', 'TOP', 'AU', 23, 76, 81, 'Aggressive', ['aatrox', 'renekton', 'rumble']],
      ['Poltron', 'JGL', 'AU', 22, 76, 82, 'Aggressive', ['viego', 'jarvan', 'vi']],
      ['ry0ma', 'MID', 'AU', 26, 79, 80, 'Scaling', ['orianna', 'azir', 'syndra']],
      ['Violet', 'BOT', 'AU', 23, 78, 82, 'Scaling', ['kaisa', 'ezreal', 'aphelios']],
      ['Dragku', 'SUP', 'AU', 24, 77, 80, 'Playmaker', ['rakan', 'alistar', 'thresh']],
    ],
  },
  {
    id: 'gzg', name: 'Ground Zero Gaming', tag: 'GZG', region: 'LCO', color: '#22c55e', color2: '#111111',
    budget: 1400000, prestige: 74, fanbase: 72,
    roster: [
      ['Thien', 'TOP', 'AU', 23, 77, 82, 'Aggressive', ['jax', 'ambessa', 'ksante']],
      ['Swathe', 'JGL', 'AU', 22, 76, 82, 'Playmaker', ['skarner', 'sejuani', 'vi']],
      ['Shok', 'MID', 'NZ', 24, 78, 81, 'Playmaker', ['taliyah', 'ahri', 'aurora']],
      ['k1ng', 'BOT', 'AU', 26, 79, 80, 'Aggressive', ['varus', 'kalista', 'kaisa']],
      ['Decoy', 'SUP', 'NZ', 25, 77, 79, 'Shotcaller', ['rell', 'nautilus', 'renata']],
    ],
  },
  {
    id: 'blis', name: 'Team Bliss', tag: 'BLIS', region: 'LCO', color: '#ec4899', color2: '#ffffff',
    budget: 1350000, prestige: 73, fanbase: 73,
    roster: [
      ['Lived', 'TOP', 'AU', 22, 76, 82, 'Weakside', ['gnar', 'ksante', 'ornn']],
      ['Babip', 'JGL', 'AU', 26, 78, 79, 'Shotcaller', ['vi', 'maokai', 'sejuani']],
      ['Haeri', 'MID', 'AU', 24, 79, 82, 'Scaling', ['azir', 'orianna', 'corki']],
      ['Leemas', 'BOT', 'AU', 21, 76, 83, 'Scaling', ['jinx', 'kaisa', 'ashe']],
      ['whynot', 'SUP', 'AU', 23, 75, 80, 'Playmaker', ['rakan', 'leona', 'braum']],
    ],
  },
  {
    id: 'fury', name: 'FURY Global', tag: 'FURY', region: 'LCO', color: '#ef4444', color2: '#ffffff',
    budget: 1300000, prestige: 71, fanbase: 68,
    roster: [
      ['Api', 'TOP', 'AU', 21, 74, 81, 'Aggressive', ['renekton', 'rumble', 'aatrox']],
      ['Kevy', 'JGL', 'AU', 22, 76, 82, 'Aggressive', ['leesin', 'viego', 'xinzhao']],
      ['Kisee', 'MID', 'AU', 22, 77, 83, 'Playmaker', ['sylas', 'yone', 'ahri']],
      ['gunkrab', 'BOT', 'AU', 22, 75, 81, 'Aggressive', ['ezreal', 'lucian', 'varus']],
      ['Shinki', 'SUP', 'AU', 22, 74, 80, 'Playmaker', ['nautilus', 'thresh', 'rell']],
    ],
  },
  {
    id: 'kng', name: 'Kanga Esports', tag: 'KNG', region: 'LCO', color: '#f59e0b', color2: '#111111',
    budget: 1250000, prestige: 70, fanbase: 69,
    roster: [
      ['Chippys', 'TOP', 'NZ', 26, 75, 77, 'Aggressive', ['rumble', 'jayce', 'gnar']],
      ['Pabu', 'JGL', 'AU', 26, 76, 78, 'Playmaker', ['vi', 'jarvan', 'nocturne']],
      ['Claire', 'MID', 'AU', 25, 76, 78, 'Scaling', ['orianna', 'syndra', 'azir']],
      ['Praedyth', 'BOT', 'AU', 23, 75, 80, 'Scaling', ['xayah', 'jinx', 'kaisa']],
      ['Crayzee', 'SUP', 'AU', 21, 74, 81, 'Weakside', ['braum', 'lulu', 'renata']],
    ],
  },
  {
    id: 'ant', name: 'Antic Esports', tag: 'ANT', region: 'LCO', color: '#8b5cf6', color2: '#ffffff',
    budget: 1200000, prestige: 69, fanbase: 66,
    roster: [
      ['Winterer', 'TOP', 'AU', 20, 74, 82, 'Weakside', ['ksante', 'ornn', 'renekton']],
      ['Oneway', 'JGL', 'AU', 21, 74, 81, 'Playmaker', ['viego', 'vi', 'sejuani']],
      ['Chungy', 'MID', 'AU', 20, 75, 83, 'Aggressive', ['ahri', 'leblanc', 'akali']],
      ['Bambi', 'BOT', 'AU', 21, 74, 81, 'Scaling', ['varus', 'ashe', 'ezreal']],
      ['Corporal', 'SUP', 'AU', 23, 75, 79, 'Shotcaller', ['nautilus', 'alistar', 'leona']],
    ],
  },
  {
    id: 'mmm', name: 'Mammoth', tag: 'MMM', region: 'LCO', color: '#eab308', color2: '#111111',
    budget: 1200000, prestige: 70, fanbase: 70,
    roster: [
      ['Topoon', 'TOP', 'KR', 24, 77, 80, 'Aggressive', ['aatrox', 'jax', 'gnar']],
      ['LeeSA', 'JGL', 'AU', 24, 75, 78, 'Playmaker', ['leesin', 'vi', 'maokai']],
      ['roky', 'MID', 'AU', 22, 74, 80, 'Scaling', ['azir', 'taliyah', 'orianna']],
      ['kpop', 'BOT', 'AU', 22, 74, 80, 'Aggressive', ['kaisa', 'lucian', 'kalista']],
      ['Beats', 'SUP', 'AU', 22, 74, 80, 'Playmaker', ['rakan', 'rell', 'bard']],
    ],
  },
];

// Free Agents (balanced: rusty veterans, rotational pros & raw prospects — no overpowered day-1 freebies!)
const RAW_FREE_AGENTS = [
  ['Nuguri', 'TOP', 'KR', 27, 81, 81, 'Aggressive', ['kennen', 'camille', 'jayce']],
  ['Wunder', 'TOP', 'DK', 28, 78, 78, 'Weakside', ['ornn', 'gnar', 'ksante']],
  ['Adam', 'TOP', 'FR', 24, 77, 80, 'Aggressive', ['renekton', 'aatrox', 'ambessa']],
  ['Photon', 'TOP', 'KR', 24, 79, 82, 'Aggressive', ['jayce', 'jax', 'rumble']],
  ['Jankos', 'JGL', 'PL', 31, 79, 79, 'Shotcaller', ['sejuani', 'leesin', 'jarvan']],
  ['Clid', 'JGL', 'KR', 27, 79, 79, 'Aggressive', ['leesin', 'vi', 'xinzhao']],
  ['Karsa', 'JGL', 'TW', 29, 78, 78, 'Playmaker', ['leesin', 'viego', 'jarvan']],
  ['Bo', 'JGL', 'CN', 23, 80, 85, 'Aggressive', ['nidalee', 'viego', 'leesin']],
  ['Selfmade', 'JGL', 'PL', 26, 77, 79, 'Aggressive', ['viego', 'nidalee', 'nocturne']],
  ['Perkz', 'MID', 'HR', 28, 78, 78, 'Shotcaller', ['leblanc', 'ahri', 'syndra']],
  ['Nisqy', 'MID', 'BE', 28, 78, 78, 'Playmaker', ['taliyah', 'sylas', 'ahri']],
  ['Jensen', 'MID', 'DK', 31, 77, 77, 'Scaling', ['orianna', 'syndra', 'azir']],
  ['Clozer', 'MID', 'KR', 22, 80, 85, 'Aggressive', ['akali', 'sylas', 'yone']],
  ['Yagao', 'MID', 'CN', 29, 80, 80, 'Weakside', ['taliyah', 'azir', 'ahri']],
  ['Bwipo', 'TOP', 'BE', 27, 84, 84, 'Aggressive', ['renekton', 'rumble', 'gnar']],
  ['Humanoid', 'MID', 'CZ', 26, 84, 85, 'Playmaker', ['azir', 'taliyah', 'orianna']],
  ['Peanut', 'JGL', 'KR', 28, 88, 88, 'Shotcaller', ['maokai', 'sejuani', 'poppy']],
  ['Mikyx', 'SUP', 'SI', 28, 86, 86, 'Shotcaller', ['rakan', 'nautilus', 'bard']],
  ['BeryL', 'SUP', 'KR', 29, 84, 84, 'Shotcaller', ['bard', 'renata', 'alistar']],
  ['Rekkles', 'SUP', 'SE', 31, 78, 78, 'Weakside', ['renata', 'lulu', 'milio']],
  ['Doublelift', 'BOT', 'US', 34, 76, 76, 'Aggressive', ['lucian', 'kaisa', 'jinx']],
  ['Diable', 'BOT', 'KR', 19, 78, 89, 'Aggressive', ['kalista', 'kaisa', 'lucian']],
  ['Ming', 'SUP', 'CN', 28, 81, 81, 'Playmaker', ['nautilus', 'rakan', 'alistar']],
  ['Kaiser', 'SUP', 'DE', 28, 77, 78, 'Playmaker', ['rell', 'leona', 'alistar']],
  ['Trymbi', 'SUP', 'PL', 27, 78, 79, 'Shotcaller', ['renata', 'rakan', 'braum']],
  ['Poby', 'MID', 'KR', 20, 76, 86, 'Scaling', ['orianna', 'azir', 'taliyah']],
  ['Guwon', 'JGL', 'KR', 22, 76, 85, 'Playmaker', ['vi', 'viego', 'leesin']],
];

// Worlds Mayhem Arcade Mode — 40 Iconic Historical Season Cards
export const LEGENDS_MAYHEM = [
  // TOP
  { name: '2018 TheShy', role: 'TOP', team: 'IG', region: 'LPL', ovr: 98, era: '2018', style: 'Aggressive', desc: 'Aatrox & Jayce ile tek başına koridoru yok eden efsane.' },
  { name: '2023 Zeus', role: 'TOP', team: 'T1', region: 'LCK', ovr: 97, era: '2023', style: 'Aggressive', desc: 'Worlds Final MVP, durdurulamaz mekanik zirve.' },
  { name: '2015 MaRin', role: 'TOP', team: 'SKT', region: 'LCK', ovr: 96, era: '2015', style: 'Shotcaller', desc: 'Rumble ve Fiora ile SKT hanedanının kaptanı.' },
  { name: '2020 Nuguri', role: 'TOP', team: 'DWG', region: 'LCK', ovr: 96, era: '2020', style: 'Aggressive', desc: 'DAMWON altın çağının üst koridor canavarı.' },
  { name: '2024 Bin', role: 'TOP', team: 'BLG', region: 'LPL', ovr: 95, era: '2024', style: 'Aggressive', desc: 'Jax ve Camille ile 1v9 makinesi.' },
  { name: '2016 Smeb', role: 'TOP', team: 'ROX', region: 'LCK', ovr: 95, era: '2016', style: 'Playmaker', desc: 'Kennen ultisiyle tarihe geçen ROX yıldızı.' },
  { name: '2019 Wunder', role: 'TOP', team: 'G2', region: 'LEC', ovr: 92, era: '2019', style: 'Weakside', desc: 'Avrupa altın çağının en esnek üst koridoru.' },
  { name: '2022 Kingen', role: 'TOP', team: 'DRX', region: 'LCK', ovr: 93, era: '2022', style: 'Clutch', desc: 'Aatrox ile Worlds finalini tek başına çeviren kahraman.' },

  // JGL
  { name: '2020 Canyon', role: 'JGL', team: 'DWG', region: 'LCK', ovr: 98, era: '2020', style: 'Playmaker', desc: 'Ormancı rolünün gelmiş geçmiş en baskın sezonu.' },
  { name: '2014 DanDy', role: 'JGL', team: 'SSW', region: 'LCK', ovr: 97, era: '2014', style: 'Shotcaller', desc: 'Haritayı herkesten 2 dakika önce okuyan ormancı.' },
  { name: '2023 Oner', role: 'JGL', team: 'T1', region: 'LCK', ovr: 95, era: '2023', style: 'Playmaker', desc: 'Rell ve Lee Sin ile kusursuz takım savaşları.' },
  { name: '2019 Tian', role: 'JGL', team: 'FPX', region: 'LPL', ovr: 95, era: '2019', style: 'Playmaker', desc: 'Lee Sin ile G2 finalini domine eden MVP.' },
  { name: '2015 Bengi', role: 'JGL', team: 'SKT', region: 'LCK', ovr: 94, era: '2015', style: 'Weakside', desc: 'Faker\'ın sağ kolu, 3x Dünya Şampiyonu.' },
  { name: '2023 Kanavi', role: 'JGL', team: 'JDG', region: 'LPL', ovr: 95, era: '2023', style: 'Aggressive', desc: 'Golden Road yürüyüşünün motoru.' },
  { name: '2019 Jankos', role: 'JGL', team: 'G2', region: 'LEC', ovr: 92, era: '2019', style: 'Shotcaller', desc: 'First Blood King ve Avrupa efsanesi.' },
  { name: '2021 Jiejie', role: 'JGL', team: 'EDG', region: 'LPL', ovr: 93, era: '2021', style: 'Playmaker', desc: 'Jarvan IV ile Worlds kupasını getiren beyin.' },

  // MID
  { name: '2015 Faker', role: 'MID', team: 'SKT', region: 'LCK', ovr: 99, era: '2015', style: 'Shotcaller', desc: 'Unkillable Demon King — zirve dönemi.' },
  { name: '2024 Chovy', role: 'MID', team: 'GEN', region: 'LCK', ovr: 97, era: '2024', style: 'Scaling', desc: 'Kusursuz koridor hakimiyeti ve CS makinesi.' },
  { name: '2018 Rookie', role: 'MID', team: 'IG', region: 'LPL', ovr: 97, era: '2018', style: 'Playmaker', desc: 'LPL\'in ilk Worlds kupasının mimarı.' },
  { name: '2020 ShowMaker', role: 'MID', team: 'DWG', region: 'LCK', ovr: 96, era: '2020', style: 'Playmaker', desc: 'Syndra ve TF ile haritayı domine eden yıldız.' },
  { name: '2019 Caps', role: 'MID', team: 'G2', region: 'LEC', ovr: 95, era: '2019', style: 'Playmaker', desc: 'MSI Şampiyonu, Batı\'nın en büyük orta koridoru.' },
  { name: '2022 Zeka', role: 'MID', team: 'DRX', region: 'LCK', ovr: 95, era: '2022', style: 'Clutch', desc: 'Sylas & Akali ile mucize Worlds koşusu.' },
  { name: '2023 knight', role: 'MID', team: 'JDG', region: 'LPL', ovr: 96, era: '2023', style: 'Playmaker', desc: 'LPL & MSI MVP, sol elin altın çocuğu.' },
  { name: '2019 Doinb', role: 'MID', team: 'FPX', region: 'LPL', ovr: 94, era: '2019', style: 'Shotcaller', desc: 'Nautilus Mid ile metayı baştan yazan kaptan.' },

  // BOT
  { name: '2018 Uzi', role: 'BOT', team: 'RNG', region: 'LPL', ovr: 98, era: '2018', style: 'Aggressive', desc: 'Kai\'Sa & Vayne ile ADC rolünün tanrısı.' },
  { name: '2023 Ruler', role: 'BOT', team: 'JDG', region: 'LCK', ovr: 97, era: '2023', style: 'Scaling', desc: 'Kusursuz pozisyon alma ve geç oyun güvencesi.' },
  { name: '2021 Viper', role: 'BOT', team: 'EDG', region: 'LPL', ovr: 97, era: '2021', style: 'Scaling', desc: 'Aphelios & Lucian ile Dünya Şampiyonu.' },
  { name: '2023 Gumayusi', role: 'BOT', team: 'T1', region: 'LCK', ovr: 96, era: '2023', style: 'Aggressive', desc: '1v2 mekanikleri ve Baron çalmalarıyla efsane.' },
  { name: '2016 Bang', role: 'BOT', team: 'SKT', region: 'LCK', ovr: 95, era: '2016', style: 'Scaling', desc: 'Ezreal ile sıfır hatasız 2x Dünya Şampiyonu.' },
  { name: '2018 JackeyLove', role: 'BOT', team: 'IG', region: 'LPL', ovr: 95, era: '2018', style: 'Aggressive', desc: '17 yaşında Worlds kaldıran korkusuz nişancı.' },
  { name: '2022 Deft', role: 'BOT', team: 'DRX', region: 'LCK', ovr: 94, era: '2022', style: 'Clutch', desc: '"Önemli olan kırılmayan kalptir."' },
  { name: '2019 Perkz', role: 'BOT', team: 'G2', region: 'LEC', ovr: 93, era: '2019', style: 'Playmaker', desc: 'Xayah & Kai\'Sa ile rol değiştirip MSI kazanan dahi.' },

  // SUP
  { name: '2023 Keria', role: 'SUP', team: 'T1', region: 'LCK', ovr: 98, era: '2023', style: 'Playmaker', desc: 'Nişancı destekleriyle metayı kıran dahi.' },
  { name: '2014 Mata', role: 'SUP', team: 'SSW', region: 'LCK', ovr: 98, era: '2014', style: 'Shotcaller', desc: 'Modern görüş kontrolünü icat eden Worlds MVP.' },
  { name: '2021 Meiko', role: 'SUP', team: 'EDG', region: 'LPL', ovr: 95, era: '2021', style: 'Shotcaller', desc: 'LPL tarihinin ilk Grand Slam destek oyuncusu.' },
  { name: '2022 BeryL', role: 'SUP', team: 'DRX', region: 'LCK', ovr: 95, era: '2022', style: 'Shotcaller', desc: '2 farklı takımla Worlds kazanan strateji dehası.' },
  { name: '2016 Wolf', role: 'SUP', team: 'SKT', region: 'LCK', ovr: 94, era: '2016', style: 'Playmaker', desc: 'SKT hanedanının takım savaşı başlatıcısı.' },
  { name: '2019 Mikyx', role: 'SUP', team: 'G2', region: 'LEC', ovr: 93, era: '2019', style: 'Playmaker', desc: 'Avrupa\'nın en yaratıcı destek oyuncusu.' },
  { name: '2018 Ming', role: 'SUP', team: 'RNG', region: 'LPL', ovr: 95, era: '2018', style: 'Playmaker', desc: 'Uzi ile tarihin en korkulan alt koridoru.' },
  { name: '2017 CoreJJ', role: 'SUP', team: 'SSG', region: 'LCK', ovr: 94, era: '2017', style: 'Shotcaller', desc: 'Samsung Galaxy Worlds şampiyonunun beyni.' },
];

export function createInitialDatabase() {
  _pid = 1;
  const teams = [];
  const players = [];

  for (const rt of RAW_TEAMS) {
    const team = {
      id: rt.id,
      name: rt.name,
      tag: rt.tag,
      region: rt.region,
      color: rt.color,
      color2: rt.color2,
      budget: Math.round((rt.budget * 1.65) / 50000) * 50000,
      prestige: rt.prestige,
      fanbase: rt.fanbase,
      synergy: 68 + Math.floor(Math.random() * 14),
      facilities: {
        gamingHouse: rt.prestige >= 90 ? 3 : rt.prestige >= 80 ? 2 : 1,
        analystDesk: rt.prestige >= 90 ? 3 : rt.prestige >= 80 ? 2 : 1,
        youthAcademy: rt.prestige >= 88 ? 2 : 1,
        psychologist: rt.prestige >= 90 ? 2 : 1,
      },
      trainingFocus: 'balanced',
      tactics: {
        gameplan: 'balanced', // aggressive | balanced | scaling | split
        laneFocus: 'MID',     // TOP | MID | BOT
        objective: 'dragon',  // dragon | baron | towers
        topStyle: 'balanced', // carry | balanced | weakside
        supStyle: 'balanced', // roam | balanced | peel
        adcStyle: 'balanced', // aggressive | balanced | safe
      },
      sponsor: null,
      trophies: [],
    };
    teams.push(team);

    for (const rp of rt.roster) {
      const [name, role, nat, age, baseOvr, pot, style, sigChamps] = rp;
      players.push(mkPlayer(name, role, nat, age, baseOvr, pot, style, sigChamps, team.id));
    }
  }

  for (const fa of RAW_FREE_AGENTS) {
    const [name, role, nat, age, baseOvr, pot, style, sigChamps] = fa;
    const p = mkPlayer(name, role, nat, age, baseOvr, pot, style, sigChamps, null, { contractYears: 0 });
    p.isStarter = false;
    players.push(p);
  }

  return { teams, players };
}

const REGEN_FIRST = ['Kael', 'Jin', 'Vex', 'Sora', 'Miro', 'Luka', 'Haneul', 'Ryu', 'Taro', 'Arda', 'Eren', 'Kaan', 'Kiro', 'Zed', 'Yoon', 'Dae', 'Milo', 'Nox', 'Faye', 'Sven', 'Caio', 'Mateus', 'Liam'];
const REGEN_SUF = ['X', '7', 'gg', 'KR', 'zy', 'on', 'ix', 'el', 'ar', '', '', '', ''];
const REGION_NATS = {
  LCK: ['KR'],
  LPL: ['CN', 'TW'],
  LEC: ['FR', 'DE', 'ES', 'PL', 'SE', 'DK'],
  LCS: ['US', 'CA'],
  TCL: ['TR'],
  CBLOL: ['BR'],
  LCO: ['AU', 'NZ'],
};

export function generateRegenPlayer(role, region, academyLevel = 1, teamId = null) {
  const nats = REGION_NATS[region] || ['KR'];
  const nat = nats[Math.floor(Math.random() * nats.length)];
  const name = REGEN_FIRST[Math.floor(Math.random() * REGEN_FIRST.length)] + REGEN_SUF[Math.floor(Math.random() * REGEN_SUF.length)] + (Math.random() < 0.25 ? Math.floor(Math.random() * 99) : '');
  const age = 16 + Math.floor(Math.random() * 3);
  const baseOvr = 66 + academyLevel * 3 + Math.floor(Math.random() * 8);
  const pot = Math.min(97, baseOvr + 9 + academyLevel * 2 + Math.floor(Math.random() * 10));
  const styles = ['Aggressive', 'Scaling', 'Playmaker', 'Weakside', 'Shotcaller'];
  const style = styles[Math.floor(Math.random() * styles.length)];

  const roleChamps = {
    TOP: ['ksante', 'rumble', 'aatrox', 'jax', 'gnar', 'ambessa'],
    JGL: ['vi', 'viego', 'leesin', 'skarner', 'sejuani', 'jarvan'],
    MID: ['azir', 'orianna', 'ahri', 'sylas', 'yone', 'aurora'],
    BOT: ['kaisa', 'varus', 'xayah', 'jinx', 'ezreal', 'ashe'],
    SUP: ['rell', 'nautilus', 'rakan', 'leona', 'renata', 'alistar'],
  };
  const pool = [...roleChamps[role]].sort(() => Math.random() - 0.5).slice(0, 3);
  const p = mkPlayer(name, role, nat, age, baseOvr, pot, style, pool, teamId, { contractYears: teamId ? 3 : 0 });
  p.isStarter = false;
  return p;
}

// Generate 14 SoloQ Challenger Ladder Wonderkids with hidden potential until scouted!
export function generateChallengerProspects() {
  const list = [];
  const servers = ['KR', 'EUW', 'CN', 'TR', 'BR', 'NA', 'OCE'];
  const serverToReg = { KR: 'LCK', EUW: 'LEC', CN: 'LPL', TR: 'TCL', BR: 'CBLOL', NA: 'LCS', OCE: 'LCO' };
  for (let i = 0; i < 14; i++) {
    const srv = servers[i % servers.length];
    const role = ROLES[i % ROLES.length];
    const p = generateRegenPlayer(role, serverToReg[srv], Math.random() < 0.35 ? 3 : 2, null);
    p.lp = 1100 + Math.floor(Math.random() * 650);
    p.server = srv;
    p.scouted = false;
    p.signingFee = Math.round(p.marketValue * 0.45 / 5000) * 5000;
    list.push(p);
  }
  return list.sort((a, b) => b.lp - a.lp);
}

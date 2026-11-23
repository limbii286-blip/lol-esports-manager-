// LoL Esports Manager — 4 Major Regions, 32 Real Teams, 160+ Pro Players + Free Agents

export const ROLES = ['TOP', 'JGL', 'MID', 'BOT', 'SUP'];
export const ROLE_LABELS = {
  TOP: 'Üst Koridor',
  JGL: 'Ormancı',
  MID: 'Orta Koridor',
  BOT: 'Nişancı',
  SUP: 'Destek',
};

export const REGIONS = [
  { id: 'LCK', name: 'LCK (Kore)', color: '#38bdf8', prestige: 96, desc: 'Dünyanın en disiplinli makro ve bireysel yetenek ligi.' },
  { id: 'LPL', name: 'LPL (Çin)', color: '#ef4444', prestige: 95, desc: 'Agresif takım savaşları ve yüksek mekanik temposu.' },
  { id: 'LEC', name: 'LEC (Avrupa)', color: '#10b981', prestige: 84, desc: 'Yaratıcı draftlar ve sürpriz stratejilerin sahnesi.' },
  { id: 'LCS', name: 'LCS (Kuzey Amerika)', color: '#f59e0b', prestige: 80, desc: 'Yüksek bütçeler, yıldız transferler ve şov kültürü.' },
];

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

export function calcMarketValue(ovr, age, pot) {
  const ageFactor = age <= 20 ? 1.35 : age <= 23 ? 1.15 : age <= 26 ? 1.0 : age <= 28 ? 0.8 : 0.65;
  const potBonus = Math.max(0, pot - ovr) * 18000;
  const base = Math.pow(Math.max(1, ovr - 58), 2.35) * 280;
  return Math.round((base * ageFactor + potBonus) / 5000) * 5000;
}

export function calcWeeklySalary(ovr, prestige = 80) {
  const base = Math.pow(Math.max(1, ovr - 60), 2.05) * 42;
  return Math.round((base * (0.85 + prestige / 400)) / 500) * 500;
}

let _pid = 1;
function mkPlayer(name, role, nat, age, baseOvr, pot, style, sigChamps, teamId, overrides = {}) {
  // Generate realistic 6 attributes around baseOvr based on playstyle & role
  const clamp = (v) => Math.max(55, Math.min(99, Math.round(v)));
  const j = () => Math.floor(Math.random() * 5) - 2;

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
  const marketValue = calcMarketValue(ovr, age, finalPot);

  return {
    id: `p_${_pid++}`,
    name,
    role,
    nat,
    age,
    attrs,
    ovr,
    pot: finalPot,
    style,
    sigChamps,
    teamId,
    salary,
    contractYears: overrides.contractYears ?? (Math.random() < 0.45 ? 1 : Math.random() < 0.75 ? 2 : 3),
    marketValue,
    morale: 78 + Math.floor(Math.random() * 14),
    form: 72 + Math.floor(Math.random() * 16),
    fatigue: 8 + Math.floor(Math.random() * 10),
    isStarter: teamId !== null,
    stats: { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, mvps: 0 },
  };
}

const RAW_TEAMS = [
  // ==================== LCK (8 Teams) ====================
  {
    id: 't1', name: 'T1', tag: 'T1', region: 'LCK', color: '#e2012d', color2: '#ffffff',
    budget: 3800000, prestige: 98, fanbase: 99,
    roster: [
      ['Doran', 'TOP', 'KR', 25, 86, 88, 'Weakside', ['gnar', 'ksante', 'ambessa']],
      ['Oner', 'JGL', 'KR', 23, 90, 93, 'Playmaker', ['leesin', 'vi', 'viego']],
      ['Faker', 'MID', 'KR', 29, 93, 94, 'Shotcaller', ['azir', 'orianna', 'ahri', 'sylas']],
      ['Gumayusi', 'BOT', 'KR', 23, 91, 93, 'Aggressive', ['varus', 'xayah', 'kalista', 'jinx']],
      ['Keria', 'SUP', 'KR', 23, 93, 95, 'Playmaker', ['renata', 'bard', 'rakan', 'thresh']],
    ],
  },
  {
    id: 'geng', name: 'Gen.G Esports', tag: 'GEN', region: 'LCK', color: '#aa8a00', color2: '#111111',
    budget: 3600000, prestige: 96, fanbase: 90,
    roster: [
      ['Kiin', 'TOP', 'KR', 26, 91, 91, 'Weakside', ['ksante', 'rumble', 'jax']],
      ['Canyon', 'JGL', 'KR', 24, 93, 94, 'Playmaker', ['nidalee', 'viego', 'skarner']],
      ['Chovy', 'MID', 'KR', 24, 95, 96, 'Scaling', ['azir', 'yone', 'aurora', 'corki']],
      ['Ruler', 'BOT', 'KR', 27, 92, 92, 'Scaling', ['kaisa', 'zeri', 'xayah', 'varus']],
      ['Duro', 'SUP', 'KR', 23, 84, 88, 'Playmaker', ['rell', 'rakan', 'alistar']],
    ],
  },
  {
    id: 'hle', name: 'Hanwha Life Esports', tag: 'HLE', region: 'LCK', color: '#f37321', color2: '#ffffff',
    budget: 3500000, prestige: 93, fanbase: 85,
    roster: [
      ['Zeus', 'TOP', 'KR', 22, 94, 96, 'Aggressive', ['rumble', 'aatrox', 'jayce', 'gnar']],
      ['Peanut', 'JGL', 'KR', 27, 89, 89, 'Shotcaller', ['maokai', 'sejuani', 'poppy']],
      ['Zeka', 'MID', 'KR', 23, 91, 93, 'Playmaker', ['sylas', 'yone', 'akali', 'azir']],
      ['Viper', 'BOT', 'KR', 25, 93, 93, 'Scaling', ['kaisa', 'ezreal', 'xayah', 'ashe']],
      ['Delight', 'SUP', 'KR', 23, 89, 91, 'Playmaker', ['rell', 'rakan', 'alistar']],
    ],
  },
  {
    id: 'dk', name: 'Dplus KIA', tag: 'DK', region: 'LCK', color: '#00d2be', color2: '#111111',
    budget: 2600000, prestige: 88, fanbase: 84,
    roster: [
      ['Siwoo', 'TOP', 'KR', 18, 82, 92, 'Aggressive', ['ambessa', 'jax', 'ksante']],
      ['Lucid', 'JGL', 'KR', 20, 85, 92, 'Playmaker', ['leesin', 'vi', 'viego']],
      ['ShowMaker', 'MID', 'KR', 25, 89, 90, 'Playmaker', ['syndra', 'ahri', 'leblanc', 'taliyah']],
      ['Aiming', 'BOT', 'KR', 25, 89, 90, 'Scaling', ['kaisa', 'ezreal', 'smolder']],
      ['BeryL', 'SUP', 'KR', 28, 85, 85, 'Shotcaller', ['bard', 'renata', 'alistar']],
    ],
  },
  {
    id: 'kt', name: 'KT Rolster', tag: 'KT', region: 'LCK', color: '#ff0a0a', color2: '#111111',
    budget: 2300000, prestige: 85, fanbase: 80,
    roster: [
      ['PerfecT', 'TOP', 'KR', 21, 82, 88, 'Weakside', ['ksante', 'renekton', 'ornn']],
      ['Cuzz', 'JGL', 'KR', 26, 86, 86, 'Shotcaller', ['sejuani', 'maokai', 'vi']],
      ['Bdd', 'MID', 'KR', 26, 89, 89, 'Playmaker', ['azir', 'taliyah', 'orianna']],
      ['deokdam', 'BOT', 'KR', 25, 83, 85, 'Scaling', ['aphelios', 'jinx', 'varus']],
      ['Way', 'SUP', 'KR', 20, 80, 88, 'Playmaker', ['nautilus', 'rell', 'rakan']],
    ],
  },
  {
    id: 'kdf', name: 'DN Freecs', tag: 'DNF', region: 'LCK', color: '#2563eb', color2: '#ffffff',
    budget: 1900000, prestige: 79, fanbase: 70,
    roster: [
      ['DuDu', 'TOP', 'KR', 24, 83, 86, 'Aggressive', ['rumble', 'renekton', 'gnar']],
      ['Pyosik', 'JGL', 'KR', 25, 84, 85, 'Playmaker', ['leesin', 'viego', 'jarvan']],
      ['BuLLDoG', 'MID', 'KR', 20, 81, 88, 'Aggressive', ['ahri', 'yone', 'syndra']],
      ['Berserker', 'BOT', 'KR', 22, 85, 90, 'Scaling', ['kaisa', 'zeri', 'jinx']],
      ['Life', 'SUP', 'KR', 25, 82, 83, 'Playmaker', ['rakan', 'nautilus', 'thresh']],
    ],
  },
  {
    id: 'ns', name: 'Nongshim RedForce', tag: 'NS', region: 'LCK', color: '#dc2626', color2: '#fbbf24',
    budget: 1800000, prestige: 77, fanbase: 68,
    roster: [
      ['Kingen', 'TOP', 'KR', 25, 85, 86, 'Weakside', ['aatrox', 'ksante', 'ornn']],
      ['GIDEON', 'JGL', 'KR', 22, 81, 86, 'Aggressive', ['vi', 'xinzhao', 'viego']],
      ['Fisher', 'MID', 'KR', 21, 80, 87, 'Playmaker', ['ahri', 'azir', 'sylas']],
      ['Jiwoo', 'BOT', 'KR', 21, 83, 89, 'Scaling', ['kaisa', 'jinx', 'ezreal']],
      ['Lehends', 'SUP', 'KR', 27, 88, 88, 'Shotcaller', ['nautilus', 'braum', 'alistar']],
    ],
  },
  {
    id: 'drx', name: 'DRX', tag: 'DRX', region: 'LCK', color: '#3b82f6', color2: '#ffffff',
    budget: 1750000, prestige: 80, fanbase: 74,
    roster: [
      ['Rich', 'TOP', 'KR', 27, 80, 80, 'Aggressive', ['aatrox', 'gnar', 'rumble']],
      ['Sponge', 'JGL', 'KR', 20, 79, 86, 'Playmaker', ['vi', 'leesin', 'skarner']],
      ['Ucal', 'MID', 'KR', 24, 83, 85, 'Aggressive', ['taliyah', 'orianna', 'sylas']],
      ['Teddy', 'BOT', 'KR', 27, 85, 85, 'Scaling', ['ezreal', 'varus', 'aphelios']],
      ['Andil', 'SUP', 'KR', 23, 80, 84, 'Weakside', ['rell', 'leona', 'braum']],
    ],
  },

  // ==================== LPL (8 Teams) ====================
  {
    id: 'blg', name: 'Bilibili Gaming', tag: 'BLG', region: 'LPL', color: '#00a1d6', color2: '#fb7299',
    budget: 3700000, prestige: 95, fanbase: 94,
    roster: [
      ['Bin', 'TOP', 'CN', 23, 94, 96, 'Aggressive', ['jax', 'camille', 'rumble', 'renenkton'.replace('renenkton', 'renekton')]],
      ['Wei', 'JGL', 'CN', 23, 88, 90, 'Shotcaller', ['skarner', 'sejuani', 'vi']],
      ['knight', 'MID', 'CN', 25, 94, 95, 'Playmaker', ['ahri', 'syndra', 'sylas', 'aurora']],
      ['Elk', 'BOT', 'CN', 24, 92, 93, 'Aggressive', ['kaisa', 'kalista', 'ezreal', 'ashe']],
      ['ON', 'SUP', 'CN', 22, 89, 92, 'Playmaker', ['rakan', 'rell', 'nautilus']],
    ],
  },
  {
    id: 'tes', name: 'Top Esports', tag: 'TES', region: 'LPL', color: '#e60012', color2: '#ffffff',
    budget: 3300000, prestige: 91, fanbase: 88,
    roster: [
      ['369', 'TOP', 'CN', 24, 90, 91, 'Weakside', ['ksante', 'ornn', 'renekton']],
      ['Kanavi', 'JGL', 'KR', 25, 91, 92, 'Aggressive', ['viego', 'nidalee', 'vi']],
      ['Creme', 'MID', 'CN', 22, 87, 92, 'Aggressive', ['yone', 'akali', 'sylas']],
      ['JackeyLove', 'BOT', 'CN', 25, 91, 91, 'Aggressive', ['kaisa', 'lucian', 'varus', 'ezreal']],
      ['Crisp', 'SUP', 'CN', 27, 87, 87, 'Playmaker', ['thresh', 'nautilus', 'renata']],
    ],
  },
  {
    id: 'jdg', name: 'JD Gaming', tag: 'JDG', region: 'LPL', color: '#c8102e', color2: '#111111',
    budget: 3400000, prestige: 91, fanbase: 86,
    roster: [
      ['Ale', 'TOP', 'CN', 24, 85, 87, 'Aggressive', ['jax', 'camille', 'ambessa']],
      ['Xun', 'JGL', 'CN', 23, 88, 91, 'Aggressive', ['nidalee', 'vi', 'xinzhao']],
      ['Scout', 'MID', 'KR', 27, 90, 90, 'Playmaker', ['azir', 'orianna', 'yone']],
      ['Peyz', 'BOT', 'KR', 20, 89, 95, 'Scaling', ['kaisa', 'zeri', 'kalista']],
      ['MISSING', 'SUP', 'CN', 24, 87, 89, 'Playmaker', ['rakan', 'renata', 'rell']],
    ],
  },
  {
    id: 'wbg', name: 'Weibo Gaming', tag: 'WBG', region: 'LPL', color: '#f97316', color2: '#ffffff',
    budget: 2800000, prestige: 88, fanbase: 85,
    roster: [
      ['Breathe', 'TOP', 'CN', 24, 86, 88, 'Aggressive', ['ksante', 'gnar', 'rumble']],
      ['Tian', 'JGL', 'CN', 25, 88, 88, 'Playmaker', ['leesin', 'viego', 'jarvan']],
      ['Xiaohu', 'MID', 'CN', 27, 88, 88, 'Shotcaller', ['taliyah', 'orianna', 'corki']],
      ['Light', 'BOT', 'CN', 24, 88, 89, 'Scaling', ['xayah', 'varus', 'ashe']],
      ['Hang', 'SUP', 'CN', 22, 84, 88, 'Playmaker', ['nautilus', 'thresh', 'rakan']],
    ],
  },
  {
    id: 'ig', name: 'Invictus Gaming', tag: 'IG', region: 'LPL', color: '#e2e8f0', color2: '#111111',
    budget: 3100000, prestige: 90, fanbase: 92,
    roster: [
      ['TheShy', 'TOP', 'KR', 26, 88, 89, 'Aggressive', ['aatrox', 'jayce', 'rumble', 'kennen']],
      ['Jiejie', 'JGL', 'CN', 24, 87, 88, 'Playmaker', ['jarvan', 'viego', 'xinzhao']],
      ['Rookie', 'MID', 'KR', 28, 89, 89, 'Playmaker', ['orianna', 'leblanc', 'syndra', 'ahri']],
      ['GALA', 'BOT', 'CN', 24, 90, 91, 'Scaling', ['kaisa', 'xayah', 'jinx']],
      ['Meiko', 'SUP', 'CN', 27, 89, 89, 'Shotcaller', ['renata', 'nautilus', 'braum']],
    ],
  },
  {
    id: 'al', name: "Anyone's Legend", tag: 'AL', region: 'LPL', color: '#b91c1c', color2: '#fbbf24',
    budget: 2200000, prestige: 82, fanbase: 75,
    roster: [
      ['Flandre', 'TOP', 'CN', 27, 84, 84, 'Weakside', ['gnar', 'ksante', 'ornn']],
      ['Tarzan', 'JGL', 'KR', 26, 90, 90, 'Shotcaller', ['skarner', 'sejuani', 'viego']],
      ['Shanks', 'MID', 'CN', 24, 85, 88, 'Playmaker', ['azir', 'taliyah', 'ahri']],
      ['Hope', 'BOT', 'CN', 25, 84, 85, 'Scaling', ['jinx', 'varus', 'ashe']],
      ['Kael', 'SUP', 'KR', 21, 85, 90, 'Playmaker', ['rell', 'alistar', 'rakan']],
    ],
  },
  {
    id: 'lng', name: 'LNG Esports', tag: 'LNG', region: 'LPL', color: '#0ea5e9', color2: '#ffffff',
    budget: 2100000, prestige: 83, fanbase: 76,
    roster: [
      ['Zika', 'TOP', 'CN', 22, 86, 91, 'Aggressive', ['jax', 'ambessa', 'renekton']],
      ['Weiwei', 'JGL', 'CN', 25, 84, 85, 'Weakside', ['maokai', 'sejuani', 'vi']],
      ['haichao', 'MID', 'CN', 23, 82, 86, 'Scaling', ['azir', 'orianna', 'corki']],
      ['Photic', 'BOT', 'CN', 23, 83, 86, 'Aggressive', ['lucian', 'ezreal', 'kaisa']],
      ['Zhuo', 'SUP', 'CN', 24, 81, 84, 'Weakside', ['nautilus', 'leona', 'braum']],
    ],
  },
  {
    id: 'nip', name: 'Ninjas in Pyjamas', tag: 'NIP', region: 'LPL', color: '#eab308', color2: '#111111',
    budget: 2000000, prestige: 80, fanbase: 74,
    roster: [
      ['Shanji', 'TOP', 'CN', 24, 84, 86, 'Aggressive', ['rumble', 'ksante', 'aatrox']],
      ['Aki', 'JGL', 'CN', 25, 82, 84, 'Playmaker', ['vi', 'leesin', 'jarvan']],
      ['Doinb', 'MID', 'KR', 28, 85, 85, 'Shotcaller', ['taliyah', 'sylas', 'orianna']],
      ['Leave', 'BOT', 'CN', 21, 83, 88, 'Aggressive', ['kaisa', 'lucian', 'zeri']],
      ['ppgod', 'SUP', 'CN', 25, 82, 83, 'Playmaker', ['rell', 'rakan', 'nautilus']],
    ],
  },

  // ==================== LEC (8 Teams) ====================
  {
    id: 'g2', name: 'G2 Esports', tag: 'G2', region: 'LEC', color: '#ef4444', color2: '#111111',
    budget: 2900000, prestige: 90, fanbase: 95,
    roster: [
      ['BrokenBlade', 'TOP', 'DE', 25, 87, 88, 'Aggressive', ['ksante', 'jax', 'aatrox']],
      ['SkewMond', 'JGL', 'FR', 20, 82, 90, 'Playmaker', ['viego', 'vi', 'skarner']],
      ['Caps', 'MID', 'DK', 26, 91, 92, 'Playmaker', ['sylas', 'orianna', 'leblanc', 'ahri']],
      ['Hans Sama', 'BOT', 'FR', 26, 86, 87, 'Aggressive', ['kalista', 'varus', 'lucian']],
      ['Labrov', 'SUP', 'GR', 23, 84, 88, 'Playmaker', ['rell', 'nautilus', 'rakan']],
    ],
  },
  {
    id: 'fnc', name: 'Fnatic', tag: 'FNC', region: 'LEC', color: '#ff5900', color2: '#111111',
    budget: 2500000, prestige: 87, fanbase: 91,
    roster: [
      ['Oscarinin', 'TOP', 'ES', 22, 82, 88, 'Aggressive', ['rumble', 'ksante', 'renekton']],
      ['Razork', 'JGL', 'ES', 25, 87, 88, 'Aggressive', ['vi', 'poppy', 'sejuani']],
      ['Humanoid', 'MID', 'CZ', 25, 85, 86, 'Playmaker', ['azir', 'taliyah', 'orianna']],
      ['Upset', 'BOT', 'DE', 25, 86, 87, 'Scaling', ['ezreal', 'kaisa', 'xayah']],
      ['Mikyx', 'SUP', 'SI', 27, 87, 87, 'Shotcaller', ['rakan', 'nautilus', 'bard']],
    ],
  },
  {
    id: 'kc', name: 'Karmine Corp', tag: 'KC', region: 'LEC', color: '#0284c7', color2: '#ffffff',
    budget: 2400000, prestige: 83, fanbase: 93,
    roster: [
      ['Canna', 'TOP', 'KR', 25, 84, 85, 'Weakside', ['gnar', 'jayce', 'ksante']],
      ['Yike', 'JGL', 'SE', 25, 85, 88, 'Aggressive', ['viego', 'maokai', 'vi']],
      ['Vladi', 'MID', 'GR', 20, 82, 90, 'Playmaker', ['ahri', 'yone', 'syndra']],
      ['Caliste', 'BOT', 'FR', 19, 83, 93, 'Aggressive', ['kaisa', 'ezreal', 'kalista']],
      ['Targamas', 'SUP', 'BE', 25, 81, 83, 'Shotcaller', ['renata', 'rakan', 'thresh']],
    ],
  },
  {
    id: 'mkoi', name: 'Movistar KOI', tag: 'MKOI', region: 'LEC', color: '#6366f1', color2: '#ffffff',
    budget: 2200000, prestige: 82, fanbase: 86,
    roster: [
      ['Myrwn', 'TOP', 'ES', 22, 81, 87, 'Aggressive', ['rumble', 'ambessa', 'kennen']],
      ['Elyoya', 'JGL', 'ES', 25, 86, 87, 'Shotcaller', ['vi', 'viego', 'jarvan']],
      ['Jojopyun', 'MID', 'CA', 21, 84, 90, 'Aggressive', ['ahri', 'yone', 'sylas']],
      ['Supa', 'BOT', 'ES', 24, 82, 85, 'Aggressive', ['varus', 'kaisa', 'ezreal']],
      ['Alvaro', 'SUP', 'ES', 22, 82, 87, 'Playmaker', ['rell', 'nautilus', 'alistar']],
    ],
  },
  {
    id: 'bds', name: 'Team BDS', tag: 'BDS', region: 'LEC', color: '#ec4899', color2: '#ffffff',
    budget: 1950000, prestige: 79, fanbase: 74,
    roster: [
      ['Irrelevant', 'TOP', 'DE', 23, 83, 86, 'Weakside', ['gnar', 'ksante', 'ornn']],
      ['113', 'JGL', 'TR', 21, 79, 86, 'Aggressive', ['leesin', 'vi', 'xinzhao']],
      ['nuc', 'MID', 'FR', 23, 82, 85, 'Scaling', ['azir', 'orianna', 'corki']],
      ['Ice', 'BOT', 'KR', 24, 84, 86, 'Scaling', ['jinx', 'kaisa', 'aphelios']],
      ['Parus', 'SUP', 'TR', 21, 81, 88, 'Playmaker', ['rakan', 'rell', 'nautilus']],
    ],
  },
  {
    id: 'vit', name: 'Team Vitality', tag: 'VIT', region: 'LEC', color: '#facc15', color2: '#111111',
    budget: 2100000, prestige: 78, fanbase: 77,
    roster: [
      ['Naak Nako', 'TOP', 'FR', 19, 78, 88, 'Aggressive', ['jax', 'ambessa', 'aatrox']],
      ['Lyncas', 'JGL', 'LT', 21, 80, 87, 'Playmaker', ['viego', 'vi', 'nidalee']],
      ['Czajek', 'MID', 'PL', 21, 80, 87, 'Playmaker', ['syndra', 'ahri', 'orianna']],
      ['Carzzy', 'BOT', 'CZ', 23, 84, 86, 'Aggressive', ['ezreal', 'kalista', 'xayah']],
      ['Hylissang', 'SUP', 'BG', 30, 81, 81, 'Aggressive', ['rakan', 'nautilus', 'thresh']],
    ],
  },
  {
    id: 'gx', name: 'GIANTX', tag: 'GX', region: 'LEC', color: '#38bdf8', color2: '#111111',
    budget: 1850000, prestige: 77, fanbase: 73,
    roster: [
      ['Lot', 'TOP', 'TR', 21, 79, 86, 'Weakside', ['ksante', 'renekton', 'gnar']],
      ['Closer', 'JGL', 'TR', 26, 82, 83, 'Playmaker', ['leesin', 'viego', 'vi']],
      ['Jackies', 'MID', 'CZ', 20, 82, 89, 'Aggressive', ['yone', 'sylas', 'aurora']],
      ['Noah', 'BOT', 'KR', 24, 84, 86, 'Scaling', ['aphelios', 'jinx', 'varus']],
      ['Jun', 'SUP', 'KR', 24, 84, 87, 'Playmaker', ['rell', 'nautilus', 'renata']],
    ],
  },
  {
    id: 'th', name: 'Team Heretics', tag: 'TH', region: 'LEC', color: '#f43f5e', color2: '#ffffff',
    budget: 1750000, prestige: 76, fanbase: 78,
    roster: [
      ['Carlsen', 'TOP', 'DK', 20, 78, 86, 'Weakside', ['ksante', 'ornn', 'gnar']],
      ['Sheo', 'JGL', 'FR', 23, 81, 85, 'Shotcaller', ['sejuani', 'maokai', 'vi']],
      ['Kamiloo', 'MID', 'FR', 19, 77, 86, 'Playmaker', ['ahri', 'orianna', 'taliyah']],
      ['Flakked', 'BOT', 'ES', 24, 81, 83, 'Scaling', ['xayah', 'kaisa', 'ashe']],
      ['Stend', 'SUP', 'FR', 22, 79, 85, 'Playmaker', ['rakan', 'leona', 'braum']],
    ],
  },

  // ==================== LCS (8 Teams) ====================
  {
    id: 'fly', name: 'FlyQuest', tag: 'FLY', region: 'LCS', color: '#16a34a', color2: '#ffffff',
    budget: 2700000, prestige: 86, fanbase: 84,
    roster: [
      ['Bwipo', 'TOP', 'BE', 26, 85, 85, 'Aggressive', ['renekton', 'rumble', 'gnar']],
      ['Inspired', 'JGL', 'PL', 23, 88, 90, 'Shotcaller', ['viego', 'skarner', 'sejuani']],
      ['Quad', 'MID', 'KR', 23, 84, 88, 'Scaling', ['orianna', 'azir', 'syndra']],
      ['Massu', 'BOT', 'CA', 20, 85, 92, 'Scaling', ['kaisa', 'varus', 'kalista']],
      ['Busio', 'SUP', 'US', 22, 83, 88, 'Playmaker', ['rell', 'rakan', 'bard']],
    ],
  },
  {
    id: 'tl', name: 'Team Liquid', tag: 'TL', region: 'LCS', color: '#1d4ed8', color2: '#ffffff',
    budget: 2900000, prestige: 87, fanbase: 86,
    roster: [
      ['Impact', 'TOP', 'KR', 30, 85, 85, 'Weakside', ['ksante', 'ornn', 'renekton']],
      ['UmTi', 'JGL', 'KR', 26, 82, 83, 'Weakside', ['sejuani', 'maokai', 'vi']],
      ['APA', 'MID', 'US', 23, 83, 87, 'Aggressive', ['taliyah', 'corki', 'aurora']],
      ['Yeon', 'BOT', 'US', 24, 86, 89, 'Aggressive', ['varus', 'kalista', 'lucian']],
      ['CoreJJ', 'SUP', 'KR', 31, 86, 86, 'Shotcaller', ['rakan', 'nautilus', 'braum']],
    ],
  },
  {
    id: 'c9', name: 'Cloud9', tag: 'C9', region: 'LCS', color: '#0ea5e9', color2: '#ffffff',
    budget: 2600000, prestige: 85, fanbase: 88,
    roster: [
      ['Thanatos', 'TOP', 'KR', 21, 83, 90, 'Aggressive', ['jax', 'ambessa', 'ksante']],
      ['Blaber', 'JGL', 'US', 25, 85, 86, 'Aggressive', ['nocturne', 'viego', 'vi']],
      ['Loki', 'MID', 'KR', 20, 81, 89, 'Playmaker', ['yone', 'ahri', 'azir']],
      ['Zven', 'BOT', 'DK', 28, 82, 82, 'Scaling', ['ezreal', 'jinx', 'ashe']],
      ['Vulcan', 'SUP', 'CA', 26, 83, 83, 'Playmaker', ['nautilus', 'alistar', 'rell']],
    ],
  },
  {
    id: '100t', name: '100 Thieves', tag: '100T', region: 'LCS', color: '#dc2626', color2: '#111111',
    budget: 2300000, prestige: 81, fanbase: 84,
    roster: [
      ['Sniper', 'TOP', 'CA', 19, 80, 90, 'Aggressive', ['aatrox', 'rumble', 'jax']],
      ['River', 'JGL', 'KR', 26, 84, 84, 'Playmaker', ['vi', 'leesin', 'jarvan']],
      ['Quid', 'MID', 'KR', 21, 84, 89, 'Playmaker', ['ahri', 'sylas', 'azir']],
      ['FBI', 'BOT', 'AU', 26, 82, 83, 'Scaling', ['varus', 'xayah', 'ashe']],
      ['Eyla', 'SUP', 'AU', 25, 80, 83, 'Weakside', ['rell', 'braum', 'renata']],
    ],
  },
  {
    id: 'sr', name: 'Shopify Rebellion', tag: 'SR', region: 'LCS', color: '#14b8a6', color2: '#111111',
    budget: 2000000, prestige: 76, fanbase: 70,
    roster: [
      ['Fudge', 'TOP', 'AU', 23, 81, 84, 'Weakside', ['ksante', 'gnar', 'jayce']],
      ['Contractz', 'JGL', 'US', 26, 81, 82, 'Aggressive', ['vi', 'viego', 'xinzhao']],
      ['Palafox', 'MID', 'US', 25, 81, 83, 'Playmaker', ['orianna', 'taliyah', 'ahri']],
      ['Bvoy', 'BOT', 'KR', 26, 81, 82, 'Scaling', ['kaisa', 'jinx', 'ezreal']],
      ['Ceos', 'SUP', 'BR', 26, 80, 82, 'Shotcaller', ['nautilus', 'rakan', 'leona']],
    ],
  },
  {
    id: 'dig', name: 'Dignitas', tag: 'DIG', region: 'LCS', color: '#eab308', color2: '#111111',
    budget: 1800000, prestige: 75, fanbase: 72,
    roster: [
      ['Srtty', 'TOP', 'US', 21, 78, 85, 'Aggressive', ['rumble', 'renekton', 'ambessa']],
      ['Spica', 'JGL', 'CN', 24, 81, 83, 'Playmaker', ['viego', 'leesin', 'vi']],
      ['Keine', 'MID', 'KR', 23, 80, 85, 'Scaling', ['azir', 'syndra', 'orianna']],
      ['Tomo', 'BOT', 'US', 24, 80, 83, 'Scaling', ['jinx', 'kaisa', 'varus']],
      ['Isles', 'SUP', 'AU', 24, 79, 82, 'Weakside', ['rell', 'braum', 'lulu']],
    ],
  },
  {
    id: 'lyon', name: 'LYON Gaming', tag: 'LYON', region: 'LCS', color: '#f59e0b', color2: '#111111',
    budget: 1700000, prestige: 74, fanbase: 73,
    roster: [
      ['Licorice', 'TOP', 'CA', 27, 80, 80, 'Weakside', ['ksante', 'ornn', 'gnar']],
      ['Oddie', 'JGL', 'PE', 27, 79, 79, 'Shotcaller', ['sejuani', 'maokai', 'vi']],
      ['Saint', 'MID', 'KR', 20, 80, 88, 'Playmaker', ['sylas', 'ahri', 'yone']],
      ['Hena', 'BOT', 'KR', 25, 80, 82, 'Scaling', ['ezreal', 'varus', 'ashe']],
      ['Lyonz', 'SUP', 'AR', 22, 78, 84, 'Playmaker', ['rakan', 'nautilus', 'alistar']],
    ],
  },
  {
    id: 'disg', name: 'Disguised', tag: 'DSG', region: 'LCS', color: '#64748b', color2: '#ffffff',
    budget: 1650000, prestige: 73, fanbase: 79,
    roster: [
      ['Castle', 'TOP', 'KR', 22, 79, 85, 'Weakside', ['ksante', 'renekton', 'aatrox']],
      ['eXyu', 'JGL', 'US', 22, 78, 84, 'Aggressive', ['viego', 'vi', 'jarvan']],
      ['Abbedagge', 'MID', 'DE', 26, 80, 80, 'Scaling', ['orianna', 'azir', 'corki']],
      ['ScaryJerry', 'BOT', 'US', 20, 77, 86, 'Aggressive', ['kaisa', 'lucian', 'ezreal']],
      ['huhi', 'SUP', 'KR', 30, 81, 81, 'Shotcaller', ['nautilus', 'renata', 'braum']],
    ],
  },
];

// Free Agents & Academy Wonderkids available on Transfer Market
const RAW_FREE_AGENTS = [
  ['Nuguri', 'TOP', 'KR', 26, 86, 86, 'Aggressive', ['kennen', 'camille', 'jayce']],
  ['Wunder', 'TOP', 'DK', 27, 82, 82, 'Weakside', ['ornn', 'gnar', 'ksante']],
  ['Adam', 'TOP', 'FR', 24, 81, 84, 'Aggressive', ['renekton', 'aatrox', 'ambessa']],
  ['Armut', 'TOP', 'TR', 26, 80, 81, 'Teamfight', ['gnar', 'rumble', 'ksante']],
  ['Photon', 'TOP', 'KR', 24, 83, 86, 'Aggressive', ['jayce', 'jax', 'rumble']],
  ['Jankos', 'JGL', 'PL', 30, 83, 83, 'Shotcaller', ['sejuani', 'leesin', 'jarvan']],
  ['Clid', 'JGL', 'KR', 26, 83, 83, 'Aggressive', ['leesin', 'vi', 'xinzhao']],
  ['Karsa', 'JGL', 'TW', 28, 83, 83, 'Playmaker', ['leesin', 'viego', 'jarvan']],
  ['Bo', 'JGL', 'CN', 23, 84, 89, 'Aggressive', ['nidalee', 'viego', 'leesin']],
  ['Selfmade', 'JGL', 'PL', 25, 81, 83, 'Aggressive', ['viego', 'nidalee', 'nocturne']],
  ['Perkz', 'MID', 'HR', 27, 82, 82, 'Shotcaller', ['leblanc', 'ahri', 'syndra']],
  ['Nisqy', 'MID', 'BE', 27, 82, 82, 'Playmaker', ['taliyah', 'sylas', 'ahri']],
  ['Jensen', 'MID', 'DK', 30, 81, 81, 'Scaling', ['orianna', 'syndra', 'azir']],
  ['Clozer', 'MID', 'KR', 22, 84, 89, 'Aggressive', ['akali', 'sylas', 'yone']],
  ['Yagao', 'MID', 'CN', 27, 85, 85, 'Weakside', ['taliyah', 'azir', 'ahri']],
  ['Deft', 'BOT', 'KR', 29, 86, 86, 'Scaling', ['ezreal', 'jinx', 'varus']],
  ['Rekkles', 'SUP', 'SE', 29, 82, 82, 'Weakside', ['renata', 'lulu', 'milio']],
  ['Doublelift', 'BOT', 'US', 32, 81, 81, 'Aggressive', ['lucian', 'kaisa', 'jinx']],
  ['Smash', 'BOT', 'KR', 19, 83, 93, 'Aggressive', ['kaisa', 'ezreal', 'zeri']],
  ['Diable', 'BOT', 'KR', 18, 80, 92, 'Aggressive', ['kalista', 'kaisa', 'lucian']],
  ['Ming', 'SUP', 'CN', 26, 86, 86, 'Playmaker', ['nautilus', 'rakan', 'alistar']],
  ['Kaiser', 'SUP', 'DE', 26, 81, 82, 'Playmaker', ['rell', 'leona', 'alistar']],
  ['Trymbi', 'SUP', 'PL', 25, 82, 83, 'Shotcaller', ['renata', 'rakan', 'braum']],
  ['Zinie', 'MID', 'KR', 19, 81, 92, 'Playmaker', ['azir', 'aurora', 'yone']],
  ['Poby', 'MID', 'KR', 19, 78, 88, 'Scaling', ['orianna', 'azir', 'taliyah']],
  ['Guwon', 'JGL', 'KR', 21, 79, 87, 'Playmaker', ['vi', 'viego', 'leesin']],
  ['StarScreen', 'TOP', 'TR', 24, 77, 82, 'Aggressive', ['aatrox', 'jax', 'gnar']],
  ['Luger', 'BOT', 'TR', 24, 80, 84, 'Scaling', ['jinx', 'kaisa', 'aphelios']],
  ['Blue', 'MID', 'TR', 24, 79, 83, 'Playmaker', ['ahri', 'syndra', 'leblanc']],
  ['Jactroll', 'SUP', 'PL', 26, 77, 79, 'Playmaker', ['nautilus', 'thresh', 'rakan']],
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
      budget: rt.budget,
      prestige: rt.prestige,
      fanbase: rt.fanbase,
      synergy: 68 + Math.floor(Math.random() * 14),
      facilities: {
        gamingHouse: rt.prestige >= 90 ? 3 : rt.prestige >= 82 ? 2 : 1,
        analystDesk: rt.prestige >= 90 ? 3 : rt.prestige >= 80 ? 2 : 1,
        youthAcademy: rt.prestige >= 88 ? 2 : 1,
        psychologist: rt.prestige >= 90 ? 2 : 1,
      },
      trainingFocus: 'balanced',
      tactics: {
        gameplan: 'balanced', // aggressive | balanced | scaling | split
        laneFocus: 'MID',     // TOP | MID | BOT
        objective: 'dragon',  // dragon | baron | towers
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

// Generate an academy regen player for Off-Season or Youth Promotion
const REGEN_FIRST = ['Kael', 'Jin', 'Vex', 'Sora', 'Miro', 'Luka', 'Haneul', 'Ryu', 'Taro', 'Arda', 'Eren', 'Neo', 'Kiro', 'Zed', 'Yoon', 'Dae', 'Milo', 'Nox', 'Faye', 'Sven'];
const REGEN_SUF = ['X', '7', 'gg', 'KR', 'zy', 'on', 'ix', 'el', 'ar', '', '', '', ''];
const REGION_NATS = { LCK: ['KR'], LPL: ['CN', 'TW'], LEC: ['FR', 'DE', 'ES', 'PL', 'SE', 'DK', 'TR'], LCS: ['US', 'CA', 'AU', 'BR'] };

export function generateRegenPlayer(role, region, academyLevel = 1, teamId = null) {
  const nats = REGION_NATS[region] || ['KR'];
  const nat = nats[Math.floor(Math.random() * nats.length)];
  const name = REGEN_FIRST[Math.floor(Math.random() * REGEN_FIRST.length)] + REGEN_SUF[Math.floor(Math.random() * REGEN_SUF.length)] + (Math.random() < 0.25 ? Math.floor(Math.random() * 99) : '');
  const age = 17 + Math.floor(Math.random() * 3);
  const baseOvr = 68 + academyLevel * 3 + Math.floor(Math.random() * 8);
  const pot = Math.min(97, baseOvr + 8 + academyLevel * 2 + Math.floor(Math.random() * 8));
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

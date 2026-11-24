// LoL Esports Manager v2.0 — Champions Database (55 Pro-Play Champions + Counter Matchups)

export const CHAMPIONS = [
  // TOP
  { id: 'ksante', name: "K'Sante", roles: ['TOP'], dmg: 'Tank', early: 6, mid: 8, late: 8, engage: 8, classTag: 'Tank', baseTier: 'S', color: '#c89b3c', counters: ['aatrox', 'renekton', 'ornn'] },
  { id: 'rumble', name: 'Rumble', roles: ['TOP'], dmg: 'AP', early: 8, mid: 9, late: 7, engage: 8, classTag: 'Teamfight', baseTier: 'S', color: '#e67e22', counters: ['ksante', 'gnar', 'ornn'] },
  { id: 'aatrox', name: 'Aatrox', roles: ['TOP'], dmg: 'AD', early: 7, mid: 9, late: 7, engage: 7, classTag: 'Bruiser', baseTier: 'A', color: '#c0392b', counters: ['rumble', 'jayce', 'kennen'] },
  { id: 'jax', name: 'Jax', roles: ['TOP'], dmg: 'AD', early: 6, mid: 8, late: 9, engage: 7, classTag: 'Split', baseTier: 'A', color: '#8e44ad', counters: ['camille', 'aatrox', 'ambessa'] },
  { id: 'gnar', name: 'Gnar', roles: ['TOP'], dmg: 'AD', early: 7, mid: 8, late: 8, engage: 9, classTag: 'Teamfight', baseTier: 'A', color: '#d35400', counters: ['ksante', 'ornn', 'renekton'] },
  { id: 'renekton', name: 'Renekton', roles: ['TOP'], dmg: 'AD', early: 9, mid: 8, late: 5, engage: 7, classTag: 'Bruiser', baseTier: 'A', color: '#27ae60', counters: ['jax', 'camille', 'ambessa'] },
  { id: 'jayce', name: 'Jayce', roles: ['TOP', 'MID'], dmg: 'AD', early: 9, mid: 8, late: 6, engage: 3, classTag: 'Poke', baseTier: 'A', color: '#2980b9', counters: ['gnar', 'rumble', 'ornn'] },
  { id: 'camille', name: 'Camille', roles: ['TOP'], dmg: 'AD', early: 6, mid: 8, late: 9, engage: 8, classTag: 'Split', baseTier: 'B', color: '#5dade2', counters: ['jayce', 'kennen', 'rumble'] },
  { id: 'ornn', name: 'Ornn', roles: ['TOP'], dmg: 'Tank', early: 5, mid: 8, late: 9, engage: 9, classTag: 'Tank', baseTier: 'A', color: '#e74c3c', counters: ['renekton', 'kennen'] },
  { id: 'ambessa', name: 'Ambessa', roles: ['TOP'], dmg: 'AD', early: 7, mid: 9, late: 8, engage: 8, classTag: 'Bruiser', baseTier: 'S', color: '#a93226', counters: ['ksante', 'jayce', 'gnar'] },
  { id: 'kennen', name: 'Kennen', roles: ['TOP'], dmg: 'AP', early: 7, mid: 9, late: 8, engage: 9, classTag: 'Teamfight', baseTier: 'B', color: '#9b59b6', counters: ['renekton', 'jax'] },
  { id: 'gragas', name: 'Gragas', roles: ['TOP', 'JGL'], dmg: 'AP', early: 7, mid: 8, late: 8, engage: 8, classTag: 'Teamfight', baseTier: 'A', color: '#d35400', counters: ['jax', 'aatrox'] },
  { id: 'sion', name: 'Sion', roles: ['TOP'], dmg: 'Tank', early: 6, mid: 8, late: 8, engage: 8, classTag: 'Tank', baseTier: 'B', color: '#7f8c8d', counters: ['jayce', 'kennen'] },
  { id: 'fiora', name: 'Fiora', roles: ['TOP'], dmg: 'AD', early: 7, mid: 8, late: 9, engage: 3, classTag: 'Split', baseTier: 'B', color: '#c0392b', counters: ['ksante', 'ornn', 'sion'] },
  { id: 'udyr', name: 'Udyr', roles: ['TOP', 'JGL'], dmg: 'Tank', early: 7, mid: 8, late: 7, engage: 6, classTag: 'Tank', baseTier: 'B', color: '#16a085', counters: ['rumble', 'gnar'] },

  // JUNGLE
  { id: 'vi', name: 'Vi', roles: ['JGL'], dmg: 'AD', early: 8, mid: 9, late: 6, engage: 9, classTag: 'Dive', baseTier: 'S', color: '#e84393', counters: ['viego', 'nidalee', 'nocturne'] },
  { id: 'viego', name: 'Viego', roles: ['JGL'], dmg: 'AD', early: 7, mid: 9, late: 8, engage: 6, classTag: 'Skirmish', baseTier: 'S', color: '#1abc9c', counters: ['sejuani', 'maokai', 'skarner'] },
  { id: 'sejuani', name: 'Sejuani', roles: ['JGL'], dmg: 'Tank', early: 7, mid: 8, late: 8, engage: 9, classTag: 'Tank', baseTier: 'A', color: '#3498db', counters: ['leesin', 'xinzhao'] },
  { id: 'maokai', name: 'Maokai', roles: ['JGL', 'SUP'], dmg: 'Tank', early: 6, mid: 9, late: 8, engage: 9, classTag: 'Tank', baseTier: 'A', color: '#16a085', counters: ['vi', 'jarvan'] },
  { id: 'leesin', name: 'Lee Sin', roles: ['JGL'], dmg: 'AD', early: 9, mid: 8, late: 5, engage: 8, classTag: 'Skirmish', baseTier: 'A', color: '#d35400', counters: ['nidalee', 'viego', 'nocturne'] },
  { id: 'xinzhao', name: 'Xin Zhao', roles: ['JGL'], dmg: 'AD', early: 9, mid: 8, late: 5, engage: 8, classTag: 'Dive', baseTier: 'A', color: '#2980b9', counters: ['leesin', 'nidalee', 'vi'] },
  { id: 'nidalee', name: 'Nidalee', roles: ['JGL'], dmg: 'AP', early: 9, mid: 8, late: 5, engage: 2, classTag: 'Poke', baseTier: 'B', color: '#f39c12', counters: ['maokai', 'sejuani', 'skarner'] },
  { id: 'jarvan', name: 'Jarvan IV', roles: ['JGL'], dmg: 'AD', early: 8, mid: 8, late: 6, engage: 9, classTag: 'Dive', baseTier: 'A', color: '#f1c40f', counters: ['nidalee', 'viego'] },
  { id: 'skarner', name: 'Skarner', roles: ['JGL', 'TOP'], dmg: 'Tank', early: 7, mid: 9, late: 8, engage: 9, classTag: 'Tank', baseTier: 'S', color: '#7f8c8d', counters: ['vi', 'xinzhao', 'jarvan'] },
  { id: 'nocturne', name: 'Nocturne', roles: ['JGL'], dmg: 'AD', early: 7, mid: 9, late: 6, engage: 9, classTag: 'Dive', baseTier: 'B', color: '#34495e', counters: ['nidalee', 'maokai'] },
  { id: 'poppy', name: 'Poppy', roles: ['JGL', 'SUP', 'TOP'], dmg: 'Tank', early: 8, mid: 8, late: 7, engage: 7, classTag: 'Tank', baseTier: 'A', color: '#5499c7', counters: ['vi', 'leesin', 'jarvan', 'xinzhao'] },
  { id: 'wukong', name: 'Wukong', roles: ['JGL', 'TOP'], dmg: 'AD', early: 7, mid: 9, late: 7, engage: 9, classTag: 'Dive', baseTier: 'A', color: '#e67e22', counters: ['viego', 'nidalee'] },
  { id: 'lillia', name: 'Lillia', roles: ['JGL'], dmg: 'AP', early: 6, mid: 9, late: 9, engage: 7, classTag: 'Teamfight', baseTier: 'A', color: '#ec4899', counters: ['sejuani', 'maokai', 'skarner'] },
  { id: 'graves', name: 'Graves', roles: ['JGL'], dmg: 'AD', early: 8, mid: 8, late: 8, engage: 3, classTag: 'Skirmish', baseTier: 'B', color: '#92400e', counters: ['nidalee', 'leesin'] },
  { id: 'zyra', name: 'Zyra', roles: ['JGL', 'SUP'], dmg: 'AP', early: 8, mid: 8, late: 7, engage: 6, classTag: 'Poke', baseTier: 'B', color: '#15803d', counters: ['maokai', 'sejuani'] },

  // MID
  { id: 'azir', name: 'Azir', roles: ['MID'], dmg: 'AP', early: 6, mid: 8, late: 10, engage: 8, classTag: 'Scaling', baseTier: 'S', color: '#f1c40f', counters: ['orianna', 'taliyah', 'corki'] },
  { id: 'orianna', name: 'Orianna', roles: ['MID'], dmg: 'AP', early: 7, mid: 9, late: 9, engage: 8, classTag: 'Teamfight', baseTier: 'S', color: '#7fb3d5', counters: ['ahri', 'sylas', 'akali'] },
  { id: 'ahri', name: 'Ahri', roles: ['MID'], dmg: 'AP', early: 7, mid: 9, late: 7, engage: 7, classTag: 'Skirmish', baseTier: 'A', color: '#ff7675', counters: ['syndra', 'taliyah', 'leblanc'] },
  { id: 'sylas', name: 'Sylas', roles: ['MID'], dmg: 'AP', early: 6, mid: 9, late: 8, engage: 8, classTag: 'Skirmish', baseTier: 'A', color: '#6c5ce7', counters: ['ahri', 'azir', 'aurora'] },
  { id: 'yone', name: 'Yone', roles: ['MID', 'TOP'], dmg: 'AD', early: 6, mid: 9, late: 9, engage: 8, classTag: 'Skirmish', baseTier: 'S', color: '#e17055', counters: ['syndra', 'orianna', 'corki'] },
  { id: 'taliyah', name: 'Taliyah', roles: ['MID', 'JGL'], dmg: 'AP', early: 7, mid: 9, late: 8, engage: 7, classTag: 'Teamfight', baseTier: 'A', color: '#d4ac0d', counters: ['sylas', 'akali', 'leblanc', 'yone'] },
  { id: 'corki', name: 'Corki', roles: ['MID', 'BOT'], dmg: 'AD', early: 8, mid: 9, late: 7, engage: 3, classTag: 'Poke', baseTier: 'A', color: '#e67e22', counters: ['orianna', 'syndra'] },
  { id: 'syndra', name: 'Syndra', roles: ['MID'], dmg: 'AP', early: 8, mid: 9, late: 8, engage: 5, classTag: 'Teamfight', baseTier: 'A', color: '#8e44ad', counters: ['azir', 'aurora', 'taliyah'] },
  { id: 'akali', name: 'Akali', roles: ['MID'], dmg: 'AP', early: 6, mid: 9, late: 7, engage: 6, classTag: 'Assassin', baseTier: 'B', color: '#2ecc71', counters: ['yone', 'azir', 'corki'] },
  { id: 'leblanc', name: 'LeBlanc', roles: ['MID'], dmg: 'AP', early: 9, mid: 8, late: 5, engage: 5, classTag: 'Assassin', baseTier: 'B', color: '#9b59b6', counters: ['azir', 'syndra', 'orianna'] },
  { id: 'aurora', name: 'Aurora', roles: ['MID', 'TOP'], dmg: 'AP', early: 7, mid: 9, late: 8, engage: 8, classTag: 'Teamfight', baseTier: 'S', color: '#48dbfb', counters: ['yone', 'akali', 'orianna'] },
  { id: 'hwei', name: 'Hwei', roles: ['MID'], dmg: 'AP', early: 7, mid: 9, late: 8, engage: 6, classTag: 'Poke', baseTier: 'A', color: '#38bdf8', counters: ['orianna', 'azir'] },
  { id: 'viktor', name: 'Viktor', roles: ['MID'], dmg: 'AP', early: 6, mid: 8, late: 10, engage: 4, classTag: 'Scaling', baseTier: 'A', color: '#a855f7', counters: ['taliyah', 'syndra'] },
  { id: 'neeko', name: 'Neeko', roles: ['MID', 'SUP'], dmg: 'AP', early: 8, mid: 9, late: 7, engage: 9, classTag: 'Teamfight', baseTier: 'A', color: '#22c55e', counters: ['ahri', 'leblanc'] },
  { id: 'ryze', name: 'Ryze', roles: ['MID'], dmg: 'AP', early: 6, mid: 8, late: 9, engage: 6, classTag: 'Scaling', baseTier: 'B', color: '#2563eb', counters: ['akali', 'sylas'] },

  // BOT (ADC)
  { id: 'kaisa', name: "Kai'Sa", roles: ['BOT'], dmg: 'AD', early: 6, mid: 9, late: 9, engage: 5, classTag: 'Hypercarry', baseTier: 'S', color: '#8e44ad', counters: ['ezreal', 'smolder', 'aphelios'] },
  { id: 'varus', name: 'Varus', roles: ['BOT'], dmg: 'AD', early: 9, mid: 8, late: 7, engage: 7, classTag: 'Poke', baseTier: 'S', color: '#9b59b6', counters: ['kaisa', 'jinx', 'zeri'] },
  { id: 'xayah', name: 'Xayah', roles: ['BOT'], dmg: 'AD', early: 7, mid: 8, late: 9, engage: 4, classTag: 'Hypercarry', baseTier: 'A', color: '#c0392b', counters: ['kaisa', 'kalista', 'lucian'] },
  { id: 'jinx', name: 'Jinx', roles: ['BOT'], dmg: 'AD', early: 5, mid: 8, late: 10, engage: 3, classTag: 'Hypercarry', baseTier: 'A', color: '#3498db', counters: ['xayah', 'aphelios', 'ezreal'] },
  { id: 'ezreal', name: 'Ezreal', roles: ['BOT'], dmg: 'AD', early: 8, mid: 9, late: 7, engage: 2, classTag: 'Poke', baseTier: 'A', color: '#f1c40f', counters: ['ashe', 'varus', 'kalista'] },
  { id: 'kalista', name: 'Kalista', roles: ['BOT'], dmg: 'AD', early: 10, mid: 8, late: 5, engage: 7, classTag: 'Dive', baseTier: 'A', color: '#1abc9c', counters: ['jinx', 'zeri', 'smolder'] },
  { id: 'lucian', name: 'Lucian', roles: ['BOT', 'MID'], dmg: 'AD', early: 9, mid: 8, late: 6, engage: 4, classTag: 'Skirmish', baseTier: 'A', color: '#ecf0f1', counters: ['kaisa', 'jinx', 'aphelios'] },
  { id: 'ashe', name: 'Ashe', roles: ['BOT'], dmg: 'AD', early: 8, mid: 8, late: 7, engage: 9, classTag: 'Teamfight', baseTier: 'S', color: '#5dade2', counters: ['kalista', 'lucian', 'varus'] },
  { id: 'zeri', name: 'Zeri', roles: ['BOT'], dmg: 'AD', early: 5, mid: 8, late: 10, engage: 4, classTag: 'Hypercarry', baseTier: 'A', color: '#2ecc71', counters: ['ezreal', 'xayah', 'ashe'] },
  { id: 'aphelios', name: 'Aphelios', roles: ['BOT'], dmg: 'AD', early: 6, mid: 8, late: 10, engage: 4, classTag: 'Hypercarry', baseTier: 'B', color: '#5499c7', counters: ['varus', 'ashe'] },
  { id: 'smolder', name: 'Smolder', roles: ['BOT', 'MID'], dmg: 'AD', early: 4, mid: 7, late: 10, engage: 3, classTag: 'Scaling', baseTier: 'B', color: '#e74c3c', counters: ['jinx', 'aphelios'] },
  { id: 'caitlyn', name: 'Caitlyn', roles: ['BOT'], dmg: 'AD', early: 9, mid: 7, late: 9, engage: 3, classTag: 'Poke', baseTier: 'A', color: '#6366f1', counters: ['kaisa', 'xayah', 'vayne'] },
  { id: 'sivir', name: 'Sivir', roles: ['BOT'], dmg: 'AD', early: 6, mid: 8, late: 9, engage: 6, classTag: 'Hypercarry', baseTier: 'B', color: '#eab308', counters: ['ashe', 'varus'] },
  { id: 'draven', name: 'Draven', roles: ['BOT'], dmg: 'AD', early: 10, mid: 8, late: 6, engage: 3, classTag: 'Skirmish', baseTier: 'B', color: '#dc2626', counters: ['kaisa', 'ezreal', 'jinx'] },
  { id: 'tristana', name: 'Tristana', roles: ['BOT', 'MID'], dmg: 'AD', early: 8, mid: 8, late: 9, engage: 5, classTag: 'Hypercarry', baseTier: 'A', color: '#f97316', counters: ['smolder', 'aphelios'] },

  // SUPPORT
  { id: 'rell', name: 'Rell', roles: ['SUP'], dmg: 'Tank', early: 7, mid: 9, late: 8, engage: 10, classTag: 'Tank', baseTier: 'S', color: '#f39c12', counters: ['leona', 'nautilus', 'lulu'] },
  { id: 'nautilus', name: 'Nautilus', roles: ['SUP'], dmg: 'Tank', early: 8, mid: 8, late: 7, engage: 10, classTag: 'Tank', baseTier: 'S', color: '#2c3e50', counters: ['lulu', 'milio', 'bard'] },
  { id: 'leona', name: 'Leona', roles: ['SUP'], dmg: 'Tank', early: 8, mid: 9, late: 7, engage: 10, classTag: 'Tank', baseTier: 'A', color: '#f1c40f', counters: ['nautilus', 'lulu', 'rakan'] },
  { id: 'rakan', name: 'Rakan', roles: ['SUP'], dmg: 'Tank', early: 7, mid: 9, late: 8, engage: 9, classTag: 'Dive', baseTier: 'S', color: '#e67e22', counters: ['renata', 'bard', 'milio'] },
  { id: 'renata', name: 'Renata Glasc', roles: ['SUP'], dmg: 'AP', early: 7, mid: 8, late: 9, engage: 6, classTag: 'Teamfight', baseTier: 'A', color: '#8e44ad', counters: ['rell', 'nautilus', 'leona', 'alistar'] },
  { id: 'alistar', name: 'Alistar', roles: ['SUP'], dmg: 'Tank', early: 7, mid: 9, late: 8, engage: 9, classTag: 'Tank', baseTier: 'A', color: '#5b2c6f', counters: ['leona', 'rakan', 'nautilus'] },
  { id: 'braum', name: 'Braum', roles: ['SUP'], dmg: 'Tank', early: 7, mid: 8, late: 8, engage: 6, classTag: 'Tank', baseTier: 'A', color: '#3498db', counters: ['nautilus', 'rell', 'alistar'] },
  { id: 'thresh', name: 'Thresh', roles: ['SUP'], dmg: 'Tank', early: 8, mid: 8, late: 7, engage: 8, classTag: 'Skirmish', baseTier: 'A', color: '#1abc9c', counters: ['leona', 'rakan', 'alistar'] },
  { id: 'bard', name: 'Bard', roles: ['SUP'], dmg: 'AP', early: 7, mid: 9, late: 8, engage: 8, classTag: 'Skirmish', baseTier: 'B', color: '#f5b041', counters: ['braum', 'renata'] },
  { id: 'lulu', name: 'Lulu', roles: ['SUP'], dmg: 'AP', early: 7, mid: 8, late: 9, engage: 3, classTag: 'Hypercarry', baseTier: 'B', color: '#af7ac5', counters: ['braum', 'thresh'] },
  { id: 'milio', name: 'Milio', roles: ['SUP'], dmg: 'AP', early: 6, mid: 8, late: 9, engage: 2, classTag: 'Hypercarry', baseTier: 'B', color: '#eb984e', counters: ['braum', 'renata'] },
  { id: 'karma', name: 'Karma', roles: ['SUP', 'MID'], dmg: 'AP', early: 9, mid: 8, late: 6, engage: 4, classTag: 'Poke', baseTier: 'A', color: '#10b981', counters: ['braum', 'alistar'] },
  { id: 'tahmkench', name: 'Tahm Kench', roles: ['SUP', 'TOP'], dmg: 'Tank', early: 7, mid: 8, late: 8, engage: 5, classTag: 'Tank', baseTier: 'A', color: '#0f766e', counters: ['nautilus', 'leona'] },
  { id: 'pyke', name: 'Pyke', roles: ['SUP'], dmg: 'AD', early: 9, mid: 8, late: 5, engage: 8, classTag: 'Assassin', baseTier: 'B', color: '#0ea5e9', counters: ['lulu', 'milio'] },
  { id: 'blitzcrank', name: 'Blitzcrank', roles: ['SUP'], dmg: 'Tank', early: 8, mid: 8, late: 6, engage: 9, classTag: 'Skirmish', baseTier: 'B', color: '#eab308', counters: ['lulu', 'karma'] },
];

export const CHAMPION_MAP = Object.fromEntries(CHAMPIONS.map(c => [c.id, c]));

export const PATCHES = [
  {
    version: '26.1',
    name: 'Erken Oyun & Ejder Baskısı',
    desc: 'Erken koridor hakimiyeti ve ilk iki ejderin altın/stat değeri artırıldı. Agresif ormancılar ve erken güçlü nişancılar öne çıkıyor.',
    buffedClasses: ['Dive', 'Skirmish', 'Bruiser'],
    nerfedClasses: ['Scaling'],
    earlyWeight: 1.18,
    midWeight: 1.0,
    lateWeight: 0.9,
  },
  {
    version: '26.2',
    name: 'Hypercarry & Geç Oyun Metası',
    desc: 'Kritik vuruş eşyaları güçlendirildi ve kule plakası altını azaltıldı. Geç oyunda parlayan nişancılar ve koruyucu destekler meta lideri.',
    buffedClasses: ['Hypercarry', 'Scaling'],
    nerfedClasses: ['Assassin', 'Dive'],
    earlyWeight: 0.9,
    midWeight: 1.0,
    lateWeight: 1.2,
  },
  {
    version: '26.3',
    name: 'Tank & Takım Savaşı Metası',
    desc: 'Ön saflardaki tank eşyaları ve alan hasarı büyücüleri güçlendi. Baron ve Ejder çevresindeki 5v5 savaşlar maçları belirliyor.',
    buffedClasses: ['Tank', 'Teamfight'],
    nerfedClasses: ['Poke', 'Split'],
    earlyWeight: 0.95,
    midWeight: 1.15,
    lateWeight: 1.05,
  },
  {
    version: '26.4',
    name: 'Suikastçı & Skirmish Kaosu',
    desc: 'Hiçlik Kurtçukları güçlendi, orta koridor suikastçıları ve bireysel mekanik odaklı şampiyonlar bufflandı.',
    buffedClasses: ['Assassin', 'Skirmish', 'Split'],
    nerfedClasses: ['Tank'],
    earlyWeight: 1.15,
    midWeight: 1.12,
    lateWeight: 0.88,
  },
  {
    version: '26.5',
    name: 'Worlds Dengeli Meta',
    desc: 'Uluslararası turnuva öncesi tüm sınıflar dengelendi. Takım sinerjisi, draft uyumu ve oyuncu şampiyon havuzu her zamankinden önemli.',
    buffedClasses: ['Teamfight', 'Hypercarry', 'Tank'],
    nerfedClasses: [],
    earlyWeight: 1.02,
    midWeight: 1.05,
    lateWeight: 1.05,
  },
];

export function getChampionMetaTier(champ, patch) {
  const tiers = ['C', 'B', 'A', 'S'];
  let idx = tiers.indexOf(champ.baseTier);
  if (patch.buffedClasses.includes(champ.classTag)) idx = Math.min(3, idx + 1);
  if (patch.nerfedClasses.includes(champ.classTag)) idx = Math.max(0, idx - 1);
  return tiers[idx];
}

export function getTierBonus(tier) {
  return tier === 'S' ? 4.5 : tier === 'A' ? 2.0 : tier === 'B' ? 0 : -2.5;
}

export function getMatchupAdvantage(champIdA, champIdB) {
  const a = CHAMPION_MAP[champIdA];
  const b = CHAMPION_MAP[champIdB];
  if (!a || !b) return 0;
  if (a.counters?.includes(b.id)) return 2.5;
  if (b.counters?.includes(a.id)) return -2.5;
  return 0;
}

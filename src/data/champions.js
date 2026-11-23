// LoL Esports Manager — Champions Database (55 Pro-Play Champions)
// Each champion has roles, damageType, powerCurve (early/mid/late 1-10), engage (1-10),
// baseTier ('S'|'A'|'B'|'C'), classTag, and color accent for visual icons.

export const CHAMPIONS = [
  // TOP
  { id: 'ksante', name: "K'Sante", roles: ['TOP'], dmg: 'Tank', early: 6, mid: 8, late: 8, engage: 8, classTag: 'Tank', baseTier: 'S', color: '#c89b3c' },
  { id: 'rumble', name: 'Rumble', roles: ['TOP'], dmg: 'AP', early: 8, mid: 9, late: 7, engage: 8, classTag: 'Teamfight', baseTier: 'S', color: '#e67e22' },
  { id: 'aatrox', name: 'Aatrox', roles: ['TOP'], dmg: 'AD', early: 7, mid: 9, late: 7, engage: 7, classTag: 'Bruiser', baseTier: 'A', color: '#c0392b' },
  { id: 'jax', name: 'Jax', roles: ['TOP'], dmg: 'AD', early: 6, mid: 8, late: 9, engage: 7, classTag: 'Split', baseTier: 'A', color: '#8e44ad' },
  { id: 'gnar', name: 'Gnar', roles: ['TOP'], dmg: 'AD', early: 7, mid: 8, late: 8, engage: 9, classTag: 'Teamfight', baseTier: 'A', color: '#d35400' },
  { id: 'renekton', name: 'Renekton', roles: ['TOP'], dmg: 'AD', early: 9, mid: 8, late: 5, engage: 7, classTag: 'Bruiser', baseTier: 'A', color: '#27ae60' },
  { id: 'jayce', name: 'Jayce', roles: ['TOP', 'MID'], dmg: 'AD', early: 9, mid: 8, late: 6, engage: 3, classTag: 'Poke', baseTier: 'A', color: '#2980b9' },
  { id: 'camille', name: 'Camille', roles: ['TOP'], dmg: 'AD', early: 6, mid: 8, late: 9, engage: 8, classTag: 'Split', baseTier: 'B', color: '#5dade2' },
  { id: 'ornn', name: 'Ornn', roles: ['TOP'], dmg: 'Tank', early: 5, mid: 8, late: 9, engage: 9, classTag: 'Tank', baseTier: 'A', color: '#e74c3c' },
  { id: 'ambessa', name: 'Ambessa', roles: ['TOP'], dmg: 'AD', early: 7, mid: 9, late: 8, engage: 8, classTag: 'Bruiser', baseTier: 'S', color: '#a93226' },
  { id: 'kennen', name: 'Kennen', roles: ['TOP'], dmg: 'AP', early: 7, mid: 9, late: 8, engage: 9, classTag: 'Teamfight', baseTier: 'B', color: '#9b59b6' },

  // JUNGLE
  { id: 'vi', name: 'Vi', roles: ['JGL'], dmg: 'AD', early: 8, mid: 9, late: 6, engage: 9, classTag: 'Dive', baseTier: 'S', color: '#e84393' },
  { id: 'viego', name: 'Viego', roles: ['JGL'], dmg: 'AD', early: 7, mid: 9, late: 8, engage: 6, classTag: 'Skirmish', baseTier: 'S', color: '#1abc9c' },
  { id: 'sejuani', name: 'Sejuani', roles: ['JGL'], dmg: 'Tank', early: 7, mid: 8, late: 8, engage: 9, classTag: 'Tank', baseTier: 'A', color: '#3498db' },
  { id: 'maokai', name: 'Maokai', roles: ['JGL', 'SUP'], dmg: 'Tank', early: 6, mid: 9, late: 8, engage: 9, classTag: 'Tank', baseTier: 'A', color: '#16a085' },
  { id: 'leesin', name: 'Lee Sin', roles: ['JGL'], dmg: 'AD', early: 9, mid: 8, late: 5, engage: 8, classTag: 'Skirmish', baseTier: 'A', color: '#d35400' },
  { id: 'xinzhao', name: 'Xin Zhao', roles: ['JGL'], dmg: 'AD', early: 9, mid: 8, late: 5, engage: 8, classTag: 'Dive', baseTier: 'A', color: '#2980b9' },
  { id: 'nidalee', name: 'Nidalee', roles: ['JGL'], dmg: 'AP', early: 9, mid: 8, late: 5, engage: 2, classTag: 'Poke', baseTier: 'B', color: '#f39c12' },
  { id: 'jarvan', name: 'Jarvan IV', roles: ['JGL'], dmg: 'AD', early: 8, mid: 8, late: 6, engage: 9, classTag: 'Dive', baseTier: 'A', color: '#f1c40f' },
  { id: 'skarner', name: 'Skarner', roles: ['JGL', 'TOP'], dmg: 'Tank', early: 7, mid: 9, late: 8, engage: 9, classTag: 'Tank', baseTier: 'S', color: '#7f8c8d' },
  { id: 'nocturne', name: 'Nocturne', roles: ['JGL'], dmg: 'AD', early: 7, mid: 9, late: 6, engage: 9, classTag: 'Dive', baseTier: 'B', color: '#34495e' },
  { id: 'poppy', name: 'Poppy', roles: ['JGL', 'SUP', 'TOP'], dmg: 'Tank', early: 8, mid: 8, late: 7, engage: 7, classTag: 'Tank', baseTier: 'A', color: '#5499c7' },

  // MID
  { id: 'azir', name: 'Azir', roles: ['MID'], dmg: 'AP', early: 6, mid: 8, late: 10, engage: 8, classTag: 'Scaling', baseTier: 'S', color: '#f1c40f' },
  { id: 'orianna', name: 'Orianna', roles: ['MID'], dmg: 'AP', early: 7, mid: 9, late: 9, engage: 8, classTag: 'Teamfight', baseTier: 'S', color: '#7fb3d5' },
  { id: 'ahri', name: 'Ahri', roles: ['MID'], dmg: 'AP', early: 7, mid: 9, late: 7, engage: 7, classTag: 'Skirmish', baseTier: 'A', color: '#ff7675' },
  { id: 'sylas', name: 'Sylas', roles: ['MID'], dmg: 'AP', early: 6, mid: 9, late: 8, engage: 8, classTag: 'Skirmish', baseTier: 'A', color: '#6c5ce7' },
  { id: 'yone', name: 'Yone', roles: ['MID', 'TOP'], dmg: 'AD', early: 6, mid: 9, late: 9, engage: 8, classTag: 'Skirmish', baseTier: 'S', color: '#e17055' },
  { id: 'taliyah', name: 'Taliyah', roles: ['MID', 'JGL'], dmg: 'AP', early: 7, mid: 9, late: 8, engage: 7, classTag: 'Teamfight', baseTier: 'A', color: '#d4ac0d' },
  { id: 'corki', name: 'Corki', roles: ['MID', 'BOT'], dmg: 'AD', early: 8, mid: 9, late: 7, engage: 3, classTag: 'Poke', baseTier: 'A', color: '#e67e22' },
  { id: 'syndra', name: 'Syndra', roles: ['MID'], dmg: 'AP', early: 8, mid: 9, late: 8, engage: 5, classTag: 'Teamfight', baseTier: 'A', color: '#8e44ad' },
  { id: 'akali', name: 'Akali', roles: ['MID'], dmg: 'AP', early: 6, mid: 9, late: 7, engage: 6, classTag: 'Assassin', baseTier: 'B', color: '#2ecc71' },
  { id: 'leblanc', name: 'LeBlanc', roles: ['MID'], dmg: 'AP', early: 9, mid: 8, late: 5, engage: 5, classTag: 'Assassin', baseTier: 'B', color: '#9b59b6' },
  { id: 'aurora', name: 'Aurora', roles: ['MID', 'TOP'], dmg: 'AP', early: 7, mid: 9, late: 8, engage: 8, classTag: 'Teamfight', baseTier: 'S', color: '#48dbfb' },

  // BOT (ADC)
  { id: 'kaisa', name: "Kai'Sa", roles: ['BOT'], dmg: 'AD', early: 6, mid: 9, late: 9, engage: 5, classTag: 'Hypercarry', baseTier: 'S', color: '#8e44ad' },
  { id: 'varus', name: 'Varus', roles: ['BOT'], dmg: 'AD', early: 9, mid: 8, late: 7, engage: 7, classTag: 'Poke', baseTier: 'S', color: '#9b59b6' },
  { id: 'xayah', name: 'Xayah', roles: ['BOT'], dmg: 'AD', early: 7, mid: 8, late: 9, engage: 4, classTag: 'Hypercarry', baseTier: 'A', color: '#c0392b' },
  { id: 'jinx', name: 'Jinx', roles: ['BOT'], dmg: 'AD', early: 5, mid: 8, late: 10, engage: 3, classTag: 'Hypercarry', baseTier: 'A', color: '#3498db' },
  { id: 'ezreal', name: 'Ezreal', roles: ['BOT'], dmg: 'AD', early: 8, mid: 9, late: 7, engage: 2, classTag: 'Poke', baseTier: 'A', color: '#f1c40f' },
  { id: 'kalista', name: 'Kalista', roles: ['BOT'], dmg: 'AD', early: 10, mid: 8, late: 5, engage: 7, classTag: 'Dive', baseTier: 'A', color: '#1abc9c' },
  { id: 'lucian', name: 'Lucian', roles: ['BOT', 'MID'], dmg: 'AD', early: 9, mid: 8, late: 6, engage: 4, classTag: 'Skirmish', baseTier: 'A', color: '#ecf0f1' },
  { id: 'ashe', name: 'Ashe', roles: ['BOT'], dmg: 'AD', early: 8, mid: 8, late: 7, engage: 9, classTag: 'Teamfight', baseTier: 'S', color: '#5dade2' },
  { id: 'zeri', name: 'Zeri', roles: ['BOT'], dmg: 'AD', early: 5, mid: 8, late: 10, engage: 4, classTag: 'Hypercarry', baseTier: 'A', color: '#2ecc71' },
  { id: 'aphelios', name: 'Aphelios', roles: ['BOT'], dmg: 'AD', early: 6, mid: 8, late: 10, engage: 4, classTag: 'Hypercarry', baseTier: 'B', color: '#5499c7' },
  { id: 'smolder', name: 'Smolder', roles: ['BOT', 'MID'], dmg: 'AD', early: 4, mid: 7, late: 10, engage: 3, classTag: 'Scaling', baseTier: 'B', color: '#e74c3c' },

  // SUPPORT
  { id: 'rell', name: 'Rell', roles: ['SUP'], dmg: 'Tank', early: 7, mid: 9, late: 8, engage: 10, classTag: 'Tank', baseTier: 'S', color: '#f39c12' },
  { id: 'nautilus', name: 'Nautilus', roles: ['SUP'], dmg: 'Tank', early: 8, mid: 8, late: 7, engage: 10, classTag: 'Tank', baseTier: 'S', color: '#2c3e50' },
  { id: 'leona', name: 'Leona', roles: ['SUP'], dmg: 'Tank', early: 8, mid: 9, late: 7, engage: 10, classTag: 'Tank', baseTier: 'A', color: '#f1c40f' },
  { id: 'rakan', name: 'Rakan', roles: ['SUP'], dmg: 'Tank', early: 7, mid: 9, late: 8, engage: 9, classTag: 'Dive', baseTier: 'S', color: '#e67e22' },
  { id: 'renata', name: 'Renata Glasc', roles: ['SUP'], dmg: 'AP', early: 7, mid: 8, late: 9, engage: 6, classTag: 'Teamfight', baseTier: 'A', color: '#8e44ad' },
  { id: 'alistar', name: 'Alistar', roles: ['SUP'], dmg: 'Tank', early: 7, mid: 9, late: 8, engage: 9, classTag: 'Tank', baseTier: 'A', color: '#5b2c6f' },
  { id: 'braum', name: 'Braum', roles: ['SUP'], dmg: 'Tank', early: 7, mid: 8, late: 8, engage: 6, classTag: 'Tank', baseTier: 'A', color: '#3498db' },
  { id: 'thresh', name: 'Thresh', roles: ['SUP'], dmg: 'Tank', early: 8, mid: 8, late: 7, engage: 8, classTag: 'Skirmish', baseTier: 'A', color: '#1abc9c' },
  { id: 'bard', name: 'Bard', roles: ['SUP'], dmg: 'AP', early: 7, mid: 9, late: 8, engage: 8, classTag: 'Skirmish', baseTier: 'B', color: '#f5b041' },
  { id: 'lulu', name: 'Lulu', roles: ['SUP'], dmg: 'AP', early: 7, mid: 8, late: 9, engage: 3, classTag: 'Hypercarry', baseTier: 'B', color: '#af7ac5' },
  { id: 'milio', name: 'Milio', roles: ['SUP'], dmg: 'AP', early: 6, mid: 8, late: 9, engage: 2, classTag: 'Hypercarry', baseTier: 'B', color: '#eb984e' },
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

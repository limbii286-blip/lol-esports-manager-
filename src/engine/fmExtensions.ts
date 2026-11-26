// Football Manager 26 Advanced Systems built on top of LoL Esports Manager engine

export interface TacticalAnalysisResult {
  coherenceScore: number;
  identityTitle: string;
  identityDesc: string;
  strengths: string[];
  contradictions: string[];
  phaseRatings: {
    earlyControl: number;
    objectiveSetup: number;
    teamfightPower: number;
    sideLanePressure: number;
    lateInsurance: number;
  };
  laneAllocations: Record<string, { role: string; priority: number; directive: string }>;
}

export interface TouchlineShout {
  id: string;
  label: string;
  shortDesc: string;
  effectLabel: string;
  cooldownMins: number;
}

export const TOUCHLINE_SHOUTS: TouchlineShout[] = [
  {
    id: 'demand_more',
    label: 'Daha Fazla Talep Et',
    shortDesc: 'Takımın konsantrasyonunu ve mekanik odağını keskinleştir.',
    effectLabel: '+Agresif Tempo · +Bireysel Hata Azaltma',
    cooldownMins: 5,
  },
  {
    id: 'calm_down',
    label: 'Sakin Kalın',
    shortDesc: 'Tilt riskini düşür, gereksiz savaşlardan kaçınarak ölçeklen.',
    effectLabel: '+Makro Disiplin · -Riskli Çatışma',
    cooldownMins: 5,
  },
  {
    id: 'push_tempo',
    label: 'Baskıyı Artır',
    shortDesc: 'Haritada kule ve orman istilası için tempoyu zirveye çıkar.',
    effectLabel: '+Erken Baskı · +Kule Kuşatması',
    cooldownMins: 6,
  },
  {
    id: 'focus_objectives',
    label: 'Ejder / Baron Odağı',
    shortDesc: 'Nehir görüşünü erken kur ve tarafsız görevlere kilitlen.',
    effectLabel: '+Görüş Kontrolü · +Görev Savaşı',
    cooldownMins: 6,
  },
  {
    id: 'praise',
    label: 'Övgü & Moral',
    shortDesc: 'Önde olduğun dakikalarda özgüveni ve sinerjiyi yükselt.',
    effectLabel: '+Takım Sinerjisi · +Özgüven',
    cooldownMins: 5,
  },
];

export function applyTouchlineShout(matchState: any, shoutId: string): string {
  const userSide = matchState.userSide;
  if (!userSide) return 'Koç talimatı yalnızca yönettiğin maçlarda kullanılabilir.';

  const tactics = userSide === 'blue' ? matchState.blueTactics : matchState.redTactics;
  const players = userSide === 'blue' ? matchState.bluePlayers : matchState.redPlayers;
  const team = userSide === 'blue' ? matchState.blueTeam : matchState.redTeam;

  const setShoutBoost = (power: number, label: string) => {
    const key = userSide === 'blue' ? 'blueShoutBoost' : 'redShoutBoost';
    matchState[key] = { until: (matchState.minute || 0) + 4, power, label };
  };

  let msg = '';
  if (shoutId === 'demand_more') {
    setShoutBoost(3.0, 'Daha Fazla Talep');
    players.forEach((p: any) => {
      p.rating = Math.min(9.9, +(p.rating + 0.16).toFixed(2));
    });
    tactics.gameplan = tactics.gameplan === 'scaling' ? 'balanced' : 'aggressive';
    msg = `${team.tag} kenar yönetimi takımdan daha yüksek tempo ve keskinlik talep etti (+3.0 Taktik İvme, 4 dk)!`;
  } else if (shoutId === 'calm_down') {
    setShoutBoost(2.6, 'Sakin Disiplin');
    tactics.gameplan = 'scaling';
    tactics.behindPlan = 'scale';
    players.forEach((p: any) => {
      if (p.playerRef) p.playerRef.morale = Math.min(100, (p.playerRef.morale || 75) + 2);
    });
    msg = `${team.tag} koçu oyuncuları sakinleştirdi — disiplinli makro ve güvenli ölçeklenmeye geçildi (+2.6 İvme, 4 dk).`;
  } else if (shoutId === 'push_tempo') {
    setShoutBoost(3.2, 'Tam Saha Baskı');
    tactics.gameplan = 'aggressive';
    tactics.aheadPlan = 'dive';
    tactics.objective = 'towers';
    msg = `${team.tag} kulübesinden tam saha baskı emri! Kule ve orman istilası başladı (+3.2 İvme, 4 dk).`;
  } else if (shoutId === 'focus_objectives') {
    setShoutBoost(3.1, 'Objektif Kilidi');
    tactics.objective = matchState.minute >= 19 ? 'baron' : 'dragon';
    tactics.aheadPlan = 'choke';
    players.forEach((p: any) => {
      p.vision = (p.vision || 0) + 4;
    });
    msg = `${team.tag} nehir görüşünü sıkılaştırdı — sıradaki büyük göreve kilitlenildi (+3.1 İvme, 4 dk).`;
  } else if (shoutId === 'praise') {
    setShoutBoost(2.8, 'Moral Dalgası');
    players.forEach((p: any) => {
      p.rating = Math.min(9.9, +(p.rating + 0.12).toFixed(2));
      if (p.playerRef) p.playerRef.morale = Math.min(100, (p.playerRef.morale || 75) + 3);
    });
    msg = `${team.tag} baş koçu takımı alkışladı — sahnede özgüven ve sinerji yükseldi (+2.8 İvme, 4 dk).`;
  }

  if (msg && Array.isArray(matchState.events)) {
    matchState.events.push({
      min: matchState.minute,
      type: 'SYSTEM',
      tag: 'KOÇ TALİMATI',
      text: msg,
    });
  }
  return msg;
}

export function analyzeTacticsSystem(team: any, roster: any[], patch: any): TacticalAnalysisResult {
  const t = team?.tactics || {
    gameplan: 'balanced',
    laneFocus: 'MID',
    objective: 'dragon',
    topStyle: 'balanced',
    supStyle: 'balanced',
    adcStyle: 'balanced',
    aheadPlan: 'choke',
    behindPlan: 'scale',
  };

  const byRole = (role: string) => roster.find((p: any) => p.role === role && p.isStarter) || roster.find((p: any) => p.role === role);
  const top = byRole('TOP');
  const jgl = byRole('JGL');
  const mid = byRole('MID');
  const bot = byRole('BOT');
  const sup = byRole('SUP');

  const strengths: string[] = [];
  const contradictions: string[] = [];
  let coherence = 74;

  // Detect structural contradictions (FM Tactical Analyzer)
  if (t.laneFocus === 'TOP' && t.topStyle === 'weakside') {
    contradictions.push('Üst Koridor odağı seçili ancak Üst Koridor rolü "Zayıf Taraf (Weakside)" olarak ayarlı.');
    coherence -= 14;
  }
  if (t.laneFocus === 'BOT' && t.adcStyle === 'safe' && t.supStyle === 'roam') {
    contradictions.push('Alt Koridor odağı varken Destek sürekli geziyor ve Nişancı pasif kalıyor — kaynak israfı.');
    coherence -= 12;
  }
  if (t.gameplan === 'aggressive' && t.adcStyle === 'safe' && t.topStyle === 'weakside') {
    contradictions.push('Agresif oyun planı iki yan koridorun pasif talimatlarıyla çelişiyor.');
    coherence -= 10;
  }
  if (t.gameplan === 'split' && t.topStyle === 'weakside') {
    contradictions.push('Ayrık İttirme (1-3-1) planı için Üst Koridorun "Taşıyıcı (Carry)" rolünde olması önerilir.');
    coherence -= 10;
  }
  if (t.objective === 'dragon' && t.laneFocus === 'TOP' && t.supStyle !== 'roam') {
    contradictions.push('Ejder odağı seçili fakat orman kaynakları Üst Koridora yönlendirilmiş.');
    coherence -= 8;
  }

  // Detect structural synergies
  if (t.laneFocus === 'TOP' && t.topStyle === 'carry') {
    strengths.push('Üst Koridor Strongside: Ormancı + Taşıyıcı Üst sinerjisi yüksek vadi alameti baskısı üretir.');
    coherence += 8;
  }
  if (t.laneFocus === 'BOT' && t.adcStyle === 'aggressive') {
    strengths.push('Alt Koridor Kuşatması: Erken kule plakası ve ejder kontrolü için güçlü 2v2 baskısı.');
    coherence += 8;
  }
  if (t.laneFocus === 'MID' && t.supStyle === 'roam') {
    strengths.push('Orta-Orman-Destek Üçgeni: Nehir hakimiyeti ve erken harita rotasyonlarında üstünlük.');
    coherence += 9;
  }
  if (t.gameplan === 'scaling' && t.supStyle === 'peel') {
    strengths.push('Geç Oyun Sigortası: Koruyucu Destek + Ölçeklenme planı 30+ dakikalarda elit takım savaşı sağlar.');
    coherence += 7;
  }
  if (t.gameplan === 'split' && t.aheadPlan === 'split131') {
    strengths.push('Harita Genişletme: 1-3-1 ayrık ittirme disipliniyle rakip savunmayı ikiye bölme.');
    coherence += 8;
  }
  if (top?.style === 'Weakside' && t.topStyle === 'weakside') {
    strengths.push(`${top.name} doğal Zayıf Taraf profiline tam oturuyor (+Verimlilik).`);
    coherence += 4;
  }
  if (bot?.style === 'Aggressive' && t.adcStyle === 'aggressive') {
    strengths.push(`${bot.name} agresif nişancı kimliğiyle taktiğe doğrudan güç katıyor.`);
    coherence += 4;
  }
  if (jgl?.style === 'Playmaker' && t.gameplan === 'aggressive') {
    strengths.push(`${jgl.name} oyun kurucu orman temposuyla erken baskıyı ateşliyor.`);
    coherence += 4;
  }

  // Patch alignment check
  const earlyW = patch?.earlyWeight || 1;
  const lateW = patch?.lateWeight || 1;
  if (t.gameplan === 'aggressive' && earlyW >= 1.1) {
    strengths.push(`Yama ${patch.version} erken oyun metasıyla yüksek uyum.`);
    coherence += 5;
  } else if (t.gameplan === 'scaling' && lateW >= 1.1) {
    strengths.push(`Yama ${patch.version} geç oyun / hypercarry metasıyla tam uyum.`);
    coherence += 5;
  }

  const avgAttr = (key: string) => {
    const starters = [top, jgl, mid, bot, sup].filter(Boolean);
    if (!starters.length) return 75;
    return Math.round(starters.reduce((s, p) => s + (p.attrs?.[key] || 75), 0) / starters.length);
  };

  const clamp = (v: number) => Math.max(35, Math.min(99, Math.round(v)));
  const earlyControl = clamp(
    avgAttr('laning') + (t.gameplan === 'aggressive' ? 9 : t.gameplan === 'scaling' ? -7 : 0) + (t.supStyle === 'roam' ? 4 : 0)
  );
  const objectiveSetup = clamp(
    avgAttr('macro') + (t.objective === 'dragon' || t.objective === 'baron' ? 6 : 2) + (team?.synergy ? (team.synergy - 75) * 0.25 : 0)
  );
  const teamfightPower = clamp(
    avgAttr('teamfight') + (t.gameplan === 'scaling' ? 7 : t.gameplan === 'split' ? -5 : 2) + (t.supStyle === 'peel' ? 5 : 0)
  );
  const sideLanePressure = clamp(
    ((top?.attrs?.mechanics || 75) + (mid?.attrs?.macro || 75)) / 2 + (t.gameplan === 'split' ? 11 : t.topStyle === 'carry' ? 6 : -3)
  );
  const lateInsurance = clamp(
    ((bot?.attrs?.teamfight || 75) + avgAttr('clutch')) / 2 + (t.gameplan === 'scaling' ? 10 : t.gameplan === 'aggressive' ? -6 : 1)
  );

  const identityMap: Record<string, { title: string; desc: string }> = {
    aggressive: {
      title: 'Yüksek Tempolu Erken Kuşatma',
      desc: 'İlk 15 dakikada koridor önceliği, orman istilası ve hızlı kule plakalarıyla kartopu oluşturur.',
    },
    balanced: {
      title: 'LCK Kontrollü Makro Sistemi',
      desc: 'Hatasız görüş kurulumu, dengeli kaynak dağılımı ve ejder/baron çevresi disiplinli savaşlar.',
    },
    scaling: {
      title: 'Geç Oyun Takım Savaşı Kalesi',
      desc: 'Erken riskleri minimize eder, taşıyıcıları korur ve 25. dakikadan sonra 5v5 üstünlüğüyle kapatır.',
    },
    split: {
      title: '1-3-1 Yan Koridor Harita Baskısı',
      desc: 'Yan koridor düellocuları ve çapraz harita rotasyonlarıyla rakibi imkansız kararlara zorlar.',
    },
  };

  const identity = identityMap[t.gameplan] || identityMap.balanced;

  const laneAllocations: Record<string, { role: string; priority: number; directive: string }> = {
    TOP: {
      role: 'Üst Koridor',
      priority: t.laneFocus === 'TOP' ? 92 : t.topStyle === 'carry' ? 78 : 48,
      directive: t.topStyle === 'carry' ? 'Strongside Taşıyıcı' : t.topStyle === 'weakside' ? 'Zayıf Taraf Tank' : 'Dengeli Yan Koridor',
    },
    JGL: {
      role: 'Ormancı',
      priority: 86,
      directive:
        t.laneFocus === 'TOP'
          ? 'Alt → Üst Rota (Top Camp)'
          : t.laneFocus === 'BOT'
          ? 'Üst → Alt Rota (Bot Dive)'
          : 'Orta Nehir Kontrolü',
    },
    MID: {
      role: 'Orta Koridor',
      priority: t.laneFocus === 'MID' ? 92 : 76,
      directive: t.gameplan === 'split' ? 'Yan Dalga & TP Baskısı' : t.gameplan === 'aggressive' ? 'Erken Öncelik & Roam' : 'Kontrol & Takım Savaşı',
    },
    BOT: {
      role: 'Nişancı',
      priority: t.laneFocus === 'BOT' ? 94 : t.adcStyle === 'aggressive' ? 82 : 66,
      directive: t.adcStyle === 'aggressive' ? 'Agresif 2v2 Baskı' : t.adcStyle === 'safe' ? 'Güvenli Farm & Ölçeklenme' : 'Dengeli Pozisyon',
    },
    SUP: {
      role: 'Destek',
      priority: t.supStyle === 'roam' ? 84 : 70,
      directive: t.supStyle === 'roam' ? 'Harita Gezgini & Görüş' : t.supStyle === 'peel' ? 'Taşıyıcı Koruma (Peel)' : 'Görev Başlatıcı',
    },
  };

  return {
    coherenceScore: Math.max(42, Math.min(98, coherence)),
    identityTitle: identity.title,
    identityDesc: identity.desc,
    strengths: strengths.length ? strengths : ['Dengeli ve güvenli temel diziliş — belirgin zayıf nokta yok.'],
    contradictions,
    phaseRatings: {
      earlyControl,
      objectiveSetup,
      teamfightPower,
      sideLanePressure,
      lateInsurance,
    },
    laneAllocations,
  };
}

export interface PressChoice {
  tone: 'Sakin' | 'İddialı' | 'Temkinli' | 'Agresif';
  text: string;
  effectSummary: string;
  moraleDelta: number;
  synergyDelta: number;
  fanbaseDelta: number;
  boardDelta: number;
}

export interface PressQuestion {
  journalist: string;
  outlet: string;
  question: string;
  choices: PressChoice[];
}

export function generatePressConference(state: any, nextMatch: any, userTeam: any): PressQuestion[] {
  const oppId = nextMatch ? (nextMatch.blueId === userTeam.id ? nextMatch.redId : nextMatch.blueId) : null;
  const oppTeam = oppId ? state.teams.find((t: any) => t.id === oppId) : null;
  const oppName = oppTeam ? oppTeam.name : 'rakipleriniz';
  const patchVer = `Yama ${state.season ? String(state.season).slice(-2) : '26'}.${(state.patchIndex % 5) + 1}`;

  return [
    {
      journalist: 'Emre Karaca',
      outlet: 'Esports Global TR',
      question: `Koç ${state.managerName}, sıradaki ${oppName} karşılaşması öncesi taraftarlar büyük bir galibiyet bekliyor. Takımın hazırlık durumunu nasıl değerlendiriyorsunuz?`,
      choices: [
        {
          tone: 'Sakin',
          text: 'Hafta boyunca taktik planımıza sadık kaldık. Sahada kendi oyunumuzu oynarsak sonuç gelecektir.',
          effectSummary: '+1 Takım Sinerjisi · +2 Yönetim Güveni',
          moraleDelta: 1,
          synergyDelta: 1,
          fanbaseDelta: 0,
          boardDelta: 2,
        },
        {
          tone: 'İddialı',
          text: `${oppName} kaliteli bir kadro ama bugün sahneye tek bir galip çıkacak, o da ${userTeam.tag}.`,
          effectSummary: '+4 Oyuncu Morali · +2 Taraftar · Yüksek Beklenti',
          moraleDelta: 4,
          synergyDelta: 0,
          fanbaseDelta: 2,
          boardDelta: 0,
        },
        {
          tone: 'Temkinli',
          text: 'Rakibimizin güçlü yanlarını analiz ettik. Küçük hatalar seriyi belirleyebilir, disiplinli kalmalıyız.',
          effectSummary: '+1.5 Takım Sinerjisi · -1 Taraftar',
          moraleDelta: 0,
          synergyDelta: 1.5,
          fanbaseDelta: -1,
          boardDelta: 1,
        },
        {
          tone: 'Agresif',
          text: 'Onların draft alışkanlıklarını tamamen çözdük. İlk 15 dakikada maçı bitirecek planımız hazır.',
          effectSummary: '+3 Taraftar · +3 Moral · -1 Yönetim',
          moraleDelta: 3,
          synergyDelta: 0,
          fanbaseDelta: 3,
          boardDelta: -1,
        },
      ],
    },
    {
      journalist: 'Hannah Park',
      outlet: 'Korizon Analytics',
      question: `${patchVer} meta değişiklikleri ve Fearless Draft kuralları şampiyon havuzlarını ciddi şekilde zorluyor. Kadronuzun bu esnekliğe yanıt verebileceğini düşünüyor musunuz?`,
      choices: [
        {
          tone: 'Sakin',
          text: 'Analiz ekibimiz ve oyuncularımız derin bir şampiyon havuzu üzerinde çalıştı. Her senaryoya hazırız.',
          effectSummary: '+2 Moral · +2 Sinerji',
          moraleDelta: 2,
          synergyDelta: 2,
          fanbaseDelta: 0,
          boardDelta: 1,
        },
        {
          tone: 'İddialı',
          text: 'Fearless Draft tam da bizim gibi yüksek mekanikli oyuncuların parladığı format. Rakip zorlanacak.',
          effectSummary: '+3 Moral · +2 Taraftar',
          moraleDelta: 3,
          synergyDelta: 0,
          fanbaseDelta: 2,
          boardDelta: 0,
        },
        {
          tone: 'Temkinli',
          text: 'Yeni yamaya adaptasyon zaman alır ancak antrenman maçlarımızda doğru yönü yakaladık.',
          effectSummary: '+2 Yönetim · +1 Sinerji',
          moraleDelta: 0,
          synergyDelta: 1,
          fanbaseDelta: 0,
          boardDelta: 2,
        },
        {
          tone: 'Agresif',
          text: 'Meta ne olursa olsun, diğer takımlar bizim oynadığımız kompozisyonları kopyalamak zorunda kalacak.',
          effectSummary: '+3 Taraftar · +2 Moral',
          moraleDelta: 2,
          synergyDelta: -1,
          fanbaseDelta: 3,
          boardDelta: 0,
        },
      ],
    },
    {
      journalist: 'Mert Yıldırım',
      outlet: 'Rift Chronicle',
      question: 'Yönetim kurulunun sezon beklentileri ve soyunma odası kimyası hakkında kulislerde çeşitli yorumlar var. Takım içi atmosfer nasıl?',
      choices: [
        {
          tone: 'Sakin',
          text: 'Oyuncularıma tam güveniyorum. Yönetimle aynı vizyonu paylaşıyoruz ve adım adım ilerliyoruz.',
          effectSummary: '+3 Yönetim · +2 Moral',
          moraleDelta: 2,
          synergyDelta: 1,
          fanbaseDelta: 0,
          boardDelta: 3,
        },
        {
          tone: 'İddialı',
          text: 'Bu kulübün kültürü kupa kazanmaktır. Soyunma odasındaki herkes bu baskıyı kaldıracak seviyede.',
          effectSummary: '+3 Taraftar · +2 Yönetim · +1 Moral',
          moraleDelta: 1,
          synergyDelta: 1,
          fanbaseDelta: 3,
          boardDelta: 2,
        },
        {
          tone: 'Temkinli',
          text: 'Genç oyuncularımızın gelişimine ve uzun vadeli sürdürülebilir başarıya odaklanıyoruz.',
          effectSummary: '+1.5 Sinerji · +1 Moral',
          moraleDelta: 1,
          synergyDelta: 1.5,
          fanbaseDelta: 0,
          boardDelta: 1,
        },
        {
          tone: 'Agresif',
          text: 'Dışarıdaki söylentiler bizi ilgilendirmiyor. Cevabımızı sadece Sihirdar Vadisi’nde veririz.',
          effectSummary: '+4 Moral · +1 Sinerji · -1 Yönetim',
          moraleDelta: 4,
          synergyDelta: 1,
          fanbaseDelta: 1,
          boardDelta: -1,
        },
      ],
    },
  ];
}

export interface DataHubTeamRow {
  teamId: string;
  tag: string;
  name: string;
  color: string;
  isUser: boolean;
  ovr: number;
  earlyIndex: number;
  lateIndex: number;
  avgAge: number;
  synergy: number;
  wins: number;
  losses: number;
  winRate: number;
  weeklyWage: number;
}

export function computeDataHubMetrics(state: any, regionId: string, getTeamRosterFn: any, getTeamOVRFn: any, getTeamWeeklyWagesFn: any): DataHubTeamRow[] {
  const regTeams = state.teams.filter((t: any) => t.region === regionId);
  const standingsList = Array.isArray(state.standings?.[regionId]) ? state.standings[regionId] : [];

  return regTeams.map((team: any) => {
    const roster = getTeamRosterFn(state, team.id);
    const starters = roster.filter((p: any) => p.isStarter).slice(0, 5);
    const active = starters.length ? starters : roster.slice(0, 5);
    const avg = (fn: (p: any) => number) =>
      active.length ? active.reduce((s: number, p: any) => s + fn(p), 0) / active.length : 70;

    const earlyIndex = Math.round(avg((p) => p.attrs.laning * 0.55 + p.attrs.mechanics * 0.45));
    const lateIndex = Math.round(avg((p) => p.attrs.teamfight * 0.5 + p.attrs.macro * 0.3 + p.attrs.clutch * 0.2));
    const avgAge = +(avg((p) => p.age)).toFixed(1);
    const rec = standingsList.find((r: any) => r.teamId === team.id) || { wins: 0, losses: 0 };
    const total = (rec.wins || 0) + (rec.losses || 0);

    return {
      teamId: team.id,
      tag: team.tag,
      name: team.name,
      color: team.color,
      isUser: team.id === state.userTeamId,
      ovr: getTeamOVRFn(state, team.id),
      earlyIndex,
      lateIndex,
      avgAge,
      synergy: Math.round(team.synergy || 70),
      wins: rec.wins || 0,
      losses: rec.losses || 0,
      winRate: total > 0 ? Math.round(((rec.wins || 0) / total) * 100) : 50,
      weeklyWage: getTeamWeeklyWagesFn(state, team.id),
    };
  });
}

export interface OpponentScoutReport {
  oppTeam: any;
  starPlayer: any;
  weakestPlayer: any;
  targetBans: string[];
  oppStyleLabel: string;
  recommendedGameplan: 'aggressive' | 'balanced' | 'scaling' | 'split';
  recommendedLaneFocus: 'TOP' | 'MID' | 'BOT';
  recommendedSummary: string;
  winProbPct: number;
  hasScrimIntel: boolean;
}

export function generateOpponentScoutReport(
  state: any,
  userTeam: any,
  oppTeam: any,
  getTeamRosterFn: any,
  getTeamOVRFn: any
): OpponentScoutReport | null {
  if (!userTeam || !oppTeam) return null;
  const oppRoster = getTeamRosterFn(state, oppTeam.id);
  const starters = oppRoster.filter((p: any) => p.isStarter);
  const active = starters.length >= 5 ? starters : oppRoster.slice(0, 5);
  if (!active.length) return null;

  const sortedByOvr = [...active].sort((a, b) => b.ovr - a.ovr);
  const starPlayer = sortedByOvr[0];
  const weakestPlayer = sortedByOvr[sortedByOvr.length - 1];

  const targetBans: string[] = [];
  for (const p of sortedByOvr.slice(0, 3)) {
    for (const cid of p.sigChamps || []) {
      if (!targetBans.includes(cid) && targetBans.length < 4) {
        targetBans.push(cid);
      }
    }
  }

  const oppGp = oppTeam.tactics?.gameplan || 'balanced';
  const styleMap: Record<string, string> = {
    aggressive: 'Yüksek Tempolu Erken Baskı',
    balanced: 'Dengeli Makro & Objektif Kontrolü',
    scaling: 'Geç Oyun Takım Savaşı',
    split: '1-3-1 Yan Koridor Ayrık İttirme',
  };

  // Counter-tactic logic aligned 100% with matchEngine Rock-Paper-Scissors matrix:
  // aggressive > scaling, scaling > balanced, balanced > aggressive, split > scaling, aggressive > split
  let recommendedGameplan: 'aggressive' | 'balanced' | 'scaling' | 'split' = 'balanced';
  if (oppGp === 'scaling') recommendedGameplan = 'aggressive';
  else if (oppGp === 'aggressive') recommendedGameplan = 'balanced';
  else if (oppGp === 'balanced') recommendedGameplan = 'scaling';
  else if (oppGp === 'split') recommendedGameplan = 'aggressive';

  const weakRole = weakestPlayer.role;
  const recommendedLaneFocus: 'TOP' | 'MID' | 'BOT' =
    weakRole === 'TOP' ? 'TOP' : weakRole === 'BOT' || weakRole === 'SUP' ? 'BOT' : 'MID';

  const myOvr = getTeamOVRFn(state, userTeam.id);
  const oppOvr = getTeamOVRFn(state, oppTeam.id);
  const synEdge = ((userTeam.synergy || 70) - (oppTeam.synergy || 70)) * 0.28;
  const winProbPct = Math.max(15, Math.min(85, Math.round(100 / (1 + Math.exp(-((myOvr - oppOvr + synEdge) / 5.5))))));

  const gpLabel: Record<string, string> = {
    aggressive: 'Agresif Tempo',
    balanced: 'Dengeli Makro',
    scaling: 'Geç Oyun',
    split: 'Ayrık İttirme',
  };

  const recommendedSummary = `${oppTeam.tag} (${styleMap[oppGp] || 'Dengeli'}) karşısında ${gpLabel[recommendedGameplan]} ile karşı taktik avantajı alabilir, zayıf halka ${weakestPlayer.name} (${weakestPlayer.role}, OVR ${weakestPlayer.ovr}) üzerine ${recommendedLaneFocus} odağıyla baskı kurabilirsin.`;

  return {
    oppTeam,
    starPlayer,
    weakestPlayer,
    targetBans,
    oppStyleLabel: styleMap[oppGp] || 'Dengeli Makro',
    recommendedGameplan,
    recommendedLaneFocus,
    recommendedSummary,
    winProbPct,
    hasScrimIntel: Boolean(state.scrimIntel?.[oppTeam.id]),
  };
}


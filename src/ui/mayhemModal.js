// LoL Esports Manager v2.2 — Worlds 2026 Mayhem (Step-by-Step 16-Team Swiss Stage + Knockout BO5 + Live Key Moments Sim)
import { ROLES, LEGENDS_MAYHEM } from '../data/teamsAndPlayers.js';
import { icon } from './icons.js';

const HISTORICAL_TEAMS = [
  { id: 'h_skt15', tag: 'SKT', name: '2015 SKT T1', region: 'LCK', rating: 98.2, star: '2015 Faker', color: '#e2012d', color2: '#fff' },
  { id: 'h_ssw14', tag: 'SSW', name: '2014 Samsung White', region: 'LCK', rating: 97.6, star: '2014 DanDy', color: '#2563eb', color2: '#fff' },
  { id: 'h_dwg20', tag: 'DWG', name: '2020 DAMWON Gaming', region: 'LCK', rating: 97.4, star: '2020 Canyon', color: '#00d2be', color2: '#111' },
  { id: 'h_t123',  tag: 'T1',  name: '2023 T1', region: 'LCK', rating: 97.5, star: '2023 Zeus', color: '#dc2626', color2: '#fff' },
  { id: 'h_ig18',  tag: 'IG',  name: '2018 Invictus Gaming', region: 'LPL', rating: 96.8, star: '2018 TheShy', color: '#e2e8f0', color2: '#111' },
  { id: 'h_jdg23', tag: 'JDG', name: '2023 JD Gaming', region: 'LPL', rating: 96.6, star: '2023 Ruler', color: '#b91c1c', color2: '#fff' },
  { id: 'h_gen24', tag: 'GEN', name: '2024 Gen.G', region: 'LCK', rating: 96.4, star: '2024 Chovy', color: '#aa8a00', color2: '#111' },
  { id: 'h_blg24', tag: 'BLG', name: '2024 Bilibili Gaming', region: 'LPL', rating: 96.0, star: '2024 Bin', color: '#00a1d6', color2: '#fff' },
  { id: 'h_edg21', tag: 'EDG', name: '2021 EDward Gaming', region: 'LPL', rating: 95.8, star: '2021 Viper', color: '#334155', color2: '#fff' },
  { id: 'h_fpx19', tag: 'FPX', name: '2019 FunPlus Phoenix', region: 'LPL', rating: 95.5, star: '2019 Tian', color: '#ea580c', color2: '#fff' },
  { id: 'h_rox16', tag: 'ROX', name: '2016 ROX Tigers', region: 'LCK', rating: 95.4, star: '2016 Smeb', color: '#f59e0b', color2: '#111' },
  { id: 'h_ssg17', tag: 'SSG', name: '2017 Samsung Galaxy', region: 'LCK', rating: 95.2, star: '2017 CoreJJ', color: '#1d4ed8', color2: '#fff' },
  { id: 'h_drx22', tag: 'DRX', name: '2022 DRX', region: 'LCK', rating: 94.8, star: '2022 Zeka', color: '#3b82f6', color2: '#fff' },
  { id: 'h_rng18', tag: 'RNG', name: '2018 RNG', region: 'LPL', rating: 94.9, star: '2018 Uzi', color: '#ca8a04', color2: '#111' },
  { id: 'h_g219',  tag: 'G2',  name: '2019 G2 Esports', region: 'LEC', rating: 94.5, star: '2019 Caps', color: '#ef4444', color2: '#111' },
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export function openWorldsMayhemModal() {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  const box = document.createElement('div');
  box.className = 'modal-box';
  box.style.maxWidth = '1040px';
  backdrop.appendChild(box);
  document.body.appendChild(backdrop);

  const m = {
    stage: 'DRAFT', // DRAFT | SWISS | MATCH | KNOCKOUT | FINISHED
    roleIdx: 0,
    rerolls: 3,
    roster: [],
    choices: [],
    teamPower: null,
    tacticPlan: 'balanced', // aggressive | balanced | scaling
    focusRoleIdx: 2,        // 0..4 (default MID)

    // 16-Team Swiss State
    swissRound: 1,
    swissTeams: [],
    swissMatches: [],

    // 8-Team Knockout State
    koRound: 0, // 0=QF, 1=SF, 2=Final
    koRounds: [],

    // Active Live Match State
    activeSeries: null,
    matchTimer: null,

    // Final summary
    finalStatus: null, // 'CHAMPION' | 'ELIMINATED'
    finalPlace: '',
    userRecord: { seriesW: 0, seriesL: 0, gameW: 0, gameL: 0 },
  };

  function clearTimer() {
    if (m.matchTimer) { clearInterval(m.matchTimer); m.matchTimer = null; }
  }

  function rollChoices() {
    const role = ROLES[m.roleIdx];
    const pool = LEGENDS_MAYHEM.filter(l => l.role === role);
    m.choices = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
  }

  function calcTeamScore() {
    if (m.roster.length === 0) return { avg: 0, synergy: 0, total: 0, bonuses: [] };
    const avg = m.roster.reduce((s, p) => s + p.ovr, 0) / m.roster.length;
    const bonuses = [];
    let syn = 0;

    const regCounts = {};
    const teamCounts = {};
    for (const p of m.roster) {
      regCounts[p.region] = (regCounts[p.region] || 0) + 1;
      teamCounts[p.team] = (teamCounts[p.team] || 0) + 1;
    }
    for (const [reg, cnt] of Object.entries(regCounts)) {
      if (cnt >= 3) { syn += cnt * 0.6; bonuses.push(`${cnt}x ${reg} Kimyası (+${(cnt * 0.6).toFixed(1)})`); }
    }
    for (const [tm, cnt] of Object.entries(teamCounts)) {
      if (cnt >= 2) { syn += cnt * 0.9; bonuses.push(`${cnt}x ${tm} Hanedanı (+${(cnt * 0.9).toFixed(1)})`); }
    }
    if (m.roster.some(p => p.style === 'Shotcaller')) { syn += 1.0; bonuses.push('Shotcaller Liderliği (+1.0)'); }

    return { avg: +avg.toFixed(1), synergy: +syn.toFixed(1), total: +(avg + syn).toFixed(1), bonuses };
  }

  function initSwissTournament() {
    m.teamPower = calcTeamScore();
    const userEntry = {
      id: 'user',
      tag: 'SEN',
      name: 'Rüya Takımın',
      region: 'MAYHEM',
      rating: m.teamPower.total,
      star: m.roster[2]?.name || m.roster[0]?.name,
      color: '#c89b3c',
      color2: '#090d14',
      wins: 0,
      losses: 0,
      status: 'ACTIVE',
      pastOpps: new Set(),
    };

    m.swissTeams = [
      userEntry,
      ...HISTORICAL_TEAMS.map(t => ({ ...t, wins: 0, losses: 0, status: 'ACTIVE', pastOpps: new Set() })),
    ];
    m.swissRound = 1;
    pairNextSwissRound();
    m.stage = 'SWISS';
    box.scrollTop = 0;
    render();
  }

  function pairNextSwissRound() {
    const active = m.swissTeams.filter(t => t.status === 'ACTIVE');
    const buckets = {};
    for (const t of active) {
      const k = `${t.wins}-${t.losses}`;
      if (!buckets[k]) buckets[k] = [];
      buckets[k].push(t);
    }

    const matches = [];
    const leftovers = [];
    const keys = Object.keys(buckets).sort((a, b) => Number(b.split('-')[0]) - Number(a.split('-')[0]));

    for (const k of keys) {
      const group = [...buckets[k]].sort(() => Math.random() - 0.5);
      if (leftovers.length) group.unshift(leftovers.pop());

      while (group.length >= 2) {
        const a = group.shift();
        // Prefer an opponent not played yet
        let oppIdx = group.findIndex(cand => !a.pastOpps.has(cand.id));
        if (oppIdx === -1) oppIdx = 0;
        const b = group.splice(oppIdx, 1)[0];
        const isDecider = a.wins === 2 || a.losses === 2 || b.wins === 2 || b.losses === 2;
        matches.push({
          id: `sw_${m.swissRound}_${a.id}_${b.id}`,
          recordLabel: k,
          aId: a.id,
          bId: b.id,
          bestOf: isDecider ? 3 : 1,
          aScore: 0,
          bScore: 0,
          played: false,
          winnerId: null,
        });
      }
      if (group.length === 1) leftovers.push(group[0]);
    }
    m.swissMatches = matches;
  }

  function quickSimAIMatch(match, teamList) {
    const tA = teamList.find(t => t.id === match.aId);
    const tB = teamList.find(t => t.id === match.bId);
    const needed = Math.ceil(match.bestOf / 2);
    const winProbA = 1 / (1 + Math.exp(-(tA.rating - tB.rating) / 3.8));
    let a = 0, b = 0;
    while (a < needed && b < needed) {
      if (Math.random() < winProbA) a++;
      else b++;
    }
    match.aScore = a;
    match.bScore = b;
    match.played = true;
    match.winnerId = a > b ? tA.id : tB.id;
    if (tA.pastOpps) tA.pastOpps.add(tB.id);
    if (tB.pastOpps) tB.pastOpps.add(tA.id);
  }

  function applySwissMatchResult(match) {
    const tA = m.swissTeams.find(t => t.id === match.aId);
    const tB = m.swissTeams.find(t => t.id === match.bId);
    if (tA.pastOpps) tA.pastOpps.add(tB.id);
    if (tB.pastOpps) tB.pastOpps.add(tA.id);
    if (match.winnerId === tA.id) { tA.wins++; tB.losses++; }
    else { tB.wins++; tA.losses++; }
    if (tA.wins >= 3) tA.status = 'QUALIFIED';
    if (tA.losses >= 3) tA.status = 'ELIMINATED';
    if (tB.wins >= 3) tB.status = 'QUALIFIED';
    if (tB.losses >= 3) tB.status = 'ELIMINATED';
  }

  // ==================== LIVE KEY-MOMENTS MATCH SIMULATOR (v3.0) ====================
  function generateGameTimeline(userTeam, oppTeam) {
    const focusLegend = m.roster[m.focusRoleIdx] || m.roster[2];
    // Tactic synergy bonus when playing around a 96+ superstar or matching playstyle
    const planBonus = (m.tacticPlan === 'aggressive' && focusLegend.style === 'Aggressive') ? 1.2
      : (m.tacticPlan === 'scaling' && focusLegend.style === 'Scaling') ? 1.2
      : (focusLegend.ovr >= 97 ? 0.8 : 0.3);

    const winProb = Math.max(0.18, Math.min(0.84, 1 / (1 + Math.exp(-((userTeam.rating + planBonus) - oppTeam.rating) / 4.2))));
    const userWins = Math.random() < winProb;

    const top = m.roster[0], jgl = m.roster[1], mid = m.roster[2], bot = m.roster[3], sup = m.roster[4];
    const oppStar = oppTeam.star;

    let uKills = 0, oKills = 0, uGold = 2500, oGold = 2500, uDrag = 0, oDrag = 0, uBaron = 0, oBaron = 0;
    const moments = [];

    const addMoment = (min, type, tag, side, text, dUK, dOK, dUG, dOG, dUD = 0, dOD = 0, dUB = 0, dOB = 0) => {
      uKills += dUK; oKills += dOK;
      uGold += dUG; oGold += dOG;
      uDrag += dUD; oDrag += dOD;
      uBaron += dUB; oBaron += dOB;
      moments.push({ min, type, tag, side, text, uKills, oKills, uGold, oGold, uDrag, oDrag, uBaron, oBaron });
    };

    // 1. Early First Blood (influenced by Erken Baskı!)
    const fbBias = m.tacticPlan === 'aggressive' ? 0.14 : m.tacticPlan === 'scaling' ? -0.10 : 0;
    const fbUser = Math.random() < Math.max(0.22, Math.min(0.82, (userWins ? 0.58 : 0.42) + fbBias));
    const fbActor = Math.random() < 0.5 ? focusLegend : pick([jgl, mid, top]);
    addMoment(
      4 + Math.floor(Math.random() * 3),
      'FIRST_BLOOD', 'İLK KAN', fbUser ? 'blue' : 'red',
      fbUser
        ? `${fbActor.name}, erken koridor baskınında ${oppTeam.tag} karşısında İlk Kan'ı aldı.`
        : `${oppTeam.tag} (${oppStar}), erken seviyede baskınla İlk Kan'ı çıkardı.`,
      fbUser ? 1 : 0, fbUser ? 0 : 1, fbUser ? 7400 : 6300, fbUser ? 6300 : 7400
    );

    // 2. Legend 1v1 Duel / Solo Kill
    const skUser = Math.random() < (userWins ? 0.62 : 0.38);
    addMoment(
      11 + Math.floor(Math.random() * 3),
      'SOLO', 'EFSANE DÜELLOSU', skUser ? 'blue' : 'red',
      skUser
        ? `${focusLegend.name}, ${oppStar} karşısındaki 1v1 düelloyu kazanarak kule plakalarını topladı!`
        : `${oppStar}, ${focusLegend.name} karşısında kritik bir 1v1 takasından galip çıktı ve koridor kontrolünü aldı.`,
      skUser ? 2 : 1, skUser ? 1 : 2, skUser ? 11600 : 10100, skUser ? 10100 : 11600
    );

    // 3. Mid-Game Dragon Fight (with Shutdown possibility!)
    const drUser = Math.random() < (userWins ? 0.64 : 0.36);
    const isShutdown = !fbUser && drUser;
    addMoment(
      17 + Math.floor(Math.random() * 3),
      isShutdown ? 'SHUTDOWN' : 'DRAGON', isShutdown ? 'SHUTDOWN + EJDER' : 'EJDER', drUser ? 'blue' : 'red',
      drUser
        ? `${sup.name}'ın kusursuz savaş başlatmasıyla ejder çukurunda 3-2 üstünlük! ${bot.name} ${isShutdown ? 'Shutdown altınıyla birlikte ' : ''}Ejder'i takıma kazandırdı.`
        : `${oppTeam.tag} ejder çukurunda iyi pozisyon aldı ve 3-1 takasla birlikte Ejder'i hanesine yazdı.`,
      drUser ? 3 : 1, drUser ? 2 : 3, drUser ? 13400 : 11400, drUser ? 11400 : 13400,
      drUser ? 2 : 0, drUser ? 0 : 2
    );

    // 4. Baron Nashor & Jungle Smite Steal Climax!
    const lateBias = m.tacticPlan === 'scaling' ? 0.12 : m.tacticPlan === 'aggressive' ? -0.06 : 0;
    const barUser = Math.random() < Math.max(0.2, Math.min(0.85, (userWins ? 0.74 : 0.26) + lateBias));
    const isSteal = Math.random() < 0.22;
    addMoment(
      24 + Math.floor(Math.random() * 4),
      'BARON', isSteal ? 'BARON ÇALDI' : 'BARON', barUser ? 'blue' : 'red',
      barUser
        ? (isSteal
          ? `İNANILMAZ! ${jgl.name}, çukura sıçrayıp kusursuz Çarp (Smite) ile Baron Nashor'u ${oppTeam.tag}'nin elinden çaldı!`
          : `${focusLegend.name} önderliğinde 5v5 takım savaşı kazanıldı! Baron Nashor güçlendirmesiyle kuşatma başlıyor.`)
        : (isSteal
          ? `${oppTeam.tag} ormancısı kritik anda Baron'u çaldı ve maçı çevirdi!`
          : `${oppTeam.tag} Baron çukurunda kritik bir yakalama buldu; ${oppStar} liderliğinde Baron'u aldılar.`),
      barUser ? 4 : 2, barUser ? 2 : 4, barUser ? 14800 : 12400, barUser ? 12400 : 14800,
      barUser ? 1 : 0, barUser ? 0 : 1, barUser ? 1 : 0, barUser ? 0 : 1
    );

    // 5. Optional Elder Dragon Climax if close game!
    if (Math.abs(uGold - oGold) < 3500) {
      addMoment(
        31,
        'SOUL', 'KADİM EJDER', userWins ? 'blue' : 'red',
        userWins
          ? `31. dakikada Kadim Ejder savaşı! ${sup.name} ve ${focusLegend.name} kombosuyla Kadim Ejder alındı.`
          : `31. dakikada nefes kesen Kadim Ejder savaşını ${oppTeam.name} kazandı.`,
        userWins ? 3 : 1, userWins ? 1 : 3, userWins ? 6500 : 4800, userWins ? 4800 : 6500,
        userWins ? 1 : 0, userWins ? 0 : 1
      );
    }

    // 6. Final Teamfight & Nexus
    const endMin = moments[moments.length - 1].min + 3 + Math.floor(Math.random() * 4);
    const mvp = userWins ? (Math.random() < 0.55 ? focusLegend : pick([mid, bot, top, jgl])) : null;
    addMoment(
      endMin,
      'NEXUS', 'NEXUS', userWins ? 'blue' : 'red',
      userWins
        ? `Son takım savaşında Katliam (Ace)! ${mvp.name} tarihi bir performansla Nexus'u yıktı ve maçı kazandı.`
        : `${oppTeam.name} son takım savaşını kazanarak üsse girdi ve ${endMin}. dakikada Nexus'u yıktı.`,
      userWins ? 4 : 1, userWins ? 1 : 4, userWins ? 9500 : 7200, userWins ? 7200 : 9500
    );

    return { userWins, moments, mvpName: userWins ? mvp.name : oppStar };
  }

  function startUserSeriesMatch(match, sourceStage, titleLabel) {
    clearTimer();
    const isUserA = match.aId === 'user';
    const oppId = isUserA ? match.bId : match.aId;
    const userTeam = m.swissTeams.find(t => t.id === 'user');
    const oppTeam = m.swissTeams.find(t => t.id === oppId);

    m.activeSeries = {
      match,
      sourceStage, // 'SWISS' | 'KNOCKOUT'
      titleLabel,
      isUserA,
      userTeam,
      oppTeam,
      bestOf: match.bestOf,
      needed: Math.ceil(match.bestOf / 2),
      uScore: 0,
      oScore: 0,
      gameNum: 1,
      timeline: null,
      revealedCount: 0,
      gameFinished: false,
      seriesFinished: false,
    };

    m.stage = 'MATCH';
    box.scrollTop = 0;
    startNextGameInMayhemSeries();
  }

  function startNextGameInMayhemSeries() {
    clearTimer();
    const s = m.activeSeries;
    s.timeline = generateGameTimeline(s.userTeam, s.oppTeam);
    s.revealedCount = 1;
    s.gameFinished = false;
    render();

    m.matchTimer = setInterval(() => {
      if (!m.activeSeries) { clearTimer(); return; }
      s.revealedCount++;
      if (s.revealedCount >= s.timeline.moments.length) {
        finishCurrentMayhemGame();
      } else {
        render();
      }
    }, 650);
  }

  function finishCurrentMayhemGame() {
    clearTimer();
    const s = m.activeSeries;
    if (s.gameFinished) return;
    s.revealedCount = s.timeline.moments.length;
    s.gameFinished = true;
    if (s.timeline.userWins) { s.uScore++; m.userRecord.gameW++; }
    else { s.oScore++; m.userRecord.gameL++; }

    if (s.uScore >= s.needed || s.oScore >= s.needed) {
      s.seriesFinished = true;
      if (s.uScore > s.oScore) m.userRecord.seriesW++;
      else m.userRecord.seriesL++;

      s.match.aScore = s.isUserA ? s.uScore : s.oScore;
      s.match.bScore = s.isUserA ? s.oScore : s.uScore;
      s.match.played = true;
      s.match.winnerId = s.uScore > s.oScore ? 'user' : s.oppTeam.id;
    }
    render();
  }

  function completeActiveSeriesAndReturn() {
    clearTimer();
    const s = m.activeSeries;
    m.activeSeries = null;

    if (s.sourceStage === 'SWISS') {
      applySwissMatchResult(s.match);
      // Sim all other AI Swiss matches in this round
      for (const sm of m.swissMatches) {
        if (!sm.played) {
          quickSimAIMatch(sm, m.swissTeams);
          applySwissMatchResult(sm);
        }
      }

      const userT = m.swissTeams.find(t => t.id === 'user');
      if (userT.status === 'ELIMINATED') {
        m.finalStatus = 'ELIMINATED';
        m.finalPlace = `İsviçre Aşaması (${userT.wins}-${userT.losses})`;
        m.stage = 'FINISHED';
        render();
        return;
      }

      // If user already qualified (3-0 or 3-1), sim remaining Swiss rounds so top 8 is complete
      if (userT.status === 'QUALIFIED') {
        while (m.swissTeams.some(t => t.status === 'ACTIVE') && m.swissRound < 5) {
          m.swissRound++;
          pairNextSwissRound();
          for (const sm of m.swissMatches) {
            quickSimAIMatch(sm, m.swissTeams);
            applySwissMatchResult(sm);
          }
        }
        initKnockoutBracket();
        return;
      }

      // Otherwise advance to next Swiss round for the user!
      m.swissRound++;
      pairNextSwissRound();
      m.stage = 'SWISS';
      box.scrollTop = 0;
      render();
      return;
    }

    // KNOCKOUT Stage progression
    const curRound = m.koRounds[m.koRound];
    for (const km of curRound.matches) {
      if (!km.played) quickSimAIMatch(km, m.swissTeams);
    }

    if (s.match.winnerId !== 'user') {
      m.finalStatus = 'ELIMINATED';
      m.finalPlace = curRound.name;
      m.stage = 'FINISHED';
      render();
      return;
    }

    if (m.koRound === 2) {
      m.finalStatus = 'CHAMPION';
      m.finalPlace = 'WORLDS 2026 ŞAMPİYONU';
      m.stage = 'FINISHED';
      render();
      return;
    }

    // Build next Knockout round
    const nextIdx = m.koRound + 1;
    const nextMatches = [];
    for (let i = 0; i < curRound.matches.length; i += 2) {
      nextMatches.push({
        id: `ko_${nextIdx}_${i}`,
        aId: curRound.matches[i].winnerId,
        bId: curRound.matches[i + 1].winnerId,
        bestOf: 5,
        aScore: 0, bScore: 0, played: false, winnerId: null,
      });
    }
    m.koRounds[nextIdx].matches = nextMatches;
    m.koRound = nextIdx;
    m.stage = 'KNOCKOUT';
    box.scrollTop = 0;
    render();
  }

  function initKnockoutBracket() {
    const qualified = m.swissTeams.filter(t => t.status === 'QUALIFIED').sort((a, b) => (b.wins - a.wins) || (a.losses - b.losses) || (b.rating - a.rating));
    const qf = [
      { id: 'ko_0_0', aId: qualified[0].id, bId: qualified[7].id, bestOf: 5, aScore: 0, bScore: 0, played: false, winnerId: null },
      { id: 'ko_0_1', aId: qualified[3].id, bId: qualified[4].id, bestOf: 5, aScore: 0, bScore: 0, played: false, winnerId: null },
      { id: 'ko_0_2', aId: qualified[1].id, bId: qualified[6].id, bestOf: 5, aScore: 0, bScore: 0, played: false, winnerId: null },
      { id: 'ko_0_3', aId: qualified[2].id, bId: qualified[5].id, bestOf: 5, aScore: 0, bScore: 0, played: false, winnerId: null },
    ];
    m.koRound = 0;
    m.koRounds = [
      { name: 'Çeyrek Finaller (BO5)', matches: qf },
      { name: 'Yarı Finaller (BO5)', matches: [] },
      { name: 'WORLDS BÜYÜK FİNAL (BO5)', matches: [] },
    ];
    m.stage = 'KNOCKOUT';
    box.scrollTop = 0;
    render();
  }

  // ==================== RENDERING ====================
  function renderRosterBar() {
    return `
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:14px;">
        ${ROLES.map((r, i) => {
          const p = m.roster[i];
          return `
            <div class="card" style="padding:9px;text-align:center;border-color:${m.stage === 'DRAFT' && i === m.roleIdx ? 'var(--gold)' : 'var(--border)'};">
              <span class="badge role-${r}">${r}</span>
              ${p ? `
                <div style="font-weight:800;font-size:12.5px;margin-top:5px;color:var(--gold-bright);">${p.name}</div>
                <div style="font-size:10.5px;color:var(--text-muted);">${p.team} • ${p.region}</div>
                <div style="margin-top:3px;"><span class="ovr-pill ovr-90" style="font-size:11.5px;">${p.ovr}</span></div>
              ` : `<div style="font-size:11px;color:var(--text-dim);margin-top:10px;">${i === m.roleIdx ? 'Seçiliyor...' : 'Bekliyor'}</div>`}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderDraftStage() {
    const score = calcTeamScore();
    const finishedDraft = m.roleIdx >= ROLES.length;

    return `
      ${renderRosterBar()}
      ${!finishedDraft ? `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <strong style="color:var(--gold-bright);font-size:14px;">Rol Seçimi (${m.roleIdx + 1}/5): <span class="badge role-${ROLES[m.roleIdx]}">${ROLES[m.roleIdx]}</span></strong>
          <button class="btn-blue btn-sm" id="btnMayhemReroll" ${m.rerolls <= 0 ? 'disabled' : ''}>${icon('refresh', 13)} Reroll (${m.rerolls} Hak)</button>
        </div>
        <div class="grid-3">
          ${m.choices.map((c, idx) => `
            <div class="club-card" style="cursor:pointer;" data-pick-legend="${idx}">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span class="badge tier-S">${c.team} • ${c.region}</span>
                <span class="ovr-pill ovr-90" style="font-size:15px;">${c.ovr}</span>
              </div>
              <div style="font-size:16px;font-weight:900;color:var(--gold-bright);">${c.name}</div>
              <div style="font-size:12px;color:var(--text-muted);min-height:36px;">${c.desc}</div>
              <div style="font-size:11px;color:var(--blue);font-weight:600;">Stil: ${c.style}</div>
              <button class="btn-primary btn-sm" style="margin-top:auto;">Kadroya Ekle ${icon('arrowRight', 13)}</button>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="card" style="text-align:center;padding:24px;border-color:rgba(200,155,60,0.45);">
          <div style="font-size:19px;font-weight:900;color:var(--gold-bright);letter-spacing:0.6px;">RÜYA KADRO HAZIR</div>
          <div class="num" style="font-size:14px;margin:8px 0;">Ortalama OVR: <b>${score.avg}</b> • Sinerji Bonusu: <b style="color:var(--green);">+${score.synergy}</b> • Toplam Güç: <b style="color:var(--gold-bright);">${score.total}</b></div>
          ${score.bonuses.length ? `<div style="display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin-bottom:14px;">${score.bonuses.map(b => `<span class="badge tier-A">${b}</span>`).join('')}</div>` : ''}
          <button class="btn-primary" id="btnStartSwiss" style="padding:11px 24px;font-size:14px;">${icon('globe', 15)} Worlds 2026 İsviçre Aşamasına Başla</button>
        </div>
      `}
    `;
  }

  function renderMayhemTacticBar() {
    if (m.roster.length < 5) return '';
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;padding:8px 12px;background:var(--bg);border:1px solid var(--border);border-radius:7px;margin-bottom:12px;font-size:11.5px;">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="color:var(--text-muted);font-weight:700;">Oyun Planı:</span>
          ${[['aggressive', 'Erken Baskı'], ['balanced', 'Dengeli'], ['scaling', 'Geç Oyun Scaling']].map(([k, lbl]) =>
            `<button class="tactic-btn ${m.tacticPlan === k ? 'active' : ''}" data-m-plan="${k}">${lbl}</button>`
          ).join('')}
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="color:var(--text-muted);font-weight:700;">Yıldız Odak:</span>
          ${m.roster.map((p, i) =>
            `<button class="tactic-btn ${m.focusRoleIdx === i ? 'active' : ''}" data-m-focus="${i}">${p.role}: ${p.name.split(' ').slice(1).join(' ')}</button>`
          ).join('')}
        </div>
      </div>
    `;
  }

  function renderSwissStage() {
    const userT = m.swissTeams.find(t => t.id === 'user');
    const userMatch = m.swissMatches.find(sm => sm.aId === 'user' || sm.bId === 'user');
    const oppId = userMatch ? (userMatch.aId === 'user' ? userMatch.bId : userMatch.aId) : null;
    const opp = oppId ? m.swissTeams.find(t => t.id === oppId) : null;

    const sorted = [...m.swissTeams].sort((a, b) => (b.wins - a.wins) || (a.losses - b.losses) || (b.rating - a.rating));

    return `
      ${renderRosterBar()}
      ${renderMayhemTacticBar()}
      ${userMatch && opp ? `
        <div class="card" style="margin-bottom:14px;border-color:var(--gold);background:linear-gradient(135deg, rgba(200,155,60,0.1), var(--bg-card));display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
              <span class="badge tier-S">İSVİÇRE TUR ${m.swissRound} / 5</span>
              <span class="badge tier-A">SKOR GRUBU: ${userMatch.recordLabel}</span>
              <span class="badge ${userMatch.bestOf === 3 ? 'tier-C' : 'tier-B'}">BO${userMatch.bestOf} ${userT.wins === 2 ? '• ÇIKIŞ MAÇI' : userT.losses === 2 ? '• ELEME MAÇI' : ''}</span>
            </div>
            <div style="font-size:16px;font-weight:900;">
              <span style="color:var(--gold-bright);">Rüya Takımın (${m.teamPower.total})</span>
              <span style="color:var(--text-muted);padding:0 8px;">VS</span>
              <span>${opp.name} (${opp.rating})</span>
            </div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Rakip Yıldızı: <b>${opp.star}</b> • ${opp.region}</div>
          </div>
          <button class="btn-primary" id="btnPlaySwissMatch" style="padding:11px 20px;">${icon('play', 14)} Maça Çık (BO${userMatch.bestOf})</button>
        </div>
      ` : ''}

      <div class="grid-2">
        <div class="card" style="max-height:390px;overflow-y:auto;">
          <div class="card-header"><span class="card-title">${icon('globe', 14)} 16 Takımlı İsviçre Tablosu</span><span style="font-size:11px;color:var(--text-muted);">3G = Çeyrek Final • 3M = Elendi</span></div>
          <table>
            <thead><tr><th>Takım</th><th>Güç</th><th>G-M</th><th>Durum</th></tr></thead>
            <tbody>
              ${sorted.map(t => {
                const badge = t.status === 'QUALIFIED' ? '<span class="badge tier-S">ÇEYREK FİNAL</span>' : t.status === 'ELIMINATED' ? '<span class="badge tier-C">ELENDİ</span>' : '<span class="badge tier-A">DEVAM</span>';
                return `
                  <tr class="${t.id === 'user' ? 'highlight-row' : ''}">
                    <td><span class="team-tag" style="background:${t.color};color:${t.color2};margin-right:6px;">${t.tag}</span>${t.name}</td>
                    <td>${t.rating}</td>
                    <td><b>${t.wins}-${t.losses}</b></td>
                    <td>${badge}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="card" style="max-height:390px;overflow-y:auto;">
          <div class="card-header"><span class="card-title">${icon('sword', 14)} Tur ${m.swissRound} Eşleşmeleri</span></div>
          ${m.swissMatches.map(sm => {
            const ta = m.swissTeams.find(t => t.id === sm.aId);
            const tb = m.swissTeams.find(t => t.id === sm.bId);
            const isUser = sm.aId === 'user' || sm.bId === 'user';
            return `
              <div class="bracket-match" style="display:flex;justify-content:space-between;align-items:center;${isUser ? 'border-color:var(--gold);background:var(--gold-soft);' : ''}">
                <span><span class="badge tier-B" style="margin-right:6px;">${sm.recordLabel} • BO${sm.bestOf}</span><b>${ta.tag}</b> vs <b>${tb.tag}</b></span>
                <span class="num" style="font-size:12px;color:var(--text-muted);">${sm.played ? `${sm.aScore}-${sm.bScore}` : 'Sırada'}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function renderLiveMatchStage() {
    const s = m.activeSeries;
    const shown = s.timeline.moments.slice(0, s.revealedCount);
    const last = shown[shown.length - 1] || { min: 0, uKills: 0, oKills: 0, uGold: 2500, oGold: 2500, uDrag: 0, oDrag: 0, uBaron: 0, oBaron: 0 };

    return `
      <div class="scoreboard-bar" style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:13px;color:var(--blue);font-weight:800;">Rüya Takımın (SEN)</div>
            <div class="stat-strip num">
              <span>Altın <b>${(last.uGold / 1000).toFixed(1)}k</b></span>
              <span>Ejder <b>${last.uDrag}</b></span>
              <span>Baron <b>${last.uBaron}</b></span>
            </div>
          </div>
          <div class="num" style="font-size:28px;font-weight:900;color:var(--blue);">${last.uKills}</div>
        </div>

        <div style="text-align:center;padding:0 16px;border-left:1px solid var(--border);border-right:1px solid var(--border);">
          <div style="font-size:10.5px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">${s.titleLabel} • BO${s.bestOf}</div>
          <div class="num" style="font-size:20px;font-weight:900;color:var(--gold-bright);">SERİ ${s.uScore} - ${s.oScore}</div>
          <div class="num" style="font-size:11px;color:var(--text-muted);">Maç ${s.gameNum} • ${String(last.min).padStart(2, '0')}:00</div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div class="num" style="font-size:28px;font-weight:900;color:var(--red);">${last.oKills}</div>
          <div style="text-align:right;">
            <div style="font-size:13px;color:var(--red);font-weight:800;">${s.oppTeam.name}</div>
            <div class="stat-strip num" style="justify-content:flex-end;">
              <span>Baron <b>${last.oBaron}</b></span>
              <span>Ejder <b>${last.oDrag}</b></span>
              <span>Altın <b>${(last.oGold / 1000).toFixed(1)}k</b></span>
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:12px;">
        <div class="card-header">
          <span class="card-title">${icon('sword', 14)} Maç ${s.gameNum} — Önemli Anlar</span>
          ${!s.gameFinished ? `<button class="btn-ghost btn-sm" id="btnMayhemSkipGame">${icon('fast', 12)} Maçı Hızlı Bitir</button>` : `<span class="badge ${s.timeline.userWins ? 'tier-S' : 'tier-C'}">${s.timeline.userWins ? 'GALİBİYET' : 'MAĞLUBİYET'} • MVP: ${s.timeline.mvpName}</span>`}
        </div>
        <div class="event-feed" style="height:260px;">
          ${[...shown].reverse().map(ev => `
            <div class="event-item ${ev.side} ${ev.type}">
              <span class="num" style="color:var(--gold-bright);font-weight:800;min-width:28px;">${ev.min}'</span>
              <span class="ev-tag ev-tag-${ev.type}">${ev.tag}</span>
              <span>${ev.text}</span>
            </div>
          `).join('')}
        </div>
      </div>

      ${s.gameFinished ? `
        <div style="display:flex;justify-content:flex-end;gap:10px;">
          ${s.seriesFinished
            ? `<button class="btn-primary" id="btnMayhemFinishSeries" style="padding:10px 20px;">${s.uScore > s.oScore ? 'Turu Geç ve Devam Et' : 'Turnuva Sonucunu Gör'} (${s.uScore}-${s.oScore}) ${icon('arrowRight', 14)}</button>`
            : `<button class="btn-primary" id="btnMayhemNextGame" style="padding:10px 20px;">Maç ${s.gameNum + 1}'e Geç ${icon('arrowRight', 14)}</button>`}
        </div>
      ` : ''}
    `;
  }

  function renderKnockoutStage() {
    const curRound = m.koRounds[m.koRound];
    const userMatch = curRound.matches.find(km => km.aId === 'user' || km.bId === 'user');
    const oppId = userMatch ? (userMatch.aId === 'user' ? userMatch.bId : userMatch.aId) : null;
    const opp = oppId ? m.swissTeams.find(t => t.id === oppId) : null;

    return `
      ${renderRosterBar()}
      ${renderMayhemTacticBar()}
      ${userMatch && opp ? `
        <div class="card" style="margin-bottom:14px;border-color:var(--gold);background:linear-gradient(135deg, rgba(200,155,60,0.12), var(--bg-card));display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <div style="margin-bottom:4px;"><span class="badge tier-S">${curRound.name}</span></div>
            <div style="font-size:17px;font-weight:900;">
              <span style="color:var(--gold-bright);">Rüya Takımın (${m.teamPower.total})</span>
              <span style="color:var(--text-muted);padding:0 8px;">VS</span>
              <span>${opp.name} (${opp.rating})</span>
            </div>
          </div>
          <button class="btn-primary" id="btnPlayKOMatch" style="padding:11px 22px;">${icon('play', 14)} BO5 Serisine Çık</button>
        </div>
      ` : ''}

      <div class="card">
        <div class="card-header"><span class="card-title">${icon('trophy', 14)} Worlds 2026 Eleme Ağacı (Top 8)</span></div>
        <div class="bracket-grid">
          ${m.koRounds.map(r => `
            <div>
              <div style="font-size:12px;font-weight:800;color:var(--gold-bright);margin-bottom:8px;">${r.name}</div>
              ${r.matches.length === 0 ? '<div style="font-size:12px;color:var(--text-dim);">Bekleniyor</div>' : r.matches.map(km => {
                const ta = m.swissTeams.find(t => t.id === km.aId);
                const tb = m.swissTeams.find(t => t.id === km.bId);
                return `
                  <div class="bracket-match" style="${(km.aId === 'user' || km.bId === 'user') ? 'border-color:var(--gold);' : ''}">
                    <div class="bracket-row ${km.winnerId === ta.id ? 'winner' : ''}">
                      <span><span class="team-tag" style="background:${ta.color};color:${ta.color2};margin-right:6px;">${ta.tag}</span>${ta.name}</span>
                      <b class="num">${km.played ? km.aScore : '-'}</b>
                    </div>
                    <div class="bracket-row ${km.winnerId === tb.id ? 'winner' : ''}">
                      <span><span class="team-tag" style="background:${tb.color};color:${tb.color2};margin-right:6px;">${tb.tag}</span>${tb.name}</span>
                      <b class="num">${km.played ? km.bScore : '-'}</b>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderFinishedStage() {
    const champ = m.finalStatus === 'CHAMPION';
    return `
      ${renderRosterBar()}
      <div class="card" style="text-align:center;padding:30px 20px;border-color:${champ ? 'var(--gold)' : 'var(--red)'};">
        <div style="font-size:24px;font-weight:900;color:${champ ? 'var(--gold-bright)' : 'var(--red)'};letter-spacing:0.6px;">
          ${champ ? 'WORLDS 2026 ŞAMPİYONU — SİHİRDAR KUPASI SENİN' : `TURNUVAYA VEDA — ${m.finalPlace}`}
        </div>
        <div class="num" style="font-size:14px;color:var(--text-muted);margin:10px 0 18px;">
          Kadronun Gücü: <b style="color:var(--text);">${m.teamPower.total}</b> •
          Seri Skoru: <b style="color:var(--text);">${m.userRecord.seriesW}G - ${m.userRecord.seriesL}M</b> •
          Oyun Skoru: <b style="color:var(--text);">${m.userRecord.gameW}G - ${m.userRecord.gameL}M</b>
        </div>
        <button class="btn-primary" id="btnMayhemRestart" style="padding:11px 22px;">${icon('refresh', 14)} Yeni Worlds 2026 Mayhem Başlat</button>
      </div>
    `;
  }

  function render() {
    let body = '';
    if (m.stage === 'DRAFT') body = renderDraftStage();
    else if (m.stage === 'SWISS') body = renderSwissStage();
    else if (m.stage === 'MATCH') body = renderLiveMatchStage();
    else if (m.stage === 'KNOCKOUT') body = renderKnockoutStage();
    else if (m.stage === 'FINISHED') body = renderFinishedStage();

    box.innerHTML = `
      <div class="card-header">
        <div>
          <span class="card-title" style="font-size:15px;">${icon('flame', 16)} WORLDS 2026 MAYHEM — 16 Takımlı İsviçre & Eleme Turnuvası</span>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">5 efsane sezon kartıyla kadronu kur, İsviçre aşamasından çık ve maç maç Sihirdar Kupası'na yürü.</div>
        </div>
        <button class="btn-ghost btn-sm" id="btnCloseMayhem">${icon('x', 14)} Kapat</button>
      </div>
      ${body}
    `;

    box.querySelector('#btnCloseMayhem')?.addEventListener('click', () => { clearTimer(); backdrop.remove(); });
    box.querySelector('#btnMayhemReroll')?.addEventListener('click', () => {
      if (m.rerolls > 0) { m.rerolls--; rollChoices(); render(); }
    });
    box.querySelectorAll('[data-pick-legend]').forEach(el => {
      el.addEventListener('click', () => {
        m.roster.push(m.choices[Number(el.dataset.pickLegend)]);
        m.roleIdx++;
        if (m.roleIdx < ROLES.length) rollChoices();
        render();
      });
    });
    box.querySelectorAll('[data-m-plan]').forEach(b => b.addEventListener('click', () => { m.tacticPlan = b.dataset.mPlan; render(); }));
    box.querySelectorAll('[data-m-focus]').forEach(b => b.addEventListener('click', () => { m.focusRoleIdx = Number(b.dataset.mFocus); render(); }));
    box.querySelector('#btnStartSwiss')?.addEventListener('click', initSwissTournament);

    box.querySelector('#btnPlaySwissMatch')?.addEventListener('click', () => {
      const userMatch = m.swissMatches.find(sm => sm.aId === 'user' || sm.bId === 'user');
      if (userMatch) startUserSeriesMatch(userMatch, 'SWISS', `İSVİÇRE TUR ${m.swissRound}`);
    });

    box.querySelector('#btnPlayKOMatch')?.addEventListener('click', () => {
      const curRound = m.koRounds[m.koRound];
      const userMatch = curRound.matches.find(km => km.aId === 'user' || km.bId === 'user');
      if (userMatch) startUserSeriesMatch(userMatch, 'KNOCKOUT', curRound.name);
    });

    box.querySelector('#btnMayhemSkipGame')?.addEventListener('click', finishCurrentMayhemGame);
    box.querySelector('#btnMayhemNextGame')?.addEventListener('click', () => {
      m.activeSeries.gameNum++;
      startNextGameInMayhemSeries();
    });
    box.querySelector('#btnMayhemFinishSeries')?.addEventListener('click', completeActiveSeriesAndReturn);

    box.querySelector('#btnMayhemRestart')?.addEventListener('click', () => {
      clearTimer();
      m.stage = 'DRAFT'; m.roleIdx = 0; m.rerolls = 3; m.roster = []; m.activeSeries = null;
      m.userRecord = { seriesW: 0, seriesL: 0, gameW: 0, gameL: 0 };
      rollChoices();
      render();
    });
  }

  rollChoices();
  render();
}

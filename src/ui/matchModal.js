// LoL Esports Manager v2.1 — Pro Broadcast Series Modal (Zero Emojis, SVG Icons, Fearless Draft, 2D Minimap, Role Micro-Tactics)
import { CHAMPIONS, CHAMPION_MAP, getChampionMetaTier } from '../data/champions.js';
import { ROLES, getRivalryName } from '../data/teamsAndPlayers.js';
import {
  DRAFT_STEPS, createDraftState, applyDraftAction, chooseAIDraftAction,
  autoCompleteDraft, analyzeDraftSide, getMissingRoles
} from '../engine/draftEngine.js';
import {
  createLiveMatchState, stepMatchMinute, finishMatchInstantly, applyMatchOutcomeToPlayers
} from '../engine/matchEngine.js';
import { getTeamRoster, getCurrentPatch, recordSeriesResult, TEAM_TALK_OPTIONS, applyPostMatchTeamTalk } from '../engine/gameEngine.js';
import { icon } from './icons.js';

export function openSeriesModal(gameState, match, onSeriesComplete) {
  const blueTeam = gameState.teams.find(t => t.id === match.blueId);
  const redTeam = gameState.teams.find(t => t.id === match.redId);
  const blueRoster = getTeamRoster(gameState, match.blueId);
  const redRoster = getTeamRoster(gameState, match.redId);
  const patch = getCurrentPatch(gameState);
  const userSide = match.blueId === gameState.userTeamId ? 'blue' : 'red';
  const oppTeam = userSide === 'blue' ? redTeam : blueTeam;
  const oppRoster = userSide === 'blue' ? redRoster : blueRoster;
  const needed = Math.ceil(match.bestOf / 2);
  const rivalry = getRivalryName(match.blueId, match.redId);
  const highStakes = (gameState.phase !== 'SPRING_SPLIT' && gameState.phase !== 'SUMMER_SPLIT') || !!rivalry;

  const scrimIntel = gameState.scrimIntel?.[oppTeam.id] || null;

  const series = {
    gameNum: 1,
    blueScore: 0,
    redScore: 0,
    fearlessLocked: new Set(),
    phase: 'DRAFT',
    draft: null,
    liveMatch: null,
    teamTalk: 'none',
    postTalkDone: false,
    postTalkMsg: '',
    champRequests: [],
    roleFilter: 'ALL',
    search: '',
    speed: 1,
    paused: false,
    timerId: null,
    aiTimerId: null,
  };

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  const box = document.createElement('div');
  box.className = 'modal-box';
  backdrop.appendChild(box);
  document.body.appendChild(backdrop);

  function cleanupTimers() {
    if (series.timerId) { clearInterval(series.timerId); series.timerId = null; }
    if (series.aiTimerId) { clearTimeout(series.aiTimerId); series.aiTimerId = null; }
  }

  function generatePlayerChampRequests(lockedSet) {
    const userRoster = userSide === 'blue' ? blueRoster : redRoster;
    const shuffled = [...userRoster].sort(() => Math.random() - 0.5);
    const count = Math.min(3, Math.max(2, Math.floor(Math.random() * 2) + 2));
    const lines = [
      (cn) => `"Koç, ${cn} açık kalırsa alabilir miyiz? Çok rahatım!"`,
      (cn) => `"Bu maçta ${cn} ile koridoru domine edebilirim!"`,
      (cn) => `"${cn} metasını çok çalıştım, bana bırak!"`,
      (cn) => `"${cn} alırsak takım savaşını tek başıma taşırım!"`,
      (cn) => `"Scrimlerde ${cn} ile kaybetmedim, rakip buna hazır değil!"`,
      (cn) => `"Eğer ${cn} çekersek erken oyunda haritayı tamamen açarım."`,
      (cn) => `"Koç bana güven, bu seride ${cn} fark yaratacak!"`,
      (cn) => `"Rakibin kompozisyonuna karşı ${cn} tam panzehir olur."`,
      (cn) => `"${cn} ile yan koridor baskısı kurup kuleleri eritirim!"`,
      (cn) => `"Bugün elim çok sıcak, ${cn} ver bana şov yapayım!"`,
      (cn) => `"Geç oyuna kalırsak ${cn} ile kimse beni durduramaz."`,
      (cn) => `"${cn} seçimini kilitlersek objektif savaşlarında çok üstün oluruz!"`,
    ];
    const reqs = [];
    const usedIds = new Set(lockedSet);
    for (const p of shuffled) {
      if (reqs.length >= count) break;
      const roleChamps = CHAMPIONS.filter(c => c.roles.includes(p.role) && !usedIds.has(c.id));
      let candId = null;
      if (p.learningChampId && !usedIds.has(p.learningChampId)) candId = p.learningChampId;
      if (!candId) {
        const availSigs = (p.sigChamps || []).filter(id => !usedIds.has(id) && CHAMPION_MAP[id]?.roles.includes(p.role));
        if (availSigs.length) candId = availSigs[Math.floor(Math.random() * availSigs.length)];
      }
      if (!candId && roleChamps.length) {
        const metaTop = roleChamps.filter(c => ['S', 'A'].includes(getChampionMetaTier(c, patch)));
        const pool = metaTop.length ? metaTop : roleChamps;
        candId = pool[Math.floor(Math.random() * pool.length)].id;
      }
      if (candId) {
        usedIds.add(candId);
        const ch = CHAMPION_MAP[candId];
        reqs.push({
          playerId: p.id,
          playerName: p.name,
          role: p.role,
          trait: p.trait,
          champId: candId,
          champName: ch?.name || candId,
          line: lines[Math.floor(Math.random() * lines.length)](ch?.name || candId),
        });
      }
    }
    return reqs;
  }

  function evaluateChampRequestOutcomes() {
    const userPicks = userSide === 'blue' ? series.draft.bluePicks : series.draft.redPicks;
    const allBans = new Set([...series.draft.blueBans, ...series.draft.redBans]);
    const oppPicks = new Set(Object.values(userSide === 'blue' ? series.draft.redPicks : series.draft.bluePicks));
    const grantedRequestIds = [];
    const ignoredEgoIds = [];
    for (const req of series.champRequests) {
      if (userPicks[req.role] === req.champId) {
        grantedRequestIds.push(req.playerId);
      } else if (req.trait === 'Ego' && !allBans.has(req.champId) && !oppPicks.has(req.champId)) {
        ignoredEgoIds.push(req.playerId);
      }
    }
    return { grantedRequestIds, ignoredEgoIds };
  }

  function startNewGameInSeries() {
    cleanupTimers();
    series.phase = 'DRAFT';
    series.roleFilter = 'ALL';
    series.search = '';
    const locked = gameState.fearlessEnabled ? series.fearlessLocked : new Set();
    series.draft = createDraftState(blueTeam, redTeam, blueRoster, redRoster, patch, userSide, locked);
    series.champRequests = generatePlayerChampRequests(locked);
    box.scrollTop = 0;
    render();
    scheduleAIDraftIfNeeded();
  }

  function scheduleAIDraftIfNeeded() {
    if (series.phase !== 'DRAFT' || series.draft.finished) return;
    const step = DRAFT_STEPS[series.draft.stepIndex];
    if (step && step.side !== userSide) {
      series.aiTimerId = setTimeout(() => {
        const move = chooseAIDraftAction(series.draft);
        if (move) applyDraftAction(series.draft, move.champId, move.role);
        render();
        scheduleAIDraftIfNeeded();
      }, 750);
    }
  }

  function startLiveMatch() {
    cleanupTimers();
    series.phase = 'MATCH';
    series.paused = false;
    const reqRes = evaluateChampRequestOutcomes();
    series.liveMatch = createLiveMatchState(
      blueTeam, redTeam, blueRoster, redRoster,
      series.draft.bluePicks, series.draft.redPicks, patch, userSide, highStakes,
      { teamTalk: series.teamTalk, hasScrimIntel: !!scrimIntel, ...reqRes }
    );
    box.scrollTop = 0;
    render();
    startMatchLoop();
  }

  function startMatchLoop() {
    if (series.timerId) clearInterval(series.timerId);
    const ms = series.speed === 4 ? 420 : series.speed === 2 ? 950 : series.speed === 0.5 ? 2800 : 1850;
    series.timerId = setInterval(() => {
      if (series.paused || series.liveMatch.finished) {
        if (series.liveMatch.finished) {
          clearInterval(series.timerId);
          series.timerId = null;
          onGameEnded();
        }
        return;
      }
      stepMatchMinute(series.liveMatch);
      if (series.liveMatch.finished) {
        clearInterval(series.timerId);
        series.timerId = null;
        onGameEnded();
      }
      render();
    }, ms);
  }

  function onGameEnded() {
    applyMatchOutcomeToPlayers(series.liveMatch);
    if (gameState.fearlessEnabled) {
      Object.values(series.draft.bluePicks).forEach(id => series.fearlessLocked.add(id));
      Object.values(series.draft.redPicks).forEach(id => series.fearlessLocked.add(id));
    }
    if (series.liveMatch.winner === 'blue') series.blueScore++;
    else series.redScore++;
    render();
  }

  function renderHeader() {
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;padding-bottom:12px;border-bottom:1px solid var(--border);">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <span class="team-tag" style="background:${blueTeam.color};color:${blueTeam.color2};">${blueTeam.tag}</span>
          <strong style="font-size:15.5px;">${blueTeam.name}</strong>
          <span class="num" style="font-size:20px;font-weight:900;color:var(--gold-bright);padding:0 8px;">${series.blueScore} - ${series.redScore}</span>
          <strong style="font-size:15.5px;">${redTeam.name}</strong>
          <span class="team-tag" style="background:${redTeam.color};color:${redTeam.color2};">${redTeam.tag}</span>
          <span class="badge tier-A">BO${match.bestOf} • MAÇ ${series.gameNum}</span>
          ${gameState.fearlessEnabled ? `<span class="badge tier-S">${icon('lock', 11)} FEARLESS (${series.fearlessLocked.size})</span>` : ''}
          ${rivalry ? `<span class="badge tier-C">${icon('sword', 11)} ${rivalry}</span>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="badge tier-B">Yama ${patch.version}</span>
          ${series.phase === 'DRAFT' && !series.draft.finished ? `<button class="btn-ghost btn-sm" id="btnAutoDraft">${icon('fast', 13)} Oto-Draft Tamamla</button>` : ''}
        </div>
      </div>
    `;
  }

  function renderDraft() {
    const d = series.draft;
    const step = DRAFT_STEPS[d.stepIndex];
    const isUserTurn = step && step.side === userSide && !d.finished;
    const blueAn = analyzeDraftSide(d.bluePicks, blueRoster, patch, d.redPicks);
    const redAn = analyzeDraftSide(d.redPicks, redRoster, patch, d.bluePicks);

    const oppStar = [...oppRoster].sort((a, b) => b.ovr - a.ovr)[0];
    const oppPlanLabel = { aggressive: 'Erken Baskı', balanced: 'Dengeli', scaling: 'Geç Oyun Scaling', split: 'Split Push' }[oppTeam.tactics?.gameplan] || 'Dengeli';
    const scoutingHtml = `
      <div style="background:var(--blue-soft);border:1px solid rgba(56,189,248,0.28);border-radius:7px;padding:8px 12px;margin-top:10px;font-size:12px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <span style="display:inline-flex;align-items:center;gap:6px;">${icon('search', 13)} <b>Rakip Scout (${oppTeam.tag}):</b> Stil: <b>${oppPlanLabel}</b> • Odak: <b>${oppTeam.tactics?.laneFocus || 'MID'}</b></span>
        <span>Kilit Oyuncu: <b>${oppStar?.name} (${oppStar?.role}, ${oppStar?.ovr})</b> — İmza: <b>${(oppStar?.sigChamps || []).slice(0, 3).map(id => CHAMPION_MAP[id]?.name).join(', ')}</b></span>
      </div>
    `;

    const renderSideColumn = (side, team, roster, bans, picks, an) => {
      const sideColor = side === 'blue' ? 'var(--blue)' : 'var(--red)';
      const banSlots = [0, 1, 2, 3, 4].map(i => {
        const cid = bans[i];
        const ch = cid ? CHAMPION_MAP[cid] : null;
        return `<div class="ban-box ${ch ? 'filled' : ''}">${ch ? ch.name : 'BAN'}</div>`;
      }).join('');

      const pickSlots = ROLES.map(role => {
        const p = roster.find(x => x.role === role);
        const cid = picks[role];
        const ch = cid ? CHAMPION_MAP[cid] : null;
        const isSig = ch && p && p.sigChamps.includes(ch.id);
        const tier = ch ? getChampionMetaTier(ch, patch) : '';
        const mast = ch && p?.mastery?.[ch.id] ? Math.floor(p.mastery[ch.id]) : 0;
        const req = side === userSide ? series.champRequests.find(r => r.role === role) : null;
        return `
          <div class="draft-slot">
            <div>
              <div style="display:flex;align-items:center;gap:5px;">
                <span class="badge role-${role}">${role}</span>
                <strong style="font-size:12.5px;">${p ? p.name : role}</strong>
                <span class="num" style="font-size:11px;color:var(--text-muted);">(${p?.ovr})</span>
              </div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:3px;display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
                ${ch
                  ? `<span style="color:${sideColor};font-weight:700;">${ch.name}</span> <span class="badge tier-${tier}">${tier}</span> ${isSig ? `<span style="color:var(--gold-bright);" title="İmza Şampiyon">${icon('star', 11)}</span>` : ''} ${mast > 0 ? `<span style="color:var(--green);font-weight:700;">U${mast}</span>` : ''} ${req && req.champId === ch.id ? `<span class="badge tier-S" title="Oyuncu isteği yerine getirildi (+2.0 Konfor & +3 Moral)">İSTEK ✓</span>` : ''}`
                  : `${req ? `<span style="color:var(--gold-bright);font-weight:700;">İstiyor: ${req.champName}</span>` : `İmza: ${(p?.sigChamps || []).slice(0, 2).map(id => CHAMPION_MAP[id]?.name).join(', ')}`}`}
              </div>
            </div>
            ${ch ? `<div class="champ-avatar" style="background:${ch.color};width:28px;height:28px;font-size:10px;">${ch.name.slice(0, 2).toUpperCase()}</div>` : ''}
          </div>
        `;
      }).join('');

      return `
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <strong style="color:${sideColor};font-size:13px;letter-spacing:0.3px;">${team.tag} ${side === userSide ? '(SEN)' : '(AI)'}</strong>
            <span class="badge tier-A">Draft: ${an.score || '-'}</span>
          </div>
          <div class="ban-row">${banSlots}</div>
          ${pickSlots}
          <div class="card" style="padding:9px;font-size:11px;margin-top:6px;">
            <div class="num" style="display:flex;justify-content:space-between;"><span>Erken: <b>${an.early}</b></span><span>Orta: <b>${an.mid}</b></span><span>Geç: <b>${an.late}</b></span></div>
            <div class="num" style="display:flex;justify-content:space-between;margin-top:3px;color:var(--text-muted);">
              <span>Engage: ${an.engage}</span>
              <span style="color:${an.counterEdge >= 0 ? 'var(--green)' : 'var(--red)'};">Counter: ${an.counterEdge >= 0 ? '+' : ''}${an.counterEdge}</span>
            </div>
            ${an.warnings.length ? `<div style="color:#fda4af;margin-top:4px;">Uyarı: ${an.warnings.join(', ')}</div>` : ''}
          </div>
        </div>
      `;
    };

    const userMissing = getMissingRoles(userSide === 'blue' ? d.bluePicks : d.redPicks);
    const filteredChamps = CHAMPIONS.filter(c => {
      if (series.roleFilter !== 'ALL' && !c.roles.includes(series.roleFilter)) return false;
      if (series.search && !c.name.toLowerCase().includes(series.search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => {
      const order = { S: 3, A: 2, B: 1, C: 0 };
      return order[getChampionMetaTier(b, patch)] - order[getChampionMetaTier(a, patch)];
    });

    const userRoster = userSide === 'blue' ? blueRoster : redRoster;
    const allUserSigs = new Set(userRoster.flatMap(p => p.sigChamps));

    const centerContent = d.finished ? `
      <div class="card" style="text-align:center;padding:36px 20px;display:flex;flex-direction:column;align-items:center;gap:14px;">
        <div style="font-size:18px;font-weight:900;letter-spacing:0.8px;color:var(--gold-bright);">DRAFT TAMAMLANDI</div>
        <p style="color:var(--text-muted);font-size:13px;max-width:420px;">
          Her iki takım kompozisyonunu kilitledi. Sihirdar Vadisi'nde canlı mikro taktiklerinle maçı yönetebilirsin.
        </p>
        <div style="display:flex;gap:10px;">
          <button class="btn-primary" id="btnStartLiveMatch" style="padding:11px 22px;font-size:14px;">${icon('play', 14)} Canlı Maçı Başlat</button>
          <button class="btn-ghost" id="btnInstantMatch">${icon('fast', 14)} Hızlı Simüle Et</button>
        </div>
      </div>
    ` : `
      <div>
        <div style="background:${isUserTurn ? 'var(--gold-soft)' : 'var(--bg-card)'};border:1px solid ${isUserTurn ? 'var(--gold)' : 'var(--border)'};border-radius:7px;padding:9px 13px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
          <div style="font-size:12.5px;font-weight:800;color:${isUserTurn ? 'var(--gold-bright)' : 'var(--text-muted)'};">
            ${isUserTurn ? (step.type === 'ban' ? 'SENİN SIRAN — Şampiyon Yasakla (BAN)' : `SENİN SIRAN — Şampiyon Seç (Kalan: ${userMissing.join(', ')})`) : `Rakip seçimi bekleniyor... (${step.label})`}
          </div>
          <span class="num" style="font-size:11px;color:var(--text-muted);">Adım ${d.stepIndex + 1}/20</span>
        </div>

        <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;align-items:center;">
          ${['ALL', ...ROLES].map(r => `<button class="tactic-btn ${series.roleFilter === r ? 'active' : ''}" data-role-filter="${r}">${r === 'ALL' ? 'Tümü' : r}</button>`).join('')}
          <input type="text" id="champSearch" placeholder="Şampiyon ara..." value="${series.search}" style="flex:1;min-width:120px;padding:5px 9px;" />
        </div>

        <div class="champ-grid">
          ${filteredChamps.map(c => {
            const isFearless = d.fearlessLocked.has(c.id);
            const used = d.usedChamps.has(c.id);
            const tier = getChampionMetaTier(c, patch);
            const isSig = allUserSigs.has(c.id);
            const reqBy = series.champRequests.find(r => r.champId === c.id);
            const fitsMissing = step.type === 'ban' || c.roles.some(r => userMissing.includes(r));
            const disabled = used || !isUserTurn || !fitsMissing;
            return `
              <div class="champ-card ${disabled ? 'disabled' : ''}" data-champ-pick="${c.id}" style="${reqBy && !used ? 'border-color:var(--gold);box-shadow:0 0 0 1px rgba(200,155,60,0.45);' : ''}" title="${isFearless ? 'Fearless Draft: Önceki maçta kullanıldı' : reqBy ? `${reqBy.playerName} bu şampiyonu istiyor!` : c.name}">
                <div class="champ-avatar" style="background:${c.color};">${isFearless ? icon('lock', 14) : c.name.slice(0, 2).toUpperCase()}</div>
                <div style="font-size:11.5px;font-weight:700;">${c.name}</div>
                <div style="display:flex;gap:3px;align-items:center;flex-wrap:wrap;justify-content:center;">
                  <span class="badge tier-${tier}">${tier}</span>
                  <span style="font-size:10px;color:var(--text-muted);">${c.roles[0]}</span>
                  ${reqBy ? `<span class="badge tier-S" style="font-size:9px;padding:1px 4px;">İSTEK</span>` : (isSig ? `<span style="color:var(--gold-bright);" title="İmza Şampiyon">${icon('star', 10)}</span>` : '')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    const talkBar = `
      <div class="card" style="padding:9px 12px;margin-bottom:10px;border-color:rgba(200,155,60,0.35);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span style="font-size:11.5px;font-weight:800;color:var(--gold-bright);">${icon('users', 13)} Maç Önü Soyunma Odası Konuşması:</span>
          <div class="tactic-btn-group">
            ${TEAM_TALK_OPTIONS.map(t => `<button class="tactic-btn ${series.teamTalk === t.id ? 'active' : ''}" data-pre-talk="${t.id}" title="${t.desc}">${t.name.split(' (')[0]}</button>`).join('')}
          </div>
        </div>
        ${scrimIntel ? `<span class="badge tier-S" title="Scrim İstihbaratı: Plan ${scrimIntel.gameplan}, Odak ${scrimIntel.laneFocus}">${icon('target', 11)} Scrim İstihbaratı Aktif (+1.2) • Plan: ${scrimIntel.gameplan}</span>` : ''}
      </div>
    `;

    const userPicksNow = userSide === 'blue' ? d.bluePicks : d.redPicks;
    const requestsBar = series.champRequests.length ? `
      <div class="card" style="padding:8px 12px;margin-bottom:10px;border-color:rgba(56,189,248,0.35);background:rgba(56,189,248,0.05);">
        <div style="font-size:11px;font-weight:800;color:var(--blue);margin-bottom:5px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;">
          <span>${icon('star', 12)} OYUNCU ŞAMPİYON İSTEKLERİ (İsteği karşılarsan +2.0 Konfor & +3 Moral)</span>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${series.champRequests.map(r => {
            const granted = userPicksNow[r.role] === r.champId;
            const unavailable = !granted && d.usedChamps.has(r.champId);
            return `
              <div style="flex:1;min-width:210px;background:var(--bg);border:1px solid ${granted ? 'var(--green)' : unavailable ? 'var(--border)' : 'rgba(200,155,60,0.45)'};border-radius:6px;padding:6px 9px;font-size:11.5px;opacity:${unavailable ? '0.55' : '1'};">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;margin-bottom:2px;">
                  <span><span class="badge role-${r.role}">${r.role}</span> <b>${r.playerName}</b> → <b style="color:var(--gold-bright);">${r.champName}</b></span>
                  ${granted ? '<span class="badge tier-A">ALINDI ✓</span>' : unavailable ? '<span class="badge tier-C">YASAK/ALINDI</span>' : '<span class="badge tier-S">İSTİYOR</span>'}
                </div>
                <div style="font-size:10.5px;color:var(--text-muted);font-style:italic;">${r.line}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    ` : '';

    return `
      ${renderHeader()}
      ${talkBar}
      ${requestsBar}
      ${scoutingHtml}
      <div class="draft-layout">
        ${renderSideColumn('blue', blueTeam, blueRoster, d.blueBans, d.bluePicks, blueAn)}
        ${centerContent}
        ${renderSideColumn('red', redTeam, redRoster, d.redBans, d.redPicks, redAn)}
      </div>
    `;
  }

  function renderMinimapSVG(m) {
    const towerDots = (side) => {
      const lanes = side === 'blue' ? m.blueLaneTowers : m.redLaneTowers;
      const col = side === 'blue' ? '#38bdf8' : '#f43f5e';
      const coords = side === 'blue'
        ? { TOP: [[16, 42], [16, 58], [16, 72]], MID: [[38, 62], [30, 70], [23, 77]], BOT: [[58, 84], [42, 84], [28, 84]] }
        : { TOP: [[42, 16], [58, 16], [72, 16]], MID: [[62, 38], [70, 30], [77, 23]], BOT: [[84, 58], [84, 42], [84, 28]] };
      let svg = '';
      for (const lane of ['TOP', 'MID', 'BOT']) {
        const rem = lanes[lane];
        coords[lane].forEach(([x, y], idx) => {
          const alive = (idx === 0 && rem >= 3) || (idx === 1 && rem >= 2) || (idx === 2 && rem >= 1);
          svg += `<circle cx="${x}" cy="${y}" r="2.2" fill="${alive ? col : '#1e293b'}" stroke="${alive ? '#fff' : '#475569'}" stroke-width="0.5" />`;
        });
      }
      return svg;
    };

    const champDots = (players, borderCol) => players.map(p => `
      <g style="transition: transform 0.35s ease;" transform="translate(${p.x}, ${p.y})">
        <circle cx="0" cy="0" r="3.4" fill="${p.champColor}" stroke="${borderCol}" stroke-width="1.2" />
        <text x="0" y="1.2" font-size="3" fill="#fff" text-anchor="middle" font-weight="900">${p.role[0]}</text>
      </g>
    `).join('');

    const pulse = m.lastEventPos
      ? `<circle cx="${m.lastEventPos.x}" cy="${m.lastEventPos.y}" r="7" fill="none" stroke="${m.lastEventPos.color}" stroke-width="1.6" opacity="0.9">
           <animate attributeName="r" from="3" to="9.5" dur="1s" repeatCount="indefinite" />
           <animate attributeName="opacity" from="1" to="0.1" dur="1s" repeatCount="indefinite" />
         </circle>`
      : '';

    return `
      <svg viewBox="0 0 100 100" style="width:100%;max-width:255px;display:block;margin:0 auto;background:#08101c;border:1px solid var(--border);border-radius:8px;">
        <path d="M 15 15 Q 50 50 85 85" stroke="#0c4a6e" stroke-width="7" fill="none" opacity="0.55" />
        <polyline points="14,86 14,14 86,14" stroke="#1e293b" stroke-width="4" fill="none" />
        <polyline points="14,86 86,86 86,14" stroke="#1e293b" stroke-width="4" fill="none" />
        <line x1="14" y1="86" x2="86" y2="14" stroke="#1e293b" stroke-width="3.5" />
        <circle cx="34" cy="30" r="4" fill="rgba(168,85,247,0.28)" stroke="#a855f7" stroke-width="0.8" />
        <text x="34" y="31.5" font-size="3.6" fill="#d8b4fe" text-anchor="middle" font-weight="bold">B</text>
        <circle cx="66" cy="70" r="4" fill="rgba(245,158,11,0.28)" stroke="#f59e0b" stroke-width="0.8" />
        <text x="66" y="71.5" font-size="3.6" fill="#fcd34d" text-anchor="middle" font-weight="bold">D</text>
        <rect x="9" y="81" width="9" height="9" rx="2" fill="${m.blueNexusHP > 0 ? '#38bdf8' : '#334155'}" />
        <rect x="82" y="10" width="9" height="9" rx="2" fill="${m.redNexusHP > 0 ? '#f43f5e' : '#334155'}" />
        ${towerDots('blue')}
        ${towerDots('red')}
        ${pulse}
        ${champDots(m.bluePlayers, '#38bdf8')}
        ${champDots(m.redPlayers, '#f43f5e')}
      </svg>
    `;
  }

  function renderGoldGraphSVG(history) {
    const w = 270, h = 68;
    const maxAbs = Math.max(2500, ...history.map(v => Math.abs(v)));
    const pts = history.map((v, i) => {
      const x = history.length === 1 ? 0 : (i / (history.length - 1)) * w;
      const y = h / 2 - (v / maxAbs) * (h / 2 - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    const last = history[history.length - 1] || 0;
    const stroke = last >= 0 ? '#38bdf8' : '#f43f5e';

    return `
      <div style="margin-top:8px;">
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-bottom:3px;">
          <span>Altın Farkı Grafiği</span>
          <strong class="num" style="color:${stroke};">${last >= 0 ? `${blueTeam.tag} +${(last / 1000).toFixed(1)}k` : `${redTeam.tag} +${(Math.abs(last) / 1000).toFixed(1)}k`}</strong>
        </div>
        <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:68px;background:var(--bg);border:1px solid var(--border);border-radius:6px;">
          <line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}" stroke="#334155" stroke-dasharray="3,3" stroke-width="1" />
          <polyline points="${pts}" fill="none" stroke="${stroke}" stroke-width="2" />
        </svg>
      </div>
    `;
  }

  function renderLiveMatch() {
    const m = series.liveMatch;
    const uTactics = userSide === 'blue' ? m.blueTactics : m.redTactics;
    const seriesOver = series.blueScore >= needed || series.redScore >= needed;

    const playerRows = (list, sideColor) => list.map(p => `
      <tr>
        <td><span class="badge role-${p.role}">${p.role}</span></td>
        <td><strong style="color:${sideColor};">${p.name}</strong> <span style="font-size:10.5px;color:var(--text-muted);">(${p.champName})</span></td>
        <td style="font-weight:700;">${p.kills}/${p.deaths}/${p.assists}</td>
        <td>${p.cs}</td>
        <td>${(p.gold / 1000).toFixed(1)}k</td>
        ${m.finished ? `<td>${p.dmgShare || 0}%</td><td>${p.vision || 0}</td>` : ''}
        <td><span class="ovr-pill ${p.rating >= 8.0 ? 'ovr-90' : p.rating >= 7.0 ? 'ovr-85' : 'ovr-low'}" style="font-size:11px;">${p.rating.toFixed(1)}</span></td>
      </tr>
    `).join('');

    return `
      ${renderHeader()}
      <div class="scoreboard-bar" style="margin-top:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:12.5px;color:var(--blue);font-weight:800;">${blueTeam.name} ${userSide === 'blue' ? '(SEN)' : ''}</div>
            <div class="stat-strip num">
              <span>Altın <b>${(m.blueGold / 1000).toFixed(1)}k</b></span>
              <span>Kule <b>${m.blueTowers}</b></span>
              <span>Ejder <b>${m.blueDragons}</b></span>
              <span>Baron <b>${m.blueBarons}</b></span>
            </div>
          </div>
          <div class="num" style="font-size:28px;font-weight:900;color:var(--blue);">${m.blueKills}</div>
        </div>

        <div style="text-align:center;padding:0 16px;border-left:1px solid var(--border);border-right:1px solid var(--border);">
          <div class="num" style="font-size:21px;font-weight:900;color:var(--gold-bright);">${String(m.minute).padStart(2, '0')}:00</div>
          <div style="font-size:10px;letter-spacing:0.6px;color:var(--text-muted);font-weight:700;">${m.finished ? 'MAÇ SONU' : (series.paused ? 'DURAKLATILDI' : 'CANLI')}</div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div class="num" style="font-size:28px;font-weight:900;color:var(--red);">${m.redKills}</div>
          <div style="text-align:right;">
            <div style="font-size:12.5px;color:var(--red);font-weight:800;">${redTeam.name} ${userSide === 'red' ? '(SEN)' : ''}</div>
            <div class="stat-strip num" style="justify-content:flex-end;">
              <span>Baron <b>${m.redBarons}</b></span>
              <span>Ejder <b>${m.redDragons}</b></span>
              <span>Kule <b>${m.redTowers}</b></span>
              <span>Altın <b>${(m.redGold / 1000).toFixed(1)}k</b></span>
            </div>
          </div>
        </div>
      </div>

      ${m.finished ? `
        <div class="card" style="margin-top:10px;border-color:var(--gold);background:var(--gold-soft);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <div style="font-size:15.5px;font-weight:900;color:var(--gold-bright);display:flex;align-items:center;gap:7px;">
              ${icon('trophy', 16)} ${m.winner === 'blue' ? blueTeam.name : redTeam.name} Maç ${series.gameNum}'i Kazandı
            </div>
            <div class="num" style="font-size:12.5px;color:var(--text-muted);margin-top:3px;">
              MVP: <b style="color:var(--text);">${m.mvp?.name}</b> (${m.mvp?.champName}) — ${m.mvp?.kills}/${m.mvp?.deaths}/${m.mvp?.assists} • Puan: ${m.mvp?.rating}
              ${m.gd15 !== null ? ` • <b>GD@15:</b> ${m.gd15 >= 0 ? `${blueTeam.tag} +${(m.gd15 / 1000).toFixed(1)}k` : `${redTeam.tag} +${(Math.abs(m.gd15) / 1000).toFixed(1)}k`}` : ''}
            </div>
          </div>
          <div>
            ${seriesOver
              ? `<button class="btn-primary" id="btnFinishSeries" style="padding:10px 18px;">Seriyi Tamamla (${series.blueScore}-${series.redScore}) ${icon('arrowRight', 14)}</button>`
              : `<button class="btn-primary" id="btnNextGame" style="padding:10px 18px;">Maç ${series.gameNum + 1} Draft'ına Geç ${icon('arrowRight', 14)}</button>`}
          </div>
        </div>
        ${seriesOver ? `
          <div class="card" style="margin-top:10px;border-color:rgba(56,189,248,0.4);padding:10px 14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <div style="font-size:12px;">
              <strong style="color:var(--blue);">${icon('users', 13)} Maç Sonu Soyunma Odası Konuşması:</strong>
              ${series.postTalkDone ? `<span style="color:var(--green);margin-left:6px;">${series.postTalkMsg}</span>` : '<span style="color:var(--text-muted);margin-left:6px;">Takıma ne söyleyeceksin?</span>'}
            </div>
            ${!series.postTalkDone ? `
              <div style="display:flex;gap:6px;flex-wrap:wrap;">
                <button class="btn-green btn-sm" data-post-talk="praise">Tebrik Et (+Moral)</button>
                <button class="btn-danger btn-sm" data-post-talk="criticize">Sert Eleştir (+Form)</button>
                <button class="btn-blue btn-sm" data-post-talk="calm">Sakinleştir (-Yorgunluk)</button>
              </div>
            ` : ''}
          </div>
        ` : ''}
        ${m.coachReport ? `
          <div class="card" style="margin-top:10px;border-color:var(--border-strong);background:var(--bg-card);">
            <div class="card-header" style="margin-bottom:8px;padding-bottom:6px;">
              <span class="card-title">${icon('target', 13)} Koç Maç Analiz Raporu</span>
              <div class="num" style="display:flex;gap:10px;font-size:11.5px;color:var(--text-muted);flex-wrap:wrap;">
                <span>Draft: <b style="color:${m.coachReport.draftDiff >= 0 ? 'var(--green)' : 'var(--red)'};">${m.coachReport.draftDiff >= 0 ? '+' : ''}${m.coachReport.draftDiff}</b></span>
                <span>0-15': <b style="color:${m.coachReport.gd15 >= 0 ? 'var(--green)' : 'var(--red)'};">${m.coachReport.gd15 >= 0 ? '+' : ''}${(m.coachReport.gd15 / 1000).toFixed(1)}k</b></span>
                <span>15-25': <b style="color:${m.coachReport.midSwing >= 0 ? 'var(--green)' : 'var(--red)'};">${m.coachReport.midSwing >= 0 ? '+' : ''}${(m.coachReport.midSwing / 1000).toFixed(1)}k</b></span>
                <span>25'+: <b style="color:${m.coachReport.lateSwing >= 0 ? 'var(--green)' : 'var(--red)'};">${m.coachReport.lateSwing >= 0 ? '+' : ''}${(m.coachReport.lateSwing / 1000).toFixed(1)}k</b></span>
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;font-size:12px;">
              <div style="flex:1;min-width:260px;">
                ${m.coachReport.notes.map(n => `<div style="margin-bottom:3px;color:var(--text);">• ${n}</div>`).join('')}
              </div>
              <div style="font-size:11.5px;color:var(--text-muted);text-align:right;">
                <div>En İyi: <b style="color:var(--green);">${m.coachReport.bestPlayer}</b></div>
                <div>Gelişim Alanı: <b style="color:var(--amber);">${m.coachReport.weakestPlayer}</b></div>
              </div>
            </div>
          </div>
        ` : ''}
      ` : `
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-top:10px;">
          <div style="display:flex;gap:6px;align-items:center;">
            <button class="btn-ghost btn-sm" id="btnTogglePause">${series.paused ? `${icon('play', 12)} Devam` : `${icon('pause', 12)} Duraklat`}</button>
            <button class="tactic-btn ${series.speed === 0.5 ? 'active' : ''}" data-speed="0.5">0.5x</button>
            <button class="tactic-btn ${series.speed === 1 ? 'active' : ''}" data-speed="1">1x</button>
            <button class="tactic-btn ${series.speed === 2 ? 'active' : ''}" data-speed="2">2x</button>
            <button class="tactic-btn ${series.speed === 4 ? 'active' : ''}" data-speed="4">4x</button>
            <button class="btn-ghost btn-sm" id="btnSkipToEnd">${icon('fast', 12)} Maçı Bitir</button>
          </div>
          <span style="font-size:11.5px;color:var(--text-muted);">Sol panelden anlık takım ve rol taktikleri verebilirsin.</span>
        </div>
      `}

      <div class="match-grid">
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div class="card" style="padding:11px;">
            ${renderMinimapSVG(m)}
            ${renderGoldGraphSVG(m.goldHistory)}
          </div>

          <div class="card" style="padding:11px;">
            <div class="card-title" style="margin-bottom:8px;">${icon('sliders', 13)} Canlı Takım & Rol Taktikleri</div>
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">Oyun Planı</div>
            <div class="tactic-btn-group" style="margin-bottom:7px;">
              ${[['aggressive', 'Erken Baskı'], ['balanced', 'Dengeli'], ['scaling', 'Scaling'], ['split', 'Split']].map(([k, lbl]) =>
                `<button class="tactic-btn ${uTactics.gameplan === k ? 'active' : ''}" data-tactic-plan="${k}">${lbl}</button>`
              ).join('')}
            </div>
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">Ormancı Odak & Objektif</div>
            <div class="tactic-btn-group" style="margin-bottom:7px;">
              ${['TOP', 'MID', 'BOT'].map(l => `<button class="tactic-btn ${uTactics.laneFocus === l ? 'active' : ''}" data-tactic-lane="${l}">${l}</button>`).join('')}
              ${[['dragon', 'Ejder'], ['baron', 'Baron'], ['towers', 'Kule']].map(([k, lbl]) => `<button class="tactic-btn ${uTactics.objective === k ? 'active' : ''}" data-tactic-obj="${k}">${lbl}</button>`).join('')}
            </div>
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px;">Rol Mikro Emirleri</div>
            <div class="tactic-btn-group" style="margin-bottom:5px;">
              ${[['carry', 'Top: Carry'], ['balanced', 'Dengeli'], ['weakside', 'Weakside']].map(([k, lbl]) =>
                `<button class="tactic-btn ${uTactics.topStyle === k ? 'active' : ''}" data-tactic-top="${k}">${lbl}</button>`
              ).join('')}
            </div>
            <div class="tactic-btn-group" style="margin-bottom:5px;">
              ${[['roam', 'Sup: Roam'], ['balanced', 'Dengeli'], ['peel', 'Peel']].map(([k, lbl]) =>
                `<button class="tactic-btn ${uTactics.supStyle === k ? 'active' : ''}" data-tactic-sup="${k}">${lbl}</button>`
              ).join('')}
            </div>
            <div class="tactic-btn-group">
              ${[['aggressive', 'ADC: Agresif'], ['balanced', 'Dengeli'], ['safe', 'Güvenli']].map(([k, lbl]) =>
                `<button class="tactic-btn ${uTactics.adcStyle === k ? 'active' : ''}" data-tactic-adc="${k}">${lbl}</button>`
              ).join('')}
            </div>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px;">
          <div class="card" style="padding:11px;">
            <div class="card-title" style="margin-bottom:7px;">Canlı Maç Anlatımı</div>
            <div class="event-feed" id="eventFeed">
              ${[...m.events].reverse().map(ev => `
                <div class="event-item ${ev.side || ''} ${ev.type || ''}">
                  <span class="num" style="color:var(--gold-bright);font-weight:800;min-width:26px;">${ev.min}'</span>
                  ${ev.tag ? `<span class="ev-tag ev-tag-${ev.type || ''}">${ev.tag}</span>` : ''}
                  <span>${ev.text}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="grid-2" style="gap:10px;">
            <div class="card" style="padding:10px;">
              <div style="font-size:12px;font-weight:800;color:var(--blue);margin-bottom:6px;">${blueTeam.tag} ${m.finished ? 'Maç Analitiği' : 'Canlı İstatistik'}</div>
              <table>
                <thead><tr><th>Rol</th><th>Oyuncu</th><th>KDA</th><th>CS</th><th>Altın</th>${m.finished ? '<th>DMG%</th><th>Görüş</th>' : ''}<th>Puan</th></tr></thead>
                <tbody>${playerRows(m.bluePlayers, '#7dd3fc')}</tbody>
              </table>
            </div>
            <div class="card" style="padding:10px;">
              <div style="font-size:12px;font-weight:800;color:var(--red);margin-bottom:6px;">${redTeam.tag} ${m.finished ? 'Maç Analitiği' : 'Canlı İstatistik'}</div>
              <table>
                <thead><tr><th>Rol</th><th>Oyuncu</th><th>KDA</th><th>CS</th><th>Altın</th>${m.finished ? '<th>DMG%</th><th>Görüş</th>' : ''}<th>Puan</th></tr></thead>
                <tbody>${playerRows(m.redPlayers, '#fda4af')}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function render() {
    box.innerHTML = series.phase === 'DRAFT' ? renderDraft() : renderLiveMatch();
    bindEvents();
  }

  function bindEvents() {
    box.querySelector('#btnAutoDraft')?.addEventListener('click', () => {
      cleanupTimers();
      autoCompleteDraft(series.draft);
      render();
    });
    box.querySelectorAll('[data-role-filter]').forEach(btn => {
      btn.addEventListener('click', () => { series.roleFilter = btn.dataset.roleFilter; render(); });
    });
    const searchInput = box.querySelector('#champSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        series.search = e.target.value;
        render();
        const again = box.querySelector('#champSearch');
        if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
      });
    }
    box.querySelectorAll('[data-champ-pick]').forEach(card => {
      if (card.classList.contains('disabled')) return;
      card.addEventListener('click', () => {
        if (applyDraftAction(series.draft, card.dataset.champPick)) {
          render();
          scheduleAIDraftIfNeeded();
        }
      });
    });

    box.querySelectorAll('[data-pre-talk]').forEach(btn => {
      btn.addEventListener('click', () => { series.teamTalk = btn.dataset.preTalk; render(); });
    });
    box.querySelectorAll('[data-post-talk]').forEach(btn => {
      btn.addEventListener('click', () => {
        series.postTalkMsg = applyPostMatchTeamTalk(gameState, btn.dataset.postTalk);
        series.postTalkDone = true;
        render();
      });
    });

    box.querySelector('#btnStartLiveMatch')?.addEventListener('click', startLiveMatch);
    box.querySelector('#btnInstantMatch')?.addEventListener('click', () => {
      cleanupTimers();
      series.phase = 'MATCH';
      const reqRes = evaluateChampRequestOutcomes();
      series.liveMatch = createLiveMatchState(blueTeam, redTeam, blueRoster, redRoster, series.draft.bluePicks, series.draft.redPicks, patch, userSide, highStakes, { teamTalk: series.teamTalk, hasScrimIntel: !!scrimIntel, ...reqRes });
      finishMatchInstantly(series.liveMatch);
      box.scrollTop = 0;
      onGameEnded();
    });

    box.querySelector('#btnTogglePause')?.addEventListener('click', () => { series.paused = !series.paused; render(); });
    box.querySelectorAll('[data-speed]').forEach(btn => {
      btn.addEventListener('click', () => { series.speed = Number(btn.dataset.speed); startMatchLoop(); render(); });
    });
    box.querySelector('#btnSkipToEnd')?.addEventListener('click', () => {
      cleanupTimers();
      finishMatchInstantly(series.liveMatch);
      onGameEnded();
    });

    const getUT = () => userSide === 'blue' ? series.liveMatch.blueTactics : series.liveMatch.redTactics;
    box.querySelectorAll('[data-tactic-plan]').forEach(b => b.addEventListener('click', () => { getUT().gameplan = b.dataset.tacticPlan; render(); }));
    box.querySelectorAll('[data-tactic-lane]').forEach(b => b.addEventListener('click', () => { getUT().laneFocus = b.dataset.tacticLane; render(); }));
    box.querySelectorAll('[data-tactic-obj]').forEach(b => b.addEventListener('click', () => { getUT().objective = b.dataset.tacticObj; render(); }));
    box.querySelectorAll('[data-tactic-top]').forEach(b => b.addEventListener('click', () => { getUT().topStyle = b.dataset.tacticTop; render(); }));
    box.querySelectorAll('[data-tactic-sup]').forEach(b => b.addEventListener('click', () => { getUT().supStyle = b.dataset.tacticSup; render(); }));
    box.querySelectorAll('[data-tactic-adc]').forEach(b => b.addEventListener('click', () => { getUT().adcStyle = b.dataset.tacticAdc; render(); }));

    box.querySelector('#btnNextGame')?.addEventListener('click', () => { series.gameNum++; startNewGameInSeries(); });
    box.querySelector('#btnFinishSeries')?.addEventListener('click', () => {
      cleanupTimers();
      recordSeriesResult(gameState, match, series.blueScore, series.redScore);
      backdrop.remove();
      onSeriesComplete();
    });
  }

  startNewGameInSeries();
}

// LoL Esports Manager — Interactive Series Modal (Pick/Ban Draft + Live Minute-by-Minute Match & Tactics)
import { CHAMPIONS, CHAMPION_MAP, getChampionMetaTier } from '../data/champions.js';
import { ROLES } from '../data/teamsAndPlayers.js';
import {
  DRAFT_STEPS, createDraftState, applyDraftAction, chooseAIDraftAction,
  autoCompleteDraft, analyzeDraftSide, getMissingRoles
} from '../engine/draftEngine.js';
import {
  createLiveMatchState, stepMatchMinute, finishMatchInstantly, applyMatchOutcomeToPlayers
} from '../engine/matchEngine.js';
import { getTeamRoster, getCurrentPatch, recordSeriesResult } from '../engine/gameEngine.js';

export function openSeriesModal(gameState, match, onSeriesComplete) {
  const blueTeam = gameState.teams.find(t => t.id === match.blueId);
  const redTeam = gameState.teams.find(t => t.id === match.redId);
  const blueRoster = getTeamRoster(gameState, match.blueId);
  const redRoster = getTeamRoster(gameState, match.redId);
  const patch = getCurrentPatch(gameState);
  const userSide = match.blueId === gameState.userTeamId ? 'blue' : 'red';
  const needed = Math.ceil(match.bestOf / 2);

  const series = {
    gameNum: 1,
    blueScore: 0,
    redScore: 0,
    phase: 'DRAFT', // 'DRAFT' | 'MATCH'
    draft: null,
    liveMatch: null,
    roleFilter: 'ALL',
    search: '',
    speed: 1, // 1, 2, 4
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

  function startNewGameInSeries() {
    cleanupTimers();
    series.phase = 'DRAFT';
    series.roleFilter = 'ALL';
    series.search = '';
    series.draft = createDraftState(blueTeam, redTeam, blueRoster, redRoster, patch, userSide);
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
      }, 320);
    }
  }

  function startLiveMatch() {
    cleanupTimers();
    series.phase = 'MATCH';
    series.paused = false;
    series.liveMatch = createLiveMatchState(
      blueTeam, redTeam, blueRoster, redRoster,
      series.draft.bluePicks, series.draft.redPicks, patch, userSide
    );
    render();
    startMatchLoop();
  }

  function startMatchLoop() {
    if (series.timerId) clearInterval(series.timerId);
    const ms = series.speed === 4 ? 140 : series.speed === 2 ? 320 : 620;
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
    if (series.liveMatch.winner === 'blue') series.blueScore++;
    else series.redScore++;
    render();
  }

  function renderHeader() {
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;padding-bottom:12px;border-bottom:1px solid var(--border);">
        <div style="display:flex;align-items:center;gap:12px;">
          <span class="team-tag" style="background:${blueTeam.color};color:${blueTeam.color2};">${blueTeam.tag}</span>
          <strong style="font-size:17px;">${blueTeam.name}</strong>
          <span style="font-size:20px;font-weight:900;color:var(--gold-bright);padding:0 10px;">
            ${series.blueScore} - ${series.redScore}
          </span>
          <strong style="font-size:17px;">${redTeam.name}</strong>
          <span class="team-tag" style="background:${redTeam.color};color:${redTeam.color2};">${redTeam.tag}</span>
          <span class="badge tier-A">BO${match.bestOf} • MAÇ ${series.gameNum}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="badge tier-B">Yama ${patch.version}</span>
          ${series.phase === 'DRAFT' && !series.draft.finished ? `<button class="btn-ghost btn-sm" id="btnAutoDraft">⚡ Oto-Draft Tamamla</button>` : ''}
        </div>
      </div>
    `;
  }

  function renderDraft() {
    const d = series.draft;
    const step = DRAFT_STEPS[d.stepIndex];
    const isUserTurn = step && step.side === userSide && !d.finished;
    const blueAn = analyzeDraftSide(d.bluePicks, blueRoster, patch);
    const redAn = analyzeDraftSide(d.redPicks, redRoster, patch);

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
        return `
          <div class="draft-slot">
            <div>
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="badge role-${role}">${role}</span>
                <strong style="font-size:13px;">${p ? p.name : role}</strong>
                <span style="font-size:11px;color:var(--text-muted);">(${p?.ovr})</span>
              </div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:3px;">
                ${ch ? `<span style="color:${sideColor};font-weight:700;">${ch.name}</span> <span class="badge tier-${tier}">${tier}</span> ${isSig ? '<span style="color:#f0c96e;">★ İmza</span>' : ''}` : `İmza: ${(p?.sigChamps || []).slice(0, 2).map(id => CHAMPION_MAP[id]?.name).join(', ')}`}
              </div>
            </div>
            ${ch ? `<div class="champ-avatar" style="background:${ch.color};width:30px;height:30px;font-size:11px;">${ch.name.slice(0, 2).toUpperCase()}</div>` : ''}
          </div>
        `;
      }).join('');

      return `
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <strong style="color:${sideColor};font-size:14px;">${team.tag} ${side === userSide ? '(SEN)' : '(AI)'}</strong>
            <span class="badge tier-A">Draft: ${an.score || '-'}</span>
          </div>
          <div class="ban-row">${banSlots}</div>
          ${pickSlots}
          <div class="card" style="padding:10px;font-size:11.5px;margin-top:8px;">
            <div style="display:flex;justify-content:space-between;"><span>Erken: <b>${an.early}</b></span><span>Orta: <b>${an.mid}</b></span><span>Geç: <b>${an.late}</b></span></div>
            <div style="display:flex;justify-content:space-between;margin-top:4px;color:var(--text-muted);"><span>Engage: ${an.engage}</span><span>İmza: ★${an.sigCount}</span></div>
            ${an.warnings.length ? `<div style="color:#f87171;margin-top:5px;">⚠ ${an.warnings.join(', ')}</div>` : ''}
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
        <div style="font-size:20px;font-weight:900;color:var(--gold-bright);">DRAFT TAMAMLANDI!</div>
        <p style="color:var(--text-muted);font-size:13px;max-width:400px;">
          Her iki takım da kompozisyonunu kilitledi. Şimdi Sihirdar Vadisi'ne inip taktiklerini yönetme zamanı.
        </p>
        <div style="display:flex;gap:12px;">
          <button class="btn-primary" id="btnStartLiveMatch" style="padding:12px 24px;font-size:15px;">▶ CANLI MAÇI BAŞLAT</button>
          <button class="btn-ghost" id="btnInstantMatch">⚡ Hızlı Simüle Et</button>
        </div>
      </div>
    ` : `
      <div>
        <div style="background:${isUserTurn ? 'rgba(200,155,60,0.16)' : 'var(--bg-card)'};border:1px solid ${isUserTurn ? 'var(--gold)' : 'var(--border)'};border-radius:8px;padding:10px 14px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:13px;font-weight:800;color:${isUserTurn ? 'var(--gold-bright)' : 'var(--text-muted)'};">
              ${isUserTurn ? (step.type === 'ban' ? '🚫 SENİN SIRAN — Şampiyon Yasakla (BAN)' : `✅ SENİN SIRAN — Şampiyon Seç (Kalan: ${userMissing.join(', ')})`) : `⏳ Rakip düşünüyor... (${step.label})`}
            </div>
          </div>
          <span style="font-size:11px;color:var(--text-muted);">Adım ${d.stepIndex + 1}/20</span>
        </div>

        <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;align-items:center;">
          ${['ALL', ...ROLES].map(r => `<button class="tactic-btn ${series.roleFilter === r ? 'active' : ''}" data-role-filter="${r}">${r === 'ALL' ? 'Tümü' : r}</button>`).join('')}
          <input type="text" id="champSearch" placeholder="Şampiyon ara..." value="${series.search}" style="flex:1;min-width:120px;padding:5px 9px;" />
        </div>

        <div class="champ-grid">
          ${filteredChamps.map(c => {
            const used = d.usedChamps.has(c.id);
            const tier = getChampionMetaTier(c, patch);
            const isSig = allUserSigs.has(c.id);
            const fitsMissing = step.type === 'ban' || c.roles.some(r => userMissing.includes(r));
            const disabled = used || !isUserTurn || !fitsMissing;
            return `
              <div class="champ-card ${disabled ? 'disabled' : ''}" data-champ-pick="${c.id}">
                <div class="champ-avatar" style="background:${c.color};">${c.name.slice(0, 2).toUpperCase()}</div>
                <div style="font-size:12px;font-weight:700;">${c.name}</div>
                <div style="display:flex;gap:4px;align-items:center;">
                  <span class="badge tier-${tier}">${tier}</span>
                  <span style="font-size:10px;color:var(--text-muted);">${c.roles[0]}</span>
                  ${isSig ? '<span style="color:#f0c96e;font-size:11px;" title="Oyuncunun İmza Şampiyonu">★</span>' : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    return `
      ${renderHeader()}
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
      const col = side === 'blue' ? '#38bdf8' : '#ef4444';
      const coords = side === 'blue'
        ? { TOP: [[16, 42], [16, 58], [16, 72]], MID: [[38, 62], [30, 70], [23, 77]], BOT: [[58, 84], [42, 84], [28, 84]] }
        : { TOP: [[42, 16], [58, 16], [72, 16]], MID: [[62, 38], [70, 30], [77, 23]], BOT: [[84, 58], [84, 42], [84, 28]] };

      let svg = '';
      for (const lane of ['TOP', 'MID', 'BOT']) {
        const rem = lanes[lane];
        coords[lane].forEach(([x, y], idx) => {
          // idx 0 is outer (falls first when rem <= 2), idx 1 inner (falls when rem <= 1), idx 2 inhib (falls when rem === 0)
          const alive = (idx === 0 && rem >= 3) || (idx === 1 && rem >= 2) || (idx === 2 && rem >= 1);
          svg += `<circle cx="${x}" cy="${y}" r="2.7" fill="${alive ? col : '#1e293b'}" stroke="${alive ? '#fff' : '#475569'}" stroke-width="0.6" />`;
        });
      }
      return svg;
    };

    const pulse = m.lastEventPos
      ? `<circle cx="${m.lastEventPos.x}" cy="${m.lastEventPos.y}" r="6.5" fill="none" stroke="${m.lastEventPos.color}" stroke-width="1.8" opacity="0.9">
           <animate attributeName="r" from="3" to="9" dur="1.1s" repeatCount="indefinite" />
           <animate attributeName="opacity" from="1" to="0.1" dur="1.1s" repeatCount="indefinite" />
         </circle>`
      : '';

    return `
      <svg viewBox="0 0 100 100" style="width:100%;max-width:260px;display:block;margin:0 auto;background:#0a1320;border:1px solid var(--border);border-radius:10px;">
        <!-- River -->
        <path d="M 15 15 Q 50 50 85 85" stroke="#0c4a6e" stroke-width="7" fill="none" opacity="0.55" />
        <!-- Lanes -->
        <polyline points="14,86 14,14 86,14" stroke="#1e293b" stroke-width="4" fill="none" />
        <polyline points="14,86 86,86 86,14" stroke="#1e293b" stroke-width="4" fill="none" />
        <line x1="14" y1="86" x2="86" y2="14" stroke="#1e293b" stroke-width="3.5" />
        <!-- Baron & Dragon Pits -->
        <circle cx="34" cy="30" r="4" fill="rgba(168,85,247,0.28)" stroke="#a855f7" stroke-width="0.8" />
        <text x="34" y="31.5" font-size="3.8" fill="#d8b4fe" text-anchor="middle" font-weight="bold">B</text>
        <circle cx="66" cy="70" r="4" fill="rgba(245,158,11,0.28)" stroke="#f59e0b" stroke-width="0.8" />
        <text x="66" y="71.5" font-size="3.8" fill="#fcd34d" text-anchor="middle" font-weight="bold">D</text>
        <!-- Nexuses -->
        <rect x="9" y="81" width="9" height="9" rx="2" fill="${m.blueNexusHP > 0 ? '#38bdf8' : '#334155'}" />
        <rect x="82" y="10" width="9" height="9" rx="2" fill="${m.redNexusHP > 0 ? '#ef4444' : '#334155'}" />
        ${towerDots('blue')}
        ${towerDots('red')}
        ${pulse}
      </svg>
    `;
  }

  function renderGoldGraphSVG(history) {
    const w = 270, h = 76;
    const maxAbs = Math.max(2500, ...history.map(v => Math.abs(v)));
    const pts = history.map((v, i) => {
      const x = history.length === 1 ? 0 : (i / (history.length - 1)) * w;
      const y = h / 2 - (v / maxAbs) * (h / 2 - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    const last = history[history.length - 1] || 0;
    const stroke = last >= 0 ? '#38bdf8' : '#ef4444';

    return `
      <div style="margin-top:10px;">
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-bottom:4px;">
          <span>Altın Farkı Grafiği</span>
          <strong style="color:${stroke};">${last >= 0 ? `${blueTeam.tag} +${(last / 1000).toFixed(1)}k` : `${redTeam.tag} +${(Math.abs(last) / 1000).toFixed(1)}k`}</strong>
        </div>
        <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:76px;background:var(--bg);border:1px solid var(--border);border-radius:7px;">
          <line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}" stroke="#334155" stroke-dasharray="3,3" stroke-width="1" />
          <polyline points="${pts}" fill="none" stroke="${stroke}" stroke-width="2" />
        </svg>
      </div>
    `;
  }

  function renderLiveMatch() {
    const m = series.liveMatch;
    const uTactics = userSide === 'blue' ? m.blueTactics : m.redTactics;
    const talkUsed = userSide === 'blue' ? m.blueTalkUsed : m.redTalkUsed;
    const seriesOver = series.blueScore >= needed || series.redScore >= needed;

    const playerRows = (list, sideColor) => list.map(p => `
      <tr>
        <td><span class="badge role-${p.role}">${p.role}</span></td>
        <td><strong style="color:${sideColor};">${p.name}</strong> <span style="font-size:11px;color:var(--text-muted);">(${p.champName})</span></td>
        <td style="font-weight:700;">${p.kills}/${p.deaths}/${p.assists}</td>
        <td>${p.cs}</td>
        <td>${(p.gold / 1000).toFixed(1)}k</td>
        <td><span class="ovr-pill ${p.rating >= 8.0 ? 'ovr-90' : p.rating >= 7.0 ? 'ovr-85' : 'ovr-low'}" style="font-size:11px;">${p.rating.toFixed(1)}</span></td>
      </tr>
    `).join('');

    return `
      ${renderHeader()}
      <div class="scoreboard-bar" style="margin-top:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:12px;color:var(--blue);font-weight:800;">${blueTeam.name} ${userSide === 'blue' ? '(SEN)' : ''}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
              💰 ${(m.blueGold / 1000).toFixed(1)}k • 🏰 ${m.blueTowers} • 🐉 ${m.blueDragons} • 👑 ${m.blueBarons}
            </div>
          </div>
          <div style="font-size:30px;font-weight:900;color:var(--blue);">${m.blueKills}</div>
        </div>

        <div style="text-align:center;padding:0 16px;border-left:1px solid var(--border);border-right:1px solid var(--border);">
          <div style="font-size:22px;font-weight:900;color:var(--gold-bright);">${String(m.minute).padStart(2, '0')}:00</div>
          <div style="font-size:11px;color:var(--text-muted);">${m.finished ? 'MAÇ SONU' : (series.paused ? 'DURAKLATILDI' : 'CANLI')}</div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="font-size:30px;font-weight:900;color:var(--red);">${m.redKills}</div>
          <div style="text-align:right;">
            <div style="font-size:12px;color:var(--red);font-weight:800;">${redTeam.name} ${userSide === 'red' ? '(SEN)' : ''}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
              👑 ${m.redBarons} • 🐉 ${m.redDragons} • 🏰 ${m.redTowers} • 💰 ${(m.redGold / 1000).toFixed(1)}k
            </div>
          </div>
        </div>
      </div>

      ${m.finished ? `
        <div class="card" style="margin-top:12px;border-color:var(--gold);background:rgba(200,155,60,0.1);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <div style="font-size:16px;font-weight:900;color:var(--gold-bright);">
              🏆 ${m.winner === 'blue' ? blueTeam.name : redTeam.name} Maç ${series.gameNum}'i Kazandı!
            </div>
            <div style="font-size:13px;color:var(--text-muted);margin-top:3px;">
              MVP: <b>${m.mvp?.name}</b> (${m.mvp?.champName}) — ${m.mvp?.kills}/${m.mvp?.deaths}/${m.mvp?.assists} • Puan: ${m.mvp?.rating}
            </div>
          </div>
          <div>
            ${seriesOver
              ? `<button class="btn-primary" id="btnFinishSeries" style="padding:10px 20px;">Seriyi Tamamla (${series.blueScore}-${series.redScore}) →</button>`
              : `<button class="btn-primary" id="btnNextGame" style="padding:10px 20px;">Maç ${series.gameNum + 1} Draft'ına Geç →</button>`}
          </div>
        </div>
      ` : `
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-top:10px;">
          <div style="display:flex;gap:6px;align-items:center;">
            <button class="btn-ghost btn-sm" id="btnTogglePause">${series.paused ? '▶ Devam' : '⏸ Duraklat'}</button>
            <button class="tactic-btn ${series.speed === 1 ? 'active' : ''}" data-speed="1">1x</button>
            <button class="tactic-btn ${series.speed === 2 ? 'active' : ''}" data-speed="2">2x</button>
            <button class="tactic-btn ${series.speed === 4 ? 'active' : ''}" data-speed="4">4x</button>
            <button class="btn-ghost btn-sm" id="btnSkipToEnd">⏭ Maçı Bitir</button>
          </div>
          <button class="btn-primary btn-sm" id="btnMotivationalTalk" ${talkUsed ? 'disabled' : ''}>
            🔥 ${talkUsed ? 'Mola Kullanıldı' : 'Mola / Motivasyon Konuşması'}
          </button>
        </div>
      `}

      <div class="match-grid">
        <!-- Left: Minimap + Gold Graph + Live FM Tactics -->
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div class="card" style="padding:12px;">
            ${renderMinimapSVG(m)}
            ${renderGoldGraphSVG(m.goldHistory)}
          </div>

          <div class="card" style="padding:12px;">
            <div class="card-title" style="margin-bottom:8px;">Canlı Taktik Emirleri</div>
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">Oyun Planı</div>
            <div class="tactic-btn-group" style="margin-bottom:8px;">
              ${[['aggressive', 'Erken Baskı'], ['balanced', 'Dengeli'], ['scaling', 'Scaling'], ['split', 'Split Push']].map(([k, lbl]) =>
                `<button class="tactic-btn ${uTactics.gameplan === k ? 'active' : ''}" data-tactic-plan="${k}">${lbl}</button>`
              ).join('')}
            </div>
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">Ormancı Odak Koridoru</div>
            <div class="tactic-btn-group" style="margin-bottom:8px;">
              ${['TOP', 'MID', 'BOT'].map(l =>
                `<button class="tactic-btn ${uTactics.laneFocus === l ? 'active' : ''}" data-tactic-lane="${l}">${l}</button>`
              ).join('')}
            </div>
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">Objektif Önceliği</div>
            <div class="tactic-btn-group">
              ${[['dragon', '🐉 Ejder'], ['baron', '👑 Baron/Vadi'], ['towers', '🏰 Kule']].map(([k, lbl]) =>
                `<button class="tactic-btn ${uTactics.objective === k ? 'active' : ''}" data-tactic-obj="${k}">${lbl}</button>`
              ).join('')}
            </div>
          </div>
        </div>

        <!-- Right: Commentary Feed + Live 10-Player Stats -->
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div class="card" style="padding:12px;">
            <div class="card-title" style="margin-bottom:8px;">Canlı Maç Anlatımı</div>
            <div class="event-feed" id="eventFeed">
              ${[...m.events].reverse().map(ev => `
                <div class="event-item ${ev.side || ''} ${ev.type || ''}">
                  <span style="color:var(--gold-bright);font-weight:800;margin-right:6px;">${ev.min}'</span>
                  <span>${ev.text}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="grid-2" style="gap:10px;">
            <div class="card" style="padding:10px;">
              <div style="font-size:12px;font-weight:800;color:var(--blue);margin-bottom:6px;">${blueTeam.tag} Kadro İstatistikleri</div>
              <table>
                <thead><tr><th>Rol</th><th>Oyuncu</th><th>KDA</th><th>CS</th><th>Altın</th><th>Puan</th></tr></thead>
                <tbody>${playerRows(m.bluePlayers, '#7dd3fc')}</tbody>
              </table>
            </div>
            <div class="card" style="padding:10px;">
              <div style="font-size:12px;font-weight:800;color:var(--red);margin-bottom:6px;">${redTeam.tag} Kadro İstatistikleri</div>
              <table>
                <thead><tr><th>Rol</th><th>Oyuncu</th><th>KDA</th><th>CS</th><th>Altın</th><th>Puan</th></tr></thead>
                <tbody>${playerRows(m.redPlayers, '#fca5a5')}</tbody>
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
    // Draft Events
    box.querySelector('#btnAutoDraft')?.addEventListener('click', () => {
      cleanupTimers();
      autoCompleteDraft(series.draft);
      render();
    });

    box.querySelectorAll('[data-role-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        series.roleFilter = btn.dataset.roleFilter;
        render();
      });
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
        const cid = card.dataset.champPick;
        if (applyDraftAction(series.draft, cid)) {
          render();
          scheduleAIDraftIfNeeded();
        }
      });
    });

    box.querySelector('#btnStartLiveMatch')?.addEventListener('click', startLiveMatch);
    box.querySelector('#btnInstantMatch')?.addEventListener('click', () => {
      cleanupTimers();
      series.phase = 'MATCH';
      series.liveMatch = createLiveMatchState(
        blueTeam, redTeam, blueRoster, redRoster,
        series.draft.bluePicks, series.draft.redPicks, patch, userSide
      );
      finishMatchInstantly(series.liveMatch);
      onGameEnded();
    });

    // Live Match Events
    box.querySelector('#btnTogglePause')?.addEventListener('click', () => {
      series.paused = !series.paused;
      render();
    });

    box.querySelectorAll('[data-speed]').forEach(btn => {
      btn.addEventListener('click', () => {
        series.speed = Number(btn.dataset.speed);
        startMatchLoop();
        render();
      });
    });

    box.querySelector('#btnSkipToEnd')?.addEventListener('click', () => {
      cleanupTimers();
      finishMatchInstantly(series.liveMatch);
      onGameEnded();
    });

    box.querySelector('#btnMotivationalTalk')?.addEventListener('click', () => {
      const m = series.liveMatch;
      if (userSide === 'blue' && !m.blueTalkUsed) {
        m.blueTalkUsed = true;
        m.blueTalkBoost = 12;
        m.events.push({ min: m.minute, type: 'SYSTEM', side: 'blue', text: `🔥 KOÇ MOLASI: ${blueTeam.tag} oyuncularına moral konuşması yaptı! Takım yüksek motivasyonla savaşa dönüyor.` });
      } else if (userSide === 'red' && !m.redTalkUsed) {
        m.redTalkUsed = true;
        m.redTalkBoost = 12;
        m.events.push({ min: m.minute, type: 'SYSTEM', side: 'red', text: `🔥 KOÇ MOLASI: ${redTeam.tag} oyuncularına moral konuşması yaptı! Takım yüksek motivasyonla savaşa dönüyor.` });
      }
      render();
    });

    box.querySelectorAll('[data-tactic-plan]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = userSide === 'blue' ? series.liveMatch.blueTactics : series.liveMatch.redTactics;
        t.gameplan = btn.dataset.tacticPlan;
        render();
      });
    });
    box.querySelectorAll('[data-tactic-lane]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = userSide === 'blue' ? series.liveMatch.blueTactics : series.liveMatch.redTactics;
        t.laneFocus = btn.dataset.tacticLane;
        render();
      });
    });
    box.querySelectorAll('[data-tactic-obj]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = userSide === 'blue' ? series.liveMatch.blueTactics : series.liveMatch.redTactics;
        t.objective = btn.dataset.tacticObj;
        render();
      });
    });

    box.querySelector('#btnNextGame')?.addEventListener('click', () => {
      series.gameNum++;
      startNewGameInSeries();
    });

    box.querySelector('#btnFinishSeries')?.addEventListener('click', () => {
      cleanupTimers();
      recordSeriesResult(gameState, match, series.blueScore, series.redScore);
      backdrop.remove();
      onSeriesComplete();
    });
  }

  startNewGameInSeries();
}

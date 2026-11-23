// LoL Esports Manager — Main Football Manager UI Shell & All Screens
import { CHAMPIONS, CHAMPION_MAP, getChampionMetaTier } from '../data/champions.js';
import { ROLES, REGIONS, createInitialDatabase } from '../data/teamsAndPlayers.js';
import {
  SPONSORS, FACILITY_INFO, TRAINING_MODES,
  createNewCareer, getCurrentPatch, getPhaseLabel, getTeamRoster, getTeamOVR,
  getTeamWeeklyWages, getSortedStandings, getUserNextMatch, quickSimSeries,
  advanceWeekOrRound, attemptSignOrTransfer, setStarter, releasePlayer,
  promoteAcademyPlayer, playWeeklyScrim, upgradeFacility, formatMoney,
  saveGame, loadGame
} from '../engine/gameEngine.js';
import { openSeriesModal } from './matchModal.js';

const root = document.getElementById('app');

let state = null;
let ui = {
  startRegion: 'LCK',
  tab: 'dashboard', // dashboard | inbox | roster | transfers | league | club | meta
  leagueRegion: 'LCK',
  transferRole: 'ALL',
  transferStatus: 'ALL', // ALL | FA | CONTRACTED
  transferSearch: '',
  transferMinOvr: 75,
  negotiatingPlayerId: null,
  selectedInboxId: null,
  toastMsg: null,
  toastTimer: null,
};

// Preview database for Start Screen
const previewDB = createInitialDatabase();

function showToast(msg) {
  ui.toastMsg = msg;
  render();
  if (ui.toastTimer) clearTimeout(ui.toastTimer);
  ui.toastTimer = setTimeout(() => {
    ui.toastMsg = null;
    const t = document.querySelector('.toast');
    if (t) t.remove();
  }, 3400);
}

function ovrClass(ovr) {
  return ovr >= 90 ? 'ovr-90' : ovr >= 85 ? 'ovr-85' : ovr >= 80 ? 'ovr-80' : 'ovr-low';
}

function barHtml(val, color) {
  return `<div class="bar-wrap"><div class="bar-fill" style="width:${Math.max(0, Math.min(100, val))}%;background:${color};"></div></div>`;
}

// ==================== START SCREEN ====================
function renderStartScreen() {
  const saved = loadGame();
  const regTeams = previewDB.teams.filter(t => t.region === ui.startRegion);

  return `
    <div class="start-screen">
      <div class="start-header">
        <div>
          <div class="brand-title">🏆 LoL ESPORTS MANAGER</div>
          <div class="brand-sub">Football Manager Derinliğinde League of Legends Kulüp Yönetimi • LCK, LPL, LEC, LCS, MSI & Worlds</div>
        </div>
        ${saved ? `
          <button class="btn-primary" id="btnLoadSave" style="padding:12px 20px;font-size:14px;">
            ▶ Kayıtlı Kariyere Devam Et (${saved.teams.find(t => t.id === saved.userTeamId)?.tag} • Sezon ${saved.season})
          </button>
        ` : ''}
      </div>

      <div class="region-tabs">
        ${REGIONS.map(r => `
          <button class="region-tab ${ui.startRegion === r.id ? 'active' : ''}" data-start-region="${r.id}">
            <span style="color:${r.color};">●</span> ${r.name}
          </button>
        `).join('')}
      </div>

      <div class="club-grid">
        ${regTeams.map(team => {
          const roster = previewDB.players.filter(p => p.teamId === team.id);
          const avgOvr = Math.round(roster.reduce((s, p) => s + p.ovr, 0) / roster.length);
          return `
            <div class="club-card">
              <div class="club-card-top">
                <div style="display:flex;align-items:center;gap:10px;">
                  <span class="team-tag" style="background:${team.color};color:${team.color2};">${team.tag}</span>
                  <div>
                    <div style="font-weight:800;font-size:15px;">${team.name}</div>
                    <div style="font-size:11px;color:var(--text-muted);">Prestij: ${team.prestige} • Bütçe: ${formatMoney(team.budget)}</div>
                  </div>
                </div>
                <span class="ovr-pill ${ovrClass(avgOvr)}">${avgOvr}</span>
              </div>
              <div class="club-roster-mini">
                ${ROLES.map(role => {
                  const p = roster.find(x => x.role === role);
                  return `
                    <div class="club-roster-row">
                      <span><span class="badge role-${role}" style="margin-right:5px;">${role}</span><b style="color:var(--text);">${p?.name || '-'}</b></span>
                      <span>${p?.ovr || '-'} <span style="font-size:10px;">(POT ${p?.pot || '-'})</span></span>
                    </div>
                  `;
                }).join('')}
              </div>
              <button class="btn-primary" data-pick-club="${team.id}" style="margin-top:auto;">Bu Takımı Yönet →</button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ==================== DASHBOARD ====================
function renderDashboard() {
  const team = state.teams.find(t => t.id === state.userTeamId);
  const ovr = getTeamOVR(state, team.id);
  const patch = getCurrentPatch(state);
  const nextMatch = getUserNextMatch(state);
  const standings = getSortedStandings(state, team.region);
  const userRank = standings.findIndex(r => r.teamId === team.id) + 1;
  const wages = getTeamWeeklyWages(state, team.id);
  const netWeekly = (team.sponsor?.weekly || 30000) + team.fanbase * 950 - wages;

  let nextMatchHtml = '';
  if (nextMatch) {
    const oppId = nextMatch.blueId === team.id ? nextMatch.redId : nextMatch.blueId;
    const opp = state.teams.find(t => t.id === oppId);
    const oppOvr = getTeamOVR(state, oppId);
    nextMatchHtml = `
      <div class="card" style="border-color:var(--gold);background:linear-gradient(135deg, rgba(200,155,60,0.1), var(--bg-card));">
        <div class="card-header">
          <span class="card-title">⚔️ Sıradaki Karşılaşma (${getPhaseLabel(state.phase)} • BO${nextMatch.bestOf})</span>
          <span class="badge tier-S">Hafta ${state.week}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <span class="team-tag" style="background:${team.color};color:${team.color2};font-size:14px;padding:6px 10px;">${team.tag}</span>
            <div>
              <div style="font-weight:800;font-size:16px;">${team.name}</div>
              <div style="font-size:12px;color:var(--text-muted);">OVR ${ovr} • Sinerji ${Math.round(team.synergy)}%</div>
            </div>
          </div>
          <div style="font-size:20px;font-weight:900;color:var(--gold-bright);">VS</div>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="text-align:right;">
              <div style="font-weight:800;font-size:16px;">${opp.name}</div>
              <div style="font-size:12px;color:var(--text-muted);">OVR ${oppOvr} • ${opp.region}</div>
            </div>
            <span class="team-tag" style="background:${opp.color};color:${opp.color2};font-size:14px;padding:6px 10px;">${opp.tag}</span>
          </div>
        </div>
        <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;">
          <button class="btn-primary" id="btnPlayMatchLive">🎮 Draft & Canlı Maça Gir</button>
          <button class="btn-ghost" id="btnQuickSimMatch">⚡ Maçı Hızlı Simüle Et</button>
        </div>
      </div>
    `;
  } else {
    nextMatchHtml = `
      <div class="card" style="border-color:var(--blue);">
        <div class="card-header"><span class="card-title">📅 Takvim Durumu</span></div>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">
          ${state.phase === 'OFFSEASON'
            ? 'Sezon arası transfer dönemindesin. Kadronu güçlendirip yeni sezona başlayabilirsin.'
            : 'Bu turda oynayacağın maç tamamlandı veya takımın bu turnuvada yer almıyor. Haftayı/Turu ilerletebilirsin.'}
        </p>
        <button class="btn-primary" id="btnAdvanceCal">
          ${state.phase === 'OFFSEASON' ? `🚀 Sezon ${state.season + 1}'e Başla →` : '⏩ Sonraki Hafta / Tura İlerle →'}
        </button>
      </div>
    `;
  }

  return `
    <div class="grid-4" style="margin-bottom:16px;">
      <div class="card">
        <div class="kpi-label">Takım Gücü (İlk 5 OVR)</div>
        <div class="kpi-val" style="color:var(--gold-bright);">${ovr} <span style="font-size:13px;color:var(--text-muted);">• Sinerji ${Math.round(team.synergy)}%</span></div>
      </div>
      <div class="card">
        <div class="kpi-label">${team.region} Lig Sıralaması</div>
        <div class="kpi-val">#${userRank} <span style="font-size:13px;color:var(--text-muted);">(${standings[userRank - 1]?.wins || 0}G - ${standings[userRank - 1]?.losses || 0}M)</span></div>
      </div>
      <div class="card">
        <div class="kpi-label">Kulüp Bütçesi</div>
        <div class="kpi-val" style="color:${team.budget >= 0 ? 'var(--green)' : 'var(--red)'};">${formatMoney(team.budget)}</div>
      </div>
      <div class="card">
        <div class="kpi-label">Haftalık Net Nakit Akışı</div>
        <div class="kpi-val" style="color:${netWeekly >= 0 ? 'var(--green)' : 'var(--red)'};">${netWeekly >= 0 ? '+' : ''}${formatMoney(netWeekly)}</div>
      </div>
    </div>

    <div style="margin-bottom:16px;">${nextMatchHtml}</div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <span class="card-title">${team.region} Puan Durumu</span>
          <button class="btn-ghost btn-sm" data-nav="league">Tüm Ligler →</button>
        </div>
        <table>
          <thead><tr><th>#</th><th>Takım</th><th>G-M</th><th>Oyun</th><th>OVR</th></tr></thead>
          <tbody>
            ${standings.map((r, idx) => {
              const t = state.teams.find(x => x.id === r.teamId);
              return `
                <tr class="${t.id === team.id ? 'highlight-row' : ''}">
                  <td>${idx + 1}</td>
                  <td><span class="team-tag" style="background:${t.color};color:${t.color2};margin-right:6px;">${t.tag}</span>${t.name}</td>
                  <td><b>${r.wins}-${r.losses}</b></td>
                  <td style="color:var(--text-muted);">${r.gameWins}-${r.gameLosses}</td>
                  <td><span class="ovr-pill ${ovrClass(getTeamOVR(state, t.id))}">${getTeamOVR(state, t.id)}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div style="display:flex;flex-direction:column;gap:16px;">
        <div class="card">
          <div class="card-header">
            <span class="card-title">🧪 Aktif Yama: ${patch.version}</span>
            <button class="btn-ghost btn-sm" data-nav="meta">Meta Rehberi →</button>
          </div>
          <div style="font-weight:700;color:var(--text);margin-bottom:4px;">${patch.name}</div>
          <p style="font-size:12.5px;color:var(--text-muted);margin-bottom:8px;">${patch.desc}</p>
          <div style="display:flex;gap:6px;flex-wrap:wrap;font-size:11px;">
            <span class="badge tier-S">Buff: ${patch.buffedClasses.join(', ')}</span>
            ${patch.nerfedClasses.length ? `<span class="badge tier-C">Nerf: ${patch.nerfedClasses.join(', ')}</span>` : ''}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">📬 Son Mesajlar</span>
            <button class="btn-ghost btn-sm" data-nav="inbox">Tümü →</button>
          </div>
          ${state.inbox.slice(0, 4).map(msg => `
            <div style="padding:8px 0;border-bottom:1px solid rgba(35,48,74,0.5);cursor:pointer;" data-open-msg="${msg.id}">
              <div style="display:flex;justify-content:space-between;font-size:12.5px;">
                <strong style="color:${msg.read ? 'var(--text-muted)' : 'var(--gold-bright)'};">${msg.read ? '' : '● '}${msg.title}</strong>
                <span style="font-size:11px;color:var(--text-muted);">${msg.sender}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// ==================== INBOX ====================
function renderInbox() {
  const selected = state.inbox.find(m => m.id === ui.selectedInboxId) || state.inbox[0];
  if (selected) selected.read = true;

  return `
    <div class="grid-2" style="grid-template-columns: 360px 1fr;">
      <div class="card" style="max-height:74vh;overflow-y:auto;">
        <div class="card-header"><span class="card-title">📬 Gelen Kutusu (${state.inbox.length})</span></div>
        ${state.inbox.map(m => `
          <div data-select-inbox="${m.id}" style="padding:10px;border-radius:7px;margin-bottom:6px;cursor:pointer;background:${selected?.id === m.id ? 'var(--bg-hover)' : 'var(--bg)'};border:1px solid ${selected?.id === m.id ? 'var(--gold)' : 'var(--border)'};">
            <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);">
              <span>${m.sender}</span><span>${m.category}</span>
            </div>
            <div style="font-size:13px;font-weight:${m.read ? '600' : '800'};color:${m.read ? 'var(--text)' : 'var(--gold-bright)'};margin-top:3px;">${m.title}</div>
          </div>
        `).join('')}
      </div>
      <div class="card">
        ${selected ? `
          <div class="card-header">
            <div>
              <div style="font-size:18px;font-weight:800;color:var(--gold-bright);">${selected.title}</div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:3px;">Gönderen: ${selected.sender} • ${selected.date}</div>
            </div>
            <span class="badge tier-A">${selected.category}</span>
          </div>
          <p style="font-size:14px;line-height:1.65;color:var(--text);">${selected.body}</p>
        ` : '<p>Mesaj yok.</p>'}
      </div>
    </div>
  `;
}

// ==================== ROSTER, TRAINING & SCRIMS ====================
function renderRoster() {
  const team = state.teams.find(t => t.id === state.userTeamId);
  const myPlayers = state.players
    .filter(p => p.teamId === team.id)
    .sort((a, b) => (b.isStarter - a.isStarter) || (ROLES.indexOf(a.role) - ROLES.indexOf(b.role)));

  const scrimOpponents = state.teams.filter(t => t.id !== team.id).sort((a, b) => getTeamOVR(state, b.id) - getTeamOVR(state, a.id));

  return `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-header">
        <span class="card-title">👥 Kadro & Oyuncu Özellikleri (${myPlayers.length} Oyuncu)</span>
        <span style="font-size:12px;color:var(--text-muted);">Haftalık Maaş: <b>${formatMoney(getTeamWeeklyWages(state, team.id))}</b> • Takım Sinerjisi: <b>${Math.round(team.synergy)}%</b></span>
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>Durum</th><th>Rol</th><th>Oyuncu</th><th>Yaş</th><th>OVR/POT</th>
              <th title="Mekanik">MEK</th><th title="Koridor">KOR</th><th title="Makro">MAK</th><th title="Takım Savaşı">TS</th><th title="Clutch">CLU</th><th title="Şampiyon Havuzu">HAV</th>
              <th>Moral / Form / Yorg.</th><th>KDA (Maç)</th><th>Maaş / Kontrat</th><th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            ${myPlayers.map(p => {
              const kda = p.stats.games ? `${(p.stats.kills / p.stats.games).toFixed(1)}/${(p.stats.deaths / p.stats.games).toFixed(1)}/${(p.stats.assists / p.stats.games).toFixed(1)}` : '-';
              return `
                <tr class="${p.isStarter ? 'highlight-row' : ''}">
                  <td>${p.isStarter ? '<span class="badge tier-S">İLK 5</span>' : '<span class="badge tier-B">YEDEK</span>'}</td>
                  <td><span class="badge role-${p.role}">${p.role}</span></td>
                  <td>
                    <strong>${p.name}</strong> <span style="font-size:11px;color:var(--text-muted);">(${p.nat})</span>
                    <div style="font-size:10.5px;color:var(--text-muted);">${p.style} • ★ ${p.sigChamps.slice(0, 3).map(id => CHAMPION_MAP[id]?.name).join(', ')}</div>
                  </td>
                  <td>${p.age}</td>
                  <td><span class="ovr-pill ${ovrClass(p.ovr)}">${p.ovr}</span> <span style="font-size:11px;color:var(--text-muted);">/${p.pot}</span></td>
                  <td>${p.attrs.mechanics}</td>
                  <td>${p.attrs.laning}</td>
                  <td>${p.attrs.macro}</td>
                  <td>${p.attrs.teamfight}</td>
                  <td>${p.attrs.clutch}</td>
                  <td>${p.attrs.pool}</td>
                  <td style="font-size:11px;">
                    <div>M:${p.morale} ${barHtml(p.morale, '#10b981')}</div>
                    <div>F:${p.form} ${barHtml(p.form, '#38bdf8')}</div>
                    <div>Y:${p.fatigue} ${barHtml(p.fatigue, p.fatigue > 65 ? '#ef4444' : '#f59e0b')}</div>
                  </td>
                  <td style="font-size:12px;">${kda} <span style="color:var(--text-muted);">(${p.stats.games})</span></td>
                  <td style="font-size:12px;">${formatMoney(p.salary)}<br><span style="color:var(--text-muted);">${p.contractYears} yıl</span></td>
                  <td>
                    <div style="display:flex;gap:4px;">
                      ${!p.isStarter ? `<button class="btn-blue btn-sm" data-set-starter="${p.id}">İlk 5 Yap</button>` : ''}
                      <button class="btn-danger btn-sm" data-release-player="${p.id}">Serbest Bırak</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="grid-3">
      <div class="card">
        <div class="card-header"><span class="card-title">🏋️ Haftalık Antrenman Programı</span></div>
        ${TRAINING_MODES.map(tm => `
          <div data-set-training="${tm.id}" style="padding:9px;border-radius:7px;margin-bottom:6px;cursor:pointer;background:${team.trainingFocus === tm.id ? 'rgba(200,155,60,0.16)' : 'var(--bg)'};border:1px solid ${team.trainingFocus === tm.id ? 'var(--gold)' : 'var(--border)'};">
            <div style="font-size:13px;font-weight:700;color:${team.trainingFocus === tm.id ? 'var(--gold-bright)' : 'var(--text)'};">${tm.name}</div>
            <div style="font-size:11.5px;color:var(--text-muted);">${tm.desc}</div>
          </div>
        `).join('')}
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">📋 Varsayılan Maç Taktiği</span></div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:5px;">Oyun Planı</div>
        <div class="tactic-btn-group" style="margin-bottom:12px;">
          ${[['aggressive', 'Erken Baskı'], ['balanced', 'Dengeli'], ['scaling', 'Scaling'], ['split', 'Split Push']].map(([k, lbl]) =>
            `<button class="tactic-btn ${team.tactics.gameplan === k ? 'active' : ''}" data-def-plan="${k}">${lbl}</button>`
          ).join('')}
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:5px;">Ormancı Odak Koridoru</div>
        <div class="tactic-btn-group" style="margin-bottom:12px;">
          ${['TOP', 'MID', 'BOT'].map(l =>
            `<button class="tactic-btn ${team.tactics.laneFocus === l ? 'active' : ''}" data-def-lane="${l}">${l}</button>`
          ).join('')}
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:5px;">Objektif Önceliği</div>
        <div class="tactic-btn-group">
          ${[['dragon', '🐉 Ejder'], ['baron', '👑 Baron/Vadi'], ['towers', '🏰 Kule']].map(([k, lbl]) =>
            `<button class="tactic-btn ${team.tactics.objective === k ? 'active' : ''}" data-def-obj="${k}">${lbl}</button>`
          ).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">🤝 Haftalık Hazırlık Maçı (Scrim)</span></div>
        <p style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">
          Haftada 1 kez başka bir takımla scrim yaparak sinerji (+2/+4) ve form kazanabilirsin (Yorgunluk +7).
        </p>
        <select id="scrimSelect" style="width:100%;margin-bottom:10px;">
          ${scrimOpponents.map(o => `<option value="${o.id}">[${o.region}] ${o.name} (OVR ${getTeamOVR(state, o.id)})</option>`).join('')}
        </select>
        <button class="btn-blue" id="btnPlayScrim" style="width:100%;" ${state.scrimDoneThisWeek ? 'disabled' : ''}>
          ${state.scrimDoneThisWeek ? '✓ Bu Haftanın Scrim\'i Yapıldı' : '⚔️ Scrim Maçı Yap'}
        </button>
      </div>
    </div>
  `;
}

// ==================== TRANSFERS & SCOUTING ====================
function renderTransfers() {
  const team = state.teams.find(t => t.id === state.userTeamId);
  const filtered = state.players.filter(p => {
    if (p.teamId === team.id) return false;
    if (ui.transferRole !== 'ALL' && p.role !== ui.transferRole) return false;
    if (ui.transferStatus === 'FA' && p.teamId !== null) return false;
    if (ui.transferStatus === 'CONTRACTED' && p.teamId === null) return false;
    if (p.ovr < ui.transferMinOvr) return false;
    if (ui.transferSearch && !p.name.toLowerCase().includes(ui.transferSearch.toLowerCase())) return false;
    return true;
  }).sort((a, b) => b.ovr - a.ovr);

  return `
    <div class="card" style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
      <div>
        <div class="card-title">🌱 Gençlik Akademisi (Sv. ${team.facilities.youthAcademy})</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:3px;">Her mevsim akademinden bir genç yeteneği ücretsiz olarak A takıma yükseltebilirsin.</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <select id="academyRoleSelect">
          ${ROLES.map(r => `<option value="${r}">${r}</option>`).join('')}
        </select>
        <button class="btn-green" id="btnPromoteAcademy" ${state.academyPromotedThisSplit ? 'disabled' : ''}>
          ${state.academyPromotedThisSplit ? '✓ Bu Mevsim Kullanıldı' : '+ Akademiden Yükselt'}
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">🔍 Transfer Pazarı & Scouting (${filtered.length} Oyuncu)</span>
        <span style="font-size:13px;color:var(--green);font-weight:700;">Bütçe: ${formatMoney(team.budget)}</span>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;align-items:center;">
        <input type="text" id="trSearch" placeholder="Oyuncu adı ara..." value="${ui.transferSearch}" style="min-width:180px;" />
        <select id="trRole">
          <option value="ALL" ${ui.transferRole === 'ALL' ? 'selected' : ''}>Tüm Roller</option>
          ${ROLES.map(r => `<option value="${r}" ${ui.transferRole === r ? 'selected' : ''}>${r}</option>`).join('')}
        </select>
        <select id="trStatus">
          <option value="ALL" ${ui.transferStatus === 'ALL' ? 'selected' : ''}>Tümü (Serbest + Sözleşmeli)</option>
          <option value="FA" ${ui.transferStatus === 'FA' ? 'selected' : ''}>Sadece Serbest Oyuncular</option>
          <option value="CONTRACTED" ${ui.transferStatus === 'CONTRACTED' ? 'selected' : ''}>Sadece Bonservisli</option>
        </select>
        <select id="trMinOvr">
          ${[65, 75, 80, 85, 88, 90].map(v => `<option value="${v}" ${ui.transferMinOvr === v ? 'selected' : ''}>Min OVR: ${v}+</option>`).join('')}
        </select>
      </div>

      <div style="overflow-x:auto;max-height:540px;overflow-y:auto;">
        <table>
          <thead>
            <tr><th>Rol</th><th>Oyuncu</th><th>Kulüp</th><th>Yaş</th><th>OVR / POT</th><th>Stil</th><th>Piyasa Değeri</th><th>Maaş</th><th>İşlem</th></tr>
          </thead>
          <tbody>
            ${filtered.slice(0, 80).map(p => {
              const club = p.teamId ? state.teams.find(t => t.id === p.teamId) : null;
              return `
                <tr>
                  <td><span class="badge role-${p.role}">${p.role}</span></td>
                  <td><strong>${p.name}</strong> <span style="font-size:11px;color:var(--text-muted);">(${p.nat})</span></td>
                  <td>${club ? `<span class="team-tag" style="background:${club.color};color:${club.color2};">${club.tag}</span>` : '<span class="badge tier-A">SERBEST</span>'}</td>
                  <td>${p.age}</td>
                  <td><span class="ovr-pill ${ovrClass(p.ovr)}">${p.ovr}</span> <span style="font-size:11px;color:var(--text-muted);">/${p.pot}</span></td>
                  <td style="font-size:12px;color:var(--text-muted);">${p.style}</td>
                  <td>${club ? formatMoney(p.marketValue) : '<span style="color:var(--green);">Ücretsiz</span>'}</td>
                  <td>${formatMoney(p.salary)}/hf</td>
                  <td><button class="btn-primary btn-sm" data-open-nego="${p.id}">${club ? 'Teklif Yap' : 'İmza At'}</button></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderNegotiationModal() {
  if (!ui.negotiatingPlayerId) return '';
  const p = state.players.find(x => x.id === ui.negotiatingPlayerId);
  if (!p) return '';
  const club = p.teamId ? state.teams.find(t => t.id === p.teamId) : null;
  const suggestedBuyout = club ? Math.round(p.marketValue * (p.isStarter ? 1.2 : 0.9)) : 0;
  const suggestedSalary = Math.round(p.salary * 1.1);

  return `
    <div class="modal-backdrop" id="negoBackdrop">
      <div class="modal-box modal-sm">
        <div class="card-header">
          <span class="card-title">✍️ Transfer & Sözleşme Pazarlığı</span>
          <button class="btn-ghost btn-sm" id="btnCloseNego">✕</button>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <div>
            <span class="badge role-${p.role}">${p.role}</span>
            <strong style="font-size:17px;margin-left:6px;">${p.name}</strong>
            <div style="font-size:12px;color:var(--text-muted);margin-top:3px;">
              ${club ? `Mevcut Kulüp: ${club.name}` : 'Serbest Oyuncu'} • Yaş ${p.age} • ${p.style}
            </div>
          </div>
          <span class="ovr-pill ${ovrClass(p.ovr)}" style="font-size:16px;padding:5px 10px;">${p.ovr}</span>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
          ${club ? `
            <div>
              <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">Bonservis Teklifi (Piyasa: ${formatMoney(p.marketValue)})</label>
              <input type="number" id="negoBuyout" value="${suggestedBuyout}" step="25000" style="width:100%;" />
            </div>
          ` : `<input type="hidden" id="negoBuyout" value="0" />`}
          <div>
            <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">Haftalık Maaş Teklifi (Mevcut: ${formatMoney(p.salary)})</label>
            <input type="number" id="negoSalary" value="${suggestedSalary}" step="1000" style="width:100%;" />
          </div>
          <div>
            <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">Sözleşme Süresi</label>
            <select id="negoYears" style="width:100%;">
              <option value="1">1 Yıl</option>
              <option value="2" selected>2 Yıl</option>
              <option value="3">3 Yıl</option>
            </select>
          </div>
        </div>

        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button class="btn-ghost" id="btnCancelNego">İptal</button>
          <button class="btn-primary" id="btnSubmitNego">Teklifi Gönder →</button>
        </div>
      </div>
    </div>
  `;
}

// ==================== LEAGUE & TOURNAMENTS ====================
function renderLeague() {
  const standings = getSortedStandings(state, ui.leagueRegion);
  const weekMatches = state.schedules[ui.leagueRegion]?.[Math.min(6, state.week - 1)] || [];

  const bracketHtml = state.bracket ? `
    <div class="card" style="margin-bottom:16px;border-color:var(--gold);">
      <div class="card-header">
        <span class="card-title">🏆 Aktif Turnuva: ${state.bracket.title}</span>
        <span class="badge tier-S">${state.bracket.rounds[state.bracket.currentRound]?.name || ''}</span>
      </div>
      <div class="bracket-grid">
        ${state.bracket.rounds.map(r => `
          <div>
            <div style="font-size:12px;font-weight:800;color:var(--gold-bright);margin-bottom:8px;">${r.name}</div>
            ${r.matches.length === 0 ? '<div style="font-size:12px;color:var(--text-muted);">Henüz belirlenmedi</div>' : r.matches.map(m => {
              const bt = state.teams.find(t => t.id === m.blueId);
              const rt = state.teams.find(t => t.id === m.redId);
              return `
                <div class="bracket-match">
                  ${m.region ? `<div style="font-size:10px;color:var(--text-muted);margin-bottom:3px;">${m.region}</div>` : ''}
                  <div class="bracket-row ${m.winnerId === bt.id ? 'winner' : ''}">
                    <span><span class="team-tag" style="background:${bt.color};color:${bt.color2};margin-right:6px;">${bt.tag}</span>${bt.name}</span>
                    <b>${m.played ? m.blueScore : '-'}</b>
                  </div>
                  <div class="bracket-row ${m.winnerId === rt.id ? 'winner' : ''}">
                    <span><span class="team-tag" style="background:${rt.color};color:${rt.color2};margin-right:6px;">${rt.tag}</span>${rt.name}</span>
                    <b>${m.played ? m.redScore : '-'}</b>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  return `
    ${bracketHtml}
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">
      ${REGIONS.map(r => `
        <button class="region-tab ${ui.leagueRegion === r.id ? 'active' : ''}" data-league-reg="${r.id}">${r.name}</button>
      `).join('')}
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title">${ui.leagueRegion} Puan Durumu</span><span style="font-size:11px;color:var(--text-muted);">İlk 4 Playoff • İlk 2 Uluslararası</span></div>
        <table>
          <thead><tr><th>#</th><th>Takım</th><th>G-M</th><th>Oyun</th><th>OVR</th><th>Kupalar</th></tr></thead>
          <tbody>
            ${standings.map((r, idx) => {
              const t = state.teams.find(x => x.id === r.teamId);
              return `
                <tr class="${t.id === state.userTeamId ? 'highlight-row' : ''}">
                  <td style="color:${idx < 4 ? 'var(--green)' : 'var(--text-muted)'};font-weight:700;">${idx + 1}</td>
                  <td><span class="team-tag" style="background:${t.color};color:${t.color2};margin-right:6px;">${t.tag}</span>${t.name}</td>
                  <td><b>${r.wins}-${r.losses}</b></td>
                  <td>${r.gameWins}-${r.gameLosses}</td>
                  <td><span class="ovr-pill ${ovrClass(getTeamOVR(state, t.id))}">${getTeamOVR(state, t.id)}</span></td>
                  <td style="font-size:11px;color:var(--gold-bright);">${t.trophies.length ? `🏆 ${t.trophies.length}` : '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div style="display:flex;flex-direction:column;gap:16px;">
        <div class="card">
          <div class="card-header"><span class="card-title">${ui.leagueRegion} Hafta ${Math.min(7, state.week)} Maçları</span></div>
          ${weekMatches.map(m => {
            const bt = state.teams.find(t => t.id === m.blueId);
            const rt = state.teams.find(t => t.id === m.redId);
            return `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid rgba(35,48,74,0.5);">
                <span style="flex:1;"><span class="team-tag" style="background:${bt.color};color:${bt.color2};margin-right:6px;">${bt.tag}</span>${bt.name}</span>
                <strong style="padding:0 12px;color:var(--gold-bright);">${m.played ? `${m.blueScore} - ${m.redScore}` : 'VS'}</strong>
                <span style="flex:1;text-align:right;">${rt.name}<span class="team-tag" style="background:${rt.color};color:${rt.color2};margin-left:6px;">${rt.tag}</span></span>
              </div>
            `;
          }).join('')}
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">🏛️ Uluslararası Şampiyonlar Tarihi</span></div>
          ${state.history.length === 0
            ? '<p style="font-size:12.5px;color:var(--text-muted);">Henüz tamamlanan MSI veya Worlds turnuvası yok.</p>'
            : state.history.map(h => `<div style="padding:6px 0;font-size:13px;">🏆 <b>${h.event} ${h.season}:</b> ${h.winner} (${h.tag})</div>`).join('')}
        </div>
      </div>
    </div>
  `;
}

// ==================== CLUB, FINANCE & FACILITIES ====================
function renderClub() {
  const team = state.teams.find(t => t.id === state.userTeamId);
  const wages = getTeamWeeklyWages(state, team.id);
  const fanRev = team.fanbase * 950;
  const spRev = team.sponsor ? team.sponsor.weekly : 0;

  return `
    <div class="grid-3" style="margin-bottom:16px;">
      <div class="card">
        <div class="kpi-label">Mevcut Bütçe</div>
        <div class="kpi-val" style="color:var(--green);">${formatMoney(team.budget)}</div>
      </div>
      <div class="card">
        <div class="kpi-label">Haftalık Gelir (Sponsor + Taraftar)</div>
        <div class="kpi-val" style="color:var(--blue);">+${formatMoney(spRev + fanRev)}</div>
      </div>
      <div class="card">
        <div class="kpi-label">Haftalık Maaş Gideri</div>
        <div class="kpi-val" style="color:var(--red);">-${formatMoney(wages)}</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title">🏗️ Kulüp Tesisleri & Teknik Ekip</span></div>
        ${Object.entries(FACILITY_INFO).map(([key, info]) => {
          const lvl = team.facilities[key];
          const nextCost = lvl < 3 ? info.costs[lvl] : null;
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid rgba(35,48,74,0.5);gap:12px;">
              <div>
                <div style="font-weight:700;font-size:14px;">${info.name} <span class="badge tier-S">Sv. ${lvl}/3</span></div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${info.desc}</div>
              </div>
              <button class="btn-primary btn-sm" data-upgrade-fac="${key}" ${lvl >= 3 ? 'disabled' : ''}>
                ${lvl >= 3 ? 'MAKS' : `Yükselt (${formatMoney(nextCost)})`}
              </button>
            </div>
          `;
        }).join('')}
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">💼 Sponsorluk Anlaşmaları</span></div>
        ${SPONSORS.map(sp => {
          const active = team.sponsor?.id === sp.id;
          const locked = team.prestige < sp.minPrestige;
          return `
            <div style="padding:12px;border-radius:8px;margin-bottom:10px;background:${active ? 'rgba(200,155,60,0.12)' : 'var(--bg)'};border:1px solid ${active ? 'var(--gold)' : 'var(--border)'};">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong>${sp.name}</strong>
                ${active ? '<span class="badge tier-S">AKTİF</span>' : `<button class="btn-ghost btn-sm" data-pick-sponsor="${sp.id}" ${locked ? 'disabled' : ''}>${locked ? `Prestij ${sp.minPrestige}+` : 'Anlaş'}</button>`}
              </div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">${sp.desc}</div>
              <div style="font-size:12px;margin-top:6px;">
                Haftalık: <b style="color:var(--green);">${formatMoney(sp.weekly)}</b> • Kupa Primi: <b style="color:var(--gold-bright);">${formatMoney(sp.bonus)}</b> • Hedef: ${sp.goal}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ==================== PATCH & META ====================
function renderMeta() {
  const patch = getCurrentPatch(state);
  return `
    <div class="card" style="margin-bottom:16px;border-color:var(--gold);">
      <div class="card-header">
        <span class="card-title">🧪 Yama ${patch.version} — ${patch.name}</span>
        <span class="badge tier-S">Erken x${patch.earlyWeight} • Orta x${patch.midWeight} • Geç x${patch.lateWeight}</span>
      </div>
      <p style="font-size:13.5px;color:var(--text);margin-bottom:10px;">${patch.desc}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <span class="badge tier-S">Güçlenen Sınıflar: ${patch.buffedClasses.join(', ')}</span>
        ${patch.nerfedClasses.length ? `<span class="badge tier-C">Zayıflayan Sınıflar: ${patch.nerfedClasses.join(', ')}</span>` : ''}
      </div>
    </div>

    <div class="grid-3">
      ${ROLES.map(role => {
        const list = CHAMPIONS.filter(c => c.roles.includes(role)).sort((a, b) => {
          const o = { S: 3, A: 2, B: 1, C: 0 };
          return o[getChampionMetaTier(b, patch)] - o[getChampionMetaTier(a, patch)];
        });
        return `
          <div class="card">
            <div class="card-header"><span class="badge role-${role}">${role}</span><span class="card-title">Meta Sıralaması</span></div>
            ${list.map(c => {
              const t = getChampionMetaTier(c, patch);
              return `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid rgba(35,48,74,0.4);font-size:12.5px;">
                  <span><b>${c.name}</b> <span style="font-size:11px;color:var(--text-muted);">(${c.classTag})</span></span>
                  <span class="badge tier-${t}">${t}</span>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ==================== MAIN SHELL ====================
function renderAppShell() {
  const team = state.teams.find(t => t.id === state.userTeamId);
  const unreadCount = state.inbox.filter(m => !m.read).length;
  const nextMatch = getUserNextMatch(state);

  const navItems = [
    ['dashboard', '🏠 Genel Bakış'],
    ['inbox', '📬 Gelen Kutusu', unreadCount],
    ['roster', '👥 Kadro & Antrenman'],
    ['transfers', '🔍 Transfer & Scouting'],
    ['league', '🏆 Lig & Turnuvalar'],
    ['club', '💼 Kulüp & Finans'],
    ['meta', '🧪 Yama & Meta'],
  ];

  let bodyHtml = '';
  if (ui.tab === 'dashboard') bodyHtml = renderDashboard();
  else if (ui.tab === 'inbox') bodyHtml = renderInbox();
  else if (ui.tab === 'roster') bodyHtml = renderRoster();
  else if (ui.tab === 'transfers') bodyHtml = renderTransfers();
  else if (ui.tab === 'league') bodyHtml = renderLeague();
  else if (ui.tab === 'club') bodyHtml = renderClub();
  else if (ui.tab === 'meta') bodyHtml = renderMeta();

  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-club">
          <span class="team-tag" style="background:${team.color};color:${team.color2};font-size:14px;padding:7px 10px;">${team.tag}</span>
          <div>
            <div style="font-weight:800;font-size:14px;">${team.name}</div>
            <div style="font-size:11px;color:var(--text-muted);">${team.region} • Prestij ${team.prestige}</div>
          </div>
        </div>
        <nav class="sidebar-nav">
          ${navItems.map(([id, label, badge]) => `
            <button class="nav-item ${ui.tab === id ? 'active' : ''}" data-nav="${id}">
              <span>${label}</span>
              ${badge ? `<span class="nav-badge">${badge}</span>` : ''}
            </button>
          `).join('')}
        </nav>
        <div class="sidebar-footer">
          <button class="btn-ghost btn-sm" id="btnSaveGame">💾 Kariyeri Kaydet</button>
          <button class="btn-ghost btn-sm" id="btnMainMenu">↩ Ana Menü / Yeni Kariyer</button>
        </div>
      </aside>

      <div class="main-area">
        <header class="topbar">
          <div class="topbar-meta">
            <div class="meta-chip">📅 <b>Sezon ${state.season}</b> • ${getPhaseLabel(state.phase)} (H${state.week})</div>
            <div class="meta-chip">🧪 Yama <b>${getCurrentPatch(state).version}</b></div>
            <div class="meta-chip">💰 <b style="color:var(--green);">${formatMoney(team.budget)}</b></div>
          </div>
          <div class="topbar-actions">
            ${nextMatch
              ? `<button class="btn-primary" id="btnTopPlay">🎮 Maça Git (BO${nextMatch.bestOf})</button>`
              : `<button class="btn-primary" id="btnTopAdvance">${state.phase === 'OFFSEASON' ? `🚀 Sezon ${state.season + 1}'e Başla` : '⏩ İlerle →'}</button>`}
          </div>
        </header>
        <main class="content">${bodyHtml}</main>
      </div>
    </div>
    ${renderNegotiationModal()}
  `;
}

function render() {
  root.innerHTML = (state ? renderAppShell() : renderStartScreen()) + (ui.toastMsg ? `<div class="toast">${ui.toastMsg}</div>` : '');
  bindAppEvents();
}

function launchUserMatch() {
  const m = getUserNextMatch(state);
  if (!m) return;
  openSeriesModal(state, m, () => {
    advanceWeekOrRound(state);
    saveGame(state);
    render();
    showToast('Seri tamamlandı ve hafta ilerletildi!');
  });
}

function bindAppEvents() {
  // Start Screen
  root.querySelectorAll('[data-start-region]').forEach(btn => {
    btn.addEventListener('click', () => { ui.startRegion = btn.dataset.startRegion; render(); });
  });
  root.querySelectorAll('[data-pick-club]').forEach(btn => {
    btn.addEventListener('click', () => {
      state = createNewCareer(btn.dataset.pickClub);
      ui.leagueRegion = state.teams.find(t => t.id === state.userTeamId).region;
      ui.tab = 'dashboard';
      saveGame(state);
      render();
      showToast('Kariyerin başladı! Başarılar koç!');
    });
  });
  root.querySelector('#btnLoadSave')?.addEventListener('click', () => {
    const loaded = loadGame();
    if (loaded) {
      state = loaded;
      ui.leagueRegion = state.teams.find(t => t.id === state.userTeamId).region;
      ui.tab = 'dashboard';
      render();
      showToast('Kayıtlı kariyer yüklendi!');
    }
  });

  if (!state) return;

  // Navigation
  root.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => { ui.tab = btn.dataset.nav; render(); });
  });
  root.querySelector('#btnSaveGame')?.addEventListener('click', () => {
    saveGame(state);
    showToast('Kariyer başarıyla kaydedildi!');
  });
  root.querySelector('#btnMainMenu')?.addEventListener('click', () => {
    saveGame(state);
    state = null;
    render();
  });

  // Match & Advance buttons
  root.querySelector('#btnPlayMatchLive')?.addEventListener('click', launchUserMatch);
  root.querySelector('#btnTopPlay')?.addEventListener('click', launchUserMatch);

  root.querySelector('#btnQuickSimMatch')?.addEventListener('click', () => {
    const m = getUserNextMatch(state);
    if (!m) return;
    quickSimSeries(state, m);
    const bt = state.teams.find(t => t.id === m.blueId);
    const rt = state.teams.find(t => t.id === m.redId);
    advanceWeekOrRound(state);
    saveGame(state);
    render();
    showToast(`Sonuç: ${bt.tag} ${m.blueScore} - ${m.redScore} ${rt.tag}`);
  });

  const doAdvance = () => {
    advanceWeekOrRound(state);
    saveGame(state);
    render();
    showToast(`Takvim ilerledi: ${getPhaseLabel(state.phase)} H${state.week}`);
  };
  root.querySelector('#btnAdvanceCal')?.addEventListener('click', doAdvance);
  root.querySelector('#btnTopAdvance')?.addEventListener('click', doAdvance);

  // Inbox
  root.querySelectorAll('[data-open-msg]').forEach(el => {
    el.addEventListener('click', () => { ui.selectedInboxId = el.dataset.openMsg; ui.tab = 'inbox'; render(); });
  });
  root.querySelectorAll('[data-select-inbox]').forEach(el => {
    el.addEventListener('click', () => { ui.selectedInboxId = el.dataset.selectInbox; render(); });
  });

  // Roster, Training, Tactics & Scrims
  root.querySelectorAll('[data-set-starter]').forEach(btn => {
    btn.addEventListener('click', () => { setStarter(state, btn.dataset.setStarter); saveGame(state); render(); showToast('İlk 5 güncellendi.'); });
  });
  root.querySelectorAll('[data-release-player]').forEach(btn => {
    btn.addEventListener('click', () => {
      const res = releasePlayer(state, btn.dataset.releasePlayer);
      saveGame(state);
      render();
      showToast(res.reason);
    });
  });
  root.querySelectorAll('[data-set-training]').forEach(el => {
    el.addEventListener('click', () => {
      state.teams.find(t => t.id === state.userTeamId).trainingFocus = el.dataset.setTraining;
      saveGame(state);
      render();
      showToast('Antrenman programı güncellendi.');
    });
  });
  root.querySelectorAll('[data-def-plan]').forEach(btn => {
    btn.addEventListener('click', () => { state.teams.find(t => t.id === state.userTeamId).tactics.gameplan = btn.dataset.defPlan; render(); });
  });
  root.querySelectorAll('[data-def-lane]').forEach(btn => {
    btn.addEventListener('click', () => { state.teams.find(t => t.id === state.userTeamId).tactics.laneFocus = btn.dataset.defLane; render(); });
  });
  root.querySelectorAll('[data-def-obj]').forEach(btn => {
    btn.addEventListener('click', () => { state.teams.find(t => t.id === state.userTeamId).tactics.objective = btn.dataset.defObj; render(); });
  });
  root.querySelector('#btnPlayScrim')?.addEventListener('click', () => {
    const oppId = root.querySelector('#scrimSelect').value;
    const res = playWeeklyScrim(state, oppId);
    saveGame(state);
    render();
    showToast(res.ok ? res.text : res.reason);
  });

  // Transfers & Scouting
  const trSearch = root.querySelector('#trSearch');
  if (trSearch) {
    trSearch.addEventListener('input', e => {
      ui.transferSearch = e.target.value;
      render();
      const again = root.querySelector('#trSearch');
      if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
    });
  }
  root.querySelector('#trRole')?.addEventListener('change', e => { ui.transferRole = e.target.value; render(); });
  root.querySelector('#trStatus')?.addEventListener('change', e => { ui.transferStatus = e.target.value; render(); });
  root.querySelector('#trMinOvr')?.addEventListener('change', e => { ui.transferMinOvr = Number(e.target.value); render(); });

  root.querySelector('#btnPromoteAcademy')?.addEventListener('click', () => {
    const role = root.querySelector('#academyRoleSelect').value;
    const res = promoteAcademyPlayer(state, role);
    saveGame(state);
    render();
    showToast(res.ok ? `Akademiden ${res.player.name} (${res.player.role}, OVR ${res.player.ovr}) yükseldi!` : res.reason);
  });

  root.querySelectorAll('[data-open-nego]').forEach(btn => {
    btn.addEventListener('click', () => { ui.negotiatingPlayerId = btn.dataset.openNego; render(); });
  });
  root.querySelector('#btnCloseNego')?.addEventListener('click', () => { ui.negotiatingPlayerId = null; render(); });
  root.querySelector('#btnCancelNego')?.addEventListener('click', () => { ui.negotiatingPlayerId = null; render(); });
  root.querySelector('#btnSubmitNego')?.addEventListener('click', () => {
    const buyout = Number(root.querySelector('#negoBuyout').value) || 0;
    const salary = Number(root.querySelector('#negoSalary').value) || 0;
    const years = Number(root.querySelector('#negoYears').value) || 2;
    const res = attemptSignOrTransfer(state, ui.negotiatingPlayerId, buyout, salary, years);
    if (res.ok) ui.negotiatingPlayerId = null;
    saveGame(state);
    render();
    showToast(res.reason);
  });

  // League Tabs
  root.querySelectorAll('[data-league-reg]').forEach(btn => {
    btn.addEventListener('click', () => { ui.leagueRegion = btn.dataset.leagueReg; render(); });
  });

  // Club Facilities & Sponsors
  root.querySelectorAll('[data-upgrade-fac]').forEach(btn => {
    btn.addEventListener('click', () => {
      const res = upgradeFacility(state, btn.dataset.upgradeFac);
      saveGame(state);
      render();
      showToast(res.reason);
    });
  });
  root.querySelectorAll('[data-pick-sponsor]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sp = SPONSORS.find(s => s.id === btn.dataset.pickSponsor);
      if (sp) {
        state.teams.find(t => t.id === state.userTeamId).sponsor = sp;
        saveGame(state);
        render();
        showToast(`${sp.name} ile sponsorluk anlaşması imzalandı!`);
      }
    });
  });
}

render();

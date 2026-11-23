// LoL Esports Manager v2.0 — Main FM UI Shell (7 Regions, Fearless Draft, Drama Events, Challenger Scouting, AI Offers, Swiss Worlds, Awards & Worlds Mayhem)
import { CHAMPIONS, CHAMPION_MAP, getChampionMetaTier } from '../data/champions.js';
import { ROLES, REGIONS, TRAITS, getRivalryName, createInitialDatabase } from '../data/teamsAndPlayers.js';
import {
  SPONSORS, FACILITY_INFO, TRAINING_MODES,
  createNewCareer, getCurrentPatch, getPhaseLabel, getTeamRoster, getTeamOVR,
  getTeamWeeklyWages, getSortedStandings, getUserNextMatch, quickSimSeries,
  advanceWeekOrRound, attemptSignOrTransfer, setStarter, releasePlayer,
  promoteAcademyPlayer, playWeeklyScrim, upgradeFacility, formatMoney,
  scoutChallengerProspect, signChallengerProspect, respondIncomingOffer,
  resolveDramaEvent, saveGame, loadGame, listSaveSlots, saveToSlot, loadFromSlot, deleteSaveSlot
} from '../engine/gameEngine.js';
import { openSeriesModal } from './matchModal.js';
import { openWorldsMayhemModal } from './mayhemModal.js';

const root = document.getElementById('app');

let state = null;
let ui = {
  startRegion: 'LCK',
  tab: 'dashboard',
  leagueRegion: 'LCK',
  transferSubTab: 'market', // market | challenger | offers
  transferRole: 'ALL',
  transferStatus: 'ALL',
  transferSearch: '',
  transferMinOvr: 72,
  negotiatingPlayerId: null,
  selectedInboxId: null,
  saveModalOpen: false,
  saveNameDraft: '',
  toastMsg: null,
  toastTimer: null,
};

const previewDB = createInitialDatabase();

function showToast(msg) {
  ui.toastMsg = msg;
  render();
  if (ui.toastTimer) clearTimeout(ui.toastTimer);
  ui.toastTimer = setTimeout(() => {
    ui.toastMsg = null;
    const t = document.querySelector('.toast');
    if (t) t.remove();
  }, 3600);
}

function ovrClass(ovr) {
  return ovr >= 90 ? 'ovr-90' : ovr >= 85 ? 'ovr-85' : ovr >= 80 ? 'ovr-80' : 'ovr-low';
}

function barHtml(val, color) {
  return `<div class="bar-wrap"><div class="bar-fill" style="width:${Math.max(0, Math.min(100, val))}%;background:${color};"></div></div>`;
}

// ==================== START SCREEN ====================
function renderStartScreen() {
  const slots = listSaveSlots();
  const filledCount = slots.filter(s => s.record).length;
  const regTeams = previewDB.teams.filter(t => t.region === ui.startRegion);

  return `
    <div class="start-screen">
      <div class="start-header">
        <div>
          <div class="brand-title">🏆 LoL ESPORTS MANAGER v2.0</div>
          <div class="brand-sub">7 Bölge (LCK, LPL, LEC, LCS, TCL, CBLOL, LCO) • Fearless Draft • 16 Takımlı Swiss Worlds • Wonderkid Scouting</div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn-blue" id="btnStartMayhem" style="padding:11px 18px;font-size:13.5px;">🔥 Worlds Mayhem (Arcade)</button>
          <button class="btn-primary" id="btnOpenSaveManager" style="padding:11px 18px;font-size:13.5px;">
            💾 Kayıtlı Oyunlar / Yükle (${filledCount})
          </button>
        </div>
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
  const streamerBonus = state.players.filter(p => p.teamId === team.id && p.trait === 'Streamer').length * 18000;
  const netWeekly = (team.sponsor?.weekly || 35000) + team.fanbase * 950 + streamerBonus - wages;

  const offersBanner = state.incomingOffers?.length ? `
    <div class="card" style="margin-bottom:14px;border-color:var(--green);background:rgba(16,185,129,0.08);">
      <div class="card-header" style="margin-bottom:8px;">
        <span class="card-title" style="color:var(--green);">💰 Gelen Transfer Teklifleri (${state.incomingOffers.length})</span>
      </div>
      ${state.incomingOffers.map(o => `
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;padding:6px 0;">
          <span style="font-size:13px;"><b>${o.buyerName} (${o.buyerTag})</b>, <b>${o.playerName}</b> (${o.playerRole}, OVR ${o.playerOvr}) için <b style="color:var(--green);">${formatMoney(o.amount)}</b> teklif etti!</span>
          <div style="display:flex;gap:6px;">
            <button class="btn-green btn-sm" data-offer-accept="${o.id}">✓ Kabul Et</button>
            <button class="btn-danger btn-sm" data-offer-reject="${o.id}">✕ Reddet</button>
          </div>
        </div>
      `).join('')}
    </div>
  ` : '';

  let nextMatchHtml = '';
  if (nextMatch) {
    const oppId = nextMatch.blueId === team.id ? nextMatch.redId : nextMatch.blueId;
    const opp = state.teams.find(t => t.id === oppId);
    const oppOvr = getTeamOVR(state, oppId);
    const rivalry = getRivalryName(team.id, oppId);
    nextMatchHtml = `
      <div class="card" style="border-color:var(--gold);background:linear-gradient(135deg, rgba(200,155,60,0.1), var(--bg-card));">
        <div class="card-header">
          <span class="card-title">⚔️ Sıradaki Karşılaşma (${getPhaseLabel(state.phase)} • BO${nextMatch.bestOf}) ${rivalry ? `• 🔥 ${rivalry}` : ''}</span>
          <div style="display:flex;gap:6px;">
            ${state.fearlessEnabled ? '<span class="badge tier-S">FEARLESS</span>' : ''}
            <span class="badge tier-A">Hafta ${state.week}</span>
          </div>
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
    ${offersBanner}
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
          <button class="btn-ghost btn-sm" data-nav="league">7 Lig & Worlds →</button>
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
            <div style="padding:7px 0;border-bottom:1px solid rgba(35,48,74,0.5);cursor:pointer;" data-open-msg="${msg.id}">
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

// ==================== ROSTER, TRAINING & TACTICS ====================
function renderRoster() {
  const team = state.teams.find(t => t.id === state.userTeamId);
  const myPlayers = state.players
    .filter(p => p.teamId === team.id)
    .sort((a, b) => (b.isStarter - a.isStarter) || (ROLES.indexOf(a.role) - ROLES.indexOf(b.role)));
  const scrimOpponents = state.teams.filter(t => t.id !== team.id).sort((a, b) => getTeamOVR(state, b.id) - getTeamOVR(state, a.id));

  return `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-header">
        <span class="card-title">👥 Kadro, Kişilikler & Özellikler (${myPlayers.length} Oyuncu)</span>
        <span style="font-size:12px;color:var(--text-muted);">Haftalık Maaş: <b>${formatMoney(getTeamWeeklyWages(state, team.id))}</b> • Sinerji: <b>${Math.round(team.synergy)}%</b></span>
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>Durum</th><th>Rol</th><th>Oyuncu & Kişilik</th><th>Yaş</th><th>OVR/POT</th>
              <th title="Mekanik">MEK</th><th title="Koridor">KOR</th><th title="Makro">MAK</th><th title="Takım Savaşı">TS</th><th title="Clutch">CLU</th><th title="Şampiyon Havuzu">HAV</th>
              <th>Moral / Form / Yorg.</th><th>Maaş</th><th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            ${myPlayers.map(p => {
              const tr = TRAITS[p.trait];
              return `
                <tr class="${p.isStarter ? 'highlight-row' : ''}">
                  <td>${p.isStarter ? '<span class="badge tier-S">İLK 5</span>' : '<span class="badge tier-B">YEDEK</span>'}</td>
                  <td><span class="badge role-${p.role}">${p.role}</span></td>
                  <td>
                    <strong>${p.name}</strong> <span style="font-size:11px;color:var(--text-muted);">(${p.nat})</span>
                    ${tr ? `<span class="badge tier-A" title="${tr.desc}" style="margin-left:4px;">${tr.icon} ${tr.label}</span>` : ''}
                    ${p.importWeeksLeft > 0 ? `<span class="badge tier-C" title="Dil bariyeri adaptasyon süresi" style="margin-left:4px;">🌐 Uyum ${p.importWeeksLeft}hf</span>` : ''}
                    <div style="font-size:10.5px;color:var(--text-muted);">★ ${p.sigChamps.slice(0, 3).map(id => CHAMPION_MAP[id]?.name).join(', ')}</div>
                  </td>
                  <td>${p.age}</td>
                  <td><span class="ovr-pill ${ovrClass(p.ovr)}">${p.ovr}</span> <span style="font-size:11px;color:var(--text-muted);">/${p.pot}</span></td>
                  <td>${p.attrs.mechanics}</td><td>${p.attrs.laning}</td><td>${p.attrs.macro}</td><td>${p.attrs.teamfight}</td><td>${p.attrs.clutch}</td><td>${p.attrs.pool}</td>
                  <td style="font-size:11px;">
                    <div>M:${p.morale} ${barHtml(p.morale, '#10b981')}</div>
                    <div>F:${p.form} ${barHtml(p.form, '#38bdf8')}</div>
                    <div>Y:${p.fatigue} ${barHtml(p.fatigue, p.fatigue > 65 ? '#ef4444' : '#f59e0b')}</div>
                  </td>
                  <td style="font-size:12px;">${formatMoney(p.salary)}<br><span style="color:var(--text-muted);">${p.contractYears}y</span></td>
                  <td>
                    <div style="display:flex;gap:4px;">
                      ${!p.isStarter ? `<button class="btn-blue btn-sm" data-set-starter="${p.id}">İlk 5</button>` : ''}
                      <button class="btn-danger btn-sm" data-release-player="${p.id}">Sal</button>
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
        <div class="card-header"><span class="card-title">🏋️ Haftalık Antrenman</span></div>
        ${TRAINING_MODES.map(tm => `
          <div data-set-training="${tm.id}" style="padding:8px;border-radius:7px;margin-bottom:6px;cursor:pointer;background:${team.trainingFocus === tm.id ? 'rgba(200,155,60,0.16)' : 'var(--bg)'};border:1px solid ${team.trainingFocus === tm.id ? 'var(--gold)' : 'var(--border)'};">
            <div style="font-size:12.5px;font-weight:700;color:${team.trainingFocus === tm.id ? 'var(--gold-bright)' : 'var(--text)'};">${tm.name}</div>
            <div style="font-size:11px;color:var(--text-muted);">${tm.desc}</div>
          </div>
        `).join('')}
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">📋 Varsayılan Takım & Rol Taktikleri</span></div>
        <div style="font-size:11.5px;color:var(--text-muted);margin-bottom:4px;">Oyun Planı</div>
        <div class="tactic-btn-group" style="margin-bottom:9px;">
          ${[['aggressive', 'Erken Baskı'], ['balanced', 'Dengeli'], ['scaling', 'Scaling'], ['split', 'Split']].map(([k, lbl]) =>
            `<button class="tactic-btn ${team.tactics.gameplan === k ? 'active' : ''}" data-def-plan="${k}">${lbl}</button>`
          ).join('')}
        </div>
        <div style="font-size:11.5px;color:var(--text-muted);margin-bottom:4px;">Ormancı Odak & Objektif</div>
        <div class="tactic-btn-group" style="margin-bottom:9px;">
          ${['TOP', 'MID', 'BOT'].map(l => `<button class="tactic-btn ${team.tactics.laneFocus === l ? 'active' : ''}" data-def-lane="${l}">${l}</button>`).join('')}
          ${[['dragon', '🐉'], ['baron', '👑'], ['towers', '🏰']].map(([k, lbl]) => `<button class="tactic-btn ${team.tactics.objective === k ? 'active' : ''}" data-def-obj="${k}">${lbl}</button>`).join('')}
        </div>
        <div style="font-size:11.5px;color:var(--text-muted);margin-bottom:4px;">Rol Mikro Emirleri</div>
        <div class="tactic-btn-group" style="margin-bottom:5px;">
          ${[['carry', 'Top: Carry'], ['balanced', 'Dengeli'], ['weakside', 'Weakside']].map(([k, lbl]) =>
            `<button class="tactic-btn ${(team.tactics.topStyle || 'balanced') === k ? 'active' : ''}" data-def-top="${k}">${lbl}</button>`
          ).join('')}
        </div>
        <div class="tactic-btn-group" style="margin-bottom:5px;">
          ${[['roam', 'Sup: Roam'], ['balanced', 'Dengeli'], ['peel', 'Peel']].map(([k, lbl]) =>
            `<button class="tactic-btn ${(team.tactics.supStyle || 'balanced') === k ? 'active' : ''}" data-def-sup="${k}">${lbl}</button>`
          ).join('')}
        </div>
        <div class="tactic-btn-group">
          ${[['aggressive', 'ADC: Agresif'], ['balanced', 'Dengeli'], ['safe', 'Güvenli']].map(([k, lbl]) =>
            `<button class="tactic-btn ${(team.tactics.adcStyle || 'balanced') === k ? 'active' : ''}" data-def-adc="${k}">${lbl}</button>`
          ).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">🤝 Haftalık Hazırlık Maçı (Scrim)</span></div>
        <p style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">
          7 bölgeden istediğin takımla scrim yapıp sinerji (+2/+4) ve form kazanabilirsin (Yorgunluk +7).
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

// ==================== TRANSFERS, CHALLENGER SCOUTING & OFFERS ====================
function renderTransfers() {
  const team = state.teams.find(t => t.id === state.userTeamId);
  const scoutCost = team.facilities.analystDesk >= 3 ? 'Ücretsiz (Analist Sv.3)' : '$15K';

  const subTabs = `
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">
      <button class="region-tab ${ui.transferSubTab === 'market' ? 'active' : ''}" data-tr-sub="market">🌍 Transfer Pazarı</button>
      <button class="region-tab ${ui.transferSubTab === 'challenger' ? 'active' : ''}" data-tr-sub="challenger">🌟 SoloQ Challenger Scouting (${state.challengerPool.length})</button>
      <button class="region-tab ${ui.transferSubTab === 'offers' ? 'active' : ''}" data-tr-sub="offers">💰 Gelen Teklifler (${state.incomingOffers.length})</button>
    </div>
  `;

  if (ui.transferSubTab === 'challenger') {
    return `
      ${subTabs}
      <div class="card">
        <div class="card-header">
          <span class="card-title">🌟 SoloQ Challenger Sıralaması — Gizli Wonderkid Avı</span>
          <span style="font-size:12px;color:var(--text-muted);">Scout Maliyeti: <b>${scoutCost}</b> • Bütçe: <b style="color:var(--green);">${formatMoney(team.budget)}</b></span>
        </div>
        <p style="font-size:12.5px;color:var(--text-muted);margin-bottom:12px;">
          16-18 yaşındaki Challenger yeteneklerinin gerçek potansiyeli ve kişiliği gizlidir (<b>?</b>). Scout göndererek gerçek potansiyelini açığa çıkar ve ucuza kapat!
        </p>
        <table>
          <thead><tr><th>Sunucu / LP</th><th>Rol</th><th>Oyuncu</th><th>Yaş</th><th>OVR</th><th>Potansiyel</th><th>Kişilik</th><th>İmza Bedeli</th><th>İşlem</th></tr></thead>
          <tbody>
            ${state.challengerPool.map(p => `
              <tr>
                <td><span class="badge tier-A">${p.server}</span> <b>${p.lp} LP</b></td>
                <td><span class="badge role-${p.role}">${p.role}</span></td>
                <td><strong>${p.name}</strong> <span style="font-size:11px;color:var(--text-muted);">(${p.nat})</span></td>
                <td>${p.age}</td>
                <td><span class="ovr-pill ${ovrClass(p.ovr)}">${p.ovr}</span></td>
                <td>${p.scouted ? `<span class="ovr-pill ${ovrClass(p.pot)}">${p.pot}</span>` : '<span class="badge tier-B">? GİZLİ</span>'}</td>
                <td>${p.scouted ? `${TRAITS[p.trait]?.icon || ''} ${TRAITS[p.trait]?.label || p.trait}` : '<span style="color:var(--text-muted);">?</span>'}</td>
                <td>${formatMoney(p.signingFee)}</td>
                <td>
                  <div style="display:flex;gap:6px;">
                    ${!p.scouted ? `<button class="btn-blue btn-sm" data-scout-chal="${p.id}">🔎 Scout (${scoutCost === '$15K' ? '$15K' : 'Ücretsiz'})</button>` : ''}
                    <button class="btn-green btn-sm" data-sign-chal="${p.id}">✍️ İmzala</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  if (ui.transferSubTab === 'offers') {
    return `
      ${subTabs}
      <div class="card">
        <div class="card-header"><span class="card-title">💰 Oyuncularına Gelen AI Transfer Teklifleri</span></div>
        ${state.incomingOffers.length === 0
          ? '<p style="font-size:13px;color:var(--text-muted);">Şu an aktif gelen bir transfer teklifi yok. Haftalar ilerledikçe rakip kulüpler yıldız oyuncularına teklif sunacaktır.</p>'
          : state.incomingOffers.map(o => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--bg);border:1px solid var(--border);border-radius:8px;margin-bottom:8px;">
              <div>
                <strong>${o.buyerName} (${o.buyerTag})</strong> → <span class="badge role-${o.playerRole}">${o.playerRole}</span> <b>${o.playerName}</b> (OVR ${o.playerOvr})
                <div style="font-size:12.5px;color:var(--green);margin-top:3px;">Bonservis Teklifi: <b>${formatMoney(o.amount)}</b></div>
              </div>
              <div style="display:flex;gap:8px;">
                <button class="btn-green btn-sm" data-offer-accept="${o.id}">✓ Kabul Et</button>
                <button class="btn-danger btn-sm" data-offer-reject="${o.id}">✕ Reddet</button>
              </div>
            </div>
          `).join('')}
      </div>
    `;
  }

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
    ${subTabs}
    <div class="card" style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
      <div>
        <div class="card-title">🌱 Gençlik Akademisi (Sv. ${team.facilities.youthAcademy})</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Her mevsim akademinden bir genç yeteneği ücretsiz olarak A takıma yükseltebilirsin.</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <select id="academyRoleSelect">${ROLES.map(r => `<option value="${r}">${r}</option>`).join('')}</select>
        <button class="btn-green" id="btnPromoteAcademy" ${state.academyPromotedThisSplit ? 'disabled' : ''}>
          ${state.academyPromotedThisSplit ? '✓ Bu Mevsim Kullanıldı' : '+ Akademiden Yükselt'}
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">🔍 Küresel Transfer Pazarı (${filtered.length} Oyuncu)</span>
        <span style="font-size:13px;color:var(--green);font-weight:700;">Bütçe: ${formatMoney(team.budget)}</span>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
        <input type="text" id="trSearch" placeholder="Oyuncu adı ara..." value="${ui.transferSearch}" style="min-width:170px;" />
        <select id="trRole">
          <option value="ALL" ${ui.transferRole === 'ALL' ? 'selected' : ''}>Tüm Roller</option>
          ${ROLES.map(r => `<option value="${r}" ${ui.transferRole === r ? 'selected' : ''}>${r}</option>`).join('')}
        </select>
        <select id="trStatus">
          <option value="ALL" ${ui.transferStatus === 'ALL' ? 'selected' : ''}>Tümü</option>
          <option value="FA" ${ui.transferStatus === 'FA' ? 'selected' : ''}>Serbest Oyuncular</option>
          <option value="CONTRACTED" ${ui.transferStatus === 'CONTRACTED' ? 'selected' : ''}>Bonservisli</option>
        </select>
        <select id="trMinOvr">
          ${[65, 72, 78, 82, 86, 90].map(v => `<option value="${v}" ${ui.transferMinOvr === v ? 'selected' : ''}>Min OVR: ${v}+</option>`).join('')}
        </select>
      </div>
      <div style="overflow-x:auto;max-height:500px;overflow-y:auto;">
        <table>
          <thead><tr><th>Rol</th><th>Oyuncu</th><th>Kulüp</th><th>Yaş</th><th>OVR/POT</th><th>Kişilik</th><th>Piyasa Değeri</th><th>Maaş</th><th>İşlem</th></tr></thead>
          <tbody>
            ${filtered.slice(0, 90).map(p => {
              const club = p.teamId ? state.teams.find(t => t.id === p.teamId) : null;
              const tr = TRAITS[p.trait];
              return `
                <tr>
                  <td><span class="badge role-${p.role}">${p.role}</span></td>
                  <td><strong>${p.name}</strong> <span style="font-size:11px;color:var(--text-muted);">(${p.nat})</span></td>
                  <td>${club ? `<span class="team-tag" style="background:${club.color};color:${club.color2};">${club.tag}</span>` : '<span class="badge tier-A">SERBEST</span>'}</td>
                  <td>${p.age}</td>
                  <td><span class="ovr-pill ${ovrClass(p.ovr)}">${p.ovr}</span> <span style="font-size:11px;color:var(--text-muted);">/${p.pot}</span></td>
                  <td style="font-size:11.5px;">${tr ? `${tr.icon} ${tr.label}` : '-'}</td>
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

// ==================== LEAGUE, SWISS WORLDS, BRACKET & AWARDS ====================
function renderLeague() {
  const standings = getSortedStandings(state, ui.leagueRegion);
  const weekMatches = state.schedules[ui.leagueRegion]?.[Math.min(6, state.week - 1)] || [];

  const swissHtml = state.swiss ? `
    <div class="card" style="margin-bottom:16px;border-color:var(--gold);">
      <div class="card-header">
        <span class="card-title">🌍 WORLDS ${state.season} — 16 Takımlı İsviçre Aşaması (Tur ${state.swiss.round}/5)</span>
        <span class="badge tier-S">3 Galibiyet = Çeyrek Final • 3 Mağlubiyet = Elendi</span>
      </div>
      <div class="grid-2">
        <table>
          <thead><tr><th>Takım</th><th>Bölge</th><th>G-M</th><th>Durum</th></tr></thead>
          <tbody>
            ${[...state.swiss.teams].sort((a, b) => (b.wins - a.wins) || (a.losses - b.losses)).map(st => {
              const t = state.teams.find(x => x.id === st.teamId);
              const badge = st.status === 'QUALIFIED' ? '<span class="badge tier-S">ÇEYREK FİNAL</span>' : st.status === 'ELIMINATED' ? '<span class="badge tier-C">ELENDİ</span>' : '<span class="badge tier-A">DEVAM</span>';
              return `
                <tr class="${t.id === state.userTeamId ? 'highlight-row' : ''}">
                  <td><span class="team-tag" style="background:${t.color};color:${t.color2};margin-right:6px;">${t.tag}</span>${t.name}</td>
                  <td>${t.region}</td>
                  <td><b>${st.wins} - ${st.losses}</b></td>
                  <td>${badge}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <div>
          <div style="font-size:12px;font-weight:800;color:var(--gold-bright);margin-bottom:8px;">Tur ${state.swiss.round} Eşleşmeleri</div>
          ${state.swiss.currentMatches.map(m => {
            const bt = state.teams.find(t => t.id === m.blueId);
            const rt = state.teams.find(t => t.id === m.redId);
            return `
              <div class="bracket-match" style="display:flex;justify-content:space-between;align-items:center;">
                <span><span class="badge tier-B" style="margin-right:5px;">${m.recordLabel} • BO${m.bestOf}</span><b>${bt.tag}</b> vs <b>${rt.tag}</b></span>
                <strong style="color:var(--gold-bright);">${m.played ? `${m.blueScore}-${m.redScore}` : 'Bekliyor'}</strong>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  ` : '';

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
    ${swissHtml}
    ${bracketHtml}
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">
      ${REGIONS.map(r => `<button class="region-tab ${ui.leagueRegion === r.id ? 'active' : ''}" data-league-reg="${r.id}">${r.name}</button>`).join('')}
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title">${ui.leagueRegion} Puan Durumu</span><span style="font-size:11px;color:var(--text-muted);">İlk 4 Playoff</span></div>
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

      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="card">
          <div class="card-header"><span class="card-title">${ui.leagueRegion} Hafta ${Math.min(7, state.week)} Fikstürü</span></div>
          ${weekMatches.map(m => {
            const bt = state.teams.find(t => t.id === m.blueId);
            const rt = state.teams.find(t => t.id === m.redId);
            const riv = getRivalryName(m.blueId, m.redId);
            return `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(35,48,74,0.5);">
                <span style="flex:1;"><span class="team-tag" style="background:${bt.color};color:${bt.color2};margin-right:5px;">${bt.tag}</span>${bt.name}</span>
                <div style="text-align:center;padding:0 10px;">
                  <strong style="color:var(--gold-bright);">${m.played ? `${m.blueScore} - ${m.redScore}` : 'VS'}</strong>
                  ${riv ? `<div style="font-size:9.5px;color:#fca5a5;">🔥 Derbi</div>` : ''}
                </div>
                <span style="flex:1;text-align:right;">${rt.name}<span class="team-tag" style="background:${rt.color};color:${rt.color2};margin-left:5px;">${rt.tag}</span></span>
              </div>
            `;
          }).join('')}
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">🏅 Sezon Ödülleri & Şampiyonlar</span></div>
          ${state.awards.length === 0 && state.history.length === 0
            ? '<p style="font-size:12.5px;color:var(--text-muted);">Mevsimler tamamlandıkça MVP, All-Pro 1. Takım ve MSI/Worlds şampiyonları burada listelenecek.</p>'
            : `
              ${state.history.map(h => `<div style="padding:4px 0;font-size:12.5px;">🏆 <b>${h.event} ${h.season}:</b> ${h.winner} (${h.tag})</div>`).join('')}
              ${state.awards.map(a => `<div style="padding:6px 0;border-top:1px solid rgba(35,48,74,0.5);font-size:12px;">🏅 <b>${a.split} ${a.season}:</b> MVP: <b>${a.mvp}</b> • Çaylak: ${a.rookie}<div style="font-size:11px;color:var(--text-muted);">${a.allPro}</div></div>`).join('')}
            `}
        </div>
      </div>
    </div>
  `;
}

// ==================== CLUB & META ====================
function renderClub() {
  const team = state.teams.find(t => t.id === state.userTeamId);
  const wages = getTeamWeeklyWages(state, team.id);
  const streamerBonus = state.players.filter(p => p.teamId === team.id && p.trait === 'Streamer').length * 18000;
  const fanRev = team.fanbase * 950 + streamerBonus;
  const spRev = team.sponsor ? team.sponsor.weekly : 0;

  return `
    <div class="grid-3" style="margin-bottom:16px;">
      <div class="card"><div class="kpi-label">Mevcut Bütçe</div><div class="kpi-val" style="color:var(--green);">${formatMoney(team.budget)}</div></div>
      <div class="card"><div class="kpi-label">Haftalık Gelir (Sponsor + Taraftar + Yayın)</div><div class="kpi-val" style="color:var(--blue);">+${formatMoney(spRev + fanRev)}</div></div>
      <div class="card"><div class="kpi-label">Haftalık Maaş Gideri</div><div class="kpi-val" style="color:var(--red);">-${formatMoney(wages)}</div></div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title">🏗️ Kulüp Tesisleri</span></div>
        ${Object.entries(FACILITY_INFO).map(([key, info]) => {
          const lvl = team.facilities[key];
          const nextCost = lvl < 3 ? info.costs[lvl] : null;
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid rgba(35,48,74,0.5);gap:12px;">
              <div>
                <div style="font-weight:700;font-size:13.5px;">${info.name} <span class="badge tier-S">Sv. ${lvl}/3</span></div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${info.desc}</div>
              </div>
              <button class="btn-primary btn-sm" data-upgrade-fac="${key}" ${lvl >= 3 ? 'disabled' : ''}>${lvl >= 3 ? 'MAKS' : `Yükselt (${formatMoney(nextCost)})`}</button>
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
            <div style="padding:11px;border-radius:8px;margin-bottom:9px;background:${active ? 'rgba(200,155,60,0.12)' : 'var(--bg)'};border:1px solid ${active ? 'var(--gold)' : 'var(--border)'};">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong>${sp.name}</strong>
                ${active ? '<span class="badge tier-S">AKTİF</span>' : `<button class="btn-ghost btn-sm" data-pick-sponsor="${sp.id}" ${locked ? 'disabled' : ''}>${locked ? `Prestij ${sp.minPrestige}+` : 'Anlaş'}</button>`}
              </div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">${sp.desc}</div>
              <div style="font-size:12px;margin-top:5px;">Haftalık: <b style="color:var(--green);">${formatMoney(sp.weekly)}</b> • Primi: <b style="color:var(--gold-bright);">${formatMoney(sp.bonus)}</b></div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

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
        <span class="badge tier-S">Güçlenenler: ${patch.buffedClasses.join(', ')}</span>
        ${patch.nerfedClasses.length ? `<span class="badge tier-C">Zayıflayanlar: ${patch.nerfedClasses.join(', ')}</span>` : ''}
      </div>
    </div>
    <div class="grid-3">
      ${ROLES.map(role => {
        const list = CHAMPIONS.filter(c => c.roles.includes(role)).sort((a, b) => ({ S: 3, A: 2, B: 1, C: 0 }[getChampionMetaTier(b, patch)] - { S: 3, A: 2, B: 1, C: 0 }[getChampionMetaTier(a, patch)]));
        return `
          <div class="card">
            <div class="card-header"><span class="badge role-${role}">${role}</span><span class="card-title">Meta Sıralaması</span></div>
            ${list.map(c => `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid rgba(35,48,74,0.4);font-size:12.5px;"><span><b>${c.name}</b> <span style="font-size:11px;color:var(--text-muted);">(${c.classTag})</span></span><span class="badge tier-${getChampionMetaTier(c, patch)}">${getChampionMetaTier(c, patch)}</span></div>`).join('')}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ==================== MODALS (NEGOTIATION & DRAMA EVENT) ====================
function renderNegotiationModal() {
  if (!ui.negotiatingPlayerId) return '';
  const p = state.players.find(x => x.id === ui.negotiatingPlayerId);
  if (!p) return '';
  const club = p.teamId ? state.teams.find(t => t.id === p.teamId) : null;
  const suggestedBuyout = club ? Math.round(p.marketValue * (p.isStarter ? 1.2 : 0.9)) : 0;
  const suggestedSalary = Math.round(p.salary * 1.1);

  return `
    <div class="modal-backdrop">
      <div class="modal-box modal-sm">
        <div class="card-header">
          <span class="card-title">✍️ Transfer & Sözleşme Pazarlığı</span>
          <button class="btn-ghost btn-sm" id="btnCloseNego">✕</button>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <div>
            <span class="badge role-${p.role}">${p.role}</span> <strong style="font-size:17px;">${p.name}</strong>
            <div style="font-size:12px;color:var(--text-muted);margin-top:3px;">${club ? `Kulüp: ${club.name}` : 'Serbest'} • Yaş ${p.age} • ${TRAITS[p.trait]?.icon || ''} ${TRAITS[p.trait]?.label || p.trait}</div>
          </div>
          <span class="ovr-pill ${ovrClass(p.ovr)}" style="font-size:16px;padding:5px 10px;">${p.ovr}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
          ${club ? `<div><label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">Bonservis Teklifi (Piyasa: ${formatMoney(p.marketValue)})</label><input type="number" id="negoBuyout" value="${suggestedBuyout}" step="25000" style="width:100%;" /></div>` : `<input type="hidden" id="negoBuyout" value="0" />`}
          <div><label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">Haftalık Maaş (Mevcut: ${formatMoney(p.salary)})</label><input type="number" id="negoSalary" value="${suggestedSalary}" step="1000" style="width:100%;" /></div>
          <div><label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">Süre</label><select id="negoYears" style="width:100%;"><option value="1">1 Yıl</option><option value="2" selected>2 Yıl</option><option value="3">3 Yıl</option></select></div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button class="btn-ghost" id="btnCancelNego">İptal</button>
          <button class="btn-primary" id="btnSubmitNego">Teklifi Gönder →</button>
        </div>
      </div>
    </div>
  `;
}

function renderDramaModal() {
  if (!state?.pendingEvent) return '';
  const ev = state.pendingEvent;
  return `
    <div class="modal-backdrop">
      <div class="modal-box modal-sm" style="border-color:var(--gold);">
        <div class="card-header"><span class="card-title">${ev.title}</span><span class="badge tier-S">KARAR ANİ</span></div>
        <p style="font-size:13.5px;line-height:1.55;margin-bottom:16px;">${ev.desc}</p>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${ev.choices.map(c => `<button class="btn-ghost" data-drama-choice="${c.idx}" style="text-align:left;padding:11px 14px;font-size:13px;">▸ ${c.label}</button>`).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderSaveLoadModal() {
  if (!ui.saveModalOpen) return '';
  const slots = listSaveSlots();
  const curTeam = state ? state.teams.find(t => t.id === state.userTeamId) : null;
  const defaultName = ui.saveNameDraft || (curTeam ? `${curTeam.name} S${state.season}` : '');

  return `
    <div class="modal-backdrop">
      <div class="modal-box" style="max-width:740px;">
        <div class="card-header">
          <div>
            <span class="card-title" style="font-size:16px;">💾 Kayıt & Yükleme Yöneticisi (Save / Load)</span>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Farklı kariyerlerini ayrı slotlara kaydedebilir, istediğin zaman yükleyebilir veya .json olarak yedekleyebilirsin.</div>
          </div>
          <button class="btn-ghost btn-sm" id="btnCloseSaveModal">✕ Kapat</button>
        </div>

        ${state ? `
          <div style="display:flex;gap:10px;align-items:center;margin-bottom:14px;flex-wrap:wrap;background:var(--bg);padding:10px 12px;border-radius:8px;border:1px solid var(--border);">
            <span style="font-size:12px;color:var(--text-muted);">Kayıt Adı:</span>
            <input type="text" id="saveNameInput" value="${defaultName}" placeholder="Örn: T1 Hanedanlık, SuperMassive Worlds..." style="flex:1;min-width:200px;" />
            <button class="btn-ghost btn-sm" id="btnExportCurrent">⬇ .JSON İndir</button>
            <label class="btn-ghost btn-sm" style="cursor:pointer;display:inline-flex;align-items:center;">
              ⬆ .JSON Yükle
              <input type="file" id="importSaveFile" accept=".json" style="display:none;" />
            </label>
          </div>
        ` : `
          <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
            <label class="btn-ghost btn-sm" style="cursor:pointer;display:inline-flex;align-items:center;">
              ⬆ Bilgisayardan .JSON Kayıt Yükle
              <input type="file" id="importSaveFile" accept=".json" style="display:none;" />
            </label>
          </div>
        `}

        <div style="display:flex;flex-direction:column;gap:9px;">
          ${slots.map(s => {
            const r = s.record;
            return `
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;padding:12px 14px;background:var(--bg-card);border:1px solid ${r ? 'var(--border)' : 'rgba(35,48,74,0.45)'};border-radius:9px;">
                <div style="display:flex;align-items:center;gap:12px;">
                  ${r ? `<span class="team-tag" style="background:${r.teamColor};color:${r.teamColor2};font-size:13px;padding:6px 9px;">${r.teamTag}</span>` : `<span class="badge tier-B">BOŞ</span>`}
                  <div>
                    <div style="font-weight:800;font-size:14px;color:${r ? 'var(--gold-bright)' : 'var(--text-muted)'};">
                      ${s.label} ${r ? `— ${r.name}` : '(Boş Slot)'}
                    </div>
                    ${r ? `
                      <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">
                        ${r.teamName} (${r.region}) • Sezon ${r.season} ${r.phaseLabel} (H${r.week}) • OVR ${r.ovr} • ${formatMoney(r.budget)}
                      </div>
                      <div style="font-size:10.5px;color:#64748b;">Kaydedildi: ${r.savedAt}</div>
                    ` : `<div style="font-size:11.5px;color:#64748b;">Bu slota mevcut kariyerini kaydedebilirsin.</div>`}
                  </div>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                  ${state ? `<button class="btn-primary btn-sm" data-save-slot="${s.slotId}">${r ? '💾 Üzerine Yaz' : '💾 Kaydet'}</button>` : ''}
                  ${r ? `<button class="btn-blue btn-sm" data-load-slot="${s.slotId}">▶ Yükle</button>` : ''}
                  ${r ? `<button class="btn-danger btn-sm" data-del-slot="${s.slotId}">🗑</button>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
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
    ['transfers', '🔍 Transfer & Scouting', state.incomingOffers.length],
    ['league', '🏆 7 Lig & Worlds'],
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
          <button class="nav-item" id="btnSideMayhem" style="margin-top:8px;color:var(--gold-bright);border:1px dashed rgba(200,155,60,0.4);">
            <span>🔥 Worlds Mayhem</span>
          </button>
        </nav>
        <div class="sidebar-footer">
          <button class="btn-ghost btn-sm" id="btnToggleFearless">${state.fearlessEnabled ? '🔥 Fearless Draft: AÇIK' : 'Fearless Draft: KAPALI'}</button>
          <button class="btn-primary btn-sm" id="btnOpenSaveManager">💾 Kaydet / Yükle (Slotlar)</button>
          <button class="btn-ghost btn-sm" id="btnMainMenu">↩ Ana Menü</button>
        </div>
      </aside>

      <div class="main-area">
        <header class="topbar">
          <div class="topbar-meta">
            <div class="meta-chip">📅 <b>S${state.season}</b> • ${getPhaseLabel(state.phase)} (H${state.week})</div>
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
    ${renderDramaModal()}
  `;
}

function render() {
  root.innerHTML = (state ? renderAppShell() : renderStartScreen()) + renderSaveLoadModal() + (ui.toastMsg ? `<div class="toast">${ui.toastMsg}</div>` : '');
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
  root.querySelector('#btnStartMayhem')?.addEventListener('click', openWorldsMayhemModal);
  root.querySelector('#btnSideMayhem')?.addEventListener('click', openWorldsMayhemModal);

  // Save / Load Manager Modal Events
  root.querySelector('#btnOpenSaveManager')?.addEventListener('click', () => {
    ui.saveNameDraft = '';
    ui.saveModalOpen = true;
    render();
  });
  root.querySelector('#btnCloseSaveModal')?.addEventListener('click', () => {
    ui.saveModalOpen = false;
    render();
  });
  root.querySelector('#saveNameInput')?.addEventListener('input', (e) => {
    ui.saveNameDraft = e.target.value;
  });
  root.querySelectorAll('[data-save-slot]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!state) return;
      const nameInput = root.querySelector('#saveNameInput')?.value || '';
      const ok = saveToSlot(state, btn.dataset.saveSlot, nameInput);
      render();
      showToast(ok ? `Kariyer "${btn.dataset.saveSlot}" slotuna kaydedildi!` : 'Kayıt başarısız oldu.');
    });
  });
  root.querySelectorAll('[data-load-slot]').forEach(btn => {
    btn.addEventListener('click', () => {
      const loaded = loadFromSlot(btn.dataset.loadSlot);
      if (loaded) {
        state = loaded;
        ui.leagueRegion = state.teams.find(t => t.id === state.userTeamId)?.region || 'LCK';
        ui.tab = 'dashboard';
        ui.saveModalOpen = false;
        render();
        showToast('Kayıtlı kariyer başarıyla yüklendi!');
      }
    });
  });
  root.querySelectorAll('[data-del-slot]').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteSaveSlot(btn.dataset.delSlot);
      render();
      showToast('Kayıt slotu silindi.');
    });
  });
  root.querySelector('#btnExportCurrent')?.addEventListener('click', () => {
    if (!state) return;
    const team = state.teams.find(t => t.id === state.userTeamId);
    const copy = { ...state, pendingEvent: null };
    const blob = new Blob([JSON.stringify(copy, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lol-manager-${team?.tag || 'save'}-S${state.season}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Kariyer .json dosyası olarak indirildi!');
  });
  root.querySelector('#importSaveFile')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || !parsed.userTeamId || !Array.isArray(parsed.teams)) {
          showToast('Geçersiz kayıt dosyası!');
          return;
        }
        state = parsed;
        ui.leagueRegion = state.teams.find(t => t.id === state.userTeamId)?.region || 'LCK';
        ui.tab = 'dashboard';
        ui.saveModalOpen = false;
        saveGame(state);
        render();
        showToast('Kariyer dosyası başarıyla içe aktarıldı!');
      } catch (err) {
        showToast('JSON dosyası okunamadı.');
      }
    };
    reader.readAsText(file);
  });

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

  root.querySelectorAll('[data-nav]').forEach(btn => btn.addEventListener('click', () => { ui.tab = btn.dataset.nav; render(); }));
  root.querySelector('#btnToggleFearless')?.addEventListener('click', () => {
    state.fearlessEnabled = !state.fearlessEnabled;
    saveGame(state); render();
    showToast(`Fearless Draft ${state.fearlessEnabled ? 'AÇILDI' : 'KAPATILDI'}.`);
  });
  root.querySelector('#btnSaveGame')?.addEventListener('click', () => { saveGame(state); showToast('Kariyer kaydedildi!'); });
  root.querySelector('#btnMainMenu')?.addEventListener('click', () => { saveGame(state); state = null; render(); });

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

  // Drama Modal Choices
  root.querySelectorAll('[data-drama-choice]').forEach(btn => {
    btn.addEventListener('click', () => {
      resolveDramaEvent(state, Number(btn.dataset.dramaChoice));
      saveGame(state);
      render();
      showToast('Kararın uygulandı!');
    });
  });

  // Incoming AI Offers
  root.querySelectorAll('[data-offer-accept]').forEach(btn => {
    btn.addEventListener('click', () => {
      const res = respondIncomingOffer(state, btn.dataset.offerAccept, true);
      saveGame(state); render(); showToast(res.reason);
    });
  });
  root.querySelectorAll('[data-offer-reject]').forEach(btn => {
    btn.addEventListener('click', () => {
      const res = respondIncomingOffer(state, btn.dataset.offerReject, false);
      saveGame(state); render(); showToast(res.reason);
    });
  });

  // Inbox
  root.querySelectorAll('[data-open-msg]').forEach(el => el.addEventListener('click', () => { ui.selectedInboxId = el.dataset.openMsg; ui.tab = 'inbox'; render(); }));
  root.querySelectorAll('[data-select-inbox]').forEach(el => el.addEventListener('click', () => { ui.selectedInboxId = el.dataset.selectInbox; render(); }));

  // Roster & Tactics
  const uTeam = state.teams.find(t => t.id === state.userTeamId);
  root.querySelectorAll('[data-set-starter]').forEach(btn => btn.addEventListener('click', () => { setStarter(state, btn.dataset.setStarter); saveGame(state); render(); showToast('İlk 5 güncellendi.'); }));
  root.querySelectorAll('[data-release-player]').forEach(btn => btn.addEventListener('click', () => { const res = releasePlayer(state, btn.dataset.releasePlayer); saveGame(state); render(); showToast(res.reason); }));
  root.querySelectorAll('[data-set-training]').forEach(el => el.addEventListener('click', () => { uTeam.trainingFocus = el.dataset.setTraining; saveGame(state); render(); showToast('Antrenman güncellendi.'); }));
  root.querySelectorAll('[data-def-plan]').forEach(b => b.addEventListener('click', () => { uTeam.tactics.gameplan = b.dataset.defPlan; render(); }));
  root.querySelectorAll('[data-def-lane]').forEach(b => b.addEventListener('click', () => { uTeam.tactics.laneFocus = b.dataset.defLane; render(); }));
  root.querySelectorAll('[data-def-obj]').forEach(b => b.addEventListener('click', () => { uTeam.tactics.objective = b.dataset.defObj; render(); }));
  root.querySelectorAll('[data-def-top]').forEach(b => b.addEventListener('click', () => { uTeam.tactics.topStyle = b.dataset.defTop; render(); }));
  root.querySelectorAll('[data-def-sup]').forEach(b => b.addEventListener('click', () => { uTeam.tactics.supStyle = b.dataset.defSup; render(); }));
  root.querySelectorAll('[data-def-adc]').forEach(b => b.addEventListener('click', () => { uTeam.tactics.adcStyle = b.dataset.defAdc; render(); }));

  root.querySelector('#btnPlayScrim')?.addEventListener('click', () => {
    const res = playWeeklyScrim(state, root.querySelector('#scrimSelect').value);
    saveGame(state); render(); showToast(res.ok ? res.text : res.reason);
  });

  // Transfers & Challenger Scouting
  root.querySelectorAll('[data-tr-sub]').forEach(b => b.addEventListener('click', () => { ui.transferSubTab = b.dataset.trSub; render(); }));
  root.querySelectorAll('[data-scout-chal]').forEach(b => b.addEventListener('click', () => {
    const res = scoutChallengerProspect(state, b.dataset.scoutChal);
    saveGame(state); render(); showToast(res.reason);
  }));
  root.querySelectorAll('[data-sign-chal]').forEach(b => b.addEventListener('click', () => {
    const res = signChallengerProspect(state, b.dataset.signChal);
    saveGame(state); render(); showToast(res.reason);
  }));

  const trSearch = root.querySelector('#trSearch');
  if (trSearch) {
    trSearch.addEventListener('input', e => {
      ui.transferSearch = e.target.value; render();
      const again = root.querySelector('#trSearch');
      if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
    });
  }
  root.querySelector('#trRole')?.addEventListener('change', e => { ui.transferRole = e.target.value; render(); });
  root.querySelector('#trStatus')?.addEventListener('change', e => { ui.transferStatus = e.target.value; render(); });
  root.querySelector('#trMinOvr')?.addEventListener('change', e => { ui.transferMinOvr = Number(e.target.value); render(); });
  root.querySelector('#btnPromoteAcademy')?.addEventListener('click', () => {
    const res = promoteAcademyPlayer(state, root.querySelector('#academyRoleSelect').value);
    saveGame(state); render();
    showToast(res.ok ? `Akademiden ${res.player.name} (${res.player.role}, OVR ${res.player.ovr}) yükseldi!` : res.reason);
  });
  root.querySelectorAll('[data-open-nego]').forEach(btn => btn.addEventListener('click', () => { ui.negotiatingPlayerId = btn.dataset.openNego; render(); }));
  root.querySelector('#btnCloseNego')?.addEventListener('click', () => { ui.negotiatingPlayerId = null; render(); });
  root.querySelector('#btnCancelNego')?.addEventListener('click', () => { ui.negotiatingPlayerId = null; render(); });
  root.querySelector('#btnSubmitNego')?.addEventListener('click', () => {
    const res = attemptSignOrTransfer(state, ui.negotiatingPlayerId, Number(root.querySelector('#negoBuyout').value) || 0, Number(root.querySelector('#negoSalary').value) || 0, Number(root.querySelector('#negoYears').value) || 2);
    if (res.ok) ui.negotiatingPlayerId = null;
    saveGame(state); render(); showToast(res.reason);
  });

  // League & Club
  root.querySelectorAll('[data-league-reg]').forEach(b => b.addEventListener('click', () => { ui.leagueRegion = b.dataset.leagueReg; render(); }));
  root.querySelectorAll('[data-upgrade-fac]').forEach(b => b.addEventListener('click', () => { const res = upgradeFacility(state, b.dataset.upgradeFac); saveGame(state); render(); showToast(res.reason); }));
  root.querySelectorAll('[data-pick-sponsor]').forEach(b => b.addEventListener('click', () => {
    const sp = SPONSORS.find(s => s.id === b.dataset.pickSponsor);
    if (sp) { uTeam.sponsor = sp; saveGame(state); render(); showToast(`${sp.name} ile anlaşıldı!`); }
  }));
}

render();

// LoL Esports Manager v2.1 — Pro Broadcast & Football Manager UI Shell (Zero Emojis, Crisp SVG Icons)
import { CHAMPIONS, CHAMPION_MAP, getChampionMetaTier } from '../data/champions.js';
import { ROLES, REGIONS, TRAITS, getRivalryName, createInitialDatabase } from '../data/teamsAndPlayers.js';
import {
  SPONSORS, FACILITY_INFO, STAFF_INFO, TRAINING_MODES, TRAINING_INTENSITIES,
  createNewCareer, getCurrentPatch, getPhaseLabel, getTeamRoster, getTeamOVR, getTeamDuoSynergy, ensureTeamExtras,
  getTeamWeeklyWages, getSortedStandings, getUserNextMatch, quickSimSeries,
  advanceWeekOrRound, attemptSignOrTransfer, evaluateTransferInterest, getTransferWindowStatus, setStarter, releasePlayer, renewContract,
  getRenewalDemand, negotiateContractRenewal, setPlayerIndividualTraining, upgradeStaff, getLeagueStatLeaders,
  getBoardConfidence, getTransferRoomOpportunities, resignFromClub, acceptJobOffer, dismissManagerJobOffer,
  promoteAcademyPlayer, playWeeklyScrim, upgradeFacility, formatMoney,
  scoutChallengerProspect, signChallengerProspect, respondIncomingOffer,
  resolveDramaEvent, saveGame, listSaveSlots, saveToSlot, loadFromSlot, deleteSaveSlot,
  ensureCalendarState, formatTurkishDate, getWeekCalendarDays, isMatchDay, advanceOneDay, skipToNextKeyDay
} from '../engine/gameEngine.js';
import { openSeriesModal } from './matchModal.js';
import { openWorldsMayhemModal } from './mayhemModal.js';
import { icon } from './icons.js';

const root = document.getElementById('app');

let state = null;
let ui = {
  startRegion: 'LCK',
  managerName: localStorage.getItem('lol_mgr_nickname') || '',
  tab: 'dashboard',
  leagueRegion: 'LCK',
  leagueFixtureWeek: 'CURRENT',
  selectedArchiveIdx: 0,
  transferSubTab: 'market',
  transferRole: 'ALL',
  transferStatus: 'ALL',
  transferSearch: '',
  transferMinOvr: 72,
  negotiatingPlayerId: null,
  renewingPlayerId: null,
  trainingPlayerId: null,
  selectedInboxId: null,
  saveModalOpen: false,
  saveNameDraft: '',
  guideModalOpen: false,
  globalSearch: '',
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
  const autoRec = slots.find(s => s.slotId === 'autosave')?.record;
  const regTeams = previewDB.teams.filter(t => t.region === ui.startRegion);

  return `
    <div class="start-screen">
      <div class="start-header">
        <div style="display:flex;align-items:center;gap:14px;">
          <img src="./assets/icon.jpg" alt="LoL Esports Manager" style="width:52px;height:52px;border-radius:12px;border:1px solid rgba(200,155,60,0.45);box-shadow:0 4px 16px rgba(0,0,0,0.45);object-fit:cover;" />
          <div>
            <div class="brand-title"><span>LOL ESPORTS <span class="brand-accent">MANAGER</span></span></div>
            <div class="brand-sub">7 Bölge (LCK, LPL, LEC, LCS, TCL, CBLOL, LCO) • Fearless Draft • Worlds 2026 • Wonderkid Scouting</div>
          </div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn-blue" id="btnStartMayhem" style="padding:10px 16px;">${icon('flame', 15)} Worlds Mayhem</button>
          <button class="btn-ghost" id="btnOpenSaveManager" style="padding:10px 16px;">${icon('save', 15)} Kayıt Slotları (${filledCount})</button>
        </div>
      </div>

      <div style="max-width:1260px;margin:0 auto 20px;display:grid;grid-template-columns:${autoRec ? '1fr 1fr' : '1fr'};gap:14px;" class="start-bar-grid">
        <div class="card" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:13px 16px;">
          <div style="font-size:12px;font-weight:700;color:var(--gold-bright);text-transform:uppercase;letter-spacing:0.5px;">Koç Adı / Nickname</div>
          <input type="text" id="managerNameInput" value="${ui.managerName}" placeholder="Adın veya Nickname (Örn: Limbi, KkOma)..." style="flex:1;min-width:180px;" maxlength="24" />
        </div>

        ${autoRec ? `
          <div class="card" style="border-color:rgba(200,155,60,0.5);background:linear-gradient(135deg, rgba(200,155,60,0.1), var(--bg-card));display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:13px 16px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span class="team-tag" style="background:${autoRec.teamColor};color:${autoRec.teamColor2};">${autoRec.teamTag}</span>
              <div>
                <div style="font-size:13px;font-weight:800;color:var(--gold-bright);">Kaldığın Yerden Devam Et (${autoRec.managerName || 'Koç'})</div>
                <div class="num" style="font-size:11.5px;color:var(--text-muted);">${autoRec.teamName} • S${autoRec.season} ${autoRec.phaseLabel} (H${autoRec.week}) • ${autoRec.savedAt}</div>
              </div>
            </div>
            <button class="btn-primary btn-sm" id="btnQuickResume">${icon('play', 13)} Devam Et</button>
          </div>
        ` : ''}
      </div>

      <div class="region-tabs">
        ${REGIONS.map(r => `
          <button class="region-tab ${ui.startRegion === r.id ? 'active' : ''}" data-start-region="${r.id}">
            <span class="region-dot" style="background:${r.color};"></span> ${r.name} <span style="font-size:10px;opacity:0.75;">(BO${r.splitBestOf} • ${r.worldsSlots}W)</span>
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
                    <div style="font-weight:800;font-size:14.5px;">${team.name}</div>
                    <div class="num" style="font-size:11px;color:var(--text-muted);">Prestij ${team.prestige} • Bütçe ${formatMoney(team.budget)}</div>
                  </div>
                </div>
                <span class="ovr-pill ${ovrClass(avgOvr)}">${avgOvr}</span>
              </div>
              <div class="club-roster-mini">
                ${ROLES.map(role => {
                  const p = roster.find(x => x.role === role);
                  return `
                    <div class="club-roster-row">
                      <span><span class="badge role-${role}" style="margin-right:6px;">${role}</span><b style="color:var(--text);">${p?.name || '-'}</b></span>
                      <span class="num">${p?.ovr || '-'} <span style="font-size:10px;color:var(--text-dim);">/ ${p?.pot || '-'}</span></span>
                    </div>
                  `;
                }).join('')}
              </div>
              <button class="btn-primary" data-pick-club="${team.id}" style="margin-top:auto;">Bu Takımı Yönet ${icon('arrowRight', 14)}</button>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ==================== DASHBOARD ====================
function renderDashboard() {
  ensureCalendarState(state);
  const team = state.teams.find(t => t.id === state.userTeamId);
  const ovr = getTeamOVR(state, team.id);
  const patch = getCurrentPatch(state);
  const nextMatch = getUserNextMatch(state);
  const matchToday = isMatchDay(state);
  const calDays = getWeekCalendarDays(state);
  const standings = getSortedStandings(state, team.region);
  const userRank = standings.findIndex(r => r.teamId === team.id) + 1;
  const wages = getTeamWeeklyWages(state, team.id);
  const streamerBonus = state.players.filter(p => p.teamId === team.id && p.trait === 'Streamer').length * 18000;
  const netWeekly = (team.sponsor?.weekly || 35000) + team.fanbase * 950 + streamerBonus - wages;

  const offersBanner = state.incomingOffers?.length ? `
    <div class="card" style="margin-bottom:16px;border-color:rgba(16,185,129,0.45);background:var(--green-soft);">
      <div class="card-header" style="margin-bottom:8px;">
        <span class="card-title" style="color:var(--green);">${icon('briefcase', 14)} Gelen Transfer Teklifleri (${state.incomingOffers.length})</span>
      </div>
      ${state.incomingOffers.map(o => `
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;padding:6px 0;">
          <span style="font-size:13px;"><b>${o.buyerName} (${o.buyerTag})</b>, <b>${o.playerName}</b> (${o.playerRole}, OVR ${o.playerOvr}) için <b class="num" style="color:var(--green);">${formatMoney(o.amount)}</b> teklif etti.</span>
          <div style="display:flex;gap:6px;">
            <button class="btn-green btn-sm" data-offer-accept="${o.id}">${icon('check', 13)} Kabul Et</button>
            <button class="btn-danger btn-sm" data-offer-reject="${o.id}">${icon('x', 13)} Reddet</button>
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
      <div class="card" style="border-color:rgba(200,155,60,0.5);background:linear-gradient(135deg, rgba(200,155,60,0.08), var(--bg-card));">
        <div class="card-header">
          <span class="card-title">${icon('sword', 14)} Sıradaki Karşılaşma — ${getPhaseLabel(state.phase)} (BO${nextMatch.bestOf})</span>
          <div style="display:flex;gap:6px;">
            ${rivalry ? `<span class="badge tier-C">${rivalry}</span>` : ''}
            ${state.fearlessEnabled ? `<span class="badge tier-S">${icon('lock', 10)} FEARLESS</span>` : ''}
            <span class="badge tier-A">Hafta ${state.week}</span>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <span class="team-tag" style="background:${team.color};color:${team.color2};font-size:13px;padding:7px 11px;">${team.tag}</span>
            <div>
              <div style="font-weight:800;font-size:16px;">${team.name}</div>
              <div class="num" style="font-size:12px;color:var(--text-muted);">OVR ${ovr} • Sinerji %${Math.round(team.synergy)}</div>
            </div>
          </div>
          <div style="font-size:17px;font-weight:900;color:var(--gold-bright);letter-spacing:1.5px;">VS</div>
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="text-align:right;">
              <div style="font-weight:800;font-size:16px;">${opp.name}</div>
              <div class="num" style="font-size:12px;color:var(--text-muted);">OVR ${oppOvr} • ${opp.region}</div>
            </div>
            <span class="team-tag" style="background:${opp.color};color:${opp.color2};font-size:13px;padding:7px 11px;">${opp.tag}</span>
          </div>
        </div>
        <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;">
          ${matchToday ? `
            <button class="btn-primary" id="btnPlayMatchLive">${icon('play', 14)} Draft & Canlı Maça Gir</button>
            <button class="btn-ghost" id="btnQuickSimMatch">${icon('fast', 14)} Hızlı Simüle Et</button>
          ` : `
            <button class="btn-primary" id="btnDashAdvanceDay">${icon('arrowRight', 14)} Devam Et (+1 Gün)</button>
            <button class="btn-blue" id="btnDashSkipMatchDay">${icon('fast', 14)} Maç Gününe Atla</button>
            <span style="font-size:12px;color:var(--text-muted);align-self:center;">Maç Cumartesi günü oynanacak — hafta içi antrenman ve scrim yapabilirsin.</span>
          `}
        </div>
      </div>
    `;
  } else {
    nextMatchHtml = `
      <div class="card" style="border-color:rgba(56,189,248,0.4);">
        <div class="card-header"><span class="card-title">${icon('calendar', 14)} Takvim Durumu</span></div>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">
          ${state.phase === 'OFFSEASON'
            ? 'Sezon arası transfer dönemindesin. Kadronu güçlendirip yeni sezona başlayabilirsin.'
            : 'Bu turda oynayacağın maç tamamlandı veya takımın bu turnuvada yer almıyor. Haftayı/Turu ilerletebilirsin.'}
        </p>
        <button class="btn-primary" id="btnAdvanceCal">
          ${state.phase === 'OFFSEASON' ? `Sezon ${state.season + 1}'e Başla` : 'Sonraki Hafta / Tura İlerle'} ${icon('arrowRight', 14)}
        </button>
      </div>
    `;
  }

  const calStripHtml = `
    <div class="cal-strip">
      ${calDays.map(d => `
        <div class="cal-day ${d.isToday ? 'today' : ''} ${d.isPast ? 'past' : ''} ${d.eventType === 'match' ? 'match-day' : ''}">
          <div class="cal-day-top">
            <span>${d.dayShort}</span>
            <span>${d.isToday ? 'BUGÜN' : d.monthShort}</span>
          </div>
          <div class="cal-day-num">${d.dayNum}</div>
          <div class="cal-day-ev">${d.eventLabel}</div>
        </div>
      `).join('')}
    </div>
  `;

  const jobOffersBanner = state.managerJobOffers?.length ? `
    <div class="card" style="margin-bottom:16px;border-color:rgba(200,155,60,0.65);background:linear-gradient(135deg, rgba(200,155,60,0.12), var(--bg-card));">
      <div class="card-header" style="margin-bottom:8px;">
        <span class="card-title">${icon('trophy', 14)} Başarılı Sezon Sonrası Sana Gelen Koçluk Teklifleri (${state.managerJobOffers.length})</span>
      </div>
      <div class="grid-3" style="gap:10px;">
        ${state.managerJobOffers.map(o => `
          <div style="background:var(--bg);border:1px solid var(--border-strong);border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:6px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span><span class="team-tag" style="background:${o.color};color:${o.color2};margin-right:6px;">${o.tag}</span><b>${o.name}</b></span>
              <span class="ovr-pill ${ovrClass(o.ovr)}" style="font-size:11.5px;">${o.ovr}</span>
            </div>
            <div class="num" style="font-size:11.5px;color:var(--text-muted);">${o.region} • Prestij ${o.prestige} • ${formatMoney(o.budget)}</div>
            <div style="display:flex;gap:6px;margin-top:4px;">
              <button class="btn-primary btn-sm" style="flex:1;" data-accept-job="${o.teamId}">Kabul Et</button>
              <button class="btn-ghost btn-sm" data-dismiss-job="${o.teamId}">Reddet</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  return `
    ${calStripHtml}
    ${jobOffersBanner}
    ${offersBanner}
    <div class="grid-4" style="margin-bottom:16px;">
      <div class="card kpi-card">
        <div class="kpi-label">Takım Gücü (İlk 5 OVR)</div>
        <div class="kpi-val" style="color:var(--gold-bright);">${ovr} <span style="font-size:12.5px;color:var(--text-muted);font-weight:600;">Sinerji %${Math.round(team.synergy)}</span></div>
      </div>
      <div class="card kpi-card">
        <div class="kpi-label">${team.region} Sıralama & Yönetim</div>
        <div class="kpi-val">#${userRank} <span style="font-size:12.5px;color:var(--gold-bright);font-weight:700;">• Güven: ${getBoardConfidence(state).grade} (${getBoardConfidence(state).score}%)</span></div>
      </div>
      <div class="card kpi-card">
        <div class="kpi-label">Kulüp Bütçesi</div>
        <div class="kpi-val" style="color:${team.budget >= 0 ? 'var(--green)' : 'var(--red)'};">${formatMoney(team.budget)}</div>
      </div>
      <div class="card kpi-card">
        <div class="kpi-label">Haftalık Net Nakit Akışı</div>
        <div class="kpi-val" style="color:${netWeekly >= 0 ? 'var(--green)' : 'var(--red)'};">${netWeekly >= 0 ? '+' : ''}${formatMoney(netWeekly)}</div>
      </div>
    </div>

    <div style="margin-bottom:16px;">${nextMatchHtml}</div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <span class="card-title">${icon('trophy', 14)} ${team.region} Puan Durumu</span>
          <button class="btn-ghost btn-sm" data-nav="league">7 Lig & Worlds ${icon('arrowRight', 12)}</button>
        </div>
        <table>
          <thead><tr><th>#</th><th>Takım</th><th>G-M</th><th>Oyun</th><th>OVR</th></tr></thead>
          <tbody>
            ${standings.map((r, idx) => {
              const t = state.teams.find(x => x.id === r.teamId);
              return `
                <tr class="${t.id === team.id ? 'highlight-row' : ''}">
                  <td style="color:${idx < 4 ? 'var(--green)' : 'var(--text-muted)'};font-weight:700;">${idx + 1}</td>
                  <td><span class="team-tag" style="background:${t.color};color:${t.color2};margin-right:7px;">${t.tag}</span>${t.name}</td>
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
            <span class="card-title">${icon('sliders', 14)} Aktif Yama ${patch.version}</span>
            <button class="btn-ghost btn-sm" data-nav="meta">Meta Rehberi ${icon('arrowRight', 12)}</button>
          </div>
          <div style="font-weight:700;color:var(--text);margin-bottom:4px;">${patch.name}</div>
          <p style="font-size:12.5px;color:var(--text-muted);margin-bottom:8px;">${patch.desc}</p>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <span class="badge tier-S">Buff: ${patch.buffedClasses.join(', ')}</span>
            ${patch.nerfedClasses.length ? `<span class="badge tier-C">Nerf: ${patch.nerfedClasses.join(', ')}</span>` : ''}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">${icon('inbox', 14)} Son Mesajlar</span>
            <button class="btn-ghost btn-sm" data-nav="inbox">Tümü ${icon('arrowRight', 12)}</button>
          </div>
          ${state.inbox.slice(0, 4).map(msg => `
            <div style="padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer;" data-open-msg="${msg.id}">
              <div style="display:flex;justify-content:space-between;font-size:12.5px;gap:8px;">
                <strong style="color:${msg.read ? 'var(--text-muted)' : 'var(--gold-bright)'};">${msg.read ? '' : '[YENİ] '}${msg.title}</strong>
                <span style="font-size:11px;color:var(--text-dim);white-space:nowrap;">${msg.sender}</span>
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
    <div class="grid-2" style="grid-template-columns: 350px 1fr;">
      <div class="card" style="max-height:75vh;overflow-y:auto;">
        <div class="card-header"><span class="card-title">${icon('inbox', 14)} Gelen Kutusu (${state.inbox.length})</span></div>
        ${state.inbox.map(m => `
          <div data-select-inbox="${m.id}" style="padding:10px;border-radius:7px;margin-bottom:6px;cursor:pointer;background:${selected?.id === m.id ? 'var(--bg-hover)' : 'var(--bg)'};border:1px solid ${selected?.id === m.id ? 'var(--gold)' : 'var(--border)'};">
            <div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--text-dim);text-transform:uppercase;">
              <span>${m.sender}</span><span>${m.category}</span>
            </div>
            <div style="font-size:12.5px;font-weight:${m.read ? '600' : '800'};color:${m.read ? 'var(--text)' : 'var(--gold-bright)'};margin-top:3px;">${m.title}</div>
          </div>
        `).join('')}
      </div>
      <div class="card">
        ${selected ? `
          <div class="card-header">
            <div>
              <div style="font-size:17px;font-weight:800;color:var(--gold-bright);">${selected.title}</div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:3px;">Gönderen: ${selected.sender} • ${selected.date}</div>
            </div>
            <span class="badge tier-A">${selected.category}</span>
          </div>
          <p style="font-size:13.5px;line-height:1.65;color:var(--text);">${selected.body}</p>
        ` : '<p style="color:var(--text-muted);">Mesaj yok.</p>'}
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
        <span class="card-title">${icon('target', 14)} Kadro Planlayıcı & Kontrat Risk Radarı</span>
        <span style="font-size:11.5px;color:var(--text-muted);">Her rolün derinliğini ve biten kontratları tek bakışta yönet</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:10px;">
        ${ROLES.map(role => {
          const rolePlayers = myPlayers.filter(p => p.role === role);
          const starter = rolePlayers.find(p => p.isStarter) || rolePlayers[0];
          const subs = rolePlayers.filter(p => p.id !== starter?.id);
          const expiring = starter && starter.contractYears <= 1;
          return `
            <div style="background:var(--bg);border:1px solid ${expiring ? 'rgba(245,158,11,0.5)' : 'var(--border)'};border-radius:8px;padding:10px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span class="badge role-${role}">${role}</span>
                <span class="ovr-pill ${ovrClass(starter?.ovr || 70)}" style="font-size:11.5px;">${starter?.ovr || '-'}</span>
              </div>
              <div style="font-weight:800;font-size:13px;">${starter?.name || 'Eksik!'}</div>
              <div style="font-size:11px;color:${expiring ? 'var(--amber)' : 'var(--text-muted)'};margin-top:2px;">
                ${expiring ? 'Kontrat Riski (≤1 yıl)' : `Kontrat: ${starter?.contractYears || 0} yıl`}
              </div>
              <div style="font-size:11px;color:${subs.length ? 'var(--green)' : 'var(--text-dim)'};margin-top:2px;">
                ${subs.length ? `Yedek: ${subs[0].name} (${subs[0].ovr})` : 'Yedek Yok'}
              </div>
              <button class="btn-ghost btn-sm" data-planner-search="${role}" style="width:100%;margin-top:8px;font-size:11px;">Transferde Ara ${icon('arrowRight', 11)}</button>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <div class="card-header">
        <span class="card-title">${icon('users', 14)} Kadro, Kişilikler & Özellikler (${myPlayers.length} Oyuncu)</span>
        <span class="num" style="font-size:12px;color:var(--text-muted);">Haftalık Maaş: <b style="color:var(--text);">${formatMoney(getTeamWeeklyWages(state, team.id))}</b> • Sinerji: <b style="color:var(--text);">%${Math.round(team.synergy)}</b></span>
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
                    ${tr ? `<span class="badge tier-A" title="${tr.desc}" style="margin-left:4px;">${tr.label}</span>` : ''}
                    ${p.importWeeksLeft > 0 ? `<span class="badge tier-C" title="Dil bariyeri adaptasyon süresi" style="margin-left:4px;">${icon('globe', 10)} Uyum ${p.importWeeksLeft}h</span>` : ''}
                    ${(p.injuredWeeks || 0) > 0 ? `<span class="badge tier-C" title="Aşırı yorgunluk/bilek zorlanması (-4.5 maç puanı)" style="margin-left:4px;background:var(--red-soft);color:#fda4af;">Sakat ${p.injuredWeeks}h</span>` : ''}
                    <div style="font-size:10.5px;color:var(--text-dim);margin-top:2px;">
                      İmza: ${p.sigChamps.slice(0, 4).map(id => CHAMPION_MAP[id]?.name).join(', ')}
                      ${p.learningChampId ? ` • <span style="color:var(--blue);">Öğreniyor: ${CHAMPION_MAP[p.learningChampId]?.name || p.learningChampId} (%${p.learningProgress || 0})</span>` : ''}
                      ${p.indFocus ? ` • <span style="color:var(--gold-bright);">Odak: ${p.indFocus.toUpperCase()}</span>` : ''}
                    </div>
                  </td>
                  <td>${p.age}</td>
                  <td><span class="ovr-pill ${ovrClass(p.ovr)}">${p.ovr}</span> <span style="font-size:11px;color:var(--text-dim);">/${p.pot}</span></td>
                  <td>${p.attrs.mechanics}</td><td>${p.attrs.laning}</td><td>${p.attrs.macro}</td><td>${p.attrs.teamfight}</td><td>${p.attrs.clutch}</td><td>${p.attrs.pool}</td>
                  <td style="font-size:11px;">
                    <div>M:${p.morale} ${barHtml(p.morale, '#10b981')}</div>
                    <div>F:${p.form} ${barHtml(p.form, '#38bdf8')}</div>
                    <div>Y:${p.fatigue} ${barHtml(p.fatigue, p.fatigue > 65 ? '#f43f5e' : '#f59e0b')}</div>
                  </td>
                  <td style="font-size:12px;">${formatMoney(p.salary)}<br><span style="color:${p.contractYears <= 1 ? 'var(--amber)' : 'var(--text-dim)'};">${p.contractYears <= 0 ? 'Bitti!' : `${p.contractYears} yıl`}</span></td>
                  <td>
                    <div style="display:flex;gap:4px;flex-wrap:wrap;">
                      ${!p.isStarter ? `<button class="btn-blue btn-sm" data-set-starter="${p.id}">İlk 5</button>` : ''}
                      <button class="btn-ghost btn-sm" data-open-plan="${p.id}" title="Bireysel Antrenman & Şampiyon Öğrenme">Plan</button>
                      ${p.contractYears <= 1 ? `<button class="btn-green btn-sm" data-open-renew="${p.id}">Pazarlık</button>` : ''}
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
        <div class="card-header"><span class="card-title">${icon('target', 14)} Haftalık Antrenman & Yoğunluk</span></div>
        <div style="margin-bottom:10px;">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">Antrenman Yoğunluğu (Burnout / Gelişim Dengesi)</div>
          <div class="tactic-btn-group">
            ${TRAINING_INTENSITIES.map(ti => `<button class="tactic-btn ${(team.trainingIntensity || 'normal') === ti.id ? 'active' : ''}" data-set-intensity="${ti.id}" title="${ti.desc}">${ti.name}</button>`).join('')}
          </div>
        </div>
        ${TRAINING_MODES.map(tm => `
          <div data-set-training="${tm.id}" style="padding:8px 10px;border-radius:7px;margin-bottom:6px;cursor:pointer;background:${team.trainingFocus === tm.id ? 'var(--gold-soft)' : 'var(--bg)'};border:1px solid ${team.trainingFocus === tm.id ? 'var(--gold)' : 'var(--border)'};">
            <div style="font-size:12.5px;font-weight:700;color:${team.trainingFocus === tm.id ? 'var(--gold-bright)' : 'var(--text)'};">${tm.name}</div>
            <div style="font-size:11px;color:var(--text-muted);">${tm.desc}</div>
          </div>
        `).join('')}
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">${icon('sliders', 14)} Varsayılan Takım & Rol Taktikleri</span></div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">Oyun Planı</div>
        <div class="tactic-btn-group" style="margin-bottom:9px;">
          ${[['aggressive', 'Erken Baskı'], ['balanced', 'Dengeli'], ['scaling', 'Scaling'], ['split', 'Split']].map(([k, lbl]) =>
            `<button class="tactic-btn ${team.tactics.gameplan === k ? 'active' : ''}" data-def-plan="${k}">${lbl}</button>`
          ).join('')}
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">Ormancı Odak & Objektif</div>
        <div class="tactic-btn-group" style="margin-bottom:9px;">
          ${['TOP', 'MID', 'BOT'].map(l => `<button class="tactic-btn ${team.tactics.laneFocus === l ? 'active' : ''}" data-def-lane="${l}">${l}</button>`).join('')}
          ${[['dragon', 'Ejder'], ['baron', 'Baron'], ['towers', 'Kule']].map(([k, lbl]) => `<button class="tactic-btn ${team.tactics.objective === k ? 'active' : ''}" data-def-obj="${k}">${lbl}</button>`).join('')}
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">Rol Mikro Emirleri</div>
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
        <div class="tactic-btn-group" style="margin-bottom:9px;">
          ${[['aggressive', 'ADC: Agresif'], ['balanced', 'Dengeli'], ['safe', 'Güvenli']].map(([k, lbl]) =>
            `<button class="tactic-btn ${(team.tactics.adcStyle || 'balanced') === k ? 'active' : ''}" data-def-adc="${k}">${lbl}</button>`
          ).join('')}
        </div>
        <div style="font-size:11px;color:var(--green);font-weight:700;margin-bottom:4px;">Öndeyken Strateji (+1.5k Altın)</div>
        <div class="tactic-btn-group" style="margin-bottom:7px;">
          ${[['choke', 'Harita Boğma'], ['split131', '1-3-1 Split'], ['dive', 'Agresif Dive']].map(([k, lbl]) =>
            `<button class="tactic-btn ${(team.tactics.aheadPlan || 'choke') === k ? 'active' : ''}" data-def-ahead="${k}">${lbl}</button>`
          ).join('')}
        </div>
        <div style="font-size:11px;color:var(--red);font-weight:700;margin-bottom:4px;">Gerideyken Strateji (-1.5k Altın)</div>
        <div class="tactic-btn-group">
          ${[['scale', 'Scaling Bekle'], ['pick', 'Pusu & Pick'], ['crossmap', 'Cross-Map Takas']].map(([k, lbl]) =>
            `<button class="tactic-btn ${(team.tactics.behindPlan || 'scale') === k ? 'active' : ''}" data-def-behind="${k}">${lbl}</button>`
          ).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">${icon('sword', 14)} Scrim & İkili Sinerji</span></div>
        ${(() => {
          const duo = getTeamDuoSynergy(team, getTeamRoster(state, team.id));
          return `
            <div style="background:var(--bg);border:1px solid var(--border);border-radius:7px;padding:9px;margin-bottom:10px;font-size:11.5px;">
              <div style="font-weight:800;color:var(--gold-bright);margin-bottom:5px;">İkili Sinerji (Maç İçi Bonus)</div>
              <div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span><b>JGL+MID:</b> ${duo.jglMid.names}</span><span class="badge tier-A">${duo.jglMid.label} (${duo.jglMid.score}/30)</span></div>
              <div style="display:flex;justify-content:space-between;"><span><b>BOT+SUP:</b> ${duo.botSup.names}</span><span class="badge tier-A">${duo.botSup.label} (${duo.botSup.score}/30)</span></div>
            </div>
          `;
        })()}
        <p style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">
          Scrim yaparak sinerji (+2/+4), ikili uyum ve rakibin gizli <b>Taktik İstihbaratını (+1.2)</b> açabilirsin.
        </p>
        <select id="scrimSelect" style="width:100%;margin-bottom:10px;">
          ${scrimOpponents.map(o => `<option value="${o.id}">[${o.region}] ${o.name} (OVR ${getTeamOVR(state, o.id)})</option>`).join('')}
        </select>
        <button class="btn-blue" id="btnPlayScrim" style="width:100%;" ${state.scrimDoneThisWeek ? 'disabled' : ''}>
          ${state.scrimDoneThisWeek ? `${icon('check', 13)} Bu Haftanın Scrim'i Yapıldı` : `${icon('sword', 13)} Scrim Maçı Yap`}
        </button>
        ${Object.keys(state.scrimIntel || {}).length ? `
          <div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border);font-size:11px;">
            <div style="font-weight:700;color:var(--blue);margin-bottom:4px;">Aktif Rakip İstihbaratları:</div>
            ${Object.values(state.scrimIntel).slice(-4).map(it => `<div style="color:var(--text-muted);margin-bottom:2px;">• <b>${it.oppTag}</b>: ${it.gameplan} (Odak: ${it.laneFocus})</div>`).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// ==================== TRANSFERS, CHALLENGER SCOUTING & OFFERS ====================
function renderTransfers() {
  const team = state.teams.find(t => t.id === state.userTeamId);
  ensureTeamExtras(team);
  const scoutCostNum = (team.facilities.analystDesk >= 3 || team.staff.headScout >= 3) ? 0 : (team.staff.headScout >= 2 ? 7500 : 15000);
  const scoutCost = scoutCostNum === 0 ? 'Ücretsiz (Sv.3)' : formatMoney(scoutCostNum);
  const winSt = getTransferWindowStatus(state);

  const windowBanner = `
    <div class="card" style="margin-bottom:14px;padding:11px 14px;border-color:${winSt.open ? 'rgba(16,185,129,0.45)' : 'rgba(244,63,94,0.45)'};background:${winSt.open ? 'var(--green-soft)' : 'var(--red-soft)'};display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span class="badge ${winSt.open ? 'tier-A' : 'tier-C'}">${winSt.open ? 'AÇIK' : `${icon('lock', 10)} KİLİTLİ`}</span>
        <strong style="font-size:13px;">${winSt.label}</strong>
      </div>
      <span style="font-size:12px;color:var(--text-muted);">${winSt.detail}</span>
    </div>
  `;

  const subTabs = `
    ${windowBanner}
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">
      <button class="region-tab ${ui.transferSubTab === 'market' ? 'active' : ''}" data-tr-sub="market">${icon('globe', 14)} Transfer Pazarı</button>
      <button class="region-tab ${ui.transferSubTab === 'challenger' ? 'active' : ''}" data-tr-sub="challenger">${icon('star', 14)} SoloQ Challenger Scouting (${state.challengerPool.length})</button>
      <button class="region-tab ${ui.transferSubTab === 'offers' ? 'active' : ''}" data-tr-sub="offers">${icon('briefcase', 14)} Gelen Teklifler (${state.incomingOffers.length})</button>
      <button class="region-tab ${ui.transferSubTab === 'feed' ? 'active' : ''}" data-tr-sub="feed">${icon('inbox', 14)} AI Transfer Haberleri (${(state.transferFeed || []).length})</button>
    </div>
  `;

  if (ui.transferSubTab === 'challenger') {
    return `
      ${subTabs}
      <div class="card">
        <div class="card-header">
          <span class="card-title">${icon('star', 14)} SoloQ Challenger Sıralaması — Wonderkid Scouting</span>
          <span class="num" style="font-size:12px;color:var(--text-muted);">Scout Maliyeti: <b style="color:var(--text);">${scoutCost}</b> • Bütçe: <b style="color:var(--green);">${formatMoney(team.budget)}</b></span>
        </div>
        <p style="font-size:12.5px;color:var(--text-muted);margin-bottom:12px;">
          16-18 yaşındaki Challenger yeteneklerinin gerçek potansiyeli ve kişiliği gizlidir (<b>?</b>). Scout göndererek gerçek potansiyelini açığa çıkar ve ucuza imzala.
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
                <td>${p.scouted ? `<span class="ovr-pill ${ovrClass(p.pot)}">${p.pot}</span>` : '<span class="badge tier-B">GİZLİ (?)</span>'}</td>
                <td>${p.scouted ? (TRAITS[p.trait]?.label || p.trait) : '<span style="color:var(--text-dim);">?</span>'}</td>
                <td>${formatMoney(p.signingFee)}</td>
                <td>
                  <div style="display:flex;gap:6px;">
                    ${!p.scouted ? `<button class="btn-blue btn-sm" data-scout-chal="${p.id}">${icon('search', 12)} Scout (${scoutCostNum === 0 ? 'Ücretsiz' : formatMoney(scoutCostNum)})</button>` : ''}
                    <button class="btn-green btn-sm" data-sign-chal="${p.id}" ${winSt.open ? '' : 'disabled'}>${winSt.open ? 'İmzala' : 'Kilitli'}</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  if (ui.transferSubTab === 'feed') {
    const feed = state.transferFeed || [];
    return `
      ${subTabs}
      <div class="card">
        <div class="card-header"><span class="card-title">${icon('inbox', 14)} Canlı AI Transfer Akışı (Dünya Geneli)</span></div>
        ${feed.length === 0
          ? '<p style="font-size:13px;color:var(--text-muted);">Transfer pencereleri açıldıkça ve sezon aralarında diğer kulüplerin yaptığı büyük transfer hamleleri burada listelenecek.</p>'
          : feed.map(f => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--bg);border:1px solid var(--border);border-radius:8px;margin-bottom:7px;flex-wrap:wrap;gap:8px;">
              <div>
                <span class="team-tag" style="background:${f.buyerColor};color:${f.buyerColor2};margin-right:6px;">${f.buyerTag}</span>
                <span class="badge role-${f.role}">${f.role}</span> <strong>${f.playerName}</strong> <span class="ovr-pill ${ovrClass(f.ovr)}" style="font-size:11px;">${f.ovr}</span>
                <span style="font-size:12px;color:var(--text-muted);margin-left:6px;">← ${f.fromTag === 'FA' ? 'Serbest Oyuncu' : f.fromTag}</span>
              </div>
              <div class="num" style="font-size:12px;color:var(--text-muted);">
                ${f.fee ? `<b style="color:var(--green);">${formatMoney(f.fee)}</b> • ` : '<b style="color:var(--blue);">Bedelsiz</b> • '}S${f.season} ${f.phase}
              </div>
            </div>
          `).join('')}
      </div>
    `;
  }

  if (ui.transferSubTab === 'offers') {
    return `
      ${subTabs}
      <div class="card">
        <div class="card-header"><span class="card-title">${icon('briefcase', 14)} Oyuncularına Gelen AI Transfer Teklifleri</span></div>
        ${state.incomingOffers.length === 0
          ? '<p style="font-size:13px;color:var(--text-muted);">Şu an aktif gelen bir transfer teklifi yok. Haftalar ilerledikçe rakip kulüpler yıldız oyuncularına teklif sunacaktır.</p>'
          : state.incomingOffers.map(o => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--bg);border:1px solid var(--border);border-radius:8px;margin-bottom:8px;">
              <div>
                <strong>${o.buyerName} (${o.buyerTag})</strong> → <span class="badge role-${o.playerRole}">${o.playerRole}</span> <b>${o.playerName}</b> (OVR ${o.playerOvr})
                <div class="num" style="font-size:12.5px;color:var(--green);margin-top:3px;">Bonservis Teklifi: <b>${formatMoney(o.amount)}</b></div>
              </div>
              <div style="display:flex;gap:8px;">
                <button class="btn-green btn-sm" data-offer-accept="${o.id}">${icon('check', 13)} Kabul Et</button>
                <button class="btn-danger btn-sm" data-offer-reject="${o.id}">${icon('x', 13)} Reddet</button>
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

  const trOpps = getTransferRoomOpportunities(state);
  return `
    ${subTabs}
    ${trOpps.length ? `
      <div class="card" style="margin-bottom:14px;border-color:rgba(56,189,248,0.35);">
        <div class="card-header" style="margin-bottom:8px;">
          <span class="card-title" style="color:var(--blue);">${icon('star', 14)} TransferRoom — Piyasa Fırsatları (İndirimli)</span>
          <span style="font-size:11px;color:var(--text-muted);">Kontratı bitmek üzere veya mutsuz yıldızlar</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:8px;">
          ${trOpps.map(o => `
            <div style="background:var(--bg);border:1px solid var(--border);border-radius:7px;padding:9px;display:flex;justify-content:space-between;align-items:center;gap:8px;">
              <div>
                <div><span class="badge role-${o.player.role}">${o.player.role}</span> <b>${o.player.name}</b> <span class="ovr-pill ${ovrClass(o.player.ovr)}" style="font-size:11px;">${o.player.ovr}</span></div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${o.club?.tag} • ${o.reason} • <b style="color:var(--green);">${formatMoney(o.discountPrice)}</b></div>
              </div>
              <button class="btn-blue btn-sm" data-open-nego="${o.player.id}" ${winSt.open ? '' : 'disabled'}>${winSt.open ? 'Teklif' : 'Kilitli'}</button>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
    <div class="card" style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
      <div>
        <div class="card-title">${icon('users', 14)} Gençlik Akademisi (Sv. ${team.facilities.youthAcademy})</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Her mevsim akademinden bir genç yeteneği ücretsiz olarak A takıma yükseltebilirsin.</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <select id="academyRoleSelect">${ROLES.map(r => `<option value="${r}">${r}</option>`).join('')}</select>
        <button class="btn-green" id="btnPromoteAcademy" ${state.academyPromotedThisSplit ? 'disabled' : ''}>
          ${state.academyPromotedThisSplit ? `${icon('check', 13)} Bu Mevsim Kullanıldı` : '+ Akademiden Yükselt'}
        </button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">${icon('search', 14)} Küresel Transfer Pazarı (${filtered.length} Oyuncu)</span>
        <span class="num" style="font-size:13px;color:var(--green);font-weight:700;">Bütçe: ${formatMoney(team.budget)}</span>
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
          <thead><tr><th>Rol</th><th>Oyuncu</th><th>Kulüp</th><th>Yaş</th><th>OVR/POT</th><th>İlgi</th><th>Piyasa Değeri</th><th>Maaş</th><th>İşlem</th></tr></thead>
          <tbody>
            ${filtered.slice(0, 90).map(p => {
              const club = p.teamId ? state.teams.find(t => t.id === p.teamId) : null;
              const intr = evaluateTransferInterest(state, p, team);
              const intrBadge = intr.level === 'HIGH' ? 'tier-A' : intr.level === 'HARD' ? 'tier-S' : 'tier-C';
              return `
                <tr>
                  <td><span class="badge role-${p.role}">${p.role}</span></td>
                  <td><strong>${p.name}</strong> <span style="font-size:11px;color:var(--text-muted);">(${p.nat})</span></td>
                  <td>${club ? `<span class="team-tag" style="background:${club.color};color:${club.color2};">${club.tag}</span>` : '<span class="badge tier-A">SERBEST</span>'}</td>
                  <td>${p.age}</td>
                  <td><span class="ovr-pill ${ovrClass(p.ovr)}">${p.ovr}</span> <span style="font-size:11px;color:var(--text-dim);">/${p.pot}</span></td>
                  <td><span class="badge ${intrBadge}" title="${intr.reason}">${intr.label}</span></td>
                  <td>${club ? formatMoney(p.marketValue) : '<span style="color:var(--green);">Ücretsiz</span>'}</td>
                  <td>${formatMoney(p.salary)}/hf</td>
                  <td><button class="btn-primary btn-sm" data-open-nego="${p.id}" ${winSt.open ? '' : 'disabled'}>${winSt.open ? (club ? 'Teklif Yap' : 'İmza At') : 'Kilitli'}</button></td>
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
  ensureCalendarState(state);
  const standings = getSortedStandings(state, ui.leagueRegion);
  const allWeeks = state.schedules[ui.leagueRegion] || [];
  const activeWeekNum = ui.leagueFixtureWeek === 'CURRENT' ? Math.min(7, state.week) : ui.leagueFixtureWeek;
  const fixtureWeeksToShow = activeWeekNum === 'ALL'
    ? allWeeks.map((ms, idx) => ({ week: idx + 1, matches: ms }))
    : [{ week: Number(activeWeekNum), matches: allWeeks[Number(activeWeekNum) - 1] || [] }];

  const archiveList = state.tournamentArchive || [];
  const selectedArch = archiveList[ui.selectedArchiveIdx] || archiveList[0] || null;

  const swissHtml = state.swiss ? `
    <div class="card" style="margin-bottom:16px;border-color:rgba(200,155,60,0.5);">
      <div class="card-header">
        <span class="card-title">${icon('globe', 14)} WORLDS ${state.season} — 16 Takımlı İsviçre Aşaması (Tur ${state.swiss.round}/5)</span>
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
          <div style="font-size:12px;font-weight:800;color:var(--gold-bright);margin-bottom:8px;">Tur ${state.swiss.round} Eşleşmeleri (Aktif)</div>
          ${state.swiss.currentMatches.map(m => {
            const bt = state.teams.find(t => t.id === m.blueId);
            const rt = state.teams.find(t => t.id === m.redId);
            return `
              <div class="bracket-match" style="display:flex;justify-content:space-between;align-items:center;">
                <span><span class="badge tier-B" style="margin-right:5px;">${m.recordLabel} • BO${m.bestOf}</span><b>${bt.tag}</b> vs <b>${rt.tag}</b></span>
                <strong class="num" style="color:var(--gold-bright);">${m.played ? `${m.blueScore}-${m.redScore}` : 'Bekliyor'}</strong>
              </div>
            `;
          }).join('')}
          ${(state.swiss.pastRounds || []).length ? `
            <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border);max-height:240px;overflow-y:auto;">
              <div style="font-size:11.5px;font-weight:800;color:var(--text-muted);margin-bottom:6px;">Önceki Turlar</div>
              ${[...state.swiss.pastRounds].reverse().map(pr => `
                <div style="margin-bottom:8px;">
                  <div style="font-size:11px;font-weight:700;color:var(--blue);margin-bottom:4px;">Tur ${pr.round}</div>
                  ${pr.matches.map(m => {
                    const bt = state.teams.find(t => t.id === m.blueId);
                    const rt = state.teams.find(t => t.id === m.redId);
                    return `<div class="num" style="display:flex;justify-content:space-between;font-size:11.5px;padding:3px 6px;background:var(--bg);border-radius:4px;margin-bottom:3px;"><span><span style="color:var(--text-dim);">[${m.recordLabel}]</span> <b>${bt?.tag}</b> vs <b>${rt?.tag}</b></span><b style="color:var(--gold-bright);">${m.blueScore}-${m.redScore}</b></div>`;
                  }).join('')}
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  ` : '';

  const bracketHtml = state.bracket ? `
    <div class="card" style="margin-bottom:16px;border-color:rgba(200,155,60,0.5);">
      <div class="card-header">
        <span class="card-title">${icon('trophy', 14)} Aktif Turnuva: ${state.bracket.title}</span>
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
                  ${m.region ? `<div style="font-size:10px;color:var(--text-dim);margin-bottom:3px;font-weight:700;">${m.region}</div>` : ''}
                  <div class="bracket-row ${m.winnerId === bt.id ? 'winner' : ''}">
                    <span><span class="team-tag" style="background:${bt.color};color:${bt.color2};margin-right:6px;">${bt.tag}</span>${bt.name}</span>
                    <b class="num">${m.played ? m.blueScore : '-'}</b>
                  </div>
                  <div class="bracket-row ${m.winnerId === rt.id ? 'winner' : ''}">
                    <span><span class="team-tag" style="background:${rt.color};color:${rt.color2};margin-right:6px;">${rt.tag}</span>${rt.name}</span>
                    <b class="num">${m.played ? m.redScore : '-'}</b>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  const archiveHtml = archiveList.length ? `
    <div class="card" style="margin-bottom:16px;border-color:rgba(56,189,248,0.35);">
      <div class="card-header" style="flex-wrap:wrap;gap:8px;">
        <span class="card-title" style="color:var(--blue);">${icon('trophy', 14)} Tamamlanan Turnuva Eşleşmeleri & Arşiv (${archiveList.length})</span>
        <select id="archiveSelect" style="max-width:340px;">
          ${archiveList.map((a, idx) => `<option value="${idx}" ${idx === (ui.selectedArchiveIdx || 0) ? 'selected' : ''}>${a.title}</option>`).join('')}
        </select>
      </div>
      ${selectedArch ? `
        <div class="bracket-grid">
          ${selectedArch.rounds.map(r => `
            <div>
              <div style="font-size:12px;font-weight:800;color:var(--gold-bright);margin-bottom:8px;">${r.name}</div>
              ${r.matches.map(m => {
                const bt = state.teams.find(t => t.id === m.blueId);
                const rt = state.teams.find(t => t.id === m.redId);
                return `
                  <div class="bracket-match">
                    ${m.region ? `<div style="font-size:10px;color:var(--text-dim);margin-bottom:3px;font-weight:700;">${m.region}</div>` : m.recordLabel ? `<div style="font-size:10px;color:var(--text-dim);margin-bottom:3px;font-weight:700;">${m.recordLabel} • BO${m.bestOf || 3}</div>` : ''}
                    <div class="bracket-row ${m.winnerId === bt?.id ? 'winner' : ''}">
                      <span><span class="team-tag" style="background:${bt?.color || '#334155'};color:${bt?.color2 || '#fff'};margin-right:6px;">${bt?.tag || '?'}</span>${bt?.name || '?'}</span>
                      <b class="num">${m.played ? m.blueScore : '-'}</b>
                    </div>
                    <div class="bracket-row ${m.winnerId === rt?.id ? 'winner' : ''}">
                      <span><span class="team-tag" style="background:${rt?.color || '#334155'};color:${rt?.color2 || '#fff'};margin-right:6px;">${rt?.tag || '?'}</span>${rt?.name || '?'}</span>
                      <b class="num">${m.played ? m.redScore : '-'}</b>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  ` : '';

  return `
    ${swissHtml}
    ${bracketHtml}
    ${archiveHtml}
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">
      ${REGIONS.map(r => `<button class="region-tab ${ui.leagueRegion === r.id ? 'active' : ''}" data-league-reg="${r.id}"><span class="region-dot" style="background:${r.color};"></span> ${r.name}</button>`).join('')}
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <span class="card-title">${icon('trophy', 14)} ${ui.leagueRegion} Puan Durumu</span>
          <span style="font-size:11px;color:var(--text-muted);">
            Lig: <b>BO${REGIONS.find(r => r.id === ui.leagueRegion)?.splitBestOf || 3}</b> • Worlds Slotu: <b>${REGIONS.find(r => r.id === ui.leagueRegion)?.worldsSlots || 1} Takım</b>
          </span>
        </div>
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
                  <td style="font-size:11.5px;color:var(--gold-bright);font-weight:700;">${t.trophies.length ? `${t.trophies.length} Kupa` : '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="card">
          <div class="card-header" style="flex-wrap:wrap;gap:8px;">
            <span class="card-title">${icon('calendar', 14)} ${ui.leagueRegion} Fikstür & Tüm Maçlar</span>
            <div class="tactic-btn-group">
              ${[1, 2, 3, 4, 5, 6, 7].map(w => `<button class="tactic-btn ${activeWeekNum === w ? 'active' : ''}" data-fix-week="${w}">H${w}</button>`).join('')}
              <button class="tactic-btn ${activeWeekNum === 'ALL' ? 'active' : ''}" data-fix-week="ALL">Tümü</button>
            </div>
          </div>
          <div style="max-height:360px;overflow-y:auto;">
            ${fixtureWeeksToShow.map(fw => `
              ${activeWeekNum === 'ALL' ? `<div style="font-size:11px;font-weight:800;color:var(--gold-bright);padding:6px 0 3px;margin-top:4px;border-bottom:1px solid var(--border-strong);">HAFTA ${fw.week}</div>` : ''}
              ${fw.matches.map(m => {
                const bt = state.teams.find(t => t.id === m.blueId);
                const rt = state.teams.find(t => t.id === m.redId);
                const riv = getRivalryName(m.blueId, m.redId);
                const isMine = m.blueId === state.userTeamId || m.redId === state.userTeamId;
                return `
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 6px;border-bottom:1px solid var(--border);${isMine ? 'background:var(--gold-soft);border-radius:5px;' : ''}">
                    <span style="flex:1;${m.winnerId === bt.id ? 'font-weight:800;color:var(--text);' : ''}"><span class="team-tag" style="background:${bt.color};color:${bt.color2};margin-right:5px;">${bt.tag}</span>${bt.name}</span>
                    <div style="text-align:center;padding:0 10px;">
                      <strong class="num" style="color:var(--gold-bright);">${m.played ? `${m.blueScore} - ${m.redScore}` : 'VS'}</strong>
                      ${riv ? `<div style="font-size:9.5px;color:#fda4af;font-weight:700;text-transform:uppercase;">Derbi</div>` : ''}
                    </div>
                    <span style="flex:1;text-align:right;${m.winnerId === rt.id ? 'font-weight:800;color:var(--text);' : ''}">${rt.name}<span class="team-tag" style="background:${rt.color};color:${rt.color2};margin-left:5px;">${rt.tag}</span></span>
                  </div>
                `;
              }).join('')}
            `).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">${icon('target', 14)} ${ui.leagueRegion} Sezon İstatistik Liderleri</span></div>
          ${(() => {
            const ld = getLeagueStatLeaders(state, ui.leagueRegion);
            if (ld.byKda.length === 0) return '<p style="font-size:12px;color:var(--text-muted);">Maçlar oynandıkça KDA ve MVP liderleri burada listelenecek.</p>';
            return `
              <div class="grid-2" style="gap:10px;">
                <div>
                  <div style="font-size:11px;font-weight:800;color:var(--gold-bright);margin-bottom:5px;">EN YÜKSEK KDA</div>
                  ${ld.byKda.map((p, i) => `<div class="num" style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-bottom:1px solid var(--border);"><span>${i + 1}. <b>${p.name}</b> <span style="color:var(--text-dim);">(${p.teamTag})</span></span><b style="color:var(--blue);">${p.kda}</b></div>`).join('')}
                </div>
                <div>
                  <div style="font-size:11px;font-weight:800;color:var(--gold-bright);margin-bottom:5px;">MVP LİDERLERİ</div>
                  ${ld.byMvp.map((p, i) => `<div class="num" style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-bottom:1px solid var(--border);"><span>${i + 1}. <b>${p.name}</b> <span style="color:var(--text-dim);">(${p.teamTag})</span></span><b style="color:var(--gold-bright);">${p.stats.mvps} MVP</b></div>`).join('')}
                </div>
              </div>
            `;
          })()}
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">${icon('star', 14)} Sezon Ödülleri, Rekorlar & Hall of Fame</span></div>
          ${(() => {
            ensureCalendarState(state);
            const rec = state.records;
            return `
              <div style="display:flex;gap:12px;flex-wrap:wrap;padding:7px 9px;background:var(--bg);border:1px solid var(--border);border-radius:7px;margin-bottom:8px;font-size:11.5px;">
                <span>Kariyer: <b style="color:var(--green);">${rec.careerWins}G</b> - <b style="color:var(--red);">${rec.careerLosses}M</b></span>
                <span>Aktif Seri: <b style="color:var(--blue);">${rec.currentStreak}G</b></span>
                <span>En Uzun Seri: <b style="color:var(--gold-bright);">${rec.bestStreak}G</b></span>
              </div>
              ${rec.hallOfFame.length ? `
                <div style="margin-bottom:8px;font-size:11.5px;">
                  <div style="font-weight:800;color:var(--gold-bright);margin-bottom:3px;">HALL OF FAME (WORLDS EFSANELERİ)</div>
                  ${rec.hallOfFame.slice(0, 5).map(h => `<div style="padding:2px 0;"><b>${h.name}</b> (${h.role} • ${h.tag}) — ${h.note}${h.titles > 1 ? ` (${h.titles}x)` : ''}</div>`).join('')}
                </div>
              ` : ''}
            `;
          })()}
          ${state.awards.length === 0 && state.history.length === 0
            ? '<p style="font-size:12.5px;color:var(--text-muted);">Mevsimler tamamlandıkça MVP, All-Pro 1. Takım ve MSI/Worlds şampiyonları burada listelenecek.</p>'
            : `
              ${state.history.map(h => `<div style="padding:4px 0;font-size:12.5px;"><b style="color:var(--gold-bright);">${h.event} ${h.season}:</b> ${h.winner} (${h.tag})${h.mvp ? ` • <span style="color:var(--text-muted);">MVP: ${h.mvp}</span>` : ''}</div>`).join('')}
              ${state.awards.map(a => `<div style="padding:6px 0;border-top:1px solid var(--border);font-size:12px;"><b>${a.split} ${a.season}:</b> MVP: <b style="color:var(--gold-bright);">${a.mvp}</b> • Çaylak: ${a.rookie}<div style="font-size:11px;color:var(--text-muted);">${a.allPro}</div></div>`).join('')}
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
      <div class="card kpi-card"><div class="kpi-label">Mevcut Bütçe</div><div class="kpi-val" style="color:var(--green);">${formatMoney(team.budget)}</div></div>
      <div class="card kpi-card"><div class="kpi-label">Haftalık Gelir (Sponsor + Taraftar + Yayın)</div><div class="kpi-val" style="color:var(--blue);">+${formatMoney(spRev + fanRev)}</div></div>
      <div class="card kpi-card"><div class="kpi-label">Haftalık Maaş Gideri</div><div class="kpi-val" style="color:var(--red);">-${formatMoney(wages)}</div></div>
    </div>
    <div class="card" style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
      <div>
        <div style="font-weight:800;font-size:13.5px;">Yönetim Kurulu Güveni: <span style="color:var(--gold-bright);">${getBoardConfidence(state).grade} (%${getBoardConfidence(state).score})</span></div>
        <div style="font-size:12px;color:var(--text-muted);">Güven puanın %45'in altına düşerse önce ültimatom alırsın, toparlayamazsan görevine son verilir.</div>
      </div>
      <button class="btn-danger btn-sm" id="btnResignClub">İstifa Et & Kulüp Değiştir</button>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title">${icon('shield', 14)} Kulüp Tesisleri</span></div>
        ${Object.entries(FACILITY_INFO).map(([key, info]) => {
          const lvl = team.facilities[key];
          const nextCost = lvl < 3 ? info.costs[lvl] : null;
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid var(--border);gap:12px;">
              <div>
                <div style="font-weight:700;font-size:13.5px;">${info.name} <span class="badge tier-S">Sv. ${lvl}/3</span></div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${info.desc}</div>
              </div>
              <button class="btn-primary btn-sm" data-upgrade-fac="${key}" ${lvl >= 3 ? 'disabled' : ''}>${lvl >= 3 ? 'MAKS' : `Yükselt (${formatMoney(nextCost)})`}</button>
            </div>
          `;
        }).join('')}
        <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border);">
          <div class="card-header" style="margin-bottom:6px;padding-bottom:6px;"><span class="card-title">${icon('users', 14)} Teknik Ekip (Staff)</span></div>
          ${(() => {
            ensureTeamExtras(team);
            return Object.entries(STAFF_INFO).map(([key, info]) => {
              const lvl = team.staff[key] || 1;
              const nextCost = lvl < 3 ? info.costs[lvl] : null;
              return `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--border);gap:10px;">
                  <div>
                    <div style="font-weight:700;font-size:13px;">${info.name} <span class="badge tier-A">Sv. ${lvl}/3</span> <span class="num" style="font-size:11px;color:var(--text-dim);">(${formatMoney(info.wages[lvl])}/hf)</span></div>
                    <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">${info.desc}</div>
                  </div>
                  <button class="btn-blue btn-sm" data-upgrade-staff="${key}" ${lvl >= 3 ? 'disabled' : ''}>${lvl >= 3 ? 'MAKS' : `İşe Al (${formatMoney(nextCost)})`}</button>
                </div>
              `;
            }).join('');
          })()}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">${icon('briefcase', 14)} Sponsorluk Anlaşmaları</span></div>
        ${SPONSORS.map(sp => {
          const active = team.sponsor?.id === sp.id;
          const locked = team.prestige < sp.minPrestige;
          return `
            <div style="padding:11px;border-radius:8px;margin-bottom:9px;background:${active ? 'var(--gold-soft)' : 'var(--bg)'};border:1px solid ${active ? 'var(--gold)' : 'var(--border)'};">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong>${sp.name}</strong>
                ${active ? '<span class="badge tier-S">AKTİF</span>' : `<button class="btn-ghost btn-sm" data-pick-sponsor="${sp.id}" ${locked ? 'disabled' : ''}>${locked ? `Prestij ${sp.minPrestige}+` : 'Anlaş'}</button>`}
              </div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">${sp.desc}</div>
              <div class="num" style="font-size:12px;margin-top:5px;">Haftalık: <b style="color:var(--green);">${formatMoney(sp.weekly)}</b> • Primi: <b style="color:var(--gold-bright);">${formatMoney(sp.bonus)}</b></div>
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
    <div class="card" style="margin-bottom:16px;border-color:rgba(200,155,60,0.5);">
      <div class="card-header">
        <span class="card-title">${icon('sliders', 14)} Yama ${patch.version} — ${patch.name}</span>
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
            ${list.map(c => `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid rgba(148,163,184,0.08);font-size:12.5px;"><span><b>${c.name}</b> <span style="font-size:11px;color:var(--text-dim);">(${c.classTag})</span></span><span class="badge tier-${getChampionMetaTier(c, patch)}">${getChampionMetaTier(c, patch)}</span></div>`).join('')}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ==================== MODALS (NEGOTIATION, DRAMA & SAVE/LOAD) ====================
function renderNegotiationModal() {
  if (!ui.negotiatingPlayerId) return '';
  const p = state.players.find(x => x.id === ui.negotiatingPlayerId);
  if (!p) return '';
  const userTeam = state.teams.find(t => t.id === state.userTeamId);
  const club = p.teamId ? state.teams.find(t => t.id === p.teamId) : null;
  const intr = evaluateTransferInterest(state, p, userTeam);
  const suggestedBuyout = club ? Math.round(p.marketValue * (p.isStarter ? 1.2 : 0.9)) : 0;
  const suggestedSalary = Math.round((p.salary * intr.salaryMult) / 500) * 500;

  return `
    <div class="modal-backdrop">
      <div class="modal-box modal-sm">
        <div class="card-header">
          <span class="card-title">${icon('briefcase', 14)} Transfer & Sözleşme Pazarlığı</span>
          <button class="btn-ghost btn-sm" id="btnCloseNego">${icon('x', 14)}</button>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <div>
            <span class="badge role-${p.role}">${p.role}</span> <strong style="font-size:16px;margin-left:4px;">${p.name}</strong>
            <div style="font-size:12px;color:var(--text-muted);margin-top:3px;">${club ? `Kulüp: ${club.name} (${club.region})` : 'Serbest'} • Yaş ${p.age} • ${TRAITS[p.trait]?.label || p.trait}</div>
          </div>
          <span class="ovr-pill ${ovrClass(p.ovr)}" style="font-size:15px;padding:4px 9px;">${p.ovr}</span>
        </div>
        <div style="padding:8px 10px;border-radius:6px;margin-bottom:12px;font-size:12px;background:${intr.willing ? (intr.level === 'HARD' ? 'var(--gold-soft)' : 'var(--blue-soft)') : 'var(--red-soft)'};border:1px solid ${intr.willing ? 'var(--border-strong)' : 'rgba(244,63,94,0.4)'};color:${intr.willing ? 'var(--text)' : '#fda4af'};">
          <b>Transfer İlgisi (${intr.label}):</b> ${intr.reason}
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
          ${club ? `<div><label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">Bonservis Teklifi (Piyasa: ${formatMoney(p.marketValue)})</label><input type="number" id="negoBuyout" value="${suggestedBuyout}" step="25000" style="width:100%;" /></div>` : `<input type="hidden" id="negoBuyout" value="0" />`}
          <div><label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">Haftalık Maaş (Mevcut: ${formatMoney(p.salary)})</label><input type="number" id="negoSalary" value="${suggestedSalary}" step="1000" style="width:100%;" /></div>
          <div><label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">Süre</label><select id="negoYears" style="width:100%;"><option value="1">1 Yıl</option><option value="2" selected>2 Yıl</option><option value="3">3 Yıl</option></select></div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button class="btn-ghost" id="btnCancelNego">İptal</button>
          <button class="btn-primary" id="btnSubmitNego">Teklifi Gönder ${icon('arrowRight', 13)}</button>
        </div>
      </div>
    </div>
  `;
}

function renderRenewalModal() {
  if (!ui.renewingPlayerId) return '';
  const p = state.players.find(x => x.id === ui.renewingPlayerId);
  if (!p) return '';
  const demand = getRenewalDemand(state, p.id);
  return `
    <div class="modal-backdrop">
      <div class="modal-box modal-sm">
        <div class="card-header">
          <span class="card-title">${icon('briefcase', 14)} Sözleşme Yenileme Pazarlığı</span>
          <button class="btn-ghost btn-sm" id="btnCloseRenew">${icon('x', 14)}</button>
        </div>
        <div style="margin-bottom:10px;">
          <span class="badge role-${p.role}">${p.role}</span> <strong style="font-size:15px;margin-left:4px;">${p.name}</strong>
          <div style="font-size:12px;color:var(--text-muted);margin-top:3px;">OVR ${p.ovr} • Yaş ${p.age} • Moral ${p.morale} • Mevcut: ${formatMoney(p.salary)}/hf</div>
        </div>
        <div style="padding:8px 10px;border-radius:6px;margin-bottom:12px;font-size:12px;background:var(--blue-soft);border:1px solid var(--border-strong);">
          <b>Oyuncu Beklentisi:</b> Haftalık ~<b>${formatMoney(demand.minSalary)}</b>${demand.wantsStar ? ' ve <b>İlk 5 (Yıldız)</b> rol garantisi' : ' (Rotasyon rolüne açık)'}.
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
          <div><label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">Teklif Edilen Haftalık Maaş</label><input type="number" id="renewSalary" value="${demand.minSalary}" step="500" style="width:100%;" /></div>
          <div><label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">Kontrat Süresi</label><select id="renewYears" style="width:100%;"><option value="1">1 Yıl</option><option value="2" selected>2 Yıl</option><option value="3">3 Yıl</option></select></div>
          <div><label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">Kadro Rolü Sözü</label><select id="renewRole" style="width:100%;"><option value="STAR" ${demand.wantsStar ? 'selected' : ''}>İlk 5 (Yıldız Oyuncu)</option><option value="ROTATION" ${!demand.wantsStar ? 'selected' : ''}>Rotasyon / Yedek</option></select></div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button class="btn-ghost" id="btnCancelRenew">İptal</button>
          <button class="btn-green" id="btnSubmitRenew">Sözleşmeyi İmzala ${icon('check', 13)}</button>
        </div>
      </div>
    </div>
  `;
}

function renderPlayerPlanModal() {
  if (!ui.trainingPlayerId) return '';
  const p = state.players.find(x => x.id === ui.trainingPlayerId);
  if (!p) return '';
  const roleChamps = CHAMPIONS.filter(c => c.roles.includes(p.role) && !p.sigChamps.includes(c.id));
  const attrLabels = [['', 'Takım Antrenmanına Uy'], ['mechanics', 'Mekanik (MEK)'], ['laning', 'Koridor (KOR)'], ['macro', 'Makro (MAK)'], ['teamfight', 'Takım Savaşı (TS)'], ['clutch', 'Clutch (CLU)'], ['pool', 'Şampiyon Havuzu (HAV)']];
  return `
    <div class="modal-backdrop">
      <div class="modal-box modal-sm">
        <div class="card-header">
          <span class="card-title">${icon('target', 14)} Bireysel Antrenman & Şampiyon Öğrenme</span>
          <button class="btn-ghost btn-sm" id="btnClosePlan">${icon('x', 14)}</button>
        </div>
        <div style="margin-bottom:12px;">
          <span class="badge role-${p.role}">${p.role}</span> <strong style="font-size:15px;margin-left:4px;">${p.name}</strong>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:3px;">Mevcut İmza Şampiyonlar: ${p.sigChamps.map(id => CHAMPION_MAP[id]?.name || id).join(', ')}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
          <div>
            <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">Bireysel Özellik Odağı</label>
            <select id="planFocus" style="width:100%;">
              ${attrLabels.map(([val, lbl]) => `<option value="${val}" ${(p.indFocus || '') === val ? 'selected' : ''}>${lbl}</option>`).join('')}
            </select>
          </div>
          <div>
            <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">Yeni İmza Şampiyon Öğren (~3-4 Hafta)</label>
            <select id="planChamp" style="width:100%;">
              <option value="">-- Seçme --</option>
              ${roleChamps.map(c => `<option value="${c.id}" ${p.learningChampId === c.id ? 'selected' : ''}>${c.name} (${c.classTag})</option>`).join('')}
            </select>
            ${p.learningChampId ? `<div style="font-size:11px;color:var(--blue);margin-top:4px;">Mevcut İlerleme: %${p.learningProgress || 0}</div>` : ''}
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button class="btn-ghost" id="btnCancelPlan">İptal</button>
          <button class="btn-primary" id="btnSubmitPlan">Planı Kaydet</button>
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
        <div class="card-header"><span class="card-title">${ev.title}</span><span class="badge tier-S">KARAR ANI</span></div>
        <p style="font-size:13.5px;line-height:1.55;margin-bottom:16px;">${ev.desc}</p>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${ev.choices.map(c => `<button class="btn-ghost" data-drama-choice="${c.idx}" style="justify-content:flex-start;text-align:left;padding:11px 14px;font-size:13px;">${icon('arrowRight', 13)} ${c.label}</button>`).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderSackedModal() {
  if (!state?.sackedState) return '';
  const sk = state.sackedState;
  return `
    <div class="modal-backdrop">
      <div class="modal-box" style="max-width:680px;border-color:var(--red);">
        <div class="card-header">
          <span class="card-title" style="color:var(--red);font-size:15px;">${icon('shield', 16)} ${sk.resigned ? 'İSTİFA ETTİN — YENİ KULÜP SEÇ' : `GÖREVİNE SON VERİLDİ (${sk.oldTeamTag})`}</span>
        </div>
        <p style="font-size:13.5px;color:var(--text);margin-bottom:14px;">${sk.reason}</p>
        <div style="font-size:12px;font-weight:800;color:var(--gold-bright);text-transform:uppercase;margin-bottom:8px;">Sana Gelen Yeni Koçluk Teklifleri</div>
        <div class="grid-2" style="gap:10px;">
          ${sk.offers.map(o => `
            <div class="card" style="background:var(--bg);display:flex;flex-direction:column;gap:8px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span><span class="team-tag" style="background:${o.color};color:${o.color2};margin-right:6px;">${o.tag}</span><b>${o.name}</b></span>
                <span class="ovr-pill ${ovrClass(o.ovr)}">${o.ovr}</span>
              </div>
              <div class="num" style="font-size:12px;color:var(--text-muted);">${o.region} • Prestij ${o.prestige} • Bütçe ${formatMoney(o.budget)}</div>
              <button class="btn-primary btn-sm" data-accept-job="${o.teamId}">Teklifi Kabul Et ${icon('arrowRight', 12)}</button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderGuideModal() {
  if (!ui.guideModalOpen) return '';
  const items = [
    ['Çift Fazlı Taktikler', 'Öndeyken Strateji (+1.5k altın) haritayı boğma, 1-3-1 split veya agresif kule dalışını belirler. Gerideyken Strateji (-1.5k altın) geri dönüş için scaling, çalı pususu veya cross-map takas planını devreye alır.'],
    ['Fearless Draft & Counter', 'BO3 ve BO5 serilerinde önceki maçlarda oynanan şampiyonlar kilitlenir. Rakibin şampiyonuna karşı counter seçimi ve oyuncunun imza/ustalık seviyesi koridor üstünlüğü sağlar.'],
    ['Shutdown, Smite Çalma & Kadim Ejder', 'Seri yakalayan oyuncular öldüğünde +700 altına kadar Shutdown verir. Ormancılar Clutch statına göre Ejder ve Baron çalabilir. Ejder Ruhu sonrası Kadim Ejder doğar.'],
    ['Bölge Formatları & Worlds 2026', 'LCK, LPL ve LCS normal sezonda BO3; TCL, LEC, CBLOL ve LCO ise BO1 oynar. TCL ve LCO şampiyonları Worlds Ön Eleme (Play-In) bileti alır; MSI şampiyonunun bölgesi Worlds için +1 bonus slot kazanır.'],
    ['Kişilikler & Dil Bariyeri', 'Büyük Maç oyuncuları Playoff/Derbi/Worlds maçlarında parlar. Farklı dilden gelen yabancı transferler 5 haftalık iletişim uyum sürecinden geçer (Spor Psikoloğu bu süreyi kısaltır).'],
    ['Kayıt & Kısayollar', 'Her gün ilerlemesinde ve sekme kapanırken otomatik kayıt alınır. Masaüstünde Space tuşuna basarak tek hamlede +1 gün ilerleyebilirsin.'],
  ];
  return `
    <div class="modal-backdrop">
      <div class="modal-box" style="max-width:680px;">
        <div class="card-header">
          <span class="card-title">${icon('shield', 15)} Oyun İçi Rehber & Mekanik Ansiklopedisi</span>
          <button class="btn-ghost btn-sm" id="btnCloseGuide">${icon('x', 14)} Kapat</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${items.map(([t, d]) => `
            <div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:11px 13px;">
              <div style="font-weight:800;font-size:13px;color:var(--gold-bright);margin-bottom:3px;">${t}</div>
              <div style="font-size:12.5px;color:var(--text-muted);line-height:1.5;">${d}</div>
            </div>
          `).join('')}
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
            <span class="card-title" style="font-size:14px;">${icon('save', 15)} Kayıt & Yükleme Yöneticisi</span>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Farklı kariyerlerini ayrı slotlara kaydedebilir, istediğin zaman yükleyebilir veya .json olarak yedekleyebilirsin.</div>
          </div>
          <button class="btn-ghost btn-sm" id="btnCloseSaveModal">${icon('x', 14)} Kapat</button>
        </div>

        ${state ? `
          <div style="display:flex;gap:10px;align-items:center;margin-bottom:14px;flex-wrap:wrap;background:var(--bg);padding:10px 12px;border-radius:8px;border:1px solid var(--border);">
            <span style="font-size:12px;color:var(--text-muted);">Kayıt Adı:</span>
            <input type="text" id="saveNameInput" value="${defaultName}" placeholder="Örn: T1 Hanedanlık, SuperMassive Worlds..." style="flex:1;min-width:200px;" />
            <button class="btn-ghost btn-sm" id="btnExportCurrent">${icon('download', 13)} .JSON İndir</button>
            <label class="btn-ghost btn-sm" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
              ${icon('upload', 13)} .JSON Yükle
              <input type="file" id="importSaveFile" accept=".json" style="display:none;" />
            </label>
          </div>
        ` : `
          <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
            <label class="btn-ghost btn-sm" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
              ${icon('upload', 13)} Bilgisayardan .JSON Kayıt Yükle
              <input type="file" id="importSaveFile" accept=".json" style="display:none;" />
            </label>
          </div>
        `}

        <div style="display:flex;flex-direction:column;gap:9px;">
          ${slots.map(s => {
            const r = s.record;
            return `
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;padding:12px 14px;background:var(--bg-card);border:1px solid ${r ? 'var(--border-strong)' : 'var(--border)'};border-radius:8px;">
                <div style="display:flex;align-items:center;gap:12px;">
                  ${r ? `<span class="team-tag" style="background:${r.teamColor};color:${r.teamColor2};font-size:12.5px;padding:6px 9px;">${r.teamTag}</span>` : `<span class="badge tier-B">BOŞ</span>`}
                  <div>
                    <div style="font-weight:800;font-size:13.5px;color:${r ? 'var(--gold-bright)' : 'var(--text-muted)'};">
                      ${s.label} ${r ? `— ${r.name}` : '(Boş Slot)'}
                    </div>
                    ${r ? `
                      <div class="num" style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">
                        ${r.teamName} (${r.region}) • Sezon ${r.season} ${r.phaseLabel} (H${r.week}) • OVR ${r.ovr} • ${formatMoney(r.budget)}
                      </div>
                      <div style="font-size:10.5px;color:var(--text-dim);">Kaydedildi: ${r.savedAt}</div>
                    ` : `<div style="font-size:11.5px;color:var(--text-dim);">Bu slota mevcut kariyerini kaydedebilirsin.</div>`}
                  </div>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                  ${state ? `<button class="btn-primary btn-sm" data-save-slot="${s.slotId}">${icon('save', 12)} ${r ? 'Üzerine Yaz' : 'Kaydet'}</button>` : ''}
                  ${r ? `<button class="btn-blue btn-sm" data-load-slot="${s.slotId}">${icon('play', 12)} Yükle</button>` : ''}
                  ${r ? `<button class="btn-danger btn-sm" data-del-slot="${s.slotId}" title="Sil">${icon('trash', 13)}</button>` : ''}
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
  ensureCalendarState(state);
  const team = state.teams.find(t => t.id === state.userTeamId);
  const unreadCount = state.inbox.filter(m => !m.read).length;
  const nextMatch = getUserNextMatch(state);
  const matchToday = isMatchDay(state);

  const navItems = [
    ['dashboard', 'home', 'Genel Bakış'],
    ['inbox', 'inbox', 'Gelen Kutusu', unreadCount],
    ['roster', 'users', 'Kadro & Antrenman'],
    ['transfers', 'search', 'Transfer & Scouting', state.incomingOffers.length],
    ['league', 'trophy', '7 Lig & Worlds'],
    ['club', 'briefcase', 'Kulüp & Finans'],
    ['meta', 'sliders', 'Yama & Meta'],
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
        <div style="padding:13px 15px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;background:rgba(200,155,60,0.04);">
          <img src="./assets/icon.jpg" alt="LoL Esports Manager" style="width:28px;height:28px;border-radius:7px;border:1px solid rgba(200,155,60,0.4);object-fit:cover;" />
          <span style="font-weight:900;font-size:12px;letter-spacing:0.8px;color:var(--text);">LOL <span style="color:var(--gold-bright);">MANAGER</span></span>
        </div>
        <div class="sidebar-club">
          <span class="team-tag" style="background:${team.color};color:${team.color2};font-size:13px;padding:7px 10px;">${team.tag}</span>
          <div>
            <div style="font-weight:800;font-size:13.5px;">${team.name}</div>
            <div style="font-size:11px;color:var(--gold-bright);font-weight:600;">Koç ${state.managerName || 'Koç'}</div>
            <div style="font-size:10.5px;color:var(--text-muted);">${team.region} • Prestij ${team.prestige}</div>
          </div>
        </div>
        <nav class="sidebar-nav">
          ${navItems.map(([id, ic, label, badge]) => `
            <button class="nav-item ${ui.tab === id ? 'active' : ''}" data-nav="${id}">
              <span class="nav-item-label">${icon(ic, 15)} ${label}</span>
              ${badge ? `<span class="nav-badge">${badge}</span>` : ''}
            </button>
          `).join('')}
          <button class="nav-item" id="btnSideMayhem" style="margin-top:8px;color:var(--gold-bright);border:1px solid rgba(200,155,60,0.3);background:var(--gold-soft);">
            <span class="nav-item-label">${icon('flame', 15)} Worlds Mayhem</span>
          </button>
        </nav>
        <div class="sidebar-footer">
          <button class="btn-ghost btn-sm" id="btnToggleFearless" style="justify-content:flex-start;">
            ${icon('lock', 13)} Fearless: ${state.fearlessEnabled ? 'AÇIK' : 'KAPALI'}
          </button>
          <button class="btn-ghost btn-sm" id="btnOpenGuide" style="justify-content:flex-start;">
            ${icon('shield', 13)} Oyun Rehberi
          </button>
          <button class="btn-primary btn-sm" id="btnOpenSaveManager" style="justify-content:flex-start;">
            ${icon('save', 13)} Kaydet / Yükle (Slotlar)
          </button>
          <button class="btn-ghost btn-sm" id="btnMainMenu" style="justify-content:flex-start;">
            ${icon('arrowLeft', 13)} Ana Menü
          </button>
        </div>
      </aside>

      <div class="main-area">
        <div class="mobile-header-bar">
          <div style="display:flex;align-items:center;gap:8px;">
            <img src="./assets/icon.jpg" alt="Icon" style="width:26px;height:26px;border-radius:6px;border:1px solid rgba(200,155,60,0.4);" />
            <span class="team-tag" style="background:${team.color};color:${team.color2};">${team.tag}</span>
            <span style="font-weight:800;font-size:12.5px;">${state.managerName || 'Koç'}</span>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn-ghost btn-sm" id="btnMobMayhem" title="Worlds Mayhem">${icon('flame', 13)}</button>
            <button class="btn-primary btn-sm" id="btnMobSave" title="Kaydet / Yükle">${icon('save', 13)}</button>
            <button class="btn-ghost btn-sm" id="btnMobMenu" title="Ana Menü">${icon('arrowLeft', 13)}</button>
          </div>
        </div>
        <header class="topbar">
          <div class="topbar-meta">
            <div class="meta-chip">${icon('calendar', 13)} <b>${formatTurkishDate(state.currentDate)}</b></div>
            <div class="meta-chip">${getPhaseLabel(state.phase)} (H${state.week})</div>
            <div class="meta-chip">${icon('sliders', 13)} Yama <b>${getCurrentPatch(state).version}</b></div>
            <div class="meta-chip num">${icon('briefcase', 13)} <b style="color:var(--green);">${formatMoney(team.budget)}</b></div>
            <div style="position:relative;">
              <input type="text" id="globalSearchInput" value="${ui.globalSearch}" placeholder="Oyuncu / Kulüp ara..." style="width:170px;padding:5px 9px;font-size:12px;" />
              ${(() => {
                const q = ui.globalSearch.trim().toLowerCase();
                if (q.length < 2) return '';
                const pHits = state.players.filter(p => p.name.toLowerCase().includes(q)).slice(0, 5);
                const tHits = state.teams.filter(t => t.name.toLowerCase().includes(q) || t.tag.toLowerCase().includes(q)).slice(0, 3);
                if (!pHits.length && !tHits.length) return '';
                return `
                  <div style="position:absolute;top:110%;left:0;width:270px;background:var(--bg-elev);border:1px solid var(--gold);border-radius:8px;box-shadow:var(--shadow);z-index:80;padding:6px;">
                    ${pHits.map(p => `<div data-gs-player="${p.id}" style="padding:6px 8px;cursor:pointer;border-radius:5px;font-size:12px;display:flex;justify-content:space-between;"><span><span class="badge role-${p.role}">${p.role}</span> <b>${p.name}</b></span><span class="ovr-pill ${ovrClass(p.ovr)}" style="font-size:10.5px;">${p.ovr}</span></div>`).join('')}
                    ${tHits.map(t => `<div data-gs-team="${t.region}" style="padding:6px 8px;cursor:pointer;border-radius:5px;font-size:12px;display:flex;justify-content:space-between;color:var(--gold-bright);"><span><b>${t.tag}</b> ${t.name}</span><span>${t.region}</span></div>`).join('')}
                  </div>
                `;
              })()}
            </div>
          </div>
          <div class="topbar-actions">
            ${matchToday
              ? `<button class="btn-primary" id="btnTopPlay">${icon('play', 14)} Maç Günü (BO${nextMatch.bestOf})</button>`
              : state.phase === 'OFFSEASON'
                ? `<button class="btn-primary" id="btnTopAdvance">Sezon ${state.season + 1}'e Başla ${icon('arrowRight', 14)}</button>`
                : `
                  <button class="btn-ghost btn-sm" id="btnTopSkipDay">${icon('fast', 13)} ${nextMatch ? 'Maç Gününe Atla' : 'Haftayı Bitir'}</button>
                  <button class="btn-primary" id="btnTopNextDay" title="Kısayol: Spacebar">Devam Et (+1 Gün) ${icon('arrowRight', 14)}</button>
                `}
          </div>
        </header>
        <main class="content">${bodyHtml}</main>
      </div>
    </div>
    <nav class="mobile-nav">
      ${[
        ['dashboard', 'home', 'Genel'],
        ['roster', 'users', 'Kadro'],
        ['transfers', 'search', 'Transfer'],
        ['league', 'trophy', 'Ligler'],
        ['club', 'briefcase', 'Kulüp'],
        ['inbox', 'inbox', 'Kutu'],
      ].map(([id, ic, lbl]) => `
        <button class="mobile-nav-btn ${ui.tab === id ? 'active' : ''}" data-nav="${id}">
          ${icon(ic, 16)}
          <span>${lbl}</span>
        </button>
      `).join('')}
    </nav>
    ${renderNegotiationModal()}
    ${renderRenewalModal()}
    ${renderPlayerPlanModal()}
    ${renderDramaModal()}
  `;
}

function render() {
  root.innerHTML = (state ? renderAppShell() : renderStartScreen()) + renderSaveLoadModal() + renderGuideModal() + renderSackedModal() + (ui.toastMsg ? `<div class="toast">${ui.toastMsg}</div>` : '');
  bindAppEvents();
}

function launchUserMatch() {
  const m = getUserNextMatch(state);
  if (!m) return;
  openSeriesModal(state, m, () => {
    saveGame(state);
    render();
    showToast('Maç tamamlandı! Yeni haftaya geçmek için takvimi ilerlet.');
  });
}

function bindAppEvents() {
  root.querySelector('#btnStartMayhem')?.addEventListener('click', openWorldsMayhemModal);
  root.querySelector('#btnSideMayhem')?.addEventListener('click', openWorldsMayhemModal);
  root.querySelector('#btnMobMayhem')?.addEventListener('click', openWorldsMayhemModal);

  // Manager Nickname Input & Quick Resume on Start Screen
  root.querySelector('#managerNameInput')?.addEventListener('input', (e) => {
    ui.managerName = e.target.value;
    try { localStorage.setItem('lol_mgr_nickname', ui.managerName); } catch (_) {}
  });
  root.querySelector('#btnQuickResume')?.addEventListener('click', () => {
    const loaded = loadFromSlot('autosave');
    if (loaded) {
      state = loaded;
      ui.leagueRegion = state.teams.find(t => t.id === state.userTeamId)?.region || 'LCK';
      ui.tab = 'dashboard';
      render();
      showToast(`Tekrar hoş geldin ${state.managerName || 'Koç'}!`);
    }
  });

  // Save / Load Manager Modal Events
  const openSaveMgr = () => { ui.saveNameDraft = ''; ui.saveModalOpen = true; render(); };
  root.querySelector('#btnOpenSaveManager')?.addEventListener('click', openSaveMgr);
  root.querySelector('#btnMobSave')?.addEventListener('click', openSaveMgr);
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
      showToast(ok ? `Kariyer "${btn.dataset.saveSlot}" slotuna kaydedildi.` : 'Kayıt başarısız oldu.');
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
        showToast('Kayıtlı kariyer başarıyla yüklendi.');
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
    showToast('Kariyer .json dosyası olarak indirildi.');
  });
  root.querySelector('#importSaveFile')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || !parsed.userTeamId || !Array.isArray(parsed.teams)) {
          showToast('Geçersiz kayıt dosyası.');
          return;
        }
        state = parsed;
        ui.leagueRegion = state.teams.find(t => t.id === state.userTeamId)?.region || 'LCK';
        ui.tab = 'dashboard';
        ui.saveModalOpen = false;
        saveGame(state);
        render();
        showToast('Kariyer dosyası başarıyla içe aktarıldı.');
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
      const nick = (root.querySelector('#managerNameInput')?.value || ui.managerName || 'Koç').trim() || 'Koç';
      ui.managerName = nick;
      try { localStorage.setItem('lol_mgr_nickname', nick); } catch (_) {}
      state = createNewCareer(btn.dataset.pickClub, nick);
      ui.leagueRegion = state.teams.find(t => t.id === state.userTeamId).region;
      ui.tab = 'dashboard';
      saveGame(state);
      render();
      showToast(`Hoş geldin ${nick}! Kariyerin başladı.`);
    });
  });

  if (!state) return;

  root.querySelectorAll('[data-nav]').forEach(btn => btn.addEventListener('click', () => { ui.tab = btn.dataset.nav; render(); }));
  root.querySelector('#btnToggleFearless')?.addEventListener('click', () => {
    state.fearlessEnabled = !state.fearlessEnabled;
    saveGame(state); render();
    showToast(`Fearless Draft ${state.fearlessEnabled ? 'AÇILDI' : 'KAPATILDI'}.`);
  });
  root.querySelector('#btnMainMenu')?.addEventListener('click', () => { saveGame(state); state = null; render(); });
  root.querySelector('#btnMobMenu')?.addEventListener('click', () => { saveGame(state); state = null; render(); });

  root.querySelector('#btnPlayMatchLive')?.addEventListener('click', launchUserMatch);
  root.querySelector('#btnTopPlay')?.addEventListener('click', launchUserMatch);
  root.querySelector('#btnQuickSimMatch')?.addEventListener('click', () => {
    const m = getUserNextMatch(state);
    if (!m) return;
    quickSimSeries(state, m);
    const bt = state.teams.find(t => t.id === m.blueId);
    const rt = state.teams.find(t => t.id === m.redId);
    saveGame(state);
    render();
    showToast(`Maç Sonucu: ${bt.tag} ${m.blueScore} - ${m.redScore} ${rt.tag}`);
  });

  const doNextDay = () => {
    const res = advanceOneDay(state);
    saveGame(state);
    render();
    if (res.msg) showToast(res.msg);
  };
  const doSkipDay = () => {
    const res = skipToNextKeyDay(state);
    saveGame(state);
    render();
    if (res.msg) showToast(res.msg);
  };

  root.querySelector('#btnTopNextDay')?.addEventListener('click', doNextDay);
  root.querySelector('#btnDashAdvanceDay')?.addEventListener('click', doNextDay);
  root.querySelector('#btnTopSkipDay')?.addEventListener('click', doSkipDay);
  root.querySelector('#btnDashSkipMatchDay')?.addEventListener('click', doSkipDay);

  const doAdvance = () => {
    advanceWeekOrRound(state);
    saveGame(state);
    render();
    showToast(`Takvim ilerledi: ${getPhaseLabel(state.phase)} H${state.week}`);
  };
  root.querySelector('#btnAdvanceCal')?.addEventListener('click', doAdvance);
  root.querySelector('#btnTopAdvance')?.addEventListener('click', doAdvance);

  root.querySelectorAll('[data-drama-choice]').forEach(btn => {
    btn.addEventListener('click', () => {
      resolveDramaEvent(state, Number(btn.dataset.dramaChoice));
      saveGame(state);
      render();
      showToast('Kararın uygulandı.');
    });
  });

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

  root.querySelectorAll('[data-open-msg]').forEach(el => el.addEventListener('click', () => { ui.selectedInboxId = el.dataset.openMsg; ui.tab = 'inbox'; render(); }));
  root.querySelectorAll('[data-select-inbox]').forEach(el => el.addEventListener('click', () => { ui.selectedInboxId = el.dataset.selectInbox; render(); }));

  const uTeam = state.teams.find(t => t.id === state.userTeamId);
  root.querySelectorAll('[data-set-starter]').forEach(btn => btn.addEventListener('click', () => { setStarter(state, btn.dataset.setStarter); saveGame(state); render(); showToast('İlk 5 güncellendi.'); }));
  root.querySelectorAll('[data-open-renew]').forEach(btn => btn.addEventListener('click', () => { ui.renewingPlayerId = btn.dataset.openRenew; render(); }));
  root.querySelector('#btnCloseRenew')?.addEventListener('click', () => { ui.renewingPlayerId = null; render(); });
  root.querySelector('#btnCancelRenew')?.addEventListener('click', () => { ui.renewingPlayerId = null; render(); });
  root.querySelector('#btnSubmitRenew')?.addEventListener('click', () => {
    const res = negotiateContractRenewal(state, ui.renewingPlayerId, Number(root.querySelector('#renewSalary').value) || 0, Number(root.querySelector('#renewYears').value) || 2, root.querySelector('#renewRole').value);
    if (res.ok) ui.renewingPlayerId = null;
    saveGame(state); render(); showToast(res.reason);
  });

  root.querySelectorAll('[data-open-plan]').forEach(btn => btn.addEventListener('click', () => { ui.trainingPlayerId = btn.dataset.openPlan; render(); }));
  root.querySelector('#btnClosePlan')?.addEventListener('click', () => { ui.trainingPlayerId = null; render(); });
  root.querySelector('#btnCancelPlan')?.addEventListener('click', () => { ui.trainingPlayerId = null; render(); });
  root.querySelector('#btnSubmitPlan')?.addEventListener('click', () => {
    const res = setPlayerIndividualTraining(state, ui.trainingPlayerId, root.querySelector('#planFocus').value, root.querySelector('#planChamp').value);
    if (res.ok) ui.trainingPlayerId = null;
    saveGame(state); render(); showToast(res.reason);
  });

  root.querySelectorAll('[data-set-intensity]').forEach(b => b.addEventListener('click', () => {
    uTeam.trainingIntensity = b.dataset.setIntensity;
    saveGame(state); render(); showToast('Antrenman yoğunluğu güncellendi.');
  }));

  root.querySelectorAll('[data-upgrade-staff]').forEach(b => b.addEventListener('click', () => {
    const res = upgradeStaff(state, b.dataset.upgradeStaff);
    saveGame(state); render(); showToast(res.reason);
  }));

  root.querySelectorAll('[data-release-player]').forEach(btn => btn.addEventListener('click', () => { const res = releasePlayer(state, btn.dataset.releasePlayer); saveGame(state); render(); showToast(res.reason); }));
  root.querySelectorAll('[data-set-training]').forEach(el => el.addEventListener('click', () => { uTeam.trainingFocus = el.dataset.setTraining; saveGame(state); render(); showToast('Antrenman güncellendi.'); }));
  root.querySelectorAll('[data-def-plan]').forEach(b => b.addEventListener('click', () => { uTeam.tactics.gameplan = b.dataset.defPlan; render(); }));
  root.querySelectorAll('[data-def-lane]').forEach(b => b.addEventListener('click', () => { uTeam.tactics.laneFocus = b.dataset.defLane; render(); }));
  root.querySelectorAll('[data-def-obj]').forEach(b => b.addEventListener('click', () => { uTeam.tactics.objective = b.dataset.defObj; render(); }));
  root.querySelectorAll('[data-def-top]').forEach(b => b.addEventListener('click', () => { uTeam.tactics.topStyle = b.dataset.defTop; render(); }));
  root.querySelectorAll('[data-def-sup]').forEach(b => b.addEventListener('click', () => { uTeam.tactics.supStyle = b.dataset.defSup; render(); }));
  root.querySelector('#btnOpenGuide')?.addEventListener('click', () => { ui.guideModalOpen = true; render(); });
  root.querySelector('#btnCloseGuide')?.addEventListener('click', () => { ui.guideModalOpen = false; render(); });

  const gsInput = root.querySelector('#globalSearchInput');
  if (gsInput) {
    gsInput.addEventListener('input', (e) => {
      ui.globalSearch = e.target.value;
      render();
      const again = root.querySelector('#globalSearchInput');
      if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
    });
  }
  root.querySelectorAll('[data-gs-player]').forEach(el => {
    el.addEventListener('click', () => {
      ui.globalSearch = '';
      ui.negotiatingPlayerId = el.dataset.gsPlayer;
      render();
    });
  });
  root.querySelectorAll('[data-gs-team]').forEach(el => {
    el.addEventListener('click', () => {
      ui.globalSearch = '';
      ui.leagueRegion = el.dataset.gsTeam;
      ui.tab = 'league';
      render();
    });
  });

  root.querySelectorAll('[data-planner-search]').forEach(btn => {
    btn.addEventListener('click', () => {
      ui.transferRole = btn.dataset.plannerSearch;
      ui.transferSubTab = 'market';
      ui.tab = 'transfers';
      render();
    });
  });
  root.querySelectorAll('[data-def-ahead]').forEach(b => b.addEventListener('click', () => { uTeam.tactics.aheadPlan = b.dataset.defAhead; render(); }));
  root.querySelectorAll('[data-def-behind]').forEach(b => b.addEventListener('click', () => { uTeam.tactics.behindPlan = b.dataset.defBehind; render(); }));

  root.querySelectorAll('[data-def-adc]').forEach(b => b.addEventListener('click', () => { uTeam.tactics.adcStyle = b.dataset.defAdc; render(); }));

  root.querySelector('#btnPlayScrim')?.addEventListener('click', () => {
    const res = playWeeklyScrim(state, root.querySelector('#scrimSelect').value);
    saveGame(state); render(); showToast(res.ok ? res.text : res.reason);
  });

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
    showToast(res.ok ? `Akademiden ${res.player.name} (${res.player.role}, OVR ${res.player.ovr}) yükseldi.` : res.reason);
  });
  root.querySelectorAll('[data-open-nego]').forEach(btn => btn.addEventListener('click', () => { ui.negotiatingPlayerId = btn.dataset.openNego; render(); }));
  root.querySelector('#btnCloseNego')?.addEventListener('click', () => { ui.negotiatingPlayerId = null; render(); });
  root.querySelector('#btnCancelNego')?.addEventListener('click', () => { ui.negotiatingPlayerId = null; render(); });
  root.querySelector('#btnSubmitNego')?.addEventListener('click', () => {
    const res = attemptSignOrTransfer(state, ui.negotiatingPlayerId, Number(root.querySelector('#negoBuyout').value) || 0, Number(root.querySelector('#negoSalary').value) || 0, Number(root.querySelector('#negoYears').value) || 2);
    if (res.ok) ui.negotiatingPlayerId = null;
    saveGame(state); render(); showToast(res.reason);
  });

  root.querySelectorAll('[data-league-reg]').forEach(b => b.addEventListener('click', () => { ui.leagueRegion = b.dataset.leagueReg; render(); }));
  root.querySelectorAll('[data-fix-week]').forEach(b => b.addEventListener('click', () => {
    ui.leagueFixtureWeek = b.dataset.fixWeek === 'ALL' ? 'ALL' : Number(b.dataset.fixWeek);
    render();
  }));
  root.querySelector('#archiveSelect')?.addEventListener('change', (e) => {
    ui.selectedArchiveIdx = Number(e.target.value) || 0;
    render();
  });
  root.querySelectorAll('[data-upgrade-fac]').forEach(b => b.addEventListener('click', () => { const res = upgradeFacility(state, b.dataset.upgradeFac); saveGame(state); render(); showToast(res.reason); }));
  root.querySelector('#btnResignClub')?.addEventListener('click', () => {
    resignFromClub(state);
    render();
  });
  root.querySelectorAll('[data-accept-job]').forEach(btn => {
    btn.addEventListener('click', () => {
      acceptJobOffer(state, btn.dataset.acceptJob);
      ui.leagueRegion = state.teams.find(t => t.id === state.userTeamId)?.region || 'LCK';
      ui.tab = 'dashboard';
      saveGame(state);
      render();
      showToast('Yeni kulübünde göreve başladın! Başarılar koç.');
    });
  });

  root.querySelectorAll('[data-dismiss-job]').forEach(btn => {
    btn.addEventListener('click', () => {
      dismissManagerJobOffer(state, btn.dataset.dismissJob);
      saveGame(state);
      render();
      showToast('Koçluk teklifi reddedildi — mevcut kulübünde kalıyorsun.');
    });
  });

  root.querySelectorAll('[data-pick-sponsor]').forEach(b => b.addEventListener('click', () => {
    const sp = SPONSORS.find(s => s.id === b.dataset.pickSponsor);
    if (sp) { uTeam.sponsor = sp; saveGame(state); render(); showToast(`${sp.name} ile anlaşıldı.`); }
  }));
}

// Safety auto-save if user accidentally closes tab or switches app on mobile
window.addEventListener('beforeunload', () => { if (state) saveGame(state); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && state) saveGame(state); });

// Football Manager Spacebar shortcut to advance 1 day!
window.addEventListener('keydown', (e) => {
  if (e.code !== 'Space' || !state) return;
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return;
  if (ui.saveModalOpen || ui.negotiatingPlayerId || ui.renewingPlayerId || ui.trainingPlayerId || state.pendingEvent || document.querySelector('.modal-backdrop')) return;
  e.preventDefault();
  if (isMatchDay(state)) {
    launchUserMatch();
  } else if (state.phase !== 'OFFSEASON') {
    const res = advanceOneDay(state);
    saveGame(state);
    render();
    if (res.msg) showToast(res.msg);
  }
});

render();

// LoL Esports Manager v2.0 — Worlds Mayhem Arcade Mode (LoLdle-inspired Legends Draft + 3 Rerolls + Instant Worlds Run)
import { ROLES, LEGENDS_MAYHEM } from '../data/teamsAndPlayers.js';

export function openWorldsMayhemModal() {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  const box = document.createElement('div');
  box.className = 'modal-box';
  box.style.maxWidth = '920px';
  backdrop.appendChild(box);
  document.body.appendChild(backdrop);

  const mayhem = {
    roleIdx: 0,
    rerolls: 3,
    roster: [],
    choices: [],
    simResult: null,
  };

  function rollChoicesForCurrentRole() {
    const role = ROLES[mayhem.roleIdx];
    const pool = LEGENDS_MAYHEM.filter(l => l.role === role);
    mayhem.choices = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
  }

  function calcMayhemTeamScore() {
    if (mayhem.roster.length === 0) return { avg: 0, synergy: 0, total: 0, bonuses: [] };
    const avg = mayhem.roster.reduce((s, p) => s + p.ovr, 0) / mayhem.roster.length;
    const bonuses = [];
    let syn = 0;

    // Region & Team synergy bonuses
    const regCounts = {};
    const teamCounts = {};
    for (const p of mayhem.roster) {
      regCounts[p.region] = (regCounts[p.region] || 0) + 1;
      teamCounts[p.team] = (teamCounts[p.team] || 0) + 1;
    }
    for (const [reg, cnt] of Object.entries(regCounts)) {
      if (cnt >= 3) { syn += cnt * 0.7; bonuses.push(`${cnt}x ${reg} Kimyası (+${(cnt * 0.7).toFixed(1)})`); }
    }
    for (const [tm, cnt] of Object.entries(teamCounts)) {
      if (cnt >= 2) { syn += cnt * 1.1; bonuses.push(`${cnt}x ${tm} Hanedanı (+${(cnt * 1.1).toFixed(1)})`); }
    }
    if (mayhem.roster.some(p => p.style === 'Shotcaller')) { syn += 1.2; bonuses.push('Lider Shotcaller (+1.2)'); }

    return { avg: +avg.toFixed(1), synergy: +syn.toFixed(1), total: +(avg + syn).toFixed(1), bonuses };
  }

  function simulateMayhemWorlds() {
    const { total } = calcMayhemTeamScore();
    const rounds = [
      { name: 'Son 16 Turu (BO3)', opp: '2019 G2 Esports', oppRating: 94.0 },
      { name: 'Çeyrek Final (BO5)', opp: '2020 DAMWON Gaming', oppRating: 96.5 },
      { name: 'Yarı Final (BO5)', opp: '2018 Invictus Gaming', oppRating: 97.5 },
      { name: 'WORLDS BÜYÜK FİNAL (BO5)', opp: '2015 SKT T1 / 2023 T1 Karma', oppRating: 98.8 },
    ];

    const log = [];
    let champion = true;
    let eliminatedAt = null;

    for (const r of rounds) {
      const winProb = 1 / (1 + Math.exp(-(total - r.oppRating) / 3.2));
      const needed = r.name.includes('BO3') ? 2 : 3;
      let u = 0, o = 0;
      while (u < needed && o < needed) {
        if (Math.random() < winProb) u++;
        else o++;
      }
      const won = u > o;
      log.push({ round: r.name, opp: r.opp, score: `${u} - ${o}`, won, winProb: Math.round(winProb * 100) });
      if (!won) {
        champion = false;
        eliminatedAt = r.name;
        break;
      }
    }

    const mvp = [...mayhem.roster].sort((a, b) => (b.ovr + Math.random() * 4) - (a.ovr + Math.random() * 4))[0];
    mayhem.simResult = { champion, eliminatedAt, log, mvp };
    render();
  }

  function render() {
    const score = calcMayhemTeamScore();
    const finishedDraft = mayhem.roleIdx >= ROLES.length;

    box.innerHTML = `
      <div class="card-header">
        <div>
          <span class="card-title" style="font-size:17px;">🔥 WORLDS MAYHEM — Efsane Kadro Modu</span>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">LoLdle Worlds Mayhem tarzı: 5 efsane sezon kartı seç (3 Reroll hakkı), Sihirdar Kupası'nı kazan!</div>
        </div>
        <button class="btn-ghost btn-sm" id="btnCloseMayhem">✕ Kapat</button>
      </div>

      <!-- Current 5-Man Roster -->
      <div class="grid-5" style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:16px;">
        ${ROLES.map((r, i) => {
          const p = mayhem.roster[i];
          return `
            <div class="card" style="padding:10px;text-align:center;border-color:${i === mayhem.roleIdx ? 'var(--gold)' : 'var(--border)'};">
              <span class="badge role-${r}">${r}</span>
              ${p ? `
                <div style="font-weight:800;font-size:13px;margin-top:6px;color:var(--gold-bright);">${p.name}</div>
                <div style="font-size:11px;color:var(--text-muted);">${p.team} • ${p.region}</div>
                <div style="margin-top:4px;"><span class="ovr-pill ovr-90">${p.ovr}</span></div>
              ` : `<div style="font-size:12px;color:var(--text-muted);margin-top:12px;">${i === mayhem.roleIdx ? 'Seçiliyor...' : 'Bekliyor'}</div>`}
            </div>
          `;
        }).join('')}
      </div>

      ${!finishedDraft ? `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <strong style="color:var(--gold-bright);font-size:15px;">Rol Seçimi (${mayhem.roleIdx + 1}/5): <span class="badge role-${ROLES[mayhem.roleIdx]}">${ROLES[mayhem.roleIdx]}</span></strong>
          <button class="btn-blue btn-sm" id="btnMayhemReroll" ${mayhem.rerolls <= 0 ? 'disabled' : ''}>🎲 Reroll (${mayhem.rerolls} Hak Kaldı)</button>
        </div>
        <div class="grid-3">
          ${mayhem.choices.map((c, idx) => `
            <div class="club-card" style="cursor:pointer;" data-pick-legend="${idx}">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span class="badge tier-S">${c.team} • ${c.region}</span>
                <span class="ovr-pill ovr-90" style="font-size:16px;">${c.ovr}</span>
              </div>
              <div style="font-size:17px;font-weight:900;color:var(--gold-bright);">${c.name}</div>
              <div style="font-size:12px;color:var(--text-muted);min-height:36px;">${c.desc}</div>
              <div style="font-size:11px;color:var(--blue);">Stil: ${c.style}</div>
              <button class="btn-primary btn-sm" style="margin-top:auto;">Kadroya Ekle →</button>
            </div>
          `).join('')}
        </div>
      ` : !mayhem.simResult ? `
        <div class="card" style="text-align:center;padding:24px;">
          <div style="font-size:20px;font-weight:900;color:var(--gold-bright);">RÜYA KADRO HAZIR!</div>
          <div style="font-size:15px;margin:8px 0;">Ortalama OVR: <b>${score.avg}</b> • Sinerji Bonusu: <b style="color:var(--green);">+${score.synergy}</b> • Toplam Güç: <b style="color:var(--gold-bright);">${score.total}</b></div>
          ${score.bonuses.length ? `<div style="display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin-bottom:14px;">${score.bonuses.map(b => `<span class="badge tier-A">${b}</span>`).join('')}</div>` : ''}
          <button class="btn-primary" id="btnRunMayhemSim" style="padding:12px 26px;font-size:15px;">🏆 WORLDS TURNUVASINI SİMÜLE ET!</button>
        </div>
      ` : `
        <div class="card" style="border-color:${mayhem.simResult.champion ? 'var(--gold)' : 'var(--red)'};">
          <div style="text-align:center;margin-bottom:16px;">
            <div style="font-size:24px;font-weight:900;color:${mayhem.simResult.champion ? 'var(--gold-bright)' : 'var(--red)'};">
              ${mayhem.simResult.champion ? '🏆 SİHİRDAR KUPASI SENİN! WORLDS ŞAMPİYONU!' : `💔 ${mayhem.simResult.eliminatedAt} Turunda Elendin`}
            </div>
            <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">
              Kadronun Gücü: <b>${score.total}</b> • Turnuva Yıldızın: <b>${mayhem.simResult.mvp.name}</b>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
            ${mayhem.simResult.log.map(item => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--bg);border-radius:8px;border-left:4px solid ${item.won ? 'var(--green)' : 'var(--red)'};">
                <div><strong>${item.round}</strong> <span style="color:var(--text-muted);">vs ${item.opp}</span></div>
                <div><b style="color:${item.won ? 'var(--green)' : 'var(--red)'};">${item.won ? 'GALİBİYET' : 'ELENDİ'} (${item.score})</b></div>
              </div>
            `).join('')}
          </div>
          <div style="text-align:center;">
            <button class="btn-primary" id="btnMayhemRestart">🔄 Yeni Worlds Mayhem Başlat</button>
          </div>
        </div>
      `}
    `;

    box.querySelector('#btnCloseMayhem')?.addEventListener('click', () => backdrop.remove());
    box.querySelector('#btnMayhemReroll')?.addEventListener('click', () => {
      if (mayhem.rerolls > 0) {
        mayhem.rerolls--;
        rollChoicesForCurrentRole();
        render();
      }
    });
    box.querySelectorAll('[data-pick-legend]').forEach(el => {
      el.addEventListener('click', () => {
        const chosen = mayhem.choices[Number(el.dataset.pickLegend)];
        mayhem.roster.push(chosen);
        mayhem.roleIdx++;
        if (mayhem.roleIdx < ROLES.length) rollChoicesForCurrentRole();
        render();
      });
    });
    box.querySelector('#btnRunMayhemSim')?.addEventListener('click', simulateMayhemWorlds);
    box.querySelector('#btnMayhemRestart')?.addEventListener('click', () => {
      mayhem.roleIdx = 0; mayhem.rerolls = 3; mayhem.roster = []; mayhem.simResult = null;
      rollChoicesForCurrentRole();
      render();
    });
  }

  rollChoicesForCurrentRole();
  render();
}

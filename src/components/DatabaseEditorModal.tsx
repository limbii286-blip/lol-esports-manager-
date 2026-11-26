import React, { useMemo, useState } from 'react';
import { X, Database, Download, Upload, Search, Check } from 'lucide-react';
import { calcOVR } from '../data/teamsAndPlayers.js';
import { recalculatePlayerMarketValue, formatMoney } from '../engine/gameEngine.js';
import { soundFx } from '../engine/soundFx';

interface DatabaseEditorModalProps {
  state: any;
  onUpdate: (msg?: string) => void;
  onClose: () => void;
}

export const DatabaseEditorModal: React.FC<DatabaseEditorModalProps> = ({ state, onUpdate, onClose }) => {
  const [tab, setTab] = useState<'players' | 'clubs' | 'io'>('players');
  const [query, setQuery] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(() => state.players?.[0]?.id || '');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(() => state.userTeamId || state.teams?.[0]?.id || '');
  const [importText, setImportText] = useState('');
  const [feedback, setFeedback] = useState('');

  const filteredPlayers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (state.players || [])
      .filter((p: any) => (!q ? true : p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q)))
      .sort((a: any, b: any) => b.ovr - a.ovr)
      .slice(0, 40);
  }, [state.players, query]);

  const activePlayer = useMemo(
    () => (state.players || []).find((p: any) => p.id === selectedPlayerId) || filteredPlayers[0] || null,
    [state.players, selectedPlayerId, filteredPlayers]
  );

  const activeTeam = useMemo(
    () => (state.teams || []).find((t: any) => t.id === selectedTeamId) || state.teams?.[0] || null,
    [state.teams, selectedTeamId]
  );

  const updatePlayerField = (field: string, value: any) => {
    if (!activePlayer) return;
    if (field.startsWith('attr_')) {
      const k = field.replace('attr_', '');
      activePlayer.attrs[k] = Math.max(40, Math.min(99, Number(value) || 70));
      activePlayer.ovr = calcOVR(activePlayer.attrs);
    } else if (field === 'teamId') {
      activePlayer.teamId = value || null;
      activePlayer.isStarter = false;
    } else {
      activePlayer[field] = value;
    }
    recalculatePlayerMarketValue(state, activePlayer, false);
    onUpdate();
  };

  const updateTeamField = (field: string, value: any) => {
    if (!activeTeam) return;
    activeTeam[field] = value;
    onUpdate();
  };

  const handleExportJson = () => {
    soundFx.click();
    const payload = {
      version: 'LEM27_DB_V1',
      season: state.season,
      teams: state.teams.map((t: any) => ({
        id: t.id,
        name: t.name,
        tag: t.tag,
        region: t.region,
        prestige: t.prestige,
        budget: t.budget,
        fanbase: t.fanbase,
      })),
      players: state.players.map((p: any) => ({
        id: p.id,
        name: p.name,
        role: p.role,
        nat: p.nat,
        age: p.age,
        pot: p.pot,
        ovr: p.ovr,
        attrs: p.attrs,
        teamId: p.teamId,
        contractYears: p.contractYears,
        salary: p.salary,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lol_esports_db_s${state.season}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedback('Özel veritabanı JSON olarak dışa aktarıldı!');
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed.teams) || !Array.isArray(parsed.players)) {
        setFeedback('Geçersiz format: JSON içinde "teams" ve "players" dizileri olmalı.');
        return;
      }
      let updatedT = 0;
      let updatedP = 0;
      for (const td of parsed.teams) {
        const target = state.teams.find((t: any) => t.id === td.id);
        if (target) {
          if (td.name) target.name = td.name;
          if (td.tag) target.tag = td.tag;
          if (Number.isFinite(td.prestige)) target.prestige = td.prestige;
          if (Number.isFinite(td.budget)) target.budget = td.budget;
          if (Number.isFinite(td.fanbase)) target.fanbase = td.fanbase;
          updatedT++;
        }
      }
      for (const pd of parsed.players) {
        const target = state.players.find((p: any) => p.id === pd.id);
        if (target) {
          if (pd.name) target.name = pd.name;
          if (Number.isFinite(pd.age)) target.age = pd.age;
          if (Number.isFinite(pd.pot)) target.pot = pd.pot;
          if (pd.attrs) {
            target.attrs = { ...target.attrs, ...pd.attrs };
            target.ovr = calcOVR(target.attrs);
          }
          if (pd.teamId !== undefined) target.teamId = pd.teamId;
          if (Number.isFinite(pd.contractYears)) target.contractYears = pd.contractYears;
          if (Number.isFinite(pd.salary)) target.salary = pd.salary;
          recalculatePlayerMarketValue(state, target, false);
          updatedP++;
        }
      }
      soundFx.objectiveSecured();
      setFeedback(`Veritabanı uygulandı: ${updatedT} kulüp, ${updatedP} oyuncu güncellendi!`);
      onUpdate(`FM Veritabanı Editörü: ${updatedP} oyuncu ve ${updatedT} kulüp güncellendi.`);
    } catch {
      setFeedback('JSON okunamadı. Lütfen geçerli bir JSON veritabanı yapıştır.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#121722] border border-white/[0.14] rounded-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-[#E4BD67]" />
            <h3 className="font-display text-2xl font-extrabold text-white tracking-wide">
              FM Veritabanı & Mod Editörü
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-2.5 border-b border-white/[0.08] bg-[#0B0E14]/60 flex items-center gap-1.5 shrink-0">
          {[
            { id: 'players', label: 'Oyuncu Düzenle' },
            { id: 'clubs', label: 'Kulüp & Bütçe Düzenle' },
            { id: 'io', label: 'JSON İçe / Dışa Aktar (Mod)' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                tab === t.id ? 'bg-[#C89B3C] text-[#0B0E14]' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {tab === 'players' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="md:col-span-5 space-y-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Oyuncu ara..."
                    className="w-full bg-[#0B0E14] border border-white/[0.1] rounded-md pl-8 pr-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="bg-[#0B0E14] border border-white/[0.08] rounded-md divide-y divide-white/[0.06] max-h-[380px] overflow-y-auto text-xs">
                  {filteredPlayers.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlayerId(p.id)}
                      className={`w-full px-3 py-2 flex items-center justify-between text-left cursor-pointer ${
                        activePlayer?.id === p.id ? 'bg-[#C89B3C]/20 text-white' : 'text-slate-300 hover:bg-white/[0.03]'
                      }`}
                    >
                      <span>
                        <span className="font-mono-num text-[#E4BD67] mr-2">{p.role}</span>
                        <strong>{p.name}</strong>
                      </span>
                      <span className="font-mono-num text-slate-400">OVR {p.ovr}</span>
                    </button>
                  ))}
                </div>
              </div>

              {activePlayer && (
                <div className="md:col-span-7 bg-[#0B0E14] border border-white/[0.08] rounded-lg p-5 space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <div>
                      <div className="text-base font-bold text-white">{activePlayer.name}</div>
                      <div className="text-slate-400 font-mono-num">
                        OVR {activePlayer.ovr} · Değer {formatMoney(activePlayer.marketValue)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">Yaş</label>
                      <input
                        type="number"
                        min={16}
                        max={40}
                        value={activePlayer.age}
                        onChange={(e) => updatePlayerField('age', Number(e.target.value))}
                        className="w-full bg-[#121722] border border-white/[0.12] rounded px-2.5 py-1.5 font-mono-num text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Potansiyel (POT)</label>
                      <input
                        type="number"
                        min={50}
                        max={99}
                        value={activePlayer.pot}
                        onChange={(e) => updatePlayerField('pot', Number(e.target.value))}
                        className="w-full bg-[#121722] border border-white/[0.12] rounded px-2.5 py-1.5 font-mono-num text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Kulüp</label>
                      <select
                        value={activePlayer.teamId || ''}
                        onChange={(e) => updatePlayerField('teamId', e.target.value)}
                        className="w-full bg-[#121722] border border-white/[0.12] rounded px-2 py-1.5 text-white"
                      >
                        <option value="">Serbest Oyuncu</option>
                        {state.teams.map((t: any) => (
                          <option key={t.id} value={t.id}>
                            {t.tag} · {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-white/[0.07]">
                    {(['mechanics', 'laning', 'macro', 'teamfight', 'clutch', 'pool'] as const).map((k) => (
                      <div key={k}>
                        <label className="text-slate-400 block mb-1 capitalize">{k}</label>
                        <input
                          type="number"
                          min={40}
                          max={99}
                          value={activePlayer.attrs?.[k] ?? 75}
                          onChange={(e) => updatePlayerField(`attr_${k}`, Number(e.target.value))}
                          className="w-full bg-[#121722] border border-white/[0.12] rounded px-2.5 py-1.5 font-mono-num text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'clubs' && activeTeam && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-xs">
              <div className="md:col-span-5 bg-[#0B0E14] border border-white/[0.08] rounded-md divide-y divide-white/[0.06] max-h-[380px] overflow-y-auto">
                {state.teams.map((t: any) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTeamId(t.id)}
                    className={`w-full px-3 py-2 flex items-center justify-between text-left cursor-pointer ${
                      activeTeam.id === t.id ? 'bg-[#C89B3C]/20 text-white' : 'text-slate-300 hover:bg-white/[0.03]'
                    }`}
                  >
                    <span>
                      <strong className="text-[#E4BD67] mr-2 font-mono-num">{t.tag}</strong>
                      {t.name}
                    </span>
                    <span className="font-mono-num text-slate-400">{t.region}</span>
                  </button>
                ))}
              </div>
              <div className="md:col-span-7 bg-[#0B0E14] border border-white/[0.08] rounded-lg p-5 space-y-4">
                <div className="text-base font-bold text-white border-b border-white/[0.08] pb-3">
                  {activeTeam.name} ({activeTeam.region})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Bütçe ($)</label>
                    <input
                      type="number"
                      step={100000}
                      value={activeTeam.budget}
                      onChange={(e) => updateTeamField('budget', Number(e.target.value))}
                      className="w-full bg-[#121722] border border-white/[0.12] rounded px-2.5 py-1.5 font-mono-num text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Prestij (50–99)</label>
                    <input
                      type="number"
                      min={50}
                      max={99}
                      value={activeTeam.prestige}
                      onChange={(e) => updateTeamField('prestige', Number(e.target.value))}
                      className="w-full bg-[#121722] border border-white/[0.12] rounded px-2.5 py-1.5 font-mono-num text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Taraftar (40–100)</label>
                    <input
                      type="number"
                      min={40}
                      max={100}
                      value={activeTeam.fanbase}
                      onChange={(e) => updateTeamField('fanbase', Number(e.target.value))}
                      className="w-full bg-[#121722] border border-white/[0.12] rounded px-2.5 py-1.5 font-mono-num text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'io' && (
            <div className="space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0B0E14] border border-white/[0.08] rounded-lg p-4">
                <div>
                  <div className="font-bold text-white">Mevcut Veritabanını Dışa Aktar</div>
                  <div className="text-slate-400 mt-0.5">
                    Kendi özel 2015/2019 veya kurgusal kadro modlarını oluşturup paylaşmak için JSON indir.
                  </div>
                </div>
                <button
                  onClick={handleExportJson}
                  className="px-4 py-2 rounded-md bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> JSON İndir
                </button>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-white block">Özel Veritabanı JSON İçe Aktar</label>
                <textarea
                  rows={8}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder='{"teams": [...], "players": [...]}'
                  className="w-full bg-[#0B0E14] border border-white/[0.12] rounded-md p-3 font-mono-num text-[11px] text-slate-200 outline-none focus:border-[#C89B3C]"
                />
                <button
                  onClick={handleImportJson}
                  className="px-4 py-2 rounded-md border border-[#C89B3C]/60 text-[#E4BD67] hover:bg-[#C89B3C]/15 font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" /> Veritabanını Uygula
                </button>
              </div>
            </div>
          )}

          {feedback && (
            <div className="text-xs text-emerald-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> {feedback}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

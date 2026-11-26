import React, { useState } from 'react';
import { Save, Trash2, FolderOpen, X } from 'lucide-react';
import { listSaveSlots, saveToSlot, loadFromSlot, deleteSaveSlot } from '../engine/gameEngine.js';
import { TeamCrest } from './shared/Visuals';
import { soundFx } from '../engine/soundFx';

interface SaveSlotsModalProps {
  currentState: any | null;
  onLoadState: (loadedState: any, msg: string) => void;
  onToast: (msg: string) => void;
  onClose: () => void;
}

export const SaveSlotsModal: React.FC<SaveSlotsModalProps> = ({
  currentState,
  onLoadState,
  onToast,
  onClose,
}) => {
  const [slots, setSlots] = useState(() => listSaveSlots());
  const [customName, setCustomName] = useState('');

  const refresh = () => setSlots(listSaveSlots());

  const handleSave = (slotId: string) => {
    if (!currentState) return;
    soundFx.click();
    saveToSlot(currentState, slotId, customName.trim());
    setCustomName('');
    refresh();
    onToast(`Kariyer "${slotId.toUpperCase()}" slotuna kaydedildi.`);
  };

  const handleLoad = (slotId: string) => {
    const loaded = loadFromSlot(slotId);
    if (!loaded) {
      onToast('Kayıt dosyası okunamadı.');
      return;
    }
    soundFx.draftLock();
    onLoadState(loaded, 'Kayıtlı kariyer yüklendi.');
    onClose();
  };

  const handleDelete = (slotId: string) => {
    soundFx.click();
    deleteSaveSlot(slotId);
    refresh();
    onToast('Kayıt slotu silindi.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#121722] border border-white/[0.12] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Save className="w-4 h-4 text-[#E4BD67]" />
            <h3 className="font-display text-xl font-bold text-white tracking-wide">
              Kariyer Kayıt Yönetimi
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {currentState && (
            <div className="flex items-center gap-3 pb-3 border-b border-white/[0.08]">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="İsteğe bağlı kayıt etiketi (Örn: Worlds Finali Öncesi)..."
                className="flex-1 bg-[#0B0E14] border border-white/[0.1] rounded-md px-3 py-2 text-xs text-white outline-none focus:border-[#C89B3C]"
              />
            </div>
          )}

          <div className="divide-y divide-white/[0.07] border border-white/[0.08] rounded-md">
            {slots.map((slot: any) => {
              const rec = slot.record;
              return (
                <div key={slot.slotId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {rec ? (
                      <TeamCrest tag={rec.teamTag} color={rec.teamColor} color2={rec.teamColor2} size="sm" />
                    ) : (
                      <div className="w-8 h-8 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[10px] text-slate-500 font-mono-num">
                        BOŞ
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {slot.slotId === 'autosave' ? 'Otomatik Kayıt' : `Slot ${slot.slotId.replace('slot', '')}`}
                        {rec?.name ? ` · ${rec.name}` : ''}
                      </div>
                      {rec ? (
                        <div className="text-[11px] text-slate-400 font-mono-num truncate">
                          {rec.teamName} ({rec.managerName || 'Koç'}) · S{rec.season} {rec.phaseLabel} H{rec.week} · {rec.savedAt}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500">Boş kayıt yuvası</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {currentState && slot.slotId !== 'autosave' && (
                      <button
                        onClick={() => handleSave(slot.slotId)}
                        className="px-3 py-1.5 rounded-md bg-[#171E2C] hover:bg-[#222C40] border border-white/[0.12] text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Save className="w-3.5 h-3.5 text-[#E4BD67]" />
                        Kaydet
                      </button>
                    )}
                    {rec && (
                      <>
                        <button
                          onClick={() => handleLoad(slot.slotId)}
                          className="px-3 py-1.5 rounded-md bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          Yükle
                        </button>
                        <button
                          onClick={() => handleDelete(slot.slotId)}
                          className="p-1.5 rounded-md border border-white/[0.1] hover:border-rose-500/60 text-slate-400 hover:text-rose-400 cursor-pointer"
                          title="Kaydı sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

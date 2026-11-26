import React, { useMemo, useState } from 'react';
import { Mic, X, CheckCircle2 } from 'lucide-react';
import { generatePressConference, PressChoice } from '../engine/fmExtensions';
import { addInboxMessage, bumpManagerRep } from '../engine/gameEngine.js';
import { soundFx } from '../engine/soundFx';

interface PressConferenceModalProps {
  state: any;
  nextMatch: any;
  userTeam: any;
  onComplete: (summaryMsg: string) => void;
  onClose: () => void;
}

export const PressConferenceModal: React.FC<PressConferenceModalProps> = ({
  state,
  nextMatch,
  userTeam,
  onComplete,
  onClose,
}) => {
  const questions = useMemo(() => generatePressConference(state, nextMatch, userTeam), [state, nextMatch, userTeam]);
  const [qIdx, setQIdx] = useState(0);
  const [totals, setTotals] = useState({ morale: 0, synergy: 0, fanbase: 0, board: 0 });
  const [finished, setFinished] = useState(false);

  const currentQ = questions[qIdx];

  const handleAnswer = (choice: PressChoice) => {
    soundFx.click();
    const nextTotals = {
      morale: totals.morale + choice.moraleDelta,
      synergy: totals.synergy + choice.synergyDelta,
      fanbase: totals.fanbase + choice.fanbaseDelta,
      board: totals.board + choice.boardDelta,
    };
    setTotals(nextTotals);

    if (qIdx + 1 >= questions.length) {
      // Apply cumulative press conference effects directly to career state
      const roster = state.players.filter((p: any) => p.teamId === userTeam.id);
      roster.forEach((p: any) => {
        p.morale = Math.max(25, Math.min(100, (p.morale || 75) + nextTotals.morale));
      });
      userTeam.synergy = Math.max(30, Math.min(100, (userTeam.synergy || 70) + nextTotals.synergy));
      userTeam.fanbase = Math.max(10, Math.min(100, (userTeam.fanbase || 60) + nextTotals.fanbase));
      state.pressDoneWeek = `${state.season}_${state.phase}_${state.week}`;
      bumpManagerRep(state, 0.5, 'mediaRep', 1.5);
      addInboxMessage(state, {
        title: `Basın Toplantısı Özeti — ${userTeam.tag} Medya Yansımaları`,
        sender: 'Medya İlişkileri',
        category: 'MEDIA',
        body: `Koç ${state.managerName} maç öncesi basın toplantısını tamamladı. Etkiler: Moral ${nextTotals.morale >= 0 ? '+' : ''}${nextTotals.morale}, Sinerji ${nextTotals.synergy >= 0 ? '+' : ''}${nextTotals.synergy}, Taraftar ${nextTotals.fanbase >= 0 ? '+' : ''}${nextTotals.fanbase}.`,
      });
      soundFx.objectiveSecured();
      setFinished(true);
    } else {
      setQIdx(qIdx + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#121722] border border-white/[0.12] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Mic className="w-4 h-4 text-[#E4BD67]" />
            <h3 className="font-display text-xl font-bold text-white tracking-wide">
              Maç Öncesi Basın Toplantısı
            </h3>
            <span className="text-xs text-slate-400 font-mono-num">
              · Soru {Math.min(qIdx + 1, questions.length)}/{questions.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-md cursor-pointer"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {!finished ? (
            <div className="space-y-5">
              <div className="pb-4 border-b border-white/[0.08]">
                <div className="text-xs text-[#E4BD67] font-semibold">
                  {currentQ.journalist} · {currentQ.outlet}
                </div>
                <p className="text-base font-medium text-white mt-2 leading-relaxed">
                  “{currentQ.question}”
                </p>
              </div>

              <div className="space-y-2.5">
                {currentQ.choices.map((c, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(c)}
                    className="w-full text-left p-4 rounded-md border border-white/[0.08] bg-[#171E2C]/60 hover:bg-[#1C2536] hover:border-[#C89B3C]/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-[#E4BD67]">{c.tone} Ton</span>
                      <span className="text-[11px] text-slate-400 font-mono-num">{c.effectSummary}</span>
                    </div>
                    <p className="text-sm text-slate-200 leading-snug">{c.text}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5 text-center py-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <div>
                <h4 className="font-display text-2xl font-bold text-white">Basın Toplantısı Tamamlandı</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Açıklamaların sosyal medyada ve soyunma odasında yankı buldu.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 border-t border-b border-white/[0.08] py-4 font-mono-num">
                <div>
                  <div className="text-xs text-slate-400">Takım Morali</div>
                  <div className={`text-lg font-bold ${totals.morale >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {totals.morale >= 0 ? `+${totals.morale}` : totals.morale}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Sinerji</div>
                  <div className={`text-lg font-bold ${totals.synergy >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {totals.synergy >= 0 ? `+${totals.synergy}` : totals.synergy}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Taraftar</div>
                  <div className={`text-lg font-bold ${totals.fanbase >= 0 ? 'text-[#E4BD67]' : 'text-rose-400'}`}>
                    {totals.fanbase >= 0 ? `+${totals.fanbase}` : totals.fanbase}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onComplete('Basın toplantısı tamamlandı ve takım morali güncellendi.')}
                className="px-5 py-2.5 rounded-md bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] font-bold text-xs cursor-pointer"
              >
                Genel Bakışa Dön
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

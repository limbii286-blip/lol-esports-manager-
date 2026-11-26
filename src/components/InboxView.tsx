import React, { useMemo, useState } from 'react';
import { Mail, MessageCircle, Heart, Repeat2, Radio, CheckCheck, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { executeInboxAction, markAllNotificationsRead } from '../engine/gameEngine.js';
import { soundFx } from '../engine/soundFx';
import { NavTab } from '../types/game';

interface InboxViewProps {
  state: any;
  onUpdate: (msg?: string) => void;
  onNavigate?: (tab: NavTab) => void;
  onOpenPlayer?: (playerId: string) => void;
}

export const InboxView: React.FC<InboxViewProps> = ({ state, onUpdate, onNavigate, onOpenPlayer }) => {
  const [viewMode, setViewMode] = useState<'inbox' | 'social'>('inbox');
  const [catFilter, setCatFilter] = useState<string>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(() => state.inbox?.[0]?.id || null);

  const messages = useMemo(() => {
    const list = state.inbox || [];
    if (catFilter === 'ALL') return list;
    if (catFilter === 'URGENT') {
      return list.filter((m: any) => m.priority === 'URGENT' || m.priority === 'HIGH');
    }
    return list.filter((m: any) => m.category === catFilter);
  }, [state.inbox, catFilter]);

  const socialPosts = state.socialFeed || [];

  const activeMsg = useMemo(
    () => messages.find((m: any) => m.id === selectedId) || messages[0] || null,
    [messages, selectedId]
  );

  const handleSelect = (msg: any) => {
    setSelectedId(msg.id);
    if (!msg.read) {
      msg.read = true;
      const n = (state.notifications || []).find((x: any) => x.msgId === msg.id);
      if (n) n.read = true;
      onUpdate();
    }
  };

  const handleMarkAllRead = () => {
    soundFx.click();
    markAllNotificationsRead(state);
    onUpdate('Tüm bildirimler ve mesajlar okundu olarak işaretlendi.');
  };

  const handleActionClick = (msgId: string, actionId: string) => {
    soundFx.draftLock();
    const res = executeInboxAction(state, msgId, actionId);
    if (res.nav && onNavigate) {
      onUpdate();
      onNavigate(res.nav as NavTab);
      return;
    }
    if (res.openPlayerId && onOpenPlayer) {
      onUpdate();
      onOpenPlayer(res.openPlayerId);
      return;
    }
    onUpdate(res.msg);
  };

  const getBadge = (m: any) => {
    const hasDecision = Array.isArray(m.actions) && m.actions.some((a: any) => a.type !== 'NAV' && a.type !== 'OPEN_PLAYER') && !m.actionTaken;
    if (m.priority === 'URGENT') return { label: 'ACİL', cls: 'text-rose-400' };
    if (hasDecision) return { label: 'KARAR', cls: 'text-amber-400' };
    if (m.category === 'TOURNAMENT') return { label: 'RAPOR', cls: 'text-sky-400' };
    return null;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="text-xs text-[#E4BD67] font-semibold">
            Kulüp İletişim, Basın & X / Reddit Sosyal Akış
          </div>
          <h1 className="font-display text-3xl font-extrabold text-white tracking-wide mt-0.5">
            {viewMode === 'inbox' ? 'Gelen Kutusu' : 'Sosyal Medya & Tier-1 Sızıntılar'}
          </h1>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#121722] border border-white/[0.08] rounded-lg w-fit">
          <button
            onClick={() => setViewMode('inbox')}
            className={`px-3.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              viewMode === 'inbox' ? 'bg-[#C89B3C] text-[#0B0E14]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Gelen Kutusu ({(state.inbox || []).length})
          </button>
          <button
            onClick={() => setViewMode('social')}
            className={`px-3.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              viewMode === 'social' ? 'bg-[#C89B3C] text-[#0B0E14]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            X / Reddit Akışı ({socialPosts.length})
          </button>
        </div>
      </div>

      {viewMode === 'inbox' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 bg-[#121722] border border-white/[0.08] rounded-lg w-fit overflow-x-auto max-w-full">
              {[
                { id: 'ALL', label: 'Tümü' },
                { id: 'URGENT', label: 'Acil' },
                { id: 'BOARD', label: 'Yönetim' },
                { id: 'TRANSFER', label: 'Transfer' },
                { id: 'TOURNAMENT', label: 'Turnuva' },
                { id: 'NEWS', label: 'Basın & Haber' },
                { id: 'PATCH', label: 'Yama' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCatFilter(c.id)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer whitespace-nowrap ${
                    catFilter === c.id ? 'bg-[#C89B3C] text-[#0B0E14]' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleMarkAllRead}
              className="px-3 py-1.5 rounded-md border border-white/[0.1] bg-[#121722] hover:border-[#C89B3C]/60 text-xs text-slate-300 hover:text-[#E4BD67] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Tümünü Okundu İşaretle
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Mail List */}
            <div className="lg:col-span-5 bg-[#121722] border border-white/[0.08] rounded-lg divide-y divide-white/[0.06] max-h-[620px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">Bu kategoride mesaj bulunmuyor.</div>
              ) : (
                messages.map((m: any) => {
                  const selected = activeMsg?.id === m.id;
                  const badge = getBadge(m);
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelect(m)}
                      className={`w-full text-left p-4 transition-colors cursor-pointer ${
                        selected ? 'bg-[#171E2C]' : 'hover:bg-white/[0.02]'
                      } ${!m.read ? 'border-l-2 border-l-[#E4BD67]' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className={selected ? 'text-[#E4BD67] font-semibold' : 'text-slate-400'}>
                          {m.sender} · {m.category}
                          {badge && (
                            <span className={`ml-2 font-mono-num font-bold ${badge.cls}`}>{badge.label}</span>
                          )}
                        </span>
                        <span className="font-mono-num text-slate-500">
                          S{m.season || state.season} H{m.week || state.week}
                        </span>
                      </div>
                      <div className={`text-xs mt-1 truncate ${!m.read ? 'font-bold text-white' : 'font-medium text-slate-300'}`}>
                        {m.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate">{m.body}</div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Message Reader */}
            <div className="lg:col-span-7 bg-[#121722] border border-white/[0.08] rounded-lg p-6 min-h-[380px]">
              {activeMsg ? (
                <div className="space-y-4">
                  <div className="border-b border-white/[0.08] pb-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-[#E4BD67] font-semibold">
                        {activeMsg.sender} · {activeMsg.category}
                      </div>
                      {activeMsg.priority === 'URGENT' && (
                        <span className="text-[10px] font-mono-num font-bold text-rose-400">ACİL ÖNCELİK</span>
                      )}
                      {activeMsg.priority === 'HIGH' && (
                        <span className="text-[10px] font-mono-num font-bold text-amber-400">ÖNEMLİ</span>
                      )}
                    </div>
                    <h2 className="font-display text-2xl font-bold text-white mt-1">{activeMsg.title}</h2>
                    <div className="text-[11px] text-slate-500 font-mono-num mt-1">
                      Sezon {activeMsg.season || state.season} · Hafta {activeMsg.week || state.week}
                    </div>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{activeMsg.body}</p>

                  {Array.isArray(activeMsg.actions) && activeMsg.actions.length > 0 && (
                    <div className="pt-4 border-t border-white/[0.08] space-y-2.5">
                      {activeMsg.actionTaken && (
                        <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          Karar verildi: {activeMsg.actionTaken}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {activeMsg.actions.map((a: any) => {
                          const isNav = a.type === 'NAV' || a.type === 'OPEN_PLAYER';
                          const disabled = !isNav && Boolean(activeMsg.actionTaken);
                          return (
                            <button
                              key={a.id}
                              disabled={disabled}
                              onClick={() => handleActionClick(activeMsg.id, a.id)}
                              className={`px-3.5 py-2 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                                disabled
                                  ? 'bg-[#0B0E14]/50 border border-white/[0.06] text-slate-600 cursor-not-allowed'
                                  : a.style === 'primary' || !isNav
                                  ? 'bg-[#C89B3C] hover:bg-[#D9AC4A] text-[#0B0E14] cursor-pointer'
                                  : 'bg-[#171E2C] hover:bg-[#222D42] border border-white/[0.12] text-slate-200 cursor-pointer'
                              }`}
                            >
                              {a.label}
                              {isNav && <ArrowUpRight className="w-3.5 h-3.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16">
                  <Mail className="w-8 h-8 mb-2 opacity-40" />
                  <span className="text-xs">Okumak için sol listeden bir mesaj seç.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* X / REDDIT SOCIAL MEDIA & TIER-1 TRANSFER LEAKS FEED */
        <div className="bg-[#121722] border border-white/[0.08] rounded-lg divide-y divide-white/[0.07]">
          {socialPosts.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">
              Maçlar ve transferler ilerledikçe taraftar tepkileri ve Tier-1 gazeteci sızıntıları burada akacak.
            </div>
          ) : (
            socialPosts.map((post: any) => (
              <div key={post.id} className="p-4 sm:p-5 space-y-2 hover:bg-white/[0.015] transition-colors">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`font-mono-num text-[10px] font-bold ${
                        post.platform === 'REDDIT' ? 'text-orange-400' : 'text-sky-400'
                      }`}
                    >
                      {post.platform}
                    </span>
                    <span className="font-bold text-white truncate">{post.author}</span>
                    <span className="text-slate-500 font-mono-num truncate">{post.handle}</span>
                  </div>
                  <span className="text-[11px] font-mono-num text-[#E4BD67] shrink-0">
                    {post.badge} · S{post.season} H{post.week}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{post.body}</p>
                <div className="flex items-center gap-5 text-[11px] font-mono-num text-slate-500 pt-1">
                  <span className="inline-flex items-center gap-1">
                    <Heart className="w-3 h-3" /> {post.likes}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" /> {post.replies}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Repeat2 className="w-3 h-3" /> {Math.round((post.likes || 200) * 0.24)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

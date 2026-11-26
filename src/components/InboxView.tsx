import React, { useMemo, useState } from 'react';
import { Mail, MessageCircle, Heart, Repeat2, Radio } from 'lucide-react';

interface InboxViewProps {
  state: any;
  onUpdate: () => void;
}

export const InboxView: React.FC<InboxViewProps> = ({ state, onUpdate }) => {
  const [viewMode, setViewMode] = useState<'inbox' | 'social'>('inbox');
  const [catFilter, setCatFilter] = useState<string>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(() => state.inbox?.[0]?.id || null);

  const messages = useMemo(() => {
    const list = state.inbox || [];
    if (catFilter === 'ALL') return list;
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
      onUpdate();
    }
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
          <div className="flex items-center gap-1 p-1 bg-[#121722] border border-white/[0.08] rounded-lg w-fit overflow-x-auto max-w-full">
            {[
              { id: 'ALL', label: 'Tümü' },
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Mail List */}
            <div className="lg:col-span-5 bg-[#121722] border border-white/[0.08] rounded-lg divide-y divide-white/[0.06] max-h-[620px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">Bu kategoride mesaj bulunmuyor.</div>
              ) : (
                messages.map((m: any) => {
                  const selected = activeMsg?.id === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelect(m)}
                      className={`w-full text-left p-4 transition-colors cursor-pointer ${
                        selected ? 'bg-[#171E2C]' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className={selected ? 'text-[#E4BD67] font-semibold' : 'text-slate-400'}>
                          {m.sender} · {m.category}
                        </span>
                        <span className="font-mono-num text-slate-500">
                          S{m.season || state.season} H{m.week || state.week}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-white mt-1 truncate">{m.title}</div>
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
                    <div className="text-xs text-[#E4BD67] font-semibold">
                      {activeMsg.sender} · {activeMsg.category}
                    </div>
                    <h2 className="font-display text-2xl font-bold text-white mt-1">{activeMsg.title}</h2>
                    <div className="text-[11px] text-slate-500 font-mono-num mt-1">
                      Sezon {activeMsg.season || state.season} · Hafta {activeMsg.week || state.week}
                    </div>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{activeMsg.body}</p>
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

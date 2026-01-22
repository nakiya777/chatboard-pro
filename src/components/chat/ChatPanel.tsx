import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Send, Reply, Edit2, Trash2, Link as LinkIcon, X, MessageSquare, Grip } from 'lucide-react';
import { User } from 'firebase/auth';
import { Message, Annotation, ColorSystem, ThemeStyles } from '../../types';

// Add onClose to props interface
interface ChatPanelProps {
  // ... existing props
  activeDocId: string | null;
  messages: Message[];
  user: User | null;
  sys: ColorSystem;
  currentTheme: ThemeStyles;
  t: (key: string) => string;
  chatInput: string;
  setChatInput: (v: string) => void;
  handleSendChat: () => void;
  replyToId: string | null;
  setReplyToId: (id: string | null) => void;
  editingMessageId: string | null;
  setEditingMessageId: (id: string | null) => void;
  handleDeleteMessage: (id: string) => void;
  linkModeMsgId: string | null;
  setLinkModeMsgId: (id: string | null) => void;
  annotations: Annotation[];
  setSelectedIds: (ids: string[]) => void;
  setActiveAnnotationIds: (ids: string[]) => void;
  onClose: () => void;
  handleUnlinkAnnotation: (msgId: string, annId: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  activeDocId, messages, user, sys, currentTheme, t,
  chatInput, setChatInput, handleSendChat,
  replyToId, setReplyToId, editingMessageId, setEditingMessageId,
  handleDeleteMessage, linkModeMsgId, setLinkModeMsgId,
  annotations, setSelectedIds, setActiveAnnotationIds,
  onClose, handleUnlinkAnnotation
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Resize State
  const [size, setSize] = useState({ width: 384, height: 600 });
  const isResizingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0, w: 0, h: 0 });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    startPosRef.current = { x: e.clientX, y: e.clientY, w: size.width, h: size.height };

    const handleMouseMove = (ev: MouseEvent) => {
        if (!isResizingRef.current) return;
        const dx = startPosRef.current.x - ev.clientX; // Leftward drag increases width
        const dy = startPosRef.current.y - ev.clientY; // Upward drag increases height
        
        setSize({
            width: Math.max(300, Math.min(800, startPosRef.current.w + dx)),
            height: Math.max(400, Math.min(window.innerHeight - 100, startPosRef.current.h + dy))
        });
    };

    const handleMouseUp = () => {
        isResizingRef.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [size]);

  const docMessages = activeDocId ? messages.filter(m => m.docId === activeDocId) : [];
  const validMessages = docMessages.reduce((acc: Message[], m) => {
    if (!m.parentId) acc.push(m);
    else {
      const pIdx = acc.findIndex(p => p.id === m.parentId);
      if (pIdx >= 0) acc.splice(pIdx + 1, 0, m);
      else acc.push(m);
    }
    return acc;
  }, []);

  if (!activeDocId) return null;

  return (
    <div className={`flex flex-col transition-colors overflow-hidden z-20 ${currentTheme.raised} shadow-2xl relative`} 
         style={{ 
             borderRadius: '2rem', 
             width: size.width,
             height: size.height
         }}>
      
      {/* Resize Handle (Top-Left) */}
      <div 
        onMouseDown={handleResizeStart}
        className="absolute top-0 left-0 w-8 h-8 cursor-nw-resize flex items-center justify-center text-slate-400 hover:text-slate-600 z-50 hover:bg-black/5 rounded-tl-[2rem] rounded-br-xl"
        title="Resize"
      >
        <Grip size={16} className="-rotate-45" />
      </div>
      
      {/* Header */}
      <div className="p-5 border-b border-black/5 shrink-0 flex items-center justify-between">
        <h2 className={`font-black tracking-tight text-lg flex items-center gap-2 ${currentTheme.textClass}`}>
          <MessageSquare size={20} className="text-indigo-500" fill="currentColor" fillOpacity={0.2} style={{ color: sys.accent }} />
          Team Chat
        </h2>
        <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/5 text-slate-400 hover:text-slate-600 transition-colors"
        >
            <X size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {validMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                <div className="p-4 rounded-full bg-slate-50">
                    <MessageSquare size={32} />
                </div>
                <span className="text-xs font-medium">{t('noMessages')}</span>
            </div>
        )}

        {validMessages.map(m => {
          const isSelf = user?.uid === m.authorId;
          return (
            <div key={m.id} className={`group flex flex-col gap-1 transition-all animate-in slide-in-from-bottom-2 fade-in duration-300`} style={{ marginLeft: m.depth ? `${m.depth * 10}px` : '0', alignItems: isSelf ? 'flex-end' : 'flex-start' }}>
              
              <div className="flex items-center gap-2 px-1 mb-1">
                {/* Avatar Placeholder */}
                {!isSelf && <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-500 uppercase">{m.author.slice(0, 2)}</div>}
                
                <div className="flex flex-col">
                    {!isSelf && <span className={`text-[10px] font-bold ${sys.textSecondary} ml-1`}>{m.author}</span>}
                </div>
              </div>

              <div className={`p-4 max-w-[85%] relative group/msg transition-all shadow-sm ${isSelf ? 'rounded-[1.5rem] rounded-tr-md bg-indigo-500 text-white' : 'rounded-[1.5rem] rounded-tl-md bg-white text-slate-700'}`} 
                   style={{ 
                     backgroundColor: isSelf ? sys.accent : '#ffffff', 
                     color: isSelf ? '#fff' : '#334155',
                     border: m.id === editingMessageId ? `2px solid ${sys.accent}` : 'none',
                     boxShadow: isSelf ? `0 4px 12px ${sys.shadow}40` : '0 2px 8px rgba(0,0,0,0.05)'
                   }}>
                
                <p className="text-sm font-medium leading-relaxed break-words whitespace-pre-wrap">{m.content}</p>
                
                {m.isEdited && <span className="text-[9px] opacity-70 block text-right mt-1 italic">({t('edited')})</span>}
                
                {m.annotationIds && m.annotationIds.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1 pt-2 border-t border-white/20">
                    {m.annotationIds.map(aid => {
                      const ann = annotations.find(a => a.id === aid);
                      if (!ann) return null;
                      const typeIcon = { rect: '▀', circle: '●', text: 'T', arrow: '→', pencil: '✎', star: '★' }[ann.type] || '?';
                      return (
                        <div key={aid} 
                          className={`text-[9px] px-2 py-1 rounded-md flex items-center gap-1 transition-colors ${isSelf ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                        >
                          <button onClick={() => { setSelectedIds([aid]); setActiveAnnotationIds([aid]); }} className="flex items-center gap-1 hover:underline">
                            {typeIcon} <span>{ann.type}</span>
                          </button>
                          {isSelf && (
                             <button 
                               onClick={(e) => { e.stopPropagation(); handleUnlinkAnnotation(m.id, aid); }} 
                               className="hover:text-red-300 ml-1 p-0.5 rounded-full hover:bg-white/20" 
                               title={t('cancelLink')}
                             >
                                <X size={10} />
                             </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Hover Actions */}
                <div className={`absolute -top-3 ${isSelf ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'} opacity-0 group-hover/msg:opacity-100 flex gap-1 transition-all z-10`}>
                  <button onClick={() => setReplyToId(m.id)} className={`p-1.5 rounded-full bg-white text-slate-500 shadow-md hover:scale-110 transition-transform border border-slate-100`} title={t('reply')}><Reply size={12} /></button>
                  {isSelf && (
                    <>
                      <button onClick={() => { setEditingMessageId(m.id); setChatInput(m.content); setReplyToId(null); }} className={`p-1.5 rounded-full bg-white text-blue-500 shadow-md hover:scale-110 transition-transform border border-slate-100`} title={t('editMessage')}><Edit2 size={12} /></button>
                      <button onClick={() => handleDeleteMessage(m.id)} className={`p-1.5 rounded-full bg-white text-red-500 shadow-md hover:scale-110 transition-transform border border-slate-100`} title={t('deleteMessage')}><Trash2 size={12} /></button>
                    </>
                  )}
                  {isSelf && (
                     <button onClick={() => setLinkModeMsgId(linkModeMsgId === m.id ? null : m.id)} className={`p-1.5 rounded-full shadow-md hover:scale-110 transition-transform border border-slate-100 ${linkModeMsgId === m.id ? 'bg-indigo-500 text-white' : 'bg-white text-purple-500'}`} title={t('linkAnnotation')}><LinkIcon size={12} /></button>
                  )}
                </div>
              </div>
              
              <span className={`text-[9px] font-bold px-1 ${sys.textSecondary}`}>{m.createdAt ? new Date(m.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className={`p-4 shrink-0 mt-auto bg-white/50 backdrop-blur-sm`} style={{ borderTop: '1px solid rgba(0,0,0,0.03)' }}>
        {replyToId && (
          <div className="mb-2 flex items-center justify-between text-[10px] bg-slate-100 p-2 rounded-lg text-slate-500 animate-in slide-in-from-bottom-2">
            <span className="flex items-center gap-1"><Reply size={10}/> {t('replying')}</span>
            <button onClick={() => setReplyToId(null)} className="hover:text-slate-800"><X size={12} /></button>
          </div>
        )}
        {editingMessageId && (
          <div className="mb-2 flex items-center justify-between text-[10px] bg-blue-50 p-2 rounded-lg text-blue-500 font-bold border border-blue-100 animate-in slide-in-from-bottom-2">
            <span className="flex items-center gap-1"><Edit2 size={10}/> {t('updating')}</span>
            <button onClick={() => { setEditingMessageId(null); setChatInput(""); }} className="hover:text-blue-700"><X size={12} /></button>
          </div>
        )}
        
        <div className={`flex items-center gap-2 p-1.5 rounded-[2rem] transition-all bg-white shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300`}>
          <input 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
            placeholder={activeDocId ? t('writeMsg') : t('selectDocFirst')}
            disabled={!activeDocId}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium px-4 py-2 text-slate-700 placeholder:text-slate-400"
          />
          <button 
            onClick={handleSendChat}
            disabled={!activeDocId || !chatInput.trim()}
            className={`p-2.5 rounded-full transition-all text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:shadow-none bg-indigo-600 flex items-center justify-center`}
            style={{ backgroundColor: sys.accent, width: '40px', height: '40px' }}
          >
            <Send size={16} className={chatInput.trim() ? "translate-x-0.5" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
};

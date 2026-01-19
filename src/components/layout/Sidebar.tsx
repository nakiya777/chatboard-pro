import React from 'react';
import { Menu, Layers, Settings, Plus, ImageIcon, Eraser, Sliders, ArrowLeft } from 'lucide-react';
import { DocData, ThemeStyles, ColorSystem } from '../../types';

interface SidebarProps {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (v: boolean) => void;
  currentTheme: ThemeStyles;
  sys: ColorSystem;
  t: (key: string) => string;
  documents: DocData[];
  activeDocId: string | null;
  setActiveDocId: (id: string | null) => void;
  setSelectedIds: (ids: string[]) => void;
  openEditModal: (doc: DocData) => void;
  openAddModal: () => void;
  setIsSettingsOpen: (v: boolean) => void;
  onBackToProjects: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isSidebarCollapsed, setIsSidebarCollapsed,
  currentTheme, sys, t,
  documents, activeDocId, setActiveDocId, setSelectedIds,
  openEditModal, openAddModal, setIsSettingsOpen, onBackToProjects
}) => {
  return (
    <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-80'} ${currentTheme.raised} flex flex-col shrink-0 overflow-hidden z-30 transition-all duration-500`} style={{ borderRadius: currentTheme.radius, backgroundColor: sys.base }}>
      <div className={`p-6 border-b border-white/10 flex flex-col gap-4`}>
        {!isSidebarCollapsed && (
          <button onClick={onBackToProjects} className={`flex items-center gap-2 text-xs font-bold transition-all ${sys.textSecondary} hover:${currentTheme.textClass} -ml-2 px-2 py-1 rounded-lg hover:bg-black/5`}>
            <ArrowLeft size={14} />
            <span>Projects</span>
          </button>
        )}
        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="cursor-pointer flex items-center gap-3 transition-all" role="button" tabIndex={0}>
            <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center ${currentTheme.raisedSm}`} style={{ color: sys.accent }}>{isSidebarCollapsed ? <Menu size={24} /> : <Layers size={24} />}</div>
            {!isSidebarCollapsed && <h1 className={`font-black tracking-tighter text-xl uppercase ${currentTheme.textClass}`}>ChatBoard</h1>}
          </div>
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-1">
              <button onClick={openAddModal} className={`p-3 rounded-xl opacity-60 hover:opacity-100 transition-all ${currentTheme.raisedSm}`} style={{ color: sys.accent }}><Plus size={18} /></button>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {documents.map(d => (
          <div key={d.id} onClick={() => { setActiveDocId(d.id); setSelectedIds([]); }} role="button" tabIndex={0} className={`p-4 cursor-pointer transition-all group ${isSidebarCollapsed ? 'justify-center' : ''} ${activeDocId === d.id ? currentTheme.pressed : 'hover:scale-[0.98] opacity-60'}`} style={{ borderRadius: currentTheme.radius }}>
            <div className={`flex items-start ${isSidebarCollapsed ? 'justify-center' : 'gap-4'}`}>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${currentTheme.raisedSm}`} style={{ color: activeDocId === d.id ? sys.accent : '#94a3b8' }}>{d.url ? <ImageIcon size={20} /> : <Eraser size={20} />}</div>
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0 flex flex-col gap-0.5 animate-in fade-in">
                  <p className={`text-[10px] font-bold uppercase ${sys.textSecondary}`}>{d.createdAt ? new Date(d.createdAt.seconds * 1000).toLocaleDateString() : '--/--/--'}</p>
                  <p className={`text-sm font-black leading-tight truncate ${currentTheme.textClass}`}>{d.threadName || d.title || d.fileName}</p>
                  <p className={`text-[11px] font-medium truncate ${sys.textSecondary}`}>{d.url ? d.fileName : t('whiteboard')}</p>
                </div>
              )}
              {!isSidebarCollapsed && <button onClick={(e) => { e.stopPropagation(); openEditModal(d); }} className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${currentTheme.raisedSm}`} style={{ color: sys.accent }}><Sliders size={14} /></button>}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Plus, MousePointer2, ArrowUpRight, Square, Circle, Type, Send, 
  MessageSquare, Image as ImageIcon, Trash2, ZoomIn, ZoomOut, 
  Maximize2, Layers, X, Check, User, Settings, 
  Edit2, Reply, Link, Globe, MessageCircle, 
  Sliders, Eraser, Star, Menu, Pencil, Bold, Italic, FileText, Upload,
  Database, Shield, LogOut, Save
} from 'lucide-react';
import { 
  collection, doc, addDoc, onSnapshot, 
  serverTimestamp, updateDoc, deleteDoc, setDoc, 
  Unsubscribe, Firestore
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';

import { ANNOTATION_COLORS, THEME_MODES, COLOR_SYSTEMS, TRANSLATIONS } from './constants';
import { DocData, Annotation, Message, Presence, ThemeStyles, ColorSystem } from './types';
import { UserProfile } from './services/authService';

interface AppProps {
  user: FirebaseUser;
  userProfile: UserProfile | null;
  projectId: string;
  db: Firestore;
  onLogout: () => void;
  onBackToProjects: () => void;
  theme: string;
  setTheme: (t: string) => void;
  colorSystem: string;
  setColorSystem: (c: string) => void;
  language: string;
  setLanguage: (l: string) => void;
}

import { Sidebar } from './components/layout/Sidebar';
import { ChatPanel } from './components/chat/ChatPanel';
import { CanvasArea } from './components/whiteboard/CanvasArea';
import { SettingsModal } from './components/modals/SettingsModal';
import { DocumentModal } from './components/modals/DocumentModal';
import { TextEditModal } from './components/modals/TextEditModal';

import { useFirestoreSync } from './hooks/useFirestoreSync';
import { useWhiteboard } from './hooks/useWhiteboard';
import { useChat } from './hooks/useChat';
import { useAppModals } from './hooks/useAppModals';

// ==========================================
// --- Helper Components ---
// ==========================================
// (Moved to components/whiteboard/)

// ==========================================
// --- Main Component ---
// ==========================================

export default function App({ 
  user, userProfile, projectId, db, onLogout, onBackToProjects,
  theme, setTheme, colorSystem, setColorSystem, language, setLanguage
}: AppProps) {

  // --- States ---
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);

  // --- Data Sync ---
  const { documents, annotations, messages, presence } = useFirestoreSync(user, db, projectId);

  // --- Derived State ---
  const sys = COLOR_SYSTEMS[colorSystem] || COLOR_SYSTEMS.standard;
  const t = useCallback((key: string) => TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key, [language]);
  
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const activeDocData = useMemo(() => documents.find(d => d.id === activeDocId), [documents, activeDocId]);

  // --- Custom Hooks ---
  const whiteboard = useWhiteboard({ user, db, projectId, activeDocId, activeDocData, t });
  const chat = useChat({ user, db, projectId, activeDocId, messages });
  const modals = useAppModals({ user, db, projectId, t, setActiveDocId, activeDocId });

  // --- Interaction Adapters ---
  // Some links between hooks might be needed
  useEffect(() => {
    if (chat.linkModeMsgId) {
        // Link mode Logic can stay here or be moved.
        // For simplicity, we keep it integrated or handle inside hooks if possible.
        // But Whiteboard hook doesn't know about Chat Link mode directly unless passed.
    }
  }, [chat.linkModeMsgId]);

  const currentTheme: ThemeStyles = useMemo(() => {
    const isDark = colorSystem === 'midnight';
    const br = theme === 'claymorphism' ? '2.5rem' : theme === 'glassmorphism' ? '1.2rem' : '2rem';
    
    const styles: ThemeStyles = { radius: br, accent: sys.accent, textClass: sys.text, baseColor: sys.base, raised: '', raisedSm: '', pressed: '' };
    
    if (theme === 'neumorphism') {
      styles.raised = `shadow-[8px_8px_16px_${sys.shadow},-8px_-8px_16px_${sys.highlight}]`;
      styles.raisedSm = `shadow-[4px_4px_8px_${sys.shadow},-4px_-4px_8px_${sys.highlight}]`;
      styles.pressed = `shadow-[inset_6px_6px_12px_${sys.shadow},inset_-6px_-6px_12px_${sys.highlight}]`;
    } else if (theme === 'claymorphism') {
      styles.raised = `shadow-[12px_12px_24px_${sys.shadow},-12px_-12px_24px_${sys.highlight},inset_8px_8px_16px_rgba(255,255,255,${isDark ? 0.1 : 0.5}),inset_-8px_-8px_16px_rgba(0,0,0,0.05)]`;
      styles.raisedSm = `shadow-[6px_6px_12px_${sys.shadow},-6px_-6px_12px_${sys.highlight},inset_4px_4px_8px_rgba(255,255,255,${isDark ? 0.1 : 0.5})]`;
      styles.pressed = `shadow-[inset_8px_8px_16px_${sys.shadow},inset_-8px_-8px_16px_${sys.highlight}]`;
    } else {
      styles.raised = `${isDark ? 'bg-white/10' : 'bg-white/40'} backdrop-blur-xl border border-white/30 shadow-xl shadow-black/10`;
      styles.raisedSm = `${isDark ? 'bg-white/10' : 'bg-white/30'} backdrop-blur-md border border-white/30 shadow-lg`;
      styles.pressed = 'bg-black/10 backdrop-blur-sm border border-black/10 shadow-inner';
    }
    return styles;
  }, [theme, colorSystem, sys]);

  const determinedName = modals.modalData.useImage ? modals.modalData.fileName : t('whiteboard');
  const currentDeterminedDocNameLabel = !modals.modalData.useImage ? t('whiteboard') : (modals.modalData.fileName || t('whiteboard'));

  return (
    <div className="flex h-screen w-full transition-colors duration-700 font-sans select-none p-4 gap-4" style={{ backgroundColor: sys.base }}>
      <Sidebar 
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        currentTheme={currentTheme}
        sys={sys}
        t={t}
        documents={documents}
        activeDocId={activeDocId}
        setActiveDocId={setActiveDocId}
        setSelectedIds={whiteboard.setSelectedIds}
        openEditModal={modals.openEditModal}
        openAddModal={modals.openAddModal}
        setIsSettingsOpen={modals.setIsSettingsOpen}
        onBackToProjects={onBackToProjects}
      />

      <main ref={whiteboard.containerRef} className={`flex-1 ${currentTheme.pressed} relative overflow-hidden transition-all`} style={{ borderRadius: currentTheme.radius, backgroundColor: sys.base }}>
        <CanvasArea
          activeDocId={activeDocId}
          sys={sys}
          currentTheme={currentTheme}
          t={t}
          zoom={whiteboard.zoom}
          setZoom={whiteboard.setZoom}
          pan={whiteboard.pan}
          tool={whiteboard.tool}
          setTool={whiteboard.setTool}
          annotations={annotations}
          drawingShape={whiteboard.drawingShape}
          selectedIds={whiteboard.selectedIds}
          setSelectedIds={whiteboard.setSelectedIds}
          activeAnnotationIds={whiteboard.activeAnnotationIds}
          setActiveAnnotationIds={whiteboard.setActiveAnnotationIds}
          handleMouseDown={whiteboard.handleMouseDown}
          handleMouseMove={whiteboard.handleMouseMove}
          handleMouseUp={whiteboard.handleMouseUp}
          handleWheel={whiteboard.handleWheel}
          selectedShapes={annotations.filter(a => whiteboard.selectedIds.includes(a.id))}
          transforming={whiteboard.transforming}
          setTransforming={whiteboard.setTransforming}
          changeActiveColor={whiteboard.changeActiveColor}
          presence={presence}
          currentDeterminedDocNameLabel={currentDeterminedDocNameLabel}
          onFileChange={modals.onFileChange}
          ANNOTATION_COLORS={ANNOTATION_COLORS}
          defaults={whiteboard.defaults}
          svgRef={whiteboard.svgRef}
          onImageUpload={whiteboard.handleImageUpload}
          triggerImageUpload={whiteboard.triggerImageUpload}
          activeImageInputRef={whiteboard.activeImageInputRef}
          onOpenAddModal={modals.openAddModal}
          onDoubleClick={whiteboard.handleDoubleClick}
        />

        {/* Floating Chat Panel */}
        {isChatOpen && (
          <div className="absolute top-4 right-4 bottom-4 z-30 pointer-events-none flex flex-col justify-end items-end">
             {/* Note: ChatPanel itself will handle click events, wrapper is pointer-events-none to let clicks pass through to canvas where empty */}
             <div className="pointer-events-auto h-full"> 
                <ChatPanel
                  activeDocId={activeDocId}
                  messages={messages}
                  user={user}
                  sys={sys}
                  currentTheme={currentTheme}
                  t={t}
                  chatInput={chat.chatInput}
                  setChatInput={chat.setChatInput}
                  handleSendChat={chat.handleSendChat}
                  replyToId={chat.replyToId}
                  setReplyToId={chat.setReplyToId}
                  editingMessageId={chat.editingMessageId}
                  setEditingMessageId={chat.setEditingMessageId}
                  handleDeleteMessage={chat.handleDeleteMessage}
                  linkModeMsgId={chat.linkModeMsgId}
                  setLinkModeMsgId={chat.setLinkModeMsgId}
                  annotations={annotations}
                  setSelectedIds={whiteboard.setSelectedIds}
                  setActiveAnnotationIds={whiteboard.setActiveAnnotationIds}
                  onClose={() => setIsChatOpen(false)}
                />
             </div>
          </div>
        )}

        {/* Floating Chat Toggle Button */}
        {!isChatOpen && activeDocId && (
          <button
            onClick={() => setIsChatOpen(true)}
            className={`absolute bottom-6 right-6 p-4 rounded-full shadow-2xl z-40 transition-transform hover:scale-110 active:scale-95 text-white bg-indigo-600`}
            style={{ backgroundColor: sys.accent }}
          >
            <MessageSquare size={24} />
          </button>
        )}
      </main>

      <SettingsModal
        isOpen={modals.isSettingsOpen}
        onClose={() => modals.setIsSettingsOpen(false)}
        currentTheme={currentTheme}
        sys={sys}
        t={t}
        theme={theme}
        setTheme={setTheme}
        colorSystem={colorSystem}
        setColorSystem={setColorSystem}
        language={language}
        setLanguage={setLanguage}
        onBackToProjects={onBackToProjects}
        onLogout={onLogout}
        user={user}
        userProfile={userProfile}
        db={db}
      />

      <DocumentModal
        isOpen={modals.isDocModalOpen}
        onClose={() => modals.setIsDocModalOpen(false)}
        modalMode={modals.modalMode}
        modalData={modals.modalData}
        setModalData={modals.setModalData}
        currentTheme={currentTheme}
        sys={sys}
        t={t}
        handleModalSubmit={modals.handleModalSubmit}
        handleDeleteDoc={modals.handleDeleteDoc}
        onFileChange={modals.onFileChange}
        fileInputRef={modals.fileInputRef}
        currentDeterminedDocNameLabel={currentDeterminedDocNameLabel}
      />

      <TextEditModal
        editingTextId={whiteboard.editingTextId}
        setEditingTextId={whiteboard.setEditingTextId}
        textInput={whiteboard.textInput}
        setTextInput={whiteboard.setTextInput}
        textStyle={whiteboard.textStyle}
        setTextStyle={whiteboard.setTextStyle}
        handleTextSave={whiteboard.handleTextSave}
        onCancel={whiteboard.handleTextCancel}
        currentTheme={currentTheme}
        sys={sys}
        t={t}
        ANNOTATION_COLORS={ANNOTATION_COLORS}
      />
    </div>
  );
}
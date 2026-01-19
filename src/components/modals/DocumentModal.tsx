import React from 'react';
import { FileText, X, Upload } from 'lucide-react';
import { ThemeStyles, ColorSystem } from '../../types';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalMode: 'add' | 'edit';
  modalData: {
    id?: string;
    threadName: string;
    useImage: boolean;
    url: string;
    fileName: string;
    initialMsg: string;
  };
  setModalData: React.Dispatch<React.SetStateAction<{
    id?: string;
    threadName: string;
    useImage: boolean;
    url: string;
    fileName: string;
    initialMsg: string;
  }>>;
  currentTheme: ThemeStyles;
  sys: ColorSystem;
  t: (key: string) => string;
  handleModalSubmit: () => void;
  handleDeleteDoc: (id: string) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  currentDeterminedDocNameLabel: string;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen, onClose, modalMode, modalData, setModalData,
  currentTheme, sys, t, handleModalSubmit, handleDeleteDoc,
  onFileChange, fileInputRef, currentDeterminedDocNameLabel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
      <div className={`${currentTheme.raised} w-full max-w-xl p-10 flex flex-col gap-8`} style={{ borderRadius: currentTheme.radius, backgroundColor: sys.base }}>
        <div className="flex justify-between items-center">
          <h2 className={`text-2xl font-black uppercase flex items-center gap-3 ${currentTheme.textClass}`}>
            <FileText style={{ color: sys.accent }} />{modalMode === 'add' ? t('setupDoc') : t('editDoc')}
          </h2>
          <button onClick={onClose} className={`p-3 rounded-xl ${currentTheme.raisedSm} hover:text-red-500`} style={{ color: sys.accent }}>
            <X size={20} />
          </button>
        </div>
        <div className="space-y-6">
          <div>
            <label className={`text-[10px] font-black opacity-50 uppercase mb-3 block ${currentTheme.textClass}`}>1. {t('threadSubject')}</label>
            <input 
              value={modalData.threadName} 
              onChange={e => setModalData(p => ({...p, threadName: e.target.value}))} 
              className={`w-full p-5 rounded-2xl ${currentTheme.pressed} focus:outline-none text-sm font-bold bg-transparent ${currentTheme.textClass}`} 
              placeholder={t('subjectPlaceholder')} 
            />
          </div>
          {modalMode === 'add' && (
            <div>
              <label className={`text-[10px] font-black opacity-50 uppercase mb-3 block ${currentTheme.textClass}`}>2. {t('initialMsg')}</label>
              <textarea 
                value={modalData.initialMsg} 
                onChange={e => setModalData(p => ({...p, initialMsg: e.target.value}))} 
                className={`w-full p-5 rounded-2xl ${currentTheme.pressed} focus:outline-none text-sm font-bold resize-none bg-transparent ${currentTheme.textClass}`} 
                rows={3} 
                placeholder={t('discussionStartPlaceholder')} 
              />
            </div>
          )}
          <div className={`p-6 rounded-[2rem] border border-white/10 ${currentTheme.raisedSm}`}>
            <div className={`mb-4 text-[10px] font-black opacity-50 uppercase tracking-widest ${currentTheme.textClass}`}>3. DRAWING SETTINGS</div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button onClick={() => setModalData(p => ({ ...p, useImage: !p.useImage }))} className={`w-12 h-6 rounded-full transition-all relative ${modalData.useImage ? 'bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.4)]' : 'bg-slate-400 opacity-60'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${modalData.useImage ? 'left-7' : 'left-1'}`} />
                </button>
                <span className={`text-[10px] font-black uppercase ${currentTheme.textClass}`}>{modalData.useImage ? t('useImageLabel') : t('noImageLabel')}</span>
              </div>
              <span className={`text-xs font-black truncate max-w-[150px] ${currentTheme.textClass}`}>{currentDeterminedDocNameLabel}</span>
            </div>
            {modalMode === 'add' && modalData.useImage && (
              <div className="mt-6 pt-6 border-t border-white/10">
                {!modalData.url ? (
                  <button onClick={() => fileInputRef.current?.click()} className={`w-full py-10 rounded-2xl border-2 border-dashed border-black/10 flex flex-col items-center gap-3 hover:bg-white/20 ${currentTheme.pressed}`}>
                    <Upload size={24} className="opacity-20" />
                    <p className={`text-[10px] font-black opacity-40 uppercase ${currentTheme.textClass}`}>{t('selectFile')}</p>
                  </button>
                ) : (
                  <div className={`p-4 rounded-xl ${currentTheme.pressed} flex items-center justify-between animate-in zoom-in-95`}>
                    <div className="flex items-center gap-3">
                      <img src={modalData.url} className="w-12 h-12 rounded-lg object-cover shadow-md" alt="prev" />
                      <p className={`text-[10px] font-black truncate max-w-[200px] ${currentTheme.textClass}`}>{modalData.fileName}</p>
                    </div>
                    <button onClick={() => setModalData(p => ({...p, url: '', fileName: ''}))} className="font-black text-[10px] uppercase underline decoration-2" style={{ color: sys.accent }}>{t('changeFile')}</button>
                  </div>
                )}
                <input type="file" ref={fileInputRef} onChange={onFileChange} className="hidden" accept="image/*" />
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-4 pt-4">
          {modalMode === 'edit' && modalData.id && (
            <button onClick={() => handleDeleteDoc(modalData.id!)} className="flex-1 py-5 rounded-[1.5rem] bg-red-50 text-red-600 font-black uppercase text-xs shadow-lg">{t('deleteDoc')}</button>
          )}
          <button onClick={handleModalSubmit} className="flex-[2] py-5 rounded-[1.5rem] text-white font-black uppercase text-xs shadow-xl active:scale-95 disabled:opacity-20" style={{ backgroundColor: sys.accent }} disabled={modalMode === 'add' && modalData.useImage && !modalData.url}>
            {modalMode === 'add' ? t('startProject') : t('updateInfo')}
          </button>
        </div>
      </div>
    </div>
  );
};

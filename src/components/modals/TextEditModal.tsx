import React from 'react';
import { Type, X, Bold, Italic } from 'lucide-react';
import { ThemeStyles, ColorSystem } from '../../types';

interface TextEditModalProps {
  editingTextId: string | null;
  setEditingTextId: (id: string | null) => void;
  textInput: string;
  setTextInput: (v: string) => void;
  textStyle: { bold: boolean; italic: boolean; fontSize: number; color: string };
  setTextStyle: React.Dispatch<React.SetStateAction<{ bold: boolean; italic: boolean; fontSize: number; color: string }>>;
  handleTextSave: () => void;
  onCancel: () => void; // New prop
  currentTheme: ThemeStyles;
  sys: ColorSystem;
  t: (key: string) => string;
  ANNOTATION_COLORS: string[];
}

export const TextEditModal: React.FC<TextEditModalProps> = ({
  editingTextId, setEditingTextId, textInput, setTextInput,
  textStyle, setTextStyle, handleTextSave, onCancel,
  currentTheme, sys, t, ANNOTATION_COLORS
}) => {
  if (!editingTextId) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
       <div className={`${currentTheme.raised} w-full max-w-lg p-10 flex flex-col gap-8 transform animate-in zoom-in-95 duration-300`} style={{ borderRadius: currentTheme.radius, backgroundColor: sys.base }}>
          <div className="flex justify-between items-center">
            <h2 className={`text-xl font-black uppercase flex items-center gap-3 ${currentTheme.textClass}`}>
              <Type size={20} />{t('editTextTitle')}
            </h2>
            <button onClick={onCancel} className="p-2 rounded-lg opacity-40 hover:opacity-100 transition-all">
              <X size={20}/>
            </button>
          </div>
          <textarea 
            autoFocus 
            value={textInput} 
            onChange={e => setTextInput(e.target.value)} 
            placeholder={t('textPlaceholder')} 
            className={`w-full p-6 min-h-[160px] rounded-3xl border-none focus:ring-4 focus:ring-indigo-500/20 outline-none text-lg font-bold resize-none ${currentTheme.pressed} ${currentTheme.textClass}`} 
            style={{ color: textStyle.color, fontWeight: textStyle.bold ? 'bold' : 'normal', fontStyle: textStyle.italic ? 'italic' : 'normal', backgroundColor: sys.base }} 
          />
          <div className="flex flex-wrap items-center justify-between gap-6 border-t border-white/10 pt-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setTextStyle(p=>({...p, bold: !p.bold}))} className={`p-3 rounded-xl transition-all ${textStyle.bold ? 'bg-indigo-600 text-white shadow-lg' : currentTheme.raisedSm + ' opacity-50'}`}><Bold size={18}/></button>
              <button onClick={() => setTextStyle(p=>({...p, italic: !p.italic}))} className={`p-3 rounded-xl transition-all ${textStyle.italic ? 'bg-indigo-600 text-white shadow-lg' : currentTheme.raisedSm + ' opacity-50'}`}><Italic size={18}/></button>
              <div className="w-px h-6 bg-white/10 mx-2" />
              <span className="text-[10px] font-black opacity-30 uppercase">{t('fontSize')}</span>
              <input type="range" min="10" max="120" value={textStyle.fontSize} onChange={e => setTextStyle(p=>({...p, fontSize: parseInt(e.target.value)}))} className="w-24 accent-indigo-600" />
            </div>
            <div className="flex gap-2">
              {ANNOTATION_COLORS.map(c => (
                <button key={c} onClick={() => setTextStyle(p=>({...p, color: c}))} className={`w-6 h-6 rounded-full border-2 border-white transition-all ${textStyle.color === c ? 'scale-125 ring-2' : 'opacity-40 hover:opacity-100'}`} style={{ backgroundColor: c, outlineColor: sys.accent }} />
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={onCancel} className="flex-1 py-4 rounded-2xl font-black uppercase text-xs opacity-50">{t('cancel')}</button>
            <button onClick={handleTextSave} className="flex-[2] py-4 rounded-2xl text-white font-black uppercase text-xs shadow-xl active:scale-95" style={{ backgroundColor: sys.accent }}>{t('save')}</button>
          </div>
       </div>
    </div>
  );
};

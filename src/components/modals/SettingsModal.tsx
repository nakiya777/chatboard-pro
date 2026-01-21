import React, { useState, useEffect } from 'react';
import { Settings, X, Check, Layers, LogOut, User, Building, Save, Camera } from 'lucide-react';
import { ThemeStyles, ColorSystem } from '../../types';
import { THEME_MODES, COLOR_SYSTEMS } from '../../constants';
import { User as FirebaseUser } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { UserProfile, updateUserProfile } from '../../services/authService';
import { processImageToWebP } from '../../utils/imageUtils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeStyles;
  sys: ColorSystem;
  t: (key: string) => string;
  theme: string;
  setTheme: (t: string) => void;
  colorSystem: string;
  setColorSystem: (c: string) => void;
  language: string;
  setLanguage: (l: string) => void;
  onBackToProjects: () => void;
  onLogout: () => void;
  user?: FirebaseUser;
  userProfile?: UserProfile | null;
  db?: Firestore;
  showNavigationButtons?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, currentTheme, sys, t,
  theme, setTheme, colorSystem, setColorSystem, language, setLanguage,
  onBackToProjects, onLogout,
  user, userProfile, db, showNavigationButtons = true
}) => {
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setOrganization(userProfile.organization || '');
      setAvatarUrl(userProfile.photoURL || '');
    } else if (user) {
      setName(user.displayName || '');
      setAvatarUrl(user.photoURL || '');
    }
  }, [userProfile, user, isOpen]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const webpUrl = await processImageToWebP(file, 200, 0.8);
      setAvatarUrl(webpUrl);
    } catch (err) {
      console.error("Avatar processing failed", err);
      alert('Failed to process image');
    }
  };

  const handleSaveProfile = async () => {
    if (!db || !user) return;
    setIsSaving(true);
    try {
      await updateUserProfile(db, user.uid, {
        name,
        organization,
        photoURL: avatarUrl
      });
      alert(t('saved') || 'Saved');
    } catch (e) {
      console.error(e);
      alert('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className={`${currentTheme.raised} w-full max-w-2xl p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl transition-all duration-300`} style={{ borderRadius: currentTheme.radius, backgroundColor: sys.base }}>
        <div className="flex justify-between items-center pb-2 border-b border-black/5">
          <h2 className={`text-lg font-black uppercase flex items-center gap-2 ${currentTheme.textClass}`}>
            <Settings size={18} />{t('preferences')}
          </h2>
          <button onClick={onClose} className={`p-2 rounded-lg hover:bg-black/5 transition-colors`} style={{ color: sys.accent }}>
            <X size={18} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column: Account & Navigation */}
            <div className="flex flex-col gap-4">
                {/* Account Settings */}
                {user && db && (
                <div>
                    <label className={`text-[10px] font-black opacity-50 uppercase tracking-widest mb-2 block ${currentTheme.textClass}`}>{t('account')}</label>
                    <div className={`p-3 rounded-2xl flex flex-col gap-3 ${currentTheme.pressed}`}>
                    <div className="flex items-center gap-3">
                        <div className="relative group shrink-0">
                            <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden shadow-sm border-2 border-white">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <User size={24} />
                                    </div>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 p-1 bg-indigo-600 rounded-full text-white cursor-pointer shadow-md hover:bg-indigo-700 transition-colors z-10">
                                <Camera size={10} />
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                            </label>
                        </div>
                        
                        <div className="flex-1 flex flex-col gap-1 min-w-0">
                            <div className="flex flex-col gap-0.5">
                                <label className="text-[9px] font-bold opacity-60 uppercase">{t('name')}</label>
                                <input 
                                    type="text" 
                                    value={name} 
                                    onChange={e => setName(e.target.value)} 
                                    className="w-full py-1.5 px-2 rounded-md bg-white/60 border border-transparent focus:border-indigo-500/50 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold text-xs text-slate-700 placeholder-slate-400"
                                    placeholder="Name"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-0.5">
                        <label className="text-[9px] font-bold opacity-60 uppercase flex items-center gap-1"><Building size={10}/> {t('organization')}</label>
                        <input 
                            type="text" 
                            value={organization} 
                            onChange={e => setOrganization(e.target.value)} 
                            className="w-full py-1.5 px-2 rounded-md bg-white/60 border border-transparent focus:border-indigo-500/50 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold text-xs text-slate-700 placeholder-slate-400"
                            placeholder="Organization"
                        />
                    </div>
                    
                    <div className="flex justify-end pt-0.5">
                        <button 
                            onClick={handleSaveProfile} 
                            disabled={isSaving}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-[10px] flex items-center gap-1.5 shadow-md hover:bg-indigo-700 disabled:opacity-50 hover:translate-y-[-1px] transition-all"
                        >
                            {isSaving ? 'Saving...' : <><Save size={12}/> {t('save')}</>}
                        </button>
                    </div>
                    </div>
                </div>
                )}

                {/* Navigation Buttons (Moved to Left Column) */}
                {showNavigationButtons && (
                    <div>
                         <label className={`text-[10px] font-black opacity-50 uppercase tracking-widest mb-2 block ${currentTheme.textClass}`}>Actions</label>
                        <div className="flex flex-col gap-2">
                            <button onClick={onBackToProjects} className="w-full py-2.5 rounded-xl bg-slate-200 text-slate-600 font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-slate-300 transition-colors">
                                <Layers size={12} /> {t('backToProjects')}
                            </button>
                            <button onClick={onLogout} className="w-full py-2.5 rounded-xl bg-red-50 text-red-500 font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                                <LogOut size={12} /> {t('logout')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Column: Appearance */}
            <div className="flex flex-col gap-4">
                 {/* Visual Style */}
                <div>
                    <label className={`text-[10px] font-black opacity-50 uppercase tracking-widest mb-2 block ${currentTheme.textClass}`}>{t('visualStyle')}</label>
                    <div className={`grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl ${currentTheme.pressed}`}>
                    {Object.keys(THEME_MODES).map(k => (
                        <button 
                            key={k} 
                            onClick={() => setTheme(k)} 
                            className={`
                                w-full py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200
                                ${theme === k 
                                    ? 'bg-white shadow-md ring-2 ring-indigo-500 z-10' 
                                    : 'hover:bg-white/50 opacity-70 hover:opacity-100'} 
                                ${currentTheme.textClass}
                            `}
                        >
                        <span className={`text-[9px] font-black uppercase tracking-wider text-center ${theme === k ? 'text-indigo-900' : ''}`}>{t('theme_' + k) || THEME_MODES[k].name}</span>
                        {theme === k && <div className="bg-indigo-500 text-white p-0.5 rounded-full scale-75"><Check size={10} /></div>}
                        </button>
                    ))}
                    </div>
                </div>

                {/* Color Tone */}
                <div>
                    <label className={`text-[10px] font-black opacity-50 uppercase tracking-widest mb-2 block ${currentTheme.textClass}`}>{t('colorTone')}</label>
                    <div className={`grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl ${currentTheme.pressed}`}>
                    {Object.keys(COLOR_SYSTEMS).map(k => (
                        <button 
                            key={k} 
                            onClick={() => setColorSystem(k)} 
                            className={`
                                py-2 px-1 rounded-xl flex flex-col items-center gap-1.5 transition-all duration-200
                                ${colorSystem === k 
                                    ? 'bg-white shadow-md ring-2 ring-indigo-500 z-10' 
                                    : 'hover:bg-white/50 opacity-70 hover:opacity-100'}
                            `}
                        >
                        <div className={`w-4 h-4 rounded-full shadow-sm border ${colorSystem === k ? 'border-indigo-500 ring-2 ring-white' : 'border-slate-300'}`} style={{ backgroundColor: COLOR_SYSTEMS[k].base }} />
                        <span className={`text-[8px] font-black uppercase tracking-wider text-center ${colorSystem === k ? 'text-indigo-900' : 'text-slate-600'}`}>{t('color_' + k) || COLOR_SYSTEMS[k].name}</span>
                        </button>
                    ))}
                    </div>
                </div>

                {/* Language */}
                <div>
                    <label className={`text-[10px] font-black opacity-50 uppercase tracking-widest mb-2 block ${currentTheme.textClass}`}>{t('language')}</label>
                    <div className={`grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl ${currentTheme.pressed}`}>
                    {['ja', 'en', 'vi'].map(k => (
                        <button 
                            key={k} 
                            onClick={() => setLanguage(k)} 
                            className={`
                                py-1.5 px-1 rounded-xl flex items-center justify-center gap-1 transition-all duration-200
                                ${language === k 
                                    ? 'bg-white shadow-md ring-2 ring-indigo-500 z-10 text-indigo-900' 
                                    : 'hover:bg-white/50 opacity-70 hover:opacity-100 text-slate-600'}
                            `}
                        >
                        <span className="text-[9px] font-black uppercase tracking-wider">
                            {t('lang_' + k)}
                        </span>
                        </button>
                    ))}
                    </div>
                </div>
            </div>
        </div>
        
        <div className="pt-2 border-t border-black/5 mt-auto">
            <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-black uppercase text-xs shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:translate-y-[-1px] transition-all flex items-center justify-center gap-2">
                <Check size={14} /> {t('close') || 'Done'}
            </button>
        </div>
      </div>
    </div>
  );
};

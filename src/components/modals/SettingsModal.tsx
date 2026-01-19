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
      <div className={`${currentTheme.raised} w-full max-w-md p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl`} style={{ borderRadius: currentTheme.radius, backgroundColor: sys.base }}>
        <div className="flex justify-between items-center pb-2 border-b border-black/5">
          <h2 className={`text-lg font-black uppercase flex items-center gap-2 ${currentTheme.textClass}`}>
            <Settings size={18} />{t('preferences')}
          </h2>
          <button onClick={onClose} className={`p-2 rounded-lg hover:bg-black/5 transition-colors`} style={{ color: sys.accent }}>
            <X size={18} />
          </button>
        </div>
        
        {/* Account Settings */}
        {user && db && (
          <div>
            <label className={`text-[10px] font-black opacity-50 uppercase tracking-widest mb-2 block ${currentTheme.textClass}`}>{t('account')}</label>
            <div className={`p-4 rounded-2xl flex flex-col gap-4 ${currentTheme.pressed}`}>
               <div className="flex items-center gap-4">
                  <div className="relative group shrink-0">
                    <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden shadow-sm border-2 border-white">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <User size={28} />
                            </div>
                        )}
                    </div>
                    <label className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 rounded-full text-white cursor-pointer shadow-md hover:bg-indigo-700 transition-colors z-10">
                        <Camera size={12} />
                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                    </label>
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-2 min-w-0">
                     <div className="flex flex-col gap-1">
                       <label className="text-[10px] font-bold opacity-60 uppercase">{t('name')}</label>
                       <input 
                          type="text" 
                          value={name} 
                          onChange={e => setName(e.target.value)} 
                          className="w-full py-2 px-3 rounded-lg bg-white/60 border border-transparent focus:border-indigo-500/50 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold text-sm text-slate-700 placeholder-slate-400"
                          placeholder="Name"
                       />
                     </div>
                  </div>
               </div>

               <div className="flex flex-col gap-1">
                 <label className="text-[10px] font-bold opacity-60 uppercase flex items-center gap-1"><Building size={10}/> {t('organization')}</label>
                 <input 
                    type="text" 
                    value={organization} 
                    onChange={e => setOrganization(e.target.value)} 
                    className="w-full py-2 px-3 rounded-lg bg-white/60 border border-transparent focus:border-indigo-500/50 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold text-sm text-slate-700 placeholder-slate-400"
                    placeholder="Organization"
                 />
               </div>
               
               <div className="flex justify-end pt-1">
                 <button 
                    onClick={handleSaveProfile} 
                    disabled={isSaving}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center gap-2 shadow-md hover:bg-indigo-700 disabled:opacity-50 hover:translate-y-[-1px] transition-all"
                 >
                    {isSaving ? 'Saving...' : <><Save size={14}/> {t('save')}</>}
                 </button>
               </div>
            </div>
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className={`text-[10px] font-black opacity-50 uppercase tracking-widest mb-2 block ${currentTheme.textClass}`}>{t('visualStyle')}</label>
            <div className={`flex flex-col gap-2 p-1.5 rounded-2xl ${currentTheme.pressed}`}>
              {Object.keys(THEME_MODES).map(k => (
                <button 
                    key={k} 
                    onClick={() => setTheme(k)} 
                    className={`
                        w-full py-3 px-4 rounded-xl flex items-center justify-between transition-all duration-200
                        ${theme === k 
                            ? 'bg-white shadow-md ring-2 ring-indigo-500 z-10' 
                            : 'hover:bg-white/50 opacity-70 hover:opacity-100'} 
                        ${currentTheme.textClass}
                    `}
                >
                  <span className={`text-xs font-black uppercase tracking-wider ${theme === k ? 'text-indigo-900' : ''}`}>{THEME_MODES[k].name}</span>
                  {theme === k && <div className="bg-indigo-500 text-white p-0.5 rounded-full"><Check size={12} /></div>}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={`text-[10px] font-black opacity-50 uppercase tracking-widest mb-2 block ${currentTheme.textClass}`}>{t('colorTone')}</label>
            <div className={`grid grid-cols-2 gap-2 p-1.5 rounded-2xl ${currentTheme.pressed}`}>
              {Object.keys(COLOR_SYSTEMS).map(k => (
                <button 
                    key={k} 
                    onClick={() => setColorSystem(k)} 
                    className={`
                        py-3 px-3 rounded-xl flex flex-col items-center gap-2 transition-all duration-200
                        ${colorSystem === k 
                            ? 'bg-white shadow-md ring-2 ring-indigo-500 z-10' 
                            : 'hover:bg-white/50 opacity-70 hover:opacity-100'}
                    `}
                >
                  <div className={`w-6 h-6 rounded-full shadow-sm border ${colorSystem === k ? 'border-indigo-500 ring-2 ring-white' : 'border-slate-300'}`} style={{ backgroundColor: COLOR_SYSTEMS[k].base }} />
                  <span className={`text-[10px] font-black uppercase tracking-wider ${colorSystem === k ? 'text-indigo-900' : 'text-slate-600'}`}>{COLOR_SYSTEMS[k].name}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={`text-[10px] font-black opacity-50 uppercase tracking-widest mb-2 block ${currentTheme.textClass}`}>{t('language')}</label>
            <div className={`grid grid-cols-2 gap-2 p-1.5 rounded-2xl ${currentTheme.pressed}`}>
              {['ja', 'en'].map(k => (
                <button 
                    key={k} 
                    onClick={() => setLanguage(k)} 
                    className={`
                        py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-200
                        ${language === k 
                            ? 'bg-white shadow-md ring-2 ring-indigo-500 z-10 text-indigo-900' 
                            : 'hover:bg-white/50 opacity-70 hover:opacity-100 text-slate-600'}
                    `}
                >
                  <span className="text-xs font-black uppercase tracking-wider">{k === 'ja' ? '日本語' : 'English'}</span>
                </button>
              ))}
            </div>
          </div>
          
          {showNavigationButtons && (
            <div className="pt-2 border-t border-black/5 flex flex-col gap-2">
                <button onClick={onBackToProjects} className="w-full py-3 rounded-xl bg-slate-200 text-slate-600 font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-slate-300 transition-colors">
                <Layers size={14} /> {t('backToProjects')}
                </button>
                <button onClick={onLogout} className="w-full py-3 rounded-xl bg-red-50 text-red-500 font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                <LogOut size={14} /> {t('logout')}
                </button>
            </div>
          )}
          
          <div className="pt-2">
            <button onClick={onClose} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-black uppercase text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:translate-y-[-1px] transition-all flex items-center justify-center gap-2">
              <Check size={16} /> {t('close') || 'Done'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

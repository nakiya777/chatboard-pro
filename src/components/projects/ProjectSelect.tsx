/**
 * プロジェクト選択画面
 * ログイン後、プロジェクトを選択または作成する画面
 */
import React, { useState, useEffect } from 'react';
import { FolderOpen, Plus, LogOut, User, Trash2, Users, Calendar, Edit2, UserPlus, ArrowRight } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

import { UserProfile } from '../../services/authService';
import * as projectService from '../../services/projectService';
import { ProjectCreate } from './ProjectCreate';
import { SettingsModal } from '../modals/SettingsModal';
import { Settings } from 'lucide-react';
import { ThemeStyles, ColorSystem, DocData } from '../../types';
import { COLOR_SYSTEMS, TRANSLATIONS, THEME_MODES } from '../../constants';

interface ProjectSelectProps {
  user: FirebaseUser;
  userProfile: UserProfile | null;
  db: Firestore;
  onSelectProject: (projectId: string) => void;
  onLogout: () => void;
  theme: string;
  setTheme: (t: string) => void;
  colorSystem: string;
  setColorSystem: (c: string) => void;
  language: string;
  setLanguage: (l: string) => void;
}

export const ProjectSelect: React.FC<ProjectSelectProps> = ({
  user,
  userProfile,
  db,
  onSelectProject,
  onLogout,
  theme, setTheme, colorSystem, setColorSystem, language, setLanguage
}) => {
  const [projects, setProjects] = useState<projectService.Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<projectService.Project | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [error, setError] = useState('');
  
  // Join Project State
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const sys = COLOR_SYSTEMS[colorSystem] || COLOR_SYSTEMS.standard;
  const t = (key: string) => TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key;

  // Theme Object Construction
  const currentTheme: ThemeStyles = React.useMemo(() => {
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

  // プロジェクト一覧を取得
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const userProjects = await projectService.getUserProjects(db, user.uid);
        setProjects(userProjects);
      } catch (err) {
        console.error('Failed to load projects:', err);
        setError('プロジェクトの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProjects();
  }, [db, user.uid]);

  // プロジェクト保存（作成・更新）
  const handleSaveProject = async (name: string, description: string) => {
    try {
      if (editingProject) {
        // 更新
        await projectService.updateProject(db, editingProject.id, { name, description });
        setProjects(prev => prev.map(p => p.id === editingProject.id ? { ...p, name, description } : p));
      } else {
        // 作成
        await projectService.createProject(db, name, description, user.uid);
        // リロード
        const userProjects = await projectService.getUserProjects(db, user.uid);
        setProjects(userProjects);
      }
      setIsModalOpen(false);
      setEditingProject(null);
    } catch (err) {
      console.error('Failed to save project:', err);
      throw err;
    }
  };

  const openCreateModal = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const openEditModal = (project: projectService.Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  // プロジェクト削除
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('このプロジェクトを削除しますか？')) return;
    
    try {
      await projectService.deleteProject(db, projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  // プロジェクト参加
  const handleJoinProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setIsJoining(true);
    setJoinError('');
    try {
      const projectId = await projectService.joinProjectByCode(db, user.uid, joinCode.trim().toUpperCase());
      if (projectId) {
        // リロード
        const userProjects = await projectService.getUserProjects(db, user.uid);
        setProjects(userProjects);
        setIsJoinModalOpen(false);
        setJoinCode('');
      } else {
        setJoinError('プロジェクトに参加できませんでした');
      }
    } catch (err) {
      console.error(err);
      setJoinError('コードが無効か、プロジェクトが見つかりません');
    } finally {
      setIsJoining(false);
    }
  };

  // 招待コード再生成ハンドラ (ProjectCreate用)
  const handleRegenerateCode = async () => {
    if (!editingProject) return '';
    const newCode = await projectService.regenerateInviteCode(db, editingProject.id);
    // update local state
    setProjects(prev => prev.map(p => p.id === editingProject.id ? { ...p, inviteCode: newCode } : p));
    setEditingProject(prev => prev ? { ...prev, inviteCode: newCode } : null);
    return newCode;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '--';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('ja-JP');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: sys.base }}>
        <div className="text-center">
          <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${currentTheme.pressed}`}>
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
          </div>
          <p className={`text-sm ${sys.textSecondary}`}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 transition-colors duration-300" style={{ backgroundColor: sys.base }}>
      {/* ヘッダー */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-lg`}>
              CB
            </div>
            <div>
              <h1 className={`text-xl font-black ${currentTheme.textClass}`}>ChatBoard Pro</h1>
              <p className={`text-xs ${sys.textSecondary}`}>{t('documents')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${currentTheme.raisedSm}`}>
              <User size={16} className="opacity-60" style={{ color: sys.accent }} />
              <span className={`text-sm ${currentTheme.textClass}`}>{userProfile?.name || user.email}</span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`p-3 rounded-xl ${currentTheme.raisedSm} opacity-60 hover:opacity-100 hover:scale-105 transition-all`}
              style={{ color: sys.accent }}
              title={t('preferences')}
            >
              <Settings size={18} />
            </button>
            <button
              onClick={onLogout}
              className={`p-3 rounded-xl ${currentTheme.raisedSm} opacity-60 hover:opacity-100 hover:text-red-500 hover:scale-105 transition-all mode-text`}
              title={t('logout')}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* プロジェクト一覧 */}
      <div className="max-w-4xl mx-auto">
        <div className={`rounded-[2rem] p-8 ${currentTheme.raised}`} style={{ borderRadius: currentTheme.radius }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-lg font-bold flex items-center gap-2 ${currentTheme.textClass}`}>
              <FolderOpen size={20} className="text-indigo-600" />
              {t('documents')}
            </h2>
            {projects.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsJoinModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-white text-indigo-600 font-bold text-sm flex items-center gap-2 shadow-sm border border-indigo-100 hover:bg-indigo-50 transition-colors"
                >
                  <UserPlus size={16} />
                  Join
                </button>
                <button
                  onClick={openCreateModal}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus size={16} />
                  New
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          {projects.length === 0 ? (
            <div className="text-center py-16">
              <FolderOpen size={64} className={`mx-auto mb-4 opacity-30 ${currentTheme.textClass}`} />
              <h3 className={`text-lg font-bold mb-2 ${currentTheme.textClass}`}>
                No Projects
              </h3>
              <p className={`text-sm opacity-60 mb-6 ${currentTheme.textClass}`}>
                Create your first project to get started.
              </p>
              <button
                onClick={openCreateModal}
                className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-2 mx-auto shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all"
              >
                <Plus size={18} />
                Create Project
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className={`p-6 rounded-2xl cursor-pointer transition-all group ${currentTheme.raisedSm} hover:scale-[1.01]`}
                  style={{ backgroundColor: theme !== 'neumorphism' ? 'rgba(255,255,255,0.05)' : undefined }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`text-lg font-bold mb-1 group-hover:text-indigo-600 transition-colors ${currentTheme.textClass}`}>
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className={`text-sm mb-3 ${sys.textSecondary}`}>
                          {project.description}
                        </p>
                      )}
                      <div className={`flex items-center gap-4 text-xs ${sys.textSecondary}`}>
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {project.memberIds?.length || 1}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(project.createdAt)}
                        </span>
                      </div>
                    </div>
                    {project.ownerId === user.uid && (
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openEditModal(project)}
                          className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-indigo-50 hover:text-indigo-600 transition-all text-slate-400"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all text-slate-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* プロジェクト作成・編集モーダル */}
      <ProjectCreate
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingProject(null); }}
        onSave={handleSaveProject}
        initialName={editingProject?.name}
        initialDescription={editingProject?.description}
        inviteCode={editingProject?.inviteCode}
        memberIds={editingProject?.memberIds}
        onRegenerateCode={editingProject ? handleRegenerateCode : undefined}
        isEditing={!!editingProject}
      />

      {/* 参加モーダル (Simple Inline) */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UserPlus size={20} className="text-indigo-600" />
              プロジェクトに参加
            </h3>
            
            {joinError && (
               <div className="mb-4 text-xs text-red-500 bg-red-50 p-2 rounded-lg">
                 {joinError}
               </div>
            )}

            <form onSubmit={handleJoinProject}>
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">招待コード</label>
                <input 
                  type="text" 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-center font-mono text-lg tracking-widest focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
                  placeholder="XXXXXX"
                  maxLength={8}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isJoining || !joinCode}
                  className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isJoining ? '参加中...' : (
                    <>
                      参加
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentTheme={currentTheme}
        sys={sys}
        t={t}
        theme={theme}
        setTheme={setTheme}
        colorSystem={colorSystem}
        setColorSystem={setColorSystem}
        language={language}
        setLanguage={setLanguage}
        onBackToProjects={() => {}} // No implementation needed here
        onLogout={onLogout}
        user={user}
        userProfile={userProfile}
        db={db}
        showNavigationButtons={false}
      />
    </div>
  );
};

export default ProjectSelect;

/**
 * プロジェクト作成・編集モーダル
 */
import React, { useState, useEffect } from 'react';
import { FolderPlus, FolderPen, X, AlertCircle, Copy, RefreshCw, Users, Check } from 'lucide-react';

interface ProjectCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => Promise<void>;
  error?: string;
  initialName?: string;
  initialDescription?: string;
  inviteCode?: string; // New
  memberIds?: string[]; // New
  onRegenerateCode?: () => Promise<string>; // New
  isEditing?: boolean;
}

export const ProjectCreate: React.FC<ProjectCreateProps> = ({
  isOpen,
  onClose,
  onSave,
  error,
  initialName = '',
  initialDescription = '',
  inviteCode: initialInviteCode = '',
  memberIds = [],
  onRegenerateCode,
  isEditing = false
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setDescription(initialDescription);
      setInviteCode(initialInviteCode);
    }
  }, [isOpen, initialName, initialDescription, initialInviteCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    // ... same
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await onSave(name, description);
      setName('');
      setDescription('');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (!onRegenerateCode || !confirm('招待コードを再生成しますか？古いコードは無効になります。')) return;
    setIsRegenerating(true);
    try {
      const newCode = await onRegenerateCode();
      setInviteCode(newCode);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRegenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#e6e9ef] rounded-[2rem] shadow-[8px_8px_16px_#b8bec9,-8px_-8px_16px_#ffffff] p-8 max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-slate-700 flex items-center gap-2">
            {isEditing ? <FolderPen size={24} className="text-indigo-600" /> : <FolderPlus size={24} className="text-indigo-600" />}
            {isEditing ? 'プロジェクト編集' : '新規プロジェクト'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white/50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* プロジェクト名 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
              プロジェクト名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 rounded-xl bg-[#e6e9ef] shadow-[inset_4px_4px_8px_#b8bec9,inset_-4px_-4px_8px_#ffffff] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              placeholder="プロジェクト名を入力"
              required
              autoFocus
            />
          </div>

          {/* 説明 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
              説明（任意）
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 rounded-xl bg-[#e6e9ef] shadow-[inset_4px_4px_8px_#b8bec9,inset_-4px_-4px_8px_#ffffff] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
              placeholder="プロジェクトの説明を入力"
              rows={3}
            />
          </div>

          {/* 編集モード時のみ表示: 招待コード & メンバー */}
          {isEditing && (
            <>
              <div className="pt-2 border-t border-slate-300/50">
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase flex items-center justify-between">
                  招待コード
                  {inviteCode ? (
                     <button
                       type="button"
                       onClick={handleRegenerate}
                       disabled={isRegenerating}
                       className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors"
                     >
                       <RefreshCw size={10} className={isRegenerating ? 'animate-spin' : ''} />
                       再生成
                     </button>
                  ) : (
                    <span className="text-[10px] text-slate-400">未発行 (保存後に発行されます)</span>
                  )}
                </label>
                {inviteCode ? (
                  <div className="flex gap-2">
                    <div className="flex-1 p-3 rounded-xl bg-indigo-50 text-indigo-900 font-mono text-center tracking-widest font-bold border border-indigo-100 select-all">
                      {inviteCode}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="p-3 rounded-xl bg-white text-slate-500 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
                      title="コピー"
                    >
                      {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                    </button>
                  </div>
                ) : (
                   <p className="text-xs text-slate-400 italic">
                     このプロジェクトには招待コードがありません。更新ボタンを押して生成してください。
                   </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase flex items-center gap-2">
                  <Users size={14} />
                  メンバー ({memberIds.length})
                </label>
                <div className="max-h-32 overflow-y-auto p-2 rounded-xl bg-slate-100/50 border border-slate-200">
                  {memberIds.length > 0 ? (
                    <ul className="space-y-1">
                      {memberIds.map((uid, i) => (
                        <li key={i} className="text-xs text-slate-600 font-mono truncate px-2 py-1 rounded hover:bg-white/50">
                          {uid}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400">メンバーはいません</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ボタン */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-xl bg-slate-200 text-slate-600 font-bold hover:bg-slate-300 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex-1 py-4 rounded-xl bg-indigo-600 text-white font-bold shadow-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="animate-pulse">保存中...</span>
              ) : (
                <>
                  {isEditing ? <FolderPen size={18} /> : <FolderPlus size={18} />}
                  {isEditing ? '保存' : '作成'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectCreate;

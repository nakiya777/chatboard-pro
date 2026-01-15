/**
 * ゲスト招待モーダル
 */
import React, { useState } from 'react';
import { UserPlus, X, Link2, Copy, Check, AlertCircle } from 'lucide-react';

interface Thread {
  id: string;
  title: string;
}

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateInvite: (threadIds: string[], email?: string) => Promise<{ url: string } | null>;
  threads: Thread[];
  error?: string;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  onCreateInvite,
  threads,
  error
}) => {
  const [email, setEmail] = useState('');
  const [selectedThreads, setSelectedThreads] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedThreads.length === 0) return;

    setIsLoading(true);
    try {
      const result = await onCreateInvite(selectedThreads, email || undefined);
      if (result) {
        setGeneratedUrl(result.url);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (generatedUrl) {
      try {
        await navigator.clipboard.writeText(generatedUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleClose = () => {
    setEmail('');
    setSelectedThreads([]);
    setGeneratedUrl(null);
    setCopied(false);
    onClose();
  };

  const toggleThread = (threadId: string) => {
    setSelectedThreads(prev =>
      prev.includes(threadId)
        ? prev.filter(id => id !== threadId)
        : [...prev, threadId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#e6e9ef] rounded-[2rem] shadow-[8px_8px_16px_#b8bec9,-8px_-8px_16px_#ffffff] p-8">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-slate-700 flex items-center gap-2">
            <UserPlus size={24} className="text-green-600" />
            ゲストを招待
          </h2>
          <button
            onClick={handleClose}
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

        {!generatedUrl ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* メールアドレス（任意） */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                メールアドレス（任意）
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 rounded-xl bg-[#e6e9ef] shadow-[inset_4px_4px_8px_#b8bec9,inset_-4px_-4px_8px_#ffffff] text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                placeholder="guest@email.com"
              />
              <p className="mt-1 text-[10px] text-slate-400">
                招待相手のメールアドレスを記録用に入力できます
              </p>
            </div>

            {/* スレッド選択 */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                アクセス許可するスレッド <span className="text-red-500">*</span>
              </label>
              <div className="max-h-48 overflow-y-auto rounded-xl bg-white/50 p-3 space-y-2">
                {threads.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">
                    スレッドがありません
                  </p>
                ) : (
                  threads.map((thread) => (
                    <label
                      key={thread.id}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                        selectedThreads.includes(thread.id)
                          ? 'bg-green-100 border-2 border-green-400'
                          : 'bg-white hover:bg-slate-50 border-2 border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedThreads.includes(thread.id)}
                        onChange={() => toggleThread(thread.id)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                        selectedThreads.includes(thread.id)
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-200'
                      }`}>
                        {selectedThreads.includes(thread.id) && <Check size={12} />}
                      </div>
                      <span className="text-sm text-slate-700 truncate">
                        {thread.title}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* 招待ボタン */}
            <button
              type="submit"
              disabled={isLoading || selectedThreads.length === 0}
              className="w-full py-4 rounded-xl bg-green-600 text-white font-bold shadow-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="animate-pulse">招待URL生成中...</span>
              ) : (
                <>
                  <Link2 size={18} />
                  招待URLを生成
                </>
              )}
            </button>
          </form>
        ) : (
          /* URL生成完了 */
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-4">
                <Check size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">
                招待URLを生成しました
              </h3>
              <p className="text-sm text-slate-500">
                以下のURLをゲストに共有してください
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200">
              <p className="text-xs text-slate-500 mb-2">招待URL（72時間有効）</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={generatedUrl}
                  readOnly
                  className="flex-1 p-3 rounded-lg bg-slate-50 text-sm text-slate-600 font-mono"
                />
                <button
                  onClick={handleCopy}
                  className={`p-3 rounded-lg transition-colors ${
                    copied
                      ? 'bg-green-100 text-green-600'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            <div className="text-center text-xs text-slate-400">
              <p>※ このURLは1回のみ使用可能です</p>
              <p>※ 有効期限は72時間です</p>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-4 rounded-xl bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition-colors"
            >
              閉じる
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteModal;

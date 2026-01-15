/**
 * ゲスト登録ページ（招待URLからアクセス時）
 */
import React, { useState } from 'react';
import { UserCheck, AlertCircle, Link2 } from 'lucide-react';

interface GuestRegisterPageProps {
  invitationToken: string;
  onRegister: (email: string, password: string, name: string) => Promise<void>;
  error?: string;
  isValidToken: boolean;
  isLoading?: boolean;
}

export const GuestRegisterPage: React.FC<GuestRegisterPageProps> = ({
  invitationToken,
  onRegister,
  error,
  isValidToken,
  isLoading: externalLoading
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // バリデーション
    if (password.length < 6) {
      setValidationError('パスワードは6文字以上で入力してください');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('パスワードが一致しません');
      return;
    }
    if (!name.trim()) {
      setValidationError('名前を入力してください');
      return;
    }

    setIsLoading(true);
    try {
      await onRegister(email, password, name);
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = validationError || error;
  const loading = isLoading || externalLoading;

  // トークンが無効な場合
  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e6e9ef] p-6">
        <div className="w-full max-w-md bg-[#e6e9ef] rounded-[2rem] shadow-[8px_8px_16px_#b8bec9,-8px_-8px_16px_#ffffff] p-10 text-center">
          <div className="w-20 h-20 mx-auto rounded-[1.5rem] bg-red-100 flex items-center justify-center text-red-600 mb-6">
            <Link2 size={36} />
          </div>
          <h1 className="text-xl font-bold text-slate-700 mb-4">
            招待リンクが無効です
          </h1>
          <p className="text-sm text-slate-500">
            この招待リンクは有効期限が切れているか、
            <br />
            すでに使用されています。
          </p>
          <p className="text-sm text-slate-500 mt-4">
            招待者に新しいリンクを依頼してください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e6e9ef] p-6">
      <div className="w-full max-w-md bg-[#e6e9ef] rounded-[2rem] shadow-[8px_8px_16px_#b8bec9,-8px_-8px_16px_#ffffff] p-10">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-[1.5rem] bg-[#e6e9ef] shadow-[inset_6px_6px_12px_#b8bec9,inset_-6px_-6px_12px_#ffffff] flex items-center justify-center text-green-600 mb-4">
            <UserCheck size={36} />
          </div>
          <h1 className="text-2xl font-black text-slate-700 tracking-tight">
            招待を受ける
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            ゲストとして参加するための情報を入力してください
          </p>
        </div>

        {/* 招待情報 */}
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200">
          <p className="text-sm text-green-700 flex items-center gap-2">
            <Link2 size={16} />
            チャットスレッドへの招待を受けています
          </p>
        </div>

        {/* エラー表示 */}
        {displayError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2">
            <AlertCircle size={18} />
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 名前 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
              お名前 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 rounded-xl bg-[#e6e9ef] shadow-[inset_4px_4px_8px_#b8bec9,inset_-4px_-4px_8px_#ffffff] text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/30"
              placeholder="山田 太郎"
              required
            />
          </div>

          {/* メールアドレス */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-xl bg-[#e6e9ef] shadow-[inset_4px_4px_8px_#b8bec9,inset_-4px_-4px_8px_#ffffff] text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/30"
              placeholder="example@email.com"
              required
            />
          </div>

          {/* パスワード */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
              パスワード <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-xl bg-[#e6e9ef] shadow-[inset_4px_4px_8px_#b8bec9,inset_-4px_-4px_8px_#ffffff] text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/30"
              placeholder="6文字以上"
              required
              minLength={6}
            />
          </div>

          {/* パスワード確認 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
              パスワード（確認） <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-4 rounded-xl bg-[#e6e9ef] shadow-[inset_4px_4px_8px_#b8bec9,inset_-4px_-4px_8px_#ffffff] text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-500/30"
              placeholder="パスワードを再入力"
              required
            />
          </div>

          {/* 登録ボタン */}
          <button
            type="submit"
            disabled={loading || !email || !password || !name}
            className="w-full py-4 rounded-xl bg-green-600 text-white font-bold shadow-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-pulse">参加中...</span>
            ) : (
              <>
                <UserCheck size={18} />
                ゲストとして参加
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GuestRegisterPage;

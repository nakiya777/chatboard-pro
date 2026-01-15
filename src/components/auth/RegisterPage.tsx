/**
 * ユーザー登録ページ
 */
import React, { useState } from 'react';
import { UserPlus, ArrowLeft, AlertCircle, Building2 } from 'lucide-react';

interface RegisterPageProps {
  onRegister: (email: string, password: string, name: string, organization?: string) => Promise<void>;
  onBackToLogin: () => void;
  error?: string;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onRegister,
  onBackToLogin,
  error
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
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
      await onRegister(email, password, name, organization || undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = validationError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e6e9ef] p-6">
      <div className="w-full max-w-md bg-[#e6e9ef] rounded-[2rem] shadow-[8px_8px_16px_#b8bec9,-8px_-8px_16px_#ffffff] p-10">
        {/* 戻るボタン */}
        <button
          onClick={onBackToLogin}
          className="mb-6 text-slate-500 hover:text-indigo-600 flex items-center gap-1 text-sm"
        >
          <ArrowLeft size={16} />
          ログイン画面に戻る
        </button>

        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-[1.5rem] bg-[#e6e9ef] shadow-[inset_6px_6px_12px_#b8bec9,inset_-6px_-6px_12px_#ffffff] flex items-center justify-center text-indigo-600 mb-4">
            <UserPlus size={36} />
          </div>
          <h1 className="text-2xl font-black text-slate-700 tracking-tight">
            新規登録
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            アカウントを作成してください
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
              名前 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 rounded-xl bg-[#e6e9ef] shadow-[inset_4px_4px_8px_#b8bec9,inset_-4px_-4px_8px_#ffffff] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              placeholder="山田 太郎"
              required
            />
          </div>

          {/* 所属 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase flex items-center gap-1">
              <Building2 size={12} />
              所属（任意）
            </label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full p-4 rounded-xl bg-[#e6e9ef] shadow-[inset_4px_4px_8px_#b8bec9,inset_-4px_-4px_8px_#ffffff] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              placeholder="株式会社 〇〇"
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
              className="w-full p-4 rounded-xl bg-[#e6e9ef] shadow-[inset_4px_4px_8px_#b8bec9,inset_-4px_-4px_8px_#ffffff] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
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
              className="w-full p-4 rounded-xl bg-[#e6e9ef] shadow-[inset_4px_4px_8px_#b8bec9,inset_-4px_-4px_8px_#ffffff] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
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
              className="w-full p-4 rounded-xl bg-[#e6e9ef] shadow-[inset_4px_4px_8px_#b8bec9,inset_-4px_-4px_8px_#ffffff] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              placeholder="パスワードを再入力"
              required
            />
          </div>

          {/* 登録ボタン */}
          <button
            type="submit"
            disabled={isLoading || !email || !password || !name}
            className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold shadow-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="animate-pulse">登録中...</span>
            ) : (
              <>
                <UserPlus size={18} />
                アカウントを作成
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;

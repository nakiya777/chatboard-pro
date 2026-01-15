/**
 * ログインページ
 */
import React, { useState } from 'react';
import { LogIn, UserPlus, KeyRound, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegisterClick: () => void;
  onForgotPassword: (email: string) => Promise<void>;
  error?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  onRegisterClick,
  onForgotPassword,
  error
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    try {
      await onLogin(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) return;
    setIsLoading(true);
    try {
      await onForgotPassword(forgotEmail);
      setForgotSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e6e9ef] p-6">
      <div className="w-full max-w-md bg-[#e6e9ef] rounded-[2rem] shadow-[8px_8px_16px_#b8bec9,-8px_-8px_16px_#ffffff] p-10">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-[1.5rem] bg-[#e6e9ef] shadow-[inset_6px_6px_12px_#b8bec9,inset_-6px_-6px_12px_#ffffff] flex items-center justify-center text-indigo-600 mb-4">
            <LogIn size={36} />
          </div>
          <h1 className="text-2xl font-black text-slate-700 tracking-tight">
            ChatBoard Pro
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            ログインしてください
          </p>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {!showForgotPassword ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* メールアドレス */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                メールアドレス
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
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 rounded-xl bg-[#e6e9ef] shadow-[inset_4px_4px_8px_#b8bec9,inset_-4px_-4px_8px_#ffffff] text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                placeholder="••••••••"
                required
              />
            </div>

            {/* ログインボタン */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold shadow-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="animate-pulse">ログイン中...</span>
              ) : (
                <>
                  <LogIn size={18} />
                  ログイン
                </>
              )}
            </button>

            {/* リンク */}
            <div className="flex justify-between text-sm">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-slate-500 hover:text-indigo-600 flex items-center gap-1"
              >
                <KeyRound size={14} />
                パスワードを忘れた
              </button>
              <button
                type="button"
                onClick={onRegisterClick}
                className="text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
              >
                <UserPlus size={14} />
                新規登録
              </button>
            </div>
          </form>
        ) : (
          /* パスワードリセット */
          <div className="space-y-6">
            {forgotSent ? (
              <div className="text-center p-6">
                <div className="text-green-600 mb-4">✓</div>
                <p className="text-slate-600">
                  パスワードリセットメールを送信しました。
                  <br />
                  メールをご確認ください。
                </p>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotSent(false);
                  }}
                  className="mt-4 text-indigo-600 hover:underline"
                >
                  ログイン画面に戻る
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-500">
                  登録済みのメールアドレスを入力してください。
                  パスワードリセットのリンクをお送りします。
                </p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full p-4 rounded-xl bg-[#e6e9ef] shadow-[inset_4px_4px_8px_#b8bec9,inset_-4px_-4px_8px_#ffffff] text-slate-700 focus:outline-none"
                  placeholder="example@email.com"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowForgotPassword(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-200 text-slate-600 font-bold"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleForgotPassword}
                    disabled={!forgotEmail || isLoading}
                    className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-50"
                  >
                    送信
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;

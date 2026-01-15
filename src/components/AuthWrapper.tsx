/**
 * 認証ラッパーコンポーネント
 * ログイン状態に応じて適切な画面を表示
 */
import React, { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';

import { LoginPage } from './auth/LoginPage';
import { RegisterPage } from './auth/RegisterPage';
import { GuestRegisterPage } from './auth/GuestRegisterPage';
import * as authService from '../services/authService';
import * as inviteService from '../services/inviteService';
import { initializeFirebase, getDb, getAuthInstance } from '../services/firebase';

type AuthView = 'login' | 'register' | 'guest-register';

interface AuthWrapperProps {
  children: (props: { 
    user: FirebaseUser; 
    userProfile: authService.UserProfile | null;
    onLogout: () => void;
  }) => React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<authService.UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [error, setError] = useState<string>('');
  
  // 招待トークン関連
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<inviteService.Invitation | null>(null);
  const [isValidToken, setIsValidToken] = useState(true);

  // Firebase初期化
  useEffect(() => {
    const firebase = initializeFirebase();
    if (!firebase) {
      setIsLoading(false);
      return;
    }

    const auth = firebase.auth;
    const unsubscribe = authService.observeAuthState(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser && firebase.db) {
        // ユーザープロフィール取得
        const profile = await authService.getUserProfile(firebase.db, firebaseUser.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // URLから招待トークンをチェック
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/invite\/(.+)$/);
    
    if (match) {
      const token = match[1];
      setInvitationToken(token);
      setCurrentView('guest-register');
      
      // トークンの有効性チェック
      const checkToken = async () => {
        const db = getDb();
        if (db) {
          const inv = await inviteService.getInvitationByToken(db, token);
          if (inv) {
            setInvitation(inv);
            setIsValidToken(true);
          } else {
            setIsValidToken(false);
          }
        }
      };
      checkToken();
    }
  }, []);

  // ログイン処理
  const handleLogin = async (email: string, password: string) => {
    setError('');
    const auth = getAuthInstance();
    if (!auth) {
      setError('Firebase が初期化されていません');
      return;
    }
    
    try {
      await authService.loginUser(auth, email, password);
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err.code));
    }
  };

  // 登録処理
  const handleRegister = async (email: string, password: string, name: string, organization?: string) => {
    setError('');
    const auth = getAuthInstance();
    const db = getDb();
    if (!auth || !db) {
      setError('Firebase が初期化されていません');
      return;
    }
    
    try {
      await authService.registerUser(auth, db, email, password, name, organization);
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err.code));
    }
  };

  // ゲスト登録処理
  const handleGuestRegister = async (email: string, password: string, name: string) => {
    setError('');
    const auth = getAuthInstance();
    const db = getDb();
    
    if (!auth || !db || !invitation) {
      setError('招待情報が見つかりません');
      return;
    }
    
    try {
      // ゲスト登録
      await authService.registerGuest(
        auth, 
        db, 
        email, 
        password, 
        name,
        invitation.projectId, // invitedByとして使用
        invitation.threadIds
      );
      
      // 招待を受諾済みにする
      await inviteService.acceptInvitation(db, invitation.id);
      
      // URLをクリーンアップ
      window.history.replaceState({}, '', '/');
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err.code));
    }
  };

  // パスワードリセット
  const handleForgotPassword = async (email: string) => {
    const auth = getAuthInstance();
    if (!auth) return;
    
    try {
      await authService.resetPassword(auth, email);
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err.code));
    }
  };

  // ログアウト
  const handleLogout = async () => {
    const auth = getAuthInstance();
    if (auth) {
      await authService.logoutUser(auth);
    }
  };

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e6e9ef]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#e6e9ef] shadow-[inset_6px_6px_12px_#b8bec9,inset_-6px_-6px_12px_#ffffff] flex items-center justify-center mb-4">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
          </div>
          <p className="text-slate-500 text-sm">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 未ログイン
  if (!user) {
    switch (currentView) {
      case 'register':
        return (
          <RegisterPage
            onRegister={handleRegister}
            onBackToLogin={() => setCurrentView('login')}
            error={error}
          />
        );
      
      case 'guest-register':
        return (
          <GuestRegisterPage
            invitationToken={invitationToken || ''}
            onRegister={handleGuestRegister}
            isValidToken={isValidToken}
            error={error}
          />
        );
      
      default:
        return (
          <LoginPage
            onLogin={handleLogin}
            onRegisterClick={() => setCurrentView('register')}
            onForgotPassword={handleForgotPassword}
            error={error}
          />
        );
    }
  }

  // ログイン済み - 子コンポーネントをレンダリング
  return <>{children({ user, userProfile, onLogout: handleLogout })}</>;
};

// Firebaseエラーメッセージの日本語化
const getFirebaseErrorMessage = (code: string): string => {
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'このメールアドレスは既に使用されています',
    'auth/invalid-email': '無効なメールアドレスです',
    'auth/user-not-found': 'ユーザーが見つかりません',
    'auth/wrong-password': 'パスワードが正しくありません',
    'auth/weak-password': 'パスワードは6文字以上で入力してください',
    'auth/too-many-requests': 'リクエストが多すぎます。しばらく待ってから再試行してください',
    'auth/network-request-failed': 'ネットワークエラーが発生しました',
  };
  return messages[code] || `認証エラー: ${code}`;
};

export default AuthWrapper;

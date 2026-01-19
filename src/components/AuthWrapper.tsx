/**
 * 認証ラッパーコンポーネント
 * ログイン状態に応じて適切な画面を表示
 */
import React, { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';

import { LoginPage } from './auth/LoginPage';
import { RegisterPage } from './auth/RegisterPage';
import { GuestRegisterPage } from './auth/GuestRegisterPage';
import { ProjectSelect } from './projects/ProjectSelect';
import * as authService from '../services/authService';
import * as inviteService from '../services/inviteService';
import { initializeFirebase, getDb, getAuthInstance } from '../services/firebase';
import { Firestore } from 'firebase/firestore';

type AuthView = 'login' | 'register' | 'guest-register';

interface AuthWrapperProps {
  children: (props: { 
    user: FirebaseUser; 
    userProfile: authService.UserProfile | null;
    projectId: string;
    db: Firestore;
    onLogout: () => void;
    onBackToProjects: () => void;
    // Shared Settings Props
    theme: string;
    setTheme: (t: string) => void;
    colorSystem: string;
    setColorSystem: (c: string) => void;
    language: string;
    setLanguage: (l: string) => void;
  }) => React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<authService.UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [error, setError] = useState<string>('');
  const [db, setDb] = useState<Firestore | null>(null);
  
  // Settings State (Lifted from App.tsx) with Persistence
  const [theme, setTheme] = useState(() => localStorage.getItem('cb_theme') || 'neumorphism');
  const [colorSystem, setColorSystem] = useState(() => localStorage.getItem('cb_color') || 'standard');
  const [language, setLanguage] = useState(() => localStorage.getItem('cb_lang') || 'ja');

  // Load settings from localStorage on mount (redundant with initial state but safe)
  useEffect(() => {
    const savedTheme = localStorage.getItem('cb_theme');
    const savedColor = localStorage.getItem('cb_color');
    const savedLang = localStorage.getItem('cb_lang');
    if (savedTheme) setTheme(savedTheme);
    if (savedColor) setColorSystem(savedColor);
    if (savedLang) setLanguage(savedLang);
  }, []);

  // Persist settings
  useEffect(() => { localStorage.setItem('cb_theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('cb_color', colorSystem); }, [colorSystem]);
  useEffect(() => { localStorage.setItem('cb_lang', language); }, [language]);

  // プロジェクト選択
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // 招待トークン関連
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
// ... (existing useEffects)

// ...

  const [invitation, setInvitation] = useState<inviteService.Invitation | null>(null);
  const [isValidToken, setIsValidToken] = useState(true);

  // Firebase初期化
  useEffect(() => {
    const firebase = initializeFirebase();
    if (!firebase) {
      setIsLoading(false);
      return;
    }

    setDb(firebase.db);
    const auth = firebase.auth;
    const unsubscribe = authService.observeAuthState(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser && firebase.db) {
        // ユーザープロフィール取得
        const profile = await authService.getUserProfile(firebase.db, firebaseUser.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
        setSelectedProjectId(null);
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
        const dbInstance = getDb();
        if (dbInstance) {
          const inv = await inviteService.getInvitationByToken(dbInstance, token);
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
    const dbInstance = getDb();
    if (!auth || !dbInstance) {
      setError('Firebase が初期化されていません');
      return;
    }
    
    try {
      await authService.registerUser(auth, dbInstance, email, password, name, organization);
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err.code));
    }
  };

  // ゲスト登録処理
  const handleGuestRegister = async (email: string, password: string, name: string) => {
    setError('');
    const auth = getAuthInstance();
    const dbInstance = getDb();
    
    if (!auth || !dbInstance || !invitation) {
      setError('招待情報が見つかりません');
      return;
    }
    
    try {
      // ゲスト登録
      await authService.registerGuest(
        auth, 
        dbInstance, 
        email, 
        password, 
        name,
        invitation.projectId,
        invitation.threadIds
      );
      
      // 招待を受諾済みにする
      await inviteService.acceptInvitation(dbInstance, invitation.id);
      
      // 招待されたプロジェクトを選択
      setSelectedProjectId(invitation.projectId);
      
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
      setSelectedProjectId(null);
    }
  };

  // プロジェクト一覧に戻る
  const handleBackToProjects = () => {
    setSelectedProjectId(null);
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



  // ログイン済みだがプロジェクト未選択
  if (!selectedProjectId && db) {
    return (
      <ProjectSelect
        user={user}
        userProfile={userProfile}
        db={db}
        onSelectProject={setSelectedProjectId}
        onLogout={handleLogout}
        // Settings Props
        theme={theme}
        setTheme={setTheme}
        colorSystem={colorSystem}
        setColorSystem={setColorSystem}
        language={language}
        setLanguage={setLanguage}
      />
    );
  }

  // ログイン済み＆プロジェクト選択済み - 子コンポーネントをレンダリング
  if (db && selectedProjectId) {
    return <>{children({ 
      user, 
      userProfile, 
      projectId: selectedProjectId, 
      db,
      onLogout: handleLogout,
      onBackToProjects: handleBackToProjects,
      // Pass Settings
      theme, setTheme,
      colorSystem, setColorSystem,
      language, setLanguage
    })}</>;
  }

  return null;
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

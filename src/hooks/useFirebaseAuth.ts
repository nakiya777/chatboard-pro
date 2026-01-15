import { useState, useEffect, useCallback } from 'react';
import { 
  FirebaseApp, 
  initializeApp 
} from 'firebase/app';
import { 
  Auth, 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithCustomToken, 
  User as FirebaseUser 
} from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FIREBASE_CONFIG, INITIAL_AUTH_TOKEN } from '../config';
import { TRANSLATIONS } from '../constants';

// Firebase インスタンスをモジュールレベルで管理
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

// config.ts から初期化を試みる
try {
  if (FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY_HERE") {
    app = initializeApp(FIREBASE_CONFIG);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (e) {
  console.error("初期設定エラー", e);
}

export interface UseFirebaseAuthReturn {
  user: FirebaseUser | null;
  isInitialized: boolean;
  configError: string;
  db: Firestore | undefined;
  auth: Auth | undefined;
  tryConnect: (config: any) => boolean;
  handleSetupSubmit: (configJson: string) => void;
  handleDisconnect: () => void;
}

export const useFirebaseAuth = (language: string = 'ja'): UseFirebaseAuthReturn => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [configError, setConfigError] = useState("");

  // 翻訳ヘルパー
  const t = useCallback((key: string) => 
    TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key, 
    [language]
  );

  // Firebase接続を試みる
  const tryConnect = useCallback((config: any): boolean => {
    try {
      if (!config || !config.apiKey) throw new Error(t('invalidConfig'));
      
      if (!app) {
        app = initializeApp(config);
        auth = getAuth(app);
        db = getFirestore(app);
      }
      setIsInitialized(true);
      setConfigError("");
      return true;
    } catch (e: any) {
      console.error("接続失敗", e);
      setConfigError(e.message || t('connectionFailed'));
      return false;
    }
  }, [t]);

  // セットアップフォーム送信ハンドラ
  const handleSetupSubmit = useCallback((configJson: string) => {
    try {
      const config = JSON.parse(configJson);
      if (tryConnect(config)) {
        localStorage.setItem('chatboard_firebase_config', JSON.stringify(config));
      }
    } catch (e) {
      setConfigError(t('invalidJson'));
    }
  }, [tryConnect, t]);

  // 接続解除ハンドラ
  const handleDisconnect = useCallback(() => {
    localStorage.removeItem('chatboard_firebase_config');
    window.location.reload();
  }, []);

  // 初期化時に既存の設定をチェック
  useEffect(() => {
    // 1. config.ts で設定済みかチェック
    if (db && auth) {
      setIsInitialized(true);
      return;
    }
    // 2. localStorage をチェック
    const saved = localStorage.getItem('chatboard_firebase_config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        tryConnect(config);
      } catch (e) {
        localStorage.removeItem('chatboard_firebase_config');
      }
    }
  }, [tryConnect]);

  // 認証状態の監視
  useEffect(() => {
    if (!isInitialized || !auth) return;
    
    const initAuth = async () => {
      try {
        if (INITIAL_AUTH_TOKEN) {
          await signInWithCustomToken(auth!, INITIAL_AUTH_TOKEN);
        } else {
          await signInAnonymously(auth!);
        }
      } catch (e) { 
        console.error("認証エラー", e); 
      }
    };
    
    initAuth();
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, [isInitialized]);

  return {
    user,
    isInitialized,
    configError,
    db,
    auth,
    tryConnect,
    handleSetupSubmit,
    handleDisconnect,
  };
};

// Firebase インスタンスへの直接アクセス用（サービス層で使用）
export const getFirebaseInstances = () => ({ app, auth, db });

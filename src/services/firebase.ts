/**
 * Firebase サービス層
 * Firebase初期化とインスタンス管理を担当
 */
import { FirebaseApp, initializeApp, getApps, getApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FIREBASE_CONFIG } from '../config';

// Firebase インスタンス
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

/**
 * Firebase設定からアプリを初期化
 */
export const initializeFirebase = (config?: any): { app: FirebaseApp; auth: Auth; db: Firestore } | null => {
  try {
    const firebaseConfig = config || FIREBASE_CONFIG;
    
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY_HERE") {
      return null;
    }

    // 既存のアプリがあれば再利用
    if (getApps().length > 0) {
      app = getApp();
    } else {
      app = initializeApp(firebaseConfig);
    }
    
    auth = getAuth(app);
    db = getFirestore(app);
    
    return { app, auth, db };
  } catch (error) {
    console.error('Firebase初期化エラー:', error);
    return null;
  }
};

/**
 * 現在のFirebaseインスタンスを取得
 */
export const getFirebaseInstances = () => ({ app, auth, db });

/**
 * Firestoreインスタンスを取得
 */
export const getDb = (): Firestore | undefined => db;

/**
 * Authインスタンスを取得
 */
export const getAuthInstance = (): Auth | undefined => auth;

/**
 * 初期化済みかどうかを確認
 */
export const isFirebaseInitialized = (): boolean => {
  return !!(app && auth && db);
};

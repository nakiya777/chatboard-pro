/**
 * 認証サービス
 * Firebase Authenticationを使用したユーザー認証を管理
 */
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';

export type UserRole = 'admin' | 'user' | 'guest';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  organization?: string;
  role: UserRole;
  invitedBy?: string;
  allowedThreadIds?: string[];
  createdAt: any;
  subscription?: 'free' | 'paid';
}

/**
 * 新規ユーザー登録
 */
export const registerUser = async (
  auth: Auth,
  db: Firestore,
  email: string,
  password: string,
  name: string,
  organization?: string
): Promise<UserProfile> => {
  // Firebase Authでユーザー作成
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Firestoreにプロフィール保存
  const userProfile: UserProfile = {
    id: user.uid,
    email: email,
    name: name,
    organization: organization || '',
    role: 'user',
    createdAt: serverTimestamp(),
    subscription: 'free'
  };

  await setDoc(doc(db, 'users', user.uid), userProfile);

  return userProfile;
};

/**
 * ゲストユーザー登録（招待から）
 */
export const registerGuest = async (
  auth: Auth,
  db: Firestore,
  email: string,
  password: string,
  name: string,
  invitedBy: string,
  allowedThreadIds: string[]
): Promise<UserProfile> => {
  // Firebase Authでユーザー作成
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Firestoreにゲストプロフィール保存
  const userProfile: UserProfile = {
    id: user.uid,
    email: email,
    name: name,
    role: 'guest',
    invitedBy: invitedBy,
    allowedThreadIds: allowedThreadIds,
    createdAt: serverTimestamp()
  };

  await setDoc(doc(db, 'users', user.uid), userProfile);

  return userProfile;
};

/**
 * ログイン
 */
export const loginUser = async (
  auth: Auth,
  email: string,
  password: string
): Promise<FirebaseUser> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

/**
 * ログアウト
 */
export const logoutUser = async (auth: Auth): Promise<void> => {
  await signOut(auth);
};

/**
 * パスワードリセットメール送信
 */
export const resetPassword = async (
  auth: Auth,
  email: string
): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

/**
 * ユーザープロフィール取得
 */
export const getUserProfile = async (
  db: Firestore,
  userId: string
): Promise<UserProfile | null> => {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

/**
 * ゲストをユーザーに昇格
 */
export const promoteGuestToUser = async (
  db: Firestore,
  userId: string,
  organization?: string
): Promise<void> => {
  await updateDoc(doc(db, 'users', userId), {
    role: 'user',
    organization: organization || '',
    // 昇格後もallowedThreadIdsは残す（全スレッドアクセス可能になるため参照されない）
  });
};

/**
 * 認証状態の監視
 */
export const observeAuthState = (
  auth: Auth,
  callback: (user: FirebaseUser | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

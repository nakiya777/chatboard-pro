/**
 * 招待サービス
 * ゲスト招待の作成・検証を管理
 */
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
  Timestamp,
  Firestore
} from 'firebase/firestore';

export interface Invitation {
  id: string;
  email?: string;
  projectId: string;
  threadIds: string[];
  token: string;
  expiresAt: Timestamp;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: any;
}

const INVITATIONS_COLLECTION = 'invitations';

/**
 * ランダムトークン生成
 */
const generateToken = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

/**
 * 招待作成（72時間有効）
 */
export const createInvitation = async (
  db: Firestore,
  projectId: string,
  threadIds: string[],
  email?: string
): Promise<{ id: string; token: string; url: string }> => {
  const token = generateToken();
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 72 * 60 * 60 * 1000)); // 72時間後

  const invitation = {
    email: email || null,
    projectId,
    threadIds,
    token,
    expiresAt,
    status: 'pending',
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, INVITATIONS_COLLECTION), invitation);
  
  // 招待URLを生成（現在のオリジンを使用）
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const url = `${baseUrl}/invite/${token}`;

  return {
    id: docRef.id,
    token,
    url
  };
};

/**
 * トークンで招待を検索
 */
export const getInvitationByToken = async (
  db: Firestore,
  token: string
): Promise<Invitation | null> => {
  const q = query(
    collection(db, INVITATIONS_COLLECTION),
    where('token', '==', token),
    where('status', '==', 'pending')
  );

  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0];
  const data = doc.data();
  
  // 有効期限チェック
  if (data.expiresAt.toDate() < new Date()) {
    // 期限切れの場合はステータスを更新
    await updateDoc(doc.ref, { status: 'expired' });
    return null;
  }

  return {
    id: doc.id,
    ...data
  } as Invitation;
};

/**
 * 招待を受諾済みにする
 */
export const acceptInvitation = async (
  db: Firestore,
  invitationId: string
): Promise<void> => {
  await updateDoc(doc(db, INVITATIONS_COLLECTION, invitationId), {
    status: 'accepted'
  });
};

/**
 * 招待をキャンセル
 */
export const cancelInvitation = async (
  db: Firestore,
  invitationId: string
): Promise<void> => {
  await updateDoc(doc(db, INVITATIONS_COLLECTION, invitationId), {
    status: 'expired'
  });
};

/**
 * プロジェクトの招待一覧取得
 */
export const getProjectInvitations = async (
  db: Firestore,
  projectId: string
): Promise<Invitation[]> => {
  const q = query(
    collection(db, INVITATIONS_COLLECTION),
    where('projectId', '==', projectId),
    where('status', '==', 'pending')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Invitation));
};

/**
 * 招待URLをクリップボードにコピー
 */
export const copyInvitationUrl = async (url: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (err) {
    console.error('Failed to copy URL:', err);
    return false;
  }
};

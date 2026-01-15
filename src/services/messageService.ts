/**
 * メッセージ操作サービス
 * Firestoreのメッセージコレクションに対するCRUD操作
 */
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import { APP_ID } from '../config';
import { Message } from '../types';

// コレクションパス
const getMessagesCollection = (db: Firestore) => 
  collection(db, 'artifacts', APP_ID, 'public', 'data', 'messages');

/**
 * 新規メッセージを作成
 */
export const createMessage = async (
  db: Firestore,
  data: {
    docId: string;
    content: string;
    author: string;
    authorId: string;
    parentId?: string | null;
    depth?: number;
    annotationIds?: string[];
  }
): Promise<string> => {
  const docRef = await addDoc(getMessagesCollection(db), {
    ...data,
    depth: data.depth || 0,
    annotationIds: data.annotationIds || [],
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

/**
 * メッセージを更新
 */
export const updateMessage = async (
  db: Firestore,
  messageId: string,
  data: Partial<Pick<Message, 'content' | 'annotationIds' | 'isEdited'>>
): Promise<void> => {
  await updateDoc(
    doc(db, 'artifacts', APP_ID, 'public', 'data', 'messages', messageId), 
    data
  );
};

/**
 * メッセージを編集（isEditedフラグを設定）
 */
export const editMessage = async (
  db: Firestore,
  messageId: string,
  content: string
): Promise<void> => {
  await updateMessage(db, messageId, { content, isEdited: true });
};

/**
 * メッセージを削除
 */
export const deleteMessage = async (
  db: Firestore,
  messageId: string
): Promise<void> => {
  await deleteDoc(
    doc(db, 'artifacts', APP_ID, 'public', 'data', 'messages', messageId)
  );
};

/**
 * メッセージにアノテーションをリンク
 */
export const linkAnnotationsToMessage = async (
  db: Firestore,
  messageId: string,
  annotationIds: string[]
): Promise<void> => {
  await updateMessage(db, messageId, { annotationIds });
};

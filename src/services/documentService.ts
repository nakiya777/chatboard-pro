/**
 * ドキュメント操作サービス
 * Firestoreのドキュメントコレクションに対するCRUD操作
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
import { DocData } from '../types';

// コレクションパス
const getDocumentsCollection = (db: Firestore) => 
  collection(db, 'artifacts', APP_ID, 'public', 'data', 'documents');

/**
 * 新規ドキュメントを作成
 */
export const createDocument = async (
  db: Firestore,
  data: {
    title: string;
    threadName: string;
    fileName: string;
    url: string;
    author: string;
  }
): Promise<string> => {
  const docRef = await addDoc(getDocumentsCollection(db), {
    ...data,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

/**
 * ドキュメントを更新
 */
export const updateDocument = async (
  db: Firestore,
  docId: string,
  data: Partial<Pick<DocData, 'title' | 'threadName' | 'fileName' | 'url'>>
): Promise<void> => {
  await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'documents', docId), data);
};

/**
 * ドキュメントを削除
 */
export const deleteDocument = async (
  db: Firestore,
  docId: string
): Promise<void> => {
  await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'documents', docId));
};

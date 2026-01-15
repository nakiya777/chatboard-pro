/**
 * アノテーション操作サービス
 * Firestoreのアノテーションコレクションに対するCRUD操作
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
import { Annotation } from '../types';

// コレクションパス
const getAnnotationsCollection = (db: Firestore) => 
  collection(db, 'artifacts', APP_ID, 'public', 'data', 'annotations');

/**
 * 新規アノテーションを作成
 */
export const createAnnotation = async (
  db: Firestore,
  data: Partial<Annotation> & { author: string; docId: string }
): Promise<string> => {
  const docRef = await addDoc(getAnnotationsCollection(db), {
    ...data,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

/**
 * アノテーションを更新
 */
export const updateAnnotation = async (
  db: Firestore,
  annotationId: string,
  data: Partial<Annotation>
): Promise<void> => {
  await updateDoc(
    doc(db, 'artifacts', APP_ID, 'public', 'data', 'annotations', annotationId), 
    data
  );
};

/**
 * アノテーションを削除
 */
export const deleteAnnotation = async (
  db: Firestore,
  annotationId: string
): Promise<void> => {
  await deleteDoc(
    doc(db, 'artifacts', APP_ID, 'public', 'data', 'annotations', annotationId)
  );
};

/**
 * 複数のアノテーションの色を変更
 */
export const updateAnnotationsColor = async (
  db: Firestore,
  annotationIds: string[],
  color: string
): Promise<void> => {
  await Promise.all(
    annotationIds.map(id => updateAnnotation(db, id, { stroke: color }))
  );
};

/**
 * 複数のアノテーションを削除
 */
export const deleteAnnotations = async (
  db: Firestore,
  annotationIds: string[]
): Promise<void> => {
  await Promise.all(
    annotationIds.map(id => deleteAnnotation(db, id))
  );
};

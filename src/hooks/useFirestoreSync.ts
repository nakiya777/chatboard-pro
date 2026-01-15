import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  Unsubscribe,
  Firestore 
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { APP_ID } from '../config';
import { DocData, Annotation, Message, Presence } from '../types';

export interface UseFirestoreSyncReturn {
  documents: DocData[];
  annotations: Annotation[];
  messages: Message[];
  presence: Presence[];
}

export const useFirestoreSync = (
  user: FirebaseUser | null, 
  isInitialized: boolean, 
  db: Firestore | undefined
): UseFirestoreSyncReturn => {
  const [documents, setDocuments] = useState<DocData[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [presence, setPresence] = useState<Presence[]>([]);

  useEffect(() => {
    if (!user || !isInitialized || !db) return;

    const unsubs: Unsubscribe[] = [
      // ドキュメント監視
      onSnapshot(
        collection(db, 'artifacts', APP_ID, 'public', 'data', 'documents'), 
        snap => setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() } as DocData)))
      ),
      
      // アノテーション監視
      onSnapshot(
        collection(db, 'artifacts', APP_ID, 'public', 'data', 'annotations'), 
        snap => setAnnotations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Annotation)))
      ),
      
      // メッセージ監視（時系列ソート付き）
      onSnapshot(
        collection(db, 'artifacts', APP_ID, 'public', 'data', 'messages'), 
        snap => {
          const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
          const sorted = msgs.sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() ?? Date.now();
            const tb = b.createdAt?.toMillis?.() ?? Date.now();
            return ta - tb;
          });
          setMessages(sorted);
        }
      ),
      
      // プレゼンス監視（30秒以内のアクティブユーザーのみ）
      onSnapshot(
        collection(db, 'artifacts', APP_ID, 'public', 'data', 'presence'), 
        snap => {
          const now = Date.now();
          setPresence(
            snap.docs
              .map(d => ({ uid: d.id, ...d.data() } as Presence))
              .filter(p => p.uid !== user.uid && (now - (p.lastSeen || 0) < 30000))
          );
        }
      )
    ];

    return () => unsubs.forEach(f => f());
  }, [user, isInitialized, db]);

  return {
    documents,
    annotations,
    messages,
    presence,
  };
};

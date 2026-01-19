import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  Unsubscribe,
  Firestore 
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { DocData, Annotation, Message, Presence } from '../types';

export interface UseFirestoreSyncReturn {
  documents: DocData[];
  annotations: Annotation[];
  messages: Message[];
  presence: Presence[];
}

export const useFirestoreSync = (
  user: FirebaseUser | null, 
  db: Firestore | undefined,
  projectId: string
): UseFirestoreSyncReturn => {
  const [documents, setDocuments] = useState<DocData[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [presence, setPresence] = useState<Presence[]>([]);

  useEffect(() => {
    if (!user || !db || !projectId) return;

    const unsubs: Unsubscribe[] = [
      onSnapshot(
        collection(db, 'projects', projectId, 'documents'), 
        snap => setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() } as DocData)))
      ),
      onSnapshot(
        collection(db, 'projects', projectId, 'annotations'), 
        snap => setAnnotations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Annotation)))
      ),
      onSnapshot(
        collection(db, 'projects', projectId, 'messages'), 
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
      onSnapshot(
        collection(db, 'projects', projectId, 'presence'), 
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
  }, [user, db, projectId]);

  return {
    documents,
    annotations,
    messages,
    presence,
  };
};

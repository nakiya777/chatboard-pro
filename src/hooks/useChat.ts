import { useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import { Firestore, collection, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Message } from '../types';

interface UseChatProps {
    user: User | null;
    db: Firestore;
    projectId: string;
    activeDocId: string | null;
    messages: Message[];
}

export const useChat = ({ user, db, projectId, activeDocId, messages }: UseChatProps) => {
    const [chatInput, setChatInput] = useState("");
    const [replyToId, setReplyToId] = useState<string | null>(null);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [linkModeMsgId, setLinkModeMsgId] = useState<string | null>(null);

    const handleSendChat = useCallback(async () => {
        if (!chatInput.trim() || !user || !db || !projectId) return;
        try {
          if (editingMessageId) {
            await updateDoc(doc(db, 'projects', projectId, 'messages', editingMessageId), { content: chatInput, isEdited: true });
            setEditingMessageId(null);
          } else {
            const parent = replyToId ? messages.find(m => m.id === replyToId) : null;
            await addDoc(collection(db, 'projects', projectId, 'messages'), {
              docId: activeDocId || 'global', parentId: replyToId || null, content: chatInput,
              author: `User-${user.uid.slice(0, 4)}`, authorId: user.uid, createdAt: serverTimestamp(), depth: parent ? (parent.depth || 0) + 1 : 0,
              annotationIds: [] 
            });
          }
          setChatInput(""); setReplyToId(null);
        } catch (err) { console.error("Chat Error", err); }
      }, [chatInput, user, replyToId, messages, activeDocId, editingMessageId, projectId, db]);

    const handleDeleteMessage = useCallback(async (id: string) => {
        if (!db || !projectId) return;
        await deleteDoc(doc(db, 'projects', projectId, 'messages', id));
    }, [db, projectId]);

    return {
        chatInput, setChatInput,
        replyToId, setReplyToId,
        editingMessageId, setEditingMessageId,
        linkModeMsgId, setLinkModeMsgId,
        handleSendChat, handleDeleteMessage
    };
};

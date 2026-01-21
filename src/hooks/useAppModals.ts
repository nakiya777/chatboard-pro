import React, { useState, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import { Firestore, collection, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { DocData } from '../types';
import { processImageToWebP } from '../utils/imageUtils';

interface UseAppModalsProps {
    user: User | null;
    db: Firestore;
    projectId: string;
    t: (key: string) => string;
    setActiveDocId: (id: string | null) => void;
    activeDocId: string | null;
}

export const useAppModals = ({ user, db, projectId, t, setActiveDocId, activeDocId }: UseAppModalsProps) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [modalData, setModalData] = useState<{ id: string | null, threadName: string, initialMsg: string, fileName: string, url: string, useImage: boolean }>({ id: null, threadName: '', initialMsg: '', fileName: '', url: '', useImage: true });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
        const webpUrl = await processImageToWebP(file);
         // Firestore limit is 1MB. Safety margin ~1.3M chars base64
        if (webpUrl.length > 1300000) { 
             alert(t('Image too large (Max 1MB)')); 
             return;
        }
        setModalData(prev => ({ ...prev, fileName: file.name, url: webpUrl, useImage: true }));
    } catch (e) {
        console.error(e);
        alert('Failed to process image');
    }
  }, [t]);

  const openAddModal = useCallback(() => {
    setModalMode('add');
    setModalData({ id: null, threadName: '', initialMsg: '', fileName: '', url: '', useImage: true });
    setIsDocModalOpen(true);
  }, []);
  
  const openEditModal = useCallback((d: DocData) => {
    setModalMode('edit');
    setModalData({ id: d.id, threadName: d.threadName || '', initialMsg: '', fileName: d.fileName, url: d.url, useImage: !!d.url });
    setIsDocModalOpen(true);
  }, []);

  const handleModalSubmit = async () => {
    if (!user) { alert('Login Error: User not found'); return; }
    if (!db) { alert('System Error: Database connection failed'); return; }
    if (!projectId) { alert('Project Error: Project ID is missing'); return; }

    try {
        const determinedName = !modalData.useImage ? t('whiteboard') : (modalData.fileName || t('whiteboard'));
        if (modalMode === 'add') {
          const docRef = await addDoc(collection(db, 'projects', projectId, 'documents'), { 
            title: determinedName, threadName: modalData.threadName, fileName: modalData.useImage ? modalData.fileName : t('whiteboard'), url: modalData.useImage ? modalData.url : '', createdAt: serverTimestamp(), author: user.uid 
          });
          if (modalData.threadName || modalData.initialMsg) {
            await addDoc(collection(db, 'projects', projectId, 'messages'), { 
              docId: docRef.id, content: modalData.initialMsg || `【${t('threadSubject')}: ${modalData.threadName}】`, author: `User-${user.uid.slice(0, 4)}`, authorId: user.uid, createdAt: serverTimestamp(), depth: 0 
            });
          }
          setActiveDocId(docRef.id);
        } else {
            if(modalData.id) {
                await updateDoc(doc(db, 'projects', projectId, 'documents', modalData.id), { threadName: modalData.threadName });
            }
        }
        setIsDocModalOpen(false);
    } catch (e: any) {
        console.error(e);
        alert(`Failed to create thread: ${e.message}`);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!user || !db || !projectId) return;
    await deleteDoc(doc(db, 'projects', projectId, 'documents', id));
    if (activeDocId === id) setActiveDocId(null);
    setIsDocModalOpen(false);
  };

  return {
    isSettingsOpen, setIsSettingsOpen,
    isDocModalOpen, setIsDocModalOpen,
    modalMode, setModalMode,
    modalData, setModalData,
    fileInputRef,
    onFileChange,
    openAddModal, openEditModal,
    handleModalSubmit, handleDeleteDoc
  };
};

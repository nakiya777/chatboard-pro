// ... imports
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Firestore,
  arrayUnion
} from 'firebase/firestore';

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  inviteCode?: string; // Add inviteCode
  createdAt: any;
}

const PROJECTS_COLLECTION = 'projects';

// Helper to generate 6-char alphanumeric code
const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Remove confusing chars (I, 1, O, 0)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * プロジェクト作成
 */
export const createProject = async (
  db: Firestore,
  name: string,
  description: string,
  ownerId: string
): Promise<string> => {
  const projectData = {
    name,
    description,
    ownerId,
    memberIds: [ownerId],
    inviteCode: generateInviteCode(),
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), projectData);
  return docRef.id;
};

// ... getProject, getUserProjects ...

// Update existing functions to be robust? No, they are fine.

/**
 * 招待コードでプロジェクトに参加
 */
export const joinProjectByCode = async (
  db: Firestore,
  userId: string,
  inviteCode: string
): Promise<string | null> => {
  // Query to find project with this code
  const q = query(
    collection(db, PROJECTS_COLLECTION),
    where('inviteCode', '==', inviteCode)
  );
  
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    throw new Error('Project not found or invalid code');
  }

  const projectDoc = querySnapshot.docs[0];
  const projectData = projectDoc.data() as Project;

  // Check if already a member
  if (projectData.memberIds.includes(userId)) {
    return projectDoc.id; // Already joined, just return ID
  }

  // Add user to memberIds
  await updateDoc(doc(db, PROJECTS_COLLECTION, projectDoc.id), {
    memberIds: arrayUnion(userId)
  });

  return projectDoc.id;
};

/**
 * 招待コードを再生成
 */
export const regenerateInviteCode = async (
  db: Firestore,
  projectId: string
): Promise<string> => {
  const newCode = generateInviteCode();
  await updateDoc(doc(db, PROJECTS_COLLECTION, projectId), {
    inviteCode: newCode
  });
  return newCode;
};

// ... existing updateProject, deleteProject ...

// ... existing addMemberToProject, removeMemberFromProject ...


/**
 * プロジェクト取得
 */
export const getProject = async (
  db: Firestore,
  projectId: string
): Promise<Project | null> => {
  const docRef = doc(db, PROJECTS_COLLECTION, projectId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Project;
  }
  return null;
};

/**
 * ユーザーのプロジェクト一覧取得
 */
export const getUserProjects = async (
  db: Firestore,
  userId: string
): Promise<Project[]> => {
  const q = query(
    collection(db, PROJECTS_COLLECTION),
    where('memberIds', 'array-contains', userId)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Project));
};

/**
 * プロジェクト更新
 */
export const updateProject = async (
  db: Firestore,
  projectId: string,
  data: Partial<Pick<Project, 'name' | 'description'>>
): Promise<void> => {
  await updateDoc(doc(db, PROJECTS_COLLECTION, projectId), data);
};

/**
 * プロジェクト削除
 */
export const deleteProject = async (
  db: Firestore,
  projectId: string
): Promise<void> => {
  await deleteDoc(doc(db, PROJECTS_COLLECTION, projectId));
};

/**
 * メンバーをプロジェクトに追加
 */
export const addMemberToProject = async (
  db: Firestore,
  projectId: string,
  userId: string
): Promise<void> => {
  const project = await getProject(db, projectId);
  if (project && !project.memberIds.includes(userId)) {
    await updateDoc(doc(db, PROJECTS_COLLECTION, projectId), {
      memberIds: [...project.memberIds, userId]
    });
  }
};

/**
 * メンバーをプロジェクトから削除
 */
export const removeMemberFromProject = async (
  db: Firestore,
  projectId: string,
  userId: string
): Promise<void> => {
  const project = await getProject(db, projectId);
  if (project) {
    await updateDoc(doc(db, PROJECTS_COLLECTION, projectId), {
      memberIds: project.memberIds.filter(id => id !== userId)
    });
  }
};

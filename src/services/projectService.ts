/**
 * プロジェクトサービス
 * プロジェクトのCRUD操作を管理
 */
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
  Firestore
} from 'firebase/firestore';

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  createdAt: any;
}

const PROJECTS_COLLECTION = 'projects';

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
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), projectData);
  return docRef.id;
};

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

/**
 * プレゼンス操作サービス
 * ユーザーのオンライン状態とカーソル位置を管理
 */
import { 
  doc, 
  setDoc,
  Firestore
} from 'firebase/firestore';
import { APP_ID } from '../config';

/**
 * プレゼンス情報を更新
 */
export const updatePresence = async (
  db: Firestore,
  userId: string,
  data: {
    x: number;
    y: number;
    name: string;
  }
): Promise<void> => {
  await setDoc(
    doc(db, 'artifacts', APP_ID, 'public', 'data', 'presence', userId),
    {
      ...data,
      lastSeen: Date.now()
    },
    { merge: true }
  );
};

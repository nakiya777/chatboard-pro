import { Timestamp } from 'firebase/firestore';

export interface DocData {
  id: string;
  title: string;
  threadName: string;
  fileName: string;
  url: string;
  createdAt: Timestamp;
  author: string;
}

/**
 * Annotation Data Structure
 * 
 * Coordinate System:
 * - x, y: Top-left corner of the unrotated bounding box.
 * - width, height: Dimensions of the unrotated bounding box.
 * - rotation: Degrees clockwise. Rotation occurs around the center (x + width/2, y + height/2).
 */
export interface Annotation {
  id: string;
  type: 'select' | 'arrow' | 'rect' | 'circle' | 'star' | 'text' | 'pencil' | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  stroke: string;
  strokeWidth: number;
  strokeStyle: string;
  fill: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  text?: string;
  docId: string;
  status: string;
  points?: { x: number; y: number }[];
  url?: string;
  arrowPoint?: { x: number; y: number };
  author: string;
  createdAt: Timestamp;
}

export interface Message {
  id: string;
  docId: string;
  parentId?: string | null;
  content: string;
  author: string;
  authorId: string;
  createdAt: Timestamp;
  depth: number;
  annotationIds?: string[];
  isEdited?: boolean;
}

export interface Presence {
  uid: string;
  x: number;
  y: number;
  lastSeen: number;
  name: string;
}

export interface ThemeStyles {
  radius: string;
  accent: string;
  textClass: string;
  baseColor: string;
  raised: string;
  raisedSm: string;
  pressed: string;
}

export interface ColorSystem {
  name: string;
  base: string;
  accent: string;
  shadow: string;
  highlight: string;
  text: string;
  textSecondary: string;
}

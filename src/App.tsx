import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Plus, MousePointer2, ArrowUpRight, Square, Circle, Type, Send, 
  MessageSquare, Image as ImageIcon, Trash2, ZoomIn, ZoomOut, 
  Maximize2, Layers, X, Check, User, Settings, 
  Edit2, Reply, Link, Globe, MessageCircle, 
  Sliders, Eraser, Star, Menu, Pencil, Bold, Italic, FileText, Upload,
  Database, Shield, LogOut, Save
} from 'lucide-react';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, addDoc, onSnapshot, 
  serverTimestamp, updateDoc, deleteDoc, setDoc, 
  Unsubscribe, Firestore, Timestamp
} from 'firebase/firestore';
import { Auth, getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, User as FirebaseUser, signOut } from 'firebase/auth';

import { FIREBASE_CONFIG, APP_ID, INITIAL_AUTH_TOKEN } from './config';
import { ANNOTATION_COLORS, THEME_MODES, COLOR_SYSTEMS, TRANSLATIONS } from './constants';
import { DocData, Annotation, Message, Presence, ThemeStyles, ColorSystem } from './types';

// ==========================================
// --- Global Instance Management ---
// ==========================================
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

// Try to initialize from config.ts if valid
try {
  if (FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY_HERE") {
    app = initializeApp(FIREBASE_CONFIG);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (e) {
  console.error("Initial Config Error", e);
}

// ==========================================
// --- Helper Components ---
// ==========================================

const ToolBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; tip: string; theme: ThemeStyles; sys: ColorSystem }> = ({ active, onClick, icon, tip, theme, sys }) => {
  return <button onClick={onClick} title={tip} className={`p-5 rounded-[1.5rem] transition-all ${active ? theme.pressed : 'opacity-40 hover:opacity-100 hover:scale-110'}`} style={{ color: active ? sys.accent : sys.accent + '80' }}>{icon}</button>;
};

const Handle: React.FC<{ x: number; y: number; cursor: string; onDown: (e: React.MouseEvent) => void; zoom: number; sys: ColorSystem }> = ({ x, y, cursor, onDown, zoom, sys }) => {
  return (
    <g onMouseDown={onDown} style={{ cursor }}>
      <circle cx={x} cy={y} r={20/zoom} fill="transparent" pointerEvents="all" />
      <circle cx={x} cy={y} r={9/zoom} fill="white" stroke={sys.accent} strokeWidth={3.5/zoom} className="shadow-xl" vectorEffect="non-scaling-stroke" style={{ transformOrigin: `${x}px ${y}px` }} />
    </g>
  );
};

const RenderShape: React.FC<{ shape: Annotation; isPreview?: boolean; isHighlighted?: boolean; isSelected?: boolean; zoom: number; sys: ColorSystem; t: any }> = ({ shape, isPreview, isHighlighted, isSelected, zoom, sys, t }) => {
  const common = {
    stroke: isSelected ? (sys?.accent || '#3b82f6') : shape.stroke, 
    strokeWidth: (isHighlighted ? shape.strokeWidth + 3 : (isSelected ? shape.strokeWidth + 2 : shape.strokeWidth)),
    strokeDasharray: isSelected ? `${4/zoom} ${2/zoom}` : (shape.strokeStyle === 'dashed' ? `${15/zoom} ${8/zoom}` : shape.strokeStyle === 'dotted' ? `${3/zoom} ${5/zoom}` : 'none'),
    fill: 'none', 
    opacity: shape.status === 'resolved' ? 0.2 : (isPreview ? 0.5 : 1),
    style: { transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }
  };
  const whiteFilter = shape.stroke === '#ffffff' ? { filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.3))' } : {};
  const glow = isHighlighted ? { filter: `drop-shadow(0 0 12px ${sys?.accent}90)` } : whiteFilter;
  const { x, y, width, height } = shape;
  
  return (
    <g>
      <rect x={x} y={y} width={Math.max(width || 0, 40)} height={Math.max(height || 0, 40)} fill="transparent" pointerEvents="all" />
      {(() => {
        switch (shape.type) {
          case 'rect': return <rect x={x} y={y} width={width} height={height} rx={10/zoom} {...common} {...glow} />;
          case 'circle': return <circle cx={x + (width||0)/2} cy={y + (height||0)/2} r={Math.sqrt((width||0)**2 + (height||0)**2) / 2} {...common} {...glow} />;
          case 'star': {
            const cx = x + (width||0) / 2; const cy = y + (height||0) / 2;
            const outerR = Math.min(Math.abs(width||0), Math.abs(height||0)) / 2;
            const innerR = outerR * 0.4;
            const pts = [];
            for (let i = 0; i < 10; i++) {
              const ang = (i * Math.PI) / 5 - Math.PI / 2;
              const r = i % 2 === 0 ? outerR : innerR;
              pts.push(`${cx + r * Math.cos(ang)},${cy + r * Math.sin(ang)}`);
            }
            return <path d={`M ${pts.join(' L ')} Z`} {...common} {...glow} />;
          }
          case 'arrow': {
            const ang = Math.atan2(height||0, width||0); const hl = 24/zoom; const ex = x + (width||0); const ey = y + (height||0);
            return (<g {...glow}><line x1={x} y1={y} x2={ex} y2={ey} {...common} />{!isPreview && <path d={`M ${ex} ${ey} L ${ex - hl * Math.cos(ang - Math.PI/6)} ${ey - hl * Math.sin(ang - Math.PI/6)} M ${ex} ${ey} L ${ex - hl * Math.cos(ang + Math.PI/6)} ${ey - hl * Math.sin(ang + Math.PI/6)}`} fill="none" stroke={common.stroke} strokeWidth={common.strokeWidth} />}</g>);
          }
          case 'text': 
            return (
              <foreignObject x={x} y={y} width={Math.max(width||0, 200)} height={Math.max(height||0, 100)} style={{ pointerEvents: 'none' }}>
                <div style={{ 
                  color: common.stroke, 
                  fontSize: `${shape.fontSize}px`, 
                  fontWeight: shape.fontWeight || '900', 
                  fontStyle: shape.fontStyle || 'normal',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-all', padding: '4px', fontFamily: 'sans-serif', ...glow 
                }}>
                  {shape.text || (isPreview ? '' : '')}
                </div>
              </foreignObject>
            );
          case 'pencil': {
            const dp = shape.points && shape.points.length > 0 ? `M ${shape.points[0].x} ${shape.points[0].y} ` + shape.points.map(p => `L ${p.x} ${p.y}`).join(' ') : '';
            return (<g transform={`translate(${x}, ${y})`}><path d={dp} {...common} strokeLinecap="round" strokeLinejoin="round" {...glow} /></g>);
          }
          default: return null;
        }
      })()}
    </g>
  );
}

// ==========================================
// --- Main Component ---
// ==========================================

export default function App() {
  // --- States ---
  const [isInitialized, setIsInitialized] = useState(false);
  const [configJson, setConfigJson] = useState("");
  const [configError, setConfigError] = useState("");

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [theme, setTheme] = useState('neumorphism');
  const [colorSystem, setColorSystem] = useState('standard');
  const [language, setLanguage] = useState('ja');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [documents, setDocuments] = useState<DocData[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null); 
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [presence, setPresence] = useState<Presence[]>([]);

  const [tool, setTool] = useState('select');
  const [selectedIds, setSelectedIds] = useState<string[]>([]); 
  const [activeAnnotationIds, setActiveAnnotationIds] = useState<string[]>([]); 
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [drawingShape, setDrawingShape] = useState<Partial<Annotation> | null>(null);
  const [transforming, setTransforming] = useState<any>(null);
  const [linkModeMsgId, setLinkModeMsgId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [textStyle, setTextStyle] = useState({ bold: false, italic: false, fontSize: 18, color: '#ef4444' });
  const [chatInput, setChatInput] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [defaults, setDefaults] = useState({ stroke: '#ef4444', strokeWidth: 3, strokeStyle: 'solid', status: 'open', fontSize: 18 });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [modalData, setModalData] = useState<{ id: string | null, threadName: string, initialMsg: string, fileName: string, url: string, useImage: boolean }>({ id: null, threadName: '', initialMsg: '', fileName: '', url: '', useImage: true });

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageSizeRef = useRef({ width: 0, height: 0 });
  const lastPresenceUpdate = useRef(0);

  // --- Helpers ---
  const sys = COLOR_SYSTEMS[colorSystem] || COLOR_SYSTEMS.standard;
  const t = useCallback((key: string) => TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key, [language]);
  const activeDocData = useMemo(() => documents.find(d => d.id === activeDocId), [documents, activeDocId]);
  const docMessages = useMemo(() => messages.filter(m => m.docId === (activeDocId || 'global')), [messages, activeDocId]);
  const selectedShapes = useMemo(() => annotations.filter(a => selectedIds.includes(a.id)), [annotations, selectedIds]);

  const currentTheme: ThemeStyles = useMemo(() => {
    const isDark = colorSystem === 'midnight';
    const br = theme === 'claymorphism' ? '2.5rem' : theme === 'glassmorphism' ? '1.2rem' : '2rem';
    
    const styles: ThemeStyles = { radius: br, accent: sys.accent, textClass: sys.text, baseColor: sys.base, raised: '', raisedSm: '', pressed: '' };
    
    if (theme === 'neumorphism') {
      styles.raised = `shadow-[8px_8px_16px_${sys.shadow},-8px_-8px_16px_${sys.highlight}]`;
      styles.raisedSm = `shadow-[4px_4px_8px_${sys.shadow},-4px_-4px_8px_${sys.highlight}]`;
      styles.pressed = `shadow-[inset_6px_6px_12px_${sys.shadow},inset_-6px_-6px_12px_${sys.highlight}]`;
    } else if (theme === 'claymorphism') {
      styles.raised = `shadow-[12px_12px_24px_${sys.shadow},-12px_-12px_24px_${sys.highlight},inset_8px_8px_16px_rgba(255,255,255,${isDark ? 0.1 : 0.5}),inset_-8px_-8px_16px_rgba(0,0,0,0.05)]`;
      styles.raisedSm = `shadow-[6px_6px_12px_${sys.shadow},-6px_-6px_12px_${sys.highlight},inset_4px_4px_8px_rgba(255,255,255,${isDark ? 0.1 : 0.5})]`;
      styles.pressed = `shadow-[inset_8px_8px_16px_${sys.shadow},inset_-8px_-8px_16px_${sys.highlight}]`;
    } else {
      styles.raised = `${isDark ? 'bg-white/10' : 'bg-white/40'} backdrop-blur-xl border border-white/30 shadow-xl shadow-black/10`;
      styles.raisedSm = `${isDark ? 'bg-white/10' : 'bg-white/30'} backdrop-blur-md border border-white/30 shadow-lg`;
      styles.pressed = 'bg-black/10 backdrop-blur-sm border border-black/10 shadow-inner';
    }
    return styles;
  }, [theme, colorSystem, sys]);

  const getSVGPoint = (e: React.MouseEvent | MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svgRef.current.getScreenCTM();
    if (ctm) {
      const inverse = ctm.inverse();
      const t = pt.matrixTransform(inverse);
      return { 
        x: (t.x - pan.x) / zoom, 
        y: (t.y - pan.y) / zoom 
      };
    }
    return { x: 0, y: 0 };
  };

  // --- Initialization & Setup Logic ---
  const tryConnect = useCallback((config: any) => {
    try {
      if (!config || !config.apiKey) throw new Error(t('invalidConfig'));
      // If app already exists with same options, it might throw, so we handle duplication if needed.
      // But here we assume single instance per reload or fresh start.
      // Note: In React Strict Mode, this might run twice.
      if (!app) {
        app = initializeApp(config);
        auth = getAuth(app);
        db = getFirestore(app);
      }
      setIsInitialized(true);
      return true;
    } catch (e: any) {
      console.error("Connection Failed", e);
      setConfigError(e.message || t('connectionFailed'));
      return false;
    }
  }, [t]);

  const handleSetupSubmit = () => {
    try {
      const config = JSON.parse(configJson);
      if (tryConnect(config)) {
        localStorage.setItem('chatboard_firebase_config', JSON.stringify(config));
      }
    } catch (e) {
      setConfigError(t('invalidJson'));
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('chatboard_firebase_config');
    window.location.reload();
  };

  useEffect(() => {
    // 1. Check if configured in code (config.ts)
    if (db && auth) {
      setIsInitialized(true);
      return;
    }
    // 2. Check localStorage
    const saved = localStorage.getItem('chatboard_firebase_config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        tryConnect(config);
      } catch (e) {
        localStorage.removeItem('chatboard_firebase_config');
      }
    }
  }, [tryConnect]);

  // --- Auth & Data Sync ---
  useEffect(() => {
    if (!isInitialized || !auth) return;
    const initAuth = async () => {
      try {
        if (INITIAL_AUTH_TOKEN) {
          await signInWithCustomToken(auth!, INITIAL_AUTH_TOKEN);
        } else {
          await signInAnonymously(auth!);
        }
      } catch(e) { console.error("Auth error", e); }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, [isInitialized]);

  useEffect(() => {
    if (!user || !isInitialized || !db) return;
    const unsubs: Unsubscribe[] = [
      onSnapshot(collection(db, 'artifacts', APP_ID, 'public', 'data', 'documents'), snap => setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() } as DocData)))),
      onSnapshot(collection(db, 'artifacts', APP_ID, 'public', 'data', 'annotations'), snap => setAnnotations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Annotation)))),
      onSnapshot(collection(db, 'artifacts', APP_ID, 'public', 'data', 'messages'), snap => {
        const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
        const sorted = msgs.sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() ?? Date.now();
            const tb = b.createdAt?.toMillis?.() ?? Date.now();
            return ta - tb;
        });
        setMessages(sorted);
      }),
      onSnapshot(collection(db, 'artifacts', APP_ID, 'public', 'data', 'presence'), snap => {
        const now = Date.now();
        setPresence(snap.docs.map(d => ({ uid: d.id, ...d.data() } as Presence)).filter(p => p.uid !== user.uid && (now - (p.lastSeen || 0) < 30000)));
      })
    ];
    return () => unsubs.forEach(f => f());
  }, [user, isInitialized]);

  useEffect(() => {
    if (!activeDocId) return;
    if (activeDocData?.url) {
      const img = new Image(); img.src = activeDocData.url;
      img.onload = () => { imageSizeRef.current = { width: img.naturalWidth, height: img.naturalHeight }; fitToScreen(); };
    } else {
      imageSizeRef.current = { width: 2000, height: 2000 }; fitToScreen();
    }
  }, [activeDocId, activeDocData?.url]); // Keep deps minimal to avoid resets

  const fitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    if (activeDocData?.url && imageSizeRef.current.width) {
      const scale = Math.min((cw - 100) / imageSizeRef.current.width, (ch - 100) / imageSizeRef.current.height, 1);
      setZoom(scale);
      setPan({ x: (cw - imageSizeRef.current.width * scale) / 2, y: (ch - imageSizeRef.current.height * scale) / 2 });
    } else {
      setZoom(1); setPan({ x: cw / 2, y: ch / 2 });
    }
  }, [activeDocData?.url]);

  // --- Interaction Handlers (Firebase Connected) ---
  const handleSendChat = useCallback(async () => {
    if (!chatInput.trim() || !user || !db) return;
    try {
      if (editingMessageId) {
        await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'messages', editingMessageId), { content: chatInput, isEdited: true });
        setEditingMessageId(null);
      } else {
        const parent = replyToId ? messages.find(m => m.id === replyToId) : null;
        await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'messages'), {
          docId: activeDocId || 'global', parentId: replyToId || null, content: chatInput,
          author: `User-${user.uid.slice(0, 4)}`, authorId: user.uid, createdAt: serverTimestamp(), depth: parent ? (parent.depth || 0) + 1 : 0,
          annotationIds: selectedIds 
        });
      }
      setChatInput(""); setReplyToId(null); setSelectedIds([]);
    } catch (err) { console.error("Chat Error", err); }
  }, [chatInput, user, replyToId, messages, activeDocId, selectedIds, editingMessageId, isInitialized]);

  const handleTextSave = useCallback(async () => {
    if (!editingTextId || !db) return;
    await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'annotations', editingTextId), { 
      text: textInput,
      stroke: textStyle.color,
      fontSize: textStyle.fontSize,
      fontWeight: textStyle.bold ? 'bold' : 'normal',
      fontStyle: textStyle.italic ? 'italic' : 'normal'
    });
    if (textInput.trim() && user) {
      const dateStr = new Date().toLocaleDateString();
      await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'messages'), {
        docId: activeDocId, annotationIds: [editingTextId], content: `[${dateStr}] ${t('updatedText')}: "${textInput}"`,
        author: `User-${user.uid.slice(0, 4)}`, authorId: user.uid, createdAt: serverTimestamp(), depth: 0
      });
    }
    setEditingTextId(null);
  }, [editingTextId, textInput, textStyle, activeDocId, user, t, isInitialized]);

  const handleDeleteMessage = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'messages', id));
  };

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (f) => { 
        if(f.target?.result) {
            setModalData(prev => ({ ...prev, fileName: file.name, url: f.target!.result as string, useImage: true })); 
        }
    };
    reader.readAsDataURL(file);
  }, []);

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
    if (!user || !db) return;
    const determinedName = !modalData.useImage ? t('whiteboard') : (modalData.fileName || t('whiteboard'));
    if (modalMode === 'add') {
      const docRef = await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'documents'), { 
        title: determinedName, threadName: modalData.threadName, fileName: modalData.useImage ? modalData.fileName : t('whiteboard'), url: modalData.useImage ? modalData.url : '', createdAt: serverTimestamp(), author: user.uid 
      });
      if (modalData.threadName || modalData.initialMsg) {
        await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'messages'), { 
          docId: docRef.id, content: modalData.initialMsg || `【${t('threadSubject')}: ${modalData.threadName}】`, author: `User-${user.uid.slice(0, 4)}`, authorId: user.uid, createdAt: serverTimestamp(), depth: 0 
        });
      }
      setActiveDocId(docRef.id);
    } else {
        if(modalData.id) {
            await updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'documents', modalData.id), { threadName: modalData.threadName });
        }
    }
    setIsDocModalOpen(false);
  };

  const handleDeleteDoc = async (id: string) => {
    if (!user || !db) return;
    await deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'documents', id));
    if (activeDocId === id) setActiveDocId(null);
    setIsDocModalOpen(false);
  };

  const changeActiveColor = useCallback((color: string) => {
    if (!db) return;
    if (selectedIds.length > 0) {
      selectedIds.forEach(id => updateDoc(doc(db!, 'artifacts', APP_ID, 'public', 'data', 'annotations', id), { stroke: color }));
    } else {
      setDefaults(p => ({ ...p, stroke: color }));
    }
  }, [selectedIds, isInitialized]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) { setIsPanning(true); return; }
    const pt = getSVGPoint(e);
    if (tool === 'select') {
      if ((e.target as Element).tagName === 'svg' || (e.target as Element).id === 'bg-layer') { setSelectedIds([]); setActiveAnnotationIds([]); setLinkModeMsgId(null); setEditingTextId(null); }
      return;
    }
    if (!activeDocId) return; 
    setDrawingShape({ type: tool as any, x: pt.x, y: pt.y, width: 0, height: 0, rotation: 0, stroke: defaults.stroke, strokeWidth: defaults.strokeWidth, strokeStyle: defaults.strokeStyle, fill: 'none', fontSize: defaults.fontSize, text: '', docId: activeDocId, status: defaults.status, points: [{ x: pt.x, y: pt.y }] });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pt = getSVGPoint(e);
    if (user && db && Date.now() - lastPresenceUpdate.current > 150) {
      setDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'presence', user.uid), { x: pt.x, y: pt.y, lastSeen: Date.now(), name: `User-${user.uid.slice(0, 4)}` }, { merge: true });
      lastPresenceUpdate.current = Date.now();
    }
    if (isPanning) { setPan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY })); return; }
    if (drawingShape && drawingShape.points) { 
      if (drawingShape.type === 'pencil') { setDrawingShape(p => ({ ...p, points: [...(p?.points || []), { x: pt.x, y: pt.y }] })); }
      else { setDrawingShape(p => ({ ...p, width: pt.x - (p?.x || 0), height: pt.y - (p?.y || 0) })); }
      return; 
    }
    if (transforming && user && db) {
      const { id, type, handle, startPt, startShape } = transforming;
      let up: any = {};
      if (type === 'move') up = { x: startShape.x + (pt.x - startPt.x), y: startShape.y + (pt.y - startPt.y) };
      else if (type === 'rotate') up = { rotation: Math.atan2(pt.y - (startShape.y + (startShape.height || 0)/2), pt.x - (startShape.x + (startShape.width || 0)/2)) * (180/Math.PI) + 90 };
      else if (type === 'resize') {
        if (handle.includes('e')) up.width = pt.x - startShape.x;
        if (handle.includes('s')) up.height = pt.y - startShape.y;
        if (handle.includes('w')) { up.x = pt.x; up.width = (startShape.width || 0) + (startShape.x - pt.x); }
        if (handle.includes('n')) { up.y = pt.y; up.height = (startShape.height || 0) + (startShape.y - pt.y); }
      }
      updateDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'annotations', id), up);
    }
  };

  const handleMouseUp = async () => {
    const shape = drawingShape; setDrawingShape(null); setTransforming(null); setIsPanning(false);
    if (shape && user && activeDocId && db) {
      const isText = shape.type === 'text';
      const isPencil = shape.type === 'pencil';
      let n = { ...shape } as any;
      if (!isPencil) {
        n.x = (shape.width || 0) < 0 ? (shape.x || 0) + (shape.width || 0) : (shape.x || 0); 
        n.y = (shape.height || 0) < 0 ? (shape.y || 0) + (shape.height || 0) : (shape.y || 0);
        n.width = isText ? Math.max(Math.abs(shape.width || 0), 200) : Math.abs(shape.width || 0);
        n.height = isText ? Math.max(Math.abs(shape.height || 0), 100) : Math.abs(shape.height || 0);
      } else { n.x = 0; n.y = 0; } 
      if (isText || isPencil || n.width > 2 || n.height > 2) {
        const annRef = await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'annotations'), { ...n, author: user.uid, createdAt: serverTimestamp() });
        const dateStr = new Date().toLocaleDateString();
        const typeLabel = t('tool' + (shape.type?.charAt(0).toUpperCase() || '') + shape.type?.slice(1));
        await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'messages'), { docId: activeDocId, annotationIds: [annRef.id], content: `[${dateStr}] ${typeLabel}${t('addedItem')}`, author: `User-${user.uid.slice(0, 4)}`, authorId: user.uid, createdAt: serverTimestamp(), depth: 0 });
        setTool('select'); setSelectedIds([annRef.id]); setActiveAnnotationIds([annRef.id]);
        if (isText) {
          setEditingTextId(annRef.id);
          setTextInput("");
          setTextStyle({ bold: false, italic: false, fontSize: defaults.fontSize, color: defaults.stroke });
        }
      }
    }
  };

  // --- Render: System Setup Screen ---
  if (!isInitialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#e6e9ef] p-6 font-sans">
        <div className="w-full max-w-lg bg-[#e6e9ef] rounded-[2rem] shadow-[8px_8px_16px_#b8bec9,-8px_-8px_16px_#ffffff] p-10 flex flex-col gap-8 animate-in zoom-in-95">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-20 h-20 rounded-[1.5rem] bg-[#e6e9ef] shadow-[inset_6px_6px_12px_#b8bec9,inset_-6px_-6px_12px_#ffffff] flex items-center justify-center text-slate-700">
              <Database size={40} />
            </div>
            <h1 className="text-3xl font-black text-slate-700 tracking-tighter uppercase">{t('systemSetup')}</h1>
            <p className="text-sm font-bold text-slate-400">{t('setupDescription')}</p>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
              <textarea 
                value={configJson}
                onChange={(e) => { setConfigJson(e.target.value); setConfigError(""); }}
                placeholder={`{ "apiKey": "...", "authDomain": "...", ... }`}
                className="w-full h-48 p-6 rounded-2xl bg-[#e6e9ef] shadow-[inset_6px_6px_12px_#b8bec9,inset_-6px_-6px_12px_#ffffff] text-xs font-mono text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all"
              />
              <div className="absolute top-4 right-4 pointer-events-none opacity-20">
                <Shield size={20} />
              </div>
            </div>
            {configError && (
              <div className="p-4 rounded-xl bg-red-50 text-red-500 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <X size={14} /> {configError}
              </div>
            )}
            <div className="text-[10px] font-bold text-slate-400 px-2">
              {t('configNote')}
            </div>
          </div>

          <button 
            onClick={handleSetupSubmit}
            disabled={!configJson.trim()}
            className="w-full py-5 rounded-[1.5rem] bg-indigo-600 text-white font-black uppercase text-xs shadow-[8px_8px_16px_#b8bec9,-8px_-8px_16px_#ffffff] hover:shadow-none hover:translate-y-[1px] active:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save size={16} /> {t('connectBtn')}
          </button>
        </div>
      </div>
    );
  }

  // --- Render: Main App ---
  // Reuse existing render logic but add Disconnect button in Settings
  const Sidebar = () => (
    <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-80'} ${currentTheme.raised} flex flex-col shrink-0 overflow-hidden z-30 transition-all duration-500`} style={{ borderRadius: currentTheme.radius, backgroundColor: sys.base }}>
      <div className={`p-6 border-b border-white/10 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="cursor-pointer flex items-center gap-3 transition-all" role="button" tabIndex={0}>
          <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center ${currentTheme.raisedSm}`} style={{ color: sys.accent }}>{isSidebarCollapsed ? <Menu size={24} /> : <Layers size={24} />}</div>
          {!isSidebarCollapsed && <h1 className={`font-black tracking-tighter text-xl uppercase ${currentTheme.textClass}`}>ChatBoard</h1>}
        </div>
        {!isSidebarCollapsed && (
          <div className="flex items-center gap-1">
            <button onClick={() => setIsSettingsOpen(true)} className={`p-3 rounded-xl opacity-60 hover:opacity-100 transition-all ${currentTheme.raisedSm}`} style={{ color: sys.accent }}><Settings size={18} /></button>
            <button onClick={openAddModal} className={`p-3 rounded-xl opacity-60 hover:opacity-100 transition-all ${currentTheme.raisedSm}`} style={{ color: sys.accent }}><Plus size={18} /></button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {documents.map(d => (
          <div key={d.id} onClick={() => { setActiveDocId(d.id); setSelectedIds([]); }} role="button" tabIndex={0} className={`p-4 cursor-pointer transition-all group ${isSidebarCollapsed ? 'justify-center' : ''} ${activeDocId === d.id ? currentTheme.pressed : 'hover:scale-[0.98] opacity-60'}`} style={{ borderRadius: currentTheme.radius }}>
            <div className={`flex items-start ${isSidebarCollapsed ? 'justify-center' : 'gap-4'}`}>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${currentTheme.raisedSm}`} style={{ color: activeDocId === d.id ? sys.accent : '#94a3b8' }}>{d.url ? <ImageIcon size={20} /> : <Eraser size={20} />}</div>
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0 flex flex-col gap-0.5 animate-in fade-in">
                  <p className={`text-[9px] font-black opacity-30 uppercase ${currentTheme.textClass}`}>{d.createdAt ? new Date(d.createdAt.seconds * 1000).toLocaleDateString() : '--/--/--'}</p>
                  <p className={`text-sm font-black leading-tight truncate ${currentTheme.textClass}`}>{d.title || d.fileName}</p>
                  <p className={`text-[10px] font-bold opacity-30 truncate italic ${currentTheme.textClass}`}>{d.url ? d.fileName : t('whiteboard')}</p>
                </div>
              )}
              {!isSidebarCollapsed && <button onClick={(e) => { e.stopPropagation(); openEditModal(d); }} className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${currentTheme.raisedSm}`} style={{ color: sys.accent }}><Sliders size={14} /></button>}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );

  const determinedName = modalData.useImage ? modalData.fileName : t('whiteboard');
  const currentDeterminedDocNameLabel = !modalData.useImage ? t('whiteboard') : (modalData.fileName || t('whiteboard'));

  return (
    <div className="flex h-screen w-full transition-colors duration-700 font-sans select-none p-4 gap-4" style={{ backgroundColor: sys.base }}>
      <Sidebar />

      <main ref={containerRef} className={`flex-1 ${currentTheme.pressed} relative overflow-hidden transition-all`} style={{ borderRadius: currentTheme.radius, backgroundColor: sys.base }}>
        {activeDocId && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4">
            <div className={`flex flex-col gap-3 p-3 ${currentTheme.raised} border border-white/10 backdrop-blur-md`} style={{ borderRadius: currentTheme.radius }}>
              <div className="flex items-center gap-2">
                <ToolBtn active={tool === 'select'} onClick={() => { setTool('select'); setSelectedIds([]); }} icon={<MousePointer2 size={18} />} tip={t('toolSelect')} theme={currentTheme} sys={sys} />
                <div className="w-px h-6 bg-white/10 mx-1" />
                <ToolBtn active={tool === 'pencil'} onClick={() => { setTool('pencil'); setSelectedIds([]); }} icon={<Pencil size={18} />} tip={t('toolPencil')} theme={currentTheme} sys={sys} />
                <ToolBtn active={tool === 'arrow'} onClick={() => { setTool('arrow'); setSelectedIds([]); }} icon={<ArrowUpRight size={18} />} tip={t('toolArrow')} theme={currentTheme} sys={sys} />
                <ToolBtn active={tool === 'rect'} onClick={() => { setTool('rect'); setSelectedIds([]); }} icon={<Square size={18} />} tip={t('toolRect')} theme={currentTheme} sys={sys} />
                <ToolBtn active={tool === 'circle'} onClick={() => { setTool('circle'); setSelectedIds([]); }} icon={<Circle size={18} />} tip={t('toolCircle')} theme={currentTheme} sys={sys} />
                <ToolBtn active={tool === 'star'} onClick={() => { setTool('star'); setSelectedIds([]); }} icon={<Star size={18} />} tip={t('toolStar')} theme={currentTheme} sys={sys} />
                <ToolBtn active={tool === 'text'} onClick={() => { setTool('text'); setSelectedIds([]); }} icon={<Type size={18} />} tip={t('toolText')} theme={currentTheme} sys={sys} />
                <div className="w-px h-6 bg-white/10 mx-1" />
                <button onClick={() => setZoom(z => Math.min(z * 1.2, 5))} className={`p-3 rounded-2xl opacity-60 hover:opacity-100 transition-all ${currentTheme.raisedSm}`} style={{ color: sys.accent }}><ZoomIn size={18} /></button>
                <button onClick={() => setZoom(z => Math.max(z * 0.8, 0.05))} className={`p-3 rounded-2xl opacity-60 hover:opacity-100 transition-all ${currentTheme.raisedSm}`} style={{ color: sys.accent }}><ZoomOut size={18} /></button>
                <button onClick={fitToScreen} className={`p-3 rounded-2xl transition-all ${currentTheme.raisedSm}`} style={{ color: sys.accent }}><Maximize2 size={18} /></button>
              </div>
              <div className="flex items-center justify-center gap-4 py-1 border-t border-white/10 mt-1 pt-3">
                <div className="flex gap-2.5">{ANNOTATION_COLORS.map(c => (<button key={c} onClick={() => changeActiveColor(c)} className={`w-7 h-7 rounded-full border-2 border-white transition-all ${(selectedShapes[0]?.stroke || defaults.stroke) === c ? 'scale-125 shadow-xl ring-2' : 'opacity-40 hover:opacity-100'}`} style={{ backgroundColor: c, outlineColor: sys.accent }} />))}</div>
                {selectedIds.length > 0 && <button onClick={() => { selectedIds.forEach(id => deleteDoc(doc(db!, 'artifacts', APP_ID, 'public', 'data', 'annotations', id))); setSelectedIds([]); }} className={`p-2.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors ml-2`}><Trash2 size={16} /></button>}
              </div>
            </div>
          </div>
        )}
        <div className="w-full h-full cursor-crosshair relative">
          {activeDocId ? (
            <>
              <svg ref={svgRef} className="w-full h-full touch-none outline-none" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                <defs><pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke={sys.accent} strokeWidth="1" opacity="0.05"/></pattern></defs>
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                  <rect id="bg-layer" width="10000" height="10000" x="-5000" y="-5000" fill="url(#grid)" fillOpacity="0" />
                  {activeDocData?.url && <image href={activeDocData.url} x="0" y="0" style={{ pointerEvents: 'none' }} />}
                  {drawingShape && <RenderShape shape={drawingShape as Annotation} isPreview zoom={zoom} sys={sys} t={t} />}
                  {annotations.filter(a => a.docId === activeDocId).map(ann => (
                    <g key={ann.id} transform={`rotate(${ann.rotation || 0}, ${ann.x + (ann.width || 0)/2}, ${ann.y + (ann.height || 0)/2})`}
                      onClick={(e) => { e.stopPropagation(); if (linkModeMsgId) { const msg = messages.find(m => m.id === linkModeMsgId); let ids = msg?.annotationIds || []; ids = ids.includes(ann.id) ? ids.filter(i => i !== ann.id) : [...ids, ann.id]; updateDoc(doc(db!, 'artifacts', APP_ID, 'public', 'data', 'messages', linkModeMsgId), { annotationIds: ids }); return; } if (e.shiftKey) { setSelectedIds(p => p.includes(ann.id) ? p.filter(i => i !== ann.id) : [...p, ann.id]); } else { setSelectedIds([ann.id]); setActiveAnnotationIds([ann.id]); } setTool('select'); }}
                      onDoubleClick={(e) => { if (ann.type === 'text') { e.stopPropagation(); setEditingTextId(ann.id); setTextInput(ann.text || ""); setTextStyle({ bold: ann.fontWeight === 'bold', italic: ann.fontStyle === 'italic', fontSize: ann.fontSize || 18, color: ann.stroke || '#000000' }); }}}
                      onMouseDown={(e) => { if (tool !== 'select' || linkModeMsgId) return; e.stopPropagation(); if (!selectedIds.includes(ann.id)) { setSelectedIds([ann.id]); setActiveAnnotationIds([ann.id]); } setTransforming({ id: ann.id, type: 'move', startPt: getSVGPoint(e), startShape: { ...ann } }); }}
                      className="cursor-move"
                    ><RenderShape shape={ann} isSelected={selectedIds.includes(ann.id)} isHighlighted={activeAnnotationIds.includes(ann.id)} zoom={zoom} sys={sys} t={t} /></g>
                  ))}
                  {presence.map(p => (<g key={p.uid} transform={`translate(${p.x}, ${p.y})`} style={{ pointerEvents: 'none' }}><path d="M0 0 L10 10 L5 10 L3 15 Z" fill={sys.accent} stroke="white" strokeWidth={0.5 / zoom} transform={`scale(${1/zoom})`} /><g transform={`scale(${1/zoom}) translate(10, 12)`}><rect x="0" y="0" width={p.name.length * 6 + 10} height="16" rx="5" fill={sys.accent} /><text x="5" y="11" fontSize="9" fontWeight="bold" fill="white">{p.name}</text></g></g>))}
                  {selectedIds.length === 1 && tool === 'select' && selectedShapes[0] && selectedShapes[0].type !== 'pencil' && (
                    <g transform={`rotate(${selectedShapes[0].rotation || 0}, ${selectedShapes[0].x + (selectedShapes[0].width || 0)/2}, ${selectedShapes[0].y + (selectedShapes[0].height || 0)/2})`}>
                      <rect x={selectedShapes[0].x - 4/zoom} y={selectedShapes[0].y - 4/zoom} width={(selectedShapes[0].width || 0) + 8/zoom} height={(selectedShapes[0].height || 0) + 8/zoom} fill="none" stroke={sys.accent} strokeWidth={1/zoom} strokeDasharray={`${4/zoom} ${2/zoom}`} />
                      <Handle x={selectedShapes[0].x} y={selectedShapes[0].y} cursor="nw-resize" onDown={(e) => { e.stopPropagation(); setTransforming({ id: selectedIds[0], type: 'resize', handle: 'nw', startPt: getSVGPoint(e), startShape: { ...selectedShapes[0] } }); }} zoom={zoom} sys={sys} />
                      <Handle x={selectedShapes[0].x + (selectedShapes[0].width || 0)} y={selectedShapes[0].y} cursor="ne-resize" onDown={(e) => { e.stopPropagation(); setTransforming({ id: selectedIds[0], type: 'resize', handle: 'ne', startPt: getSVGPoint(e), startShape: { ...selectedShapes[0] } }); }} zoom={zoom} sys={sys} />
                      <Handle x={selectedShapes[0].x} y={selectedShapes[0].y + (selectedShapes[0].height || 0)} cursor="sw-resize" onDown={(e) => { e.stopPropagation(); setTransforming({ id: selectedIds[0], type: 'resize', handle: 'sw', startPt: getSVGPoint(e), startShape: { ...selectedShapes[0] } }); }} zoom={zoom} sys={sys} />
                      <Handle x={selectedShapes[0].x + (selectedShapes[0].width || 0)} y={selectedShapes[0].y + (selectedShapes[0].height || 0)} cursor="se-resize" onDown={(e) => { e.stopPropagation(); setTransforming({ id: selectedIds[0], type: 'resize', handle: 'se', startPt: getSVGPoint(e), startShape: { ...selectedShapes[0] } }); }} zoom={zoom} sys={sys} />
                      <g className="cursor-alias" onMouseDown={(e) => { e.stopPropagation(); setTransforming({ id: selectedIds[0], type: 'rotate', startPt: getSVGPoint(e), startShape: { ...selectedShapes[0] } }); }}><circle cx={selectedShapes[0].x + (selectedShapes[0].width || 0)/2} cy={selectedShapes[0].y - 35/zoom} r={9/zoom} fill="white" stroke={sys.accent} strokeWidth={2.5/zoom} /><line x1={selectedShapes[0].x + (selectedShapes[0].width || 0)/2} y1={selectedShapes[0].y} x2={selectedShapes[0].x + (selectedShapes[0].width || 0)/2} y2={selectedShapes[0].y - 26/zoom} stroke={sys.accent} strokeWidth={1/zoom} /></g>
                    </g>
                  )}
                </g>
              </svg>
              {editingTextId && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                   <div className={`${currentTheme.raised} w-full max-w-lg p-10 flex flex-col gap-8 transform animate-in zoom-in-95 duration-300`} style={{ borderRadius: currentTheme.radius, backgroundColor: sys.base }}>
                      <div className="flex justify-between items-center"><h2 className={`text-xl font-black uppercase flex items-center gap-3 ${currentTheme.textClass}`}><Type size={20} />{t('editTextTitle')}</h2><button onClick={() => setEditingTextId(null)} className="p-2 rounded-lg opacity-40 hover:opacity-100 transition-all"><X size={20}/></button></div>
                      <textarea autoFocus value={textInput} onChange={e => setTextInput(e.target.value)} placeholder={t('textPlaceholder')} className={`w-full p-6 min-h-[160px] rounded-3xl border-none focus:ring-4 focus:ring-indigo-500/20 outline-none text-lg font-bold resize-none ${currentTheme.pressed} ${currentTheme.textClass}`} style={{ color: textStyle.color, fontWeight: textStyle.bold ? 'bold' : 'normal', fontStyle: textStyle.italic ? 'italic' : 'normal', backgroundColor: sys.base }} />
                      <div className="flex flex-wrap items-center justify-between gap-6 border-t border-white/10 pt-6">
                        <div className="flex items-center gap-3"><button onClick={() => setTextStyle(p=>({...p, bold: !p.bold}))} className={`p-3 rounded-xl transition-all ${textStyle.bold ? 'bg-indigo-600 text-white shadow-lg' : currentTheme.raisedSm + ' opacity-50'}`}><Bold size={18}/></button><button onClick={() => setTextStyle(p=>({...p, italic: !p.italic}))} className={`p-3 rounded-xl transition-all ${textStyle.italic ? 'bg-indigo-600 text-white shadow-lg' : currentTheme.raisedSm + ' opacity-50'}`}><Italic size={18}/></button><div className="w-px h-6 bg-white/10 mx-2" /><span className="text-[10px] font-black opacity-30 uppercase">{t('fontSize')}</span><input type="range" min="10" max="120" value={textStyle.fontSize} onChange={e => setTextStyle(p=>({...p, fontSize: parseInt(e.target.value)}))} className="w-24 accent-indigo-600" /></div>
                        <div className="flex gap-2">{ANNOTATION_COLORS.map(c => (<button key={c} onClick={() => setTextStyle(p=>({...p, color: c}))} className={`w-6 h-6 rounded-full border-2 border-white transition-all ${textStyle.color === c ? 'scale-125 ring-2' : 'opacity-40 hover:opacity-100'}`} style={{ backgroundColor: c, outlineColor: sys.accent }} />))}</div>
                      </div>
                      <div className="flex gap-4"><button onClick={() => setEditingTextId(null)} className="flex-1 py-4 rounded-2xl font-black uppercase text-xs opacity-50">{t('cancel')}</button><button onClick={handleTextSave} className="flex-[2] py-4 rounded-2xl text-white font-black uppercase text-xs shadow-xl active:scale-95" style={{ backgroundColor: sys.accent }}>{t('save')}</button></div>
                   </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-12"><div className={`p-24 ${currentTheme.raised} flex flex-col items-center gap-14 max-w-3xl border border-white/5`} style={{ borderRadius: currentTheme.radius }}><div className={`w-36 h-36 rounded-[3rem] ${currentTheme.pressed} flex items-center justify-center`} style={{ color: sys.accent }}><MessageCircle size={72} className="drop-shadow-2xl" /></div><div className="text-center space-y-6"><h2 className={`text-5xl font-black tracking-tighter uppercase ${currentTheme.textClass}`}>{t('projectReady')}</h2><p className={`font-bold text-xl opacity-60 ${currentTheme.textClass}`}>{t('welcomeMsg')}</p></div><button onClick={openAddModal} className={`p-10 ${currentTheme.raised} text-white flex flex-col items-center gap-6 shadow-2xl`} style={{ backgroundColor: sys.accent, borderRadius: currentTheme.radius }}><Plus size={48} /><span className="text-sm font-black uppercase tracking-widest">{t('setupDoc')}</span></button></div></div>
          )}
        </div>
      </main>

      {/* Discussion Area */}
      <aside className={`w-[450px] ${currentTheme.raised} flex flex-col shrink-0 overflow-hidden z-30 transition-all`} style={{ borderRadius: currentTheme.radius, backgroundColor: sys.base }}>
        <div className="p-6 border-b border-white/20 flex items-center justify-between">
          <h2 className={`text-sm font-black flex items-center gap-3 uppercase tracking-tighter ${currentTheme.textClass}`}>{activeDocId ? <MessageSquare size={20} style={{ color: sys.accent }} /> : <Globe size={20} style={{ color: sys.accent }} />}{activeDocId ? t('discussionStream') : t('globalWorkspace')}</h2>
          <div className={`px-4 py-1.5 rounded-full ${currentTheme.pressed} text-[10px] font-black uppercase tracking-widest`} style={{ color: sys.accent }}>{t('live')}</div>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-2">
          {docMessages.map(msg => {
            const isMine = msg.authorId === user?.uid;
            const isSelected = linkModeMsgId === msg.id || activeAnnotationIds.some(id => msg.annotationIds?.includes(id));
            return (
              <div key={msg.id} className="mt-5 group" style={{ marginLeft: `${(msg.depth || 0) * 14}px` }}>
                <div role="button" tabIndex={0} className={`p-4 transition-all cursor-pointer border-2 ${editingMessageId === msg.id || isSelected ? 'border-sky-400 bg-sky-500/5 shadow-lg' : 'border-transparent ' + currentTheme.raisedSm}`} style={{ borderRadius: currentTheme.radius, backgroundColor: sys.base }} onClick={() => { if (msg.annotationIds && msg.annotationIds.length > 0) { setSelectedIds(msg.annotationIds); setActiveAnnotationIds(msg.annotationIds); setTool('select'); } }}>
                  <div className="flex justify-between items-center mb-2"><span className={`text-[10px] font-black opacity-50 flex items-center gap-2 uppercase tracking-widest ${currentTheme.textClass}`}><div className={`w-7 h-7 rounded-full flex items-center justify-center ${currentTheme.pressed}`}><User size={12} /></div>{msg.author}</span><div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">{isMine && <button onClick={(e) => { e.stopPropagation(); setEditingMessageId(msg.id); setChatInput(msg.content); }} className="p-1.5 hover:text-sky-500"><Edit2 size={13} /></button>}<button onClick={(e) => { e.stopPropagation(); setLinkModeMsgId(linkModeMsgId === msg.id ? null : msg.id); }} className="p-1.5"><Link size={13} /></button><button onClick={(e) => { e.stopPropagation(); setReplyToId(msg.id); setChatInput(`@${msg.author} `); }} className="p-1.5"><Reply size={13} /></button>{isMine && <button onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }} className="p-1.5 hover:text-red-500"><Trash2 size={13} /></button>}</div></div>
                  {msg.annotationIds && msg.annotationIds.length > 0 && <div className="mb-2 flex items-center gap-1.5"><span className="text-[9px] font-black bg-indigo-500 text-white px-2 py-0.5 rounded-full">{msg.annotationIds.length} {t('linkedTo')}</span></div>}
                  <p className={`text-sm leading-relaxed font-semibold ${currentTheme.textClass}`}>{msg.content} {msg.isEdited && <span className="text-[9px] opacity-30 italic">{t('edited')}</span>}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-8 border-t border-white/10">
          {editingMessageId && <div className="mb-3 p-3 rounded-xl bg-sky-500/10 flex justify-between items-center"><span className="text-[10px] font-black uppercase text-sky-600">EDITING MODE</span><button onClick={() => {setEditingMessageId(null); setChatInput("");}} className="p-1"><X size={12}/></button></div>}
          <div className={`relative p-2 ${currentTheme.pressed}`} style={{ borderRadius: currentTheme.radius }}>
            <textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={t('writeMsg')} className={`w-full pl-6 pr-20 py-6 rounded-[1.8rem] bg-transparent focus:outline-none text-base font-bold leading-relaxed resize-none ${currentTheme.textClass}`} rows={2} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); }}} />
            <button onClick={handleSendChat} disabled={!chatInput.trim()} className={`absolute right-4 bottom-4 p-5 rounded-[1.5rem] transition-all ${chatInput.trim() ? 'shadow-lg scale-105' : 'grayscale opacity-30'} ${currentTheme.raisedSm}`} style={{ backgroundColor: chatInput.trim() ? (editingMessageId ? '#0ea5e9' : sys.accent) : '#94a3b8', color: 'white' }}>{editingMessageId ? <Check size={24} /> : <Send size={24} />}</button>
          </div>
        </div>
      </aside>

      {/* Preferences Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"><div className={`${currentTheme.raised} w-full max-w-md p-10 flex flex-col gap-10`} style={{ borderRadius: currentTheme.radius, backgroundColor: sys.base }}><div className="flex justify-between items-center"><h2 className={`text-2xl font-black uppercase flex items-center gap-3 ${currentTheme.textClass}`}><Settings size={20} />{t('preferences')}</h2><button onClick={() => setIsSettingsOpen(false)} className={`p-3 rounded-xl ${currentTheme.raisedSm}`} style={{ color: sys.accent }}><X size={20} /></button></div>
          <div className="space-y-8">
            <div><label className={`text-[10px] font-black opacity-50 uppercase tracking-widest mb-4 block ${currentTheme.textClass}`}>{t('visualStyle')}</label><div className={`flex flex-col gap-3 p-2 rounded-3xl ${currentTheme.pressed}`}>{Object.keys(THEME_MODES).map(k => (<button key={k} onClick={() => setTheme(k)} className={`w-full py-4 px-6 rounded-2xl flex items-center justify-between transition-all ${theme === k ? 'text-white shadow-lg scale-[1.02]' : 'font-bold opacity-60'} ${currentTheme.textClass}`} style={{ backgroundColor: theme === k ? sys.accent : 'transparent' }}><span className="text-sm uppercase tracking-wider">{THEME_MODES[k].name}</span>{theme === k && <Check size={18} />}</button>))}</div></div>
            <div><label className={`text-[10px] font-black opacity-50 uppercase tracking-widest mb-4 block ${currentTheme.textClass}`}>{t('colorTone')}</label><div className={`grid grid-cols-2 gap-3 p-2 rounded-3xl ${currentTheme.pressed}`}>{Object.keys(COLOR_SYSTEMS).map(k => (<button key={k} onClick={() => setColorSystem(k)} className={`py-3 px-4 rounded-xl flex flex-col items-center gap-2 transition-all ${colorSystem === k ? 'bg-white shadow-lg ring-2' : 'opacity-60'}`} style={{ outlineColor: sys.accent }}><div className="w-8 h-8 rounded-full border border-black/5 shadow-inner" style={{ backgroundColor: COLOR_SYSTEMS[k].base }} /><span className="text-[10px] font-black uppercase tracking-tighter text-slate-800">{COLOR_SYSTEMS[k].name}</span></button>))}</div></div>
            <div><label className={`text-[10px] font-black opacity-50 uppercase tracking-widest mb-4 block ${currentTheme.textClass}`}>{t('language')}</label><div className={`grid grid-cols-2 gap-3 p-2 rounded-3xl ${currentTheme.pressed}`}>{['ja', 'en'].map(k => (<button key={k} onClick={() => setLanguage(k)} className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${language === k ? 'bg-white shadow-lg ring-2' : 'opacity-60'}`} style={{ outlineColor: sys.accent }}><span className="text-xs font-black uppercase tracking-tighter text-slate-800">{k === 'ja' ? '日本語' : 'English'}</span></button>))}</div></div>
            <div className="pt-4 border-t border-black/5">
              <button onClick={handleDisconnect} className="w-full py-4 rounded-[1.5rem] bg-slate-200 text-slate-500 font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-500 transition-colors"><LogOut size={16} /> {t('disconnectBtn')}</button>
            </div>
          </div>
          <button onClick={() => setIsSettingsOpen(false)} className="w-full py-5 rounded-[1.5rem] text-white font-black uppercase text-xs shadow-xl" style={{ backgroundColor: sys.accent }}>{t('apply')}</button></div></div>
      )}

      {/* Document Modal */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"><div className={`${currentTheme.raised} w-full max-w-xl p-10 flex flex-col gap-8`} style={{ borderRadius: currentTheme.radius, backgroundColor: sys.base }}><div className="flex justify-between items-center"><h2 className={`text-2xl font-black uppercase flex items-center gap-3 ${currentTheme.textClass}`}><FileText style={{ color: sys.accent }} />{modalMode === 'add' ? t('setupDoc') : t('editDoc')}</h2><button onClick={() => setIsDocModalOpen(false)} className={`p-3 rounded-xl ${currentTheme.raisedSm} hover:text-red-500`} style={{ color: sys.accent }}><X size={20} /></button></div><div className="space-y-6"><div><label className={`text-[10px] font-black opacity-50 uppercase mb-3 block ${currentTheme.textClass}`}>1. {t('threadSubject')}</label><input value={modalData.threadName} onChange={e => setModalData(p => ({...p, threadName: e.target.value}))} className={`w-full p-5 rounded-2xl ${currentTheme.pressed} focus:outline-none text-sm font-bold bg-transparent ${currentTheme.textClass}`} placeholder={t('subjectPlaceholder')} /></div>{modalMode === 'add' && (<div><label className={`text-[10px] font-black opacity-50 uppercase mb-3 block ${currentTheme.textClass}`}>2. {t('initialMsg')}</label><textarea value={modalData.initialMsg} onChange={e => setModalData(p => ({...p, initialMsg: e.target.value}))} className={`w-full p-5 rounded-2xl ${currentTheme.pressed} focus:outline-none text-sm font-bold resize-none bg-transparent ${currentTheme.textClass}`} rows={3} placeholder={t('discussionStartPlaceholder')} /></div>)}<div className={`p-6 rounded-[2rem] border border-white/10 ${currentTheme.raisedSm}`}><div className={`mb-4 text-[10px] font-black opacity-50 uppercase tracking-widest ${currentTheme.textClass}`}>3. DRAWING SETTINGS</div><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-4"><button onClick={() => setModalData(p => ({ ...p, useImage: !p.useImage }))} className={`w-12 h-6 rounded-full transition-all relative ${modalData.useImage ? 'bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.4)]' : 'bg-slate-400 opacity-60'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${modalData.useImage ? 'left-7' : 'left-1'}`} /></button><span className={`text-[10px] font-black uppercase ${currentTheme.textClass}`}>{modalData.useImage ? t('useImageLabel') : t('noImageLabel')}</span></div><span className={`text-xs font-black truncate max-w-[150px] ${currentTheme.textClass}`}>{currentDeterminedDocNameLabel}</span></div>{modalMode === 'add' && modalData.useImage && (<div className="mt-6 pt-6 border-t border-white/10">{!modalData.url ? (<button onClick={() => fileInputRef.current?.click()} className={`w-full py-10 rounded-2xl border-2 border-dashed border-black/10 flex flex-col items-center gap-3 hover:bg-white/20 ${currentTheme.pressed}`}><Upload size={24} className="opacity-20" /><p className={`text-[10px] font-black opacity-40 uppercase ${currentTheme.textClass}`}>{t('selectFile')}</p></button>) : (<div className={`p-4 rounded-xl ${currentTheme.pressed} flex items-center justify-between animate-in zoom-in-95`}><div className="flex items-center gap-3"><img src={modalData.url} className="w-12 h-12 rounded-lg object-cover shadow-md" alt="prev" /><p className={`text-[10px] font-black truncate max-w-[200px] ${currentTheme.textClass}`}>{modalData.fileName}</p></div><button onClick={() => setModalData(p => ({...p, url: '', fileName: ''}))} className="font-black text-[10px] uppercase underline decoration-2" style={{ color: sys.accent }}>{t('changeFile')}</button></div>)}<input type="file" ref={fileInputRef} onChange={onFileChange} className="hidden" accept="image/*" /></div>)}</div></div><div className="flex gap-4 pt-4">{modalMode === 'edit' && modalData.id && (<button onClick={() => handleDeleteDoc(modalData.id!)} className="flex-1 py-5 rounded-[1.5rem] bg-red-50 text-red-600 font-black uppercase text-xs shadow-lg">{t('deleteDoc')}</button>)}<button onClick={handleModalSubmit} className="flex-[2] py-5 rounded-[1.5rem] text-white font-black uppercase text-xs shadow-xl active:scale-95 disabled:opacity-20" style={{ backgroundColor: sys.accent }} disabled={modalMode === 'add' && modalData.useImage && !modalData.url}>{modalMode === 'add' ? t('startProject') : t('updateInfo')}</button></div></div></div>
      )}
    </div>
  );
}
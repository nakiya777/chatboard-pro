import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Annotation, ColorSystem, DocData, Message } from '../types';
import { User } from 'firebase/auth';
import { Firestore, collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { processImageToWebP } from '../utils/imageUtils';
import { getResizeChange, Rect } from '../utils/geometry';

interface UseWhiteboardProps {
  user: User | null;
  db: Firestore;
  projectId: string;
  activeDocId: string | null;
  activeDocData: DocData | undefined;
  t: (key: string) => string;
}

export const useWhiteboard = ({ user, db, projectId, activeDocId, activeDocData, t }: UseWhiteboardProps) => {
  const [tool, setTool] = useState('select');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeAnnotationIds, setActiveAnnotationIds] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [drawingShape, setDrawingShape] = useState<Partial<Annotation> | null>(null);
  const [transforming, setTransforming] = useState<any>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [textStyle, setTextStyle] = useState({ bold: false, italic: false, fontSize: 18, color: '#ef4444' });
  const [defaults, setDefaults] = useState({ stroke: '#ef4444', strokeWidth: 3, strokeStyle: 'solid', status: 'open', fontSize: 18 });
  
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageSizeRef = useRef({ width: 0, height: 0 });

  // Helper
  const getSVGPoint = useCallback((e: React.MouseEvent | MouseEvent) => {
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
  }, [pan, zoom]);

  // Fit to Screen Logic
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

  useEffect(() => {
    if (!activeDocId) return;
    if (activeDocData?.url) {
      const img = new Image(); img.src = activeDocData.url;
      img.onload = () => { imageSizeRef.current = { width: img.naturalWidth, height: img.naturalHeight }; fitToScreen(); };
    } else {
      imageSizeRef.current = { width: 2000, height: 2000 }; fitToScreen();
    }
  }, [activeDocId, activeDocData?.url, fitToScreen]);

  // Image Upload Logic with WebP Optimization
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !db || !projectId || !activeDocId) return;

    try {
        const webpUrl = await processImageToWebP(file);
        
        // Firestore limit is 1MB (1,048,576 bytes). 
        // Base64 string length * 0.75 is approx byte size.
        // Safety margin: 900KB approx.
        if (webpUrl.length > 1300000) { 
             alert(t('Image too large (Max 1MB)')); 
             return;
        }

        // Initial display size (smaller logic for UI)
        // We'd ideally want exact dimensions, but processImageToWebP returns string.
        // We can load Image again or let processImageToWebP return dims.
        // For now, simpler optimization: Load image to get dims.
        const img = new Image();
        img.onload = async () => {
             const displayW = 300;
             const displayH = 300 * (img.naturalHeight / img.naturalWidth);
             const cx = pan.x ? -pan.x / zoom + 100 : 100;
             const cy = pan.y ? -pan.y / zoom + 100 : 100;

             const annRef = await addDoc(collection(db, 'projects', projectId, 'annotations'), {
                 type: 'image', x: cx, y: cy, width: displayW, height: displayH,
                 url: webpUrl,
                 stroke: 'none', strokeWidth: 0, strokeStyle: 'solid', fill: 'none',
                 docId: activeDocId, status: 'open',
                 author: user.uid, createdAt: serverTimestamp()
             });
                
             // Add message
             const dateStr = new Date().toLocaleDateString();
             await addDoc(collection(db, 'projects', projectId, 'messages'), { 
                 docId: activeDocId, annotationIds: [annRef.id], 
                 content: `[${dateStr}] ${t('toolImage')}${t('addedItem')}`, 
                 author: `User-${user.uid.slice(0, 4)}`, authorId: user.uid, createdAt: serverTimestamp(), depth: 0 
             });
             setTool('select');
        };
        img.src = webpUrl;
    } catch (error) {
        console.error("Image processing failed", error);
        alert('Failed to upload image: ' + error);
    }
    e.target.value = ''; // Reset input
  };

  const activeImageInputRef = useRef<HTMLInputElement>(null);
  const triggerImageUpload = () => activeImageInputRef.current?.click();

  // Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || tool === 'select') { 
        // Logic for ArrowPoint drag start?
        // If we are over an arrow point of a selected image...
        // This requires detection. For now, simple pan check.
        
        // Check for interactions with resize handles or ArrowPoint
        // ArrowPoint hitting needs custom logic since it's not a standard shape hit
        const pt = getSVGPoint(e);
        const hitImage = activeAnnotationIds.length === 1 ? activeDocData /* Not doc data, we need annotation data */ : null;
        // Actually we need the annotation object.
        // Let's assume passed in or found via selectedIds.
        // See handleMouseMove for logic reuse.
        
        setIsPanning(true); 
        return; 
    }
    if (!activeDocId) return;
    const pt = getSVGPoint(e);
    setDrawingShape({ type: tool as any, x: pt.x, y: pt.y, width: 0, height: 0, stroke: defaults.stroke, strokeWidth: defaults.strokeWidth, strokeStyle: defaults.strokeStyle, fill: 'none', docId: activeDocId, rotation: 0, ...defaults, points: tool === 'pencil' ? [{x: pt.x, y: pt.y}] : undefined });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) { setPan(p => ({ x: p.x + e.movementX, y: p.y + e.movementY })); return; }
    const pt = getSVGPoint(e);
    
    if (transforming) {
      // Transformation logic (Resize/Rotate/Move)
      // Note: This requires complex logic, simplified here or needs import from util
      // For now, let's keep it simple or copy logic if needed.
      // Copying logic from App.tsx...
      const { id, type, startPt, startShape, handle } = transforming;
      const dx = pt.x - startPt.x;
      const dy = pt.y - startPt.y;
      
      const newAnn = { ...startShape };
      
      if (type === 'move') {
          newAnn.x = startShape.x + dx;
          newAnn.y = startShape.y + dy;
          if (newAnn.type === 'pencil' && newAnn.points) {
               newAnn.points = startShape.points.map((p: any) => ({ x: p.x + dx, y: p.y + dy }));
          }
      } else if (type === 'resize') {
          // Robust resize using geometry utils
          // Convert shape to Rect interface expected by utils
          const currentRect = {
              x: startShape.x,
              y: startShape.y,
              width: startShape.width || 0,
              height: startShape.height || 0,
              rotation: startShape.rotation || 0
          };
          
          const newRect = getResizeChange(currentRect, handle, pt);
          
          newAnn.x = newRect.x;
          newAnn.y = newRect.y;
          newAnn.width = newRect.width;
          newAnn.height = newRect.height;
          // Rotation usually stays same during resize unless we implement rotation while resizing (uncommon)
          
      } else if (type === 'rotate') {
          const cx = startShape.x + (startShape.width || 0) / 2;
          const cy = startShape.y + (startShape.height || 0) / 2;
          // Calculate angle from center to mouse
          const angle = Math.atan2(pt.y - cy, pt.x - cx) * 180 / Math.PI + 90;
          newAnn.rotation = angle;
      } else if (type === 'arrowPoint') {
          // Moving arrow point (Image specific)
          newAnn.arrowPoint = { x: pt.x, y: pt.y };
      } else if (type === 'arrow-start') {
          // Moving arrow start point (x,y)
          // Maintain end point fixed.
          // End point global: ex = startShape.x + startShape.width
          //                   ey = startShape.y + startShape.height
          // New start point: pt.x, pt.y
          // New width = ex - pt.x
          // New height = ey - pt.y
          const ex = startShape.x + (startShape.width || 0);
          const ey = startShape.y + (startShape.height || 0);
          newAnn.x = pt.x;
          newAnn.y = pt.y;
          newAnn.width = ex - pt.x;
          newAnn.height = ey - pt.y;
      } else if (type === 'arrow-end') {
          // Moving arrow end point
          // Start point fixed: startShape.x, startShape.y
          // New width = pt.x - startShape.x
          // New height = pt.y - startShape.y
          newAnn.width = pt.x - startShape.x;
          newAnn.height = pt.y - startShape.y;
      }
      
      updateDoc(doc(db, 'projects', projectId, 'annotations', id), newAnn).catch(console.error);
      return;
    }

    if (drawingShape) {
       if (drawingShape.type === 'pencil') {
           setDrawingShape(prev => ({ ...prev, points: [...(prev?.points || []), { x: pt.x, y: pt.y }] }));
       } else {
           setDrawingShape(prev => ({ ...prev, width: pt.x - (prev?.x || 0), height: pt.y - (prev?.y || 0) }));
       }
    }
  };
  


  const handleMouseUp = async () => {
    const shape = drawingShape; setDrawingShape(null); setTransforming(null); setIsPanning(false);
    if (shape && user && activeDocId && db && projectId) {
      const isText = shape.type === 'text';
      const isPencil = shape.type === 'pencil';
      const isArrow = shape.type === 'arrow';
      const isLine = shape.type === 'line';
      let n = { ...shape } as any;
      if (!isPencil && !isArrow && !isLine) {
        n.x = (shape.width || 0) < 0 ? (shape.x || 0) + (shape.width || 0) : (shape.x || 0); 
        n.y = (shape.height || 0) < 0 ? (shape.y || 0) + (shape.height || 0) : (shape.y || 0);
        n.width = isText ? Math.max(Math.abs(shape.width || 0), 200) : Math.abs(shape.width || 0);
        n.height = isText ? Math.max(Math.abs(shape.height || 0), 100) : Math.abs(shape.height || 0);
      } else if (isPencil) { n.x = 0; n.y = 0; }
      // For arrow and line, we keep original x, y, width, height (can be negative) to preserve direction

      
      if (isText || isPencil || n.width > 2 || n.height > 2) {
        // Create Annotation
        try {
            // Remove undefined fields to prevent Firestore errors
            Object.keys(n).forEach(key => n[key] === undefined && delete n[key]);

            const annRef = await addDoc(collection(db, 'projects', projectId, 'annotations'), { ...n, author: user.uid, createdAt: serverTimestamp() });
            
            // Auto-create Message
            const dateStr = new Date().toLocaleDateString();
            const typeLabel = t('tool' + (shape.type?.charAt(0).toUpperCase() || '') + shape.type?.slice(1));
            await addDoc(collection(db, 'projects', projectId, 'messages'), { docId: activeDocId, annotationIds: [annRef.id], content: `[${dateStr}] ${typeLabel}${t('addedItem')}`, author: `User-${user.uid.slice(0, 4)}`, authorId: user.uid, createdAt: serverTimestamp(), depth: 0 });
            
            setTool('select'); setSelectedIds([annRef.id]); setActiveAnnotationIds([annRef.id]);
            if (isText) {
              setEditingTextId(annRef.id);
              setTextInput("");
              setTextStyle({ bold: false, italic: false, fontSize: defaults.fontSize, color: defaults.stroke });
            }
        } catch (e) { console.error(e); }
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      const delta = -e.deltaY;
      setZoom(z => Math.max(0.1, Math.min(5, z + delta * 0.001)));
    } else {
      setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  };

  const changeActiveColor = useCallback((color: string) => {
    if (!db || !projectId) return;
    if (selectedIds.length > 0) {
      selectedIds.forEach(id => updateDoc(doc(db, 'projects', projectId, 'annotations', id), { stroke: color }));
    } else {
      setDefaults(p => ({ ...p, stroke: color }));
    }
  }, [db, projectId, selectedIds]);

  const handleTextSave = useCallback(async () => {
    if (!editingTextId || !db || !projectId) return;
    await updateDoc(doc(db, 'projects', projectId, 'annotations', editingTextId), { 
      text: textInput,
      stroke: textStyle.color,
      fontSize: textStyle.fontSize,
      fontWeight: textStyle.bold ? 'bold' : 'normal',
      fontStyle: textStyle.italic ? 'italic' : 'normal'
    });
    if (textInput.trim() && user) {
      const dateStr = new Date().toLocaleDateString();
      await addDoc(collection(db, 'projects', projectId, 'messages'), {
        docId: activeDocId, annotationIds: [editingTextId], content: `[${dateStr}] ${t('updatedText')}: "${textInput}"`,
        author: `User-${user.uid.slice(0, 4)}`, authorId: user.uid, createdAt: serverTimestamp(), depth: 0
      });
    }
    setEditingTextId(null);
  }, [editingTextId, textInput, textStyle, activeDocId, user, t, projectId, db]);
  const handleTextCancel = useCallback(() => {
    setEditingTextId(null);
    setSelectedIds([]); // Clear selection to remove handles
    // Optionally delete if it was a new empty text (but hard to track 'new' here without extra state)
    // For now just clearing selection handles the visual issue.
  }, []);
  
  // Arrow Maker Helper
  const onToggleArrow = useCallback(async () => {
     if(selectedIds.length !== 1 || !db || !projectId) return;
     const targetId = selectedIds[0];
     // We need to fetch current state or assume activeAnnotationIds has fresh data?
     // Actually useWhiteboard doesn't own 'annotations' list. It's passed in App.tsx but not stored here.
     // We can't access 'annotations' here easily unless we add it to props or rely on transforming logic initiated from UI.
     // Better approach: This logic invoked from UI (Toolbar) where annotations are available.
  }, [selectedIds, db, projectId]);


  const handleDoubleClick = (id: string, currentText?: string, currentStyle?: any) => {
      setEditingTextId(id);
      setTextInput(currentText || "");
      if (currentStyle) {
          setTextStyle({
              bold: currentStyle.fontWeight === 'bold',
              italic: currentStyle.fontStyle === 'italic',
              fontSize: currentStyle.fontSize || defaults.fontSize,
              color: currentStyle.stroke || defaults.stroke
          });
      }
  };

  return {
    tool, setTool,
    selectedIds, setSelectedIds,
    activeAnnotationIds, setActiveAnnotationIds,
    zoom, setZoom,
    pan, setPan,
    isPanning,
    drawingShape, setDrawingShape,
    transforming, setTransforming,
    editingTextId, setEditingTextId,
    textInput, setTextInput,
    textStyle, setTextStyle,
    defaults, setDefaults,
    svgRef, containerRef,
    handleMouseDown, handleMouseMove, handleMouseUp, handleWheel,
    handleDoubleClick,
    fitToScreen, changeActiveColor, handleTextSave, handleTextCancel,
    handleImageUpload, triggerImageUpload, activeImageInputRef
  };
};

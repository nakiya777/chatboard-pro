import React from 'react';
import { ZoomIn, ZoomOut, MousePointer, Type, Square, Circle, Star, ArrowUpRight, Edit3, Loader2, Image as ImageIcon, Maximize2, Plus, MessageSquare, RotateCw, Minus } from 'lucide-react';
import { Annotation, ColorSystem, Presence, ThemeStyles } from '../../types';
import { RenderShape } from './RenderShape';
import { Handle } from './Handle';
import { ToolBtn } from './ToolBtn';


interface CanvasAreaProps {
  activeDocId: string | null;
  sys: ColorSystem;
  currentTheme: ThemeStyles;
  t: (key: string) => string;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  pan: { x: number; y: number };
  tool: string;
  setTool: (t: string) => void;
  annotations: Annotation[];
  drawingShape: Partial<Annotation> | null;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  activeAnnotationIds: string[];
  setActiveAnnotationIds: (ids: string[]) => void;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleWheel: (e: React.WheelEvent) => void;
  selectedShapes: Annotation[];
  transforming: any;
  setTransforming: (v: any) => void;
  changeActiveColor: (color: string) => void;
  presence: Presence[];
  currentDeterminedDocNameLabel: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  ANNOTATION_COLORS: string[];
  defaults: any;
  svgRef: React.RefObject<SVGSVGElement>;
  // New Props
  docUrl?: string; // URL of the background document image
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  triggerImageUpload: () => void;
  activeImageInputRef: React.RefObject<HTMLInputElement>;
  onOpenAddModal: () => void;
  onDoubleClick: (id: string, text?: string, style?: any) => void;
  linkModeMsgId?: string | null;
  onLinkAnnotation?: (id: string) => void;
  onToggleArrow?: (annotation: Annotation) => void;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  activeDocId, sys, currentTheme, t,
  zoom, setZoom, pan, tool, setTool,
  annotations, drawingShape, selectedIds, setSelectedIds, activeAnnotationIds, setActiveAnnotationIds,
  handleMouseDown, handleMouseMove, handleMouseUp, handleWheel,
  selectedShapes, transforming, setTransforming, changeActiveColor,
  presence, currentDeterminedDocNameLabel, ANNOTATION_COLORS, defaults,
  svgRef,
  onImageUpload, triggerImageUpload, activeImageInputRef, onOpenAddModal,
  onDoubleClick,
  docUrl,
  linkModeMsgId, onLinkAnnotation, onToggleArrow
}) => {
  const containerRef = React.useRef<HTMLElement>(null);
  const getSVGPoint = (e: React.MouseEvent | MouseEvent) => {
      // (same as before)
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


  if (!activeDocId) {
    // ... (same empty state)
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-300 select-none animate-in fade-in zoom-in-95 duration-700">
        <div className={`mb-6 opacity-10`} style={{ color: sys.accent }}>
          <MessageSquare size={80} />
        </div>
        
        <button
            onClick={onOpenAddModal}
            className={`px-6 py-3 rounded-xl ${currentTheme.raisedSm} !bg-indigo-600 !text-white font-bold flex items-center gap-2 shadow-lg hover:!bg-indigo-700 hover:scale-105 transition-all cursor-pointer pointer-events-auto`}
        >
            <Plus size={20} />
            チャットスレッドの新規作成
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 relative w-full h-full overflow-hidden transition-colors duration-500" 
         style={{ backgroundColor: sys.base }}
         onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onWheel={handleWheel}>
      
      {/* Background Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-10"
           style={{ 
             backgroundImage: `radial-gradient(circle, ${sys.highlight === '#ffffff' ? '#000' : '#fff'} 1px, transparent 1px)`, 
             backgroundSize: `${20*zoom}px ${20*zoom}px`, 
             backgroundPosition: `${pan.x}px ${pan.y}px` 
           }} />

      {/* Background Drawing Image */}
      {docUrl && (
        <div className="absolute top-0 left-0 pointer-events-none origin-top-left"
             style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
           <img src={docUrl} alt="Background Drawing" className="max-w-none block" />
        </div>
      )}

      {/* activeDoc Header (same) */}
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-2 pointer-events-none">
        <h2 className={`text-4xl font-black text-slate-800 tracking-tighter uppercase drop-shadow-sm ${currentTheme.textClass} animate-in slide-in-from-left-4`}>
          {currentDeterminedDocNameLabel}
        </h2>
        <div className="flex items-center gap-2 animate-in slide-in-from-left-6 delay-100">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600`}>Active</span>
          <span className={`text-[10px] font-bold text-slate-400 flex items-center gap-1`}>
            <Loader2 size={10} className="animate-spin" /> Syncing
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg 
        ref={svgRef}
        className="w-full h-full absolute top-0 left-0 touch-none"
      >
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill={sys?.accent || 'black'} />
          </marker>
        </defs>
        
        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
          {annotations.filter(a => a.docId === activeDocId && a.status !== 'deleted').map(ann => (
              <g key={ann.id} 
                 onMouseDown={(e) => {
                     if (linkModeMsgId) {
                         e.stopPropagation();
                         e.preventDefault();
                         return;
                     }
                     if (tool === 'select') {
                         e.stopPropagation();
                         if (e.shiftKey) {
                             const isSelected = selectedIds.includes(ann.id);
                             const newSelection = isSelected 
                                ? selectedIds.filter(id => id !== ann.id)
                                : [...selectedIds, ann.id];
                             setSelectedIds(newSelection);
                             setActiveAnnotationIds(newSelection);
                         } else {
                             setSelectedIds([ann.id]);
                             setActiveAnnotationIds([ann.id]);
                             setTransforming({ id: ann.id, type: 'move', startPt: getSVGPoint(e), startShape: ann });
                         }
                     }
                 }}
                 onClick={(e) => {
                    e.stopPropagation();
                    if (linkModeMsgId && onLinkAnnotation) {
                        onLinkAnnotation(ann.id);
                        setSelectedIds([]);
                        return;
                    }
                    if (ann.type === 'text') {
                       onDoubleClick(ann.id, ann.text, ann);
                    }
                 }}
                 onDoubleClick={(e) => {
                    e.stopPropagation();
                 }}
                 style={{ cursor: linkModeMsgId ? 'alias' : (tool === 'select' ? 'move' : 'default') }}
              >
                  <RenderShape 
                    shape={ann} 
                    zoom={zoom} 
                    isSelected={selectedIds.includes(ann.id)} 
                    isHighlighted={activeAnnotationIds.includes(ann.id)} 
                    sys={sys}
                    t={t}
                  />
              </g>
          ))}
          {drawingShape && <RenderShape shape={drawingShape as Annotation} isPreview zoom={zoom} sys={sys} t={t} />}
        </g>
      </svg>

      {/* Overlays (Handles) */}
      <div className="absolute inset-0 pointer-events-none">
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
          {selectedShapes.map(shape => {
            const visualX = (shape.width || 0) < 0 ? shape.x + (shape.width || 0) : shape.x;
            const visualY = (shape.height || 0) < 0 ? shape.y + (shape.height || 0) : shape.y;
            const absW = Math.abs(shape.width || 0);
            const absH = Math.abs(shape.height || 0);
            const w = shape.width || 0;
            const h = shape.height || 0;
            
            return (
            <div key={shape.id} className="absolute" style={{ left: visualX, top: visualY, width: absW, height: absH, transform: `rotate(${shape.rotation || 0}deg)` }}>
               {/* Arrow Handles */}
               {(shape.type === 'arrow' || shape.type === 'line') && (
                   <>
                       {/* Arrow Start Handle - relative to normalized box */}
                       {/* If w>0, h>0: Start at 0,0. If w<0, h>0: Start at absW, 0. etc */}
                       <Handle 
                            x={(w < 0 ? absW : 0)} 
                            y={(h < 0 ? absH : 0)} 
                            cursor="crosshair" zoom={zoom} sys={sys} 
                            onDown={(e) => { e.stopPropagation(); setTransforming({ id: shape.id, type: 'arrow-start', startPt: getSVGPoint(e), startShape: shape }); }} 
                       />
                       {/* Arrow End Handle */}
                       <Handle 
                            x={(w < 0 ? 0 : absW)} 
                            y={(h < 0 ? 0 : absH)} 
                            cursor="crosshair" zoom={zoom} sys={sys} 
                            onDown={(e) => { e.stopPropagation(); setTransforming({ id: shape.id, type: 'arrow-end', startPt: getSVGPoint(e), startShape: shape }); }} 
                       />
                   </>
               )}

               {/* Standard Resize Handles */}
              {shape.type !== 'pencil' && shape.type !== 'arrow' && shape.type !== 'line' && (
                <>
                  <Handle type="nw" cursor="nw-resize" x={0} y={0} zoom={zoom} sys={sys} onDown={(e) => { e.stopPropagation(); setTransforming({ id: shape.id, type: 'resize', handle: 'nw', startPt: getSVGPoint(e), startShape: shape }); }} />
                  <Handle type="ne" cursor="ne-resize" x={absW} y={0} zoom={zoom} sys={sys} onDown={(e) => { e.stopPropagation(); setTransforming({ id: shape.id, type: 'resize', handle: 'ne', startPt: getSVGPoint(e), startShape: shape }); }} />
                  <Handle type="sw" cursor="sw-resize" x={0} y={absH} zoom={zoom} sys={sys} onDown={(e) => { e.stopPropagation(); setTransforming({ id: shape.id, type: 'resize', handle: 'sw', startPt: getSVGPoint(e), startShape: shape }); }} />
                  <Handle type="se" cursor="se-resize" x={absW} y={absH} zoom={zoom} sys={sys} onDown={(e) => { e.stopPropagation(); setTransforming({ id: shape.id, type: 'resize', handle: 'se', startPt: getSVGPoint(e), startShape: shape }); }} />

                  {/* Mid Handles */}
                  <Handle type="n" cursor="n-resize" x={absW/2} y={0} zoom={zoom} sys={sys} onDown={(e) => { e.stopPropagation(); setTransforming({ id: shape.id, type: 'resize', handle: 'n', startPt: getSVGPoint(e), startShape: shape }); }} />
                  <Handle type="s" cursor="s-resize" x={absW/2} y={absH} zoom={zoom} sys={sys} onDown={(e) => { e.stopPropagation(); setTransforming({ id: shape.id, type: 'resize', handle: 's', startPt: getSVGPoint(e), startShape: shape }); }} />
                  <Handle type="w" cursor="w-resize" x={0} y={absH/2} zoom={zoom} sys={sys} onDown={(e) => { e.stopPropagation(); setTransforming({ id: shape.id, type: 'resize', handle: 'w', startPt: getSVGPoint(e), startShape: shape }); }} />
                  <Handle type="e" cursor="e-resize" x={absW} y={absH/2} zoom={zoom} sys={sys} onDown={(e) => { e.stopPropagation(); setTransforming({ id: shape.id, type: 'resize', handle: 'e', startPt: getSVGPoint(e), startShape: shape }); }} />
                </>
              )}
               
               {/* Rotate Handle (Common for all except pencil) */}
               {shape.type !== 'pencil' && (
                   <>
                       <div className="absolute bg-slate-400" style={{ left: absW/2, top: -25, width: 1, height: 25 }} />
                       <Handle x={absW/2} y={-25} cursor="grab" zoom={zoom} sys={sys} onDown={(e) => { e.stopPropagation(); setTransforming({ id: shape.id, type: 'rotate', startPt: getSVGPoint(e), startShape: shape }); }} />
                       <div className="absolute pointer-events-none text-slate-500" style={{ left: absW/2 + 10, top: -32 }}>
                          <RotateCw size={14} />
                       </div>
                   </>
               )}

               {/* Image Specific: Arrow Point Handle (same as before) */}
               {shape.type === 'image' && shape.arrowPoint && (
                 <div className="absolute pointer-events-auto w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-md cursor-crosshair hover:scale-125 transition-transform"
                      style={{ 
                          left: (shape.arrowPoint.x - visualX) - 8, 
                          top: (shape.arrowPoint.y - visualY) - 8 
                      }}
                      onMouseDown={(e) => { 
                          e.stopPropagation(); 
                          setTransforming({ id: shape.id, type: 'arrowPoint', startPt: getSVGPoint(e), startShape: shape }); 
                      }}
                 />
               )}
            </div>
            );
          })}
        </div>
      </div>

      {/* Main Toolbar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2 p-2 rounded-[2rem] shadow-2xl z-20 transition-all border border-white/20 animate-in slide-in-from-top-4" style={{ backgroundColor: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(20px)' }}>
        <ToolBtn active={tool === 'select'} onClick={() => setTool('select')} icon={<MousePointer size={20} />} tip="Selection (V)" theme={currentTheme} sys={sys} />
        <ToolBtn active={tool === 'text'} onClick={() => setTool('text')} icon={<Type size={20} />} tip="Text (T)" theme={currentTheme} sys={sys} />
        <ToolBtn active={tool === 'rect'} onClick={() => setTool('rect')} icon={<Square size={20} />} tip="Rectangle (R)" theme={currentTheme} sys={sys} />
        <ToolBtn active={tool === 'circle'} onClick={() => setTool('circle')} icon={<Circle size={20} />} tip="Circle (C)" theme={currentTheme} sys={sys} />
        <ToolBtn active={tool === 'star'} onClick={() => setTool('star')} icon={<Star size={20} />} tip="Star (S)" theme={currentTheme} sys={sys} />
        <ToolBtn active={tool === 'arrow'} onClick={() => setTool('arrow')} icon={<ArrowUpRight size={20} />} tip="Arrow (A)" theme={currentTheme} sys={sys} />
        <ToolBtn active={tool === 'line'} onClick={() => setTool('line')} icon={<Minus size={20} />} tip="Line (L)" theme={currentTheme} sys={sys} />
        <ToolBtn active={tool === 'pencil'} onClick={() => setTool('pencil')} icon={<Edit3 size={20} />} tip="Pencil (P)" theme={currentTheme} sys={sys} />
        
        {/* Image Tool */}
        <div className="relative group">
            <button 
                onClick={triggerImageUpload}
                className={`p-3 rounded-xl transition-all duration-200 relative group flex items-center justify-center ${tool === 'image' ? `bg-${sys.name}-100 text-${sys.name}-600 transform scale-105 shadow-md` : 'hover:bg-black/5 text-gray-500 hover:scale-110'}`}
            >
                <ImageIcon size={20} />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50">
                {t('toolImage')}
            </div>
        </div>
      
      </div>

      {/* Floating Action Menu for Selection / Active Tool */}
      {(selectedShapes.length > 0 || ['text', 'rect', 'circle', 'star', 'arrow', 'line', 'pencil'].includes(tool)) && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-[2rem] shadow-2xl p-2 animate-in slide-in-from-bottom-4 flex items-center gap-2 border border-white/20 z-40 transition-all" style={{ backgroundColor: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(20px)' }}>
           <div className="flex items-center justify-center gap-4 py-1 px-4"> 
            <div className="flex gap-2.5">
                {ANNOTATION_COLORS.map(c => (
                    <button key={c} onClick={() => changeActiveColor(c)} 
                        className={`w-7 h-7 rounded-full border-2 border-white transition-all ${(selectedShapes[0]?.stroke || defaults.stroke) === c ? 'scale-125 shadow-xl ring-2' : 'opacity-40 hover:opacity-100'}`} 
                        style={{ backgroundColor: c, outlineColor: sys.accent }} 
                    />
                ))}
            </div>
            {/* Image Arrow Toggle Button */}
            {selectedShapes.length === 1 && selectedShapes[0].type === 'image' && (
                <>
                    <div className="w-[1px] h-6 bg-slate-200" />
                    <button 
                        onClick={() => {
                            if (onToggleArrow && selectedShapes.length > 0) {
                                onToggleArrow(selectedShapes[0]);
                            }
                        }}
                        className={`p-2 rounded-xl transition-all duration-200 hover:bg-slate-100 text-slate-600 ${selectedShapes[0].arrowPoint ? 'bg-slate-100 text-blue-500' : ''}`}
                        title="Toggle Pointer Arrow"
                    >
                        <ArrowUpRight size={20} />
                    </button>
                </>
            )}
            
          </div>
        </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-20">
        <div className={`flex flex-col p-1.5 rounded-2xl shadow-xl transition-all ${currentTheme.raisedSm}`} style={{ backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)' }}>
          <button onClick={() => setZoom(z => Math.min(z + 0.1, 5))} className="p-3 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"><ZoomIn size={18} /></button>
          <div className="h-[1px] bg-slate-200 mx-2" />
          <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.1))} className="p-3 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"><ZoomOut size={18} /></button>
        </div>
        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black text-slate-500 text-center shadow-lg ${currentTheme.raisedSm}`} style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}>
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Hidden Inputs */}
      <input type="file" ref={activeImageInputRef} onChange={onImageUpload} className="hidden" accept="image/*" />
    </div>
  );
};

import React from 'react';
import { Annotation, ColorSystem } from '../../types';

interface RenderShapeProps {
  shape: Annotation;
  isPreview?: boolean;
  isHighlighted?: boolean;
  isSelected?: boolean;
  zoom: number;
  sys: ColorSystem;
  t: (key: string) => string;
}

export const RenderShape: React.FC<RenderShapeProps> = ({ shape, isPreview, isHighlighted, isSelected, zoom, sys, t }) => {
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
  const cx = x + (width || 0) / 2;
  const cy = y + (height || 0) / 2;
  const absW = Math.abs(width || 0);
  const absH = Math.abs(height || 0);
  const hitW = Math.max(absW, 40);
  const hitH = Math.max(absH, 40);

  return (
    <g transform={`rotate(${shape.rotation || 0}, ${cx}, ${cy})`} style={{ transition: 'transform 0.1s linear' }}>
      {/* Hit Target (Invisible, centered, min 40px) */}
      <rect x={cx - hitW/2} y={cy - hitH/2} width={hitW} height={hitH} fill="transparent" pointerEvents="all" />
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
          case 'line': {
            const ex = x + (width||0); const ey = y + (height||0);
            return (<g {...glow}><line x1={x} y1={y} x2={ex} y2={ey} {...common} /></g>);
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
          case 'image': {
            const arrowColor = sys?.accent || '#ef4444';
            return (
              <g>
                <image href={shape.url} x={x} y={y} width={width} height={height} preserveAspectRatio="none" style={{ pointerEvents: 'none', opacity: isPreview ? 0.7 : 1 }} />
                <rect x={x} y={y} width={width} height={height} fill="transparent" stroke={isSelected ? sys?.accent : 'none'} strokeWidth={2} />
                {shape.arrowPoint && (
                  <g>
                    <line x1={x + (width||0)/2} y1={y + (height||0)/2} x2={shape.arrowPoint.x} y2={shape.arrowPoint.y} stroke={arrowColor} strokeWidth={3} markerEnd="url(#arrowhead)" />
                    <circle cx={shape.arrowPoint.x} cy={shape.arrowPoint.y} r={5} fill={arrowColor} />
                  </g>
                )}
              </g>
            );
          }
          default: return null;
        }
      })()}
    </g>
  );
};

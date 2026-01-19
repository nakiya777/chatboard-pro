import React from 'react';
import { ColorSystem } from '../../types';

interface HandleProps {
  x: number;
  y: number;
  cursor: string;
  onDown: (e: React.MouseEvent) => void;
  zoom: number;
  sys: ColorSystem;
}

export const Handle: React.FC<HandleProps> = ({ x, y, cursor, onDown, zoom, sys }) => {
  return (
    <div 
      onMouseDown={onDown} 
      className="absolute flex items-center justify-center bg-transparent group"
      style={{ 
        left: x, 
        top: y, 
        width: 24/zoom, 
        height: 24/zoom, 
        transform: 'translate(-50%, -50%)',
        cursor,
        pointerEvents: 'auto'
      }}
    >
      {/* Visual Dot */}
      <div 
        className="rounded-full border-[3px] shadow-sm transition-transform group-hover:scale-125"
        style={{
             width: 12,
             height: 12,
             backgroundColor: 'white',
             borderColor: sys.accent,
             boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }} 
      />
    </div>
  );
};

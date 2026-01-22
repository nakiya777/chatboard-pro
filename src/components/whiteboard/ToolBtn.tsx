import React from 'react';
import { ThemeStyles, ColorSystem } from '../../types';

interface ToolBtnProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  tip: string;
  theme: ThemeStyles;
  sys: ColorSystem;
}

export const ToolBtn: React.FC<ToolBtnProps> = ({ active, onClick, icon, tip, theme, sys }) => {
  return (
    <button 
      onClick={onClick} 
      title={tip} 
      className={`p-5 rounded-[1.5rem] transition-all ${active ? theme.pressed : 'opacity-50 hover:opacity-100 hover:scale-110'}`} 
      style={{ color: active ? sys.accent : sys.text }}
    >
      {icon}
    </button>
  );
};

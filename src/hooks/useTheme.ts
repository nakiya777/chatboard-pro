import { useMemo, useCallback } from 'react';
import { ThemeStyles, ColorSystem } from '../types';
import { THEME_MODES, COLOR_SYSTEMS, TRANSLATIONS } from '../constants';

export interface UseThemeReturn {
  sys: ColorSystem;
  currentTheme: ThemeStyles;
  t: (key: string) => string;
}

export const useTheme = (
  theme: string = 'neumorphism',
  colorSystem: string = 'standard',
  language: string = 'ja'
): UseThemeReturn => {
  // カラーシステムの取得
  const sys = COLOR_SYSTEMS[colorSystem] || COLOR_SYSTEMS.standard;
  
  // 翻訳関数
  const t = useCallback(
    (key: string) => TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key, 
    [language]
  );

  // テーマスタイルの計算
  const currentTheme: ThemeStyles = useMemo(() => {
    const isDark = colorSystem === 'midnight';
    const br = theme === 'claymorphism' ? '2.5rem' : theme === 'glassmorphism' ? '1.2rem' : '2rem';
    
    const styles: ThemeStyles = { 
      radius: br, 
      accent: sys.accent, 
      textClass: sys.text, 
      baseColor: sys.base, 
      raised: '', 
      raisedSm: '', 
      pressed: '' 
    };
    
    if (theme === 'neumorphism') {
      styles.raised = `shadow-[8px_8px_16px_${sys.shadow},-8px_-8px_16px_${sys.highlight}]`;
      styles.raisedSm = `shadow-[4px_4px_8px_${sys.shadow},-4px_-4px_8px_${sys.highlight}]`;
      styles.pressed = `shadow-[inset_6px_6px_12px_${sys.shadow},inset_-6px_-6px_12px_${sys.highlight}]`;
    } else if (theme === 'claymorphism') {
      styles.raised = `shadow-[12px_12px_24px_${sys.shadow},-12px_-12px_24px_${sys.highlight},inset_8px_8px_16px_rgba(255,255,255,${isDark ? 0.1 : 0.5}),inset_-8px_-8px_16px_rgba(0,0,0,0.05)]`;
      styles.raisedSm = `shadow-[6px_6px_12px_${sys.shadow},-6px_-6px_12px_${sys.highlight},inset_4px_4px_8px_rgba(255,255,255,${isDark ? 0.1 : 0.5})]`;
      styles.pressed = `shadow-[inset_8px_8px_16px_${sys.shadow},inset_-8px_-8px_16px_${sys.highlight}]`;
    } else {
      // glassmorphism
      styles.raised = `${isDark ? 'bg-white/10' : 'bg-white/40'} backdrop-blur-xl border border-white/30 shadow-xl shadow-black/10`;
      styles.raisedSm = `${isDark ? 'bg-white/10' : 'bg-white/30'} backdrop-blur-md border border-white/30 shadow-lg`;
      styles.pressed = 'bg-black/10 backdrop-blur-sm border border-black/10 shadow-inner';
    }
    
    return styles;
  }, [theme, colorSystem, sys]);

  return {
    sys,
    currentTheme,
    t,
  };
};

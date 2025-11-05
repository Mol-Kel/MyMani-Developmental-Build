import { useEffect, useState } from 'react';
import { storage } from '@/lib/storage';

export interface ColorPreset {
  id: string;
  name: string;
  hsl: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { id: 'red', name: 'Red', hsl: '1 66% 52%' },
  { id: 'orange', name: 'Orange', hsl: '25 85% 55%' },
  { id: 'yellow', name: 'Yellow', hsl: '45 93% 58%' },
  { id: 'green', name: 'Green', hsl: '92 55% 39%' },
  { id: 'teal', name: 'Teal', hsl: '173 58% 39%' },
  { id: 'blue', name: 'Blue', hsl: '217 91% 60%' },
  { id: 'indigo', name: 'Indigo', hsl: '243 75% 59%' },
  { id: 'purple', name: 'Purple', hsl: '267 30% 44%' },
  { id: 'pink', name: 'Pink', hsl: '330 81% 60%' },
  { id: 'slate', name: 'Slate', hsl: '215 16% 47%' },
];

export interface ColorThemeSettings {
  primary: string;
  secondary: string;
  accent: string;
}

const STORAGE_KEY = 'mymani_color_theme';

const DEFAULT_THEME: ColorThemeSettings = {
  primary: '92 55% 39%',
  secondary: '111 16% 24%',
  accent: '1 66% 52%',
};

export const useColorTheme = () => {
  const [colorTheme, setColorTheme] = useState<ColorThemeSettings>(
    storage.get<ColorThemeSettings>(STORAGE_KEY) || DEFAULT_THEME
  );

  const applyColorTheme = (theme: ColorThemeSettings) => {
    const root = document.documentElement;
    
    // Apply primary color
    root.style.setProperty('--primary', theme.primary);
    const [h, s, l] = theme.primary.split(' ').map(v => parseFloat(v));
    root.style.setProperty('--primary-glow', `${h} ${s} ${Math.min(l + 10, 100)}%`);
    root.style.setProperty('--ring', theme.primary);
    root.style.setProperty('--success', theme.primary);
    root.style.setProperty('--success-foreground', '0 0% 100%');
    
    // Apply secondary color
    root.style.setProperty('--secondary', theme.secondary);
    root.style.setProperty('--secondary-foreground', '0 0% 96%');
    
    // Apply accent color
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--accent-foreground', '0 0% 100%');
    root.style.setProperty('--warning', theme.accent);
    root.style.setProperty('--warning-foreground', '0 0% 100%');
    
    // Update gradients
    const [ph, ps, pl] = theme.primary.split(' ').map(v => parseFloat(v));
    root.style.setProperty('--gradient-primary', `linear-gradient(135deg, hsl(${ph} ${ps} ${pl}%), hsl(${ph} ${ps} ${Math.min(pl + 10, 100)}%))`);
    root.style.setProperty('--gradient-success', `linear-gradient(135deg, hsl(${ph} ${ps} ${pl}%), hsl(${ph} ${ps} ${Math.min(pl + 10, 100)}%))`);
    
    const [ah, as, al] = theme.accent.split(' ').map(v => parseFloat(v));
    root.style.setProperty('--gradient-accent', `linear-gradient(135deg, hsl(${ah} ${as} ${al}%), hsl(${ah} ${as} ${Math.min(al + 10, 100)}%))`);
    
    // Update shadows
    root.style.setProperty('--shadow-glow', `0 0 20px hsl(${ph} ${ps} ${Math.min(pl + 10, 100)}% / 0.3)`);
    root.style.setProperty('--shadow-accent', `0 0 20px hsl(${ah} ${as} ${Math.min(al + 10, 100)}% / 0.3)`);
    
    storage.set(STORAGE_KEY, theme);
    setColorTheme(theme);
  };

  const resetToDefault = () => {
    applyColorTheme(DEFAULT_THEME);
  };

  useEffect(() => {
    applyColorTheme(colorTheme);
  }, []);

  return {
    colorTheme,
    applyColorTheme,
    resetToDefault,
  };
};

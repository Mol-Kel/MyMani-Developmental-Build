import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';

const STORAGE_KEY = 'mymani_color_theme';

export interface ColorPreset {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    name: 'Ocean Blue',
    primary: '210 80% 50%',
    secondary: '200 70% 45%',
    accent: '190 75% 40%',
  },
  {
    name: 'Forest Green',
    primary: '140 60% 45%',
    secondary: '130 55% 40%',
    accent: '120 65% 35%',
  },
  {
    name: 'Sunset Orange',
    primary: '25 95% 53%',
    secondary: '35 90% 50%',
    accent: '15 95% 55%',
  },
  {
    name: 'Royal Purple',
    primary: '270 60% 50%',
    secondary: '260 55% 45%',
    accent: '280 65% 55%',
  },
  {
    name: 'Ruby Red',
    primary: '0 70% 50%',
    secondary: '350 65% 45%',
    accent: '10 75% 55%',
  },
  {
    name: 'Golden Yellow',
    primary: '45 100% 51%',
    secondary: '50 95% 48%',
    accent: '40 100% 54%',
  },
  {
    name: 'Teal',
    primary: '180 60% 45%',
    secondary: '175 55% 40%',
    accent: '185 65% 50%',
  },
  {
    name: 'Pink',
    primary: '330 70% 55%',
    secondary: '340 65% 50%',
    accent: '320 75% 60%',
  },
  {
    name: 'Indigo',
    primary: '240 60% 50%',
    secondary: '235 55% 45%',
    accent: '245 65% 55%',
  },
  {
    name: 'Coral',
    primary: '15 80% 60%',
    secondary: '20 75% 55%',
    accent: '10 85% 65%',
  },
  {
    name: 'Mint',
    primary: '160 50% 50%',
    secondary: '155 45% 45%',
    accent: '165 55% 55%',
  },
  {
    name: 'Lavender',
    primary: '280 50% 60%',
    secondary: '275 45% 55%',
    accent: '285 55% 65%',
  },
];

export interface ColorThemeSettings {
  primary: string;
  secondary: string;
  accent: string;
}

export const useColorTheme = () => {
  const [colorTheme, setColorTheme] = useState<ColorThemeSettings>(() => {
    const saved = storage.get<ColorThemeSettings>(STORAGE_KEY);
    return saved || {
      primary: COLOR_PRESETS[0].primary,
      secondary: COLOR_PRESETS[0].secondary,
      accent: COLOR_PRESETS[0].accent,
    };
  });

  useEffect(() => {
    // Apply color theme to CSS variables
    const root = document.documentElement;
    root.style.setProperty('--primary', colorTheme.primary);
    root.style.setProperty('--primary-foreground', '0 0% 100%');
    root.style.setProperty('--primary-glow', colorTheme.primary.replace(/\d+%\)$/, (match) => {
      const num = parseInt(match);
      return `${num + 10}%)`;
    }));
    
    root.style.setProperty('--accent', colorTheme.accent);
    root.style.setProperty('--accent-foreground', '0 0% 100%');
    
    // Update gradients
    root.style.setProperty(
      '--gradient-primary',
      `linear-gradient(135deg, hsl(${colorTheme.primary}), hsl(${colorTheme.secondary}))`
    );
    root.style.setProperty(
      '--gradient-accent',
      `linear-gradient(135deg, hsl(${colorTheme.accent}), hsl(${colorTheme.secondary}))`
    );
  }, [colorTheme]);

  const saveColorTheme = (theme: ColorThemeSettings) => {
    setColorTheme(theme);
    storage.set(STORAGE_KEY, theme);
  };

  const applyPreset = (preset: ColorPreset) => {
    saveColorTheme({
      primary: preset.primary,
      secondary: preset.secondary,
      accent: preset.accent,
    });
  };

  const resetToDefault = () => {
    applyPreset(COLOR_PRESETS[0]);
  };

  return {
    colorTheme,
    saveColorTheme,
    applyPreset,
    resetToDefault,
  };
};

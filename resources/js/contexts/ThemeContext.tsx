import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { themes } from '@/config/themes';

interface ThemeConfig {
  mode: 'minimalist' | 'themed' | 'seasonal';
  primary_color: string;
  secondary_color: string;
  seasonal_theme: string;
  seasonal_enabled: boolean;
}

export function useTheme() {
  const page = usePage();
  const theme = (page.props.theme as ThemeConfig) || {
    mode: 'themed',
    primary_color: '#185FA5',
    secondary_color: '#1a7a4a',
    seasonal_theme: 'default',
    seasonal_enabled: false,
  };
  
  return { theme };
}

export function ThemeApplier() {
  const { theme } = useTheme();
  
  useEffect(() => {
    const getCurrentTheme = () => {
      if (theme.mode === 'minimalist') {
        return themes.minimalist;
      }
      
      if (theme.mode === 'seasonal' && theme.seasonal_enabled) {
        return themes.seasonal[theme.seasonal_theme as keyof typeof themes.seasonal] || themes.themed;
      }
      
      // Themed mode - use custom colors
      return {
        ...themes.themed,
        colors: {
          ...themes.themed.colors,
          primary: theme.primary_color,
          secondary: theme.secondary_color,
        },
      };
    };
    
    const currentTheme = getCurrentTheme();
    const root = document.documentElement;
    
    // Apply CSS variables
    if (currentTheme.colors) {
      Object.entries(currentTheme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value as string);
      });
    }
    
    // Apply fonts
    if (currentTheme.fonts) {
      if (currentTheme.fonts.heading) {
        root.style.setProperty('--font-heading', currentTheme.fonts.heading);
      }
      if (currentTheme.fonts.body) {
        root.style.setProperty('--font-body', currentTheme.fonts.body);
      }
    }
    
    // Add theme class to body
    document.body.className = document.body.className.replace(/theme-\w+/g, '').replace(/seasonal-\w+/g, '').trim();
    document.body.classList.add(`theme-${theme.mode}`);
    if (theme.mode === 'seasonal') {
      document.body.classList.add(`seasonal-${theme.seasonal_theme}`);
    }
  }, [theme]);
  
  return null;
}

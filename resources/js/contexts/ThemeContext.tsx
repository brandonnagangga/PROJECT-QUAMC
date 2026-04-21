import { useEffect, useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';
import type { PageProps } from '@/types/models.d';
import { themes } from '@/config/themes';

export interface ThemeConfig {
  mode: 'minimalist' | 'themed' | 'seasonal';
  primary_color: string;
  secondary_color: string;
  seasonal_theme: string;
  seasonal_enabled: boolean;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  theme: ThemeConfig;
  palette: Record<string, string>;
  preview: {
    base: string;
    panel: string;
    lines: string[];
  };
}

const STORAGE_KEY = 'quamc.theme.preset';
const CHANGE_EVENT = 'quamc:theme-preset-change';
const HISTORY_STORAGE_KEY = 'quamc.theme.preset.history';
const MAX_HISTORY_ITEMS = 6;

const defaultTheme: ThemeConfig = {
  mode: 'themed',
  primary_color: '#185FA5',
  secondary_color: '#1a7a4a',
  seasonal_theme: 'default',
  seasonal_enabled: false,
};

function readStoredPresetId() {
  if (typeof window === 'undefined') return 'default';
  return window.localStorage.getItem(STORAGE_KEY) || 'default';
}

function writeStoredPresetId(presetId: string) {
  if (typeof window === 'undefined') return;

  if (presetId === 'default') {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, presetId);
  }

  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: presetId }));
}

function readThemeHistory(): Array<{ presetId: string; usedAt: string }> {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (entry): entry is { presetId: string; usedAt: string } =>
        !!entry && typeof entry.presetId === 'string' && typeof entry.usedAt === 'string',
    );
  } catch {
    return [];
  }
}

function writeThemeHistory(presetId: string) {
  if (typeof window === 'undefined') return;

  const nextHistory = [
    { presetId, usedAt: new Date().toISOString() },
    ...readThemeHistory().filter((entry) => entry.presetId !== presetId),
  ].slice(0, MAX_HISTORY_ITEMS);

  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: presetId }));
}

function createPalette(options: {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  accent?: string;
  border?: string;
  hover?: string;
  muted?: string;
  shellBg?: string;
  panelBg?: string;
  panelBorder?: string;
  topbarBg?: string;
  topbarBorder?: string;
  sidebarBg?: string;
  sidebarBorder?: string;
  sidebarText?: string;
  sidebarMuted?: string;
  sidebarHoverBg?: string;
  sidebarActiveBg?: string;
  sidebarActiveText?: string;
  sidebarIconActiveBg?: string;
  buttonPrimaryBg?: string;
  buttonPrimaryText?: string;
  buttonSecondaryBg?: string;
  buttonSecondaryText?: string;
}) {
  return {
    primary: options.primary,
    secondary: options.secondary,
    background: options.background,
    surface: options.surface,
    text: options.text,
    textSecondary: options.textSecondary,
    accent: options.accent || options.primary,
    border: options.border || '#dde1ed',
    hover: options.hover || '#f3f4f6',
    muted: options.muted || '#9ca3af',
    'shell-bg': options.shellBg || options.background,
    'panel-bg': options.panelBg || options.surface,
    'panel-border': options.panelBorder || options.border || '#dde1ed',
    'topbar-bg': options.topbarBg || options.surface,
    'topbar-border': options.topbarBorder || options.border || '#dde1ed',
    'sidebar-bg': options.sidebarBg || options.surface,
    'sidebar-border': options.sidebarBorder || options.border || '#dde1ed',
    'sidebar-text': options.sidebarText || options.text,
    'sidebar-muted': options.sidebarMuted || options.textSecondary,
    'sidebar-hover-bg': options.sidebarHoverBg || options.hover || '#f3f4f6',
    'sidebar-active-bg': options.sidebarActiveBg || options.hover || '#f3f4f6',
    'sidebar-active-text': options.sidebarActiveText || options.text,
    'sidebar-icon-active-bg': options.sidebarIconActiveBg || options.hover || '#f3f4f6',
    'button-primary-bg': options.buttonPrimaryBg || options.primary,
    'button-primary-text': options.buttonPrimaryText || '#ffffff',
    'button-secondary-bg': options.buttonSecondaryBg || options.surface,
    'button-secondary-text': options.buttonSecondaryText || options.text,
  };
}

function buildThemePresets(serverTheme: ThemeConfig): ThemePreset[] {
  return [
    {
      id: 'default',
      name: 'Default',
      description: 'Current workspace theme',
      theme: serverTheme,
      palette: createPalette({
        primary: serverTheme.primary_color,
        secondary: serverTheme.secondary_color,
        background: '#f7f7f4',
        surface: '#ffffff',
        text: '#1f2937',
        textSecondary: '#6b7280',
        accent: serverTheme.primary_color,
        border: '#e5e7eb',
        hover: '#f3f4f6',
        muted: '#9ca3af',
        shellBg: '#f5f6f8',
        panelBg: '#ffffff',
        panelBorder: '#e5e7eb',
        topbarBg: '#ffffff',
        topbarBorder: '#e5e7eb',
        sidebarBg: '#ffffff',
        sidebarBorder: '#e5e7eb',
        sidebarText: '#1f2937',
        sidebarMuted: '#6b7280',
        sidebarHoverBg: '#f7f7f8',
        sidebarActiveBg: '#f3f4f6',
        sidebarActiveText: '#111827',
        sidebarIconActiveBg: '#eef2f7',
        buttonPrimaryBg: serverTheme.primary_color,
        buttonPrimaryText: '#ffffff',
      }),
      preview: {
        base: '#f6f7fb',
        panel: '#ffffff',
        lines: [serverTheme.primary_color, '#8f99ac', '#d5dae5', serverTheme.secondary_color],
      },
    },
    {
      id: 'claude',
      name: 'Claude',
      description: 'Warm amber tones',
      theme: {
        mode: 'themed',
        primary_color: '#C97B36',
        secondary_color: '#E0A45E',
        seasonal_theme: 'default',
        seasonal_enabled: false,
      },
      palette: createPalette({
        primary: '#CE6F45',
        secondary: '#BD8A54',
        background: '#f4efe6',
        surface: '#fffaf2',
        text: '#3d3428',
        textSecondary: '#7a6d5d',
        accent: '#CE6F45',
        border: '#e5d7c6',
        hover: '#efe5d8',
        muted: '#b8ab9d',
        shellBg: '#efe7da',
        panelBg: '#fffaf2',
        panelBorder: '#e2d6c4',
        topbarBg: '#fffaf2',
        topbarBorder: '#e2d6c4',
        sidebarBg: '#f8f1e5',
        sidebarBorder: '#eadcc9',
        sidebarText: '#41372b',
        sidebarMuted: '#837666',
        sidebarHoverBg: '#f1e6d9',
        sidebarActiveBg: '#ede2d3',
        sidebarActiveText: '#2f271e',
        sidebarIconActiveBg: '#f1e4d4',
        buttonPrimaryBg: '#CE6F45',
        buttonPrimaryText: '#fff7f0',
      }),
      preview: {
        base: '#fbf6ee',
        panel: '#fffaf3',
        lines: ['#C97B36', '#D8A66A', '#E5BC89', '#9D6E4B'],
      },
    },
    {
      id: 'quamc',
      name: 'QUAMC',
      description: 'Brand navy with gold accent',
      theme: {
        mode: 'themed',
        primary_color: '#0F1F3D',
        secondary_color: '#1A3260',
        seasonal_theme: 'default',
        seasonal_enabled: false,
      },
      palette: createPalette({
        primary: '#0F1F3D',
        secondary: '#1A3260',
        background: '#f6f8fb',
        surface: '#ffffff',
        text: '#1e293b',
        textSecondary: '#64748b',
        accent: '#C9A84C',
        border: '#dde4ee',
        hover: '#eef3f8',
        muted: '#94a3b8',
        shellBg: '#f3f6fa',
        panelBg: '#ffffff',
        panelBorder: '#dde4ee',
        topbarBg: '#ffffff',
        topbarBorder: '#dde4ee',
        sidebarBg: '#0F1F3D',
        sidebarBorder: '#223559',
        sidebarText: '#C9A84C',
        sidebarMuted: 'rgba(255,255,255,0.68)',
        sidebarHoverBg: '#162847',
        sidebarActiveBg: '#1A2D52',
        sidebarActiveText: '#E8C96D',
        sidebarIconActiveBg: '#33456a',
        buttonPrimaryBg: '#0F1F3D',
        buttonPrimaryText: '#C9A84C',
        buttonSecondaryBg: '#ffffff',
        buttonSecondaryText: '#334155',
      }),
      preview: {
        base: '#f3f6fa',
        panel: '#0F1F3D',
        lines: ['#C9A84C', '#E8C96D', '#5C739B', '#FFFFFF'],
      },
    },
    {
      id: 'twitter',
      name: 'Twitter',
      description: 'Clean sky blue',
      theme: {
        mode: 'themed',
        primary_color: '#1D9BF0',
        secondary_color: '#58C7B7',
        seasonal_theme: 'default',
        seasonal_enabled: false,
      },
      palette: createPalette({
        primary: '#1D9BF0',
        secondary: '#58C7B7',
        background: '#f2f8fc',
        surface: '#ffffff',
        text: '#112033',
        textSecondary: '#617387',
        accent: '#1D9BF0',
        border: '#dce8f1',
        hover: '#eef6fb',
        muted: '#90a4b7',
        shellBg: '#edf5fa',
        panelBg: '#ffffff',
        panelBorder: '#dce8f1',
        topbarBg: '#ffffff',
        topbarBorder: '#dce8f1',
        sidebarBg: '#ffffff',
        sidebarBorder: '#dce8f1',
        sidebarText: '#112033',
        sidebarMuted: '#617387',
        sidebarHoverBg: '#edf6fd',
        sidebarActiveBg: '#e8f3fb',
        sidebarActiveText: '#0f172a',
        sidebarIconActiveBg: '#dceefe',
        buttonPrimaryBg: '#1D9BF0',
        buttonPrimaryText: '#ffffff',
      }),
      preview: {
        base: '#f3f9ff',
        panel: '#ffffff',
        lines: ['#1D9BF0', '#74C0F7', '#5AA9E6', '#58C7B7'],
      },
    },
    {
      id: 'violet-bloom',
      name: 'Violet Bloom',
      description: 'Deep purple gradient',
      theme: {
        mode: 'themed',
        primary_color: '#7C4DFF',
        secondary_color: '#72D2A4',
        seasonal_theme: 'default',
        seasonal_enabled: false,
      },
      palette: createPalette({
        primary: '#7C4DFF',
        secondary: '#72D2A4',
        background: '#f6f2ff',
        surface: '#ffffff',
        text: '#211b39',
        textSecondary: '#6f6890',
        accent: '#7C4DFF',
        border: '#e4def9',
        hover: '#ede7ff',
        muted: '#aca4c6',
        shellBg: '#f1ecfb',
        panelBg: '#ffffff',
        panelBorder: '#e4def9',
        topbarBg: '#ffffff',
        topbarBorder: '#e4def9',
        sidebarBg: '#fcfbff',
        sidebarBorder: '#e7e2fb',
        sidebarText: '#241d3d',
        sidebarMuted: '#756d94',
        sidebarHoverBg: '#f2ecff',
        sidebarActiveBg: '#efe9ff',
        sidebarActiveText: '#241d3d',
        sidebarIconActiveBg: '#e8deff',
        buttonPrimaryBg: '#7C4DFF',
        buttonPrimaryText: '#ffffff',
      }),
      preview: {
        base: '#f7f3ff',
        panel: '#fcfbff',
        lines: ['#7C4DFF', '#A78BFA', '#72D2A4', '#9B6FEA'],
      },
    },
    {
      id: 'supabase',
      name: 'Supabase',
      description: 'Emerald green calm',
      theme: {
        mode: 'themed',
        primary_color: '#3ECF8E',
        secondary_color: '#7A5BC1',
        seasonal_theme: 'default',
        seasonal_enabled: false,
      },
      palette: createPalette({
        primary: '#3ECF8E',
        secondary: '#7A5BC1',
        background: '#eefaf4',
        surface: '#ffffff',
        text: '#173328',
        textSecondary: '#587165',
        accent: '#3ECF8E',
        border: '#d7eee2',
        hover: '#e6f6ee',
        muted: '#93ac9f',
        shellBg: '#eaf7f0',
        panelBg: '#ffffff',
        panelBorder: '#d7eee2',
        topbarBg: '#ffffff',
        topbarBorder: '#d7eee2',
        sidebarBg: '#ffffff',
        sidebarBorder: '#d7eee2',
        sidebarText: '#173328',
        sidebarMuted: '#587165',
        sidebarHoverBg: '#ecfaf2',
        sidebarActiveBg: '#e7f8ef',
        sidebarActiveText: '#173328',
        sidebarIconActiveBg: '#d3f4e4',
        buttonPrimaryBg: '#3ECF8E',
        buttonPrimaryText: '#08311f',
      }),
      preview: {
        base: '#f2fbf7',
        panel: '#ffffff',
        lines: ['#3ECF8E', '#74DFAF', '#69CC9A', '#7A5BC1'],
      },
    },
    {
      id: 'tangerine',
      name: 'Tangerine',
      description: 'Orange on cool blue',
      theme: {
        mode: 'themed',
        primary_color: '#F28C45',
        secondary_color: '#7F9BC9',
        seasonal_theme: 'default',
        seasonal_enabled: false,
      },
      palette: createPalette({
        primary: '#F28C45',
        secondary: '#7F9BC9',
        background: '#f7f4ef',
        surface: '#ffffff',
        text: '#2f2b28',
        textSecondary: '#6d6962',
        accent: '#F28C45',
        border: '#e6dfd5',
        hover: '#f3ece3',
        muted: '#aba39a',
        shellBg: '#f2ece4',
        panelBg: '#ffffff',
        panelBorder: '#e6dfd5',
        topbarBg: '#ffffff',
        topbarBorder: '#e6dfd5',
        sidebarBg: '#fcfbf8',
        sidebarBorder: '#e6dfd5',
        sidebarText: '#2f2b28',
        sidebarMuted: '#6d6962',
        sidebarHoverBg: '#f5eee6',
        sidebarActiveBg: '#f3ece3',
        sidebarActiveText: '#2b2621',
        sidebarIconActiveBg: '#f8dcc6',
        buttonPrimaryBg: '#F28C45',
        buttonPrimaryText: '#ffffff',
      }),
      preview: {
        base: '#f7f9fd',
        panel: '#ffffff',
        lines: ['#F28C45', '#9AB0D6', '#7F9BC9', '#E8A16A'],
      },
    },
    {
      id: 'darkmatter',
      name: 'Darkmatter',
      description: 'Amber and teal on charcoal',
      theme: {
        mode: 'themed',
        primary_color: '#D19949',
        secondary_color: '#6DB9C7',
        seasonal_theme: 'default',
        seasonal_enabled: false,
      },
      palette: createPalette({
        primary: '#D19949',
        secondary: '#6DB9C7',
        background: '#181c21',
        surface: '#242933',
        text: '#eef2f7',
        textSecondary: '#a4aebe',
        accent: '#D19949',
        border: '#313846',
        hover: '#2b3140',
        muted: '#7e8796',
        shellBg: '#11161c',
        panelBg: '#1c212a',
        panelBorder: '#313846',
        topbarBg: '#1c212a',
        topbarBorder: '#313846',
        sidebarBg: '#161b22',
        sidebarBorder: '#313846',
        sidebarText: '#eef2f7',
        sidebarMuted: '#a4aebe',
        sidebarHoverBg: '#202632',
        sidebarActiveBg: '#252c37',
        sidebarActiveText: '#ffffff',
        sidebarIconActiveBg: '#2e3642',
        buttonPrimaryBg: '#ffffff',
        buttonPrimaryText: '#171c25',
      }),
      preview: {
        base: '#1c1f25',
        panel: '#242933',
        lines: ['#D19949', '#6DB9C7', '#9E7AE6', '#D8A15B'],
      },
    },
    {
      id: 'doom-64',
      name: 'Doom 64',
      description: 'Retro shooter contrast',
      theme: {
        mode: 'themed',
        primary_color: '#A34C3D',
        secondary_color: '#5B8C4D',
        seasonal_theme: 'default',
        seasonal_enabled: false,
      },
      palette: createPalette({
        primary: '#A34C3D',
        secondary: '#5B8C4D',
        background: '#b8b7b5',
        surface: '#d1cfcc',
        text: '#272624',
        textSecondary: '#5f5d59',
        accent: '#A34C3D',
        border: '#9d9b97',
        hover: '#c9c6c3',
        muted: '#7e7a75',
        shellBg: '#aeadab',
        panelBg: '#cfcfcd',
        panelBorder: '#9d9b97',
        topbarBg: '#d6d4d2',
        topbarBorder: '#9d9b97',
        sidebarBg: '#c7c5c2',
        sidebarBorder: '#9d9b97',
        sidebarText: '#272624',
        sidebarMuted: '#5f5d59',
        sidebarHoverBg: '#d3d0cb',
        sidebarActiveBg: '#d5d2ce',
        sidebarActiveText: '#1f1e1c',
        sidebarIconActiveBg: '#dfdbd7',
        buttonPrimaryBg: '#A34C3D',
        buttonPrimaryText: '#fdf7f3',
      }),
      preview: {
        base: '#d0d0d0',
        panel: '#b9b9b9',
        lines: ['#A34C3D', '#6E7F9E', '#5B8C4D', '#7D5F58'],
      },
    },
    {
      id: 'minimalist',
      name: 'Minimalist',
      description: 'Quiet grayscale',
      theme: {
        mode: 'minimalist',
        primary_color: '#18181B',
        secondary_color: '#4B5563',
        seasonal_theme: 'default',
        seasonal_enabled: false,
      },
      palette: createPalette({
        primary: '#18181B',
        secondary: '#4B5563',
        background: '#fafafa',
        surface: '#ffffff',
        text: '#111827',
        textSecondary: '#6B7280',
        accent: '#18181B',
        border: '#E5E7EB',
        hover: '#F4F4F5',
        muted: '#D1D5DB',
        shellBg: '#f7f7f7',
        panelBg: '#ffffff',
        panelBorder: '#E5E7EB',
        topbarBg: '#ffffff',
        topbarBorder: '#E5E7EB',
        sidebarBg: '#ffffff',
        sidebarBorder: '#E5E7EB',
        sidebarText: '#111827',
        sidebarMuted: '#6B7280',
        sidebarActiveBg: '#F4F4F5',
        sidebarActiveText: '#111827',
        sidebarIconActiveBg: '#EFEFF1',
        buttonPrimaryBg: '#18181B',
        buttonPrimaryText: '#ffffff',
      }),
      preview: {
        base: '#f8f8f8',
        panel: '#ffffff',
        lines: ['#111827', '#6B7280', '#D1D5DB', '#9CA3AF'],
      },
    },
  ];
}

function resolveTheme(serverTheme: ThemeConfig, presetId: string) {
  const presets = buildThemePresets(serverTheme);
  const selectedPreset = presets.find((preset) => preset.id === presetId) || presets[0];

  return {
    theme: selectedPreset.theme,
    selectedPreset,
    presets,
  };
}

function getComputedTheme(theme: ThemeConfig, preset: ThemePreset) {
  if (theme.mode === 'minimalist') {
    return {
      ...themes.minimalist,
      colors: {
        ...themes.minimalist.colors,
        ...preset.palette,
      },
    };
  }

  if (theme.mode === 'seasonal' && theme.seasonal_enabled) {
    const seasonalTheme = themes.seasonal[theme.seasonal_theme as keyof typeof themes.seasonal] || themes.themed;

    return {
      ...seasonalTheme,
      colors: {
        ...seasonalTheme.colors,
        ...preset.palette,
      },
    };
  }

  return {
    ...themes.themed,
    colors: {
      ...preset.palette,
    },
  };
}

export function useTheme() {
  const page = usePage<PageProps>();
  const serverTheme = (page.props.theme as ThemeConfig) || defaultTheme;
  const [selectedPresetId, setSelectedPresetId] = useState(readStoredPresetId);
  const [themeHistory, setThemeHistory] = useState(readThemeHistory);

  useEffect(() => {
    const syncPreset = (event?: Event) => {
      if (event instanceof StorageEvent && event.key && event.key !== STORAGE_KEY) return;
      setSelectedPresetId(readStoredPresetId());
      setThemeHistory(readThemeHistory());
    };

    window.addEventListener('storage', syncPreset);
    window.addEventListener(CHANGE_EVENT, syncPreset);

    return () => {
      window.removeEventListener('storage', syncPreset);
      window.removeEventListener(CHANGE_EVENT, syncPreset);
    };
  }, []);

  const resolved = useMemo(
    () => resolveTheme(serverTheme, selectedPresetId),
    [serverTheme, selectedPresetId],
  );

  const sortedPresets = useMemo(() => {
    const recentIds = themeHistory.map((entry) => entry.presetId);
    const defaultPreset = resolved.presets.find((preset) => preset.id === 'default');
    const recentPresets = recentIds
      .filter((presetId) => presetId !== 'default')
      .map((presetId) => resolved.presets.find((preset) => preset.id === presetId))
      .filter((preset): preset is ThemePreset => !!preset);
    const recentIdSet = new Set(recentPresets.map((preset) => preset.id));
    const remainingPresets = resolved.presets.filter(
      (preset) => preset.id !== 'default' && !recentIdSet.has(preset.id),
    );

    return [
      ...(defaultPreset ? [defaultPreset] : []),
      ...recentPresets,
      ...remainingPresets,
    ];
  }, [resolved.presets, themeHistory]);

  const recentThemeUsage = useMemo(
    () =>
      themeHistory
        .map((entry) => {
          const preset = resolved.presets.find((item) => item.id === entry.presetId);

          if (!preset) return null;

          return {
            presetId: entry.presetId,
            name: preset.name,
            description: preset.description,
            usedAt: entry.usedAt,
          };
        })
        .filter((entry): entry is { presetId: string; name: string; description: string; usedAt: string } => !!entry),
    [resolved.presets, themeHistory],
  );

  return {
    theme: resolved.theme,
    serverTheme,
    themePresets: sortedPresets,
    selectedThemePresetId: resolved.selectedPreset.id,
    setThemePreset: (presetId: string) => {
      writeThemeHistory(presetId);
      writeStoredPresetId(presetId);
    },
    resetThemePreset: () => writeStoredPresetId('default'),
    isUsingThemeOverride: resolved.selectedPreset.id !== 'default',
    recentThemeUsage,
  };
}

export function ThemeApplier() {
  const { theme, selectedThemePresetId, themePresets } = useTheme();

  useEffect(() => {
    const selectedPreset = themePresets.find((preset) => preset.id === selectedThemePresetId) || themePresets[0];
    const currentTheme = getComputedTheme(theme, selectedPreset);
    const root = document.documentElement;

    if (currentTheme.colors) {
      Object.entries(currentTheme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value as string);
      });
    }

    if (currentTheme.fonts) {
      if (currentTheme.fonts.heading) {
        root.style.setProperty('--font-heading', currentTheme.fonts.heading);
      }
      if (currentTheme.fonts.body) {
        root.style.setProperty('--font-body', currentTheme.fonts.body);
      }
    }

    document.body.className = document.body.className.replace(/theme-\w+/g, '').replace(/seasonal-\w+/g, '').trim();
    document.body.classList.add(`theme-${theme.mode}`);
    if (theme.mode === 'seasonal') {
      document.body.classList.add(`seasonal-${theme.seasonal_theme}`);
    }
  }, [theme]);

  return null;
}

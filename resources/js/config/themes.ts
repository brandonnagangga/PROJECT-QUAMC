export const themes = {
  minimalist: {
    name: 'Minimalist',
    description: 'Clean white design with simple typography',
    colors: {
      primary: '#18181B',      // Darkest gray for primary elements
      secondary: '#4B5563',    // Medium gray for secondary elements
      background: '#FAFAFA',   // Off-white background
      surface: '#FFFFFF',      // Pure white for cards/surfaces
      text: '#111827',         // Near-black for primary text
      textSecondary: '#6B7280', // Gray for secondary text
      accent: 'transparent',   // No accent color in minimalist
      border: '#E5E7EB',       // Light gray for borders
      hover: '#F4F4F5',        // Very light gray for hover states
      muted: '#D1D5DB',        // Muted gray for disabled/inactive
    },
    fonts: {
      heading: 'system-ui, -apple-system, sans-serif',
      body: 'system-ui, -apple-system, sans-serif',
    },
  },
  themed: {
    name: 'Themed',
    description: 'Customizable colored design',
    colors: {
      primary: '#185FA5',
      secondary: '#1a7a4a',
      background: '#F9FAFB',
      surface: '#FFFFFF',
      text: '#111827',
      textSecondary: '#6B7280',
      accent: '#c9a84c', // Gold accent for themed mode
    },
    fonts: {
      heading: 'inherit',
      body: 'DM Sans, sans-serif',
    },
  },
  seasonal: {
    default: {
      name: 'Default',
      colors: {
        primary: '#185FA5',
        secondary: '#1a7a4a',
        accent: 'transparent', // No accent in seasonal mode
        background: '#F9FAFB',
        surface: '#FFFFFF',
        text: '#111827',
      },
      fonts: {
        heading: 'inherit',
        body: 'DM Sans, sans-serif',
      },
      decorations: {},
    },
    christmas: {
      name: 'Christmas',
      colors: {
        primary: '#C41E3A',
        secondary: '#165B33',
        accent: 'transparent', // No accent in seasonal mode
        background: '#FFF5F5',
        surface: '#FFFFFF',
        text: '#1A1A1A',
      },
      fonts: {
        heading: 'inherit',
        body: 'DM Sans, sans-serif',
      },
      decorations: {
        snowflakes: true,
        lights: true,
      },
    },
    newyear: {
      name: 'New Year',
      colors: {
        primary: '#FFD700',
        secondary: '#C0C0C0',
        accent: 'transparent', // No accent in seasonal mode
        background: '#F8F9FA',
        surface: '#FFFFFF',
        text: '#1A1A1A',
      },
      fonts: {
        heading: 'inherit',
        body: 'DM Sans, sans-serif',
      },
      decorations: {
        confetti: true,
        fireworks: false,
      },
    },
    valentine: {
      name: 'Valentine',
      colors: {
        primary: '#FF1493',
        secondary: '#FF69B4',
        accent: 'transparent', // No accent in seasonal mode
        background: '#FFF0F5',
        surface: '#FFFFFF',
        text: '#1A1A1A',
      },
      fonts: {
        heading: 'inherit',
        body: 'DM Sans, sans-serif',
      },
      decorations: {
        hearts: true,
      },
    },
    halloween: {
      name: 'Halloween',
      colors: {
        primary: '#FF6600',
        secondary: '#000000',
        accent: 'transparent', // No accent in seasonal mode
        background: '#1A1A1A',
        surface: '#2D2D2D',
        text: '#FFFFFF',
      },
      fonts: {
        heading: 'inherit',
        body: 'DM Sans, sans-serif',
      },
      decorations: {
        pumpkins: true,
        bats: true,
      },
    },
  },
};

export type ThemeMode = 'minimalist' | 'themed' | 'seasonal';
export type SeasonalTheme = 'default' | 'christmas' | 'newyear' | 'valentine' | 'halloween';

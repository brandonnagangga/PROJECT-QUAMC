import { useEffect, useMemo, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function ThemeSidebar({ open, onClose }: ThemeSidebarProps) {
  const { themePresets, selectedThemePresetId, setThemePreset } = useTheme();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  const filteredPresets = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) return themePresets;

    return themePresets.filter((preset) =>
      `${preset.name} ${preset.description}`.toLowerCase().includes(term),
    );
  }, [query, themePresets]);

  return (
    <>
      <button
        type="button"
        className={`theme-sidebar-overlay ${open ? 'open' : ''}`}
        aria-label="Close theme sidebar"
        onClick={onClose}
      />

      <aside
        className={`theme-sidebar ${open ? 'open' : ''}`}
        aria-hidden={!open}
        aria-label="Theme picker"
      >
        <div className="theme-sidebar-header">
          <div>
            <h2 className="theme-sidebar-title">Appearance</h2>
            <p className="theme-sidebar-subtitle">Choose a color theme for the interface</p>
          </div>
          <button type="button" className="theme-sidebar-close" onClick={onClose} aria-label="Close theme picker">
            <X size={18} />
          </button>
        </div>

        <label className="theme-sidebar-search" aria-label="Search themes">
          <Search size={16} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search themes..."
          />
        </label>

        <div className="theme-sidebar-grid">
          {filteredPresets.map((preset) => {
            const active = preset.id === selectedThemePresetId;

            return (
              <button
                key={preset.id}
                type="button"
                className={`theme-preset-card ${active ? 'active' : ''}`}
                onClick={() => setThemePreset(preset.id)}
              >
                <div
                  className="theme-preset-preview"
                  style={{
                    background: preset.preview.base,
                    borderColor: active ? 'var(--color-text)' : 'var(--color-border)',
                  }}
                >
                  <div
                    className="theme-preset-preview-panel"
                    style={{ background: preset.preview.panel }}
                  >
                    <div className="theme-preset-preview-orb" />
                    <div className="theme-preset-preview-lines">
                      {preset.preview.lines.map((line, index) => (
                        <span
                          key={`${preset.id}-${index}`}
                          style={{ background: line, width: `${index === 0 ? 44 : 28}px` }}
                        />
                      ))}
                    </div>
                  </div>
                  {active && (
                    <span className="theme-preset-check">
                      <Check size={12} />
                    </span>
                  )}
                </div>

                <div className="theme-preset-meta">
                  <span className="theme-preset-name">{preset.name}</span>
                  <span className="theme-preset-description">{preset.description}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="theme-sidebar-footer">
          <strong>Theme picker</strong>
          <span>Theme preference is saved locally in your browser.</span>
        </div>
      </aside>
    </>
  );
}

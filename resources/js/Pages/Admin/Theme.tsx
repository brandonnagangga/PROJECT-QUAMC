import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { CurrentThemeBanner } from './Theme/CurrentThemeBanner';
import { ThemeModeSection } from './Theme/ThemeModeSection';
import { BrandColorsSection } from './Theme/BrandColorsSection';
import { SeasonalThemeSection } from './Theme/SeasonalThemeSection';

interface ThemeConfig {
    mode: string;
    primary_color: string;
    secondary_color: string;
    seasonal_theme: string;
    seasonal_enabled: boolean;
}

interface Props {
    themeConfig: ThemeConfig;
    seasonalThemes: { [key: string]: string };
}

export default function Theme({ themeConfig, seasonalThemes }: Props) {
    const { data, setData, post, processing } = useForm({
        theme_mode: themeConfig.mode,
        theme_primary_color: themeConfig.primary_color,
        theme_secondary_color: themeConfig.secondary_color,
        seasonal_theme: themeConfig.seasonal_theme,
        seasonal_theme_enabled: themeConfig.seasonal_enabled,
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post('/admin/theme');
    };

    return (
        <AppLayout title="Theme Settings" breadcrumb="Administration / Theme">
            <Head title="Theme Settings" />

            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
                        Theme Customization
                    </h1>
                    <p style={{ fontSize: '1rem', color: '#6B7280' }}>
                        Configure the visual style used across the application.
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Current Theme Banner */}
                    <CurrentThemeBanner
                        mode={themeConfig.mode}
                        primaryColor={themeConfig.primary_color}
                        secondaryColor={themeConfig.secondary_color}
                    />

                    {/* Theme Mode Selection */}
                    <ThemeModeSection
                        currentMode={data.theme_mode}
                        onModeChange={(mode) => setData('theme_mode', mode)}
                        primaryColor={data.theme_primary_color}
                        secondaryColor={data.theme_secondary_color}
                    />

                    {/* Brand Colors (only for themed mode) */}
                    {data.theme_mode === 'themed' && (
                        <BrandColorsSection
                            primaryColor={data.theme_primary_color}
                            secondaryColor={data.theme_secondary_color}
                            onPrimaryChange={(color) => setData('theme_primary_color', color)}
                            onSecondaryChange={(color) => setData('theme_secondary_color', color)}
                        />
                    )}

                    {/* Seasonal Theme (only for seasonal mode) */}
                    {data.theme_mode === 'seasonal' && (
                        <SeasonalThemeSection
                            selectedTheme={data.seasonal_theme}
                            enabled={data.seasonal_theme_enabled}
                            seasonalThemes={seasonalThemes}
                            onThemeChange={(theme) => setData('seasonal_theme', theme)}
                            onEnabledChange={(enabled) => setData('seasonal_theme_enabled', enabled)}
                        />
                    )}

                    {/* Action Buttons */}
                    <div style={{ 
                        display: 'flex', 
                        gap: '1rem', 
                        justifyContent: 'flex-end', 
                        paddingTop: '1.5rem', 
                        borderTop: '1px solid #E5E7EB',
                        marginTop: '1rem'
                    }}>
                        <button
                            type="button"
                            onClick={() => router.reload()}
                            style={{
                                padding: '0.75rem 1.5rem',
                                border: '2px solid #D1D5DB',
                                borderRadius: '0.5rem',
                                backgroundColor: '#fff',
                                color: '#374151',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Reset Changes
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            style={{
                                padding: '0.75rem 2rem',
                                borderRadius: '0.5rem',
                                backgroundColor: '#2563EB',
                                color: '#fff',
                                fontWeight: '600',
                                cursor: processing ? 'not-allowed' : 'pointer',
                                opacity: processing ? 0.5 : 1,
                                border: 'none',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                transition: 'all 0.2s'
                            }}
                        >
                            {processing ? (
                                <span className="flex items-center gap-2">
                                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            fill="none"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Saving...
                                </span>
                            ) : (
                                'Save Theme Settings'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

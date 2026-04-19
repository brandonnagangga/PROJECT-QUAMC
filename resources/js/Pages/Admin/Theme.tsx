import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';

interface ThemeConfig {
  mode: string;
  primary_color: string;
  secondary_color: string;
  seasonal_theme: string;
  seasonal_enabled: boolean;
}

interface SeasonalThemes {
  [key: string]: string;
}

interface Props {
  themeConfig: ThemeConfig;
  seasonalThemes: SeasonalThemes;
}

export default function Theme({ themeConfig, seasonalThemes }: Props) {
  const { data, setData, post, processing } = useForm({
    theme_mode: themeConfig.mode,
    theme_primary_color: themeConfig.primary_color,
    theme_secondary_color: themeConfig.secondary_color,
    seasonal_theme: themeConfig.seasonal_theme,
    seasonal_theme_enabled: themeConfig.seasonal_enabled,
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/admin/theme');
  };

  const modeCardBase =
    'group relative cursor-pointer rounded-xl border p-5 transition-all duration-200';
  const modeCardActive = 'border-blue-500 bg-blue-50 shadow-sm';
  const modeCardIdle = 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm';

  const seasonalPreviews: Record<
    string,
    { sidebar: string; content: string; emoji?: string; description: string }
  > = {
    default: {
      sidebar: 'bg-blue-600',
      content: 'bg-gray-50',
      description: 'Standard theme',
    },
    christmas: {
      sidebar: 'bg-gradient-to-b from-red-600 to-green-700',
      content: 'bg-red-50',
      emoji: '❄️',
      description: 'Festive red and green',
    },
    newyear: {
      sidebar: 'bg-gradient-to-b from-yellow-400 to-amber-500',
      content: 'bg-gray-50',
      emoji: '✨',
      description: 'Golden celebration',
    },
    valentine: {
      sidebar: 'bg-gradient-to-b from-pink-500 to-rose-600',
      content: 'bg-pink-50',
      emoji: '💕',
      description: 'Romantic pink',
    },
    halloween: {
      sidebar: 'bg-gradient-to-b from-orange-600 to-gray-900',
      content: 'bg-gray-800',
      emoji: '🎃',
      description: 'Spooky orange and black',
    },
  };

  const seasonalKeys = Object.keys(seasonalThemes);

  return (
    <AppLayout title="Theme Settings" breadcrumb="Administration / Theme">
      <Head title="Theme Settings" />

      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Theme Customization</h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure the visual style used across the application.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Currently Active Theme</p>
                  <p className="text-sm text-gray-600">This style is currently applied system-wide.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:justify-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Mode</p>
                  <p className="text-base font-bold capitalize text-gray-900">{themeConfig.mode}</p>
                </div>
                {themeConfig.mode === 'themed' && (
                  <div className="flex gap-2">
                    <div
                      className="h-7 w-7 rounded-md border border-white shadow-sm"
                      style={{ backgroundColor: themeConfig.primary_color }}
                      title={`Primary: ${themeConfig.primary_color}`}
                    />
                    <div
                      className="h-7 w-7 rounded-md border border-white shadow-sm"
                      style={{ backgroundColor: themeConfig.secondary_color }}
                      title={`Secondary: ${themeConfig.secondary_color}`}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Theme Mode</h2>
              <p className="mt-1 text-sm text-gray-600">Select your base visual style.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-3">
              <label
                className={`${modeCardBase} ${
                  data.theme_mode === 'minimalist' ? modeCardActive : modeCardIdle
                }`}
              >
                <input
                  type="radio"
                  name="theme_mode"
                  value="minimalist"
                  checked={data.theme_mode === 'minimalist'}
                  onChange={(e) => setData('theme_mode', e.target.value)}
                  className="sr-only"
                />
                {data.theme_mode === 'minimalist' && (
                  <div className="absolute right-3 top-3 rounded-full bg-blue-600 p-1 text-white">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}

                <div className="mb-4 flex justify-center">
                  <div className="flex h-24 w-40 overflow-hidden rounded-lg border-2 border-gray-300 shadow-sm">
                    <div className="flex w-12 flex-col gap-1.5 border-r border-gray-300 bg-white p-1.5">
                      <div className="h-2 rounded bg-gray-800"></div>
                      <div className="h-1.5 rounded bg-gray-400"></div>
                      <div className="h-1.5 rounded bg-gray-400"></div>
                      <div className="h-1.5 rounded bg-gray-400"></div>
                      <div className="flex-1"></div>
                      <div className="h-1.5 rounded bg-gray-300"></div>
                    </div>
                    <div className="flex-1 bg-gray-50 p-1.5">
                      <div className="mb-1.5 h-1.5 rounded bg-gray-300"></div>
                      <div className="mb-2 h-1.5 w-3/4 rounded bg-gray-300"></div>
                      <div className="h-8 rounded border border-gray-200 bg-white"></div>
                    </div>
                  </div>
                </div>
                <h3 className="text-center text-lg font-bold text-gray-900">Minimalist</h3>
                <p className="mt-1 text-center text-sm text-gray-600">Clean interface with neutral styling.</p>
              </label>

              <label
                className={`${modeCardBase} ${data.theme_mode === 'themed' ? modeCardActive : modeCardIdle}`}
              >
                <input
                  type="radio"
                  name="theme_mode"
                  value="themed"
                  checked={data.theme_mode === 'themed'}
                  onChange={(e) => setData('theme_mode', e.target.value)}
                  className="sr-only"
                />
                {data.theme_mode === 'themed' && (
                  <div className="absolute right-3 top-3 rounded-full bg-blue-600 p-1 text-white">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}

                <div className="mb-4 flex justify-center">
                  <div className="flex h-24 w-40 overflow-hidden rounded-lg border-2 border-gray-300 shadow-sm">
                    <div
                      className="relative flex w-12 flex-col gap-1.5 p-1.5 transition-colors"
                      style={{
                        background: `linear-gradient(to bottom, ${data.theme_primary_color}, ${data.theme_primary_color}dd)`,
                      }}
                    >
                      <div className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-yellow-400 opacity-40"></div>
                      <div className="h-2 rounded bg-white/90"></div>
                      <div className="h-1.5 rounded bg-white/70"></div>
                      <div className="h-1.5 rounded bg-white/70"></div>
                      <div className="h-1.5 rounded bg-white/70"></div>
                      <div className="flex-1"></div>
                      <div className="h-1.5 rounded bg-white/50"></div>
                    </div>
                    <div className="flex-1 bg-gray-50 p-1.5">
                      <div
                        className="mb-1.5 h-1.5 rounded transition-colors"
                        style={{ backgroundColor: `${data.theme_primary_color}33` }}
                      />
                      <div
                        className="mb-2 h-1.5 w-3/4 rounded transition-colors"
                        style={{ backgroundColor: `${data.theme_primary_color}33` }}
                      />
                      <div
                        className="h-8 rounded border transition-colors"
                        style={{
                          backgroundColor: `${data.theme_primary_color}11`,
                          borderColor: `${data.theme_primary_color}44`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <h3 className="text-center text-lg font-bold text-gray-900">Themed</h3>
                <p className="mt-1 text-center text-sm text-gray-600">Use custom brand colors across UI.</p>
              </label>

              <label
                className={`${modeCardBase} ${
                  data.theme_mode === 'seasonal' ? modeCardActive : modeCardIdle
                }`}
              >
                  <input
                    type="radio"
                    name="theme_mode"
                    value="seasonal"
                    checked={data.theme_mode === 'seasonal'}
                    onChange={(e) => setData('theme_mode', e.target.value)}
                    className="sr-only"
                  />
                  {data.theme_mode === 'seasonal' && (
                    <div className="absolute right-3 top-3 rounded-full bg-blue-600 p-1 text-white">
                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}

                <div className="mb-4 flex justify-center">
                  <div className="relative flex h-24 w-40 overflow-hidden rounded-lg border-2 border-gray-300 shadow-sm">
                    <div className="flex w-12 flex-col gap-1.5 bg-gradient-to-b from-red-600 to-green-700 p-1.5">
                      <div className="h-2 rounded bg-white/90"></div>
                      <div className="h-1.5 rounded bg-white/70"></div>
                      <div className="h-1.5 rounded bg-white/70"></div>
                      <div className="h-1.5 rounded bg-white/70"></div>
                      <div className="flex-1"></div>
                      <div className="h-1.5 rounded bg-white/50"></div>
                    </div>
                    <div className="relative flex-1 bg-red-50 p-1.5">
                      <div className="absolute right-1 top-1 text-xs">❄️</div>
                      <div className="mb-1.5 h-1.5 rounded bg-red-200"></div>
                      <div className="mb-2 h-1.5 w-3/4 rounded bg-red-200"></div>
                      <div className="h-8 rounded border border-red-200 bg-white"></div>
                    </div>
                  </div>
                </div>
                <h3 className="text-center text-lg font-bold text-gray-900">Seasonal</h3>
                <p className="mt-1 text-center text-sm text-gray-600">
                  Apply special event styles with optional decorations.
                </p>
              </label>
            </div>
          </section>

          {data.theme_mode === 'themed' && (
            <section className="rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50 px-5 py-4">
                <h2 className="text-lg font-semibold text-gray-900">Brand Colors</h2>
                <p className="mt-1 text-sm text-gray-600">Set primary and secondary colors for themed mode.</p>
              </div>

              <div className="space-y-6 p-5">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-900">
                      Primary Color
                      <span className="ml-2 text-xs font-normal text-gray-500">(Sidebar, buttons, links)</span>
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <input
                        type="color"
                        value={data.theme_primary_color}
                        onChange={(e) => setData('theme_primary_color', e.target.value)}
                        className="h-14 w-24 cursor-pointer rounded-lg border border-gray-300 shadow-sm"
                      />
                      <div className="w-full">
                        <input
                          type="text"
                          value={data.theme_primary_color}
                          onChange={(e) => setData('theme_primary_color', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          placeholder="#185FA5"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['#185FA5', '#1E40AF', '#0F766E', '#DC2626', '#0891B2', '#D97706'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setData('theme_primary_color', color)}
                          className="h-8 w-8 rounded-md border border-gray-300 transition-transform hover:scale-105"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-900">
                      Secondary Color
                      <span className="ml-2 text-xs font-normal text-gray-500">(Accents and highlights)</span>
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <input
                        type="color"
                        value={data.theme_secondary_color}
                        onChange={(e) => setData('theme_secondary_color', e.target.value)}
                        className="h-14 w-24 cursor-pointer rounded-lg border border-gray-300 shadow-sm"
                      />
                      <div className="w-full">
                        <input
                          type="text"
                          value={data.theme_secondary_color}
                          onChange={(e) => setData('theme_secondary_color', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          placeholder="#1A7A4A"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['#1A7A4A', '#047857', '#0EA5E9', '#7C3AED', '#DB2777', '#EA580C'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setData('theme_secondary_color', color)}
                          className="h-8 w-8 rounded-md border border-gray-300 transition-transform hover:scale-105"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5">
                  <p className="mb-3 text-sm font-semibold text-gray-700">Live Preview</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
                      style={{ backgroundColor: data.theme_primary_color }}
                    >
                      Primary Button
                    </button>
                    <button
                      type="button"
                      className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
                      style={{ backgroundColor: data.theme_secondary_color }}
                    >
                      Secondary Button
                    </button>
                    <span
                      className="rounded-lg border px-3 py-2 text-xs font-semibold"
                      style={{
                        borderColor: `${data.theme_primary_color}40`,
                        backgroundColor: `${data.theme_primary_color}15`,
                        color: data.theme_primary_color,
                      }}
                    >
                      Badge
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {data.theme_mode === 'seasonal' && (
            <section className="rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-emerald-50 px-5 py-4">
                <h2 className="text-lg font-semibold text-gray-900">Seasonal Theme</h2>
                <p className="mt-1 text-sm text-gray-600">Select an event style and choose whether to enable it.</p>
              </div>

              <div className="space-y-6 p-5">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                  {seasonalKeys.map((key) => {
                    const preview = seasonalPreviews[key] ?? seasonalPreviews.default;
                    const active = data.seasonal_theme === key;

                    return (
                      <label
                        key={key}
                        className={`cursor-pointer rounded-xl border p-3 transition-all ${
                          active
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                        }`}
                      >
                        <input
                          type="radio"
                          name="seasonal_theme"
                          value={key}
                          checked={active}
                          onChange={(e) => setData('seasonal_theme', e.target.value)}
                          className="sr-only"
                        />
                        <div className="mb-2 flex justify-center">
                          <div className="relative flex h-12 w-20 overflow-hidden rounded-md border border-gray-300 shadow-sm">
                            <div className={`w-6 ${preview.sidebar}`}></div>
                            <div className={`relative flex-1 ${preview.content}`}>
                              {preview.emoji && <div className="absolute right-0 top-0 text-[10px]">{preview.emoji}</div>}
                            </div>
                          </div>
                        </div>
                        <p className="text-center text-sm font-semibold text-gray-900">
                          {seasonalThemes[key]}
                        </p>
                        <p className="mt-1 text-center text-[11px] text-gray-500">{preview.description}</p>
                      </label>
                    );
                  })}
                </div>

                <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-emerald-50 p-5">
                  <label className="flex cursor-pointer items-start gap-3">
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        checked={data.seasonal_theme_enabled}
                        onChange={(e) => setData('seasonal_theme_enabled', e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="h-7 w-12 rounded-full bg-gray-300 transition-colors peer-checked:bg-blue-600"></div>
                      <div className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"></div>
                    </div>
                    <div>
                      <span className="block text-sm font-semibold text-gray-900">Enable Seasonal Theme</span>
                      <p className="mt-1 text-sm text-gray-600">
                        When enabled, the selected seasonal style is applied globally with decorations.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </section>
          )}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Reset Changes
            </button>
            <button
              type="submit"
              disabled={processing}
              className="rounded-lg bg-blue-600 px-8 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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

import React from 'react';
import { Head, useForm, router } from '@inertiajs/react';
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
  
  return (
    <AppLayout title="Theme Settings" breadcrumb="Administration / Theme">
      <Head title="Theme Settings" />
      
      <div className="w-full h-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Theme Customization</h1>
          <p className="text-sm text-gray-600 mt-1">Personalize the look and feel of your application</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Active Theme Banner */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-l-4 border-blue-500 rounded-lg p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Currently Active</h2>
                  <p className="text-sm text-gray-600">This theme is applied across the entire system</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-500 uppercase">Theme Mode</div>
                  <div className="text-lg font-bold text-gray-900 capitalize">{themeConfig.mode}</div>
                </div>
                {themeConfig.mode === 'themed' && (
                  <div className="flex gap-2">
                    <div 
                      className="w-8 h-8 rounded-lg border-2 border-white shadow-md" 
                      style={{ backgroundColor: themeConfig.primary_color }}
                      title={`Primary: ${themeConfig.primary_color}`}
                    />
                    <div 
                      className="w-8 h-8 rounded-lg border-2 border-white shadow-md" 
                      style={{ backgroundColor: themeConfig.secondary_color }}
                      title={`Secondary: ${themeConfig.secondary_color}`}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Theme Mode Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Choose Your Theme Mode</h2>
              <p className="text-sm text-gray-600 mt-1">Select the visual style that best fits your needs</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Minimalist */}
                <label className={`group relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${
                  data.theme_mode === 'minimalist' 
                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-105' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}>
                  <input
                    type="radio"
                    name="theme_mode"
                    value="minimalist"
                    checked={data.theme_mode === 'minimalist'}
                    onChange={(e) => setData('theme_mode', e.target.value)}
                    className="sr-only"
                  />
                  {data.theme_mode === 'minimalist' && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  
                  <div className="text-center">
                    {/* Minimalist Preview */}
                    <div className="mb-4 flex justify-center">
                      <div className="w-40 h-24 border-2 border-gray-300 rounded-lg overflow-hidden flex shadow-sm">
                        <div className="w-12 bg-white border-r border-gray-300 flex flex-col gap-1.5 p-1.5">
                          <div className="h-2 bg-gray-800 rounded"></div>
                          <div className="h-1.5 bg-gray-400 rounded"></div>
                          <div className="h-1.5 bg-gray-400 rounded"></div>
                          <div className="h-1.5 bg-gray-400 rounded"></div>
                          <div className="flex-1"></div>
                          <div className="h-1.5 bg-gray-300 rounded"></div>
                        </div>
                        <div className="flex-1 bg-gray-50 p-1.5">
                          <div className="h-1.5 bg-gray-300 rounded mb-1.5"></div>
                          <div className="h-1.5 bg-gray-300 rounded w-3/4 mb-2"></div>
                          <div className="h-8 bg-white border border-gray-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Minimalist</h3>
                    <p className="text-sm text-gray-600 mb-3">Clean, simple, and distraction-free</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">Neutral Colors</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">System Fonts</span>
                    </div>
                  </div>
                </label>
                
                {/* Themed */}
                <label className={`group relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${
                  data.theme_mode === 'themed' 
                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-105' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}>
                  <input
                    type="radio"
                    name="theme_mode"
                    value="themed"
                    checked={data.theme_mode === 'themed'}
                    onChange={(e) => setData('theme_mode', e.target.value)}
                    className="sr-only"
                  />
                  {data.theme_mode === 'themed' && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  
                  <div className="text-center">
                    {/* Themed Preview - Dynamic Color */}
                    <div className="mb-4 flex justify-center">
                      <div className="w-40 h-24 border-2 border-gray-300 rounded-lg overflow-hidden flex shadow-sm">
                        <div 
                          className="w-12 flex flex-col gap-1.5 p-1.5 relative transition-colors duration-300"
                          style={{
                            background: `linear-gradient(to bottom, ${data.theme_primary_color}, ${data.theme_primary_color}dd)`
                          }}
                        >
                          <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-yellow-400 rounded-full opacity-40"></div>
                          <div className="h-2 bg-white/90 rounded"></div>
                          <div className="h-1.5 bg-white/70 rounded"></div>
                          <div className="h-1.5 bg-white/70 rounded"></div>
                          <div className="h-1.5 bg-white/70 rounded"></div>
                          <div className="flex-1"></div>
                          <div className="h-1.5 bg-white/50 rounded"></div>
                        </div>
                        <div className="flex-1 bg-gray-50 p-1.5">
                          <div 
                            className="h-1.5 rounded mb-1.5 transition-colors duration-300" 
                            style={{ backgroundColor: `${data.theme_primary_color}33` }}
                          ></div>
                          <div 
                            className="h-1.5 rounded w-3/4 mb-2 transition-colors duration-300" 
                            style={{ backgroundColor: `${data.theme_primary_color}33` }}
                          ></div>
                          <div 
                            className="h-8 rounded transition-colors duration-300" 
                            style={{ backgroundColor: `${data.theme_primary_color}11`, borderColor: `${data.theme_primary_color}44`, borderWidth: '1px' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Themed</h3>
                    <p className="text-sm text-gray-600 mb-3">Fully customizable brand colors</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Custom Colors</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Brand Identity</span>
                    </div>
                  </div>
                </label>
                
                {/* Seasonal */}
                <label className={`group relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${
                  data.theme_mode === 'seasonal' 
                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-105' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}>
                  <input
                    type="radio"
                    name="theme_mode"
                    value="seasonal"
                    checked={data.theme_mode === 'seasonal'}
                    onChange={(e) => setData('theme_mode', e.target.value)}
                    className="sr-only"
                  />
                  {data.theme_mode === 'seasonal' && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  
                  <div className="text-center">
                    {/* Seasonal Preview */}
                    <div className="mb-4 flex justify-center">
                      <div className="w-40 h-24 border-2 border-gray-300 rounded-lg overflow-hidden flex shadow-sm relative">
                        <div className="w-12 bg-gradient-to-b from-red-600 to-green-700 flex flex-col gap-1.5 p-1.5">
                          <div className="h-2 bg-white/90 rounded"></div>
                          <div className="h-1.5 bg-white/70 rounded"></div>
                          <div className="h-1.5 bg-white/70 rounded"></div>
                          <div className="h-1.5 bg-white/70 rounded"></div>
                          <div className="flex-1"></div>
                          <div className="h-1.5 bg-white/50 rounded"></div>
                        </div>
                        <div className="flex-1 bg-red-50 p-1.5 relative">
                          <div className="absolute top-1 right-1 text-xs">❄️</div>
                          <div className="h-1.5 bg-red-200 rounded mb-1.5"></div>
                          <div className="h-1.5 bg-red-200 rounded w-3/4 mb-2"></div>
                          <div className="h-8 bg-white border border-red-200 rounded"></div>
                        </div>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Seasonal</h3>
                    <p className="text-sm text-gray-600 mb-3">Festive themes for special occasions</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Holiday Themes</span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Decorations</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
          
          {/* Themed Mode Settings */}
          {data.theme_mode === 'themed' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Brand Color Customization</h2>
                <p className="text-sm text-gray-600 mt-1">Define your brand identity with custom colors</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Primary Color */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Primary Color
                      <span className="ml-2 text-xs font-normal text-gray-500">(Sidebar, buttons, links)</span>
                    </label>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <input
                            type="color"
                            value={data.theme_primary_color}
                            onChange={(e) => setData('theme_primary_color', e.target.value)}
                            className="h-16 w-24 rounded-lg border-2 border-gray-300 cursor-pointer shadow-sm"
                          />
                          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
                            Click to pick
                          </div>
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={data.theme_primary_color}
                            onChange={(e) => setData('theme_primary_color', e.target.value)}
                            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            placeholder="#185FA5"
                          />
                          <p className="text-xs text-gray-500 mt-1">Enter hex color code</p>
                        </div>
                      </div>
                      
                      {/* Color Presets */}
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-2">Quick Presets:</p>
                        <div className="flex gap-2 flex-wrap">
                          {['#185FA5', '#1E40AF', '#7C3AED', '#DC2626', '#059669', '#D97706'].map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setData('theme_primary_color', color)}
                              className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:scale-110 transition-transform shadow-sm"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Secondary Color */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Secondary Color
                      <span className="ml-2 text-xs font-normal text-gray-500">(Accents, highlights)</span>
                    </label>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <input
                            type="color"
                            value={data.theme_secondary_color}
                            onChange={(e) => setData('theme_secondary_color', e.target.value)}
                            className="h-16 w-24 rounded-lg border-2 border-gray-300 cursor-pointer shadow-sm"
                          />
                          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
                            Click to pick
                          </div>
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={data.theme_secondary_color}
                            onChange={(e) => setData('theme_secondary_color', e.target.value)}
                            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            placeholder="#1a7a4a"
                          />
                          <p className="text-xs text-gray-500 mt-1">Enter hex color code</p>
                        </div>
                      </div>
                      
                      {/* Color Presets */}
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-2">Quick Presets:</p>
                        <div className="flex gap-2 flex-wrap">
                          {['#1a7a4a', '#047857', '#0891B2', '#7C3AED', '#DB2777', '#EA580C'].map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setData('theme_secondary_color', color)}
                              className="w-10 h-10 rounded-lg border-2 border-gray-300 hover:scale-110 transition-transform shadow-sm"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Live Preview */}
                <div className="mt-8 p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <p className="text-sm font-semibold text-gray-700 mb-4">Live Preview</p>
                  <div className="flex gap-4">
                    <button 
                      type="button"
                      className="px-6 py-2.5 rounded-lg text-white font-medium shadow-md transition-transform hover:scale-105"
                      style={{ backgroundColor: data.theme_primary_color }}
                    >
                      Primary Button
                    </button>
                    <button 
                      type="button"
                      className="px-6 py-2.5 rounded-lg text-white font-medium shadow-md transition-transform hover:scale-105"
                      style={{ backgroundColor: data.theme_secondary_color }}
                    >
                      Secondary Button
                    </button>
                    <div 
                      className="px-4 py-2.5 rounded-lg text-sm font-medium"
                      style={{ 
                        backgroundColor: `${data.theme_primary_color}15`,
                        color: data.theme_primary_color,
                        border: `2px solid ${data.theme_primary_color}40`
                      }}
                    >
                      Badge Example
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Seasonal Settings */}
          {data.theme_mode === 'seasonal' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Seasonal Theme Selection</h2>
                <p className="text-sm text-gray-600 mt-1">Choose a festive theme for special occasions</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                  {/* Default */}
                  <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                    data.seasonal_theme === 'default' ? 'border-purple-500 bg-purple-50 shadow-lg scale-105' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}>
                    <input
                      type="radio"
                      name="seasonal_theme"
                      value="default"
                      checked={data.seasonal_theme === 'default'}
                      onChange={(e) => setData('seasonal_theme', e.target.value)}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className="mb-3 flex justify-center">
                        <div className="w-20 h-12 border-2 border-gray-300 rounded-lg overflow-hidden flex shadow-sm">
                          <div className="w-6 bg-blue-600"></div>
                          <div className="flex-1 bg-gray-50"></div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm mb-1">Default</h3>
                      <p className="text-xs text-gray-500">Standard theme</p>
                    </div>
                  </label>
                  
                  {/* Christmas */}
                  <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                    data.seasonal_theme === 'christmas' ? 'border-purple-500 bg-purple-50 shadow-lg scale-105' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}>
                    <input
                      type="radio"
                      name="seasonal_theme"
                      value="christmas"
                      checked={data.seasonal_theme === 'christmas'}
                      onChange={(e) => setData('seasonal_theme', e.target.value)}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className="mb-3 flex justify-center">
                        <div className="w-20 h-12 border-2 border-gray-300 rounded-lg overflow-hidden flex relative shadow-sm">
                          <div className="w-6 bg-gradient-to-b from-red-600 to-green-700"></div>
                          <div className="flex-1 bg-red-50 relative">
                            <div className="absolute top-0 right-0 text-[10px]">❄️</div>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm mb-1">Christmas</h3>
                      <p className="text-xs text-gray-500">Festive red & green</p>
                    </div>
                  </label>
                  
                  {/* New Year */}
                  <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                    data.seasonal_theme === 'newyear' ? 'border-purple-500 bg-purple-50 shadow-lg scale-105' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}>
                    <input
                      type="radio"
                      name="seasonal_theme"
                      value="newyear"
                      checked={data.seasonal_theme === 'newyear'}
                      onChange={(e) => setData('seasonal_theme', e.target.value)}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className="mb-3 flex justify-center">
                        <div className="w-20 h-12 border-2 border-gray-300 rounded-lg overflow-hidden flex relative shadow-sm">
                          <div className="w-6 bg-gradient-to-b from-yellow-400 to-yellow-500"></div>
                          <div className="flex-1 bg-gray-50 relative">
                            <div className="absolute top-0 right-0 text-[10px]">✨</div>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm mb-1">New Year</h3>
                      <p className="text-xs text-gray-500">Golden celebration</p>
                    </div>
                  </label>
                  
                  {/* Valentine */}
                  <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                    data.seasonal_theme === 'valentine' ? 'border-purple-500 bg-purple-50 shadow-lg scale-105' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}>
                    <input
                      type="radio"
                      name="seasonal_theme"
                      value="valentine"
                      checked={data.seasonal_theme === 'valentine'}
                      onChange={(e) => setData('seasonal_theme', e.target.value)}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className="mb-3 flex justify-center">
                        <div className="w-20 h-12 border-2 border-gray-300 rounded-lg overflow-hidden flex relative shadow-sm">
                          <div className="w-6 bg-gradient-to-b from-pink-500 to-pink-600"></div>
                          <div className="flex-1 bg-pink-50 relative">
                            <div className="absolute top-0 right-0 text-[10px]">💕</div>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm mb-1">Valentine</h3>
                      <p className="text-xs text-gray-500">Romantic pink</p>
                    </div>
                  </label>
                  
                  {/* Halloween */}
                  <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                    data.seasonal_theme === 'halloween' ? 'border-purple-500 bg-purple-50 shadow-lg scale-105' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}>
                    <input
                      type="radio"
                      name="seasonal_theme"
                      value="halloween"
                      checked={data.seasonal_theme === 'halloween'}
                      onChange={(e) => setData('seasonal_theme', e.target.value)}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className="mb-3 flex justify-center">
                        <div className="w-20 h-12 border-2 border-gray-300 rounded-lg overflow-hidden flex relative shadow-sm">
                          <div className="w-6 bg-gradient-to-b from-orange-600 to-black"></div>
                          <div className="flex-1 bg-gray-800 relative">
                            <div className="absolute top-0 right-0 text-[10px]">🎃</div>
                          </div>
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm mb-1">Halloween</h3>
                      <p className="text-xs text-gray-500">Spooky orange</p>
                    </div>
                  </label>
                </div>
                
                {/* Enable Toggle */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={data.seasonal_theme_enabled}
                        onChange={(e) => setData('seasonal_theme_enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-8 bg-gray-300 rounded-full peer-checked:bg-purple-600 transition-colors"></div>
                      <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6 shadow-md"></div>
                    </div>
                    <div className="flex-1">
                      <span className="text-base font-semibold text-gray-900 block">Enable Seasonal Theme</span>
                      <p className="text-sm text-gray-600 mt-1">
                        When enabled, the selected seasonal theme with decorations and animations will be applied across the entire system
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {/* Submit Button */}
          <div className="flex justify-end items-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Reset Changes
            </button>
            <button
              type="submit"
              disabled={processing}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {processing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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

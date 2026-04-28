import React from 'react';

interface ColorPickerProps {
    label: string;
    sublabel?: string;
    value: string;
    onChange: (color: string) => void;
    presets: string[];
}

export function ColorPicker({ label, sublabel, value, onChange, presets }: ColorPickerProps) {
    return (
        <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-900">
                {label}
                {sublabel && <span className="ml-2 text-xs font-normal text-gray-500">({sublabel})</span>}
            </label>
            
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-14 w-24 cursor-pointer rounded-lg border border-gray-300 shadow-sm"
                />
                <div className="w-full">
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        placeholder="#185FA5"
                    />
                </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
                {presets.map((color) => (
                    <button
                        key={color}
                        type="button"
                        onClick={() => onChange(color)}
                        className="h-8 w-8 rounded-md border border-gray-300 transition-transform hover:scale-105"
                        style={{ backgroundColor: color }}
                        title={color}
                    />
                ))}
            </div>
        </div>
    );
}

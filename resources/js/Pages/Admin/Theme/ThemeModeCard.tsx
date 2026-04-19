import React, { ReactNode } from 'react';

interface ThemeModeCardProps {
    value: string;
    currentValue: string;
    onChange: (value: string) => void;
    title: string;
    description: string;
    preview: ReactNode;
}

export function ThemeModeCard({ value, currentValue, onChange, title, description, preview }: ThemeModeCardProps) {
    const isActive = currentValue === value;
    
    return (
        <label
            className={`group relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-200 ${
                isActive
                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md hover:scale-102'
            }`}
        >
            <input
                type="radio"
                name="theme_mode"
                value={value}
                checked={isActive}
                onChange={(e) => onChange(e.target.value)}
                className="sr-only"
            />
            
            {isActive && (
                <div className="absolute right-4 top-4 rounded-full bg-blue-600 p-1.5 text-white shadow-md">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
            )}

            <div className="mb-5 flex justify-center">{preview}</div>
            
            <h3 className="text-center text-xl font-bold text-gray-900">{title}</h3>
            <p className="mt-2 text-center text-sm text-gray-600">{description}</p>
        </label>
    );
}

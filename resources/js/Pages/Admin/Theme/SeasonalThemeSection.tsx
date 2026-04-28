interface SeasonalThemeSectionProps {
    selectedTheme: string;
    enabled: boolean;
    seasonalThemes: { [key: string]: string };
    onThemeChange: (theme: string) => void;
    onEnabledChange: (enabled: boolean) => void;
}

const SEASONAL_PREVIEWS: Record<string, { sidebar: string; content: string; emoji?: string; description: string }> = {
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

export function SeasonalThemeSection({
    selectedTheme,
    enabled,
    seasonalThemes,
    onThemeChange,
    onEnabledChange,
}: SeasonalThemeSectionProps) {
    const seasonalKeys = Object.keys(seasonalThemes);

    return (
        <section className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-emerald-50 px-5 py-4">
                <h2 className="text-lg font-semibold text-gray-900">Seasonal Theme</h2>
                <p className="mt-1 text-sm text-gray-600">Select an event style and choose whether to enable it.</p>
            </div>

            <div className="space-y-6 p-5">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                    {seasonalKeys.map((key) => {
                        const preview = SEASONAL_PREVIEWS[key] ?? SEASONAL_PREVIEWS.default;
                        const active = selectedTheme === key;

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
                                    onChange={(e) => onThemeChange(e.target.value)}
                                    className="sr-only"
                                />
                                <div className="mb-2 flex justify-center">
                                    <div className="relative flex h-12 w-20 overflow-hidden rounded-md border border-gray-300 shadow-sm">
                                        <div className={`w-6 ${preview.sidebar}`}></div>
                                        <div className={`relative flex-1 ${preview.content}`}>
                                            {preview.emoji && (
                                                <div className="absolute right-0 top-0 text-[10px]">{preview.emoji}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-center text-sm font-semibold text-gray-900">{seasonalThemes[key]}</p>
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
                                checked={enabled}
                                onChange={(e) => onEnabledChange(e.target.checked)}
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
    );
}

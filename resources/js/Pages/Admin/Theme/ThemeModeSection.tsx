import { ThemeModeCard } from './ThemeModeCard';

interface ThemeModeSectionProps {
    currentMode: string;
    onModeChange: (mode: string) => void;
    primaryColor: string;
    secondaryColor: string;
}

export function ThemeModeSection({ currentMode, onModeChange, primaryColor, secondaryColor }: ThemeModeSectionProps) {
    return (
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-5">
                <h2 className="text-xl font-bold text-gray-900">Theme Mode</h2>
                <p className="mt-1 text-sm text-gray-600">Select your base visual style.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
                <ThemeModeCard
                    value="minimalist"
                    currentValue={currentMode}
                    onChange={onModeChange}
                    title="Minimalist"
                    description="Clean interface with neutral styling."
                    preview={
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
                    }
                />

                <ThemeModeCard
                    value="themed"
                    currentValue={currentMode}
                    onChange={onModeChange}
                    title="Themed"
                    description="Use custom brand colors across UI."
                    preview={
                        <div className="flex h-24 w-40 overflow-hidden rounded-lg border-2 border-gray-300 shadow-sm">
                            <div
                                className="relative flex w-12 flex-col gap-1.5 p-1.5 transition-colors"
                                style={{
                                    background: `linear-gradient(to bottom, ${primaryColor}, ${primaryColor}dd)`,
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
                                    style={{ backgroundColor: `${primaryColor}33` }}
                                />
                                <div
                                    className="mb-2 h-1.5 w-3/4 rounded transition-colors"
                                    style={{ backgroundColor: `${primaryColor}33` }}
                                />
                                <div
                                    className="h-8 rounded border transition-colors"
                                    style={{
                                        backgroundColor: `${primaryColor}11`,
                                        borderColor: `${primaryColor}44`,
                                    }}
                                />
                            </div>
                        </div>
                    }
                />

                <ThemeModeCard
                    value="seasonal"
                    currentValue={currentMode}
                    onChange={onModeChange}
                    title="Seasonal"
                    description="Apply special event styles with optional decorations."
                    preview={
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
                    }
                />
            </div>
        </section>
    );
}

import { ColorPicker } from './ColorPicker';

interface BrandColorsSectionProps {
    primaryColor: string;
    secondaryColor: string;
    onPrimaryChange: (color: string) => void;
    onSecondaryChange: (color: string) => void;
}

const PRIMARY_PRESETS = ['#185FA5', '#1E40AF', '#0F766E', '#DC2626', '#0891B2', '#D97706'];
const SECONDARY_PRESETS = ['#1A7A4A', '#047857', '#0EA5E9', '#7C3AED', '#DB2777', '#EA580C'];

export function BrandColorsSection({
    primaryColor,
    secondaryColor,
    onPrimaryChange,
    onSecondaryChange,
}: BrandColorsSectionProps) {
    return (
        <section className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50 px-5 py-4">
                <h2 className="text-lg font-semibold text-gray-900">Brand Colors</h2>
                <p className="mt-1 text-sm text-gray-600">Set primary and secondary colors for themed mode.</p>
            </div>

            <div className="space-y-6 p-5">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <ColorPicker
                        label="Primary Color"
                        sublabel="Sidebar, buttons, links"
                        value={primaryColor}
                        onChange={onPrimaryChange}
                        presets={PRIMARY_PRESETS}
                    />

                    <ColorPicker
                        label="Secondary Color"
                        sublabel="Accents and highlights"
                        value={secondaryColor}
                        onChange={onSecondaryChange}
                        presets={SECONDARY_PRESETS}
                    />
                </div>

                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5">
                    <p className="mb-3 text-sm font-semibold text-gray-700">Live Preview</p>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
                            style={{ backgroundColor: primaryColor }}
                        >
                            Primary Button
                        </button>
                        <button
                            type="button"
                            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
                            style={{ backgroundColor: secondaryColor }}
                        >
                            Secondary Button
                        </button>
                        <span
                            className="rounded-lg border px-3 py-2 text-xs font-semibold"
                            style={{
                                borderColor: `${primaryColor}40`,
                                backgroundColor: `${primaryColor}15`,
                                color: primaryColor,
                            }}
                        >
                            Badge
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}

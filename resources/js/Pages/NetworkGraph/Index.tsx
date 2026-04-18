import { Head } from '@inertiajs/react';
import { useState, Component, ReactNode } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { ThreeScene } from '@/components/network-graph/ThreeScene';

interface NetworkGraphPageProps {
    title: string;
}

type FormationType = 'quantum-cortex' | 'hyperdimensional-mesh' | 'neural-vortex' | 'synaptic-cloud';

// Error Boundary Component
class NetworkGraphErrorBoundary extends Component<
    { children: ReactNode },
    { hasError: boolean; error?: Error }
> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Network Graph Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '400px',
                    padding: '40px',
                    background: '#fff',
                    border: '1px solid #dde1ed',
                    borderRadius: '12px',
                    textAlign: 'center',
                }}>
                    <div style={{
                        fontSize: '48px',
                        marginBottom: '16px',
                    }}>⚠️</div>
                    <h2 style={{
                        fontSize: '20px',
                        fontWeight: 600,
                        color: '#0f1f3d',
                        marginBottom: '8px',
                    }}>Visualization Error</h2>
                    <p style={{
                        fontSize: '14px',
                        color: '#8892aa',
                        marginBottom: '8px',
                    }}>The 3D visualization encountered an error and cannot be displayed.</p>
                    <p style={{
                        fontSize: '12px',
                        color: '#ef4444',
                        marginBottom: '24px',
                        fontFamily: 'monospace',
                    }}>Error: {this.state.error?.message}</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '10px 20px',
                            background: '#0f1f3d',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: 'pointer',
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

// Main Page Component
export default function NetworkGraphIndex({ title }: NetworkGraphPageProps) {
    const [formation, setFormation] = useState<FormationType>('quantum-cortex');
    const [density, setDensity] = useState<number>(200);
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [bloomEnabled, setBloomEnabled] = useState<boolean>(true);
    const { theme } = useTheme();

    return (
        <AppLayout title={title} breadcrumb="Network Graph">
            <Head title="Network Graph" />

            <NetworkGraphErrorBoundary>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                }}>
                    {/* ThreeScene Component */}
                    <ThreeScene
                        formation={formation}
                        density={density}
                        isPlaying={isPlaying}
                        bloomEnabled={bloomEnabled}
                        theme={theme}
                    />

                    {/* Placeholder for ControlPanel Component */}
                    <div style={{
                        background: '#fff',
                        border: '1px solid #dde1ed',
                        borderRadius: '12px',
                        padding: '20px',
                    }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '16px',
                        }}>
                            {/* Formation Selector */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#0f1f3d',
                                    marginBottom: '8px',
                                }}>
                                    Formation Pattern
                                </label>
                                <select
                                    value={formation}
                                    onChange={(e) => setFormation(e.target.value as FormationType)}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #dde1ed',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        background: '#fff',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <option value="quantum-cortex">Quantum Cortex</option>
                                    <option value="hyperdimensional-mesh">Hyperdimensional Mesh</option>
                                    <option value="neural-vortex">Neural Vortex</option>
                                    <option value="synaptic-cloud">Synaptic Cloud</option>
                                </select>
                            </div>

                            {/* Density Slider */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#0f1f3d',
                                    marginBottom: '8px',
                                }}>
                                    Node Density: {density}
                                </label>
                                <input
                                    type="range"
                                    min="50"
                                    max="500"
                                    value={density}
                                    onChange={(e) => setDensity(Number(e.target.value))}
                                    style={{
                                        width: '100%',
                                    }}
                                />
                            </div>

                            {/* Play/Pause Button */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#0f1f3d',
                                    marginBottom: '8px',
                                }}>
                                    Animation
                                </label>
                                <button
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    style={{
                                        padding: '8px 16px',
                                        background: isPlaying ? '#1a7a4a' : '#8892aa',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {isPlaying ? '⏸ Pause' : '▶ Play'}
                                </button>
                            </div>

                            {/* Bloom Toggle */}
                            <div>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    color: '#0f1f3d',
                                    cursor: 'pointer',
                                    marginTop: '28px',
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={bloomEnabled}
                                        onChange={(e) => setBloomEnabled(e.target.checked)}
                                        style={{
                                            width: '18px',
                                            height: '18px',
                                            cursor: 'pointer',
                                        }}
                                    />
                                    Enable Bloom Effect
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </NetworkGraphErrorBoundary>
        </AppLayout>
    );
}

import { Head } from '@inertiajs/react';
import { ReactNode } from 'react';
import { ThemeApplier } from '@/contexts/ThemeContext';
import SeasonalDecorations from '@/components/SeasonalDecorations';

interface AuthLayoutProps {
    children: ReactNode;
    title?: string;
}

export default function AuthLayout({ children, title = 'Login' }: AuthLayoutProps) {
    return (
        <>
            <Head title={title} />
            <ThemeApplier />
            <SeasonalDecorations />
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #0f1f3d 0%, #1a3260 50%, #243f7a 100%)',
                fontFamily: "'DM Sans', sans-serif",
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Decorative circles */}
                <div style={{
                    position: 'absolute', top: -80, right: -80, width: 300, height: 300,
                    border: '60px solid rgba(201,168,76,0.08)', borderRadius: '50%', pointerEvents: 'none'
                }} />
                <div style={{
                    position: 'absolute', bottom: -60, left: -60, width: 200, height: 200,
                    border: '40px solid rgba(201,168,76,0.05)', borderRadius: '50%', pointerEvents: 'none'
                }} />

                <div style={{ width: '100%', maxWidth: 420, padding: '0 20px', position: 'relative', zIndex: 1 }}>
                    {/* Brand */}
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <div style={{
                            width: 56, height: 56, background: '#c9a84c', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700,
                            color: '#0f1f3d', margin: '0 auto 14px',
                            boxShadow: '0 4px 24px rgba(201,168,76,0.3)',
                        }}>Q</div>
                        <div style={{
                            fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700,
                            color: '#fff', letterSpacing: '0.04em',
                        }}>QUAMC</div>
                        <div style={{
                            fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.5)',
                            letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginTop: 4,
                        }}>Quality Assurance Management Center</div>
                    </div>

                    {/* Card */}
                    <div style={{
                        background: '#fff', borderRadius: 16, padding: '32px 28px',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                    }}>
                        {children}
                    </div>

                    <div style={{
                        textAlign: 'center', marginTop: 20, fontSize: 11,
                        color: 'rgba(255,255,255,0.3)',
                    }}>© 2025 QUAMC · University Accreditation System</div>
                </div>
            </div>
        </>
    );
}

import { Head } from '@inertiajs/react';
import { ReactNode, useEffect } from 'react';
import { ThemeApplier } from '@/contexts/ThemeContext';
import FacebookPagesCarousel from '@/components/FacebookPagesCarousel';

interface AuthLayoutProps {
    children: ReactNode;
    title?: string;
}

export default function AuthLayout({ children, title = 'Login' }: AuthLayoutProps) {
    const currentYear = new Date().getFullYear();
    
    useEffect(() => {
        if ((window as any).FB) {
            (window as any).FB.XFBML.parse();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0';
        script.async = true;
        script.defer = true;
        script.crossOrigin = 'anonymous';
        document.body.appendChild(script);
    }, []);

    return (
        <>
            <Head title={title} />
            <ThemeApplier />
            <div id="fb-root"></div>
            <div className="auth-shell">
                <div className="auth-brand">
                    <div className="auth-brand__top">
                        <div className="auth-brand__masthead">
                            <img src="/logo/TCC.png" alt="TCC Logo" className="auth-brand__logo" />
                            <p className="auth-brand__eyebrow"><span className="ribbon-content">Tagoloan Community College</span></p>
                        </div>

                        <div className="auth-brand__identity">
                            <h1 className="auth-brand__title">QUAMC</h1>
                            <p className="auth-brand__subtitle">Quality Assurance Management Center</p>
                        </div>
                    </div>

                    <div className="auth-brand__carousel-wrap">
                        <FacebookPagesCarousel />
                    </div>
                </div>

                <div className="auth-panel">
                    <div className="auth-panel__surface">
                        <div className="auth-panel__card">
                            {children}
                        </div>

                        <div className="auth-footer">
                            © {currentYear} QUAMC · Quality Assurance Management Center
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

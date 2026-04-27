import { useForm } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import { LogIn } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';

type LoginPhase = 'idle' | 'slideOutGreeting' | 'greeting' | 'slideOutPreloader' | 'preloader';

const greetingMessages = [
    'Good to see you again.',
    'Welcome back, your workspace is ready.',
    'Nice to have you back. Let us continue where you left off.',
    'Great to see you again. Preparing your dashboard now.',
];

function formatAccountName(email: string): string {
    const local = email.split('@')[0] || 'User';
    return local
        .replace(/[._-]+/g, ' ')
        .trim()
        .split(' ')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
}

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [mounted, setMounted] = useState(false);
    const [phase, setPhase] = useState<LoginPhase>('idle');
    const [selectedMessage, setSelectedMessage] = useState(greetingMessages[0]);
    const [isAnimatingSubmit, setIsAnimatingSubmit] = useState(false);
    const timersRef = useRef<number[]>([]);

    const accountName = useMemo(() => formatAccountName(data.email), [data.email]);

    useEffect(() => {
        setMounted(true);

        return () => {
            timersRef.current.forEach((id) => window.clearTimeout(id));
            timersRef.current = [];
        };
    }, []);

    const addTimer = (cb: () => void, ms: number) => {
        const id = window.setTimeout(cb, ms);
        timersRef.current.push(id);
    };

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (processing || isAnimatingSubmit) return;

        setIsAnimatingSubmit(true);
        setSelectedMessage(greetingMessages[Math.floor(Math.random() * greetingMessages.length)]);
        setPhase('slideOutGreeting');

        addTimer(() => {
            setPhase('greeting');
        }, 420);

        addTimer(() => {
            setPhase('slideOutPreloader');
        }, 3420);

        addTimer(() => {
            setPhase('preloader');
            post('/login', {
                onError: () => {
                    setPhase('idle');
                },
                onFinish: () => {
                    setIsAnimatingSubmit(false);
                },
            });
        }, 3860);
    };

    const viewClass =
        phase === 'slideOutGreeting' || phase === 'slideOutPreloader'
            ? 'auth-login__view auth-login__view--slide-out'
            : 'auth-login__view auth-login__view--slide-in';

    return (
        <AuthLayout title="Login">
            <div className="auth-login">
                <div className={`auth-login__stage ${mounted ? 'is-mounted' : ''}`}>
                    {(phase === 'idle' || phase === 'slideOutGreeting') && (
                        <div className={viewClass}>
                            <div className="auth-login__heading">
                                <h2>Welcome back</h2>
                                <p>Sign in to continue managing your accreditation workflows.</p>
                            </div>

                            <form onSubmit={submit} className="auth-login__form">
                                <div className="auth-field">
                                    <label htmlFor="email">Email address</label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="auth-input"
                                        placeholder="you@quamc.edu"
                                        autoComplete="off"
                                    />
                                    {errors.email && <p className="auth-error">{errors.email}</p>}
                                </div>

                                <div className="auth-field">
                                    <label htmlFor="password">Password</label>
                                    <input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="auth-input"
                                        placeholder="Enter your password"
                                        autoComplete="off"
                                    />
                                    {errors.password && <p className="auth-error">{errors.password}</p>}
                                </div>

                                <label className="auth-remember">
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                    />
                                    <span>Keep me signed in</span>
                                </label>

                                <button type="submit" disabled={processing || isAnimatingSubmit} className="auth-submit">
                                    <LogIn size={16} />
                                    {processing ? 'Signing in...' : 'Sign in'}
                                </button>
                            </form>
                        </div>
                    )}

                    {(phase === 'greeting' || phase === 'slideOutPreloader') && (
                        <div className={viewClass}>
                            <div className="auth-greeting">
                                <span className="auth-greeting__kicker">Authentication successful</span>
                                <h2>Hi {accountName || 'User'}</h2>
                                <p>{selectedMessage}</p>
                            </div>
                        </div>
                    )}

                    {phase === 'preloader' && (
                        <div className={viewClass}>
                            <div className="auth-preloader">
                                <div className="auth-preloader__spinner" aria-hidden="true"></div>
                                <h3>Preparing your workspace</h3>
                                <p>Loading your dashboard, records, and active tasks...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthLayout>
    );
}

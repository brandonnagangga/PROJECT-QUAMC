import { useForm } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import { Eye, EyeOff, LogIn } from 'lucide-react';
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
    const [showPassword, setShowPassword] = useState(false);
    const timersRef = useRef<number[]>([]);

    const accountName = useMemo(() => formatAccountName(data.email), [data.email]);
    const passwordRules = useMemo(
        () => [
            { label: 'At least 8 characters', met: data.password.length >= 8 },
            { label: 'At least 1 number', met: /\d/.test(data.password) },
            { label: 'At least 1 lowercase letter', met: /[a-z]/.test(data.password) },
            { label: 'At least 1 uppercase letter', met: /[A-Z]/.test(data.password) },
            { label: 'At least 1 special characters', met: /[^A-Za-z0-9]/.test(data.password) },
        ],
        [data.password]
    );

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

        setSelectedMessage(greetingMessages[Math.floor(Math.random() * greetingMessages.length)]);
        timersRef.current.forEach((id) => window.clearTimeout(id));
        timersRef.current = [];

        post('/login', {
            onSuccess: () => {
                setIsAnimatingSubmit(true);
                setPhase('slideOutGreeting');

                addTimer(() => {
                    setPhase('greeting');
                }, 420);

                addTimer(() => {
                    setPhase('slideOutPreloader');
                }, 3420);

                addTimer(() => {
                    setPhase('preloader');
                }, 3860);
            },
            onError: () => {
                setIsAnimatingSubmit(false);
                setPhase('idle');
            },
            onFinish: () => {
                setIsAnimatingSubmit(false);
            },
        });
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
                                    <div className="auth-password-field">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className="auth-input auth-input--password"
                                            placeholder="Enter your password"
                                            autoComplete="off"
                                        />
                                        <button
                                            type="button"
                                            className="auth-password-toggle"
                                            onClick={() => setShowPassword((current) => !current)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            aria-pressed={showPassword}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="auth-error">{errors.password}</p>}
                                    <div className="auth-password-rules">
                                        <div className="auth-password-rules__head">
                                            <span>Must contain:</span>
                                            <span>{data.password ? 'Password requirements' : 'Enter a password'}</span>
                                        </div>
                                        <ul className="auth-password-rules__list">
                                            {passwordRules.map((rule) => (
                                                <li key={rule.label} className={`auth-password-rules__item ${rule.met ? 'is-met' : ''}`}>
                                                    <span className="auth-password-rules__icon">{rule.met ? '✓' : '×'}</span>
                                                    <span>{rule.label}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
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

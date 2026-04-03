import { useForm } from '@inertiajs/react';
import AuthLayout from '@/Layouts/AuthLayout';
import { LogIn } from 'lucide-react';
import { FormEvent } from 'react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', border: '1.5px solid #dde1ed', borderRadius: 8,
        padding: '10px 12px', fontSize: 13, fontFamily: "'DM Sans', sans-serif",
        color: '#1e2640', background: '#fff', outline: 'none', transition: 'border-color 0.15s',
    };

    return (
        <AuthLayout title="Login">
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, color: '#0f1f3d', marginBottom: 4 }}>
                Welcome back
            </div>
            <div style={{ fontSize: 13, color: '#8892aa', marginBottom: 24 }}>
                Sign in to your QUAMC account
            </div>

            <form onSubmit={submit}>
                <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5470', marginBottom: 6, display: 'block' }}>
                        Email address
                    </label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        style={inputStyle}
                        placeholder="you@quamc.edu"
                        onFocus={(e) => e.target.style.borderColor = '#0f1f3d'}
                        onBlur={(e) => e.target.style.borderColor = '#dde1ed'}
                    />
                    {errors.email && <div style={{ fontSize: 11, color: '#9b1c1c', marginTop: 4 }}>{errors.email}</div>}
                </div>

                <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5470', marginBottom: 6, display: 'block' }}>
                        Password
                    </label>
                    <input
                        type="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        style={inputStyle}
                        placeholder="••••••••"
                        onFocus={(e) => e.target.style.borderColor = '#0f1f3d'}
                        onBlur={(e) => e.target.style.borderColor = '#dde1ed'}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <input
                        type="checkbox"
                        checked={data.remember}
                        onChange={(e) => setData('remember', e.target.checked)}
                        style={{ accentColor: '#0f1f3d' }}
                    />
                    <label style={{ fontSize: 12, color: '#4a5470' }}>Remember me</label>
                </div>

                <button type="submit" disabled={processing} style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '11px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    cursor: processing ? 'not-allowed' : 'pointer', border: 'none',
                    background: '#0f1f3d', color: '#fff', fontFamily: "'DM Sans', sans-serif",
                    opacity: processing ? 0.7 : 1, transition: 'background 0.15s',
                }}>
                    <LogIn size={16} />
                    {processing ? 'Signing in…' : 'Sign in'}
                </button>
            </form>

            <div style={{
                marginTop: 20, padding: '12px 14px', background: '#f8f9fc', borderRadius: 8,
                border: '1px solid #f0f2f8',
            }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#8892aa', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 6 }}>
                    Demo Accounts
                </div>
                <div style={{ fontSize: 11, color: '#4a5470', lineHeight: 1.8 }}>
                    <div><strong>Director:</strong> director@quamc.edu</div>
                    <div><strong>Dean:</strong> gabriel@quamc.edu</div>
                    <div><strong>Program Coord:</strong> janjames@quamc.edu</div>
                    <div><strong>Area Coord:</strong> jsantos@quamc.edu</div>
                    <div style={{ fontSize: 10, color: '#b8bfd4', marginTop: 4 }}>Password: password</div>
                </div>
            </div>
        </AuthLayout>
    );
}

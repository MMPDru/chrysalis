import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isFirebaseConfigured } from '../lib/firebase';

const LoginPage = () => {
    const navigate = useNavigate();
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, signup, currentUser } = useAuth();

    // Redirect if already logged in
    useEffect(() => {
        if (currentUser) {
            navigate('/');
        }
    }, [currentUser, navigate]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        console.log('handleSubmit called', { email, password });

        if (!email || !password) {
            setError('Please enter email and password');
            return;
        }

        setError('');
        setLoading(true);

        try {
            if (isSignup) {
                if (!displayName.trim()) {
                    throw new Error('Please enter your name');
                }
                await signup(email, password, displayName);
            } else {
                console.log('Calling login...');
                await login(email, password);
                console.log('Login successful');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            let message = err.message || 'An error occurred';
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
                message = 'Invalid email or password. Please try again.';
            } else if (err.code === 'auth/user-not-found') {
                message = 'No account found with this email. Please sign up.';
            } else if (err.code === 'auth/too-many-requests') {
                message = 'Too many failed attempts. Please try again later.';
            } else if (err.code === 'auth/invalid-email') {
                message = 'Please enter a valid email address.';
            }
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Butterfly wing background */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'url(/images/butterfly_wing_texture.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.3,
                zIndex: 0
            }} />

            {/* Floating butterflies */}
            <img
                src="/images/butterfly_line_art.png"
                alt=""
                style={{
                    position: 'absolute',
                    top: '10%',
                    right: '15%',
                    width: '120px',
                    opacity: 0.15,
                    animation: 'float 8s ease-in-out infinite'
                }}
            />
            <img
                src="/images/butterfly_line_art.png"
                alt=""
                style={{
                    position: 'absolute',
                    bottom: '15%',
                    left: '10%',
                    width: '100px',
                    opacity: 0.1,
                    animation: 'float 10s ease-in-out infinite',
                    animationDelay: '2s'
                }}
            />

            {/* Login form container */}
            <div style={{
                position: 'relative',
                zIndex: 1,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '2rem',
                padding: '3rem',
                maxWidth: '480px',
                width: '100%',
                boxShadow: '0 30px 80px rgba(107, 73, 132, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.8)'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <img
                        src="/images/butterfly_line_art.png"
                        alt="Chrysalis"
                        style={{ width: '60px', margin: '0 auto 1rem', opacity: 0.7 }}
                    />
                    <h1 style={{
                        fontFamily: 'var(--font-headline)',
                        fontSize: '2.5rem',
                        color: 'var(--color-primary)',
                        marginBottom: '0.5rem',
                        fontWeight: 600
                    }}>
                        Chrysalis
                    </h1>
                    <h2 style={{
                        fontFamily: 'var(--font-headline)',
                        fontSize: '1.1rem',
                        fontStyle: 'italic',
                        color: 'var(--color-text)',
                        fontWeight: 400,
                        marginBottom: '0.5rem',
                        lineHeight: 1.4
                    }}>
                        My Life: A Path Paved with Tragedy,<br />Trauma, and Transformation
                    </h2>
                    <p style={{
                        color: 'var(--color-secondary)',
                        fontSize: '0.95rem',
                        fontWeight: 500
                    }}>
                        Your story, transformed
                    </p>
                </div>

                {/* Setup Notice */}
                {!isFirebaseConfigured && (
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(212, 175, 55, 0.1)',
                        border: '2px solid var(--color-secondary)',
                        borderRadius: '0.75rem',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem'
                    }}>
                        <AlertCircle size={20} color="var(--color-secondary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <p style={{
                                fontSize: '0.875rem',
                                color: '#8B7335',
                                fontWeight: 600,
                                marginBottom: '0.5rem'
                            }}>
                                Firebase Setup Required
                            </p>
                            <p style={{ fontSize: '0.8rem', color: '#666', lineHeight: 1.5 }}>
                                To use this app, please configure your Firebase credentials in a <code>.env</code> file.
                                See <strong>SETUP.md</strong> for detailed instructions.
                            </p>
                        </div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {isSignup && (
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '0.5rem',
                                fontWeight: 500,
                                color: 'var(--color-text)',
                                fontSize: '0.875rem'
                            }}>
                                Your Name
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required={isSignup}
                                style={{
                                    width: '100%',
                                    padding: '0.875rem 1rem',
                                    borderRadius: '0.75rem',
                                    border: '2px solid var(--color-subtle-border)',
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '1rem',
                                    transition: 'border-color 0.2s ease'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--color-subtle-border)'}
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: 500,
                            color: 'var(--color-text)',
                            fontSize: '0.875rem'
                        }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.875rem 1rem',
                                borderRadius: '0.75rem',
                                border: '2px solid var(--color-subtle-border)',
                                fontFamily: 'var(--font-body)',
                                fontSize: '1rem',
                                transition: 'border-color 0.2s ease'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--color-subtle-border)'}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: 500,
                            color: 'var(--color-text)',
                            fontSize: '0.875rem'
                        }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            style={{
                                width: '100%',
                                padding: '0.875rem 1rem',
                                borderRadius: '0.75rem',
                                border: '2px solid var(--color-subtle-border)',
                                fontFamily: 'var(--font-body)',
                                fontSize: '1rem',
                                transition: 'border-color 0.2s ease'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--color-subtle-border)'}
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '0.75rem 1rem',
                            background: 'rgba(224, 122, 95, 0.1)',
                            border: '1px solid var(--color-accent)',
                            borderRadius: '0.5rem',
                            color: 'var(--color-accent)',
                            fontSize: '0.875rem',
                            marginBottom: '1rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            padding: '1rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            opacity: loading ? 0.6 : 1
                        }}
                    >
                        {loading ? (
                            'Please wait...'
                        ) : isSignup ? (
                            <>
                                <UserPlus size={20} />
                                Create Account
                            </>
                        ) : (
                            <>
                                <LogIn size={20} />
                                Enter Your Chrysalis
                            </>
                        )}
                    </button>
                </form>

                {/* Toggle signup/login */}
                <div style={{
                    textAlign: 'center',
                    marginTop: '1.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid var(--color-subtle-border)'
                }}>
                    <p style={{ color: '#666', fontSize: '0.875rem' }}>
                        {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button
                            type="button"
                            onClick={() => {
                                setIsSignup(!isSignup);
                                setError('');
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-primary)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            {isSignup ? 'Sign in' : 'Sign up'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

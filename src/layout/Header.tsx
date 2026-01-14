import { User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

const Header = () => {
    const { currentUser } = useAuth();

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <header style={{
            gridArea: 'header',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.5rem 2rem',
            background: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
            position: 'sticky',
            top: 0,
            zIndex: 10
        }}>
            <div>
                <h1 style={{
                    fontFamily: 'var(--font-headline)',
                    fontSize: '1.25rem',
                    color: 'var(--color-text)',
                    fontStyle: 'italic',
                    fontWeight: 400
                }}>
                    My Life: A Path Paved with Tragedy, Trauma, and Transformation
                </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Show logged in user email */}
                <span style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-text-light)',
                    fontFamily: 'var(--font-body)'
                }}>
                    {currentUser?.email || 'Not logged in'}
                </span>

                <button
                    onClick={handleLogout}
                    title="Logout"
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'var(--color-background)',
                        border: '1px solid var(--color-subtle-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-primary)',
                        cursor: 'pointer'
                    }}>
                    <User size={20} />
                </button>
            </div>
        </header>
    );
};

export default Header;

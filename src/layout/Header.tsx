import { User } from 'lucide-react';

const Header = () => {
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
                <button style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--color-background)',
                    border: '1px solid var(--color-subtle-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)'
                }}>
                    <User size={20} />
                </button>
            </div>
        </header>
    );
};

export default Header;

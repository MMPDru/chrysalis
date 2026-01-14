import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Library,
    Image as ImageIcon,
    Share2,
    Download,
    Settings as SettingsIcon
} from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Library, label: 'Wisdom Library', path: '/library' },
        { icon: ImageIcon, label: 'Visual Studio', path: '/studio' },
        { icon: Share2, label: 'Social Media', path: '/social-media' },
        { icon: Download, label: 'Export Center', path: '/export' },
        { icon: SettingsIcon, label: 'Settings', path: '/settings' },
    ];

    return (
        <aside style={{
            gridArea: 'sidebar',
            background: 'white',
            borderRight: '1px solid rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            padding: '2rem 1.5rem',
            height: '100vh',
            position: 'sticky',
            top: 0
        }}>
            <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img src="/src/assets/images/butterfly_line_art.png" alt="Logo" style={{ width: '32px', height: 'auto' }} />
                <span style={{
                    fontFamily: 'var(--font-headline)',
                    fontSize: '1.5rem',
                    color: 'var(--color-primary)',
                    fontWeight: 700
                }}>
                    Chrysalis
                </span>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.75rem',
                            color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                            background: isActive ? 'var(--color-hover)' : 'transparent',
                            fontFamily: 'var(--font-body)',
                            fontWeight: isActive ? 600 : 400,
                            transition: 'all 0.2s ease',
                            textDecoration: 'none'
                        })}
                    >
                        <item.icon size={20} strokeWidth={1.5} />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                <div style={{
                    padding: '1rem',
                    background: 'linear-gradient(135deg, rgba(107, 73, 132, 0.1), rgba(212, 175, 55, 0.1))',
                    borderRadius: '1rem',
                    textAlign: 'center'
                }}>
                    <p style={{
                        fontFamily: 'var(--font-headline)',
                        fontSize: '0.9rem',
                        color: 'var(--color-primary)',
                        fontStyle: 'italic',
                        marginBottom: '0.5rem'
                    }}>
                        "Transformation is not an event, it's a process."
                    </p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;

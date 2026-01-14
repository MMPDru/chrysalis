import { useState } from 'react';
import { User, Lock, LogOut, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthorSelector from '../components/AuthorSelector';

const SettingsPage = () => {
    const { currentUser, userData, logout, updateUserPreferences } = useAuth();
    const [displayName, setDisplayName] = useState(userData?.displayName || '');
    const [favoriteAuthors, setFavoriteAuthors] = useState(userData?.preferences.favoriteAuthors || []);
    const [customAuthors, setCustomAuthors] = useState(userData?.preferences.customAuthors || []);
    const [defaultExportFormat, setDefaultExportFormat] = useState<'word' | 'pdf'>(
        userData?.preferences.defaultExportFormat || 'pdf'
    );
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage('');

        try {
            await updateUserPreferences({
                favoriteAuthors,
                customAuthors,
                defaultExportFormat
            });
            setSaveMessage('Settings saved successfully!');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (error) {
            setSaveMessage('Error saving settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to logout?')) {
            await logout();
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Settings</h2>
                <p style={{ color: '#666' }}>Manage your account and preferences</p>
            </div>

            {/* Profile Section */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{
                        padding: '0.75rem',
                        background: 'var(--color-hover)',
                        borderRadius: '50%',
                        color: 'var(--color-primary)'
                    }}>
                        <User size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem' }}>Profile</h3>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: 500,
                        fontSize: '0.875rem'
                    }}>
                        Display Name
                    </label>
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--color-subtle-border)',
                            fontFamily: 'var(--font-body)',
                            background: '#f5f5f5',
                            cursor: 'not-allowed'
                        }}
                    />
                    <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
                        Display name can only be changed during setup
                    </p>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: 500,
                        fontSize: '0.875rem'
                    }}>
                        Email
                    </label>
                    <input
                        type="email"
                        value={currentUser?.email || ''}
                        disabled
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--color-subtle-border)',
                            fontFamily: 'var(--font-body)',
                            background: '#f5f5f5',
                            cursor: 'not-allowed'
                        }}
                    />
                </div>
            </div>

            {/* Preferences Section */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{
                        padding: '0.75rem',
                        background: 'var(--color-hover)',
                        borderRadius: '50%',
                        color: 'var(--color-primary)'
                    }}>
                        <Lock size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem' }}>Preferences</h3>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Favorite Authors</h4>
                    <AuthorSelector
                        selectedAuthors={favoriteAuthors}
                        customAuthors={customAuthors}
                        onAuthorsChange={setFavoriteAuthors}
                        onCustomAuthorsChange={setCustomAuthors}
                    />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontWeight: 500,
                        fontSize: '0.875rem'
                    }}>
                        Default Export Format
                    </label>
                    <select
                        value={defaultExportFormat}
                        onChange={(e) => setDefaultExportFormat(e.target.value as 'word' | 'pdf')}
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: '0.5rem',
                            border: '1px solid var(--color-subtle-border)',
                            fontFamily: 'var(--font-body)',
                            fontSize: '1rem',
                            background: 'white'
                        }}
                    >
                        <option value="pdf">PDF Document</option>
                        <option value="word">Word Document</option>
                    </select>
                </div>

                {saveMessage && (
                    <div style={{
                        padding: '0.75rem 1rem',
                        background: saveMessage.includes('Error')
                            ? 'rgba(224, 122, 95, 0.1)'
                            : 'rgba(42, 157, 143, 0.1)',
                        border: `1px solid ${saveMessage.includes('Error') ? 'var(--color-accent)' : 'var(--color-tertiary)'}`,
                        borderRadius: '0.5rem',
                        color: saveMessage.includes('Error') ? 'var(--color-accent)' : 'var(--color-tertiary)',
                        fontSize: '0.875rem',
                        marginBottom: '1rem'
                    }}>
                        {saveMessage}
                    </div>
                )}

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn btn-primary"
                    style={{ opacity: isSaving ? 0.6 : 1 }}
                >
                    <Save size={20} />
                    {isSaving ? 'Saving...' : 'Save Preferences'}
                </button>
            </div>

            {/* Danger Zone */}
            <div className="card" style={{ borderColor: 'rgba(224, 122, 95, 0.3)' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-accent)' }}>
                    Danger Zone
                </h3>
                <p style={{ marginBottom: '1rem', color: '#666', fontSize: '0.875rem' }}>
                    This action will sign you out of your account.
                </p>
                <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '9999px',
                        background: 'white',
                        color: 'var(--color-accent)',
                        border: '2px solid var(--color-accent)',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer'
                    }}
                >
                    <LogOut size={20} />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default SettingsPage;

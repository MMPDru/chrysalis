
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToTikTokScripts, deleteTikTokScript } from '../../lib/tiktok';
import type { TikTokScript } from '../../lib/types';
import { Copy, Trash2, Search, Clock, FileText } from 'lucide-react';

const TikTokScriptLibrary = () => {
    const { currentUser } = useAuth();
    const [scripts, setScripts] = useState<TikTokScript[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!currentUser) return;
        return subscribeToTikTokScripts(currentUser.uid, setScripts);
    }, [currentUser]);

    const filteredScripts = scripts.filter(s =>
        s.chapterTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content);
        alert('Script copied!');
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this script?')) {
            await deleteTikTokScript(id);
        }
    };

    return (
        <div className="script-library">
            <div className="search-bar" style={{ position: 'relative', marginBottom: '2rem' }}>
                <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#ccc' }} size={20} />
                <input
                    type="text"
                    className="text-input"
                    placeholder="Search your scripts..."
                    style={{ paddingLeft: '3rem', width: '100%' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                {filteredScripts.map(script => (
                    <div key={script.id} className="card animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase' }}>{script.style.toUpperCase()} • {script.duration}</div>
                                <h4 style={{ margin: '0.25rem 0' }}>{script.chapterTitle}</h4>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-icon" onClick={() => handleCopy(script.content)}><Copy size={16} /></button>
                                <button className="btn btn-icon" onClick={() => handleDelete(script.id)}><Trash2 size={16} /></button>
                            </div>
                        </div>

                        <div style={{
                            fontSize: '0.85rem',
                            color: '#666',
                            background: '#f9f9f9',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            maxHeight: '150px',
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
                            {script.content}
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px', background: 'linear-gradient(transparent, #f9f9f9)' }} />
                        </div>

                        <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {script.hashtags.slice(0, 3).map(tag => (
                                <span key={tag} style={{ fontSize: '0.7rem', color: '#999' }}>{tag}</span>
                            ))}
                        </div>
                    </div>
                ))}

                {filteredScripts.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem', color: '#ccc' }}>
                        <FileText size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.2 }} />
                        <p>No scripts found. Generate one in the "Create" tab.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TikTokScriptLibrary;

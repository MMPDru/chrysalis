
import { useState, useEffect } from 'react';
import { Sparkles, Book, Send, Info, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToChapters } from '../lib/chapters';
import type { Chapter } from '../lib/types';
import BookExportOptions from '../components/export/BookExportOptions';
import TikTokScriptGenerator from '../components/export/TikTokScriptGenerator';
import TikTokScriptLibrary from '../components/export/TikTokScriptLibrary';

const ExportCenterHome = () => {
    const { currentUser } = useAuth();
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [activeTab, setActiveTab] = useState<'book' | 'tiktok-create' | 'tiktok-library'>('book');

    useEffect(() => {
        if (!currentUser) return;
        return subscribeToChapters(currentUser.uid, setChapters);
    }, [currentUser]);

    return (
        <div className="page-container" style={{ paddingBottom: '5rem' }}>
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', padding: '0.5rem 1.5rem', background: 'var(--color-hover)', borderRadius: '999px', border: '1px solid var(--color-primary-light)' }}>
                    <Send size={18} color="var(--color-primary)" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Export & Share</span>
                </div>
                <h1 className="text-serif" style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>Share Your Transformation</h1>
                <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                    Prepare your memoir for publishing or create viral content to share your journey with the world.
                </p>
            </header>

            <div className="export-tabs" style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '4rem' }}>
                <button
                    onClick={() => setActiveTab('book')}
                    className={`btn ${activeTab === 'book' ? 'btn-primary' : ''}`}
                    style={{ padding: '0.75rem 2rem', gap: '0.5rem', background: activeTab === 'book' ? undefined : 'white', color: activeTab === 'book' ? undefined : '#666' }}
                >
                    <Book size={18} /> Book Export
                </button>
                <div style={{ width: '1px', height: '40px', background: '#eee' }} />
                <button
                    onClick={() => setActiveTab('tiktok-create')}
                    className={`btn ${activeTab === 'tiktok-create' ? 'btn-primary' : ''}`}
                    style={{ padding: '0.75rem 2rem', gap: '0.5rem', background: activeTab === 'tiktok-create' ? undefined : 'white', color: activeTab === 'tiktok-create' ? undefined : '#666' }}
                >
                    <Zap size={18} /> Create TikTok Script
                </button>
                <button
                    onClick={() => setActiveTab('tiktok-library')}
                    className={`btn ${activeTab === 'tiktok-library' ? 'btn-primary' : ''}`}
                    style={{ padding: '0.75rem 2rem', gap: '0.5rem', background: activeTab === 'tiktok-library' ? undefined : 'white', color: activeTab === 'tiktok-library' ? undefined : '#666' }}
                >
                    <Sparkles size={18} /> Script Library
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '3rem' }}>
                <div className="export-main">
                    {activeTab === 'book' && <BookExportOptions chapters={chapters} />}
                    {activeTab === 'tiktok-create' && <TikTokScriptGenerator chapters={chapters} onScriptSaved={() => setActiveTab('tiktok-library')} />}
                    {activeTab === 'tiktok-library' && <TikTokScriptLibrary />}
                </div>

                <aside className="export-sidebar">
                    <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #6b4984, #8b69a4)', color: 'white' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'white' }}><Info size={16} /> TikTok Best Practices</h4>
                        <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
                            <li style={{ display: 'flex', gap: '0.5rem' }}>
                                <div style={{ minWidth: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>1</div>
                                <span>Hook viewers in the first 0-3 seconds. Use vulnerability.</span>
                            </li>
                            <li style={{ display: 'flex', gap: '0.5rem' }}>
                                <div style={{ minWidth: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>2</div>
                                <span>Speak directly to the viewer. Use "you" and "I".</span>
                            </li>
                            <li style={{ display: 'flex', gap: '0.5rem' }}>
                                <div style={{ minWidth: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>3</div>
                                <span>End with the transformation. Show the "Butterfly" moment.</span>
                            </li>
                            <li style={{ display: 'flex', gap: '0.5rem' }}>
                                <div style={{ minWidth: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>4</div>
                                <span>Use the visual cues ([PAUSE]) to maintain pacing.</span>
                            </li>
                        </ul>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default ExportCenterHome;


import { useState, useEffect } from 'react';
import { BookOpen, Youtube, Library, Sparkles } from 'lucide-react';
import MyLibraryTab from '../components/library/MyLibraryTab';
import SearchYouTubeTab from '../components/library/SearchYouTubeTab';
import VideoDetailModal from '../components/library/VideoDetailModal';
import ButterflyContentLibrary from '../components/library/ButterflyContentLibrary';
import { subscribeToLibrary, removeFromLibrary } from '../lib/library';
import { useAuth } from '../contexts/AuthContext';
import type { WisdomVideo } from '../lib/types';
import { useLocation } from 'react-router-dom';
import EnhancementWizard from '../components/enhancer/EnhancementWizard';

const WisdomLibraryHome = () => {
    const { currentUser } = useAuth();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<'mine' | 'search' | 'butterfly'>('mine');
    const [videos, setVideos] = useState<WisdomVideo[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<WisdomVideo | null>(null);
    const [initialSearch, setInitialSearch] = useState('');
    const [showEnhancer, setShowEnhancer] = useState(false);

    useEffect(() => {
        if (!currentUser) return;
        return subscribeToLibrary(currentUser.uid, setVideos);
    }, [currentUser]);

    useEffect(() => {
        // Handle smart search from chapter editor
        const state = location.state as { query?: string, mode?: 'search' };
        if (state?.query) {
            setTimeout(() => {
                setInitialSearch(state.query!);
                setActiveTab('search');
            }, 0);
        } else if (state?.mode === 'search') {
            setTimeout(() => setActiveTab('search'), 0);
        }
    }, [location]);

    const stats = {
        total: videos.length,
        authors: new Set(videos.map(v => v.author)).size,
        butterflies: videos.filter(v => v.butterflyReferences?.length > 0).length
    };

    return (
        <div className="library-page" style={{ padding: '2rem 3rem' }}>
            <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div style={{ background: 'var(--color-primary)', color: 'white', padding: '0.5rem', borderRadius: '0.75rem' }}>
                            <Library size={24} />
                        </div>
                        <h1 style={{ margin: 0 }}>Wisdom Library</h1>
                    </div>
                    <p style={{ color: '#666', fontStyle: 'italic' }}>Curating the transformation of the soul through ancient and modern wisdom.</p>
                </div>

                <div style={{ display: 'flex', gap: '2rem', padding: '1rem 2rem', background: 'white', borderRadius: '1rem', boxShadow: 'var(--shadow-soft)' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>{stats.total}</div>
                        <div style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase' }}>Videos Saved</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-secondary)' }}>{stats.authors}</div>
                        <div style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase' }}>Authors</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-tertiary)' }}>{stats.butterflies}</div>
                        <div style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase' }}>🦋 Refs</div>
                    </div>
                </div>
            </header>

            <div className="tabs-container">
                <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid #eee', marginBottom: '1rem' }}>
                    <button
                        onClick={() => setActiveTab('mine')}
                        style={{
                            padding: '1rem 0.5rem',
                            background: 'transparent',
                            borderBottom: activeTab === 'mine' ? '3px solid var(--color-primary)' : '3px solid transparent',
                            color: activeTab === 'mine' ? 'var(--color-primary)' : '#999',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.3s'
                        }}
                    >
                        <BookOpen size={18} /> My Library
                    </button>
                    <button
                        onClick={() => setActiveTab('search')}
                        style={{
                            padding: '1rem 0.5rem',
                            background: 'transparent',
                            borderBottom: activeTab === 'search' ? '3px solid var(--color-primary)' : '3px solid transparent',
                            color: activeTab === 'search' ? 'var(--color-primary)' : '#999',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.3s'
                        }}
                    >
                        <Youtube size={18} /> Search YouTube
                    </button>
                    <button
                        onClick={() => setActiveTab('butterfly')}
                        style={{
                            padding: '1rem 0.5rem',
                            background: 'transparent',
                            borderBottom: activeTab === 'butterfly' ? '3px solid var(--color-secondary)' : '3px solid transparent',
                            color: activeTab === 'butterfly' ? 'var(--color-secondary)' : '#999',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.3s'
                        }}
                    >
                        <Sparkles size={18} /> Metamorphosis
                    </button>
                </div>

                {activeTab === 'mine' ? (
                    <MyLibraryTab onViewVideo={setSelectedVideo} />
                ) : activeTab === 'search' ? (
                    <SearchYouTubeTab
                        onSuccess={(video) => {
                            setVideos(prev => [video, ...prev]);
                            setActiveTab('mine');
                        }}
                        initialQuery={initialSearch}
                    />
                ) : (
                    <ButterflyContentLibrary
                        videos={videos.filter(v => v.butterflyReferences?.length > 0)}
                        onUseReference={(ref) => {
                            // This would ideally open the chapter editor or something similar
                            alert(`Reference copied: "${ref.quote}"`);
                        }}
                    />
                )}
            </div>

            <VideoDetailModal
                video={selectedVideo}
                onClose={() => setSelectedVideo(null)}
                onRemove={(id) => removeFromLibrary(id)}
                onEnhance={() => setShowEnhancer(true)}
            />

            <EnhancementWizard
                isOpen={showEnhancer}
                onClose={() => setShowEnhancer(false)}
                initialWisdom={selectedVideo}
            />
        </div>
    );
};

export default WisdomLibraryHome;

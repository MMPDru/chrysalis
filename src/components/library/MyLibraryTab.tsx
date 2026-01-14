
import { useState, useEffect } from 'react';
import { Search, Filter, Sparkles, BookOpen } from 'lucide-react';
import type { WisdomVideo } from '../../lib/types';
import { subscribeToLibrary, removeFromLibrary } from '../../lib/library';
import { useAuth } from '../../contexts/AuthContext';
import WisdomVideoCard from './WisdomVideoCard';

interface MyLibraryTabProps {
    onViewVideo: (video: WisdomVideo) => void;
}

const MyLibraryTab = ({ onViewVideo }: MyLibraryTabProps) => {
    const { currentUser } = useAuth();
    const [videos, setVideos] = useState<WisdomVideo[]>([]);
    const [search, setSearch] = useState('');
    const [selectedAuthor, setSelectedAuthor] = useState('All');
    const [onlyButterflies, setOnlyButterflies] = useState(false);

    useEffect(() => {
        if (!currentUser) return;
        return subscribeToLibrary(currentUser.uid, setVideos);
    }, [currentUser]);

    const authors = ['All', ...Array.from(new Set(videos.map(v => v.author)))];

    const filteredVideos = videos.filter(v => {
        const matchesSearch = v.title.toLowerCase().includes(search.toLowerCase()) ||
            v.author.toLowerCase().includes(search.toLowerCase());
        const matchesAuthor = selectedAuthor === 'All' || v.author === selectedAuthor;
        const matchesButterfly = !onlyButterflies || (v.butterflyReferences && v.butterflyReferences.length > 0);
        return matchesSearch && matchesAuthor && matchesButterfly;
    });

    return (
        <div style={{ padding: '2rem 0' }}>
            <div className="filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '3rem' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} size={18} />
                    <input
                        type="text"
                        className="text-input"
                        style={{ paddingLeft: '2.75rem', borderRadius: '0.75rem', height: '3rem', width: '100%' }}
                        placeholder="Search your library..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Filter size={18} color="#666" />
                    <select
                        className="text-input"
                        style={{ height: '3rem', padding: '0 1rem', borderRadius: '0.75rem', width: '150px' }}
                        value={selectedAuthor}
                        onChange={(e) => setSelectedAuthor(e.target.value)}
                    >
                        {authors.map(author => (
                            <option key={author} value={author}>{author}</option>
                        ))}
                    </select>
                </div>

                <button
                    className={`btn ${onlyButterflies ? 'btn-primary' : ''}`}
                    onClick={() => setOnlyButterflies(!onlyButterflies)}
                    style={{ height: '3rem', gap: '0.5rem', ...(!onlyButterflies && { background: 'white', color: '#666' }) }}
                >
                    <Sparkles size={18} /> Butterfly References Only
                </button>

                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <span style={{ fontSize: '0.85rem', color: '#888', fontWeight: 600 }}>
                        {filteredVideos.length} / {videos.length} videos found
                    </span>
                </div>
            </div>

            {filteredVideos.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2.5rem' }}>
                    {filteredVideos.map(video => (
                        <WisdomVideoCard
                            key={video.id}
                            video={video}
                            onView={onViewVideo}
                            onRemove={(id) => {
                                if (window.confirm('Remove this video from your library?')) {
                                    removeFromLibrary(id);
                                }
                            }}
                        />
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '10rem 2rem', background: 'rgba(107, 73, 132, 0.02)', borderRadius: '2rem' }}>
                    <BookOpen size={64} style={{ marginBottom: '1.5rem', opacity: 0.1, color: 'var(--color-primary)' }} />
                    <h3 className="text-serif" style={{ color: '#aaa', fontWeight: 400 }}>
                        {videos.length === 0 ? "Your library is empty. Seek wisdom in the Search tab." : "No videos matches your filters."}
                    </h3>
                </div>
            )}
        </div>
    );
};

export default MyLibraryTab;

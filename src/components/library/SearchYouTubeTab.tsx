
import { useState } from 'react';
import { Search, Sparkles, Plus, Youtube, Loader2 } from 'lucide-react';
import { searchYouTube, getVideoTranscript, type YouTubeVideoResult } from '../../lib/youtube';
import { analyzeWisdomVideo } from '../../lib/gemini';
import { addToLibrary, checkVideoInLibrary } from '../../lib/library';
import { useAuth } from '../../contexts/AuthContext';

interface SearchYouTubeTabProps {
    onSuccess: (video: any) => void;
    initialQuery?: string;
}

const SearchYouTubeTab = ({ onSuccess, initialQuery = '' }: SearchYouTubeTabProps) => {
    const { currentUser } = useAuth();
    const [query, setQuery] = useState(initialQuery);
    const [selectedAuthor, setSelectedAuthor] = useState('All Authors');
    const [includeButterfly, setIncludeButterfly] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<YouTubeVideoResult[]>([]);
    const [addingIds, setAddingIds] = useState<string[]>([]);
    const [customAuthor, setCustomAuthor] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);

    const authors = ['Carl Jung', 'Michael Singer', 'Alan Watts'];

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsSearching(true);
        try {
            const authorToSearch = selectedAuthor === 'All Authors' ? '' : selectedAuthor;
            const searchTerm = includeButterfly ? `${query} butterfly transformation` : query;
            const data = await searchYouTube(searchTerm, authorToSearch);
            setResults(data);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAdd = async (video: YouTubeVideoResult) => {
        if (!currentUser) return;
        setAddingIds(prev => [...prev, video.id]);
        try {
            // Check if already in library
            const exists = await checkVideoInLibrary(currentUser.uid, video.id);
            if (exists) {
                alert('This video is already in your library.');
                return;
            }

            // 1. Get transcript
            const transcript = await getVideoTranscript(video.id);

            // 2. Analyze with Gemini
            const analysis = await analyzeWisdomVideo(transcript);

            // 3. Save to Firestore
            const videoToSave = {
                userId: currentUser.uid,
                youtubeId: video.id,
                title: video.title,
                author: selectedAuthor === 'All Authors' ? 'Various' : selectedAuthor,
                thumbnail: video.thumbnail,
                duration: '10:00', // YouTube search results don't always include duration in v3 search
                channelTitle: video.channelTitle,
                transcript,
                ...analysis
            };

            await addToLibrary(videoToSave);
            onSuccess(videoToSave);
        } catch (error) {
            console.error('Error adding to library:', error);
        } finally {
            setAddingIds(prev => prev.filter(id => id !== video.id));
        }
    };

    return (
        <div style={{ padding: '2rem 0' }}>
            <div className="search-controls" style={{ marginBottom: '2rem' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} size={20} />
                        <input
                            type="text"
                            className="text-input"
                            style={{ paddingLeft: '3rem', width: '100%', borderRadius: '999px', height: '3.5rem' }}
                            placeholder="Search for profound wisdom..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={isSearching} style={{ padding: '0 2.5rem', height: '3.5rem' }}>
                        {isSearching ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> Seek Wisdom</>}
                    </button>
                </form>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                    <button
                        className={`btn ${selectedAuthor === 'All Authors' ? 'btn-primary' : ''}`}
                        style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', ... (selectedAuthor !== 'All Authors' && { background: 'white', color: '#666' }) }}
                        onClick={() => setSelectedAuthor('All Authors')}
                    >
                        All Authors
                    </button>
                    {authors.map(author => (
                        <button
                            key={author}
                            className={`btn ${selectedAuthor === author ? 'btn-primary' : ''}`}
                            style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', ... (selectedAuthor !== author && { background: 'white', color: '#666' }) }}
                            onClick={() => setSelectedAuthor(author)}
                        >
                            {author}
                        </button>
                    ))}

                    {showCustomInput ? (
                        <input
                            className="text-input"
                            style={{ padding: '0.5rem 1rem', width: '150px', fontSize: '0.85rem' }}
                            placeholder="Author Name"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setSelectedAuthor(customAuthor);
                                    setShowCustomInput(false);
                                }
                            }}
                            onChange={(e) => setCustomAuthor(e.target.value)}
                        />
                    ) : (
                        <button
                            className="btn"
                            style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px dashed #ccc', color: '#999', fontSize: '0.85rem' }}
                            onClick={() => setShowCustomInput(true)}
                        >
                            <Plus size={14} /> Custom
                        </button>
                    )}

                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button
                            className={`btn ${includeButterfly ? 'btn-primary' : ''}`}
                            onClick={() => setIncludeButterfly(!includeButterfly)}
                            style={{
                                padding: '0.5rem 1.25rem',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                border: includeButterfly ? 'none' : '1px solid #ddd',
                                background: includeButterfly ? undefined : 'white',
                                color: includeButterfly ? undefined : '#666'
                            }}
                        >
                            🦋 Butterfly Focus {includeButterfly ? 'ON' : 'OFF'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="search-results">
                {isSearching ? (
                    <div style={{ textAlign: 'center', padding: '5rem' }}>
                        <div className="cocoon-spinner" style={{ margin: '0 auto 1.5rem auto' }} />
                        <p style={{ color: '#666', fontStyle: 'italic' }}>Spinning a cocoon of results...</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                        {results.map(video => (
                            <div key={video.id} className="card result-card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={{ position: 'relative', aspectRatio: '16/9' }}>
                                    <img src={video.thumbnail} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.8)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem' }}>
                                        <Youtube size={12} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} /> YouTube
                                    </div>
                                </div>
                                <div style={{ padding: '1rem' }}>
                                    <h5 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', height: '2.8em' }}>{video.title}</h5>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#888' }}>{video.channelTitle}</span>
                                        <button
                                            className={`btn ${addingIds.includes(video.id) ? '' : 'btn-primary'}`}
                                            onClick={() => handleAdd(video)}
                                            disabled={addingIds.includes(video.id)}
                                            style={{ padding: '0.4rem 1rem', fontSize: '0.75rem', height: '32px' }}
                                        >
                                            {addingIds.includes(video.id) ? <Loader2 className="animate-spin" size={14} /> : 'Add to Library'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!isSearching && results.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '5rem', color: '#ccc' }}>
                        <Search size={64} style={{ marginBottom: '1.5rem', opacity: 0.2 }} />
                        <p>Search for wisdom to begin your transformation.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchYouTubeTab;

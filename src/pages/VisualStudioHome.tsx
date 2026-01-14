import { useState, useEffect } from 'react';
import { Palette, PlayCircle, Image as ImageIcon, Sparkles, Loader2, Download, RefreshCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToChapters } from '../lib/chapters';
import type { Chapter } from '../lib/types';
import { generateVisualPrompts } from '../lib/gemini';
import { updateChapterImages } from '../lib/visuals';
import TitleGenerator from '../components/studio/TitleGenerator';

const VisualStudioHome = () => {
    const { currentUser } = useAuth();
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [selectedChapterId, setSelectedChapterId] = useState<string>('');
    const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
    const [view, setView] = useState<'visuals' | 'videos' | 'gallery'>('visuals');

    // Generator States
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [prompts, setPrompts] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedOptions, setGeneratedOptions] = useState<any[]>([]);
    const [selectedThumbnail, setSelectedThumbnail] = useState<string>('');
    const [selectedFullImage, setSelectedFullImage] = useState<string>('');

    useEffect(() => {
        if (!currentUser) return;
        return subscribeToChapters(currentUser.uid, setChapters);
    }, [currentUser]);

    useEffect(() => {
        if (selectedChapterId) {
            setActiveChapter(chapters.find(c => c.id === selectedChapterId) || null);
            setPrompts(null);
            setGeneratedOptions([]);
        }
    }, [selectedChapterId, chapters]);

    const handleAnalyze = async () => {
        if (!activeChapter) return;
        setIsAnalyzing(true);
        try {
            const result = await generateVisualPrompts(activeChapter.title, "Sample content for analysis.", 'image');
            setPrompts(result);
        } catch (error) {
            console.error('Analysis error:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerateImages = async () => {
        setIsGenerating(true);
        // Simulate Nanobanana generation
        setTimeout(() => {
            setGeneratedOptions([
                {
                    thumb: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=400',
                    full: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=1200'
                },
                {
                    thumb: 'https://images.unsplash.com/photo-1543364195-077a16c30ff3?w=400',
                    full: 'https://images.unsplash.com/photo-1543364195-077a16c30ff3?w=1200'
                },
                {
                    thumb: 'https://images.unsplash.com/photo-1502472545332-e24162e39a38?w=400',
                    full: 'https://images.unsplash.com/photo-1502472545332-e24162e39a38?w=1200'
                }
            ]);
            setIsGenerating(false);
        }, 2000);
    };

    const handleSaveSelection = async () => {
        if (!activeChapter || !selectedThumbnail || !selectedFullImage) return;
        try {
            await updateChapterImages(activeChapter.id, selectedThumbnail, selectedFullImage);
            alert('Visuals saved successfully!');
        } catch (error) {
            console.error('Save error:', error);
        }
    };

    return (
        <div className="page-container" style={{ paddingBottom: '5rem' }}>
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', padding: '0.5rem 1.5rem', background: 'var(--color-hover)', borderRadius: '999px', border: '1px solid var(--color-primary-light)' }}>
                    <Palette size={18} color="var(--color-primary)" />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Visual Generation Studio</span>
                </div>
                <h1 className="text-serif" style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>Transform Your Words into Art</h1>
                <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                    Use the power of AI to create custom thumbnails, header images, and evocative concept videos.
                </p>
            </header>

            <div className="studio-tabs" style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '4rem' }}>
                <button
                    onClick={() => setView('visuals')}
                    className={`btn ${view === 'visuals' ? 'btn-primary' : ''}`}
                    style={{ padding: '0.75rem 2rem', gap: '0.5rem', background: view === 'visuals' ? undefined : 'white', color: view === 'visuals' ? undefined : '#666' }}
                >
                    <ImageIcon size={18} /> Chapter Visuals
                </button>
                <button
                    onClick={() => setView('videos')}
                    className={`btn ${view === 'videos' ? 'btn-primary' : ''}`}
                    style={{ padding: '0.75rem 2rem', gap: '0.5rem', background: view === 'videos' ? undefined : 'white', color: view === 'videos' ? undefined : '#666' }}
                >
                    <PlayCircle size={18} /> Concept Videos
                </button>
                <button
                    onClick={() => setView('gallery')}
                    className={`btn ${view === 'gallery' ? 'btn-primary' : ''}`}
                    style={{ padding: '0.75rem 2rem', gap: '0.5rem', background: view === 'gallery' ? undefined : 'white', color: view === 'gallery' ? undefined : '#666' }}
                >
                    <Sparkles size={18} /> Visual Gallery
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '3rem' }}>
                <div className="studio-main">
                    {!selectedChapterId ? (
                        <div className="card" style={{ padding: '5rem', textAlign: 'center', opacity: 0.8 }}>
                            <Palette size={48} style={{ margin: '0 auto 1.5rem auto', color: '#ccc' }} />
                            <h3>Select a chapter to begin</h3>
                        </div>
                    ) : (
                        <>
                            {view === 'visuals' && (
                                <div className="animate-fade-in">
                                    <TitleGenerator
                                        chapterId={activeChapter?.id || ''}
                                        chapterContent="Analysis content."
                                        currentTitle={activeChapter?.title || ''}
                                        onTitleSelected={(t: string) => { if (activeChapter) setActiveChapter({ ...activeChapter, title: t }) }}
                                    />

                                    <div className="card" style={{ padding: '2rem', marginTop: '2rem' }}>
                                        <h3 className="text-serif">Visual Generation Flow</h3>
                                        {!prompts ? (
                                            <button onClick={handleAnalyze} disabled={isAnalyzing} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                                                {isAnalyzing ? <Loader2 className="animate-spin" /> : 'Analyze & Create Prompts'}
                                            </button>
                                        ) : (
                                            <div style={{ marginTop: '1rem' }}>
                                                <div style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '1rem', marginBottom: '1rem' }}>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>HEADER PROMPT:</div>
                                                    <div style={{ fontSize: '0.9rem', color: '#666' }}>{prompts.fullImagePrompt}</div>
                                                </div>
                                                <button onClick={handleGenerateImages} disabled={isGenerating} className="btn btn-primary" style={{ width: '100%' }}>
                                                    {isGenerating ? <Loader2 className="animate-spin" /> : 'Generate Visual Options'}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {generatedOptions.length > 0 && (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '2rem' }}>
                                            {generatedOptions.map((opt, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`card ${selectedThumbnail === opt.thumb ? 'selected' : ''}`}
                                                    onClick={() => { setSelectedThumbnail(opt.thumb); setSelectedFullImage(opt.full); }}
                                                    style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', border: selectedThumbnail === opt.thumb ? '2px solid var(--color-primary)' : 'none' }}
                                                >
                                                    <img src={opt.full} style={{ width: '100%', height: '120px', objectFit: 'cover' }} alt="" />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {selectedThumbnail && (
                                        <button onClick={handleSaveSelection} className="btn btn-primary" style={{ width: '100%', marginTop: '2rem' }}>
                                            Save Visuals
                                        </button>
                                    )}
                                </div>
                            )}

                            {view === 'videos' && (
                                <div className="card" style={{ padding: '5rem', textAlign: 'center' }}>
                                    <PlayCircle size={48} style={{ margin: '0 auto 1.5rem auto', color: '#eee' }} />
                                    <p>Cinematic Concept Videos Coming Soon</p>
                                </div>
                            )}

                            {view === 'gallery' && (
                                <div className="gallery-view animate-fade-in">
                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                                        <select className="status-select" style={{ width: '200px' }}>
                                            <option>All Chapters</option>
                                            {chapters.map(c => <option key={c.id}>Chapter {c.chapterNumber}</option>)}
                                        </select>
                                        <select className="status-select" style={{ width: '150px' }}>
                                            <option>All Types</option>
                                            <option>Thumbnails</option>
                                            <option>Headers</option>
                                            <option>Videos</option>
                                        </select>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                                        {chapters.filter(c => c.thumbnailUrl || c.fullImageUrl).map(c => (
                                            <div key={c.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                                <div style={{ position: 'relative' }}>
                                                    <img src={c.fullImageUrl || c.thumbnailUrl} style={{ width: '100%', height: '180px', objectFit: 'cover' }} alt="" />
                                                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(255,255,255,0.9)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                                                        HEADER
                                                    </div>
                                                </div>
                                                <div style={{ padding: '1rem' }}>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase' }}>Chapter {c.chapterNumber}</div>
                                                    <div style={{ fontSize: '1rem', fontWeight: 600, margin: '0.25rem 0' }}>{c.title}</div>
                                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                                        <button className="btn" style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }}><Download size={14} /> DL</button>
                                                        <button className="btn" style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }}><RefreshCcw size={14} /> Redo</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Mock Videos in Gallery */}
                                        <div className="card" style={{ padding: 0, overflow: 'hidden', opacity: 0.6 }}>
                                            <div style={{ height: '180px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <PlayCircle size={40} color="white" />
                                            </div>
                                            <div style={{ padding: '1rem' }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 800 }}>CONCEPT VIDEO</div>
                                                <div style={{ fontSize: '1rem', fontWeight: 600 }}>The Emergence</div>
                                            </div>
                                        </div>
                                    </div>
                                    {chapters.filter(c => c.thumbnailUrl || c.fullImageUrl).length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '5rem', color: '#ccc' }}>
                                            <ImageIcon size={64} style={{ marginBottom: '1.5rem', opacity: 0.2 }} />
                                            <p>No visual assets generated yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="studio-sidebar">
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1rem', fontSize: '0.8rem', color: '#999' }}>CHAPTERS</h4>
                        {chapters.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedChapterId(c.id)}
                                className="btn"
                                style={{ width: '100%', justifyContent: 'flex-start', background: selectedChapterId === c.id ? 'var(--color-hover)' : 'transparent', marginBottom: '0.5rem', fontSize: '0.9rem' }}
                            >
                                <span style={{ opacity: 0.5, marginRight: '0.5rem' }}>{c.chapterNumber}</span>
                                {c.title}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisualStudioHome;

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Palette,
    PlayCircle,
    Image as ImageIcon,
    Sparkles,
    Loader2,
    Download,
    Trash2,
    Check,
    Archive,
    ArchiveRestore,
    Bookmark,
    LayoutGrid,
    List,
    X,
    Move
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToChapters } from '../lib/chapters';
import type { Chapter } from '../lib/types';
import { generateVisualPrompts } from '../lib/gemini';
import {
    updateChapterImages,
    subscribeToVisualAssets,
    saveImageToLibrary,
    saveVideoToLibrary,
    deleteImage,
    deleteVideo,
    archiveImage,
    unarchiveImage,
    archiveVideo,
    unarchiveVideo,
    moveImageToChapter,
    setImageType,
    setAsChapterThumbnail,
    setAsChapterHeader,
    type VisualAsset
} from '../lib/visuals';
import TitleGenerator from '../components/studio/TitleGenerator';

const VisualStudioHome = () => {
    const { currentUser } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    // Get initial values from URL or localStorage
    const getInitialChapterId = () => {
        const urlChapter = searchParams.get('chapter');
        if (urlChapter) return urlChapter;
        return localStorage.getItem('selectedChapterId') || '';
    };

    const getInitialView = () => {
        const urlView = searchParams.get('view');
        if (urlView === 'visuals' || urlView === 'videos' || urlView === 'gallery') return urlView;
        return 'visuals';
    };

    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [selectedChapterId, setSelectedChapterId] = useState<string>(getInitialChapterId());
    const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
    const [view, setView] = useState<'visuals' | 'videos' | 'gallery'>(getInitialView());

    // Visual Assets State
    const [visualAssets, setVisualAssets] = useState<VisualAsset[]>([]);
    const [galleryFilter, setGalleryFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [showArchived, setShowArchived] = useState(false);
    const [galleryViewMode, setGalleryViewMode] = useState<'grid' | 'list'>('grid');

    // Generator States
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [prompts, setPrompts] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedOptions, setGeneratedOptions] = useState<any[]>([]);
    const [selectedImages, setSelectedImages] = useState<{ thumbnail: string, header: string }>({ thumbnail: '', header: '' });

    // Video States
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [generatedVideos, setGeneratedVideos] = useState<any[]>([]);

    // Modal States
    const [confirmModal, setConfirmModal] = useState<{ show: boolean, action: string, item: any }>({ show: false, action: '', item: null });
    const [moveModal, setMoveModal] = useState<{ show: boolean, item: any }>({ show: false, item: null });
    const [videoDetailModal, setVideoDetailModal] = useState<{ show: boolean, video: any }>({ show: false, video: null });

    // Subscribe to chapters
    useEffect(() => {
        if (!currentUser) return;
        return subscribeToChapters(currentUser.uid, setChapters);
    }, [currentUser]);

    // Subscribe to visual assets
    useEffect(() => {
        if (!currentUser) return;
        return subscribeToVisualAssets(currentUser.uid, setVisualAssets);
    }, [currentUser]);

    // Update active chapter when selection changes
    useEffect(() => {
        if (selectedChapterId) {
            const chapter = chapters.find(c => c.id === selectedChapterId);
            setActiveChapter(chapter || null);
            localStorage.setItem('selectedChapterId', selectedChapterId);
            setSearchParams({ chapter: selectedChapterId, view });
        }
    }, [selectedChapterId, chapters, view, setSearchParams]);

    // Combine visual assets from collection AND videos from chapters
    const allAssets: VisualAsset[] = [
        ...visualAssets,
        // Also include conceptVideos from chapters
        ...chapters.flatMap(chapter =>
            (chapter.conceptVideos || []).map((video: any, idx: number) => ({
                id: `${chapter.id}-video-${idx}`,
                chapterId: chapter.id,
                url: video.url,
                type: 'video' as const,
                title: video.title || `Video ${idx + 1}`,
                prompt: '',
                createdAt: chapter.lastEdited,
                archived: false,
                userId: chapter.userId
            }))
        ),
        // Also include chapter images (thumbnailUrl, fullImageUrl)
        ...chapters.filter(c => c.thumbnailUrl || c.fullImageUrl).flatMap(chapter => {
            const assets: VisualAsset[] = [];
            if (chapter.thumbnailUrl) {
                assets.push({
                    id: `${chapter.id}-thumbnail`,
                    chapterId: chapter.id,
                    url: chapter.thumbnailUrl,
                    type: 'image' as const,
                    imageType: 'thumbnail',
                    title: `${chapter.title} Thumbnail`,
                    prompt: '',
                    createdAt: chapter.lastEdited,
                    archived: false,
                    userId: chapter.userId
                });
            }
            if (chapter.fullImageUrl && chapter.fullImageUrl !== chapter.thumbnailUrl) {
                assets.push({
                    id: `${chapter.id}-header`,
                    chapterId: chapter.id,
                    url: chapter.fullImageUrl,
                    type: 'image' as const,
                    imageType: 'header',
                    title: `${chapter.title} Header`,
                    prompt: '',
                    createdAt: chapter.lastEdited,
                    archived: false,
                    userId: chapter.userId
                });
            }
            return assets;
        })
    ];

    // Deduplicate by URL
    const seenUrls = new Set<string>();
    const dedupedAssets = allAssets.filter(asset => {
        if (seenUrls.has(asset.url)) return false;
        seenUrls.add(asset.url);
        return true;
    });

    // Filter visual assets
    const filteredAssets = dedupedAssets.filter(asset => {
        if (!showArchived && asset.archived) return false;
        if (galleryFilter !== 'all' && asset.chapterId !== galleryFilter) return false;
        if (typeFilter !== 'all') {
            if (typeFilter === 'images' && asset.type !== 'image') return false;
            if (typeFilter === 'videos' && asset.type !== 'video') return false;
            if (typeFilter === 'thumbnails' && asset.imageType !== 'thumbnail') return false;
            if (typeFilter === 'headers' && asset.imageType !== 'header') return false;
        }
        return true;
    });

    // Get image counts per chapter
    const getChapterImageCount = (chapterId: string) => {
        return dedupedAssets.filter(a => a.chapterId === chapterId && !a.archived).length;
    };

    // Analyze chapter for prompts
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

    // Generate images (simulated for now)
    const handleGenerateImages = async () => {
        setIsGenerating(true);
        setTimeout(() => {
            setGeneratedOptions([
                {
                    id: '1',
                    thumb: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=400',
                    full: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=1200'
                },
                {
                    id: '2',
                    thumb: 'https://images.unsplash.com/photo-1543364195-077a16c30ff3?w=400',
                    full: 'https://images.unsplash.com/photo-1543364195-077a16c30ff3?w=1200'
                },
                {
                    id: '3',
                    thumb: 'https://images.unsplash.com/photo-1502472545332-e24162e39a38?w=400',
                    full: 'https://images.unsplash.com/photo-1502472545332-e24162e39a38?w=1200'
                }
            ]);
            setIsGenerating(false);
        }, 2000);
    };

    // Save all generated images to library
    const handleSaveAllToLibrary = async () => {
        if (!currentUser || !activeChapter) return;
        for (const opt of generatedOptions) {
            await saveImageToLibrary(currentUser.uid, activeChapter.id, opt.full, 'generated', prompts?.fullImagePrompt);
        }
        alert('All images saved to library!');
    };

    // Save selected images to chapter
    const handleSaveSelection = async () => {
        if (!activeChapter || !selectedImages.thumbnail || !selectedImages.header) return;
        try {
            await updateChapterImages(activeChapter.id, selectedImages.thumbnail, selectedImages.header);
            alert('Visuals saved successfully!');
        } catch (error) {
            console.error('Save error:', error);
        }
    };

    // Handle image actions
    const handleSetAsThumbnail = async (asset: VisualAsset) => {
        if (!asset.chapterId) {
            alert('This asset is not associated with a chapter.');
            return;
        }
        await setAsChapterThumbnail(asset.chapterId, asset.url);
        await setImageType(asset.id, 'thumbnail');
    };

    const handleSetAsHeader = async (asset: VisualAsset) => {
        if (!asset.chapterId) {
            alert('This asset is not associated with a chapter.');
            return;
        }
        await setAsChapterHeader(asset.chapterId, asset.url);
        await setImageType(asset.id, 'header');
    };

    const handleArchive = async (asset: VisualAsset) => {
        if (asset.type === 'image') {
            await archiveImage(asset.id);
        } else {
            await archiveVideo(asset.id);
        }
    };

    const handleUnarchive = async (asset: VisualAsset) => {
        if (asset.type === 'image') {
            await unarchiveImage(asset.id);
        } else {
            await unarchiveVideo(asset.id);
        }
    };

    const handleDelete = async (asset: VisualAsset) => {
        if (asset.type === 'image') {
            await deleteImage(asset.id);
        } else {
            await deleteVideo(asset.id);
        }
        setConfirmModal({ show: false, action: '', item: null });
    };

    const handleMove = async (asset: VisualAsset, newChapterId: string) => {
        await moveImageToChapter(asset.id, newChapterId);
        setMoveModal({ show: false, item: null });
    };

    const handleDownload = (url: string, filename: string) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
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

            {/* View Tabs */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '3rem' }}>
                <button
                    onClick={() => setView('visuals')}
                    className={`btn ${view === 'visuals' ? 'btn-primary' : ''}`}
                    style={{ padding: '0.75rem 1.5rem', gap: '0.5rem', background: view === 'visuals' ? undefined : 'white' }}
                >
                    <ImageIcon size={18} /> Chapter Visuals
                </button>
                <button
                    onClick={() => setView('videos')}
                    className={`btn ${view === 'videos' ? 'btn-primary' : ''}`}
                    style={{ padding: '0.75rem 1.5rem', gap: '0.5rem', background: view === 'videos' ? undefined : 'white' }}
                >
                    <PlayCircle size={18} /> Concept Videos
                </button>
                <button
                    onClick={() => setView('gallery')}
                    className={`btn ${view === 'gallery' ? 'btn-primary' : ''}`}
                    style={{ padding: '0.75rem 1.5rem', gap: '0.5rem', background: view === 'gallery' ? undefined : 'white' }}
                >
                    <Sparkles size={18} /> Visual Gallery
                </button>
            </div>

            {/* Main Content */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                <div className="studio-main">
                    {/* Gallery View */}
                    {view === 'gallery' && (
                        <div className="animate-fade-in">
                            {/* Gallery Controls */}
                            <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <select
                                        value={galleryFilter}
                                        onChange={(e) => setGalleryFilter(e.target.value)}
                                        style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #ddd', minWidth: '150px' }}
                                    >
                                        <option value="all">All Chapters</option>
                                        {chapters.map(c => (
                                            <option key={c.id} value={c.id}>Ch {c.chapterNumber}: {c.title}</option>
                                        ))}
                                    </select>

                                    <select
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                        style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid #ddd', minWidth: '120px' }}
                                    >
                                        <option value="all">All Types</option>
                                        <option value="images">Images</option>
                                        <option value="videos">Videos</option>
                                        <option value="thumbnails">Thumbnails</option>
                                        <option value="headers">Headers</option>
                                    </select>

                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={showArchived}
                                            onChange={(e) => setShowArchived(e.target.checked)}
                                        />
                                        Show Archived
                                    </label>

                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.25rem' }}>
                                        <button
                                            onClick={() => setGalleryViewMode('grid')}
                                            className="btn"
                                            style={{ padding: '0.5rem', background: galleryViewMode === 'grid' ? 'var(--color-primary)' : 'white', color: galleryViewMode === 'grid' ? 'white' : '#666' }}
                                        >
                                            <LayoutGrid size={18} />
                                        </button>
                                        <button
                                            onClick={() => setGalleryViewMode('list')}
                                            className="btn"
                                            style={{ padding: '0.5rem', background: galleryViewMode === 'list' ? 'var(--color-primary)' : 'white', color: galleryViewMode === 'list' ? 'white' : '#666' }}
                                        >
                                            <List size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Legend */}
                                <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', padding: '1rem', background: 'var(--color-hover)', borderRadius: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Bookmark size={14} />
                                        <span style={{ fontSize: '0.85rem' }}><strong>Thumbnail:</strong> Small preview shown on chapter cards</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <ImageIcon size={14} />
                                        <span style={{ fontSize: '0.85rem' }}><strong>Header:</strong> Large banner at top of chapter content</span>
                                    </div>
                                </div>
                            </div>

                            {/* Gallery Grid/List */}
                            {filteredAssets.length > 0 ? (
                                galleryViewMode === 'grid' ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                        {filteredAssets.map(asset => (
                                            <AssetCard
                                                key={asset.id}
                                                asset={asset}
                                                chapters={chapters}
                                                onSetThumbnail={() => handleSetAsThumbnail(asset)}
                                                onSetHeader={() => handleSetAsHeader(asset)}
                                                onArchive={() => handleArchive(asset)}
                                                onUnarchive={() => handleUnarchive(asset)}
                                                onDelete={() => setConfirmModal({ show: true, action: 'delete', item: asset })}
                                                onMove={() => setMoveModal({ show: true, item: asset })}
                                                onDownload={() => handleDownload(asset.url, `${asset.imageType || 'image'}-${asset.id}.jpg`)}
                                                onVideoClick={() => asset.type === 'video' && setVideoDetailModal({ show: true, video: asset })}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {filteredAssets.map(asset => (
                                            <AssetListItem
                                                key={asset.id}
                                                asset={asset}
                                                chapters={chapters}
                                                onSetThumbnail={() => handleSetAsThumbnail(asset)}
                                                onSetHeader={() => handleSetAsHeader(asset)}
                                                onArchive={() => handleArchive(asset)}
                                                onUnarchive={() => handleUnarchive(asset)}
                                                onDelete={() => setConfirmModal({ show: true, action: 'delete', item: asset })}
                                                onMove={() => setMoveModal({ show: true, item: asset })}
                                                onDownload={() => handleDownload(asset.url, `${asset.imageType || 'image'}-${asset.id}.jpg`)}
                                            />
                                        ))}
                                    </div>
                                )
                            ) : (
                                <div style={{ textAlign: 'center', padding: '5rem', color: '#999' }}>
                                    <ImageIcon size={64} style={{ marginBottom: '1.5rem', opacity: 0.3 }} />
                                    <p style={{ fontSize: '1.1rem' }}>No visual assets generated yet.</p>
                                    <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Go to Chapter Visuals tab, select a chapter, and generate your first image!</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Visuals View */}
                    {view === 'visuals' && (
                        !selectedChapterId ? (
                            <div className="card" style={{ padding: '5rem', textAlign: 'center', opacity: 0.8 }}>
                                <Palette size={48} style={{ margin: '0 auto 1.5rem auto', color: '#ccc' }} />
                                <h3>Select a chapter to begin</h3>
                                <p style={{ color: '#888', marginTop: '0.5rem' }}>Choose a chapter from the sidebar to generate visuals</p>
                            </div>
                        ) : (
                            <div className="animate-fade-in">
                                <TitleGenerator
                                    chapterId={activeChapter?.id || ''}
                                    chapterContent="Analysis content."
                                    currentTitle={activeChapter?.title || ''}
                                    onTitleSelected={(t: string) => { if (activeChapter) setActiveChapter({ ...activeChapter, title: t }) }}
                                />

                                <div className="card" style={{ padding: '2rem', marginTop: '2rem' }}>
                                    <h3 className="text-serif" style={{ marginBottom: '1.5rem' }}>Visual Generation Flow</h3>

                                    {!prompts ? (
                                        <button onClick={handleAnalyze} disabled={isAnalyzing} className="btn btn-primary" style={{ width: '100%' }}>
                                            {isAnalyzing ? <><Loader2 className="animate-spin" size={18} /> Analyzing...</> : 'Analyze & Create Prompts'}
                                        </button>
                                    ) : (
                                        <div>
                                            <div style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1rem' }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>HEADER PROMPT:</div>
                                                <div style={{ fontSize: '0.9rem', color: '#666' }}>{prompts.fullImagePrompt}</div>
                                            </div>
                                            <button onClick={handleGenerateImages} disabled={isGenerating} className="btn btn-primary" style={{ width: '100%' }}>
                                                {isGenerating ? <><Loader2 className="animate-spin" size={18} /> Generating...</> : 'Generate Visual Options'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {generatedOptions.length > 0 && (
                                    <>
                                        <div style={{ marginTop: '2rem' }}>
                                            <h4 style={{ marginBottom: '1rem' }}>Select Your Visuals</h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                                {generatedOptions.map((opt) => (
                                                    <div
                                                        key={opt.id}
                                                        className="card"
                                                        style={{
                                                            padding: 0,
                                                            overflow: 'hidden',
                                                            cursor: 'pointer',
                                                            border: selectedImages.header === opt.full ? '3px solid var(--color-primary)' : '1px solid #eee',
                                                            transform: selectedImages.header === opt.full ? 'scale(1.02)' : 'scale(1)',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onClick={() => setSelectedImages({ thumbnail: opt.thumb, header: opt.full })}
                                                    >
                                                        <img src={opt.full} style={{ width: '100%', height: '140px', objectFit: 'cover' }} alt="" />
                                                        {selectedImages.header === opt.full && (
                                                            <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'var(--color-primary)', borderRadius: '50%', padding: '0.25rem' }}>
                                                                <Check size={16} color="white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                            <button onClick={handleSaveSelection} disabled={!selectedImages.header} className="btn btn-primary" style={{ flex: 1 }}>
                                                Save as Chapter Visuals
                                            </button>
                                            <button onClick={handleSaveAllToLibrary} className="btn" style={{ flex: 1, background: 'white', border: '1px solid #ddd' }}>
                                                Save All to Library
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )
                    )}

                    {/* Videos View */}
                    {view === 'videos' && (
                        !selectedChapterId ? (
                            <div className="card" style={{ padding: '5rem', textAlign: 'center', opacity: 0.8 }}>
                                <PlayCircle size={48} style={{ margin: '0 auto 1.5rem auto', color: '#ccc' }} />
                                <h3>Select a chapter to begin</h3>
                            </div>
                        ) : (
                            <div className="animate-fade-in">
                                <div className="card" style={{ padding: '2rem' }}>
                                    <h3 className="text-serif" style={{ marginBottom: '1rem' }}>Concept Video Generator</h3>
                                    <p style={{ color: '#666', marginBottom: '1.5rem' }}>Generate cinematic concept videos that capture the essence of your chapter.</p>

                                    <button
                                        onClick={() => {
                                            setIsGeneratingVideo(true);
                                            setTimeout(() => {
                                                setGeneratedVideos([
                                                    { id: '1', url: 'https://example.com/video1.mp4', title: 'The Emergence', thumbnail: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=400' }
                                                ]);
                                                setIsGeneratingVideo(false);
                                            }, 3000);
                                        }}
                                        disabled={isGeneratingVideo}
                                        className="btn btn-primary"
                                        style={{ width: '100%' }}
                                    >
                                        {isGeneratingVideo ? <><Loader2 className="animate-spin" size={18} /> Generating Video...</> : 'Generate Concept Video'}
                                    </button>
                                </div>

                                {generatedVideos.length > 0 && (
                                    <div style={{ marginTop: '2rem' }}>
                                        <h4 style={{ marginBottom: '1rem' }}>Generated Videos</h4>
                                        <div style={{ display: 'grid', gap: '1rem' }}>
                                            {generatedVideos.map(video => (
                                                <div key={video.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                                    <div style={{ position: 'relative', height: '200px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <img src={video.thumbnail} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} alt="" />
                                                        <PlayCircle size={48} color="white" style={{ position: 'absolute' }} />
                                                    </div>
                                                    <div style={{ padding: '1rem' }}>
                                                        <div style={{ fontWeight: 600 }}>{video.title}</div>
                                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                                            <button className="btn" style={{ flex: 1, padding: '0.5rem' }}><Download size={14} /> Download</button>
                                                            <button
                                                                className="btn btn-primary"
                                                                style={{ flex: 1, padding: '0.5rem' }}
                                                                onClick={() => currentUser && activeChapter && saveVideoToLibrary(currentUser.uid, activeChapter.id, video.url, video.title)}
                                                            >
                                                                Save to Library
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </div>

                {/* Sidebar */}
                <div className="studio-sidebar">
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h4 style={{ marginBottom: '1rem', fontSize: '0.8rem', color: '#999', textTransform: 'uppercase' }}>Chapters</h4>
                        <button
                            type="button"
                            onClick={() => {
                                console.log('All Chapters clicked');
                                setSelectedChapterId('');
                                setActiveChapter(null);
                                setGalleryFilter('all');
                            }}
                            className="btn"
                            style={{
                                width: '100%',
                                justifyContent: 'flex-start',
                                background: !selectedChapterId || galleryFilter === 'all' ? 'var(--color-primary)' : 'transparent',
                                color: !selectedChapterId || galleryFilter === 'all' ? 'white' : 'inherit',
                                marginBottom: '0.5rem',
                                cursor: 'pointer'
                            }}
                        >
                            + All Chapters
                        </button>
                        {chapters.map(c => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                    console.log('Chapter clicked:', c.id, c.title);
                                    setSelectedChapterId(c.id);
                                    setActiveChapter(c);
                                    if (view === 'gallery') setGalleryFilter(c.id);
                                }}
                                className="btn"
                                style={{
                                    width: '100%',
                                    justifyContent: 'space-between',
                                    background: selectedChapterId === c.id ? 'var(--color-hover)' : 'transparent',
                                    marginBottom: '0.5rem',
                                    fontSize: '0.9rem',
                                    paddingRight: '0.75rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ opacity: 0.5 }}>{c.chapterNumber}</span>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{c.title}</span>
                                </span>
                                {getChapterImageCount(c.id) > 0 && (
                                    <span style={{
                                        background: 'var(--color-primary)',
                                        color: 'white',
                                        padding: '0.1rem 0.4rem',
                                        borderRadius: '999px',
                                        fontSize: '0.7rem',
                                        fontWeight: 600
                                    }}>
                                        {getChapterImageCount(c.id)}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {confirmModal.show && (
                <div className="modal-overlay" onClick={() => setConfirmModal({ show: false, action: '', item: null })}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Confirm Delete</h3>
                        <p style={{ color: '#666', marginBottom: '1.5rem' }}>Are you sure you want to delete this {confirmModal.item?.type}? This action cannot be undone.</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn" style={{ flex: 1 }} onClick={() => setConfirmModal({ show: false, action: '', item: null })}>Cancel</button>
                            <button className="btn" style={{ flex: 1, background: '#ef4444', color: 'white' }} onClick={() => handleDelete(confirmModal.item)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Move Modal */}
            {moveModal.show && (
                <div className="modal-overlay" onClick={() => setMoveModal({ show: false, item: null })}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Move to Chapter</h3>
                        <p style={{ color: '#666', marginBottom: '1rem' }}>Select a chapter to move this image to:</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            {chapters.map(c => (
                                <button
                                    key={c.id}
                                    className="btn"
                                    style={{ justifyContent: 'flex-start', background: c.id === moveModal.item?.chapterId ? 'var(--color-hover)' : 'white' }}
                                    onClick={() => handleMove(moveModal.item, c.id)}
                                >
                                    Ch {c.chapterNumber}: {c.title}
                                </button>
                            ))}
                        </div>
                        <button className="btn" style={{ width: '100%' }} onClick={() => setMoveModal({ show: false, item: null })}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Video Detail Modal */}
            {videoDetailModal.show && (
                <div className="modal-overlay" onClick={() => setVideoDetailModal({ show: false, video: null })}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', padding: 0 }}>
                        <button
                            onClick={() => setVideoDetailModal({ show: false, video: null })}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '0.5rem', cursor: 'pointer', zIndex: 10 }}
                        >
                            <X size={20} color="white" />
                        </button>
                        <div style={{ background: '#000', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <PlayCircle size={64} color="white" />
                        </div>
                        <div style={{ padding: '1.5rem' }}>
                            <h3>{videoDetailModal.video?.title || 'Video'}</h3>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button className="btn" style={{ flex: 1 }}><Download size={16} /> Download</button>
                                <button className="btn" style={{ flex: 1, background: '#ef4444', color: 'white' }} onClick={() => {
                                    setConfirmModal({ show: true, action: 'delete', item: videoDetailModal.video });
                                    setVideoDetailModal({ show: false, video: null });
                                }}>
                                    <Trash2 size={16} /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Asset Card Component for Grid View
const AssetCard = ({ asset, chapters, onSetThumbnail, onSetHeader, onArchive, onUnarchive, onDelete, onMove, onDownload, onVideoClick }: any) => {
    const chapter = chapters.find((c: Chapter) => c.id === asset.chapterId);

    return (
        <div
            className="card"
            style={{
                padding: 0,
                overflow: 'hidden',
                opacity: asset.archived ? 0.6 : 1,
                cursor: asset.type === 'video' ? 'pointer' : 'default'
            }}
            onClick={() => asset.type === 'video' && onVideoClick?.()}
        >
            <div style={{ position: 'relative', height: '160px' }}>
                {asset.type === 'image' ? (
                    <img src={asset.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                ) : (
                    <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PlayCircle size={40} color="white" />
                    </div>
                )}

                {asset.imageType && (
                    <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: asset.imageType === 'thumbnail' ? 'var(--color-secondary)' : 'var(--color-primary)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        {asset.imageType}
                    </div>
                )}

                {asset.archived && (
                    <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', background: '#666', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700 }}>
                        ARCHIVED
                    </div>
                )}
            </div>

            <div style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    {chapter ? `Chapter ${chapter.chapterNumber}` : 'Unknown Chapter'}
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {chapter?.title || asset.title || 'Untitled'}
                </div>

                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    {asset.type === 'image' && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); onSetThumbnail(); }} className="btn" style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem' }} title="Set as Thumbnail">
                                <Bookmark size={12} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onSetHeader(); }} className="btn" style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem' }} title="Set as Header">
                                <ImageIcon size={12} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onMove(); }} className="btn" style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem' }} title="Move to Chapter">
                                <Move size={12} />
                            </button>
                        </>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); onDownload(); }} className="btn" style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem' }} title="Download">
                        <Download size={12} />
                    </button>
                    {asset.archived ? (
                        <button onClick={(e) => { e.stopPropagation(); onUnarchive(); }} className="btn" style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem' }} title="Unarchive">
                            <ArchiveRestore size={12} />
                        </button>
                    ) : (
                        <button onClick={(e) => { e.stopPropagation(); onArchive(); }} className="btn" style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem' }} title="Archive">
                            <Archive size={12} />
                        </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="btn" style={{ padding: '0.3rem 0.5rem', fontSize: '0.7rem', color: '#ef4444' }} title="Delete">
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Asset List Item Component for List View
const AssetListItem = ({ asset, chapters, onSetThumbnail, onSetHeader, onArchive, onUnarchive, onDelete, onMove, onDownload }: any) => {
    const chapter = chapters.find((c: Chapter) => c.id === asset.chapterId);

    return (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', opacity: asset.archived ? 0.6 : 1 }}>
            <div style={{ width: '60px', height: '45px', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0 }}>
                {asset.type === 'image' ? (
                    <img src={asset.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                ) : (
                    <div style={{ width: '100%', height: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PlayCircle size={20} color="white" />
                    </div>
                )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {chapter?.title || asset.title || 'Untitled'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#888' }}>
                    {chapter ? `Ch ${chapter.chapterNumber}` : ''} • {asset.imageType || asset.type}
                    {asset.archived && ' • Archived'}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.25rem' }}>
                {asset.type === 'image' && (
                    <>
                        <button onClick={onSetThumbnail} className="btn" style={{ padding: '0.35rem' }} title="Set as Thumbnail"><Bookmark size={14} /></button>
                        <button onClick={onSetHeader} className="btn" style={{ padding: '0.35rem' }} title="Set as Header"><ImageIcon size={14} /></button>
                        <button onClick={onMove} className="btn" style={{ padding: '0.35rem' }} title="Move"><Move size={14} /></button>
                    </>
                )}
                <button onClick={onDownload} className="btn" style={{ padding: '0.35rem' }} title="Download"><Download size={14} /></button>
                {asset.archived ? (
                    <button onClick={onUnarchive} className="btn" style={{ padding: '0.35rem' }} title="Unarchive"><ArchiveRestore size={14} /></button>
                ) : (
                    <button onClick={onArchive} className="btn" style={{ padding: '0.35rem' }} title="Archive"><Archive size={14} /></button>
                )}
                <button onClick={onDelete} className="btn" style={{ padding: '0.35rem', color: '#ef4444' }} title="Delete"><Trash2 size={14} /></button>
            </div>
        </div>
    );
};

export default VisualStudioHome;

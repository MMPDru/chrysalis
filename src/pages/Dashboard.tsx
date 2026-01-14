import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    PenTool,
    Feather,
    Sparkles,
    LayoutGrid,
    List,
    Plus,
    CheckCircle2,
    Move
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToChapters, createChapter, reorderChapters } from '../lib/chapters';
import type { Chapter } from '../lib/types';
import ChapterGrid from '../components/chapters/ChapterGrid';
import ChapterList from '../components/chapters/ChapterList';
import DraggableChapterList from '../components/chapters/DraggableChapterList';
import CreateChapterModal from '../components/chapters/CreateChapterModal';
import ChapterQuickView from '../components/chapters/ChapterQuickView';
import EnhancementWizard from '../components/enhancer/EnhancementWizard';
import ButterflyDashboardWidget from '../components/dashboard/ButterflyDashboardWidget';

const Dashboard = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'reorder'>('grid');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
    const [showEnhancer, setShowEnhancer] = useState(false);

    useEffect(() => {
        if (!currentUser) return;
        return subscribeToChapters(currentUser.uid, (data) => {
            setChapters(data);
        });
    }, [currentUser]);

    const stats = {
        total: chapters.length,
        completed: chapters.filter(c => c.status === 'complete').length,
        words: chapters.reduce((acc, c) => acc + (c.wordCount || 0), 0)
    };

    const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

    const handleCreateChapter = async (number: number, title: string) => {
        if (!currentUser) return;
        const chapterId = await createChapter(currentUser.uid, number, title);
        navigate(`/chapters/${chapterId}`);
    };

    const handleReorder = async (newOrder: Chapter[]) => {
        setChapters(newOrder); // Optimistic update
        await reorderChapters(newOrder);
    };

    return (
        <div style={{ paddingBottom: '5rem' }}>
            <div style={{
                marginBottom: '3rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <h2 style={{ fontSize: '2.5rem', margin: 0 }}>Your Story Awaits</h2>
                        <Sparkles className="animate-float" style={{ color: 'var(--color-secondary)' }} />
                    </div>
                    <p style={{ color: '#666', fontSize: '1.1rem' }}>
                        The transformation of {currentUser?.displayName || 'your life'} is unfolding.
                    </p>
                </div>

                <div className="card" style={{ padding: '0.5rem', display: 'flex', gap: '0.25rem' }}>
                    <button
                        className={`btn ${viewMode === 'grid' ? 'btn-primary' : ''}`}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', background: viewMode === 'grid' ? undefined : 'transparent', color: viewMode === 'grid' ? undefined : '#666' }}
                        onClick={() => setViewMode('grid')}
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button
                        className={`btn ${viewMode === 'list' ? 'btn-primary' : ''}`}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', background: viewMode === 'list' ? undefined : 'transparent', color: viewMode === 'list' ? undefined : '#666' }}
                        onClick={() => setViewMode('list')}
                    >
                        <List size={20} />
                    </button>
                    <button
                        className={`btn ${viewMode === 'reorder' ? 'btn-primary' : ''}`}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', background: viewMode === 'reorder' ? undefined : 'transparent', color: viewMode === 'reorder' ? undefined : '#666' }}
                        onClick={() => setViewMode('reorder')}
                        title="Reorder Chapters"
                    >
                        <Move size={20} />
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
                marginBottom: '4rem'
            }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: 'var(--color-hover)', borderRadius: '50%', color: 'var(--color-primary)' }}>
                        <PenTool size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-primary)' }}>{stats.total}</div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>Total Chapters</div>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: 'var(--color-hover)', borderRadius: '50%', color: 'var(--color-tertiary)' }}>
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-tertiary)' }}>{stats.completed}</div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>Chapters Complete</div>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: 'var(--color-hover)', borderRadius: '50%', color: 'var(--color-secondary)' }}>
                        <Feather size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-secondary)' }}>{stats.words.toLocaleString()}</div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>Words Written</div>
                    </div>
                </div>
            </div>

            <ButterflyDashboardWidget chapters={chapters} />

            {/* Visual Progress */}
            <div className="card" style={{ marginBottom: '4rem', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Transformation Progress</h3>
                    <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{Math.round(progress)}% Complete</span>
                </div>
                <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${progress}%` }}>
                        <div className="progress-icon" style={{ right: progress === 100 ? '-32px' : '-16px' }}>
                            {progress === 100 ? '🦋' : progress > 50 ? '蛹' : '🐛'}
                        </div>
                    </div>
                </div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#666', fontStyle: 'italic' }}>
                    {progress === 100
                        ? "Your journey is complete. The butterfly has emerged."
                        : progress > 50
                            ? "You are in the chrysalis phase, deep in transformation."
                            : "The journey is just beginning. Keep crawling forward."}
                </p>
            </div>

            {/* Chapters View */}
            {chapters.length > 0 ? (
                viewMode === 'grid' ? (
                    <ChapterGrid chapters={chapters} onChapterClick={setSelectedChapter} />
                ) : viewMode === 'list' ? (
                    <ChapterList chapters={chapters} onChapterClick={setSelectedChapter} />
                ) : (
                    <DraggableChapterList chapters={chapters} onReorder={handleReorder} />
                )
            ) : (
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'var(--color-hover)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        color: 'var(--color-primary)'
                    }}>
                        <PenTool size={40} />
                    </div>
                    <h3>Start Your Story</h3>
                    <p style={{ color: '#666', marginBottom: '2rem' }}>Every transformation begins with a single word.</p>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={20} />
                        Create Your First Chapter
                    </button>
                </div>
            )}

            {/* FAB */}
            <button className="fab" onClick={() => setIsModalOpen(true)} title="New Chapter">
                <Plus size={32} />
            </button>

            {/* Modals */}
            <CreateChapterModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateChapter}
                nextChapterNumber={chapters.length + 1}
            />

            <ChapterQuickView
                chapter={selectedChapter}
                onClose={() => setSelectedChapter(null)}
                onOpenEditor={(id) => navigate(`/chapters/${id}`)}
                onViewVersions={(id) => navigate(`/chapters/${id}/versions`)}
                onEnhance={() => setShowEnhancer(true)}
            />

            <EnhancementWizard
                isOpen={showEnhancer}
                onClose={() => setShowEnhancer(false)}
                initialChapter={selectedChapter}
            />
        </div>
    );
};

export default Dashboard;

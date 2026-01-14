import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Save,
    Brain,
    Type,
    History,
    Plus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
    subscribeToChapter,
    fetchLatestVersion,
    saveVersion,
    updateChapterTitle,
    updateChapterStatus,
    createNewVersion,
    setAsCurrentVersion
} from '../lib/chapters';
import type { Chapter, Version } from '../lib/types';
import RichTextArea from '../components/editor/RichTextArea';
import BrainDumpMode from '../components/editor/BrainDumpMode';
import AssistantPanel from '../components/editor/AssistantPanel';
import VersionPanel from '../components/versions/VersionPanel';
import VersionViewer from '../components/versions/VersionViewer';
import VersionCompare from '../components/versions/VersionCompare';
import EnhancementWizard from '../components/enhancer/EnhancementWizard';
import ButterflyScanner from '../components/editor/ButterflyScanner';
import ButterflySuggestionEngine from '../components/editor/ButterflySuggestionEngine';
import ButterflyCompletionCheck from '../components/chapters/ButterflyCompletionCheck';

const ChapterEditor = () => {
    const { id } = useParams<{ id: string }>();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [chapter, setChapter] = useState<Chapter | null>(null);
    const [content, setContent] = useState('');
    const [mode, setMode] = useState<'structured' | 'braindump'>('structured');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [wordCount, setWordCount] = useState(0);

    // Version Control State
    const [showVersionPanel, setShowVersionPanel] = useState(false);
    const [viewingVersion, setViewingVersion] = useState<Version | null>(null);
    const [compareVersions, setCompareVersions] = useState<[Version, Version] | null>(null);
    const [showEnhancer, setShowEnhancer] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [showSuggestionEngine, setShowSuggestionEngine] = useState(false);
    const [showCompletionCheck, setShowCompletionCheck] = useState(false);

    useEffect(() => {
        if (!id) return;

        const unsubscribe = subscribeToChapter(id, (data) => {
            setChapter(data);
        });

        fetchLatestVersion(id).then((v) => {
            if (v) {
                setContent(v.content);
                calculateWordCount(v.content);
            }
        });

        return unsubscribe;
    }, [id]);

    const calculateWordCount = (text: string) => {
        const cleanText = text.replace(/<[^>]*>/g, ' ');
        const words = cleanText.trim().split(/\s+/).filter(w => w.length > 0);
        setWordCount(words.length);
    };

    const handleSave = useCallback(async (isAuto = false) => {
        if (!id || !currentUser || !content) return;

        setIsSaving(true);
        try {
            await saveVersion(id, currentUser.uid, content, wordCount);
            setLastSaved(new Date());
            if (isAuto) console.log('Auto-saved at', new Date().toLocaleTimeString());
        } catch (error) {
            console.error('Error saving chapter:', error);
        } finally {
            setIsSaving(false);
        }
    }, [id, currentUser, content, wordCount]);

    const handleSaveAsNew = async () => {
        if (!id || !currentUser || !content) return;
        setIsSaving(true);
        try {
            await createNewVersion(id, currentUser.uid, content, wordCount, 'edited');
            setLastSaved(new Date());
            setShowVersionPanel(true);
        } catch (error) {
            console.error('Error saving new version:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Auto-save every 30 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            handleSave(true);
        }, 30000);
        return () => clearInterval(timer);
    }, [handleSave]);

    const handleBrainDumpComplete = async (processedContent: string) => {
        setContent(processedContent);
        calculateWordCount(processedContent);
        setMode('structured');
        // Save as a new version automatically
        if (id && currentUser) {
            await saveVersion(id, currentUser.uid, processedContent, wordCount, true);
        }
    };

    if (!chapter) return <div className="loading">Loading your story...</div>;

    return (
        <div className="editor-page">
            <header className="editor-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="back-btn" onClick={() => navigate('/')}>
                        <ChevronLeft size={24} />
                    </button>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)' }}>CHAPTER {chapter.chapterNumber}</span>
                            <select
                                value={chapter.status}
                                onChange={(e) => {
                                    const nextStatus = e.target.value as Chapter['status'];
                                    if (nextStatus === 'complete' && chapter.butterflyStage !== 'butterfly') {
                                        setShowCompletionCheck(true);
                                    } else {
                                        updateChapterStatus(chapter.id, nextStatus);
                                    }
                                }}
                                className={`status-select status-${chapter.status}`}
                            >
                                <option value="draft">Draft</option>
                                <option value="in-progress">In Progress</option>
                                <option value="review">Review</option>
                                <option value="complete">Complete</option>
                            </select>
                        </div>
                        <input
                            className="chapter-title-input"
                            value={chapter.title}
                            onChange={(e) => updateChapterTitle(chapter.id, e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div className="mode-toggle">
                        <button
                            className={mode === 'structured' ? 'active' : ''}
                            onClick={() => setMode('structured')}
                        >
                            <Type size={18} /> Structured
                        </button>
                        <button
                            className={mode === 'braindump' ? 'active' : ''}
                            onClick={() => setMode('braindump')}
                        >
                            <Brain size={18} /> Brain Dump
                        </button>
                    </div>

                    <div className="save-status">
                        {isSaving ? (
                            <span style={{ color: '#666', fontSize: '0.8rem' }}>Saving...</span>
                        ) : lastSaved ? (
                            <span style={{ color: '#999', fontSize: '0.8rem' }}>Saved at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        ) : null}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className="btn"
                            onClick={() => setShowVersionPanel(!showVersionPanel)}
                            title="History"
                            style={{ background: showVersionPanel ? 'var(--color-hover)' : 'transparent', color: 'var(--color-primary)' }}
                        >
                            <History size={18} />
                        </button>
                        <button className="btn" onClick={handleSaveAsNew} title="Save as New Version">
                            <Plus size={18} /> New
                        </button>
                        <button className="btn btn-primary" onClick={() => handleSave()}>
                            <Save size={18} /> Save
                        </button>
                    </div>
                </div>
            </header>

            <main className="editor-main">
                <div className="writing-area">
                    {mode === 'structured' ? (
                        <div className="structured-editor">
                            <RichTextArea
                                content={content}
                                onChange={(val) => {
                                    setContent(val);
                                    calculateWordCount(val);
                                }}
                            />
                            <footer className="editor-footer">
                                <span>{wordCount} words</span>
                                <span>{chapter.chapterNumber === 1 ? 'Beginning' : 'Continuing'} the journey</span>
                            </footer>
                        </div>
                    ) : (
                        <BrainDumpMode onComplete={handleBrainDumpComplete} />
                    )}
                </div>

                <aside className="editor-aside">
                    {showVersionPanel ? (
                        <VersionPanel
                            chapterId={id!}
                            onClose={() => setShowVersionPanel(false)}
                            onViewVersion={(v) => setViewingVersion(v)}
                            onEditVersion={(v) => {
                                if (window.confirm('This will replace your current editor content. Continue?')) {
                                    setContent(v.content);
                                    calculateWordCount(v.content);
                                }
                            }}
                            onCompareVersions={(v1, v2) => setCompareVersions([v1, v2])}
                        />
                    ) : (
                        <AssistantPanel
                            chapterContent={content}
                            onAction={(type) => {
                                if (type === 'library') navigate('/library');
                                if (type === 'visuals') navigate('/studio');
                                if (type === 'enhance') setShowEnhancer(true);
                                if (type === 'check') setShowScanner(true);
                            }}
                        />
                    )}
                </aside>
            </main>

            <VersionViewer
                version={viewingVersion}
                onClose={() => setViewingVersion(null)}
                onEdit={(v) => {
                    setContent(v.content);
                    calculateWordCount(v.content);
                }}
                onSetCurrent={(v) => setAsCurrentVersion(chapter.id, v.id)}
            />

            {compareVersions && (
                <VersionCompare
                    v1={compareVersions[0]}
                    v2={compareVersions[1]}
                    onClose={() => setCompareVersions(null)}
                />
            )}

            <EnhancementWizard
                isOpen={showEnhancer}
                onClose={() => setShowEnhancer(false)}
                initialChapter={chapter}
                initialVersion={null} // Wizard will fetch current
            />

            <ButterflyScanner
                isOpen={showScanner}
                onClose={() => setShowScanner(false)}
                content={content}
                onSuggestAnalogy={() => {
                    setShowScanner(false);
                    setShowSuggestionEngine(true);
                }}
            />

            <ButterflySuggestionEngine
                isOpen={showSuggestionEngine}
                onClose={() => setShowSuggestionEngine(false)}
                chapter={chapter}
                content={content}
                onAnalogyInserted={(newContent) => setContent(newContent)}
            />

            <ButterflyCompletionCheck
                isOpen={showCompletionCheck}
                onClose={() => setShowCompletionCheck(false)}
                onRunSuggestions={() => setShowSuggestionEngine(true)}
                onOverride={() => {
                    updateChapterStatus(chapter.id, 'complete');
                    setShowCompletionCheck(false);
                }}
            />
        </div>
    );
};

export default ChapterEditor;

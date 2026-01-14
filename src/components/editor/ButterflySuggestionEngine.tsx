
import { useState, useEffect } from 'react';
import { X, Sparkles, Check, Play } from 'lucide-react';
import { generateButterflySuggestions } from '../../lib/gemini';
import { subscribeToLibrary } from '../../lib/library';
import { useAuth } from '../../contexts/AuthContext';
import type { WisdomVideo, ButterflySuggestion, Chapter } from '../../lib/types';
import { updateButterflyAnalogy } from '../../lib/chapters';

interface ButterflySuggestionEngineProps {
    isOpen: boolean;
    onClose: () => void;
    chapter: Chapter;
    content: string;
    onAnalogyInserted: (newContent: string) => void;
}

const ButterflySuggestionEngine = ({ isOpen, onClose, chapter, content, onAnalogyInserted }: ButterflySuggestionEngineProps) => {
    const { currentUser } = useAuth();
    const [isGenerating, setIsGenerating] = useState(false);
    const [suggestions, setSuggestions] = useState<ButterflySuggestion[]>([]);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [libraryItems, setLibraryItems] = useState<WisdomVideo[]>([]);
    const [editedPreview, setEditedPreview] = useState('');

    useEffect(() => {
        if (!currentUser) return;
        return subscribeToLibrary(currentUser.uid, (videos) => {
            const butterflyVideos = videos.filter(v => v.butterflyReferences?.length > 0);
            setLibraryItems(butterflyVideos);
        });
    }, [currentUser]);

    useEffect(() => {
        if (isOpen && content && libraryItems.length > 0) {
            handleGenerate();
        }
    }, [isOpen, libraryItems.length]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const data = await generateButterflySuggestions(content, libraryItems);
            setSuggestions(data);
            if (data.length > 0) setEditedPreview(data[0].preview);
        } catch (error) {
            console.error('Generation error:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSelect = (idx: number) => {
        setSelectedIdx(idx);
        setEditedPreview(suggestions[idx].preview);
    };

    const handleAccept = async () => {
        // In a real app, we'd use Gemini to figure out WHERE to insert.
        // For this prompt, we'll append it or replace a part if we had a more complex editor.
        // Let's just append for now but label it.
        const newContent = content + "\n\n" + editedPreview;
        onAnalogyInserted(newContent);
        await updateButterflyAnalogy(chapter.id, editedPreview, 'butterfly');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
            <div className="modal-content" style={{ maxWidth: '800px', width: '90%', padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: 'var(--color-primary)', color: 'white', padding: '0.4rem', borderRadius: '0.5rem' }}>
                            <Sparkles size={20} />
                        </div>
                        <h3 className="text-serif" style={{ margin: 0 }}>Butterfly Suggestion Engine</h3>
                    </div>
                    <button onClick={onClose} className="btn-icon"><X size={24} /></button>
                </div>

                <div style={{ display: 'flex', height: '500px' }}>
                    {/* Left: Suggestions List */}
                    <div style={{ flex: 1, borderRight: '1px solid #eee', overflowY: 'auto', background: '#fcfcfc' }}>
                        {isGenerating ? (
                            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                                <div className="metamorphosis-spinner" style={{ margin: '0 auto 1.5rem auto' }} />
                                <p style={{ fontSize: '0.8rem', color: '#999' }}>Matching wisdom to your story...</p>
                            </div>
                        ) : (
                            suggestions.map((s, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleSelect(idx)}
                                    style={{
                                        padding: '1.5rem',
                                        borderBottom: '1px solid #eee',
                                        cursor: 'pointer',
                                        background: selectedIdx === idx ? 'white' : 'transparent',
                                        borderLeft: selectedIdx === idx ? '4px solid var(--color-primary)' : '4px solid transparent',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#999', fontWeight: 700, marginBottom: '0.5rem' }}>{s.author}'s Perspective</div>
                                    <h4 style={{ fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>{s.concept}</h4>
                                    <p style={{ fontSize: '0.8rem', color: '#666', margin: 0, lineHeight: 1.4 }}>{s.application}</p>
                                </div>
                            ))
                        )}
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            style={{ width: '100%', padding: '1rem', background: 'transparent', color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                        >
                            {isGenerating ? 'Generatinig...' : '+ Generate More Suggestions'}
                        </button>
                    </div>

                    {/* Right: Preview & Edit */}
                    <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                            {suggestions[selectedIdx] && (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', padding: '0.75rem', background: 'var(--color-hover)', borderRadius: '0.75rem' }}>
                                        <Play size={14} style={{ color: 'var(--color-primary)' }} />
                                        <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>Source: {suggestions[selectedIdx].videoTitle}</div>
                                    </div>

                                    <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#999', marginBottom: '1rem' }}>Draft Analogy:</h4>
                                    <textarea
                                        value={editedPreview}
                                        onChange={(e) => setEditedPreview(e.target.value)}
                                        style={{
                                            width: '100%',
                                            height: '200px',
                                            border: '1px solid #eee',
                                            borderRadius: '1rem',
                                            padding: '1rem',
                                            fontSize: '1rem',
                                            fontFamily: 'var(--font-body)',
                                            lineHeight: 1.6,
                                            resize: 'none'
                                        }}
                                    />
                                </>
                            )}
                        </div>

                        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid #eee', display: 'flex', gap: '1rem' }}>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                                onClick={handleAccept}
                                disabled={!editedPreview || isGenerating}
                            >
                                <Check size={18} /> Accept & Insert Analogy
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ButterflySuggestionEngine;

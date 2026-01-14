
import { useState } from 'react';
import { Sparkles, Copy, Save, Trash2, Wand2, Loader2 } from 'lucide-react';
import { generateTikTokScript } from '../../lib/gemini';
import { saveTikTokScript } from '../../lib/tiktok';
import { useAuth } from '../../contexts/AuthContext';
import type { Chapter } from '../../lib/types';

interface TikTokScriptGeneratorProps {
    chapters: Chapter[];
    onScriptSaved?: () => void;
}

const TikTokScriptGenerator = ({ chapters, onScriptSaved }: TikTokScriptGeneratorProps) => {
    const { currentUser } = useAuth();
    const [selectedChapterId, setSelectedChapterId] = useState('');
    const [duration, setDuration] = useState<'15s' | '30s' | '60s'>('30s');
    const [style, setStyle] = useState<'snippet' | 'lesson' | 'butterfly' | 'wisdom'>('lesson');

    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [generatedScript, setGeneratedScript] = useState<any>(null);
    const [editMode, setEditMode] = useState(false);
    const [editedContent, setEditedContent] = useState('');

    const handleGenerate = async () => {
        const chapter = chapters.find(c => c.id === selectedChapterId);
        if (!chapter) return;

        setIsGenerating(true);
        try {
            const result = await generateTikTokScript(chapter.title, "Mock content for script generation.", duration, style);
            setGeneratedScript(result);
            setEditedContent(result.content);
        } catch (error) {
            console.error('Script generation error:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!currentUser || !generatedScript || !selectedChapterId) return;
        const chapter = chapters.find(c => c.id === selectedChapterId);
        if (!chapter) return;

        setIsSaving(true);
        try {
            await saveTikTokScript({
                userId: currentUser.uid,
                chapterId: selectedChapterId,
                chapterTitle: chapter.title,
                content: editedContent || generatedScript.content,
                duration,
                style,
                hooks: generatedScript.hooks,
                hashtags: generatedScript.hashtags
            });
            alert('TikTok script saved to library!');
            if (onScriptSaved) onScriptSaved();
        } catch (error) {
            console.error('Save script error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(editedContent || generatedScript?.content);
        alert('Script copied to clipboard!');
    };

    return (
        <div className="card" style={{ padding: '2rem' }}>
            <h3 className="text-serif" style={{ marginBottom: '1.5rem' }}>TikTok Script Generator</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#666' }}>SELECT CHAPTER</label>
                    <select
                        className="status-select"
                        style={{ width: '100%' }}
                        value={selectedChapterId}
                        onChange={(e) => setSelectedChapterId(e.target.value)}
                    >
                        <option value="">Choose a chapter...</option>
                        {chapters.map(c => <option key={c.id} value={c.id}>Chapter {c.chapterNumber}: {c.title}</option>)}
                    </select>

                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#666' }}>DURATION</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['15s', '30s', '60s'].map(d => (
                            <button
                                key={d}
                                className={`btn ${duration === d ? 'btn-primary' : ''}`}
                                style={{ flex: 1, padding: '0.5rem', background: duration === d ? undefined : 'white' }}
                                onClick={() => setDuration(d as any)}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#666' }}>SCRIPT STYLE</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        {[
                            { id: 'snippet', label: 'Story Snippet', icon: '📖' },
                            { id: 'lesson', label: 'Lesson Learned', icon: '💡' },
                            { id: 'butterfly', label: 'Butterfly Moment', icon: '🦋' },
                            { id: 'wisdom', label: 'Author Wisdom', icon: '✨' }
                        ].map(s => (
                            <button
                                key={s.id}
                                className={`btn ${style === s.id ? 'btn-primary' : ''}`}
                                style={{ padding: '0.75rem', fontSize: '0.8rem', background: style === s.id ? undefined : 'white', justifyContent: 'flex-start' }}
                                onClick={() => setStyle(s.id as any)}
                            >
                                <span style={{ marginRight: '0.5rem' }}>{s.icon}</span> {s.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '1rem', gap: '0.5rem' }}
                disabled={!selectedChapterId || isGenerating}
                onClick={handleGenerate}
            >
                {isGenerating ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> Generate Viral Script</>}
            </button>

            {generatedScript && (
                <div className="animate-fade-in" style={{ marginTop: '3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ margin: 0 }}>Generated Script</h4>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-icon" onClick={() => setEditMode(!editMode)} title="Edit Script"><Wand2 size={16} /></button>
                            <button className="btn btn-icon" onClick={copyToClipboard} title="Copy Script"><Copy size={16} /></button>
                        </div>
                    </div>

                    {editMode ? (
                        <textarea
                            className="text-input"
                            style={{ width: '100%', minHeight: '300px', padding: '1.5rem', fontFamily: 'monospace', lineHeight: 1.6 }}
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                        />
                    ) : (
                        <div style={{
                            background: '#f9f9f9',
                            padding: '2rem',
                            borderRadius: '1rem',
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'monospace',
                            lineHeight: 1.8,
                            fontSize: '0.95rem',
                            borderLeft: '4px solid var(--color-primary)'
                        }}>
                            {editedContent.split('\n').map((line, i) => {
                                if (line.startsWith('[HOOK]') || line.startsWith('[STORY]') || line.startsWith('[LESSON]')) {
                                    return <div key={i} style={{ color: 'var(--color-primary)', fontWeight: 800, marginTop: '1rem' }}>{line}</div>;
                                }
                                return <div key={i}>{line.replace('[PAUSE]', '⏱️ [PAUSE]').replace('[EMPHASIS]', '🔥 [EMPHASIS]')}</div>;
                            })}
                        </div>
                    )}

                    <div style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {generatedScript.hashtags.map((tag: string) => (
                            <span key={tag} style={{ padding: '0.3rem 0.8rem', background: 'rgba(107, 73, 132, 0.1)', color: 'var(--color-primary)', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                                {tag}
                            </span>
                        ))}
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-primary" style={{ flex: 1, padding: '1rem' }} onClick={handleSave} disabled={isSaving}>
                            <Save size={18} /> Save to Script Library
                        </button>
                        <button className="btn" style={{ flex: 1, background: 'white' }} onClick={() => setGeneratedScript(null)}>
                            <Trash2 size={18} /> Discard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TikTokScriptGenerator;

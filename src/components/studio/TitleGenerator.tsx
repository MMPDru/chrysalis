
import { useState } from 'react';
import { Sparkles, RefreshCcw, Check, Plus, Loader2 } from 'lucide-react';
import { generateChapterTitles } from '../../lib/gemini';
import { updateChapterTitle } from '../../lib/chapters';

interface TitleGeneratorProps {
    chapterId: string;
    chapterContent: string;
    currentTitle: string;
    onTitleSelected: (title: string) => void;
}

const TitleGenerator = ({ chapterId, chapterContent, currentTitle, onTitleSelected }: TitleGeneratorProps) => {
    const [titles, setTitles] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [customTitle, setCustomTitle] = useState('');
    const [showCustom, setShowCustom] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const suggestions = await generateChapterTitles(chapterContent);
            setTitles(suggestions);
        } catch (error) {
            console.error('Error generating titles:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSelect = async (title: string) => {
        try {
            await updateChapterTitle(chapterId, title);
            onTitleSelected(title);
        } catch (error) {
            console.error('Error updating title:', error);
        }
    };

    return (
        <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 className="text-serif" style={{ margin: 0, fontSize: '1.2rem' }}>Chapter Title Generator</h3>
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="btn"
                    style={{ fontSize: '0.8rem', gap: '0.4rem' }}
                >
                    {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {titles.length > 0 ? 'Reshuffle' : 'Suggest Titles'}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {titles.map((title, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleSelect(title)}
                        className="btn animate-fade-in"
                        style={{
                            background: title === currentTitle ? 'var(--color-primary)' : 'white',
                            color: title === currentTitle ? 'white' : '#444',
                            border: '1px solid #eee',
                            textAlign: 'left',
                            padding: '1rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            height: 'auto',
                            minHeight: '60px'
                        }}
                    >
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{title}</span>
                        {title === currentTitle && <Check size={16} />}
                    </button>
                ))}
            </div>

            {titles.length > 0 && (
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                    {!showCustom ? (
                        <button
                            className="btn"
                            style={{ background: 'transparent', color: '#999', fontSize: '0.8rem', padding: 0 }}
                            onClick={() => setShowCustom(true)}
                        >
                            <Plus size={14} /> Custom Title
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                className="text-input"
                                value={customTitle}
                                onChange={(e) => setCustomTitle(e.target.value)}
                                placeholder="Enter your own title..."
                                style={{ flex: 1 }}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    if (customTitle) handleSelect(customTitle);
                                    setShowCustom(false);
                                }}
                            >
                                Use
                            </button>
                            <button className="btn" onClick={() => setShowCustom(false)}>Cancel</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TitleGenerator;

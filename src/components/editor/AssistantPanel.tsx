import { useState } from 'react';
import {
    Sparkles,
    BookOpen,
    Image as ImageIcon,
    Zap,
    RefreshCcw,
    ChevronRight,
    MessageCircle,
    Wand2
} from 'lucide-react';
import { generateWritingPrompts } from '../../lib/gemini';
import SmartSearchSuggestions from '../library/SmartSearchSuggestions';

interface AssistantPanelProps {
    chapterContent: string;
    onAction: (type: 'library' | 'visuals' | 'check' | 'enhance') => void;
}

const AssistantPanel = ({ chapterContent, onAction }: AssistantPanelProps) => {
    const [prompts, setPrompts] = useState<string[]>([
        "What lesson did this teach you?",
        "How did this experience change you?",
        "What would you tell your past self?"
    ]);
    const [isLoading, setIsLoading] = useState(false);

    const handleRefreshPrompts = async () => {
        if (!chapterContent) return;
        setIsLoading(true);
        try {
            const newPrompts = await generateWritingPrompts(chapterContent.substring(0, 2000));
            setPrompts(newPrompts);
        } catch (error) {
            console.error('Error generating prompts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="assistant-panel" style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <div style={{
                    padding: '0.5rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                    color: 'white'
                }}>
                    <Sparkles size={20} />
                </div>
                <h3 className="text-serif" style={{ fontSize: '1.25rem', margin: 0 }}>Story Assistant</h3>
            </div>

            <div className="assistant-section" style={{ marginBottom: '3rem' }}>
                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', marginBottom: '1rem' }}>Quick Actions</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button className="assistant-action-btn" onClick={() => onAction('library')}>
                        <BookOpen size={18} />
                        <span>Find Wisdom</span>
                        <ChevronRight size={14} className="arrow" />
                    </button>
                    <button className="assistant-action-btn" onClick={() => onAction('enhance')} style={{ border: '1px solid var(--color-primary-light)', background: 'rgba(107, 73, 132, 0.03)' }}>
                        <Wand2 size={18} color="var(--color-primary)" />
                        <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Enhance with Wisdom</span>
                        <ChevronRight size={14} className="arrow" />
                    </button>
                    <button className="assistant-action-btn" onClick={() => onAction('visuals')}>
                        <ImageIcon size={18} />
                        <span>Generate Image</span>
                        <ChevronRight size={14} className="arrow" />
                    </button>
                    <button className="assistant-action-btn" onClick={() => onAction('check')}>
                        <Zap size={18} />
                        <span>Butterfly Check</span>
                        <ChevronRight size={14} className="arrow" />
                    </button>
                </div>
            </div>

            <div className="assistant-section" style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', margin: 0 }}>Writing Prompts</h4>
                    <button
                        onClick={handleRefreshPrompts}
                        disabled={isLoading}
                        style={{ background: 'transparent', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}
                    >
                        <RefreshCcw size={12} className={isLoading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {prompts.map((prompt: string, index: number) => (
                        <div
                            key={index}
                            style={{
                                padding: '1rem',
                                background: 'white',
                                borderLeft: '3px solid var(--color-secondary)',
                                borderRadius: '0.5rem',
                                fontSize: '0.9rem',
                                color: '#444',
                                boxShadow: 'var(--shadow-soft)',
                                display: 'flex',
                                gap: '0.75rem'
                            }}
                        >
                            <MessageCircle size={16} style={{ color: 'var(--color-secondary)', flexShrink: 0, marginTop: '2px' }} />
                            {prompt}
                        </div>
                    ))}
                </div>
            </div>

            <SmartSearchSuggestions chapterContent={chapterContent} />

            <div style={{
                marginTop: 'auto',
                padding: '1rem',
                background: 'rgba(107, 73, 132, 0.05)',
                borderRadius: '0.75rem',
                fontSize: '0.8rem',
                color: '#666',
                fontStyle: 'italic',
                textAlign: 'center'
            }}>
                "Your story is the chrysalis of your future self."
            </div>
        </div>
    );
};

export default AssistantPanel;


import { useState, useEffect } from 'react';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { generateSearchSuggestions } from '../../lib/gemini';
import { useNavigate } from 'react-router-dom';

interface SmartSearchSuggestionsProps {
    chapterContent: string;
}

const SmartSearchSuggestions = ({ chapterContent }: SmartSearchSuggestionsProps) => {
    const navigate = useNavigate();
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!chapterContent || chapterContent.length < 100) return;

        const fetchSuggestions = async () => {
            setIsLoading(true);
            try {
                const data = await generateSearchSuggestions(chapterContent.substring(0, 2000));
                setSuggestions(data);
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(fetchSuggestions, 2000);
        return () => clearTimeout(timer);
    }, [chapterContent]);

    const handleSuggestClick = (query: string) => {
        navigate('/library', { state: { query } });
    };

    if (isLoading) {
        return (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#999', fontSize: '0.85rem' }}>
                <Loader2 size={16} className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
                Finding wisdom paths...
            </div>
        );
    }

    if (suggestions.length === 0) return null;

    return (
        <div className="smart-search-box" style={{ marginTop: '2rem' }}>
            <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#888', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={14} color="var(--color-primary)" /> Suggested Wisdom
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {suggestions.map((query, idx) => (
                    <button
                        key={idx}
                        className="suggestion-btn"
                        onClick={() => handleSuggestClick(query)}
                        style={{
                            textAlign: 'left',
                            padding: '0.75rem 1rem',
                            background: 'white',
                            border: '1px solid #eee',
                            borderRadius: '0.75rem',
                            fontSize: '0.85rem',
                            color: '#444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.3s'
                        }}
                    >
                        <span>{query}</span>
                        <ArrowRight size={14} className="arrow" />
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SmartSearchSuggestions;

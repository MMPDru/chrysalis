import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface AuthorSelectorProps {
    selectedAuthors: string[];
    customAuthors: string[];
    onAuthorsChange: (authors: string[]) => void;
    onCustomAuthorsChange: (authors: string[]) => void;
}

const DEFAULT_AUTHORS = ['Carl Jung', 'Michael Singer', 'Alan Watts', 'Eckhart Tolle', 'Ram Dass', 'Thich Nhat Hanh'];

const AuthorSelector = ({ selectedAuthors, customAuthors, onAuthorsChange, onCustomAuthorsChange }: AuthorSelectorProps) => {
    const [newAuthor, setNewAuthor] = useState('');

    const toggleAuthor = (author: string) => {
        if (selectedAuthors.includes(author)) {
            onAuthorsChange(selectedAuthors.filter(a => a !== author));
        } else {
            onAuthorsChange([...selectedAuthors, author]);
        }
    };

    const addCustomAuthor = () => {
        if (newAuthor.trim() && !customAuthors.includes(newAuthor.trim())) {
            const trimmedAuthor = newAuthor.trim();
            onCustomAuthorsChange([...customAuthors, trimmedAuthor]);
            onAuthorsChange([...selectedAuthors, trimmedAuthor]);
            setNewAuthor('');
        }
    };

    const removeCustomAuthor = (author: string) => {
        onCustomAuthorsChange(customAuthors.filter(a => a !== author));
        onAuthorsChange(selectedAuthors.filter(a => a !== author));
    };

    const allAuthors = [...DEFAULT_AUTHORS, ...customAuthors];

    return (
        <div>
            <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
                    Select authors whose wisdom resonates with you:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {allAuthors.map(author => {
                        const isCustom = customAuthors.includes(author);
                        const isSelected = selectedAuthors.includes(author);

                        return (
                            <div
                                key={author}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '9999px',
                                    background: isSelected ? 'var(--color-primary)' : 'white',
                                    color: isSelected ? 'white' : 'var(--color-text)',
                                    border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-subtle-border)'}`,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    fontSize: '0.875rem',
                                    fontWeight: 500
                                }}
                                onClick={() => toggleAuthor(author)}
                            >
                                {author}
                                {isCustom && isSelected && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeCustomAuthor(author);
                                        }}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            padding: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            color: 'inherit'
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomAuthor()}
                    placeholder="Add custom author..."
                    style={{
                        flex: 1,
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--color-subtle-border)',
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.875rem'
                    }}
                />
                <button
                    onClick={addCustomAuthor}
                    style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        background: 'var(--color-tertiary)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 500,
                        fontSize: '0.875rem'
                    }}
                >
                    <Plus size={16} />
                    Add
                </button>
            </div>
        </div>
    );
};

export default AuthorSelector;

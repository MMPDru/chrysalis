import { useState } from 'react';
import { X, Feather } from 'lucide-react';

interface CreateChapterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (chapterNumber: number, title: string) => void;
    nextChapterNumber: number;
}

const CreateChapterModal = ({ isOpen, onClose, onSubmit, nextChapterNumber }: CreateChapterModalProps) => {
    const [title, setTitle] = useState('');
    const [chapterNumber, setChapterNumber] = useState(nextChapterNumber);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(chapterNumber, title || 'Untitled Chapter');
        setTitle('');
        setChapterNumber(nextChapterNumber + 1);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>Begin a New Chapter</h2>
                    <button onClick={onClose} style={{ background: 'transparent', color: '#666' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Chapter Number</label>
                        <input
                            type="number"
                            value={chapterNumber}
                            onChange={e => setChapterNumber(parseInt(e.target.value))}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Working Title (Optional)</label>
                        <input
                            type="text"
                            placeholder="e.g., The Chrysalis Begins"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button type="button" className="btn" style={{ flex: 1, background: '#f0f0f0' }} onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                            <Feather size={18} />
                            Begin Writing
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateChapterModal;

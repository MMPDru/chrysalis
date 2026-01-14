import { MoreVertical, Eye, Edit, CheckCircle, Archive, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface VersionActionsProps {
    onView: () => void;
    onEdit: () => void;
    onSetCurrent: () => void;
    onArchive: () => void;
    onDelete: () => void;
    isCurrent: boolean;
    isArchived: boolean;
}

const VersionActions = ({
    onView,
    onEdit,
    onSetCurrent,
    onArchive,
    onDelete,
    isCurrent,
    isArchived
}: VersionActionsProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div style={{ position: 'relative' }} ref={menuRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="btn-icon"
                style={{ padding: '0.25rem', borderRadius: '50%', background: 'transparent' }}
            >
                <MoreVertical size={18} color="#666" />
            </button>

            {isOpen && (
                <div className="dropdown-menu" style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    zIndex: 1000,
                    background: 'white',
                    boxShadow: 'var(--shadow-card)',
                    borderRadius: '0.75rem',
                    padding: '0.5rem',
                    minWidth: '180px',
                    border: '1px solid #eee'
                }}>
                    <button className="dropdown-item" onClick={() => { onView(); setIsOpen(false); }}>
                        <Eye size={16} /> View Full Text
                    </button>
                    <button className="dropdown-item" onClick={() => { onEdit(); setIsOpen(false); }}>
                        <Edit size={16} /> Edit This Version
                    </button>
                    {!isCurrent && (
                        <button className="dropdown-item" onClick={() => { onSetCurrent(); setIsOpen(false); }}>
                            <CheckCircle size={16} color="var(--color-tertiary)" /> Set as Current
                        </button>
                    )}
                    <button className="dropdown-item" onClick={() => { onArchive(); setIsOpen(false); }}>
                        <Archive size={16} /> {isArchived ? 'Unarchive' : 'Archive'}
                    </button>
                    {!isCurrent && (
                        <button className="dropdown-item delete" onClick={() => { onDelete(); setIsOpen(false); }} style={{ color: '#d9534f' }}>
                            <Trash2 size={16} /> Delete Version
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default VersionActions;

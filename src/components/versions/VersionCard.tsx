import { format } from 'date-fns';
import { FileText, Clock, Hash, CheckCircle2 } from 'lucide-react';
import type { Version } from '../../lib/types';
import VersionActions from './VersionActions';

interface VersionCardProps {
    version: Version;
    onView: (v: Version) => void;
    onEdit: (v: Version) => void;
    onSetCurrent: (v: Version) => void;
    onArchive: (v: Version) => void;
    onDelete: (v: Version) => void;
    onSelectForCompare: (v: Version) => void;
    isSelectedForCompare: boolean;
}

const VersionCard = ({
    version,
    onView,
    onEdit,
    onSetCurrent,
    onArchive,
    onDelete,
    onSelectForCompare,
    isSelectedForCompare
}: VersionCardProps) => {
    const typeLabel = {
        original: 'Original',
        braindump: 'Brain Dump',
        jung: 'Jung Enhanced',
        singer: 'Singer Enhanced',
        watts: 'Watts Enhanced',
        custom: 'Custom Enhanced',
        edited: 'Edited'
    }[version.type];

    const typeColor = {
        original: '#9CA3AF',
        braindump: 'var(--color-tertiary)',
        jung: 'var(--color-primary)',
        singer: 'var(--color-secondary)',
        watts: 'var(--color-accent)',
        custom: '#8B5CF6',
        edited: '#3B82F6'
    }[version.type];

    return (
        <div
            className={`card version-card ${version.isCurrent ? 'current' : ''}`}
            style={{
                padding: '1rem',
                marginBottom: '1rem',
                border: isSelectedForCompare ? '2px solid var(--color-primary)' : '1px solid #eee',
                background: version.isArchived ? '#f9f9f9' : 'white',
                opacity: version.isArchived ? 0.7 : 1,
                cursor: 'default'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        background: typeColor,
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                    }}>
                        {typeLabel}
                    </div>
                    {version.isCurrent && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-tertiary)', fontSize: '0.75rem', fontWeight: 600 }}>
                            <CheckCircle2 size={14} /> Current
                        </div>
                    )}
                </div>
                <VersionActions
                    onView={() => onView(version)}
                    onEdit={() => onEdit(version)}
                    onSetCurrent={() => onSetCurrent(version)}
                    onArchive={() => onArchive(version)}
                    onDelete={() => onDelete(version)}
                    isCurrent={version.isCurrent}
                    isArchived={version.isArchived}
                />
            </div>

            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Hash size={16} color="#999" /> Version {version.versionNumber}
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', color: '#666', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={14} />
                    {format(version.createdAt.toDate(), 'MMM d, h:mm a')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={14} />
                    {version.wordCount} words
                </div>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button
                    className={`btn ${isSelectedForCompare ? 'btn-primary' : ''}`}
                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', flex: 1 }}
                    onClick={() => onSelectForCompare(version)}
                >
                    {isSelectedForCompare ? 'Selected' : 'Compare'}
                </button>
                <button
                    className="btn"
                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', flex: 1, background: '#f5f5f5' }}
                    onClick={() => onView(version)}
                >
                    Quick View
                </button>
            </div>
        </div>
    );
};

export default VersionCard;

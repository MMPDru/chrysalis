import { useState, useEffect } from 'react';
import { Layers, Archive, History, X, GitCompare } from 'lucide-react';
import type { Version } from '../../lib/types';
import { subscribeToVersions, setAsCurrentVersion, archiveVersion, deleteVersion } from '../../lib/chapters';
import VersionCard from './VersionCard';
import { motion, AnimatePresence } from 'framer-motion';

interface VersionPanelProps {
    chapterId: string;
    onClose: () => void;
    onViewVersion: (v: Version) => void;
    onEditVersion: (v: Version) => void;
    onCompareVersions: (v1: Version, v2: Version) => void;
}

const VersionPanel = ({
    chapterId,
    onClose,
    onViewVersion,
    onEditVersion,
    onCompareVersions
}: VersionPanelProps) => {
    const [versions, setVersions] = useState<Version[]>([]);
    const [showArchived, setShowArchived] = useState(false);
    const [selectedForCompare, setSelectedForCompare] = useState<Version[]>([]);

    useEffect(() => {
        return subscribeToVersions(chapterId, (data) => {
            setVersions(data);
        });
    }, [chapterId]);

    const filteredVersions = versions.filter(v => showArchived ? true : !v.isArchived);

    const handleSelectForCompare = (v: Version) => {
        if (selectedForCompare.find(item => item.id === v.id)) {
            setSelectedForCompare(selectedForCompare.filter(item => item.id !== v.id));
        } else {
            if (selectedForCompare.length < 2) {
                setSelectedForCompare([...selectedForCompare, v]);
            } else {
                setSelectedForCompare([selectedForCompare[1], v]);
            }
        }
    };

    return (
        <div className="version-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ color: 'var(--color-primary)' }}><History size={24} /></div>
                    <h3 className="text-serif" style={{ margin: 0, fontSize: '1.25rem' }}>Lifecycle History</h3>
                </div>
                <button onClick={onClose} className="btn-icon"><X size={20} /></button>
            </div>

            <div style={{ padding: '1rem', background: '#fcfcfc', borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div className="archive-toggle" onClick={() => setShowArchived(!showArchived)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                        <Archive size={16} color={showArchived ? 'var(--color-primary)' : '#999'} />
                        <span>Show Archived</span>
                        <div style={{
                            width: '32px',
                            height: '18px',
                            background: showArchived ? 'var(--color-primary)' : '#E5E7EB',
                            borderRadius: '9px',
                            position: 'relative',
                            transition: 'background 0.3s'
                        }}>
                            <div style={{
                                width: '14px',
                                height: '14px',
                                background: 'white',
                                borderRadius: '50%',
                                position: 'absolute',
                                top: '2px',
                                left: showArchived ? '16px' : '2px',
                                transition: 'left 0.3s'
                            }} />
                        </div>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#999' }}>
                        {versions.length} versions
                    </div>
                </div>

                {selectedForCompare.length > 0 && (
                    <div style={{
                        background: 'rgba(107, 73, 132, 0.05)',
                        padding: '0.75rem',
                        borderRadius: '0.75rem',
                        border: '1px dashed var(--color-primary)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                            {selectedForCompare.length === 1
                                ? 'Select another for comparison'
                                : `Compare V${selectedForCompare[0].versionNumber} & V${selectedForCompare[1].versionNumber}`}
                        </div>
                        {selectedForCompare.length === 2 && (
                            <button
                                className="btn btn-primary"
                                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                                onClick={() => onCompareVersions(selectedForCompare[0], selectedForCompare[1])}
                            >
                                <GitCompare size={14} /> Compare
                            </button>
                        )}
                        {selectedForCompare.length === 1 && (
                            <button
                                style={{ background: 'transparent', color: '#999' }}
                                onClick={() => setSelectedForCompare([])}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                <AnimatePresence initial={false}>
                    {filteredVersions.map((v) => (
                        <motion.div
                            key={v.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <VersionCard
                                version={v}
                                onView={onViewVersion}
                                onEdit={onEditVersion}
                                onSetCurrent={(v) => setAsCurrentVersion(chapterId, v.id)}
                                onArchive={(v) => archiveVersion(v.id, !v.isArchived)}
                                onDelete={(v) => {
                                    if (window.confirm('Are you sure you want to delete this version? This cannot be undone.')) {
                                        deleteVersion(v.id);
                                    }
                                }}
                                onSelectForCompare={handleSelectForCompare}
                                isSelectedForCompare={!!selectedForCompare.find(item => item.id === v.id)}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredVersions.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#999' }}>
                        <Layers size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                        <p>No versions found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VersionPanel;

import { X, Edit, CheckCircle } from 'lucide-react';
import type { Version } from '../../lib/types';

interface VersionViewerProps {
    version: Version | null;
    onClose: () => void;
    onEdit: (v: Version) => void;
    onSetCurrent: (v: Version) => void;
}

const VersionViewer = ({ version, onClose, onEdit, onSetCurrent }: VersionViewerProps) => {
    if (!version) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                            Version {version.versionNumber} • {version.type}
                        </div>
                        <h2 style={{ margin: 0 }}>Version Content</h2>
                    </div>
                    <button onClick={onClose} className="btn-icon">
                        <X size={24} />
                    </button>
                </div>

                <div
                    className="version-content-preview"
                    style={{
                        background: '#fcfcfc',
                        padding: '2rem',
                        borderRadius: '1rem',
                        maxHeight: '60vh',
                        overflowY: 'auto',
                        lineHeight: 1.8,
                        fontSize: '1.1rem',
                        border: '1px solid #eee',
                        marginBottom: '2rem'
                    }}
                    dangerouslySetInnerHTML={{ __html: version.content }}
                />

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn btn-primary"
                        style={{ flex: 1 }}
                        onClick={() => { onEdit(version); onClose(); }}
                    >
                        <Edit size={18} /> Edit This Version
                    </button>
                    {!version.isCurrent && (
                        <button
                            className="btn"
                            style={{ flex: 1, background: 'var(--color-tertiary)', color: 'white' }}
                            onClick={() => { onSetCurrent(version); onClose(); }}
                        >
                            <CheckCircle size={18} /> Set as Current
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VersionViewer;

import { X, GitCompare } from 'lucide-react';
import type { Version } from '../../lib/types';
import * as diff from 'diff';

interface VersionCompareProps {
    v1: Version | null;
    v2: Version | null;
    onClose: () => void;
}

const VersionCompare = ({ v1, v2, onClose }: VersionCompareProps) => {
    if (!v1 || !v2) return null;

    // strip html for comparison or keep it? usually better to strip for clear text diff
    const stripHtml = (html: string) => {
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    };

    const text1 = stripHtml(v1.content);
    const text2 = stripHtml(v2.content);
    const diffs = diff.diffWords(text1, text2);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '1000px', width: '95%', height: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <GitCompare size={24} color="var(--color-primary)" />
                        <h2 style={{ margin: 0 }}>Version Comparison</h2>
                        <span style={{ fontSize: '0.9rem', color: '#666' }}>
                            V{v1.versionNumber} vs V{v2.versionNumber}
                        </span>
                    </div>
                    <button onClick={onClose} className="btn-icon">
                        <X size={24} />
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '2rem', flex: 1, overflow: 'hidden' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h4 style={{ marginBottom: '0.5rem', color: '#666' }}>Version {v1.versionNumber} ({v1.type})</h4>
                        <div style={{
                            flex: 1,
                            border: '1px solid #eee',
                            borderRadius: '1rem',
                            padding: '1.5rem',
                            overflowY: 'auto',
                            background: '#f9f9f9',
                            fontSize: '0.95rem',
                            lineHeight: 1.6
                        }}>
                            <div dangerouslySetInnerHTML={{ __html: v1.content }} />
                        </div>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h4 style={{ marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Visual Diff (Merged View)</h4>
                        <div style={{
                            flex: 1,
                            border: '1px solid #eee',
                            borderRadius: '1rem',
                            padding: '1.5rem',
                            overflowY: 'auto',
                            background: 'white',
                            fontSize: '0.95rem',
                            lineHeight: 1.6
                        }}>
                            {diffs.map((part, index) => {
                                const color = part.added ? 'green' : part.removed ? 'red' : 'inherit';
                                const background = part.added ? '#e6ffec' : part.removed ? '#ffebe9' : 'transparent';
                                const decoration = part.removed ? 'line-through' : 'none';

                                return (
                                    <span
                                        key={index}
                                        style={{
                                            color,
                                            background,
                                            textDecoration: decoration,
                                            padding: part.added || part.removed ? '0 2px' : 0
                                        }}
                                    >
                                        {part.value}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '1.5rem', textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ display: 'inline-flex', gap: '1.5rem', fontSize: '0.85rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ width: '12px', height: '12px', background: '#ffebe9', border: '1px solid red' }} /> Removed from V{v1.versionNumber}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ width: '12px', height: '12px', background: '#e6ffec', border: '1px solid green' }} /> Added in V{v2.versionNumber}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VersionCompare;

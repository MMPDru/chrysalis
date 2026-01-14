
import { useState } from 'react';
import { Download, FileText, Image as ImageIcon, List, User, Loader2 } from 'lucide-react';
import { exportToPDF, exportToWord, type ChapterExportData } from '../../lib/export_logic';
import type { Chapter } from '../../lib/types';

interface BookExportOptionsProps {
    chapters: Chapter[];
}

const BookExportOptions = ({ chapters }: BookExportOptionsProps) => {
    const [isExporting, setIsExporting] = useState(false);
    const [format, setFormat] = useState<'pdf' | 'docx'>('pdf');
    const [options, setOptions] = useState({
        includeImages: true,
        includeTOC: true,
        includeTitle: true,
        includeAuthor: false
    });

    const handleExport = async () => {
        setIsExporting(true);
        // Prepare data - in a real app, we'd fetch the latest version content for each chapter
        const exportData: ChapterExportData[] = chapters.map(c => ({
            chapterNumber: c.chapterNumber,
            title: c.title,
            content: "This is the placeholder content for the export. In the full implementation, the latest version of this chapter would be fetched from Firestore."
        }));

        try {
            if (format === 'pdf') {
                await exportToPDF(exportData, options);
            } else {
                await exportToWord(exportData, options);
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('Export failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    const toggleOption = (key: keyof typeof options) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="card" style={{ padding: '2rem' }}>
            <h3 className="text-serif" style={{ marginBottom: '2rem' }}>Book Export Configuration</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '4rem' }}>
                <div className="export-preview">
                    <div style={{
                        aspectRatio: '1 / 1.4',
                        background: 'white',
                        borderRadius: '0.5rem',
                        boxShadow: 'var(--shadow-medium)',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '3rem',
                        position: 'relative',
                        border: '1px solid #eee'
                    }}>
                        <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', fontSize: '0.7rem', color: '#ccc' }}>PREVIEW</div>

                        {options.includeTitle && (
                            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🦋</div>
                                <h1 className="text-serif" style={{ fontSize: '1.5rem' }}>Chrysalis</h1>
                                <p style={{ fontSize: '0.8rem', color: '#999' }}>My Transformation</p>
                            </div>
                        )}

                        <div style={{ marginTop: 'auto' }}>
                            {options.includeTOC && (
                                <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginTop: '1rem' }}>
                                    <h5 style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.5rem' }}>TABLE OF CONTENTS</h5>
                                    {chapters.slice(0, 3).map(c => (
                                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '0.2rem' }}>
                                            <span>Chapter {c.chapterNumber}: {c.title}</span>
                                            <span style={{ borderBottom: '1px dotted #eee', flex: 1, margin: '0 0.5rem' }}></span>
                                            <span>2</span>
                                        </div>
                                    ))}
                                    {chapters.length > 3 && <div style={{ fontSize: '0.6rem', opacity: 0.3 }}>...and {chapters.length - 3} more chapters</div>}
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '0.6rem', color: '#eee' }}>Page 1</div>
                    </div>
                </div>

                <div className="export-settings" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#999' }}>EXPORT FORMAT</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                className={`btn ${format === 'pdf' ? 'btn-primary' : ''}`}
                                style={{ flex: 1, padding: '0.75rem', background: format === 'pdf' ? undefined : 'white' }}
                                onClick={() => setFormat('pdf')}
                            >
                                PDF
                            </button>
                            <button
                                className={`btn ${format === 'docx' ? 'btn-primary' : ''}`}
                                style={{ flex: 1, padding: '0.75rem', background: format === 'docx' ? undefined : 'white' }}
                                onClick={() => setFormat('docx')}
                            >
                                Word
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#999' }}>INCLUSIONS</label>
                        <div className="inclusion-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {[
                                { key: 'includeTitle', label: 'Title Page', icon: FileText },
                                { key: 'includeTOC', label: 'Table of Contents', icon: List },
                                { key: 'includeImages', label: 'Chapter Images', icon: ImageIcon },
                                { key: 'includeAuthor', label: 'About the Author', icon: User }
                            ].map(opt => (
                                <label
                                    key={opt.key}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem 1rem',
                                        background: '#f9f9f9',
                                        borderRadius: '0.75rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={options[opt.key as keyof typeof options]}
                                        onChange={() => toggleOption(opt.key as any)}
                                        style={{ accentColor: 'var(--color-primary)' }}
                                    />
                                    <opt.icon size={16} />
                                    <span style={{ fontSize: '0.85rem' }}>{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '1rem', marginTop: 'auto', gap: '0.5rem' }}
                        disabled={isExporting}
                        onClick={handleExport}
                    >
                        {isExporting ? <Loader2 className="animate-spin" /> : <><Download size={18} /> Export Full Book</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookExportOptions;

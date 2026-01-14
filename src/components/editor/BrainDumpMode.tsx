import { useState } from 'react';
import { Sparkles, ArrowRight, RefreshCw, Check } from 'lucide-react';
import VoiceInputButton from './VoiceInputButton';
import { processBrainDump } from '../../lib/gemini';

interface BrainDumpModeProps {
    onComplete: (processedContent: string) => void;
}

const BrainDumpMode = ({ onComplete }: BrainDumpModeProps) => {
    const [dump, setDump] = useState('');
    const [processed, setProcessed] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleProcess = async () => {
        if (!dump.trim()) return;
        setIsProcessing(true);
        try {
            const result = await processBrainDump(dump);
            setProcessed(result);
        } catch (error) {
            console.error('Error processing brain dump:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAccept = () => {
        onComplete(processed);
        setDump('');
        setProcessed('');
    };

    return (
        <div className="brain-dump-container">
            {!processed ? (
                <>
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 className="text-serif" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Brain Dump Mode</h3>
                        <p style={{ color: '#666' }}>Just let it flow. Don't worry about structure, grammar, or spelling.</p>
                    </div>

                    <textarea
                        className="brain-dump-input"
                        placeholder="Start typing your raw thoughts here..."
                        value={dump}
                        onChange={(e) => setDump(e.target.value)}
                        style={{
                            width: '100%',
                            minHeight: '400px',
                            padding: '2rem',
                            borderRadius: '1.5rem',
                            border: '2px dashed var(--color-primary)',
                            background: 'rgba(107, 73, 132, 0.02)',
                            fontFamily: 'var(--font-body)',
                            fontSize: '1.1rem',
                            lineHeight: '1.8',
                            resize: 'vertical',
                            marginBottom: '2rem',
                            outline: 'none'
                        }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <VoiceInputButton onTranscription={(text) => setDump(prev => prev + ' ' + text)} />

                        <button
                            className="btn btn-primary"
                            disabled={!dump.trim() || isProcessing}
                            onClick={handleProcess}
                            style={{ padding: '1rem 2rem' }}
                        >
                            {isProcessing ? (
                                <>
                                    <RefreshCw className="animate-spin" size={20} />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={20} />
                                    Transform My Thoughts
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div className="dump-preview">
                        <h4 style={{ marginBottom: '1rem', color: '#666' }}>Original Raw Dump</h4>
                        <div style={{
                            padding: '1.5rem',
                            background: '#f5f5f5',
                            borderRadius: '1rem',
                            fontSize: '0.9rem',
                            maxHeight: '500px',
                            overflowY: 'auto'
                        }}>
                            {dump}
                        </div>
                    </div>
                    <div className="processed-result">
                        <h4 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>Processed Transformation</h4>
                        <div style={{
                            padding: '1.5rem',
                            background: 'white',
                            borderRadius: '1rem',
                            boxShadow: 'var(--shadow-card)',
                            fontSize: '1rem',
                            lineHeight: '1.6',
                            maxHeight: '500px',
                            overflowY: 'auto',
                            marginBottom: '1.5rem'
                        }}>
                            {processed}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                className="btn"
                                style={{ flex: 1, background: '#f0f0f0' }}
                                onClick={() => setProcessed('')}
                            >
                                Edit Original
                            </button>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 2 }}
                                onClick={handleAccept}
                            >
                                <Check size={20} />
                                Accept Transformation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BrainDumpMode;

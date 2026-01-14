import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceInputButtonProps {
    onTranscription: (text: string) => void;
}

const VoiceInputButton = ({ onTranscription }: VoiceInputButtonProps) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                let currentInterim = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        setTranscript((prev) => prev + event.results[i][0].transcript + ' ');
                    } else {
                        currentInterim += event.results[i][0].transcript;
                    }
                }
                setInterimTranscript(currentInterim);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current.stop();
            setShowConfirm(true);
        } else {
            setTranscript('');
            setInterimTranscript('');
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleConfirm = () => {
        onTranscription(transcript + interimTranscript);
        setTranscript('');
        setInterimTranscript('');
        setShowConfirm(false);
    };

    const handleDiscard = () => {
        setTranscript('');
        setInterimTranscript('');
        setShowConfirm(false);
    };

    if (!recognitionRef.current && typeof window !== 'undefined') {
        return <div style={{ fontSize: '0.8rem', color: '#999' }}>Voice input not supported</div>;
    }

    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
                className={`voice-btn ${isListening ? 'listening' : ''}`}
                onClick={toggleListening}
                style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: isListening ? 'var(--color-accent)' : 'var(--color-primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-card)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    zIndex: 10
                }}
            >
                {isListening ? (
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                        <MicOff size={24} />
                    </motion.div>
                ) : (
                    <Mic size={24} />
                )}

                {isListening && (
                    <div className="pulse-ring"></div>
                )}
            </button>

            <AnimatePresence>
                {isListening && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="voice-indicator"
                        style={{
                            background: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '2rem',
                            boxShadow: 'var(--shadow-soft)',
                            fontSize: '0.9rem',
                            color: 'var(--color-accent)',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <span className="dot pulse"></span>
                        Listening...
                    </motion.div>
                )}

                {showConfirm && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="voice-confirm"
                        style={{
                            position: 'absolute',
                            left: '70px',
                            background: 'white',
                            padding: '1rem',
                            borderRadius: '1rem',
                            boxShadow: 'var(--shadow-card)',
                            zIndex: 100,
                            minWidth: '200px'
                        }}
                    >
                        <p style={{ fontSize: '0.85rem', marginBottom: '1rem', color: '#666' }}>
                            "{transcript + interimTranscript.substring(0, 50)}..."
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }}
                                onClick={handleConfirm}
                            >
                                <Check size={14} /> Keep
                            </button>
                            <button
                                className="btn"
                                style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', background: '#f0f0f0' }}
                                onClick={handleDiscard}
                            >
                                <X size={14} /> Discard
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VoiceInputButton;

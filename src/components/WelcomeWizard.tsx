import { useState } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import AuthorSelector from './AuthorSelector';

interface WelcomeWizardProps {
    initialDisplayName: string;
    onComplete: (displayName: string, favoriteAuthors: string[], customAuthors: string[]) => void;
}

const WelcomeWizard = ({ initialDisplayName, onComplete }: WelcomeWizardProps) => {
    const [step, setStep] = useState(1);
    const [displayName, setDisplayName] = useState(initialDisplayName);
    const [selectedAuthors, setSelectedAuthors] = useState(['Carl Jung', 'Michael Singer', 'Alan Watts']);
    const [customAuthors, setCustomAuthors] = useState<string[]>([]);

    const handleComplete = () => {
        onComplete(displayName, selectedAuthors, customAuthors);
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '1.5rem',
                maxWidth: '600px',
                width: '100%',
                padding: '2rem',
                position: 'relative',
                boxShadow: '0 20px 60px rgba(107, 73, 132, 0.3)'
            }}>
                {/* Butterfly animation header */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '2rem',
                    position: 'relative'
                }}>
                    <div style={{
                        display: 'inline-block',
                        animation: 'float 4s ease-in-out infinite'
                    }}>
                        <img
                            src="/images/butterfly_line_art.png"
                            alt="Butterfly"
                            style={{ width: '80px', opacity: 0.6 }}
                        />
                    </div>
                    <h2 style={{
                        fontFamily: 'var(--font-headline)',
                        fontSize: '2rem',
                        color: 'var(--color-primary)',
                        marginTop: '1rem'
                    }}>
                        Welcome to Your Chrysalis
                    </h2>
                    <p style={{ color: '#666', marginTop: '0.5rem' }}>
                        Let's personalize your writing companion
                    </p>
                </div>

                {/* Progress indicator */}
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '2rem',
                    justifyContent: 'center'
                }}>
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            style={{
                                width: '40px',
                                height: '4px',
                                borderRadius: '2px',
                                background: i <= step ? 'var(--color-primary)' : 'var(--color-subtle-border)',
                                transition: 'all 0.3s ease'
                            }}
                        />
                    ))}
                </div>

                {/* Step 1: Display Name */}
                {step === 1 && (
                    <div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>What should we call you?</h3>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Your name"
                            style={{
                                width: '100%',
                                padding: '1rem',
                                borderRadius: '0.75rem',
                                border: '2px solid var(--color-subtle-border)',
                                fontFamily: 'var(--font-body)',
                                fontSize: '1rem',
                                marginBottom: '1.5rem'
                            }}
                        />
                        <button
                            onClick={() => setStep(2)}
                            disabled={!displayName.trim()}
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                        >
                            Continue <ChevronRight size={20} />
                        </button>
                    </div>
                )}

                {/* Step 2: Author Selection */}
                {step === 2 && (
                    <div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Choose Your Wisdom Guides</h3>
                        <AuthorSelector
                            selectedAuthors={selectedAuthors}
                            customAuthors={customAuthors}
                            onAuthorsChange={setSelectedAuthors}
                            onCustomAuthorsChange={setCustomAuthors}
                        />
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button
                                onClick={() => setStep(1)}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    borderRadius: '0.75rem',
                                    border: '2px solid var(--color-subtle-border)',
                                    background: 'white',
                                    fontWeight: 500
                                }}
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                className="btn btn-primary"
                                style={{ flex: 2 }}
                            >
                                Continue <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Feature Intro */}
                {step === 3 && (
                    <div>
                        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>You're All Set!</h3>
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{
                                padding: '1rem',
                                background: 'var(--color-hover)',
                                borderRadius: '0.75rem',
                                marginBottom: '1rem'
                            }}>
                                <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                                    ✍️ Write Your Chapters
                                </h4>
                                <p style={{ fontSize: '0.875rem', color: '#666' }}>
                                    Organize your memoir into chapters with our intuitive editor
                                </p>
                            </div>
                            <div style={{
                                padding: '1rem',
                                background: 'var(--color-hover)',
                                borderRadius: '0.75rem',
                                marginBottom: '1rem'
                            }}>
                                <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                                    📚 Wisdom Library
                                </h4>
                                <p style={{ fontSize: '0.875rem', color: '#666' }}>
                                    Import YouTube videos and extract philosophical insights
                                </p>
                            </div>
                            <div style={{
                                padding: '1rem',
                                background: 'var(--color-hover)',
                                borderRadius: '0.75rem'
                            }}>
                                <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                                    🎨 Visual Studio
                                </h4>
                                <p style={{ fontSize: '0.875rem', color: '#666' }}>
                                    Generate beautiful imagery for your story
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleComplete}
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                        >
                            <Sparkles size={20} />
                            Begin Your Transformation
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WelcomeWizard;

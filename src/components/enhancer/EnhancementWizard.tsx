
import { useState, useEffect } from 'react';
import { X, Sparkles, Wand2, ChevronRight, ChevronLeft, Loader2, Check } from 'lucide-react';
import type { Chapter, Version, WisdomVideo } from '../../lib/types';
import { analyzeChapterForEnhancement, generateIntegrationPreviews, enhanceChapterFull } from '../../lib/gemini';
import { subscribeToLibrary } from '../../lib/library';
import { createNewVersion, setAsCurrentVersion } from '../../lib/chapters';
import { useAuth } from '../../contexts/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface EnhancementWizardProps {
    isOpen: boolean;
    onClose: () => void;
    initialChapter?: Chapter | null;
    initialVersion?: Version | null;
    initialWisdom?: WisdomVideo | null;
}

const EnhancementWizard = ({ isOpen, onClose, initialChapter, initialVersion, initialWisdom }: EnhancementWizardProps) => {
    const { currentUser } = useAuth();
    const [step, setStep] = useState(1);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(initialChapter || null);
    const [currentVersion, setCurrentVersion] = useState<Version | null>(initialVersion || null);

    // Step 2 Data
    const [analysis, setAnalysis] = useState<{ themes: string[], currentLesson: string, opportunities: string[] } | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Step 3 Data
    const [libraryVideos, setLibraryVideos] = useState<WisdomVideo[]>([]);
    const [selectedWisdom, setSelectedWisdom] = useState<WisdomVideo | null>(initialWisdom || null);

    // Step 4 Data
    const [previews, setPreviews] = useState<{ author: string, concept: string, snippet: string }[]>([]);
    const [isGeneratingPreviews, setIsGeneratingPreviews] = useState(false);

    // Step 5 Data
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [finishedVersions, setFinishedVersions] = useState<{ type: string, content: string, id: string }[]>([]);

    useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setAnalysis(null);
            if (!initialWisdom) setSelectedWisdom(null);
            setFinishedVersions([]);
            return;
        }

        // Fetch chapters if not provided
        if (!initialChapter && currentUser) {
            const fetchChapters = async () => {
                const q = query(collection(db, 'chapters'), where('userId', '==', currentUser.uid));
                const snapshot = await getDocs(q);
                setChapters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Chapter[]);
            };
            fetchChapters();
        }

        // Fetch library
        if (currentUser) {
            subscribeToLibrary(currentUser.uid, setLibraryVideos);
        }

        // If we have initial data, skip to relevant step
        if (initialWisdom && initialChapter) {
            setStep(2);
        } else if (initialWisdom) {
            setStep(1);
        } else if (initialChapter) {
            setStep(2);
        }
    }, [isOpen, initialChapter, initialWisdom, currentUser]);

    // Step Change Handlers
    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    // Step 2: Analyze
    const handleAnalyze = async () => {
        if (!selectedChapter) return;
        setIsAnalyzing(true);

        let content = initialVersion?.content || '';
        if (!content) {
            const vq = query(collection(db, 'versions'), where('chapterId', '==', selectedChapter.id), where('isCurrent', '==', true));
            const vsnap = await getDocs(vq);
            if (!vsnap.empty) {
                const vdata = vsnap.docs[0].data() as Version;
                content = vdata.content;
                setCurrentVersion({ ...vdata, id: vsnap.docs[0].id } as Version);
            }
        }

        try {
            const result = await analyzeChapterForEnhancement(content);
            setAnalysis(result);
            nextStep();
        } catch (error) {
            console.error('Analysis error:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Step 4: Preview Previews
    const handleGeneratePreviews = async (wisdom: WisdomVideo) => {
        setSelectedWisdom(wisdom);
        setIsGeneratingPreviews(true);
        nextStep();

        try {
            const content = currentVersion?.content || '';
            const result = await generateIntegrationPreviews(content, wisdom);
            setPreviews(result);
        } catch (error) {
            console.error('Preview error:', error);
        } finally {
            setIsGeneratingPreviews(false);
        }
    };

    // Step 5: Full Enhancement
    const handleEnhance = async (previewItem: { concept: string }) => {
        if (!selectedChapter || !selectedWisdom || !currentUser || !currentVersion) return;
        setIsEnhancing(true);

        try {
            console.log('Enhancing with concept:', previewItem.concept);
            const enhancedContent = await enhanceChapterFull(currentVersion.content, selectedWisdom);

            // Map author to version type
            let type: Version['type'] = 'custom';
            const authLower = selectedWisdom.author.toLowerCase();
            if (authLower.includes('jung')) type = 'jung';
            else if (authLower.includes('singer')) type = 'singer';
            else if (authLower.includes('watts')) type = 'watts';

            const newVersionId = await createNewVersion(
                selectedChapter.id,
                currentUser.uid,
                enhancedContent,
                enhancedContent.trim().split(/\s+/).length,
                type
            );

            setFinishedVersions(prev => [...prev, { type, content: enhancedContent, id: newVersionId }]);
            nextStep();
        } catch (error) {
            console.error('Enhancement error:', error);
        } finally {
            setIsEnhancing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
            <div className="modal-content enhancement-wizard" style={{ maxWidth: '900px', width: '90%', padding: 0, overflow: 'hidden', height: '80vh', display: 'flex', flexDirection: 'column' }}>

                <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: 'var(--color-primary)', color: 'white', padding: '0.5rem', borderRadius: '0.75rem' }}>
                            <Wand2 size={20} />
                        </div>
                        <div>
                            <h3 className="text-serif" style={{ margin: 0 }}>Chrysalis Enhancement Engine</h3>
                            <div style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginTop: '0.2rem' }}>
                                Step {step} of 5: {
                                    step === 1 ? 'Select Chapter' :
                                        step === 2 ? 'Thematic Analysis' :
                                            step === 3 ? 'Choose Wisdom Source' :
                                                step === 4 ? 'Integration Previews' : 'Success & Review'
                                }
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-icon"><X size={24} /></button>
                </div>

                <div style={{ width: '100%', height: '4px', background: '#f5f5f5' }}>
                    <div style={{
                        width: `${(step / 5) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
                        transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} />
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '2.5rem' }}>
                    {step === 1 && (
                        <div className="step-content">
                            <h2 className="text-serif" style={{ marginBottom: '1rem' }}>Which chapter shall we transform?</h2>
                            <p style={{ color: '#666', marginBottom: '2rem' }}>Select the chapter you'd like to deepen with philosophical wisdom.</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {chapters.map(chapter => (
                                    <div
                                        key={chapter.id}
                                        onClick={() => setSelectedChapter(chapter)}
                                        className={`selectable-card ${selectedChapter?.id === chapter.id ? 'selected' : ''}`}
                                        style={{
                                            padding: '1.25rem',
                                            border: '2px solid',
                                            borderColor: selectedChapter?.id === chapter.id ? 'var(--color-primary)' : '#eee',
                                            borderRadius: '1rem',
                                            cursor: 'pointer',
                                            background: selectedChapter?.id === chapter.id ? 'rgba(107, 73, 132, 0.05)' : 'white',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Chapter {chapter.chapterNumber}: {chapter.title}</div>
                                            {selectedChapter?.id === chapter.id && <div style={{ color: 'var(--color-primary)' }}><Check size={20} /></div>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    className="btn btn-primary"
                                    disabled={!selectedChapter}
                                    onClick={handleAnalyze}
                                    style={{ padding: '0.75rem 2rem' }}
                                >
                                    {isAnalyzing ? <Loader2 className="animate-spin" /> : <>Next: Analyze <ChevronRight size={18} /></>}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && analysis && (
                        <div className="step-content animate-fade-in">
                            <h2 className="text-serif" style={{ marginBottom: '0.5rem' }}>Thematic Discovery</h2>
                            <div style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Sparkles size={16} /> AI analysis complete
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div>
                                    <h4 style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#999', letterSpacing: '0.1em', marginBottom: '1rem' }}>Core Themes</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
                                        {analysis.themes.map(theme => (
                                            <span key={theme} style={{ background: 'var(--color-hover)', color: 'var(--color-primary)', padding: '0.4rem 0.8rem', borderRadius: '2rem', fontSize: '0.85rem', fontWeight: 600 }}>
                                                {theme}
                                            </span>
                                        ))}
                                    </div>

                                    <h4 style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#999', letterSpacing: '0.1em', marginBottom: '1rem' }}>Current Life Lesson</h4>
                                    <p style={{ color: '#444', lineHeight: 1.6, background: '#fcfcfc', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #eee' }}>
                                        {analysis.currentLesson}
                                    </p>
                                </div>

                                <div style={{ background: 'rgba(107, 73, 132, 0.03)', padding: '1.5rem', borderRadius: '1.5rem', border: '1px dashed var(--color-primary-light)' }}>
                                    <h4 style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--color-primary)', letterSpacing: '0.1em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Wand2 size={14} /> Enhancement Opportunities
                                    </h4>
                                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: 0, listStyle: 'none' }}>
                                        {analysis.opportunities.map((opt, i) => (
                                            <li key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.9rem', color: '#555', lineHeight: 1.4 }}>
                                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, flexShrink: 0 }}>
                                                    {i + 1}
                                                </div>
                                                {opt}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between' }}>
                                <button className="btn" onClick={prevStep} style={{ background: 'white' }}><ChevronLeft size={18} /> Back</button>
                                <button className="btn btn-primary" onClick={nextStep} style={{ padding: '0.75rem 2rem' }}>Next: Select Wisdom <ChevronRight size={18} /></button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="step-content">
                            <h2 className="text-serif" style={{ marginBottom: '1rem' }}>Choose your teacher</h2>
                            <p style={{ color: '#666', marginBottom: '2rem' }}>Select a source from your wisdom library that resonates with these themes.</p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                                {libraryVideos.map(video => (
                                    <div
                                        key={video.id}
                                        onClick={() => handleGeneratePreviews(video)}
                                        className="selectable-wisdom-card"
                                        style={{
                                            borderRadius: '1rem',
                                            overflow: 'hidden',
                                            border: '1px solid #eee',
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s',
                                            background: 'white'
                                        }}
                                    >
                                        <div style={{ position: 'relative', aspectRatio: '16/9' }}>
                                            <img src={video.thumbnail} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                            <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', background: 'rgba(255,255,255,0.9)', padding: '0.2rem 0.5rem', borderRadius: '0.4rem', fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                                {video.author}
                                            </div>
                                        </div>
                                        <div style={{ padding: '0.75rem' }}>
                                            <h5 style={{ fontSize: '0.85rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{video.title}</h5>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between' }}>
                                <button className="btn" onClick={prevStep} style={{ background: 'white' }}><ChevronLeft size={18} /> Back</button>
                                <button className="btn" disabled style={{ opacity: 0.5 }}>Select a video to continue</button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="step-content">
                            <h2 className="text-serif" style={{ marginBottom: '1rem' }}>Preview Integrations</h2>
                            <p style={{ color: '#666', marginBottom: '2rem' }}>See how {selectedWisdom?.author}'s wisdom could transform your narrative.</p>

                            {isGeneratingPreviews ? (
                                <div style={{ textAlign: 'center', padding: '5rem' }}>
                                    <div className="metamorphosis-spinner" style={{ margin: '0 auto 1.5rem auto' }} />
                                    <p style={{ fontStyle: 'italic', color: '#999' }}>Spinning philosophical gold from your story...</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    {previews.map((preview, i) => (
                                        <div key={i} className="preview-option" style={{ background: 'white', border: '1px solid #eee', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: 'var(--shadow-soft)' }}>
                                            <div style={{ padding: '1.5rem', borderBottom: '1px solid #f9f9f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-hover)' }}>
                                                <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.9rem' }}>{preview.concept}</div>
                                                <div style={{ fontSize: '0.7rem', color: '#999', textTransform: 'uppercase' }}>Option {i + 1}</div>
                                            </div>
                                            <div style={{ padding: '1.5rem' }}>
                                                <p style={{ fontSize: '0.95rem', color: '#555', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '1.5rem' }}>
                                                    "{preview.snippet}"
                                                </p>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => handleEnhance(preview)}
                                                    disabled={isEnhancing}
                                                    style={{ width: '100%', gap: '0.5rem' }}
                                                >
                                                    {isEnhancing ? <Loader2 className="animate-spin" /> : <><Sparkles size={16} /> Generate Full Enhanced Version</>}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-start' }}>
                                <button className="btn" onClick={prevStep} style={{ background: 'white' }}><ChevronLeft size={18} /> Back</button>
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="step-content animate-fade-in" style={{ textAlign: 'center', padding: '2rem 0' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 2rem auto',
                                boxShadow: '0 10px 20px rgba(34, 197, 94, 0.2)'
                            }}>
                                <Check size={40} />
                            </div>

                            <h2 className="text-serif" style={{ marginBottom: '1rem' }}>Transformation Complete!</h2>
                            <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '3rem' }}>
                                We've created {finishedVersions.length} new version(s) of <strong>{selectedChapter?.title}</strong> in your history.
                            </p>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginBottom: '4rem' }}>
                                {finishedVersions.map((v, i) => (
                                    <div key={i} style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
                                        <div style={{ padding: '1rem 2rem', background: 'white', border: '1px solid #eee', borderRadius: '1rem 1rem 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 'none' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-primary)' }} />
                                                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{v.type} Perspective</span>
                                            </div>
                                            <button
                                                className="btn btn-primary"
                                                style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
                                                onClick={() => {
                                                    setAsCurrentVersion(selectedChapter!.id, v.id);
                                                    alert('This version is now your current draft!');
                                                }}
                                            >
                                                Set as Current
                                            </button>
                                        </div>
                                        <div style={{ padding: '1.5rem', background: '#fcfcfc', border: '1px solid #eee', borderRadius: '0 0 1rem 1rem', fontSize: '0.9rem', color: '#555', maxHeight: '300px', overflowY: 'auto', textAlign: 'left', lineHeight: 1.6 }}>
                                            {v.content}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button className="btn btn-primary" onClick={onClose} style={{ padding: '0.75rem 3rem' }}>
                                    View in History
                                </button>
                                <button className="btn" onClick={() => setStep(3)} style={{ background: 'white' }}>
                                    Enhance with another source
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EnhancementWizard;

import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { generateVideoWithFal } from '../lib/fal';

interface VideoJob {
    id: string;
    chapterId: string;
    chapterTitle: string;
    prompt: string;
    status: 'generating' | 'completed' | 'failed';
    result?: {
        url: string;
        thumbnail: string;
    };
    error?: string;
    createdAt: number;
}

interface VisualGenerationContextType {
    jobs: VideoJob[];
    startVideoGeneration: (chapterId: string, chapterTitle: string, prompt: string) => Promise<void>;
    dismissJob: (jobId: string) => void;
    isGeneratingForChapter: (chapterId: string) => boolean;
}

const VisualGenerationContext = createContext<VisualGenerationContextType | undefined>(undefined);

export const useVisualGeneration = () => {
    const context = useContext(VisualGenerationContext);
    if (!context) {
        throw new Error('useVisualGeneration must be used within a VisualGenerationProvider');
    }
    return context;
};

export const VisualGenerationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [jobs, setJobs] = useState<VideoJob[]>([]);

    const startVideoGeneration = async (chapterId: string, chapterTitle: string, prompt: string) => {
        const newJob: VideoJob = {
            id: `job-${Date.now()}`,
            chapterId,
            chapterTitle,
            prompt,
            status: 'generating',
            createdAt: Date.now()
        };

        setJobs(prev => [newJob, ...prev]);

        // Start generation in background
        generateVideoWithFal(prompt)
            .then(result => {
                setJobs(prev => prev.map(job => {
                    if (job.id === newJob.id) {
                        if (result.status === 'completed' && result.videoUrl) {
                            return {
                                ...job,
                                status: 'completed',
                                result: {
                                    url: result.videoUrl,
                                    thumbnail: result.thumbnailUrl || result.videoUrl || ''
                                }
                            };
                        } else {
                            return {
                                ...job,
                                status: 'failed',
                                error: result.error || 'Generation failed'
                            };
                        }
                    }
                    return job;
                }));
            })
            .catch(error => {
                setJobs(prev => prev.map(job => {
                    if (job.id === newJob.id) {
                        return {
                            ...job,
                            status: 'failed',
                            error: error.message || 'Unknown error'
                        };
                    }
                    return job;
                }));
            });
    };

    const dismissJob = (jobId: string) => {
        setJobs(prev => prev.filter(job => job.id !== jobId));
    };

    const isGeneratingForChapter = (chapterId: string) => {
        return jobs.some(job => job.chapterId === chapterId && job.status === 'generating');
    };

    return (
        <VisualGenerationContext.Provider value={{ jobs, startVideoGeneration, dismissJob, isGeneratingForChapter }}>
            {children}
        </VisualGenerationContext.Provider>
    );
};

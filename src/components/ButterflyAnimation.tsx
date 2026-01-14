import { useEffect, useState, useCallback } from 'react';

interface Butterfly {
    id: number;
    x: number;
    y: number;
    delay: number;
    duration: number;
    size: number;
    rotation: number;
    direction: 'up-left' | 'up-right' | 'up';
}

interface ButterflyAnimationProps {
    trigger: number; // increment to trigger new butterflies
    originX?: number;
    originY?: number;
    count?: number;
}

const ButterflyAnimation = ({ trigger, originX = 50, originY = 50, count = 5 }: ButterflyAnimationProps) => {
    const [butterflies, setButterflies] = useState<Butterfly[]>([]);

    const createButterflies = useCallback(() => {
        const directions: Butterfly['direction'][] = ['up-left', 'up-right', 'up'];
        const newButterflies: Butterfly[] = Array.from({ length: count }, (_, i) => ({
            id: Date.now() + i,
            x: originX + (Math.random() - 0.5) * 20,
            y: originY + (Math.random() - 0.5) * 20,
            delay: i * 100,
            duration: 2000 + Math.random() * 1000,
            size: 16 + Math.random() * 16,
            rotation: Math.random() * 30 - 15,
            direction: directions[Math.floor(Math.random() * directions.length)]
        }));

        setButterflies(prev => [...prev, ...newButterflies]);

        // Clean up after animation
        setTimeout(() => {
            setButterflies(prev => prev.filter(b => !newButterflies.find(nb => nb.id === b.id)));
        }, 4000);
    }, [originX, originY, count]);

    useEffect(() => {
        if (trigger > 0) {
            createButterflies();
        }
    }, [trigger, createButterflies]);

    const getAnimationStyle = (butterfly: Butterfly): React.CSSProperties => {
        const translateX = butterfly.direction === 'up-left' ? -150 : butterfly.direction === 'up-right' ? 150 : (Math.random() - 0.5) * 100;

        return {
            position: 'fixed' as const,
            left: `${butterfly.x}%`,
            top: `${butterfly.y}%`,
            fontSize: butterfly.size,
            zIndex: 9999,
            pointerEvents: 'none' as const,
            opacity: 0,
            transform: `rotate(${butterfly.rotation}deg)`,
            animation: `butterflyFly ${butterfly.duration}ms ease-out ${butterfly.delay}ms forwards`,
            '--butterfly-x': `${translateX}px`
        } as React.CSSProperties;
    };

    return (
        <>
            <style>{`
                @keyframes butterflyFly {
                    0% {
                        opacity: 1;
                        transform: translateY(0) translateX(0) scale(0.5);
                    }
                    20% {
                        opacity: 1;
                        transform: translateY(-50px) translateX(calc(var(--butterfly-x) * 0.2)) scale(1) rotate(-15deg);
                    }
                    40% {
                        transform: translateY(-120px) translateX(calc(var(--butterfly-x) * 0.4)) rotate(10deg);
                    }
                    60% {
                        transform: translateY(-200px) translateX(calc(var(--butterfly-x) * 0.6)) rotate(-10deg);
                    }
                    80% {
                        opacity: 0.6;
                        transform: translateY(-300px) translateX(calc(var(--butterfly-x) * 0.8)) rotate(5deg);
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(-400px) translateX(var(--butterfly-x)) rotate(0deg);
                    }
                }
                
                @keyframes wingFlutter {
                    0%, 100% { transform: scaleX(1); }
                    50% { transform: scaleX(0.7); }
                }
            `}</style>
            {butterflies.map(butterfly => (
                <span key={butterfly.id} style={getAnimationStyle(butterfly)}>
                    🦋
                </span>
            ))}
        </>
    );
};

// Background butterflies component for ambient effect
export const BackgroundButterflies = () => {
    const butterflies = [
        { left: '5%', top: '20%', delay: '0s', duration: '12s' },
        { left: '15%', top: '60%', delay: '3s', duration: '15s' },
        { left: '85%', top: '30%', delay: '6s', duration: '18s' },
        { left: '75%', top: '70%', delay: '2s', duration: '14s' },
        { left: '45%', top: '15%', delay: '8s', duration: '16s' },
        { left: '95%', top: '50%', delay: '4s', duration: '13s' },
        { left: '25%', top: '85%', delay: '7s', duration: '17s' },
        { left: '60%', top: '10%', delay: '5s', duration: '11s' },
    ];

    return (
        <>
            <style>{`
                @keyframes floatButterfly {
                    0%, 100% {
                        transform: translateY(0) translateX(0) rotate(0deg);
                        opacity: 0.15;
                    }
                    25% {
                        transform: translateY(-30px) translateX(20px) rotate(5deg);
                        opacity: 0.25;
                    }
                    50% {
                        transform: translateY(-10px) translateX(-15px) rotate(-3deg);
                        opacity: 0.2;
                    }
                    75% {
                        transform: translateY(-40px) translateX(10px) rotate(8deg);
                        opacity: 0.3;
                    }
                }
                
                .bg-butterfly {
                    position: fixed;
                    pointer-events: none;
                    z-index: 0;
                    font-size: 2rem;
                    filter: blur(1px);
                    animation: floatButterfly var(--duration) ease-in-out infinite;
                    animation-delay: var(--delay);
                }
            `}</style>
            {butterflies.map((b, i) => (
                <span
                    key={i}
                    className="bg-butterfly"
                    style={{
                        left: b.left,
                        top: b.top,
                        '--delay': b.delay,
                        '--duration': b.duration
                    } as React.CSSProperties}
                >
                    🦋
                </span>
            ))}
        </>
    );
};

export default ButterflyAnimation;

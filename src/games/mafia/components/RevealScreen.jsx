import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Eye, EyeOff } from 'lucide-react';

export default function RevealScreen({ assignments, onComplete }) {
    const [index, setIndex] = useState(0);
    const [isRevealed, setIsRevealed] = useState(false);

    const currentAssignment = assignments[index];
    const isFinished = index >= assignments.length;

    const handleNext = () => {
        if (isRevealed) {
            // Hide and move to next
            setIsRevealed(false);
            setTimeout(() => {
                if (index + 1 >= assignments.length) {
                    onComplete();
                } else {
                    setIndex(index + 1);
                }
            }, 300); // Wait for flip back
        } else {
            // Reveal
            setIsRevealed(true);
        }
    };

    if (isFinished) return null;

    return (
        <div style={{ perspective: '1000px', minHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '2rem' }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    style={{ width: '100%', maxWidth: '320px', aspectRatio: '2/3', position: 'relative' }}
                >
                    <motion.div
                        animate={{ rotateY: isRevealed ? 180 : 0 }}
                        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                        style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d' }}
                    >
                        {/* Front of Card (Pass to X) */}
                        <div
                            style={{
                                position: 'absolute',
                                width: '100%', height: '100%',
                                backfaceVisibility: 'hidden',
                                background: 'linear-gradient(135deg, var(--surface), var(--background))',
                                border: '2px solid var(--primary)',
                                borderRadius: '1.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '2rem',
                                boxShadow: '0 10px 30px -10px var(--primary-glow)'
                            }}
                            onClick={() => !isRevealed && handleNext()}
                        >
                            <User size={64} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
                            <h3 style={{ color: 'var(--text-dim)', marginBottom: '0.5rem' }}>Pass the phone to</h3>
                            <h2 className="text-gradient" style={{ fontSize: '2rem', textAlign: 'center' }}>{currentAssignment.player}</h2>
                            <p style={{ marginTop: '2rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Tap to reveal role</p>
                        </div>

                        {/* Back of Card (Role) */}
                        <div
                            style={{
                                position: 'absolute',
                                width: '100%', height: '100%',
                                backfaceVisibility: 'hidden',
                                transform: 'rotateY(180deg)',
                                background: 'linear-gradient(135deg, #000, var(--surface))',
                                border: `2px solid ${currentAssignment.roleData.color}`,
                                borderRadius: '1.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '2rem',
                                boxShadow: `0 10px 30px -10px ${currentAssignment.roleData.color}80`
                            }}
                            onClick={() => isRevealed && handleNext()}
                        >
                            <div style={{ color: currentAssignment.roleData.color, marginBottom: '2rem' }}>
                                {/* Lucide icons passed as component in roleData? No, roleData has key 'icon' which is a component */}
                                <currentAssignment.roleData.icon size={80} />
                            </div>
                            <h2 style={{ fontSize: '2.5rem', color: currentAssignment.roleData.color, marginBottom: '1rem', textShadow: `0 0 20px ${currentAssignment.roleData.color}80` }}>
                                {currentAssignment.roleData.label}
                            </h2>
                            <p style={{ color: 'var(--text-dim)', textAlign: 'center' }}>Keep this secret!</p>

                            <button
                                className="btn-primary"
                                style={{ marginTop: '3rem' }}
                            >
                                {index === assignments.length - 1 ? 'Finish' : 'Pass to Next'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

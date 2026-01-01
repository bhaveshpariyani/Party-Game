import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AVAILABLE_ROLES } from '../RoleConfigScreen';
import { HelpCircle, CheckCircle, Clock } from 'lucide-react';
import ConfirmationModal from '../common/ConfirmationModal';
import { db } from '../../../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function MultiplayerReveal({ player, players, isHost, onStartGame, roomCode, onResetGame }) {
    const [isRevealed, setIsRevealed] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // 1. Handle Card Flip & Firestore Update
    const handleReveal = async () => {
        if (!isRevealed) {
            setIsRevealed(true);
            try {
                if (roomCode && player?.id) {
                    await updateDoc(doc(db, 'rooms', roomCode, 'players', player.id), {
                        roleRevealed: true
                    });
                }
            } catch (e) {
                console.error("Error updating reveal status:", e);
            }
        }
    };

    if (!player || !player.role) {
        return (
            <div className="flex-col-center" style={{ height: '80vh' }}>
                <h2>Waiting for role...</h2>
            </div>
        );
    }

    // Role Data Logic
    let icon = HelpCircle;
    const standardRole = AVAILABLE_ROLES.find(r => r.id === player.role);
    if (standardRole) {
        icon = standardRole.icon;
    }

    const RoleIcon = icon;
    const roleColor = player.roleData?.color || standardRole?.color || '#fff';
    const roleLabel = player.roleData?.label || standardRole?.label || player.role;

    // Check if everyone has revealed
    const unrevealedCount = players?.filter(p => !p.roleRevealed).length || 0;
    const canStart = unrevealedCount === 0;

    return (
        <div style={{
            minHeight: '80vh',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2rem'
        }}>
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ width: '100%', maxWidth: '320px', aspectRatio: '2/3', position: 'relative', perspective: '1000px' }}
                onClick={handleReveal}
            >
                <motion.div
                    animate={{ rotateY: isRevealed ? 180 : 0 }}
                    transition={{ duration: 0.6 }}
                    style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d' }}
                >
                    {/* Front */}
                    <div className="card-glass" style={{
                        position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg, var(--surface), var(--background))',
                        border: '2px solid var(--primary)', cursor: 'pointer'
                    }}>
                        <HelpCircle size={64} color="var(--primary)" style={{ opacity: 0.5 }} />
                        <h3 style={{ marginTop: '1rem' }}>Tap to Reveal</h3>
                    </div>

                    {/* Back */}
                    <div className="card-glass" style={{
                        position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(135deg, #000, var(--surface))',
                        border: `2px solid ${roleColor}`,
                        boxShadow: `0 0 30px ${roleColor}40`
                    }}>
                        <div style={{ color: roleColor, marginBottom: '2rem' }}>
                            <RoleIcon size={80} />
                        </div>
                        <h2 style={{ fontSize: '2.5rem', color: roleColor, textAlign: 'center', textShadow: `0 0 20px ${roleColor}` }}>
                            {roleLabel}
                        </h2>
                        <p style={{ color: 'var(--text-dim)', textAlign: 'center', marginTop: '1rem' }}>
                            Don't show this to anyone!
                        </p>
                    </div>
                </motion.div>
            </motion.div>

            {isHost && (
                <div style={{
                    width: '100%',
                    textAlign: 'center',
                    marginTop: '2rem'
                }}>
                    {!canStart ? (
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            color: 'var(--warning)', marginBottom: '1rem',
                            background: 'rgba(255, 193, 7, 0.1)', padding: '0.5rem 1rem', borderRadius: '1rem'
                        }}>
                            <Clock size={16} />
                            <span>Waiting for {unrevealedCount} players to reveal...</span>
                        </div>
                    ) : (
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            color: 'var(--success)', marginBottom: '1rem'
                        }}>
                            <CheckCircle size={16} />
                            <span>Everyone is ready!</span>
                        </div>
                    )}

                    <button
                        className="btn-primary"
                        onClick={onStartGame}
                        disabled={!canStart}
                        style={{
                            width: '100%',
                            maxWidth: '300px',
                            opacity: canStart ? 1 : 0.5,
                            cursor: canStart ? 'pointer' : 'not-allowed'
                        }}
                    >
                        Start Night Phase
                    </button>

                    <button
                        className="btn-ghost"
                        onClick={() => setShowResetConfirm(true)}
                        style={{
                            display: 'block',
                            margin: '1rem auto 0',
                            width: '100%',
                            maxWidth: '300px',
                            color: 'var(--danger)',
                            borderColor: 'var(--danger)',
                            opacity: 0.8
                        }}
                    >
                        Reset Game
                    </button>

                    <ConfirmationModal
                        isOpen={showResetConfirm}
                        onCancel={() => setShowResetConfirm(false)}
                        onConfirm={() => {
                            setShowResetConfirm(false);
                            onResetGame();
                        }}
                        title="Reset Game?"
                        message="This will take everyone back to the lobby, clear all roles, and restart from scratch."
                        confirmText="Reset Game"
                        isDanger={true}
                    />
                </div>
            )}
            {!isHost && (
                <p style={{ color: 'var(--text-dim)', fontStyle: 'italic', marginTop: '1rem' }}>
                    {isRevealed ? "Waiting for host to start..." : "Tap the card to see your role!"}
                </p>
            )}
        </div>
    );
}

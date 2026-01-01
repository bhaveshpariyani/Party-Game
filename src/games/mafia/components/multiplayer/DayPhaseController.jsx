import { useState, useEffect } from 'react';
import { db } from '../../../../services/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { Skull, Sun, Check, UserX, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from '../common/ConfirmationModal';

export default function DayPhaseController({
    roomCode, players, currentUser, isHost, dayCount, gameId, onEndDay, onResetGame
}) {
    // Actions: { [voterId]: targetId, [voterId + '_submitted']: true }
    const [actions, setActions] = useState({});

    // Local State for Players
    const [selectedTarget, setSelectedTarget] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [resolveConfirm, setResolveConfirm] = useState(false);
    const [dayReportConfirm, setDayReportConfirm] = useState(false); // New Report Modal
    const [reportData, setReportData] = useState({ title: '', msg: '', eliminatedId: null });
    const [resetConfirm, setResetConfirm] = useState(false);
    const [resolveMessage, setResolveMessage] = useState({ title: '', msg: '' });

    // Listen to Day Actions
    useEffect(() => {
        const actionsRef = doc(db, 'rooms', roomCode, 'actions', `day_${dayCount}_${gameId || 'legacy'}`);
        const unsub = onSnapshot(actionsRef, (doc) => {
            if (doc.exists()) {
                setActions(doc.data());
            }
        });
        return () => unsub();
    }, [roomCode, dayCount]);

    // My Status
    const myPlayer = players.find(p => p.id === currentUser);
    const isAlive = myPlayer?.isAlive;
    const isSubmitted = actions[`${currentUser}_submitted`];

    // --- Actions ---

    const handleSelectTarget = (targetId) => {
        if (isSubmitted || !isAlive) return;
        setSelectedTarget(targetId);
    };

    const handleSubmitVote = async () => {
        if (!selectedTarget) return;
        const actionsRef = doc(db, 'rooms', roomCode, 'actions', `day_${dayCount}_${gameId || 'legacy'}`);
        await setDoc(actionsRef, {
            [currentUser]: selectedTarget,
            [`${currentUser}_submitted`]: true
        }, { merge: true });
        setShowConfirm(false);
    };

    const handleResolveDay = () => {
        // Calculate Votes
        const voteCounts = {};
        Object.keys(actions).forEach(key => {
            if (!key.endsWith('_submitted')) {
                const targetId = actions[key];
                voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
            }
        });

        // Find max votes
        let maxVotes = 0;
        let candidateId = null;
        let isTie = false;

        Object.entries(voteCounts).forEach(([id, count]) => {
            if (count > maxVotes) {
                maxVotes = count;
                candidateId = id;
                isTie = false;
            } else if (count === maxVotes) {
                isTie = true;
            }
        });

        const targetName = players.find(p => p.id === candidateId)?.name || 'Unknown';

        // Prepare message for Modal
        if (isTie || !candidateId) {
            setResolveMessage({
                title: "No Elimination?",
                msg: "Vote result is a TIE or EMPTY. No one will be eliminated. End Day?"
            });
        } else {
            setResolveMessage({
                title: "Eliminate Player?",
                msg: `Player ${targetName} has the most votes (${maxVotes}). Eliminate them?`
            });
        }
        setResolveConfirm(true);
    };

    const confirmResolveDay = () => {
        // Calculate Logic reused for consistency
        const voteCounts = {};
        Object.keys(actions).forEach(key => {
            if (!key.endsWith('_submitted')) {
                const targetId = actions[key];
                voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
            }
        });

        let maxVotes = 0;
        let candidateId = null;
        let isTie = false;

        Object.entries(voteCounts).sort((a, b) => b[1] - a[1]).forEach(([id, count], index) => {
            if (index === 0) {
                maxVotes = count;
                candidateId = id;
            } else if (count === maxVotes) {
                isTie = true;
            }
        });

        let title = 'Day Report';
        let msg = '';
        let eliminatedId = null;

        if (isTie || !candidateId) {
            msg = "Vote result is a TIE or EMPTY. No one eliminated.";
        } else {
            const targetName = players.find(p => p.id === candidateId)?.name || 'Unknown';
            msg = `Town has voted to eliminate ${targetName}.`;
            eliminatedId = candidateId;
        }

        setReportData({ title, msg, eliminatedId });
        setResolveConfirm(false);
        setDayReportConfirm(true); // Show Report
    };

    const confirmEndDay = () => {
        onEndDay(reportData.eliminatedId);
        setDayReportConfirm(false);
    };

    // --- Helper ---

    const getVoteCounts = () => {
        const counts = {};
        Object.keys(actions).forEach(key => {
            if (!key.endsWith('_submitted')) {
                const targetId = actions[key];
                counts[targetId] = (counts[targetId] || 0) + 1;
            }
        });
        return counts;
    };

    const renderVotingList = () => {
        const candidates = players.filter(p => p.isAlive && p.role !== 'presenter');
        const voteCounts = getVoteCounts();

        // Host sees total votes, Player sees their own selection (local or remote)
        // If submitted, show what they voted for from DB. If not, show local selection.
        const myCurrentVote = isSubmitted ? actions[currentUser] : selectedTarget;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem', width: '100%', paddingBottom: '100px' }}>
                {candidates.map(p => {
                    const isSelected = myCurrentVote === p.id;
                    const count = voteCounts[p.id] || 0;

                    return (
                        <button
                            key={p.id}
                            onClick={() => !isHost && handleSelectTarget(p.id)}
                            disabled={!isAlive || isHost || isSubmitted}
                            style={{
                                appearance: 'none', border: 'none',
                                background: isSelected
                                    ? 'linear-gradient(90deg, rgba(var(--primary-rgb), 0.2), rgba(var(--primary-rgb), 0.1))'
                                    : 'rgba(255,255,255,0.03)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '1.5rem',
                                padding: '0.8rem 1.2rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                cursor: (isAlive && !isHost && !isSubmitted) ? 'pointer' : 'default',
                                border: isSelected ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                                opacity: isAlive ? 1 : 0.6
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    background: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold', color: isSelected ? '#fff' : 'var(--text-dim)'
                                }}>
                                    {p.name.charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontSize: '1.1rem', fontWeight: isSelected ? 600 : 400, color: isSelected ? 'var(--primary)' : 'var(--text)' }}>
                                    {p.name}
                                </span>
                            </div>

                            {/* Host sees vote counts */}
                            {isHost && count > 0 && (
                                <div style={{
                                    background: 'rgba(255,255,255,0.1)', color: 'var(--text)',
                                    borderRadius: '1rem', padding: '0.2rem 0.6rem',
                                    fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.3rem'
                                }}>
                                    <BarChart2 size={12} /> {count}
                                </div>
                            )}

                            {/* Selection check for voter */}
                            {!isHost && isSelected && (
                                <div style={{
                                    background: 'var(--primary)', color: 'white',
                                    borderRadius: '50%', width: '24px', height: '24px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {isSubmitted ? <Check size={14} /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        );
    };

    // --- Host View ---
    if (isHost) {
        // Calculate voting progress
        const aliveCount = players.filter(p => p.isAlive && p.role !== 'presenter').length;
        const votedCount = Object.keys(actions).filter(k => k.endsWith('_submitted')).length;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem', height: '100%', justifyContent: 'flex-start' }}>
                <div style={{ width: '100%', textAlign: 'center', marginBottom: '0.5rem' }}>
                    <h2 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '2px' }}>DAY {dayCount}</h2>
                    <p style={{ color: 'var(--text-dim)', fontSize: '1rem' }}>
                        Town Hall Voting
                    </p>
                </div>

                {/* Voting Status Dashboard */}
                <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1.5rem', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>
                        Live Status
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
                        <div>
                            <span style={{ fontSize: '2rem', fontWeight: 800, display: 'block', lineHeight: 1 }}>{votedCount}/{aliveCount}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Votes Cast</span>
                        </div>
                        <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }} />
                        <div>
                            <span style={{ fontSize: '2rem', fontWeight: 800, display: 'block', lineHeight: 1 }}>{aliveCount}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Alive</span>
                        </div>
                    </div>
                </div>

                {/* Player List (Spectator View) */}
                <div>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginLeft: '0.5rem', marginBottom: '0.5rem' }}>
                        Votes & Roles
                    </h3>

                    {/* Reusing the list logic but disabled for Host */}
                    <div className="custom-scrollbar" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {renderVotingList()}
                    </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: 'auto' }}>
                    <button
                        className="btn-primary"
                        onClick={handleResolveDay}
                        style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
                            fontSize: '1.1rem',
                            padding: '1rem'
                        }}
                    >
                        Resolve & End Day
                    </button>
                    <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                        Clicking this will automatically eliminate the most voted player.
                    </p>

                    <button
                        className="btn-ghost"
                        onClick={() => setResetConfirm(true)}
                        style={{
                            display: 'block',
                            margin: '1rem auto 0',
                            width: '100%',
                            color: 'var(--danger)',
                            borderColor: 'var(--danger)',
                            opacity: 0.8,
                            padding: '0.8rem'
                        }}
                    >
                        Reset Game
                    </button>

                    {/* Host Modals */}
                    <ConfirmationModal
                        isOpen={resolveConfirm}
                        onCancel={() => setResolveConfirm(false)}
                        onConfirm={confirmResolveDay}
                        title={resolveMessage.title}
                        message={resolveMessage.msg}
                        confirmText="Resolve & End Day"
                    />

                    <ConfirmationModal
                        isOpen={dayReportConfirm}
                        onCancel={() => setDayReportConfirm(false)}
                        onConfirm={confirmEndDay}
                        title={reportData.title}
                        message={reportData.msg}
                        confirmText="Start Night"
                    />

                    <ConfirmationModal
                        isOpen={resetConfirm}
                        onCancel={() => setResetConfirm(false)}
                        onConfirm={() => {
                            setResetConfirm(false);
                            onResetGame();
                        }}
                        title="Reset Game?"
                        message="This will take everyone back to the lobby, clear all roles, and restart from scratch."
                        confirmText="Reset Game"
                        isDanger={true}
                    />
                </div>
            </div>
        );
    }

    // --- Player View ---
    return (
        <div className="flex-col-center" style={{ padding: '1rem', height: '100%', justifyContent: 'flex-start' }}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <Sun size={48} color="var(--warning)" style={{ marginBottom: '1rem' }} />
                <h2 className="text-gradient">Day {dayCount}</h2>
                <p style={{ color: 'var(--text-dim)' }}>
                    Discuss and vote to eliminate a suspect.
                </p>
                {!isAlive && <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>(You are dead)</span>}
            </div>

            {renderVotingList()}

            {/* Submitted State */}
            {isSubmitted && (
                <div style={{
                    marginTop: '1rem', padding: '1rem', borderRadius: '1rem',
                    background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--success)',
                    color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '1rem'
                }}>
                    <Check size={24} />
                    <div>
                        <strong>Vote Submitted</strong>
                        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Waiting for others...</p>
                    </div>
                </div>
            )}

            {/* Sticky Submit Footer */}
            {!isSubmitted && isAlive && (
                <div style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0,
                    padding: '1.5rem', background: 'rgba(15, 15, 26, 0.95)',
                    backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', justifyContent: 'center', zIndex: 100
                }}>
                    <button
                        className="btn-primary"
                        disabled={!selectedTarget}
                        onClick={() => setShowConfirm(true)}
                        style={{
                            width: '100%', maxWidth: '400px',
                            background: !selectedTarget ? '#333' : 'linear-gradient(135deg, var(--secondary), var(--primary))',
                            opacity: !selectedTarget ? 0.5 : 1,
                            cursor: !selectedTarget ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            padding: '1rem', fontSize: '1.1rem'
                        }}
                    >
                        Confirm Vote
                    </button>
                </div>
            )}

            {/* Confirmation Popup */}
            {/* Confirmation Popup */}
            <ConfirmationModal
                isOpen={showConfirm}
                onCancel={() => setShowConfirm(false)}
                onConfirm={handleSubmitVote}
                title="Confirm Vote?"
                message={`Are you sure you want to vote for ${players.find(p => p.id === selectedTarget)?.name}? This cannot be changed later.`}
                confirmText="Yes, Vote"
            />
        </div>
    );
}

import { useState, useEffect } from 'react';
import { db } from '../../../../services/firebase';
import { doc, updateDoc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Shield, Search, Moon, Sun, Check, X, ThumbsUp, ThumbsDown, ArrowLeft } from 'lucide-react';
import ConfirmationModal from '../common/ConfirmationModal';

export default function ActionPhaseController({
    roomCode, players, currentUser, isHost, nightCount, gameId, onEndNight, onResetGame
}) {
    // Sub-phases: 'sleep', 'mafia', 'doctor', 'detective', 'results'
    const [subPhase, setSubPhase] = useState('sleep');
    const [actions, setActions] = useState({}); // Stores votes/actions for current night
    const [showConfirm, setShowConfirm] = useState(false); // Player Vote Confirmation
    const [showPhaseConfirm, setShowPhaseConfirm] = useState(false); // Host Phase Confirmation
    const [showNightReport, setShowNightReport] = useState(false); // Night Result Modal
    const [nightReportData, setNightReportData] = useState({ title: '', msg: '', killedId: null });
    const [ghostPhaseRequest, setGhostPhaseRequest] = useState(null); // Track which ghost phase to start
    const [activeBluffPhase, setActiveBluffPhase] = useState(null); // Track active bluffing phase
    const [showResetConfirm, setShowResetConfirm] = useState(false); // Host Reset Confirmation

    // My Player Info
    const myPlayer = players.find(p => p.id === currentUser);
    const myRole = myPlayer?.role; // 'mafia', 'godfather', 'doctor', etc.
    const isAlive = myPlayer?.isAlive;

    // Listen to Room Sub-phase & Actions
    useEffect(() => {
        const roomRef = doc(db, 'rooms', roomCode);
        const unsub = onSnapshot(roomRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                if (data.subPhase) setSubPhase(data.subPhase);
            }
        });

        const actionsRef = doc(db, 'rooms', roomCode, 'actions', `night_${nightCount}_${gameId || 'legacy'}`);
        const unsubActions = onSnapshot(actionsRef, (doc) => {
            if (doc.exists()) {
                setActions(doc.data() || {});
            }
        });

        return () => { unsub(); unsubActions(); };
    }, [roomCode, nightCount]);

    // --- Logic Helpers ---

    const getActiveMafiaMembers = () => {
        return players.filter(p => p.isAlive && (p.role === 'mafia' || p.role === 'godfather'));
    };

    const getMafiaVotes = () => {
        const votes = [];
        Object.entries(actions).forEach(([key, targetId]) => {
            if (key.startsWith('vote_mafia_') && key !== 'vote_mafia_submitted') {
                const voterId = key.replace('vote_mafia_', '');
                votes.push({ voterId, targetId });
            }
        });
        return votes;
    };

    const myVoteTargetId = subPhase === 'mafia'
        ? actions[`vote_mafia_${currentUser}`]
        : subPhase === 'doctor' ? actions[`action_doctor`]
            : actions[`action_detective`];

    // Check Consensus (Mafia specific)
    const checkConsensus = () => {
        if (subPhase !== 'mafia') return true;

        const activeMembers = getActiveMafiaMembers();
        const currentVotes = getMafiaVotes();

        // 1. All active members must have voted? 
        // User really just cares that they don't vote disparate people.

        const uniqueTargets = new Set(currentVotes.map(v => v.targetId));

        if (uniqueTargets.size > 1) return false; // Mismatch
        if (uniqueTargets.size === 0) return false; // No votes yet

        // Strict: Must match number of voters? No, just partial consensus is fine? 
        // User asked: "they shouldn't be allowed to vote out different person"
        // So if uniqueTargets > 1, block.

        return true;
    };

    // Additional Helper: Get "Waiting for" or "Mismatch" text
    const getConsensusStatus = () => {
        if (subPhase !== 'mafia') return null;

        const currentVotes = getMafiaVotes();
        const uniqueTargets = [...new Set(currentVotes.map(v => v.targetId))];

        if (uniqueTargets.size > 1) {
            return { status: 'mismatch', msg: 'Votes do not match! Please agree on one target.' };
        }

        if (uniqueTargets.size === 1) {
            const targetName = players.find(p => p.id === uniqueTargets[0])?.name || 'Unknown';
            return { status: 'pending', msg: `Targeting [${targetName}]` };
        }

        return { status: 'empty', msg: 'Discuss and select a target.' };
    };

    // --- Actions ---

    const updatePhase = async (phase, force = false) => {
        // Host Gatekeeping (Skip if force/ghost)
        if (!force) {
            if (subPhase === 'mafia' && !actions.mafia_submitted) {
                alert("Mafia has not submitted their action yet!");
                return;
            }
            if (subPhase === 'doctor' && !actions.doctor_submitted) {
                alert("Doctor has not submitted their action yet!");
                return;
            }
            if (subPhase === 'detective' && !actions.detective_submitted) {
                alert("Detective has not submitted their action yet!");
                return;
            }
        }

        await updateDoc(doc(db, 'rooms', roomCode), { subPhase: phase });
    };

    const resolveNight = () => {
        // Gatekeeping for final phase
        if (subPhase === 'detective' && !actions.detective_submitted) {
            alert("Detective has not submitted their action yet!");
            return;
        }
        if (subPhase === 'mafia' && !actions.mafia_submitted) { // edge case
            alert("Mafia has not submitted yet!");
            return;
        }

        // Gatekeeping: Ensure ALL phases are done
        if (!actions.mafia_submitted || !actions.doctor_submitted || !actions.detective_submitted) {
            alert("All phases (Mafia, Doctor, Detective) must be completed first!");
            return;
        }

        // Calculate Result for Report
        const mafiaTargetId = getMafiaVotes().length > 0 ? getMafiaVotes()[0].targetId : null; // Assuming consensus or first vote
        const doctorSaveId = actions.action_doctor;

        // Final check based on votes in DB
        // If we want robust consensus checking we should do it here, but let's assume UI forced validation
        // Fetch actual target from most voted or agreed
        let finalTargetId = null;
        const currentVotes = getMafiaVotes();
        if (currentVotes.length > 0) finalTargetId = currentVotes[0].targetId; // simplified

        let killedId = null;
        let msg = '';
        let title = 'Night Report';

        if (!finalTargetId) {
            msg = "Mafia did not select a target.";
        } else {
            const targetName = players.find(p => p.id === finalTargetId)?.name || 'Unknown';
            if (finalTargetId === doctorSaveId) {
                msg = `Mafia targeted ${targetName}, but the Doctor saved them! No one died.`;
            } else {
                msg = `${targetName} was killed by the Mafia.`;
                killedId = finalTargetId;
            }
        }

        setNightReportData({ title, msg, killedId });
        setShowNightReport(true);
    };

    const confirmEndNight = async () => {
        // If someone died, kill them in DB
        if (nightReportData.killedId) {
            await updateDoc(doc(db, 'rooms', roomCode, 'players', nightReportData.killedId), {
                isAlive: false
            });
        }
        setShowNightReport(false);
        onEndNight();
    };


    const handleSelectTarget = async (targetId) => {
        const actionRef = doc(db, 'rooms', roomCode, 'actions', `night_${nightCount}_${gameId || 'legacy'}`);
        const key = subPhase === 'mafia' ? `vote_mafia_${currentUser}`
            : subPhase === 'doctor' ? `action_doctor`
                : `action_detective`;

        // If submitted, prevent changing?
        const isSubmitted = subPhase === 'mafia' ? actions.mafia_submitted
            : subPhase === 'doctor' ? actions.doctor_submitted
                : actions.detective_submitted;

        if (isSubmitted) return;

        await setDoc(actionRef, { [key]: targetId }, { merge: true });
    };

    const handleSubmitAction = async () => {
        const actionRef = doc(db, 'rooms', roomCode, 'actions', `night_${nightCount}_${gameId || 'legacy'}`);
        let updateKey = '';

        if (subPhase === 'mafia') updateKey = 'mafia_submitted';
        else if (subPhase === 'doctor') updateKey = 'doctor_submitted';
        else if (subPhase === 'detective') updateKey = 'detective_submitted';

        await setDoc(actionRef, { [updateKey]: true }, { merge: true });
        setShowConfirm(false);
    };

    // --- Render Helpers ---

    const renderActionButtons = (filterFn) => {
        const targets = players.filter(p => p.isAlive && p.role !== 'presenter' && filterFn(p));
        const mafiaVotes = getMafiaVotes();

        // Disable interaction if submitted
        const isSubmitted = subPhase === 'mafia' ? actions.mafia_submitted
            : subPhase === 'doctor' ? actions.doctor_submitted
                : actions.detective_submitted;

        // Find my current selection
        let mySelectedTarget = null;
        if (subPhase === 'mafia') mySelectedTarget = actions?.[`vote_mafia_${currentUser}`];
        else if (subPhase === 'doctor') mySelectedTarget = actions?.[`action_doctor`];
        else if (subPhase === 'detective') mySelectedTarget = actions?.[`action_detective`];

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem', width: '100%', paddingBottom: '100px' }}>
                {targets.map(p => {
                    const isSelected = mySelectedTarget === p.id;
                    const primaryColor = subPhase === 'mafia' ? 'var(--danger)' : subPhase === 'doctor' ? 'var(--primary)' : 'var(--warning)';
                    const bgGradient = subPhase === 'mafia'
                        ? 'linear-gradient(90deg, rgba(220, 38, 38, 0.2), rgba(220, 38, 38, 0.1))'
                        : subPhase === 'doctor'
                            ? 'linear-gradient(90deg, rgba(37, 99, 235, 0.2), rgba(37, 99, 235, 0.1))'
                            : 'linear-gradient(90deg, rgba(234, 179, 8, 0.2), rgba(234, 179, 8, 0.1))';

                    // Teammate indicators (Mafia Only)
                    const teammateVoters = subPhase === 'mafia'
                        ? mafiaVotes.filter(v => v.targetId === p.id && v.voterId !== currentUser)
                        : [];

                    return (
                        <button
                            key={p.id}
                            onClick={() => !isSubmitted && handleSelectTarget(p.id)}
                            style={{
                                appearance: 'none', border: 'none',
                                background: isSelected ? bgGradient : 'rgba(255,255,255,0.03)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '1.5rem',
                                padding: '0.8rem 1.2rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                cursor: isSubmitted ? 'default' : 'pointer',
                                border: isSelected ? `1px solid ${primaryColor}` : '1px solid rgba(255,255,255,0.1)',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                                opacity: isSubmitted && !isSelected ? 0.5 : 1
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    background: isSelected ? primaryColor : 'rgba(255,255,255,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold', color: isSelected ? '#fff' : 'var(--text-dim)'
                                }}>
                                    {p.name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <span style={{ fontSize: '1.1rem', fontWeight: isSelected ? 600 : 400, color: isSelected ? primaryColor : 'var(--text)', display: 'block' }}>
                                        {p.name}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {/* Teammate Indicators */}
                                {teammateVoters.length > 0 && (
                                    <div style={{ display: 'flex', marginLeft: 'auto', marginRight: isSelected ? '0.5rem' : 0 }}>
                                        {teammateVoters.map((v, i) => {
                                            const voterName = players.find(pl => pl.id === v.voterId)?.name;
                                            return (
                                                <div key={i} title={`Voted by ${voterName}`} style={{
                                                    width: '24px', height: '24px', borderRadius: '50%',
                                                    background: '#555', border: '1px solid #222',
                                                    color: '#fff', fontSize: '0.6rem', fontWeight: 'bold',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    marginLeft: i > 0 ? '-8px' : '0'
                                                }}>
                                                    {voterName?.charAt(0)}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {isSelected && (
                                    <div style={{
                                        background: primaryColor, color: '#fff',
                                        borderRadius: '50%', width: '24px', height: '24px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Check size={16} />
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        );
    };

    // --- Views ---

    // 1. Host/Presenter View
    if (isHost) {
        // Helper to check submission
        const isPhaseSubmitted = (p) => {
            if (p === 'mafia') return !!actions.mafia_submitted;
            if (p === 'doctor') return !!actions.doctor_submitted;
            if (p === 'detective') return !!actions.detective_submitted;
            return false;
        };

        const currentPhaseSubmitted = isPhaseSubmitted(subPhase);

        // Check overall progress for navigation
        const allPhasesDone = isPhaseSubmitted('mafia') && isPhaseSubmitted('doctor') && isPhaseSubmitted('detective');

        // Find next incomplete phase
        const phases = ['mafia', 'doctor', 'detective'];
        const nextIncompletePhase = phases.find(p => !isPhaseSubmitted(p));

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem', height: '100%', justifyContent: 'flex-start' }}>
                <div style={{ width: '100%', textAlign: 'center', marginBottom: '0.5rem' }}>
                    <h2 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '2px' }}>NIGHT {nightCount}</h2>
                    <p style={{ color: 'var(--text-dim)', fontSize: '1rem' }}>
                        Current Phase: <strong style={{ color: 'var(--primary)', textTransform: 'uppercase' }}>{subPhase}</strong>
                    </p>
                    {!currentPhaseSubmitted && subPhase !== 'sleep' && (
                        <div style={{
                            marginTop: '0.5rem', display: 'inline-block',
                            padding: '0.3rem 0.8rem', borderRadius: '1rem',
                            background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            fontSize: '0.8rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center'
                        }}>
                            <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }}></span>
                            Waiting for {subPhase} to submit...
                        </div>
                    )}
                </div>

                {/* Phase Control Bar */}
                <div
                    className="glass-panel"
                    style={{
                        padding: '1rem',
                        borderRadius: '1.5rem',
                        display: 'flex',
                        gap: '0.8rem',
                        overflowX: 'auto',
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(26, 26, 46, 0.6)'
                    }}
                >
                    {['mafia', 'doctor', 'detective'].map(phase => {
                        const isActive = subPhase === phase;
                        const isDone = isPhaseSubmitted(phase);
                        const color = phase === 'mafia' ? 'var(--danger)' : phase === 'doctor' ? 'var(--primary)' : 'var(--warning)';
                        const icon = phase === 'mafia' ? <Skull size={18} /> : phase === 'doctor' ? <Shield size={18} /> : <Search size={18} />;

                        const hasActivePlayer = players.some(p => p.role === phase && p.isAlive) || (phase === 'mafia' && players.some(p => (p.role === 'mafia' || p.role === 'godfather') && p.isAlive));

                        return (
                            <button
                                key={phase}
                                onClick={() => {
                                    if (!hasActivePlayer) {
                                        // Ghost Phase Trigger
                                        setGhostPhaseRequest(phase);
                                    } else {
                                        updatePhase(phase);
                                    }
                                }}
                                disabled={isActive}
                                style={{
                                    flex: 1,
                                    appearance: 'none',
                                    border: isActive ? `1px solid ${color}` : isDone ? `1px solid ${color}44` : '1px solid rgba(255,255,255,0.1)',
                                    background: isActive ? `linear-gradient(135deg, ${color}22, ${color}11)` : 'rgba(255,255,255,0.03)',
                                    borderRadius: '1rem',
                                    padding: '0.8rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    color: isActive ? '#fff' : isDone ? 'var(--text)' : 'var(--text-dim)',
                                    cursor: isActive ? 'default' : 'pointer',
                                    transition: 'all 0.2s ease',
                                    minWidth: '80px',
                                    position: 'relative',
                                    opacity: !hasActivePlayer && !isActive ? 0.6 : 1
                                }}
                            >
                                <div style={{ color: isActive || isDone ? color : 'inherit' }}>{icon}</div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>{phase}</span>
                                {!hasActivePlayer && <span style={{ fontSize: '0.6rem', color: 'var(--danger)' }}>(DEAD)</span>}
                                {isDone && (
                                    <div style={{ position: 'absolute', top: '5px', right: '5px' }}>
                                        <Check size={12} color={color} />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Live Dashboard Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginLeft: '0.5rem' }}>
                        Live Actions
                    </h3>

                    {/* Mafia Card */}
                    <div className="glass-panel" style={{ padding: '1.2rem', borderRadius: '1.2rem', borderLeft: '4px solid var(--danger)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                            <h4 style={{ color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                <Skull size={16} color="var(--danger)" /> Mafia Target
                            </h4>
                            {actions.mafia_submitted && <Check size={16} color="var(--success)" />}
                        </div>

                        {Object.keys(actions).filter(k => k.startsWith('vote_mafia_') && k !== 'vote_mafia_submitted').length === 0 ? (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>Waiting for votes...</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {Object.entries(actions).filter(([k]) => k.startsWith('vote_mafia_') && k !== 'vote_mafia_submitted').map(([k, targetId]) => {
                                    const voter = players.find(p => p.id === k.replace('vote_mafia_', ''));
                                    const target = players.find(p => p.id === targetId);
                                    return (
                                        <div key={k} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            background: 'rgba(220, 38, 38, 0.1)', padding: '0.5rem 0.8rem', borderRadius: '0.5rem'
                                        }}>
                                            <span style={{ fontSize: '0.85rem' }}>{voter?.name}</span>
                                            <ArrowLeft size={12} style={{ opacity: 0.5 }} />
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--danger)' }}>{target?.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Doctor Card */}
                    <div className="glass-panel" style={{ padding: '1.2rem', borderRadius: '1.2rem', borderLeft: '4px solid var(--primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                            <h4 style={{ color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                <Shield size={16} color="var(--primary)" /> Doctor Save
                            </h4>
                            {actions.doctor_submitted && <Check size={16} color="var(--success)" />}
                        </div>
                        {actions.action_doctor ? (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                background: 'rgba(37, 99, 235, 0.1)', padding: '0.5rem 0.8rem', borderRadius: '0.5rem'
                            }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Protected:</span>
                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>
                                    {players.find(p => p.id === actions.action_doctor)?.name}
                                </span>
                            </div>
                        ) : <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>Pending...</p>}
                    </div>

                    {/* Detective Card */}
                    <div className="glass-panel" style={{ padding: '1.2rem', borderRadius: '1.2rem', borderLeft: '4px solid var(--warning)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                            <h4 style={{ color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                <Search size={16} color="var(--warning)" /> Investigation
                            </h4>
                            {actions.detective_submitted && <Check size={16} color="var(--success)" />}
                        </div>
                        {actions.action_detective ? (
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                background: 'rgba(234, 179, 8, 0.1)', padding: '0.5rem 0.8rem', borderRadius: '0.5rem'
                            }}>
                                <div>
                                    <span style={{ fontSize: '0.85rem', display: 'block' }}>Subject: <strong>{players.find(p => p.id === actions.action_detective)?.name}</strong></span>
                                </div>
                                <span style={{
                                    fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                                    color: 'var(--warning)', border: '1px solid var(--warning)', padding: '2px 6px', borderRadius: '4px'
                                }}>
                                    {players.find(p => p.id === actions.action_detective)?.role === 'godfather' ? 'CITIZEN' : players.find(p => p.id === actions.action_detective)?.role}
                                </span>
                            </div>
                        ) : <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>Pending...</p>}
                    </div>
                </div>

                {/* Player Roster */}
                <div>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginLeft: '0.5rem', marginBottom: '0.5rem' }}>
                        Player Status
                    </h3>
                    <div className="custom-scrollbar" style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {players.filter(p => p.role !== 'presenter').map(p => (
                            <div key={p.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem',
                                background: 'rgba(255,255,255,0.03)', borderRadius: '0.8rem',
                                border: '1px solid rgba(255,255,255,0.05)',
                                opacity: p.isAlive ? 1 : 0.5
                            }}>
                                <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{p.name}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{
                                        fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                                        color: p.roleData?.color || '#999'
                                    }}>
                                        {p.role}
                                    </span>
                                    {!p.isAlive && <Skull size={14} color="var(--text-dim)" />}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Host Modal for Detective Investigation (Godfather OR Standard) */}
                <AnimatePresence>
                    {subPhase === 'detective' && actions.detective_submitted && !actions.detective_result && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{
                                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
                                zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
                            }}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                                className="glass-panel"
                                style={{
                                    width: '100%', maxWidth: '400px', padding: '2rem', borderRadius: '1.5rem',
                                    textAlign: 'center', border: '1px solid var(--warning)',
                                    background: 'rgba(20, 20, 30, 0.95)'
                                }}
                            >
                                <Search size={48} color="var(--warning)" style={{ marginBottom: '1rem' }} />

                                {players.find(p => p.id === actions.action_detective)?.role === 'godfather' ? (
                                    <>
                                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Godfather Investigated!</h3>
                                        <p style={{ marginBottom: '2rem', opacity: 0.8 }}>
                                            The Detective has chosen the Godfather. <br />
                                            What result should they see?
                                        </p>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <button
                                                className="btn-glass"
                                                onClick={() => setDoc(doc(db, 'rooms', roomCode, 'actions', `night_${nightCount}_${gameId || 'legacy'}`), { detective_result: 'thumbs_up' }, { merge: true })}
                                                style={{ border: '1px solid var(--danger)', padding: '1.5rem', flexDirection: 'column', gap: '0.5rem' }}
                                            >
                                                <ThumbsUp size={32} color="var(--danger)" />
                                                <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Show Guilty</span>
                                            </button>
                                            <button
                                                className="btn-glass"
                                                onClick={() => setDoc(doc(db, 'rooms', roomCode, 'actions', `night_${nightCount}_${gameId || 'legacy'}`), { detective_result: 'thumbs_down' }, { merge: true })}
                                                style={{ border: '1px solid var(--success)', padding: '1.5rem', flexDirection: 'column', gap: '0.5rem' }}
                                            >
                                                <ThumbsDown size={32} color="var(--success)" />
                                                <span style={{ color: 'var(--success)', fontWeight: 600 }}>Show Innocent</span>
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Standard Investigation</h3>
                                        <p style={{ marginBottom: '2rem', opacity: 0.8 }}>
                                            Detective chose: <strong>{players.find(p => p.id === actions.action_detective)?.name}</strong>
                                        </p>
                                        {(() => {
                                            const target = players.find(p => p.id === actions.action_detective);
                                            const isMafia = target?.role === 'mafia';
                                            return (
                                                <div style={{ marginBottom: '2rem' }}>
                                                    <div style={{
                                                        background: isMafia ? 'rgba(220, 38, 38, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                                                        padding: '1rem', borderRadius: '1rem',
                                                        border: isMafia ? '1px solid var(--danger)' : '1px solid var(--success)'
                                                    }}>
                                                        <h4 style={{ margin: 0, color: isMafia ? 'var(--danger)' : 'var(--success)', textTransform: 'uppercase' }}>
                                                            Actual Role: {target?.role}
                                                        </h4>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                                                            {isMafia ? <ThumbsUp size={32} /> : <ThumbsDown size={32} />}
                                                            <span>Show {isMafia ? 'THUMBS UP' : 'THUMBS DOWN'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                        <button
                                            className="btn-primary"
                                            onClick={() => {
                                                const target = players.find(p => p.id === actions.action_detective);
                                                const result = target?.role === 'mafia' ? 'thumbs_up' : 'thumbs_down';
                                                setDoc(doc(db, 'rooms', roomCode, 'actions', `night_${nightCount}_${gameId || 'legacy'}`), { detective_result: result }, { merge: true });
                                            }}
                                            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                                        >
                                            Confirm Signal Shown
                                        </button>
                                    </>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: 'auto' }}>

                    {/* Smart Navigation Button */}
                    {!allPhasesDone ? (
                        <button
                            className="btn-primary"
                            onClick={() => {
                                if (nextIncompletePhase) updatePhase(nextIncompletePhase);
                            }}
                            style={{
                                width: '100%',
                                background: 'linear-gradient(135deg, var(--secondary), var(--primary))',
                                fontSize: '1.1rem', padding: '1rem'
                            }}
                        >
                            Go to {nextIncompletePhase ? nextIncompletePhase.toUpperCase() : 'Next'} Phase
                        </button>
                    ) : (
                        <button
                            className="btn-primary"
                            onClick={() => setShowPhaseConfirm(true)}
                            style={{
                                width: '100%',
                                background: 'linear-gradient(135deg, var(--success), var(--primary))', // Greenish to indicate ready
                                fontSize: '1.1rem', padding: '1rem'
                            }}
                        >
                            End Night Phase
                        </button>
                    )}

                    <button
                        className="btn-ghost"
                        onClick={() => setShowResetConfirm(true)}
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

                    {/* Modals */}
                    <ConfirmationModal
                        isOpen={showPhaseConfirm}
                        onCancel={() => setShowPhaseConfirm(false)}
                        onConfirm={() => {
                            setShowPhaseConfirm(false);
                            resolveNight();
                        }}
                        title={subPhase === 'detective' ? 'End Night Phase?' : 'Next Phase?'}
                        message={`Proceed to ${subPhase === 'detective' ? 'Night Report' : 'next action'}?`}
                        confirmText="Proceed"
                    />

                    <ConfirmationModal
                        isOpen={showNightReport}
                        onCancel={() => setShowNightReport(false)}
                        onConfirm={confirmEndNight}
                        title={nightReportData.title}
                        message={nightReportData.msg}
                        confirmText="Start Day"
                    />

                    <ConfirmationModal
                        isOpen={!!ghostPhaseRequest}
                        onCancel={() => setGhostPhaseRequest(null)}
                        onConfirm={() => {
                            updatePhase(ghostPhaseRequest, true); // Force update
                            setGhostPhaseRequest(null);
                            setActiveBluffPhase(ghostPhaseRequest); // Open Bluff Modal
                        }}
                        title={`Start ${ghostPhaseRequest?.toUpperCase()} Phase?`}
                        message={`The ${ghostPhaseRequest} is eliminated. Do you want to start a "Ghost Phase" to bluff the players?`}
                        confirmText="Start Ghost Phase"
                    />

                    {/* Active Bluffing Modal */}
                    <ConfirmationModal
                        isOpen={!!activeBluffPhase}
                        onCancel={() => { }} // Can't cancel, must conclude
                        onConfirm={async () => {
                            // Conclude Bluff: Mark as submitted
                            const phase = activeBluffPhase;
                            const actionRef = doc(db, 'rooms', roomCode, 'actions', `night_${nightCount}_${gameId || 'legacy'}`);
                            let updateKey = '';
                            if (phase === 'mafia') updateKey = 'mafia_submitted';
                            else if (phase === 'doctor') updateKey = 'doctor_submitted';
                            else if (phase === 'detective') updateKey = 'detective_submitted';

                            await setDoc(actionRef, { [updateKey]: true }, { merge: true });
                            setActiveBluffPhase(null);
                        }}
                        title={`Bluffing ${activeBluffPhase?.toUpperCase()}...`}
                        message="The players are waiting. Pretend to manage the phase..."
                        confirmText="Conclude Bluff"
                        isDanger={false}
                    />

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
            </div>
        );
    }

    // 2. Active Player View (If Role Matches Phase)
    const isMyTurn = (subPhase === 'mafia' && (myRole === 'mafia' || myRole === 'godfather')) ||
        (subPhase === 'doctor' && myRole === 'doctor') ||
        (subPhase === 'detective' && myRole === 'detective');

    if (isMyTurn && isAlive) {

        // Consensus Logic for UI
        const consensus = getConsensusStatus();
        const canSubmit = myVoteTargetId && (subPhase !== 'mafia' || (checkConsensus()));
        const isSubmitted = subPhase === 'mafia' ? actions.mafia_submitted
            : subPhase === 'doctor' ? actions.doctor_submitted
                : actions.detective_submitted;

        return (
            <div className="flex-col-center" style={{ padding: '2rem', paddingBottom: '120px' }}>
                <h2 className="text-gradient">Wake Up!</h2>
                <p style={{ marginBottom: '1rem' }}>It's your turn to act.</p>

                {subPhase === 'mafia' && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <Skull size={32} color="var(--danger)" />
                            <h3 style={{ margin: 0 }}>Eliminate Target</h3>
                        </div>

                        {/* Consensus Banner */}
                        {consensus && !isSubmitted && (
                            <div style={{
                                width: '100%', padding: '0.8rem', marginBottom: '1rem', borderRadius: '1rem',
                                background: consensus.status === 'mismatch' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(255,255,255,0.05)',
                                border: consensus.status === 'mismatch' ? '1px solid var(--danger)' : '1px solid rgba(255,255,255,0.1)',
                                color: consensus.status === 'mismatch' ? 'var(--danger)' : 'var(--text)',
                                textAlign: 'center', fontSize: '0.9rem', fontWeight: 600
                            }}>
                                {consensus.status === 'mismatch' && <X size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />}
                                {consensus.msg}
                            </div>
                        )}

                        {renderActionButtons(p => p.id !== currentUser)}
                    </>
                )}

                {subPhase === 'doctor' && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <Shield size={32} color="var(--primary)" />
                            <h3 style={{ margin: 0 }}>Save Player</h3>
                        </div>
                        {renderActionButtons(() => true)}
                    </>
                )}

                {subPhase === 'detective' && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <Search size={32} color="var(--warning)" />
                            <h3 style={{ margin: 0 }}>Investigate Validity</h3>
                        </div>
                        {renderActionButtons(p => p.id !== currentUser)}
                    </>
                )}

                {/* Submitted State */}
                {isSubmitted && subPhase !== 'detective' && (
                    <div style={{
                        marginTop: '2rem', padding: '1rem', borderRadius: '1rem',
                        background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--success)',
                        color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '1rem'
                    }}>
                        <Check size={24} />
                        <div>
                            <strong>Decision Submitted</strong>
                            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Waiting for night to end...</p>
                        </div>
                    </div>
                )}

                {/* Detective Result Display */}
                {isSubmitted && subPhase === 'detective' && (
                    <div style={{ marginTop: '2rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {(() => {
                            const target = players.find(p => p.id === myVoteTargetId);
                            if (!actions.detective_result) return (
                                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', width: '100%' }}>
                                    <div className="spinner" style={{ margin: '0 auto 1rem', width: '30px', height: '30px' }}></div>
                                    <p style={{ fontWeight: 600 }}>Analyzing Evidence...</p>
                                    <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.5rem' }}>(The Host is verifying...)</p>
                                </div>
                            );

                            // Parse Result
                            let resultType = 'innocent';
                            if (actions.detective_result === 'thumbs_up') resultType = 'guilty';
                            if (actions.detective_result === 'thumbs_down') resultType = 'innocent';

                            return (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                    className="glass-panel"
                                    style={{
                                        padding: '2rem', textAlign: 'center', width: '100%',
                                        border: resultType === 'guilty' ? '2px solid var(--danger)' : '2px solid var(--success)',
                                        background: resultType === 'guilty' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(34, 197, 94, 0.1)'
                                    }}
                                >
                                    {resultType === 'guilty' ? (
                                        <>
                                            <ThumbsUp size={64} color="var(--danger)" style={{ marginBottom: '1rem' }} />
                                            <h3 style={{ color: 'var(--danger)', fontSize: '1.5rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>IS MAFIA</h3>
                                        </>
                                    ) : (
                                        <>
                                            <ThumbsDown size={64} color="var(--success)" style={{ marginBottom: '1rem' }} />
                                            <h3 style={{ color: 'var(--success)', fontSize: '1.5rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>NOT MAFIA</h3>
                                        </>
                                    )}
                                </motion.div>
                            );
                        })()}
                    </div>
                )}

                {/* Sticky Submit Footer */}
                {!isSubmitted && (
                    <div style={{
                        position: 'fixed', bottom: 0, left: 0, right: 0,
                        padding: '1.5rem', background: 'rgba(15, 15, 26, 0.95)',
                        backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', justifyContent: 'center', zIndex: 100
                    }}>
                        <button
                            className="btn-primary"
                            disabled={!canSubmit}
                            onClick={() => setShowConfirm(true)}
                            style={{
                                width: '100%', maxWidth: '400px',
                                background: !canSubmit ? '#333' : 'linear-gradient(135deg, var(--secondary), var(--primary))',
                                opacity: !canSubmit ? 0.5 : 1,
                                cursor: !canSubmit ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                padding: '1rem', fontSize: '1.1rem'
                            }}
                        >
                            Confirm Decision
                        </button>
                    </div>
                )}

                {/* Confirmation Popup */}
                <ConfirmationModal
                    isOpen={showConfirm}
                    onCancel={() => setShowConfirm(false)}
                    onConfirm={handleSubmitAction}
                    title="Confirm Action?"
                    message={
                        subPhase === 'mafia' ? `Are you sure you want to eliminate ${players.find(p => p.id === myVoteTargetId)?.name}?` :
                            subPhase === 'doctor' ? `Are you sure you want to save ${players.find(p => p.id === myVoteTargetId)?.name}?` :
                                `Are you sure you want to investigate ${players.find(p => p.id === myVoteTargetId)?.name}?`
                    }
                    confirmText="Yes, Confirm"
                />
            </div>
        );
    }

    // 3. Sleeping Player View
    return (
        <div className="flex-col-center" style={{ height: '80vh' }}>
            <Moon size={64} style={{ color: 'var(--text-dim)', marginBottom: '2rem' }} />
            <h2 style={{ color: 'var(--text-dim)' }}>Night Phase</h2>
            <p>Close your eyes...</p>
        </div>
    );
}

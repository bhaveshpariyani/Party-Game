import { useState, useEffect } from 'react';
import { db } from '../../../../services/firebase';
import { doc, updateDoc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Shield, Search, Moon, Sun, Check, X, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function ActionPhaseController({
    roomCode, players, currentUser, isHost, nightCount, onEndNight
}) {
    // Sub-phases: 'sleep', 'mafia', 'doctor', 'detective', 'results'
    const [subPhase, setSubPhase] = useState('sleep');
    const [actions, setActions] = useState({}); // Stores votes/actions for current night

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

        const actionsRef = doc(db, 'rooms', roomCode, 'actions', `night_${nightCount}`);
        const unsubActions = onSnapshot(actionsRef, (doc) => {
            if (doc.exists()) {
                setActions(doc.data());
            }
        });

        return () => { unsub(); unsubActions(); };
    }, [roomCode, nightCount]);

    // --- Host Functions ---

    const updatePhase = async (phase) => {
        await updateDoc(doc(db, 'rooms', roomCode), { subPhase: phase });
    };

    const resolveNight = () => {
        // Here we could calculate results automatically or just let Presenter decide.
        // For now, we transition to Day.
        onEndNight();
    };

    // --- Player Actions ---

    const submitAction = async (targetId) => {
        // Write to actions/night_X
        // Key: active role (mafia, doctor) -> target
        // For Mafia, it's a collective vote or individual? User said "Mafia/Godfather vote".
        // Let's store individual votes: `votes_mafia_{playerId}: targetId`
        // Or simplified: `action_{role}: targetId` (if we assume 1 doctor/detective).
        // For Mafia, multiple people might vote.

        const actionRef = doc(db, 'rooms', roomCode, 'actions', `night_${nightCount}`);
        const key = subPhase === 'mafia' ? `vote_mafia_${currentUser}`
            : subPhase === 'doctor' ? `action_doctor`
                : `action_detective`;

        await setDoc(actionRef, { [key]: targetId }, { merge: true });
    };

    // --- Render Helpers ---

    // --- Render Helpers ---

    const renderActionButtons = (filterFn, actionKeyPrefix) => {
        const targets = players.filter(p => p.isAlive && p.role !== 'presenter' && filterFn(p));

        // Find who I voted for
        let mySelectedTarget = null;
        if (subPhase === 'mafia') {
            mySelectedTarget = actions?.[`vote_mafia_${currentUser}`];
        } else if (subPhase === 'doctor') {
            mySelectedTarget = actions?.[`action_doctor`];
        } else if (subPhase === 'detective') {
            mySelectedTarget = actions?.[`action_detective`];
        }

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem', width: '100%' }}>
                {targets.map(p => {
                    const isSelected = mySelectedTarget === p.id;
                    const primaryColor = subPhase === 'mafia' ? 'var(--danger)' : subPhase === 'doctor' ? 'var(--primary)' : 'var(--warning)';
                    const bgGradient = subPhase === 'mafia'
                        ? 'linear-gradient(90deg, rgba(220, 38, 38, 0.2), rgba(220, 38, 38, 0.1))'
                        : subPhase === 'doctor'
                            ? 'linear-gradient(90deg, rgba(37, 99, 235, 0.2), rgba(37, 99, 235, 0.1))'
                            : 'linear-gradient(90deg, rgba(234, 179, 8, 0.2), rgba(234, 179, 8, 0.1))';

                    return (
                        <button
                            key={p.id}
                            onClick={() => submitAction(p.id)}
                            style={{
                                appearance: 'none', border: 'none',
                                background: isSelected ? bgGradient : 'rgba(255,255,255,0.03)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '1.5rem',
                                padding: '0.8rem 1.2rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                cursor: 'pointer',
                                border: isSelected ? `1px solid ${primaryColor}` : '1px solid rgba(255,255,255,0.1)',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                transform: isSelected ? 'scale(1.02)' : 'scale(1)'
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
                                <span style={{ fontSize: '1.1rem', fontWeight: isSelected ? 600 : 400, color: isSelected ? primaryColor : 'var(--text)' }}>
                                    {p.name}
                                </span>
                            </div>

                            {isSelected && (
                                <div style={{
                                    background: primaryColor, color: '#fff',
                                    borderRadius: '50%', width: '24px', height: '24px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Check size={16} />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        );
    };

    // --- Views ---

    // 1. Host/Presenter View
    if (isHost) {
        return (
            <div className="flex-col-center" style={{ gap: '1rem', padding: '1rem', height: '100%', justifyContent: 'flex-start' }}>
                <div style={{ width: '100%', textAlign: 'center', marginBottom: '1rem' }}>
                    <h2 className="text-gradient" style={{ fontSize: '2rem' }}>Night {nightCount}</h2>
                    <p style={{ color: 'var(--text-dim)' }}>Current Phase: <strong style={{ color: 'var(--primary)' }}>{subPhase.toUpperCase()}</strong></p>
                </div>

                {/* Control Panel */}
                <div className="glass-panel" style={{ padding: '1rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>Phase Control</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Mafia Row */}
                        <button
                            onClick={() => updatePhase('mafia')}
                            disabled={subPhase === 'mafia'}
                            style={{
                                appearance: 'none', border: 'none',
                                background: subPhase === 'mafia'
                                    ? 'linear-gradient(90deg, rgba(220, 38, 38, 0.15), rgba(220, 38, 38, 0.05))'
                                    : 'rgba(255,255,255,0.02)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '1.5rem',
                                padding: '1rem 1.5rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                cursor: subPhase === 'mafia' ? 'default' : 'pointer',
                                border: subPhase === 'mafia' ? '1px solid var(--danger)' : '1px solid rgba(255,255,255,0.1)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: subPhase === 'mafia' ? '0 8px 32px rgba(220, 38, 38, 0.2)' : 'none',
                                transform: subPhase === 'mafia' ? 'scale(1.02)' : 'scale(1)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    background: subPhase === 'mafia' ? 'var(--danger)' : 'rgba(255,255,255,0.1)',
                                    padding: '0.8rem', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: subPhase === 'mafia' ? '#fff' : 'var(--text-dim)',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <Skull size={24} />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: subPhase === 'mafia' ? 'var(--danger)' : 'var(--text)' }}>
                                        Mafia Phase
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                        {subPhase === 'mafia' ? 'Active: Voting in progress...' : 'Tap to wake Mafia'}
                                    </p>
                                </div>
                            </div>
                            {subPhase === 'mafia' && (
                                <div style={{
                                    padding: '0.4rem 0.8rem', background: 'var(--danger)', color: '#fff',
                                    borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 'bold'
                                }}>
                                    ACTIVE
                                </div>
                            )}
                        </button>

                        {/* Doctor Row */}
                        <button
                            onClick={() => updatePhase('doctor')}
                            disabled={subPhase === 'doctor'}
                            style={{
                                appearance: 'none', border: 'none',
                                background: subPhase === 'doctor'
                                    ? 'linear-gradient(90deg, rgba(37, 99, 235, 0.15), rgba(37, 99, 235, 0.05))'
                                    : 'rgba(255,255,255,0.02)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '1.5rem',
                                padding: '1rem 1.5rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                cursor: subPhase === 'doctor' ? 'default' : 'pointer',
                                border: subPhase === 'doctor' ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: subPhase === 'doctor' ? '0 8px 32px rgba(37, 99, 235, 0.2)' : 'none',
                                transform: subPhase === 'doctor' ? 'scale(1.02)' : 'scale(1)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    background: subPhase === 'doctor' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                    padding: '0.8rem', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: subPhase === 'doctor' ? '#fff' : 'var(--text-dim)',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <Shield size={24} />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: subPhase === 'doctor' ? 'var(--primary)' : 'var(--text)' }}>
                                        Doctor Phase
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                        {subPhase === 'doctor' ? 'Active: Saving a player...' : 'Tap to wake Doctor'}
                                    </p>
                                </div>
                            </div>
                            {subPhase === 'doctor' && (
                                <div style={{
                                    padding: '0.4rem 0.8rem', background: 'var(--primary)', color: '#fff',
                                    borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 'bold'
                                }}>
                                    ACTIVE
                                </div>
                            )}
                        </button>

                        {/* Detective Row */}
                        <button
                            onClick={() => updatePhase('detective')}
                            disabled={subPhase === 'detective'}
                            style={{
                                appearance: 'none', border: 'none',
                                background: subPhase === 'detective'
                                    ? 'linear-gradient(90deg, rgba(234, 179, 8, 0.15), rgba(234, 179, 8, 0.05))'
                                    : 'rgba(255,255,255,0.02)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '1.5rem',
                                padding: '1rem 1.5rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                cursor: subPhase === 'detective' ? 'default' : 'pointer',
                                border: subPhase === 'detective' ? '1px solid var(--warning)' : '1px solid rgba(255,255,255,0.1)',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: subPhase === 'detective' ? '0 8px 32px rgba(234, 179, 8, 0.2)' : 'none',
                                transform: subPhase === 'detective' ? 'scale(1.02)' : 'scale(1)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    background: subPhase === 'detective' ? 'var(--warning)' : 'rgba(255,255,255,0.1)',
                                    padding: '0.8rem', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: subPhase === 'detective' ? '#fff' : 'var(--text-dim)',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <Search size={24} />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: subPhase === 'detective' ? 'var(--warning)' : 'var(--text)' }}>
                                        Detective Phase
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                        {subPhase === 'detective' ? 'Active: Investigating...' : 'Tap to wake Detective'}
                                    </p>
                                </div>
                            </div>
                            {subPhase === 'detective' && (
                                <div style={{
                                    padding: '0.4rem 0.8rem', background: 'var(--warning)', color: '#fff',
                                    borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 'bold'
                                }}>
                                    ACTIVE
                                </div>
                            )}
                        </button>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '0.5rem', paddingTop: '1rem' }}>
                        <button className="btn-primary" onClick={resolveNight} style={{ width: '100%', background: 'linear-gradient(135deg, var(--secondary), var(--primary))' }}>
                            End Night Phase
                        </button>
                    </div>
                </div>

                {/* Dashboard of Actions - Realtime Feedback */}
                <div className="card-glass" style={{ width: '100%', marginTop: '0.5rem', textAlign: 'left', padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                        Live Actions
                    </h3>

                    {/* Mafia Votes */}
                    <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1rem' }}>
                        <h4 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Skull size={18} /> Mafia Votes
                        </h4>
                        {Object.keys(actions).filter(k => k.startsWith('vote_mafia')).length === 0 ? (
                            <p style={{ fontSize: '0.9rem', opacity: 0.5, fontStyle: 'italic' }}>No votes yet</p>
                        ) : (
                            Object.entries(actions).filter(([k]) => k.startsWith('vote_mafia')).map(([k, targetId]) => {
                                const voterId = k.replace('vote_mafia_', '');
                                const voter = players.find(p => p.id === voterId);
                                const target = players.find(p => p.id === targetId);
                                return (
                                    <div key={k} style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                        <span style={{ fontWeight: 600 }}>{voter?.name}</span>
                                        <span style={{ opacity: 0.7 }}>voted</span>
                                        <strong style={{ color: 'var(--danger)' }}>{target?.name}</strong>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Doctor Action */}
                    <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1rem' }}>
                        <h4 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Shield size={18} /> Doctor Save
                        </h4>
                        {actions.action_doctor ? (
                            <div style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>Saved:</span>
                                <strong style={{ color: 'var(--primary)' }}>{players.find(p => p.id === actions.action_doctor)?.name}</strong>
                            </div>
                        ) : <span style={{ fontSize: '0.8rem', opacity: 0.5, fontStyle: 'italic' }}>Pending...</span>}
                    </div>

                    {/* Detective Action */}
                    <div className="glass-panel" style={{ padding: '1rem' }}>
                        <h4 style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Search size={18} /> Detective Check
                        </h4>
                        {actions.action_detective ? (
                            <div style={{ fontSize: '0.9rem' }}>
                                <span>Checked: </span>
                                <strong style={{ color: 'var(--warning)' }}>{players.find(p => p.id === actions.action_detective)?.name}</strong>
                                <div style={{ marginTop: '0.2rem', padding: '0.2rem 0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', display: 'inline-block' }}>
                                    Result: <span style={{ fontWeight: 'bold' }}>
                                        {players.find(p => p.id === actions.action_detective)?.role === 'godfather'
                                            ? 'Citizen (GF)'
                                            : players.find(p => p.id === actions.action_detective)?.role}
                                    </span>
                                </div>
                            </div>
                        ) : <span style={{ fontSize: '0.8rem', opacity: 0.5, fontStyle: 'italic' }}>Pending...</span>}
                    </div>
                </div>

                {/* Presenter Role List View */}
                {/* Presenter Role List View */}
                <div className="card-glass" style={{ width: '100%', marginTop: '1rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Player Roles</h3>
                    <div className="custom-scrollbar" style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {players.map(p => (
                            <div key={p.id} className="glass-panel" style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem',
                                opacity: p.isAlive ? 1 : 0.6,
                                borderLeft: `4px solid ${p.roleData?.color || '#555'}`
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 600, fontSize: '1rem' }}>{p.name}</span>
                                    {!p.isAlive && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>ELIMINATED</span>}
                                </div>
                                <div style={{
                                    background: p.roleData?.color || '#555',
                                    color: '#fff',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '1rem',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase'
                                }}>
                                    {p.role || 'Unknown'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // 2. Active Player View (If Role Matches Phase)
    const isMyTurn = (subPhase === 'mafia' && (myRole === 'mafia' || myRole === 'godfather')) ||
        (subPhase === 'doctor' && myRole === 'doctor') ||
        (subPhase === 'detective' && myRole === 'detective');

    if (isMyTurn && isAlive) {
        return (
            <div className="flex-col-center" style={{ padding: '2rem' }}>
                <h2 className="text-gradient">Wake Up!</h2>
                <p style={{ marginBottom: '1rem' }}>It's your turn to act.</p>

                {subPhase === 'mafia' && (
                    <>
                        <Skull size={48} color="var(--danger)" />
                        <h3>Who do you want to eliminate?</h3>
                        {renderActionButtons(p => p.id !== currentUser)} {/* Can't kill self? Usually yes but let's assume not */}
                    </>
                )}

                {subPhase === 'doctor' && (
                    <>
                        <Shield size={48} color="var(--primary)" />
                        <h3>Who do you want to save?</h3>
                        {renderActionButtons(() => true)} {/* Can save anyone including self */}
                    </>
                )}

                {subPhase === 'detective' && (
                    <>
                        <Search size={48} color="var(--warning)" />
                        <h3>Who do you want to investigate?</h3>
                        {renderActionButtons(p => p.id !== currentUser)}
                        {/* Need to show result here after submission... or wait for Host? 
                            User said: "Show thumbs up/down". 
                            We need a state for "Result Received".
                        */}
                    </>
                )}
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

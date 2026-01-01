import { useState, useEffect } from 'react';
import { db } from '../../../../services/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { Skull, Sun, UserX } from 'lucide-react';

export default function DayPhaseController({
    roomCode, players, currentUser, isHost, dayCount, onEndDay
}) {
    // Actions: { [voterId]: targetId }
    const [votes, setVotes] = useState({});

    // Listen to Day Votes
    useEffect(() => {
        const actionsRef = doc(db, 'rooms', roomCode, 'actions', `day_${dayCount}`);
        const unsub = onSnapshot(actionsRef, (doc) => {
            if (doc.exists()) {
                setVotes(doc.data());
            }
        });
        return () => unsub();
    }, [roomCode, dayCount]);

    // My Status
    const myPlayer = players.find(p => p.id === currentUser);
    const isAlive = myPlayer?.isAlive;
    const myVote = votes[currentUser];

    // --- Actions ---

    const handleVote = async (targetId) => {
        if (!isAlive) return;
        const actionsRef = doc(db, 'rooms', roomCode, 'actions', `day_${dayCount}`);
        await setDoc(actionsRef, { [currentUser]: targetId }, { merge: true });
    };

    const handleEliminate = (targetId) => {
        if (confirm("Are you sure you want to eliminate this player?")) {
            onEndDay(targetId);
        }
    };

    // --- Helper ---

    // Count votes
    const voteCounts = {};
    Object.values(votes).forEach(targetId => {
        voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    });

    const renderVotingList = () => {
        const candidates = players.filter(p => p.isAlive);
        return (

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem', width: '100%' }}>
                {candidates.map(p => {
                    const isSelected = myVote === p.id;
                    const count = voteCounts[p.id] || 0;
                    return (
                        <button
                            key={p.id}
                            onClick={() => handleVote(p.id)}
                            disabled={!isAlive}
                            style={{
                                appearance: 'none', border: 'none',
                                background: isSelected
                                    ? 'linear-gradient(90deg, rgba(var(--primary-rgb), 0.2), rgba(var(--primary-rgb), 0.1))'
                                    : 'rgba(255,255,255,0.03)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '1.5rem',
                                padding: '0.8rem 1.2rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                cursor: isAlive ? 'pointer' : 'not-allowed',
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
                                    background: 'var(--danger)', color: 'white',
                                    borderRadius: '1rem', padding: '0.2rem 0.6rem',
                                    fontSize: '0.8rem', fontWeight: 'bold'
                                }}>
                                    {count} Votes
                                </div>
                            )}

                            {/* Selection check for voter */}
                            {!isHost && isSelected && (
                                <div style={{
                                    background: 'var(--primary)', color: 'white',
                                    borderRadius: '50%', width: '24px', height: '24px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Sun size={14} />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        );

    };

    return (
        <div className="flex-col-center" style={{ padding: '1rem', height: '100%', justifyContent: 'flex-start' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <Sun size={48} color="var(--warning)" style={{ marginBottom: '1rem' }} />
                <h2 className="text-gradient">Day {dayCount}</h2>
                <p style={{ color: 'var(--text-dim)' }}>
                    discuss and vote to eliminate someone.
                </p>
                {!isAlive && <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>(You are dead)</span>}
            </div>

            {renderVotingList()}

            {/* Host Controls: Show Elimination Options if votes exist */}
            {isHost && (
                <>
                    <div className="card-glass" style={{ marginTop: '2rem', width: '100%' }}>
                        <h3>Presenter Control</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
                            Select player to eliminate to end the day.
                        </p>
                        <div className="grid-2-col" style={{ gap: '0.5rem' }}>
                            {players.filter(p => p.isAlive).map(p => (
                                <button
                                    key={p.id}
                                    className="btn-sm"
                                    style={{ border: '1px solid var(--danger)', color: 'var(--danger)' }}
                                    onClick={() => handleEliminate(p.id)}
                                >
                                    <UserX size={14} style={{ marginRight: '4px' }} /> Eliminate {p.name}
                                </button>
                            ))}
                            <button
                                className="btn-sm"
                                style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}
                                onClick={() => onEndDay(null)} // No one eliminated
                            >
                                End Day (No Elimination)
                            </button>
                        </div>
                    </div>

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
                </>
            )}
        </div>
    );
}

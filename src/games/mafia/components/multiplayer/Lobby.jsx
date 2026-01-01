import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Copy, ArrowLeft, Plus, LogIn, Play, Settings } from 'lucide-react';
import ConfirmationModal from '../common/ConfirmationModal';

export default function Lobby({ roomCode, players, isHost, onCreate, onJoin, onBack, onStartSetup, currentUser }) {
    const [mode, setMode] = useState('menu'); // menu, join, create
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [showStartConfirm, setShowStartConfirm] = useState(false);

    // If already in a room (roomCode exists), show Waiting Room
    if (roomCode) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%', paddingBottom: '1rem' }}>
                <div
                    className="glass-panel"
                    style={{
                        width: '100%',
                        textAlign: 'center',
                        padding: '1.5rem',
                        borderRadius: '1.5rem',
                        background: 'rgba(26, 26, 46, 0.6)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', letterSpacing: '1px', marginBottom: '0.5rem' }}>ROOM CODE</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                        <h1 className="text-gradient" style={{ fontSize: '3.5rem', letterSpacing: '8px', lineHeight: 1, fontWeight: 800 }}>{roomCode}</h1>
                        <button
                            onClick={() => navigator.clipboard.writeText(roomCode)}
                            className="btn-icon"
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                padding: '0.5rem',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                color: 'white'
                            }}
                        >
                            <Copy size={20} />
                        </button>
                    </div>
                </div>

                <div
                    className="glass-panel"
                    style={{
                        width: '100%',
                        flex: 1,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '1.5rem',
                        borderRadius: '1.5rem',
                        background: 'rgba(26, 26, 46, 0.6)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.2rem' }}>Players</h3>
                        <span style={{
                            background: 'rgba(255,255,255,0.1)',
                            padding: '0.2rem 0.8rem',
                            borderRadius: '1rem',
                            fontSize: '0.8rem'
                        }}>
                            {players.length} joined
                        </span>
                    </div>

                    <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {players.map(p => (
                            <div key={p.id} style={{
                                padding: '0.8rem',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '0.8rem',
                                display: 'flex', alignItems: 'center', gap: '1rem',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                }}>
                                    {p.name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontWeight: 500 }}>{p.name}</span>
                                    {p.isHost && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: '#fbbf24' }}>★ HOST</span>}
                                </div>
                                {p.id === currentUser && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>You</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {isHost ? (
                    <>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn-primary"
                            style={{
                                width: '100%',
                                padding: '1.2rem',
                                fontSize: '1.1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
                            }}
                            onClick={() => setShowStartConfirm(true)}
                        >
                            <Settings size={20} />
                            Start Role Setup
                        </motion.button>

                        <ConfirmationModal
                            isOpen={showStartConfirm}
                            onCancel={() => setShowStartConfirm(false)}
                            onConfirm={() => {
                                setShowStartConfirm(false);
                                onStartSetup();
                            }}
                            title="Start Game Setup?"
                            message="This will lock the lobby and prevent new players from joining."
                            confirmText="Start Setup"
                        />
                    </>
                ) : (
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '1rem',
                        textAlign: 'center',
                        border: '1px dashed rgba(255,255,255,0.2)'
                    }}>
                        <p style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                            Waiting for host to start setup...
                        </p>
                    </div>
                )}
            </div>
        );
    }

    // Initial Menu
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <ArrowLeft style={{ cursor: 'pointer' }} onClick={onBack} />
                <h2>Multiplayer Lobby</h2>
            </div>

            {mode === 'menu' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        onClick={() => setMode('create')}
                        className="glass-panel"
                        style={{
                            width: '100%', padding: '2rem',
                            display: 'flex', alignItems: 'center', gap: '1.5rem',
                            cursor: 'pointer', textAlign: 'left',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '1.5rem',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        whileHover={{ scale: 1.02, translateY: -2, backgroundColor: 'rgba(255,255,255,0.08)' }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div style={{
                            padding: '1.5rem',
                            background: 'rgba(34, 197, 94, 0.15)', // Green-ish
                            borderRadius: '50%',
                            color: '#4ade80',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 20px rgba(34, 197, 94, 0.2)'
                        }}>
                            <Plus size={36} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: 600 }}>Create Room</h2>
                            <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                                Start a new game lobby as host.
                            </p>
                        </div>
                    </motion.button>

                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        onClick={() => setMode('join')}
                        className="glass-panel"
                        style={{
                            width: '100%', padding: '2rem',
                            display: 'flex', alignItems: 'center', gap: '1.5rem',
                            cursor: 'pointer', textAlign: 'left',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '1.5rem',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        whileHover={{ scale: 1.02, translateY: -2, backgroundColor: 'rgba(255,255,255,0.08)' }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div style={{
                            padding: '1.5rem',
                            background: 'rgba(59, 130, 246, 0.15)', // Blue-ish
                            borderRadius: '50%',
                            color: '#60a5fa',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)'
                        }}>
                            <LogIn size={36} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: 600 }}>Join Room</h2>
                            <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                                Enter a code to join friends.
                            </p>
                        </div>
                    </motion.button>
                </div>
            )}

            {mode === 'create' && (
                <div
                    className="glass-panel"
                    style={{
                        padding: '2rem',
                        borderRadius: '1.5rem',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(26, 26, 46, 0.8)',
                    }}
                >
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Create Room</h3>
                    <div className="input-group">
                        <label style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Your Name</label>
                        <input
                            type="text"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '1rem',
                                color: 'white',
                                outline: 'none',
                                fontSize: '1rem'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button
                            className="btn-ghost"
                            style={{
                                flex: 1,
                                borderRadius: '1rem',
                                border: '1px solid rgba(255,255,255,0.2)'
                            }}
                            onClick={() => setMode('menu')}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn-primary"
                            style={{
                                flex: 2,
                                borderRadius: '1rem',
                                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
                            }}
                            onClick={() => onCreate(name)}
                        >
                            Create Room
                        </button>
                    </div>
                </div>
            )}

            {mode === 'join' && (
                <div
                    className="glass-panel"
                    style={{
                        padding: '2rem',
                        borderRadius: '1.5rem',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(26, 26, 46, 0.8)',
                    }}
                >
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Join Room</h3>
                    <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Your Name</label>
                        <input
                            type="text"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '1rem',
                                color: 'white',
                                outline: 'none',
                                fontSize: '1rem'
                            }}
                        />
                    </div>
                    <div className="input-group">
                        <label style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Room Code</label>
                        <input
                            type="text"
                            placeholder="6-digit code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '1rem',
                                color: 'white',
                                outline: 'none',
                                fontSize: '1rem',
                                letterSpacing: '2px'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button
                            className="btn-ghost"
                            style={{
                                flex: 1,
                                borderRadius: '1rem',
                                border: '1px solid rgba(255,255,255,0.2)'
                            }}
                            onClick={() => setMode('menu')}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn-primary"
                            style={{
                                flex: 2,
                                borderRadius: '1rem',
                                background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
                                boxShadow: '0 4px 15px rgba(6, 182, 212, 0.4)'
                            }}
                            onClick={() => onJoin(name, code)}
                        >
                            Join Room
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

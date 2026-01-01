import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Copy, ArrowLeft } from 'lucide-react';

export default function Lobby({ roomCode, players, isHost, onCreate, onJoin, onBack, onStartSetup, currentUser }) {
    const [mode, setMode] = useState('menu'); // menu, join, create
    const [name, setName] = useState('');
    const [code, setCode] = useState('');

    // If already in a room (roomCode exists), show Waiting Room
    if (roomCode) {
        return (
            <div className="flex-col-center" style={{ gap: '2rem', height: '100%' }}>
                <div className="card-glass" style={{ width: '100%', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-dim)' }}>ROOM CODE</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                        <h1 className="text-gradient" style={{ fontSize: '3rem', letterSpacing: '5px' }}>{roomCode}</h1>
                        <Copy
                            size={24}
                            style={{ cursor: 'pointer', opacity: 0.7 }}
                            onClick={() => navigator.clipboard.writeText(roomCode)}
                        />
                    </div>
                </div>

                <div className="card-glass" style={{ width: '100%', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <h3>Players ({players.length})</h3>
                    <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', marginTop: '1rem' }}>
                        {players.map(p => (
                            <div key={p.id} style={{
                                padding: '1rem',
                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                display: 'flex', alignItems: 'center', gap: '1rem'
                            }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold'
                                }}>
                                    {p.name.charAt(0).toUpperCase()}
                                </div>
                                <span>{p.name} {p.isHost && '(Host)'} {p.id === currentUser && '(You)'}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {isHost ? (
                    <button className="btn-primary" style={{ width: '100%' }} onClick={onStartSetup}>
                        Start Role Setup
                    </button>
                ) : (
                    <p style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
                        Waiting for host to start...
                    </p>
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
                <>
                    <button className="btn-primary" onClick={() => setMode('create')}>Create Room</button>
                    <button className="btn-primary" onClick={() => setMode('join')}>Join Room</button>
                </>
            )}

            {mode === 'create' && (
                <div className="card-glass fade-in">
                    <h3>Create Room</h3>
                    <div className="input-group">
                        <label>Your Name</label>
                        <input
                            type="text"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input-glass"
                            style={{ width: '100%', padding: '1rem', marginTop: '0.5rem' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button
                            className="btn-primary"
                            style={{
                                flex: 1,
                                background: 'linear-gradient(135deg, #FF512F 0%, #DD2476 100%)', // Vibrant Red-Pink gradient
                                boxShadow: '0 4px 15px rgba(221, 36, 118, 0.3)',
                                border: 'none'
                            }}
                            onClick={() => setMode('menu')}
                        >
                            Cancel
                        </button>
                        <button className="btn-primary" style={{ flex: 1 }} onClick={() => onCreate(name)}>Create</button>
                    </div>
                </div>
            )}

            {mode === 'join' && (
                <div className="card-glass fade-in">
                    <h3>Join Room</h3>
                    <div className="input-group">
                        <label>Your Name</label>
                        <input
                            type="text"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input-glass"
                            style={{ width: '100%', padding: '1rem', marginTop: '0.5rem' }}
                        />
                    </div>
                    <div className="input-group">
                        <label>Room Code</label>
                        <input
                            type="text"
                            placeholder="Enter Room Code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="input-glass"
                            style={{ width: '100%', padding: '1rem', marginTop: '0.5rem' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button
                            className="btn-primary"
                            style={{
                                flex: 1,
                                background: 'linear-gradient(135deg, #FF512F 0%, #DD2476 100%)', // Vibrant Red-Pink gradient
                                boxShadow: '0 4px 15px rgba(221, 36, 118, 0.3)',
                                border: 'none'
                            }}
                            onClick={() => setMode('menu')}
                        >
                            Cancel
                        </button>
                        <button className="btn-primary" style={{ flex: 1 }} onClick={() => onJoin(name, code)}>Join</button>
                    </div>
                </div>
            )}
        </div>
    );
}

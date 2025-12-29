import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Home, Eye, EyeOff, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardScreen({ assignments, onNewGame }) {
    const [timeLeft, setTimeLeft] = useState(0); // in seconds
    const [isActive, setIsActive] = useState(false);
    const [customTime, setCustomTime] = useState('60');
    const [showRoles, setShowRoles] = useState(false);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(timeLeft => timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(parseInt(customTime) || 0);
    };

    const handleCustomTimeChange = (e) => {
        const val = e.target.value;
        setCustomTime(val);
        // Only update real timer if not active?
        if (!isActive) {
            setTimeLeft(parseInt(val) || 0);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="dashboard-screen" style={{ paddingBottom: '4rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem', textAlign: 'center' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--text-dim)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Timer</h3>

                <div style={{ fontSize: '3.5rem', fontFamily: 'monospace', fontWeight: 'bold', marginBottom: '1rem', color: timeLeft < 10 && timeLeft > 0 ? 'var(--danger)' : 'white' }}>
                    {formatTime(timeLeft)}
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Set (s):</span>
                        <input
                            type="number"
                            value={customTime}
                            onChange={handleCustomTimeChange}
                            style={{
                                width: '60px',
                                background: 'transparent',
                                border: 'none',
                                color: 'white',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                borderBottom: '1px solid var(--text-dim)'
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button onClick={toggleTimer} className="btn-primary" style={{ borderRadius: '50%', width: '56px', height: '56px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px var(--primary-glow)' }}>
                        {isActive ? <Pause size={28} /> : <Play size={28} fill="white" style={{ marginLeft: '4px' }} />}
                    </button>
                    <button onClick={resetTimer} className="btn-ghost" style={{ borderRadius: '50%', width: '56px', height: '56px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <RotateCcw size={24} />
                    </button>
                </div>
            </div>

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: 'var(--text-dim)', paddingLeft: '0.5rem', margin: 0 }}>Player Roles</h3>
                <button
                    onClick={() => setShowRoles(!showRoles)}
                    className="btn-ghost"
                    style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                >
                    {showRoles ? <EyeOff size={18} /> : <Eye size={18} />}
                    {showRoles ? 'Hide' : 'Show'}
                </button>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {assignments.map((a, i) => (
                    <div key={i} className="glass-panel" style={{ padding: '1rem', borderRadius: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{a.player}</span>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: a.roleData.color,
                            filter: showRoles ? 'none' : 'blur(8px)',
                            transition: 'filter 0.3s',
                            userSelect: showRoles ? 'auto' : 'none'
                        }}>
                            <a.roleData.icon size={20} />
                            <span style={{ fontWeight: 500 }}>{a.roleData.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button onClick={onNewGame} className="btn-ghost" style={{ width: '100%', borderStyle: 'dashed' }}>
                    Start New Game
                </button>
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <button className="btn-ghost" style={{ width: '100%', borderColor: 'transparent', color: 'var(--text-dim)' }}>
                        <Home size={18} style={{ marginRight: '0.5rem', verticalAlign: 'text-bottom' }} /> Return Home
                    </button>
                </Link>
            </div>
        </div>
    );
}

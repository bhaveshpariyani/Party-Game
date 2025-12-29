import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ArrowRight, Trophy, BarChart2 } from 'lucide-react';
import ScorepadScreen from './ScorepadScreen';

export default function RoundInputScreen({ roundNum, players, onSubmit, initialTrump, rounds, settings }) {
    const [trump, setTrump] = useState(initialTrump || '');
    const [inputs, setInputs] = useState({});
    const [showScoreboard, setShowScoreboard] = useState(false);

    useEffect(() => {
        // Initialize
        const initial = {};
        players.forEach((_, i) => {
            initial[i] = { prediction: '', won: false };
        });
        setInputs(initial);
    }, [players]);

    const handlePredictionChange = (idx, val) => {
        setInputs(prev => ({
            ...prev,
            [idx]: { ...prev[idx], prediction: val }
        }));
    };

    const toggleWon = (idx) => {
        setInputs(prev => ({
            ...prev,
            [idx]: { ...prev[idx], won: !prev[idx].won }
        }));
    };

    const handleFinish = () => {
        onSubmit({ trump, inputs });
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: 'calc(100vh - 40px)' // Account for padding
                }}
            >
                <header style={{ flex: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 className="text-gradient">Game {roundNum}</h2>
                    <button
                        onClick={() => setShowScoreboard(true)}
                        className="btn-ghost"
                        style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                    >
                        <BarChart2 size={20} /> Scoreboard
                    </button>
                </header>

                {/* Trump Input */}
                <div className="glass-panel" style={{ flex: 'none', padding: '1rem', borderRadius: '0.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-dim)' }}>Trump Card:</span>
                    <input
                        type="text"
                        placeholder="e.g. Hearts"
                        value={trump}
                        onChange={(e) => setTrump(e.target.value)}
                        style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--surface-highlight)', color: 'white', flex: 1, padding: '0.5rem', outline: 'none' }}
                    />
                </div>

                {/* Player List - Scrollable */}
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {players.map((player, i) => {
                        const pData = inputs[i] || { prediction: '', won: false };
                        return (
                            <div key={i} className="glass-panel" style={{ padding: '1rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                                    <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{player}</span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                    {/* Prediction Box */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.2rem' }}>Predict</label>
                                        <input
                                            type="number"
                                            value={pData.prediction}
                                            placeholder="0"
                                            onChange={(e) => handlePredictionChange(i, e.target.value)}
                                            // Make sure focus selects all
                                            onFocus={(e) => e.target.select()}
                                            style={{
                                                width: '50px',
                                                padding: '0.5rem',
                                                borderRadius: '0.5rem',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                background: 'rgba(0,0,0,0.2)',
                                                color: 'white',
                                                textAlign: 'center',
                                                fontSize: '1.2rem',
                                                fontWeight: 'bold'
                                            }}
                                        />
                                    </div>

                                    {/* Success Slider/Toggle */}
                                    <div
                                        onClick={() => toggleWon(i)}
                                        style={{
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            opacity: pData.prediction === '' ? 0.5 : 1
                                        }}
                                    >
                                        <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.4rem' }}>{pData.won ? 'Won' : 'Fail'}</label>
                                        <div style={{
                                            width: '50px',
                                            height: '28px',
                                            background: pData.won ? 'var(--success)' : 'var(--surface-highlight)',
                                            borderRadius: '99px',
                                            position: 'relative',
                                            transition: 'background 0.3s'
                                        }}>
                                            <motion.div
                                                animate={{ x: pData.won ? 24 : 2 }}
                                                style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    background: 'white',
                                                    borderRadius: '50%',
                                                    position: 'absolute',
                                                    top: '2px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                {pData.won ? <Check size={14} color="var(--success)" /> : <X size={14} color="var(--text-dim)" />}
                                            </motion.div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Finish Button - Fixed height but moves with container flow if flex-none, effectively acts as footer */}
                <div style={{ flex: 'none', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button
                        onClick={handleFinish}
                        className="btn-primary"
                        style={{
                            width: '100%',
                            padding: '1rem',
                            fontSize: '1.2rem',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        Finish Game <Trophy size={20} />
                    </button>
                </div>
            </motion.div>

            {/* Scoreboard Overlay */}
            <AnimatePresence>
                {showScoreboard && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'var(--background)' }}>
                        <div style={{ height: '100%', overflowY: 'auto', padding: '2rem' }}>
                            <ScorepadScreen
                                players={players}
                                rounds={rounds}
                                settings={settings}
                                onEndGame={() => setShowScoreboard(false)} // Acts as Close button
                                isOverlay={true}
                            />
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

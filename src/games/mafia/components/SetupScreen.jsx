import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Users, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

export default function SetupScreen({ onNext }) {
    const [names, setNames] = useState(['', '']); // Start with 2 empty slots

    const handleChange = (index, value) => {
        const newNames = [...names];
        newNames[index] = value;
        setNames(newNames);
    };

    const addPlayer = () => {
        setNames([...names, '']);
    };

    const removePlayer = (index) => {
        if (names.length <= 2) return;
        const newNames = names.filter((_, i) => i !== index);
        setNames(newNames);
    };

    const isValid = names.filter(n => n.trim().length > 0).length >= 2; // Min 2 players? Mafia usually needs more, but for logic 2 is min.
    // Actually Mafia needs more, but we let user decide.

    const handleNext = () => {
        const validNames = names.map(n => n.trim()).filter(n => n.length > 0);
        if (validNames.length < 2) return;
        onNext(validNames);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="setup-screen"
        >
            <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h2 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Add Players</h2>
                <p style={{ color: 'var(--text-dim)' }}>Enter names of all participants</p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                {names.map((name, index) => (
                    <motion.div
                        key={index}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="player-input-row"
                        style={{ display: 'flex', gap: '0.5rem' }}
                    >
                        <input
                            type="text"
                            placeholder={`Player ${index + 1}`}
                            value={name}
                            onChange={(e) => handleChange(index, e.target.value)}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                padding: '0.75rem 1rem',
                                borderRadius: '0.5rem',
                                color: 'white',
                                width: '100%',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') addPlayer();
                            }}
                        />
                        {names.length > 2 && (
                            <button
                                onClick={() => removePlayer(index)}
                                style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: 'var(--danger)',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    width: '3rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={20} />
                            </button>
                        )}
                    </motion.div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                    onClick={addPlayer}
                    className="btn-ghost"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={20} /> Add Player
                </button>

                <button
                    onClick={handleNext}
                    className="btn-primary"
                    disabled={!isValid}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        opacity: isValid ? 1 : 0.5,
                        cursor: isValid ? 'pointer' : 'not-allowed'
                    }}
                >
                    Next <ArrowRight size={20} />
                </button>
            </div>
        </motion.div>
    );
}

import { useState } from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { Plus, X, ArrowRight, Settings, GripVertical, Trash2 } from 'lucide-react';

export default function SetupScreen({ onStart }) {
    const [names, setNames] = useState(['Player 1', 'Player 2']);
    const [scoringType, setScoringType] = useState('prepend'); // prepend, append, simple
    const [configValues, setConfigValues] = useState({
        prependVal: 1,
        appendVal: 0
    });

    // Trump State
    const [trumps, setTrumps] = useState([
        { id: 'h', text: 'Hearts' },
        { id: 'd', text: 'Diamonds' },
        { id: 'c', text: 'Clubs' },
        { id: 's', text: 'Spades' },
        { id: 'n', text: 'No Trump' }
    ]);

    const addTrump = () => {
        const id = Math.random().toString(36).substr(2, 9);
        setTrumps([...trumps, { id, text: 'New Trump' }]);
    };

    const removeTrump = (id) => {
        setTrumps(trumps.filter(t => t.id !== id));
    };

    const updateTrump = (id, text) => {
        setTrumps(trumps.map(t => t.id === id ? { ...t, text } : t));
    };

    const handleStart = () => {
        const validNames = names.map(n => n.trim()).filter(n => n.length > 0);
        if (validNames.length < 2) return;

        // Pass complete config
        const settings = {
            type: scoringType,
            prependVal: parseInt(configValues.prependVal) || 1,
            appendVal: parseInt(configValues.appendVal) || 0,
            trumps: trumps.map(t => t.text) // Pass just the names
        };

        onStart(validNames, settings);
    };

    const addPlayer = () => setNames([...names, `Player ${names.length + 1}`]);
    const updateName = (i, val) => {
        const newNames = [...names];
        newNames[i] = val;
        setNames(newNames);
    };
    const removePlayer = (i) => setNames(names.filter((_, idx) => idx !== i));

    const handleFocus = (e) => e.target.select();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -20 }}
            className="setup-screen"
        >
            <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h2 className="text-gradient" style={{ fontSize: '2.5rem' }}>Judgement Setup</h2>
                <p style={{ color: 'var(--text-dim)' }}>Add players and configure rules</p>
            </header>

            {/* Players List */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ marginBottom: '1rem' }}>Players</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {names.map((name, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                value={name}
                                onChange={(e) => updateName(i, e.target.value)}
                                onFocus={handleFocus}
                                style={{
                                    flex: 1,
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '0.8rem',
                                    borderRadius: '0.5rem',
                                    color: 'white'
                                }}
                            />
                            {names.length > 2 && (
                                <button onClick={() => removePlayer(i)} className="btn-icon" style={{ color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                    <X />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <button onClick={addPlayer} className="btn-ghost" style={{ marginTop: '1rem', borderStyle: 'dashed', width: '100%' }}>
                    <Plus size={18} style={{ marginRight: '0.5rem' }} /> Add Player
                </button>
            </div>

            {/* Scoring Config */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Settings size={18} /> Scoring Rules
                </h3>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {[
                        { id: 'prepend', label: 'Prepend Mode' },
                        { id: 'append', label: 'Append Mode' },
                    ].map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => setScoringType(opt.id)}
                            style={{
                                background: scoringType === opt.id ? 'var(--primary)' : 'transparent',
                                border: `1px solid ${scoringType === opt.id ? 'var(--primary)' : 'var(--surface-highlight)'}`,
                                color: 'white',
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                flex: 1
                            }}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Configuration Inputs */}
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '0.5rem' }}>
                    {scoringType === 'prepend' && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <label style={{ fontWeight: 'bold' }}>Prepend Value</label>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Adds this digit before score (e.g. 1 - 13)</p>
                            </div>
                            <input
                                type="number"
                                value={configValues.prependVal}
                                onChange={(e) => setConfigValues({ ...configValues, prependVal: e.target.value })}
                                style={{ width: '60px', padding: '0.5rem', borderRadius: '0.3rem', border: 'none', textAlign: 'center' }}
                            />
                        </div>
                    )}

                    {scoringType === 'append' && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <label style={{ fontWeight: 'bold' }}>Append Value</label>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Appends this digit (e.g. 0 - 30)</p>
                            </div>
                            <input
                                type="number"
                                value={configValues.appendVal}
                                onChange={(e) => setConfigValues({ ...configValues, appendVal: e.target.value })}
                                style={{ width: '60px', padding: '0.5rem', borderRadius: '0.3rem', border: 'none', textAlign: 'center' }}
                            />
                        </div>
                    )}
                </div>

                <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                    {scoringType === 'prepend' && `Formula: ${configValues.prependVal}0 + Bid. (Example: Bid 3 = ${parseInt(configValues.prependVal || 0) * 10 + 3})`}
                    {scoringType === 'append' && `Formula: Bid × 10 + ${configValues.appendVal}. (Example: Bid 3 = ${30 + parseInt(configValues.appendVal || 0)})`}
                </p>
            </div>

            {/* Trump Cards Config */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Trump Order</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
                    Drag to reorder. These will cycle automatically each round.
                </p>

                <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    <Reorder.Group axis="y" values={trumps} onReorder={setTrumps} style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {trumps.map((trump) => (
                            <TrumpItem
                                key={trump.id}
                                trump={trump}
                                updateTrump={updateTrump}
                                removeTrump={removeTrump}
                                handleFocus={handleFocus}
                            />
                        ))}
                    </Reorder.Group>
                </div>

                <button onClick={addTrump} className="btn-ghost" style={{ marginTop: '1rem', borderStyle: 'dashed', width: '100%' }}>
                    <Plus size={18} style={{ marginRight: '0.5rem' }} /> Add Trump Card
                </button>
            </div>

            <button onClick={handleStart} className="btn-primary" style={{ width: '100%', fontSize: '1.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                Start Game <ArrowRight />
            </button>
        </motion.div>
    );
}

function TrumpItem({ trump, updateTrump, removeTrump, handleFocus }) {
    const controls = useDragControls();

    return (
        <Reorder.Item
            value={trump}
            dragListener={false}
            dragControls={controls}
            style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', padding: '0.5rem' }}
        >
            <div
                onPointerDown={(e) => controls.start(e)}
                style={{ cursor: 'grab', marginRight: '0.5rem', touchAction: 'none', padding: '0.5rem' }}
            >
                <GripVertical size={20} style={{ color: 'var(--text-dim)' }} />
            </div>
            <input
                value={trump.text}
                onChange={(e) => updateTrump(trump.id, e.target.value)}
                onFocus={handleFocus}
                style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', fontSize: '1rem', outline: 'none' }}
            />
            <button onClick={() => removeTrump(trump.id)} className="btn-icon" style={{ color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <Trash2 size={18} />
            </button>
        </Reorder.Item>
    );
}

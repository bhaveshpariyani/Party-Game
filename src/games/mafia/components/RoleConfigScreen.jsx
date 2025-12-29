import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, ArrowRight, ArrowLeft, Users, User, Shield, Search, Zap, Skull, Mic, Trash2, HelpCircle, Crown } from 'lucide-react';
import clsx from 'clsx';

const AVAILABLE_ROLES = [
    { id: 'villager', label: 'Villager', icon: User, color: '#10b981' },
    { id: 'mafia', label: 'Mafia', icon: Skull, color: '#ef4444' },
    { id: 'doctor', label: 'Doctor', icon: Shield, color: '#3b82f6' },
    { id: 'detective', label: 'Detective', icon: Search, color: '#f59e0b' },
    { id: 'godfather', label: 'Godfather', icon: Crown, color: '#8b5cf6' },
    { id: 'presenter', label: 'Presenter', icon: Mic, color: '#ec4899' },
];

export default function RoleConfigScreen({ players, onNext, onBack }) {
    const [counts, setCounts] = useState({});
    const [customRoles, setCustomRoles] = useState([]); // [{ id, label, count }]
    const [newRoleName, setNewRoleName] = useState('');

    // Initialize counts
    useEffect(() => {
        const initial = {};
        AVAILABLE_ROLES.forEach(r => initial[r.id] = 0);
        setCounts(initial);
    }, []);

    // Calculate totals
    const standardTotal = Object.values(counts).reduce((a, b) => a + b, 0);
    const customTotal = customRoles.reduce((a, b) => a + b.count, 0);
    const totalAssigned = standardTotal + customTotal;
    const totalPlayers = players.length;
    const remaining = totalPlayers - totalAssigned;
    const isValid = remaining === 0;

    const updateCount = (roleId, delta) => {
        const current = counts[roleId] || 0;
        const next = current + delta;

        if (next < 0) return;
        if (delta > 0 && remaining <= 0) return;

        setCounts({ ...counts, [roleId]: next });
    };

    const addCustomRole = () => {
        if (!newRoleName.trim()) return;

        const id = `custom_${Date.now()}`;
        // Start count at 0 as requested
        setCustomRoles([...customRoles, { id, label: newRoleName, count: 0, icon: HelpCircle, color: '#8b5cf6' }]);
        setNewRoleName('');
    };

    const updateCustomRoleCount = (id, delta) => {
        setCustomRoles(roles => roles.map(r => {
            if (r.id !== id) return r;
            const next = r.count + delta;

            if (next < 0) return r;
            if (delta > 0 && remaining <= 0) return r;

            return { ...r, count: next };
        }));
    };

    const handleNext = () => {
        if (!isValid) return;

        const pool = [];

        // Add standard roles
        Object.entries(counts).forEach(([roleId, count]) => {
            for (let i = 0; i < count; i++) {
                pool.push(roleId);
            }
        });

        // Add custom roles
        customRoles.forEach(r => {
            for (let i = 0; i < r.count; i++) {
                pool.push(r.id);
            }
        });

        // Shuffle pool
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        const assignments = players.map((player, i) => {
            const roleId = pool[i];
            let roleData = AVAILABLE_ROLES.find(r => r.id === roleId);
            if (!roleData) {
                // Find in custom
                const custom = customRoles.find(r => r.id === roleId);
                if (custom) roleData = { ...custom, icon: HelpCircle, color: '#a855f7' }; // Ensure properties exists
            }

            return {
                player,
                role: roleId,
                roleData
            };
        });

        onNext({ counts, assignments });
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="config-screen"
        >
            <header style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <h2 className="text-gradient" style={{ fontSize: '2rem' }}>Assign Roles</h2>
                <p style={{ color: isValid ? 'var(--success)' : 'var(--text-dim)' }}>
                    {remaining === 0 ? 'Ready to start!' : `For ${totalPlayers} players, assign ${remaining} more`}
                </p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {/* Standard Roles */}
                {AVAILABLE_ROLES.map((role) => {
                    const count = counts[role.id] || 0;
                    return (
                        <div
                            key={role.id}
                            className="glass-panel"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '1rem',
                                borderRadius: '1rem'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    color: role.color,
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '0.5rem',
                                    borderRadius: '50%'
                                }}>
                                    <role.icon size={24} />
                                </div>
                                <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>{role.label}</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button
                                    onClick={() => updateCount(role.id, -1)}
                                    disabled={count === 0}
                                    className="btn-icon"
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid var(--surface-highlight)',
                                        color: count === 0 ? 'var(--text-dim)' : 'var(--text)',
                                        borderRadius: '50%',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: count === 0 ? 'default' : 'pointer'
                                    }}
                                >
                                    <Minus size={16} />
                                </button>
                                <span style={{ width: '20px', textAlign: 'center', fontWeight: 'bold' }}>{count}</span>
                                <button
                                    onClick={() => updateCount(role.id, 1)}
                                    disabled={remaining === 0}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid var(--surface-highlight)',
                                        color: remaining === 0 ? 'var(--text-dim)' : 'var(--text)',
                                        borderRadius: '50%',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: remaining === 0 ? 'default' : 'pointer'
                                    }}
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}

                {/* Custom Roles List */}
                {customRoles.map((role) => (
                    <div
                        key={role.id}
                        className="glass-panel"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1rem',
                            borderRadius: '1rem',
                            position: 'relative' // For delete button styling
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                color: role.color,
                                background: 'rgba(255,255,255,0.05)',
                                padding: '0.5rem',
                                borderRadius: '50%'
                            }}>
                                <HelpCircle size={24} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>{role.label}</span>
                                <button
                                    onClick={() => {
                                        setCustomRoles(roles => roles.filter(r => r.id !== role.id));
                                    }}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--danger)',
                                        fontSize: '0.75rem',
                                        padding: 0,
                                        marginTop: '0.2rem',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.2rem'
                                    }}
                                >
                                    <Trash2 size={12} /> Remove Role
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                onClick={() => updateCustomRoleCount(role.id, -1)}
                                disabled={role.count === 0}
                                className="btn-icon"
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--surface-highlight)',
                                    color: role.count === 0 ? 'var(--text-dim)' : 'var(--text)',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: role.count === 0 ? 'default' : 'pointer'
                                }}
                            >
                                <Minus size={16} />
                            </button>
                            <span style={{ width: '20px', textAlign: 'center', fontWeight: 'bold' }}>{role.count}</span>
                            <button
                                onClick={() => updateCustomRoleCount(role.id, 1)}
                                disabled={remaining === 0}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--surface-highlight)',
                                    color: remaining === 0 ? 'var(--text-dim)' : 'var(--text)',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: remaining === 0 ? 'default' : 'pointer'
                                }}
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Add Custom Role Input */}
                <div className="glass-panel" style={{ padding: '1rem', borderRadius: '1rem', border: '1px dashed var(--surface-highlight)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Plus size={20} style={{ color: 'var(--text-dim)' }} />
                    <input
                        placeholder="Create new role (e.g. Jester)..."
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addCustomRole()}
                        style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '1rem' }}
                    />
                    <button
                        onClick={addCustomRole}
                        disabled={!newRoleName.trim()}
                        className="btn-primary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', borderRadius: '0.5rem', opacity: !newRoleName.trim() ? 0.5 : 1 }}
                    >
                        Add
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                    onClick={onBack}
                    className="btn-ghost"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <ArrowLeft size={20} /> Back
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
                    Start Game <ArrowRight size={20} />
                </button>
            </div>
        </motion.div>
    );
}

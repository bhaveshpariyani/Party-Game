import { motion } from 'framer-motion';
import { Users, Smartphone } from 'lucide-react';

export default function MafiaLanding({ onSelectMode }) {
    return (
        <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-gradient"
                style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '1rem' }}
            >
                Mafia
            </motion.h1>

            <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => onSelectMode('single')}
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
                        background: 'rgba(139, 92, 246, 0.15)', // var(--primary) based
                        borderRadius: '50%',
                        color: '#a78bfa',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)'
                    }}>
                        <Smartphone size={36} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: 600 }}>Pass & Play</h2>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                            Single device. Pass it around.
                        </p>
                    </div>
                </motion.button>

                <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => onSelectMode('multi')}
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
                        background: 'rgba(6, 182, 212, 0.15)', // var(--secondary) based
                        borderRadius: '50%',
                        color: '#22d3ee',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(6, 182, 212, 0.2)'
                    }}>
                        <Users size={36} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: 600 }}>Online Multiplayer</h2>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                            Play with friends on your own phones.
                        </p>
                    </div>
                </motion.button>
            </div>
        </div>
    );
}

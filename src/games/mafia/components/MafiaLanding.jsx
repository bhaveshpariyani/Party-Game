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
                        width: '100%', padding: '1.5rem',
                        display: 'flex', alignItems: 'center', gap: '1.5rem',
                        cursor: 'pointer', textAlign: 'left',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                    whileTap={{ scale: 0.98 }}
                >
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(var(--primary-rgb), 0.1)',
                        borderRadius: '50%',
                        color: 'var(--primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Smartphone size={32} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color: 'var(--text)' }}>Pass & Play</h2>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', lineHeight: 1.4 }}>
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
                        width: '100%', padding: '1.5rem',
                        display: 'flex', alignItems: 'center', gap: '1.5rem',
                        cursor: 'pointer', textAlign: 'left',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                    whileTap={{ scale: 0.98 }}
                >
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(var(--secondary-rgb), 0.1)',
                        borderRadius: '50%',
                        color: 'var(--secondary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Users size={32} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color: 'var(--text)' }}>Online Multiplayer</h2>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', lineHeight: 1.4 }}>
                            Play with friends on your own phones.
                        </p>
                    </div>
                </motion.button>
            </div>
        </div>
    );
}

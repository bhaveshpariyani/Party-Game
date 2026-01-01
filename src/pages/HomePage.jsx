import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gavel, Skull, Users } from 'lucide-react';

import { useState, useEffect } from 'react';

const games = [
    {
        id: 'judgement',
        name: 'Judgement',
        description: 'Scorepad for the prediction card game.',
        icon: Gavel,
        path: '/judgement',
        color: 'from-pink-500 to-rose-500' // Placeholder for gradient classes if using tailwind, but we are using vanilla variables + inline style for now or helper classes
    },
    {
        id: 'mafia',
        name: 'Mafia',
        description: 'Role helper for the classic party game.',
        icon: Skull,
        path: '/mafia',
        color: 'from-purple-500 to-indigo-500'
    }
];

export default function HomePage() {
    const [resumeGame, setResumeGame] = useState(null);

    useEffect(() => {
        const activeType = localStorage.getItem('active_session_type');
        if (activeType === 'mafia_single') {
            setResumeGame({ name: 'Mafia (Pass & Play)', path: '/mafia?resume=true', icon: Skull, color: '#a78bfa' });
        } else if (activeType === 'mafia_multi') {
            setResumeGame({ name: 'Mafia (Multiplayer)', path: '/mafia?resume=true', icon: Users, color: '#22d3ee' });
        } else if (activeType === 'judgement') {
            setResumeGame({ name: 'Judgement', path: '/judgement?resume=true', icon: Gavel, color: '#f472b6' });
        }
    }, []);

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-gradient"
                    style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 800 }}
                >
                    The Game App
                </motion.h1>
                <p style={{ color: 'var(--text-dim)' }}>Select a game to begin</p>
            </header>

            {resumeGame && (
                <Link to={resumeGame.path} style={{ textDecoration: 'none', display: 'block', marginBottom: '2rem' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-panel"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            padding: '1.5rem',
                            borderRadius: '1.2rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1.5rem',
                            background: `linear-gradient(135deg, ${resumeGame.color}22 0%, rgba(255,255,255,0.05) 100%)`, // Tint based on game
                            border: `1px solid ${resumeGame.color}44`,
                            flexWrap: 'wrap' // Allow wrapping on small screens
                        }}
                    >
                        <div
                            style={{
                                padding: '1rem',
                                background: `${resumeGame.color}33`,
                                borderRadius: '50%',
                                color: resumeGame.color,
                                boxShadow: `0 0 15px ${resumeGame.color}44`
                            }}
                        >
                            <resumeGame.icon size={32} />
                        </div>
                        <div style={{ flex: 1, minWidth: '180px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>Resume {resumeGame.name}</h3>
                            <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.9rem' }}>Continue your previous session</p>
                        </div>
                        <div style={{ color: resumeGame.color, fontWeight: 600, whiteSpace: 'nowrap' }}>
                            RESUME &rarr;
                        </div>
                    </motion.div>
                </Link>
            )}

            <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                {games.map((game, i) => (
                    <Link to={game.path} key={game.id} style={{ textDecoration: 'none' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ scale: 1.03, translateY: -5 }}
                            whileTap={{ scale: 0.98 }}
                            className="glass-panel"
                            style={{
                                padding: '2rem',
                                borderRadius: '1.5rem',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            <div
                                style={{
                                    marginBottom: '1.5rem',
                                    padding: '1.5rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '50%',
                                    color: game.id === 'mafia' ? 'var(--secondary)' : 'var(--primary)'
                                }}
                            >
                                <game.icon size={48} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text)' }}>{game.name}</h2>
                            <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem' }}>{game.description}</p>
                        </motion.div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

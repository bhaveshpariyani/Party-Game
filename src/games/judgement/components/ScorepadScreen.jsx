import { useRef, useEffect } from 'react';
import { X, ArrowRight, User, Medal } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ScorepadScreen({ players, rounds, settings, onNextRound, onEndGame, isOverlay = false }) {

    // Scoring Logic based on settings
    const calculateScore = (bid, won) => {
        if (!won) return 0;
        if (settings.type === 'prepend') {
            return (settings.prependVal * 10) + bid;
        }
        else if (settings.type === 'append') {
            return (bid * 10) + settings.appendVal;
        }
        else {
            return bid;
        }
    };

    const calculateTotal = (playerIndex) => {
        return rounds.reduce((total, round) => {
            const pData = round.players[playerIndex];
            return total + calculateScore(pData.bid, pData.won);
        }, 0);
    };

    // Get Leaderboard
    const leaderboard = players.map((p, i) => ({
        name: p,
        score: calculateTotal(i),
        index: i
    })).sort((a, b) => b.score - a.score);

    const top3 = leaderboard.slice(0, 3);
    // Reorder for Podium: 2nd, 1st, 3rd logic or just 1, 2, 3 list?
    // User said "1st part will display top 3 winners".
    // Let's do a visual podium: Second (Left), First (Center, Higher), Third (Right)
    // If less than 3 players, handle gracefully.

    const getPodiumOrder = (list) => {
        if (list.length === 1) return [list[0]];
        if (list.length === 2) return [list[1], list[0]];
        // array is sorted [1st, 2nd, 3rd]
        // return [2nd, 1st, 3rd]
        return [list[1], list[0], list[2]];
    };

    const podiumDisplay = getPodiumOrder(top3).filter(Boolean);

    return (
        <div className="scorepad" style={{ paddingBottom: isOverlay ? '1rem' : '5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="text-gradient">{isOverlay ? 'Scoreboard Overlay' : 'Scoreboard'}</h2>
                <button onClick={onEndGame} className="btn-ghost" style={{ padding: '0.4rem' }}>
                    <X size={20} />
                </button>
            </div>

            {/* Podium Section */}
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1rem', minHeight: '160px' }}>
                {podiumDisplay.map((p, i) => {
                    const isFirst = p === leaderboard[0];
                    const isSecond = p === leaderboard[1];
                    const isThird = p === leaderboard[2];

                    let height = isFirst ? '140px' : isSecond ? '110px' : '90px';
                    let color = isFirst ? '#fbbf24' : isSecond ? '#94a3b8' : '#b45309'; // Gold, Silver, Bronze

                    return (
                        <motion.div
                            key={p.name}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 * i }}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                width: '80px',
                                textAlign: 'center'
                            }}
                        >
                            <div style={{ marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{p.name}</div>
                            <div style={{
                                width: '100%',
                                height,
                                background: `linear-gradient(to top, var(--surface) 0%, ${color}40 100%)`,
                                border: `1px solid ${color}`,
                                borderRadius: '0.5rem 0.5rem 0 0',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-end',
                                padding: '1rem 0',
                                position: 'relative'
                            }}>
                                {isFirst && <Medal size={24} color={color} style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--background)', borderRadius: '50%' }} />}
                                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{p.score}</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--surface-highlight)', paddingBottom: '0.5rem' }}>Detailed Scores</h3>

            {/* Table */}
            <div style={{ overflowX: 'auto', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ background: 'var(--surface)' }}>
                            <th style={{ padding: '0.8rem', minWidth: '60px', position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 2 }}>#</th>
                            {players.map((p, i) => (
                                <th key={i} style={{ padding: '0.8rem', minWidth: '100px', color: 'var(--primary)' }}>
                                    <div style={{ fontWeight: 'bold' }}>{p}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={{ background: 'var(--surface-highlight)', fontWeight: 'bold' }}>
                            <td style={{ padding: '0.8rem', position: 'sticky', left: 0, background: 'var(--surface-highlight)' }}>Total</td>
                            {players.map((_, i) => (
                                <td key={i} style={{ padding: '0.8rem', color: 'var(--secondary)' }}>
                                    {calculateTotal(i)}
                                </td>
                            ))}
                        </tr>
                        {rounds.map((round, rIdx) => (
                            <motion.tr
                                key={round.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                            >
                                <td style={{ padding: '0.8rem', fontWeight: 'bold', position: 'sticky', left: 0, background: 'var(--background)' }}>
                                    <div>{round.id}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 'normal' }}>{round.trump}</div>
                                </td>
                                {players.map((_, pIdx) => {
                                    const pData = round.players[pIdx];
                                    const score = calculateScore(pData?.bid, pData?.won);
                                    return (
                                        <td key={pIdx} style={{ padding: '0.8rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: pData.won ? 'var(--success)' : 'var(--danger)' }}>
                                                    {score}
                                                </span>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                                    Target: {pData?.bid}
                                                </span>
                                            </div>
                                        </td>
                                    );
                                })}
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Next Game Button - Hidden if Overlay */}
            {!isOverlay && (
                <div style={{ position: 'fixed', bottom: '2rem', left: 0, right: 0, padding: '0 2rem', display: 'flex', justifyContent: 'center' }}>
                    <button
                        onClick={onNextRound}
                        className="btn-primary"
                        style={{
                            width: '100%',
                            maxWidth: '400px',
                            fontSize: '1.2rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 20px var(--primary-glow)'
                        }}
                    >
                        Start Next Game <ArrowRight size={20} />
                    </button>
                </div>
            )}
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import SetupScreen from './components/SetupScreen';
import RoleConfigScreen from './components/RoleConfigScreen';
import RevealScreen from './components/RevealScreen';
import DashboardScreen from './components/DashboardScreen';
import MafiaLanding from './components/MafiaLanding';
import MultiplayerController from './components/multiplayer/MultiplayerController';


export default function MafiaGame() {
    const [stage, setStage] = useState('landing'); // landing, setup, config, reveal, dashboard, multiplayer
    const [gameMode, setGameMode] = useState(null); // 'single', 'multi'
    const [autoConnectMulti, setAutoConnectMulti] = useState(false);
    const [players, setPlayers] = useState([]);
    const [roleCounts, setRoleCounts] = useState({});
    const [assignments, setAssignments] = useState([]); // Array of { player, role }

    // Navigation handlers
    const handleModeSelect = (mode) => {
        setGameMode(mode);
        if (mode === 'single') {
            setStage('setup');
        } else {
            setStage('multiplayer');
        }
    };

    const goToConfig = (playerList) => {
        setPlayers(playerList);
        setStage('config');
    };

    const goToReveal = (config) => {
        setRoleCounts(config.counts);
        setAssignments(config.assignments);
        setStage('reveal');
    };

    const handleResume = () => {
        const savedSession = localStorage.getItem('mafia_single_session');
        if (savedSession) {
            try {
                const session = JSON.parse(savedSession);
                if (session.gameMode === 'single') {
                    setGameMode('single');
                    setPlayers(session.players || []);
                    setRoleCounts(session.roleCounts || {});
                    setAssignments(session.assignments || []);
                    setStage(session.stage || 'landing');
                }
            } catch (e) {
                console.error("Failed to restore session", e);
                localStorage.removeItem('mafia_single_session');
            }
        }
    };

    // Resume Logic
    const location = useLocation();
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('resume') === 'true') {
            const activeType = localStorage.getItem('active_session_type');
            if (activeType === 'mafia_multi') {
                setAutoConnectMulti(true);
                setGameMode('multi');
                setStage('multiplayer');
            } else if (activeType === 'mafia_single') {
                handleResume();
            }
        }
    }, [location]);

    // Save Session (Single Player only) & Update Global Active Session
    useEffect(() => {
        if (gameMode === 'single' && stage !== 'landing') {
            const session = {
                gameMode,
                stage,
                players,
                roleCounts,
                assignments
            };
            localStorage.setItem('mafia_single_session', JSON.stringify(session));
            localStorage.setItem('active_session_type', 'mafia_single');
        }
    }, [gameMode, stage, players, roleCounts, assignments]);

    const goToDashboard = () => {
        setStage('dashboard');
    };

    return (
        <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', paddingBottom: '2rem' }}>

            <AnimatePresence mode="wait">
                {stage === 'landing' && (
                    <MafiaLanding
                        key="landing"
                        onSelectMode={handleModeSelect}
                        onResume={handleResume}
                    />
                )}
                {stage === 'setup' && (
                    <SetupScreen key="setup" onNext={goToConfig} />
                )}
                {stage === 'config' && (
                    <RoleConfigScreen
                        key="config"
                        players={players}
                        onNext={goToReveal}
                        onBack={() => setStage('setup')}
                    />
                )}
                {stage === 'reveal' && (
                    <RevealScreen
                        key="reveal"
                        assignments={assignments}
                        onComplete={goToDashboard}
                    />
                )}
                {stage === 'dashboard' && (
                    <DashboardScreen
                        key="dashboard"
                        assignments={assignments}
                        onNewGame={() => {
                            localStorage.removeItem('mafia_single_session');
                            localStorage.removeItem('mafia_timer_state');
                            localStorage.removeItem('active_session_type');
                            setStage('setup');
                            setGameMode('single');
                        }}
                    />
                )}
                {stage === 'multiplayer' && (
                    <MultiplayerController
                        onBack={() => {
                            setStage('landing');
                            setAutoConnectMulti(false);
                        }}
                        autoConnect={autoConnectMulti}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

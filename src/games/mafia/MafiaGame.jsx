import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import SetupScreen from './components/SetupScreen';
import RoleConfigScreen from './components/RoleConfigScreen';
import RevealScreen from './components/RevealScreen';
import DashboardScreen from './components/DashboardScreen';
import MafiaLanding from './components/MafiaLanding';
import MultiplayerController from './components/multiplayer/MultiplayerController';
import HomeButton from '../../components/HomeButton';

export default function MafiaGame() {
    const [stage, setStage] = useState('landing'); // landing, setup, config, reveal, dashboard, multiplayer
    const [gameMode, setGameMode] = useState(null); // 'single', 'multi'
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

    const goToDashboard = () => {
        setStage('dashboard');
    };

    return (
        <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', paddingBottom: '2rem' }}>
            <HomeButton />
            <AnimatePresence mode="wait">
                {stage === 'landing' && (
                    <MafiaLanding key="landing" onSelectMode={handleModeSelect} />
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
                        onNewGame={() => setStage('setup')}
                    />
                )}
                {stage === 'multiplayer' && (
                    <MultiplayerController onBack={() => setStage('landing')} />
                )}
            </AnimatePresence>
        </div>
    );
}

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import SetupScreen from './components/SetupScreen';
import RoleConfigScreen from './components/RoleConfigScreen';
import RevealScreen from './components/RevealScreen';
import DashboardScreen from './components/DashboardScreen';

export default function MafiaGame() {
    const [stage, setStage] = useState('setup'); // setup, config, reveal, dashboard
    const [players, setPlayers] = useState([]);
    const [roleCounts, setRoleCounts] = useState({});
    const [assignments, setAssignments] = useState([]); // Array of { player, role }

    // Navigation handlers
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
            <AnimatePresence mode="wait">
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
            </AnimatePresence>
        </div>
    );
}

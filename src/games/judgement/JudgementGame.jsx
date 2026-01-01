import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import SetupScreen from './components/SetupScreen';
import ScorepadScreen from './components/ScorepadScreen';
import RoundInputScreen from './components/RoundInputScreen';


export default function JudgementGame() {
    const [stage, setStage] = useState('setup'); // setup, roundInput, scorepad
    const [players, setPlayers] = useState([]);
    const [settings, setSettings] = useState({});
    const [rounds, setRounds] = useState([]);
    const [currentRoundNum, setCurrentRoundNum] = useState(1);
    const [currentTrump, setCurrentTrump] = useState('');

    const startGame = (playerList, gameSettings) => {
        setPlayers(playerList);
        setSettings(gameSettings);
        setRounds([]);
        setCurrentRoundNum(1);

        // Set initial trump
        if (gameSettings.trumps && gameSettings.trumps.length > 0) {
            setCurrentTrump(gameSettings.trumps[0]);
        } else {
            setCurrentTrump('Hearts'); // Fallback
        }

        setStage('roundInput');
    };

    const handleRoundSubmit = (roundData) => {
        // roundData: { trump, inputs: { [i]: { prediction, won } } }

        // Convert to internal round format
        const playersData = players.map((_, i) => {
            const input = roundData.inputs[i];
            return {
                bid: parseInt(input?.prediction) || 0,
                won: input?.won || false, // boolean result
                actual: input?.won ? (parseInt(input?.prediction) || 0) : -1 // -1 or just store result?
                // Actually, for scoring, we just need to know if they matched. 
                // If they matched, score = formula. If not, score = 0.
            };
        });

        const newRound = {
            id: currentRoundNum,
            trump: roundData.trump,
            players: playersData
        };

        setRounds([...rounds, newRound]);
        setStage('scorepad');
    };

    // Load Session & Resume Check
    const location = useLocation();
    useEffect(() => {
        // Resume check
        const params = new URLSearchParams(location.search);
        // We load session regardless on mount, but let's ensure we are consistent if the button triggered it.
        // Actually, JudgementGame loads session automatically on mount in the existing useEffect.
        // We just need to make sure we don't clear it unexpectedly.
    }, [location]);

    // Load Session
    useEffect(() => {
        const savedSession = localStorage.getItem('judgement_session');
        if (savedSession) {
            try {
                const session = JSON.parse(savedSession);
                setPlayers(session.players || []);
                setSettings(session.settings || {});
                setRounds(session.rounds || []);
                setCurrentRoundNum(session.currentRoundNum || 1);
                setCurrentTrump(session.currentTrump || '');
                setStage(session.stage || 'setup');
            } catch (e) {
                console.error("Failed to restore Judgement session", e);
                localStorage.removeItem('judgement_session');
            }
        }
    }, []);

    // Save Session (and active type)
    useEffect(() => {
        if (stage !== 'setup') {
            const session = {
                stage,
                players,
                settings,
                rounds,
                currentRoundNum,
                currentTrump
            };
            localStorage.setItem('judgement_session', JSON.stringify(session));
            localStorage.setItem('active_session_type', 'judgement');
        }
    }, [stage, players, settings, rounds, currentRoundNum, currentTrump]);

    const nextRound = () => {
        const nextNum = currentRoundNum + 1;
        setCurrentRoundNum(nextNum);

        // Calculate next trump
        if (settings.trumps && settings.trumps.length > 0) {
            const trumpIdx = (nextNum - 1) % settings.trumps.length;
            setCurrentTrump(settings.trumps[trumpIdx]);
        }

        setStage('roundInput');
    };

    return (
        <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', paddingBottom: '2rem' }}>

            <AnimatePresence mode="wait">
                {stage === 'setup' && (
                    <SetupScreen key="setup" onStart={startGame} />
                )}
                {stage === 'roundInput' && (
                    <RoundInputScreen
                        key="roundInput"
                        roundNum={currentRoundNum}
                        initialTrump={currentTrump}
                        players={players}
                        rounds={rounds}       // Pass history
                        settings={settings}   // Pass settings
                        onSubmit={handleRoundSubmit}
                    />
                )}
                {stage === 'scorepad' && (
                    <ScorepadScreen
                        key="scorepad"
                        players={players}
                        rounds={rounds}
                        settings={settings}
                        onNextRound={nextRound}
                        onEndGame={() => {
                            localStorage.removeItem('judgement_session');
                            localStorage.removeItem('active_session_type');
                            setStage('setup');
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

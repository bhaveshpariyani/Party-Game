import { useState, useEffect } from 'react';
import { db, auth } from '../../../../services/firebase'; // Adjust path
import { doc, getDoc, setDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { motion } from 'framer-motion';
import Lobby from './Lobby';

export default function MultiplayerController({ onBack }) {
    const [gameState, setGameState] = useState('lobby'); // lobby, setup, game
    const [roomCode, setRoomCode] = useState(null);
    const [isHost, setIsHost] = useState(false);
    const [playerId, setPlayerId] = useState(null);
    const [playerName, setPlayerName] = useState('');
    const [players, setPlayers] = useState([]);

    // Auth on mount
    useEffect(() => {
        signInAnonymously(auth).then((creds) => {
            setPlayerId(creds.user.uid);
        }).catch(err => console.error("Auth failed", err));
    }, []);

    // Create Room
    const createRoom = async (name) => {
        if (!name) return;
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        try {
            // Create Room Doc
            await setDoc(doc(db, 'rooms', code), {
                createdAt: new Date(),
                hostId: playerId,
                status: 'lobby', // lobby, setup, night, day
                phaseData: {},
                settings: {
                    detailedMode: false // Default
                }
            });

            // Add Host as Player
            await setDoc(doc(db, 'rooms', code, 'players', playerId), {
                name: name,
                isHost: true,
                role: null,
                isAlive: true,
                joinedAt: new Date()
            });

            setRoomCode(code);
            setPlayerName(name);
            setIsHost(true);
            setGameState('lobby'); // Stay in lobby to wait for others
        } catch (e) {
            console.error("Error creating room:", e);
            alert("Failed to create room: " + e.message);
        }
    };

    // Join Room
    const joinRoom = async (name, code) => {
        if (!name || !code) return;

        try {
            // Check if room exists
            const roomRef = doc(db, 'rooms', code);
            const roomSnap = await getDoc(roomRef);

            if (!roomSnap.exists()) {
                alert("Room not found!");
                return;
            }

            // Add Player
            await setDoc(doc(db, 'rooms', code, 'players', playerId), {
                name: name,
                isHost: false,
                role: null,
                isAlive: true,
                joinedAt: new Date()
            });

            setRoomCode(code);
            setPlayerName(name);
            setIsHost(false);
            setGameState('lobby');
        } catch (e) {
            console.error("Error joining room:", e);
            alert("Failed to join: " + e.message);
        }
    };

    // Start Setup (Host Only)
    const handleStartSetup = async () => {
        await setDoc(doc(db, 'rooms', roomCode), { status: 'setup' }, { merge: true });
    };

    // Submit Roles (Host Only)
    const handleSubmitRoles = async (config) => {
        // config includes: assignments, detailedMode

        // 1. Update Room Settings
        await setDoc(doc(db, 'rooms', roomCode), {
            'settings.detailedMode': config.detailedMode
        }, { merge: true });

        // 2. Assign Roles Logic
        // Strip non-serializable data locally before saving
        const cleanAssignments = config.assignments.map(a => {
            const { icon, ...rest } = a.roleData; // Remove icon component
            return {
                pid: a.player.id,
                role: a.role,
                roleData: rest
            };
        });

        // Save each player's role
        const updatePromises = cleanAssignments.map(a =>
            setDoc(doc(db, 'rooms', roomCode, 'players', a.pid), {
                role: a.role,
                roleData: a.roleData
            }, { merge: true })
        );

        await Promise.all(updatePromises);

        // 3. Move to Reveal Phase
        await setDoc(doc(db, 'rooms', roomCode), { status: 'reveal' }, { merge: true });
    };

    // Start Night Phase (Host Only)
    const handleStartNight = async () => {
        // Increment night count if coming from Day
        const nextNight = (gameState === 'day') ? (Number(currentCounts.night || 1) + 1) : 1;

        await setDoc(doc(db, 'rooms', roomCode), {
            status: 'night',
            nightCount: nextNight,
            subPhase: 'sleep' // Reset sub-phase
        }, { merge: true });
    };

    // End Night -> Go to Day (Host Only)
    // We can show a 'Night Report' phase here but for now straightforward to Day
    const handleEndNight = async () => {
        const nextDay = (currentCounts.day || 0) + 1;
        await setDoc(doc(db, 'rooms', roomCode), {
            status: 'day',
            dayCount: nextDay
        }, { merge: true });
    };

    // End Day -> Eliminate -> Go to Night (Host Only)
    const handleEndDay = async (eliminatedId) => {
        if (eliminatedId) {
            await setDoc(doc(db, 'rooms', roomCode, 'players', eliminatedId), {
                isAlive: false
            }, { merge: true });
        }

        // Go to next night
        handleStartNight();
    };


    // Listen to Room & Player Updates
    useEffect(() => {
        if (!roomCode) return;

        // Players Listener
        const q = query(collection(db, 'rooms', roomCode, 'players'));
        const unsubPlayers = onSnapshot(q, (snapshot) => {
            const playerList = [];
            snapshot.forEach(doc => {
                playerList.push({ id: doc.id, ...doc.data() });
            });
            setPlayers(playerList);
        });

        // Room Status Listener (Game State Sync)
        const roomRef = doc(db, 'rooms', roomCode);
        const unsubRoom = onSnapshot(roomRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setGameState(data.status); // lobby -> setup -> reveal -> night -> day

                // Track counts locally for transition logic
                setCurrentCounts({
                    night: data.nightCount || 1,
                    day: data.dayCount || 0
                });
            }
        });

        return () => {
            unsubPlayers();
            unsubRoom();
        };
    }, [roomCode]);

    const [currentCounts, setCurrentCounts] = useState({ night: 1, day: 0 });

    const myPlayer = players.find(p => p.id === playerId);
    const isPresenter = myPlayer?.role === 'presenter';

    return (
        <div style={{ padding: '1rem', height: '100%' }}>
            {gameState === 'lobby' && (
                <Lobby
                    roomCode={roomCode}
                    players={players}
                    isHost={isHost}
                    onCreate={createRoom}
                    onJoin={joinRoom}
                    onBack={onBack}
                    onStartSetup={handleStartSetup}
                    currentUser={playerId}
                />
            )}

            {gameState === 'setup' && (
                isHost ? (
                    // Import RoleConfigScreen lazily or assuming it's available in context? 
                    // I will need to pass it as prop or import clearly.
                    // Assuming MultiplayerController knows about RoleConfigScreen
                    <RoleConfigWrapper
                        players={players}
                        onNext={handleSubmitRoles}
                        onBack={() => setDoc(doc(db, 'rooms', roomCode), { status: 'lobby' }, { merge: true })}
                    />
                ) : (
                    <div className="flex-col-center" style={{ height: '70vh' }}>
                        <h2 className="text-gradient">Setup In Progress</h2>
                        <p style={{ color: 'var(--text-dim)', textAlign: 'center', marginTop: '1rem' }}>
                            The host is assigning roles...<br />
                            Stay tuned!
                        </p>
                    </div>
                )
            )}

            {gameState === 'reveal' && (
                <MultiplayerReveal
                    player={players.find(p => p.id === playerId)}
                    players={players} // Pass all players to check status
                    roomCode={roomCode}
                    isHost={isHost || isPresenter}
                    onStartGame={handleStartNight}
                />
            )}
            {gameState === 'night' && (
                <ActionPhaseController
                    roomCode={roomCode}
                    players={players}
                    currentUser={playerId}
                    isHost={isPresenter} // Pass Presenter as Host for Logic
                    nightCount={currentCounts.night}
                    onEndNight={handleEndNight}
                />
            )}
            {gameState === 'day' && (
                <DayPhaseController
                    roomCode={roomCode}
                    players={players}
                    currentUser={playerId}
                    isHost={isPresenter} // Pass Presenter as Host for Logic
                    dayCount={currentCounts.day}
                    onEndDay={handleEndDay}
                />
            )}
        </div>
    );
}

// Wrapper to bridge imports if needed or just use direct import at top
import RoleConfigScreen from '../RoleConfigScreen';
import MultiplayerReveal from './MultiplayerReveal';
import ActionPhaseController from './ActionPhaseController';
import DayPhaseController from './DayPhaseController';
function RoleConfigWrapper({ players, onNext, onBack }) {
    return <RoleConfigScreen players={players} onNext={onNext} onBack={onBack} />;
}

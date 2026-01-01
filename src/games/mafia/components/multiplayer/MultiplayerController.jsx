import { useState, useEffect } from 'react';
import { db, auth } from '../../../../services/firebase'; // Adjust path
import { doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { motion } from 'framer-motion';
import Lobby from './Lobby';

export default function MultiplayerController({ onBack, autoConnect = false }) {
    const [gameState, setGameState] = useState('lobby'); // lobby, setup, game
    const [roomCode, setRoomCode] = useState(null);
    const [isHost, setIsHost] = useState(false);
    const [playerId, setPlayerId] = useState(null);
    const [playerName, setPlayerName] = useState('');
    const [players, setPlayers] = useState([]);
    const [currentCounts, setCurrentCounts] = useState({ night: 1, day: 0 });
    const [currentGameId, setCurrentGameId] = useState(null);

    // Auth & Session Restore
    useEffect(() => {
        // 1. Auth
        signInAnonymously(auth).then((creds) => {
            setPlayerId(creds.user.uid);
        }).catch(err => console.error("Auth failed", err));

        // 2. Restore Session (Only if autoConnect is true)
        if (autoConnect) {
            const savedCode = localStorage.getItem('mafia_room_code');
            if (savedCode) {
                setRoomCode(savedCode);
                // We don't set gameState here, the snapshot listener will handle it once roomCode is set
            }
        }
    }, [autoConnect]);

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
                gameId: Date.now(), // Unique ID for this session
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
            localStorage.setItem('mafia_room_code', code);
            localStorage.setItem('active_session_type', 'mafia_multi');
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
            localStorage.setItem('mafia_room_code', code);
            localStorage.setItem('active_session_type', 'mafia_multi');
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

        // 2. Assign Roles Logic & Host Transfer
        // The Presenter becomes the new Host
        const presenterAssignment = config.assignments.find(a => a.role === 'presenter');
        const presenterId = presenterAssignment ? presenterAssignment.player.id : null;

        // Strip non-serializable data locally before saving
        const cleanAssignments = config.assignments.map(a => {
            const { icon, ...rest } = a.roleData; // Remove icon component
            return {
                pid: a.player.id,
                role: a.role,
                roleData: rest
            };
        });

        // Save each player's role AND update Host status
        const updatePromises = cleanAssignments.map(a => {
            const isNewHost = a.pid === presenterId;
            return setDoc(doc(db, 'rooms', roomCode, 'players', a.pid), {
                role: a.role,
                roleData: a.roleData,
                isHost: isNewHost // Transfer Host status
            }, { merge: true });
        });

        // Loop through Players NOT in assignments (if any?) to strip Host? 
        // Ideally everyone is likely assigned or we iterate 'players' state instead.
        // But for safe measure, we can iterate 'players' if needed. 
        // For now, assuming assignments cover active players.

        // Also update the Room's hostId
        if (presenterId) {
            updatePromises.push(
                setDoc(doc(db, 'rooms', roomCode), { hostId: presenterId }, { merge: true })
            );
        }

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
            console.log("Processing Elimination:", eliminatedId);
            try {
                await updateDoc(doc(db, 'rooms', roomCode, 'players', eliminatedId), {
                    isAlive: false
                });
                console.log("Elimination successful");
            } catch (e) {
                console.error("Failed to eliminate player:", e);
                // Fallback if update fails (e.g. document missing?) - try set with merge
                await setDoc(doc(db, 'rooms', roomCode, 'players', eliminatedId), {
                    isAlive: false
                }, { merge: true });
            }
        }

        // Go to next night
        handleStartNight();
    };


    // Reset Game (Host Only)
    const handleResetGame = async () => {
        // Validation moved to UI components via ConfirmationModal
        try {
            // 1. Reset Room Status
            await setDoc(doc(db, 'rooms', roomCode), {
                status: 'lobby',
                nightCount: 1,
                dayCount: 0,
                phaseData: {},
                gameId: Date.now(), // Generate new Game ID to invalidate old actions
                actions: {}
            }, { merge: true });

            // 2. Reset Players
            // 2. Reset Players - Cleanup Logic
            const resetPromises = players.map(p => {
                // If dead/eliminated AND NOT HOST, remove them from the room entirely (Kick)
                if (!p.isAlive && !p.isHost) {
                    return deleteDoc(doc(db, 'rooms', roomCode, 'players', p.id));
                }

                // If alive, just reset their state
                return setDoc(doc(db, 'rooms', roomCode, 'players', p.id), {
                    role: null,
                    roleData: {},
                    isAlive: true,
                    isHost: p.isHost // Preserve host status
                }, { merge: true });
            });

            await Promise.all(resetPromises);

        } catch (e) {
            console.error("Error resetting game:", e);
            alert("Failed to reset game.");
        }
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
                    night: Number(data.nightCount) || 1,
                    day: Number(data.dayCount) || 0
                });
                setCurrentGameId(data.gameId || 'legacy');
            }
        });

        return () => {
            unsubPlayers();
            unsubRoom();
        };
    }, [roomCode]);

    // Sync Host Status & Handle Elimination Cleanup
    useEffect(() => {
        if (playerId && players.length > 0) {
            const me = players.find(p => p.id === playerId);
            if (me) {
                setIsHost(me.isHost || false);

                // Elimination Cleanup (Strict Prevention)
                if (!me.isAlive) {
                    localStorage.removeItem('active_session_type');
                    // We don't remove room_code here to allow them to perhaps Spectate? 
                    // User said: "kick off them from game remove last game state for them as well so they can not rejoin"
                    // So we should probably route them away or show a specific "You are dead" screen that doesn't allow resume.
                    // Removing active_session_type prevents the "Resume" button from working.
                }
            }
        }
    }, [players, playerId]);

    const myPlayer = players.find(p => p.id === playerId);
    const isPresenter = myPlayer?.role === 'presenter';

    const handleLeaveRoom = () => {
        // Only clear session if we are actively in a room
        if (roomCode) {
            localStorage.removeItem('mafia_room_code');
            localStorage.removeItem('active_session_type');
        }
        onBack();
    };

    return (
        <div style={{ padding: '1rem', height: '100%' }}>
            {gameState === 'lobby' && (
                <Lobby
                    roomCode={roomCode}
                    players={players}
                    isHost={isHost}
                    onCreate={createRoom}
                    onJoin={joinRoom}
                    onBack={handleLeaveRoom}
                    onStartSetup={handleStartSetup}
                    currentUser={playerId}
                />
            )}

            {gameState === 'setup' && (
                isHost ? (
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
                    players={players}
                    roomCode={roomCode}
                    isHost={isHost || isPresenter}
                    onStartGame={handleStartNight}
                    onResetGame={handleResetGame}
                />
            )}
            {gameState === 'night' && (
                <ActionPhaseController
                    roomCode={roomCode}
                    players={players}
                    currentUser={playerId}
                    isHost={isPresenter}
                    nightCount={currentCounts.night}
                    gameId={currentGameId}
                    onEndNight={handleEndNight}
                    onResetGame={handleResetGame}
                />
            )}
            {gameState === 'day' && (
                <DayPhaseController
                    roomCode={roomCode}
                    players={players}
                    currentUser={playerId}
                    isHost={isPresenter}
                    dayCount={currentCounts.day}
                    gameId={currentGameId}
                    onEndDay={handleEndDay}
                    onResetGame={handleResetGame}
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

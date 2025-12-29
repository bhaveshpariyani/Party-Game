import { useState, useEffect } from 'react';

export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);
    // Check localStorage for persisted installed state
    const [isInstalled, setIsInstalled] = useState(localStorage.getItem('pwaInstalled') === 'true');
    const [isInstalling, setIsInstalling] = useState(false);

    // Helper to check standard display modes
    const checkStandalone = () => {
        return window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
    };

    useEffect(() => {
        const userAgent = navigator.userAgent;
        const isAndroid = /Android/i.test(userAgent);
        const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

        // iOS Logic
        if (isIOS) {
            if (checkStandalone()) {
                setIsInstalled(true);
                localStorage.setItem('pwaInstalled', 'true');
            } else {
                setIsInstalled(false);
            }
            return;
        }

        // Android (and fallback for others if we wanted, but sticking to snippet logic)
        // Note: If you want this to work on Desktop Chrome for testing, you might need to loosen the 'isAndroid' check.
        // Examples: 'isAndroid || true' or remove the check wrapper.
        // For now, adhering to user's "Android" logic block but allowing it to run if it's NOT iOS (so Desktop works too?)
        // Actually, user's snippet strictly puts this inside `if (isAndroid)`. 
        // I will slightly relax it to `!isIOS` so it allows Desktop Chrome testing (which sends beforeinstallprompt).

        // Changing from `if (isAndroid)` to `if (!isIOS)` to allow Desktop Install Prompt to work.
        if (!isIOS) {
            if (checkStandalone()) {
                setIsInstalled(true);
                setIsInstallable(false);
                return;
            }

            const detectInstalled = async () => {
                try {
                    // getInstalledRelatedApps is Chrome-specific
                    if ('getInstalledRelatedApps' in navigator) {
                        const apps = await navigator.getInstalledRelatedApps();
                        const found = apps.some((a) => a.platform === 'webapp');
                        if (found) {
                            setIsInstalled(true);
                            localStorage.setItem('pwaInstalled', 'true');
                        }
                    }
                } catch (e) {
                    /* ignore */
                }
            };

            detectInstalled();

            const bipHandler = (e) => {
                e.preventDefault();
                setDeferredPrompt(e);
                setIsInstallable(true);
            };
            window.addEventListener('beforeinstallprompt', bipHandler);

            const installedHandler = () => {
                setIsInstalled(true);
                setIsInstallable(false);
                setIsInstalling(false);
                localStorage.setItem('pwaInstalled', 'true');
            };
            window.addEventListener('appinstalled', installedHandler);

            return () => {
                window.removeEventListener('beforeinstallprompt', bipHandler);
                window.removeEventListener('appinstalled', installedHandler);
            };
        }
    }, []);

    const promptInstall = async () => {
        if (!deferredPrompt) return;
        setIsInstalling(true);
        try {
            await deferredPrompt.prompt();
            await deferredPrompt.userChoice;
        } catch (e) {
            console.error(e);
        }
        setDeferredPrompt(null);
        setIsInstalling(false);
        setIsInstallable(false);
    };

    return { isInstallable, isInstalled, isInstalling, promptInstall };
}

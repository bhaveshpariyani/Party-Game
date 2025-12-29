import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import MafiaGame from './games/mafia/MafiaGame';
import JudgementGame from './games/judgement/JudgementGame';
import { usePWAInstall } from './hooks/use-pwa-install';
import InstallAppModal from './components/install-prompt-modal';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  const { isInstallable, isInstalled, isInstalling, promptInstall } = usePWAInstall();
  const [showModal, setShowModal] = useState(true);

  // Determine Environment
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const userAgent = navigator.userAgent;
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);

  // Test flag override
  const forceTest = window.location.search.includes('test-install');

  // Show modal if mobile (or force test), not standalone, and modal state is true
  const shouldShowModal = ((isAndroid || isIOS || forceTest) && !isStandalone && showModal);

  const instruction = isAndroid
    ? 'On Android, use the browser menu and tap “Install app” / “Add to Home screen”.'
    : isIOS
      ? 'On iOS (iPhones and iPads), open the share menu and tap “Add to Home Screen”.'
      : 'Look for “Install app” or “Add to Home screen” in your browser menu.';

  const openInstalledApp = async () => {
    const domain = window.location.origin;
    const appUrl = `${domain}/?source=pwa`;

    if (isIOS) {
      window.location.href = appUrl;
      return;
    }

    if (isAndroid) {
      if ('getInstalledRelatedApps' in navigator) {
        try {
          const relatedApps = await navigator.getInstalledRelatedApps();
          if (relatedApps.length > 0) {
            window.location.href = appUrl;
            return;
          }
        } catch (e) { console.warn(e); }
      }
      // Intent fallback
      const hostname = window.location.hostname;
      // Basic intent structure, might need manifest adjustments for full support
      // But fulfilling user request to include this logic:
      window.location.href = `intent://${hostname}/?source=pwa#Intent;scheme=https;package=com.partygames.pwa;end`;
      return;
    }

    // Fallback
    window.location.href = appUrl;
  };

  return (
    <HashRouter>
      <ScrollToTop />

      {shouldShowModal && (
        <InstallAppModal
          isOpen={shouldShowModal}
          isInstalled={isInstalled}
          isInstallable={isInstallable}
          isInstalling={isInstalling}
          instruction={instruction}
          onInstall={promptInstall}
          onOpenApp={openInstalledApp}
        />
      )}

      <div className="app-container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/mafia/*" element={<MafiaGame />} />
          <Route path="/judgement/*" element={<JudgementGame />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;

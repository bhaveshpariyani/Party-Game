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
      // 1. Try Custom Protocol (Reliable way to open installed PWA if registered)
      // This will trigger "Open with..." or open the app directly
      window.location.href = 'web+thegameapp://start';

      // 2. Fallback timeout in case protocol fails (though in browser logic, this is tricky to catch synchronously)
      // Since we can't easily detect protocol failure without page hide hacks, we rely on the system handling it.
      // If not installed, it might just do a google search for the protocol or nothing.

      // As a safe backup if protocol doesn't engage, we reload the page with param
      setTimeout(() => {
        window.location.href = appUrl;
      }, 1500);
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

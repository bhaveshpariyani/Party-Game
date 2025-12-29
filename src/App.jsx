import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import HomePage from './pages/HomePage';
import MafiaGame from './games/mafia/MafiaGame';
import JudgementGame from './games/judgement/JudgementGame';
import { useEffect } from 'react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <HashRouter>
      <ScrollToTop />
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

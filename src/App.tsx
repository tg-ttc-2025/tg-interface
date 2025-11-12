import { Routes, Route } from 'react-router-dom';
import HomePage from "./pages/HomePage";
import IntegrationPage from "./pages/IntegrationPage";
import OffensePage from "./pages/OffensePage";
import DefensePage from "./pages/DefensePage";
import TGDefensePage from './pages/TGDefensePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/integration" element={<IntegrationPage />} />
      <Route path="/offense" element={<OffensePage />} />
      <Route path="/defense" element={<DefensePage />} />
      <Route path="/tg-defense" element={<TGDefensePage />} />
    </Routes>
  );
}

export default App;
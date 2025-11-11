import { Routes, Route } from 'react-router-dom';
import HomePage from "./pages/HomePage";
import IntegrationPage from "./pages/IntegrationPage";
import OffensePage from "./pages/OffensePage";
import DefensePage from "./pages/DefensePage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/integration" element={<IntegrationPage />} />
      <Route path="/offense" element={<OffensePage />} />
      <Route path="/defense" element={<DefensePage />} />
    </Routes>
  );
}

export default App;
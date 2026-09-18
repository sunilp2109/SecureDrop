import { Navigate, Route, Routes } from 'react-router-dom';
import { AccessPage } from './pages/AccessPage';
import { DashboardPage } from './pages/DashboardPage';
import { EmailTemplatePage } from './pages/EmailTemplatePage';
import { LandingPage } from './pages/LandingPage';
import { SecurityPage } from './pages/SecurityPage';
import { SendPage } from './pages/SendPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/send" element={<SendPage />} />
      <Route path="/security" element={<SecurityPage />} />
      <Route path="/security/email" element={<EmailTemplatePage />} />
      <Route path="/access/:token" element={<AccessPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/dashboard/:manageToken" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

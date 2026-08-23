import React, { useContext, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { UsersPage } from './pages/UsersPage';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { AlertsPage } from './pages/AlertsPage';
import { AssetsPage } from './pages/AssetsPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { VulnerabilitiesPage } from './pages/VulnerabilitiesPage';
import { MetricsPage } from './pages/MetricsPage';
import RequestsPage from './pages/RequestsPage';
import { AuditPage } from './pages/AuditPage';
import { CompliancePage } from './pages/CompliancePage';
import { ReportsPage } from './pages/ReportsPage';
import ChatBot from './components/ChatBot';

import './App.css';

const AppRoutes = () => {
  const { user } = useContext(AuthContext);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [initialLoginMode, setInitialLoginMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  if (!user) {
    if (showAuthModal) {
      return (
        <AuthPage 
          defaultLoginMode={initialLoginMode} 
          onCancel={() => setShowAuthModal(false)} 
        />
      );
    }
    return (
      <LandingPage 
        onOpenAuth={(isLogin) => {
          setInitialLoginMode(isLogin);
          setShowAuthModal(true);
        }} 
      />
    );
  }

  return (
    <div className="app-shell" style={{ display: 'flex', position: 'relative', overflow: 'hidden' }}>
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div 
        className="main-content-area" 
        style={{ 
          flex: 1, 
          minWidth: 0, 
          transition: 'margin-right 0.3s ease',
          marginRight: isChatOpen ? '380px' : '0px'
        }}
      >
        <Navbar 
          onToggleChat={() => setIsChatOpen((prev) => !prev)} 
          isChatOpen={isChatOpen} 
        />

        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/assets" element={<AssetsPage />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/vulnerabilities" element={<VulnerabilitiesPage />} />
          <Route path="/metrics" element={<MetricsPage />} />
          <Route path="/requests" element={<RequestsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/compliance" element={<CompliancePage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>

      {/* Pop-right Drawer Panel */}
      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
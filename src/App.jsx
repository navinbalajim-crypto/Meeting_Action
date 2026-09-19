import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MeetingProvider, useMeeting } from './context/MeetingContext';
import { ToastProvider } from './context/ToastContext';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import VoiceOnboardingPage from './pages/VoiceOnboardingPage';
import DashboardPage from './pages/DashboardPage';
import LiveMeetingPage from './pages/LiveMeetingPage';
import ExistingMeetingPage from './pages/ExistingMeetingPage';
import ReportPage from './pages/ReportPage';
import ActionTrackerPage from './pages/ActionTrackerPage';
import MeetingHistoryPage from './pages/MeetingHistoryPage';
import SettingsPage from './pages/SettingsPage';
import DemoTourModal from './pages/DemoTourModal';

// Modals
import CreateMeetingModal from './components/meeting/CreateMeetingModal';
import JoinMeetingModal from './components/meeting/JoinMeetingModal';
import EvidenceModal from './components/intelligence/EvidenceModal';

function AppContent({ currentView, setCurrentView }) {
  const { isAuthenticated, user, hasVoiceProfile } = useAuth();
  const {
    evidenceModalOpen,
    selectedEvidence,
    closeEvidence,
    openEvidence,
    openContradiction,
    setActiveMeeting
  } = useMeeting();

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [demoTourOpen, setDemoTourOpen] = useState(false);

  const [joinCodeFromUrl, setJoinCodeFromUrl] = useState('');

  // Hash-based navigation and deep link listener
  useEffect(() => {
    const handleHash = () => {
      const rawHash = window.location.hash.replace('#', '');
      if (rawHash.startsWith('join=')) {
        const queryPart = rawHash.split('&')[0];
        const code = queryPart.replace('join=', '');
        setJoinCodeFromUrl(code);
        setJoinModalOpen(true);
      } else if (rawHash === 'manual') {
        setCurrentView('dashboard');
        window.location.hash = 'dashboard';
      } else if (rawHash && ['landing', 'auth', 'voice-onboarding', 'dashboard', 'live', 'upload', 'report', 'actions', 'history', 'settings'].includes(rawHash)) {
        setCurrentView(rawHash);
      } else if (!rawHash) {
        setCurrentView('auth');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [setCurrentView]);

  const handleNavigate = (view) => {
    setCurrentView(view);
    window.location.hash = view;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMeetingCreated = (meeting) => {
    setActiveMeeting(meeting);
    handleNavigate('live');
  };

  const handleMeetingJoined = (meeting) => {
    setActiveMeeting(meeting);
    handleNavigate('live');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080B16] text-[#F8FAFC]">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenCreate={() => setCreateModalOpen(true)}
        onLaunchDemo={() => setDemoTourOpen(true)}
      />

      {/* Main Page Views */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            onNavigate={handleNavigate}
            onOpenCreate={() => setCreateModalOpen(true)}
            onLaunchDemo={() => setDemoTourOpen(true)}
          />
        )}

        {currentView === 'auth' && (
          <AuthPage onNavigate={handleNavigate} />
        )}

        {currentView === 'voice-onboarding' && (
          <VoiceOnboardingPage onNavigate={handleNavigate} />
        )}

        {currentView === 'dashboard' && (
          <DashboardPage
            onNavigate={handleNavigate}
            onOpenCreate={() => setCreateModalOpen(true)}
            onOpenJoin={() => setJoinModalOpen(true)}
            onOpenEvidence={openEvidence}
          />
        )}

        {currentView === 'live' && (
          <LiveMeetingPage onNavigate={handleNavigate} />
        )}

        {currentView === 'upload' && (
          <ExistingMeetingPage onNavigate={handleNavigate} />
        )}

        {currentView === 'report' && (
          <ReportPage
            onNavigate={handleNavigate}
            onOpenEvidence={openEvidence}
            onOpenContradiction={openContradiction}
          />
        )}

        {currentView === 'actions' && (
          <ActionTrackerPage onOpenEvidence={openEvidence} />
        )}

        {currentView === 'history' && (
          <MeetingHistoryPage
            onNavigate={handleNavigate}
            onSelectMeeting={(m) => setActiveMeeting(m)}
          />
        )}

        {currentView === 'settings' && (
          <SettingsPage onNavigate={handleNavigate} />
        )}
      </main>

      {/* Global Footer (shown on landing, dashboard, and marketing pages) */}
      {(currentView === 'landing' || currentView === 'dashboard' || currentView === 'history') && (
        <Footer />
      )}

      {/* Global Modals */}
      <CreateMeetingModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleMeetingCreated}
      />

      <JoinMeetingModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onJoined={handleMeetingJoined}
        initialCode={joinCodeFromUrl}
      />

      <EvidenceModal
        isOpen={evidenceModalOpen}
        onClose={closeEvidence}
        evidence={selectedEvidence?.evidence}
        taskTitle={selectedEvidence?.task || selectedEvidence?.action}
        owner={selectedEvidence?.owner}
        deadline={selectedEvidence?.deadline}
        confidence={selectedEvidence?.confidence}
      />

      <DemoTourModal
        isOpen={demoTourOpen}
        onClose={() => setDemoTourOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}

export function App() {
  const [currentView, setCurrentView] = useState(() => {
    // Front page is Login Page by default!
    const rawHash = window.location.hash.replace('#', '');
    if (rawHash === 'manual') {
      return 'dashboard';
    }
    if (rawHash && ['auth', 'dashboard', 'live', 'upload', 'report', 'actions', 'history', 'settings', 'voice-onboarding', 'landing'].includes(rawHash)) {
      return rawHash;
    }
    return 'auth';
  });

  const handleGlobalNavigate = (view) => {
    setCurrentView(view);
    window.location.hash = view;
  };

  return (
    <ToastProvider>
      <AuthProvider onNavigate={handleGlobalNavigate}>
        <MeetingProvider>
          <AppContent
            currentView={currentView}
            setCurrentView={setCurrentView}
          />
        </MeetingProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;

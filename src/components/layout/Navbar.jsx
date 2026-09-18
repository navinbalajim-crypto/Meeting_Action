import React, { useState } from 'react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  Sparkles,
  Zap,
  Mic,
  Shield,
  Radio,
  User,
  LogOut,
  Settings,
  Plus,
  Compass,
  ListTodo,
  History,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMeeting } from '../../context/MeetingContext';

export const Navbar = ({ currentView, onNavigate, onOpenCreate, onLaunchDemo }) => {
  const { user, isAuthenticated, hasVoiceProfile, logout } = useAuth();
  const { socketStatus } = useMeeting();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: Compass },
    { id: 'live', label: 'Live Meeting', icon: Radio },
    { id: 'upload', label: 'Upload', icon: Plus },
    { id: 'actions', label: 'Action Tracker', icon: ListTodo },
    { id: 'history', label: 'Memory Archive', icon: History },
  ];

  const handleNav = (viewId) => {
    onNavigate(viewId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/8 glass-panel-elevated">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Product Tagline */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => handleNav(isAuthenticated ? 'dashboard' : 'auth')}
            className="flex items-center gap-2.5 group text-left focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-primary-hover to-accent flex items-center justify-center text-white shadow-glow-sm group-hover:shadow-glow-md transition-all">
              <Zap className="w-5 h-5 text-white animate-pulse-subtle" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-white tracking-tight font-display">
                  G13
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-ai/15 text-ai font-mono font-bold">
                  AI AGENT
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-0.5 tracking-wide hidden sm:block">
                Meeting-to-Action Intelligence
              </p>
            </div>
          </button>

          {/* Desktop Nav Links */}
          {isAuthenticated && (
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = currentView === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => handleNav(link.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-primary/15 text-white border border-primary/30 shadow-glow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right Status Indicators & User Controls */}
        <div className="flex items-center gap-3">
          {/* AI Agent Status Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-white/8 text-[11px] font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-ai animate-pulse" />
            <span className="text-slate-400">Agent:</span>
            <span className="text-white font-semibold">Ready</span>
          </div>

          {/* Voice Profile Indicator */}
          {isAuthenticated && (
            <button
              onClick={() => handleNav('voice-onboarding')}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono transition-all ${
                hasVoiceProfile
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 animate-pulse'
              }`}
              title="Voice representation for speaker distinction"
            >
              <Mic className="w-3 h-3" />
              <span>Voice:</span>
              <span className="font-bold">{hasVoiceProfile ? 'Active' : 'Setup Required'}</span>
            </button>
          )}

          {/* 1-Click Interactive Demo Tour Launcher */}
          {onLaunchDemo && (
            <button
              onClick={onLaunchDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-primary/20 via-ai/20 to-accent/20 hover:from-primary/30 hover:to-accent/30 border border-ai/40 text-xs font-semibold text-white shadow-glow-sm hover:shadow-glow-ai transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-ai animate-spin" style={{ animationDuration: '4s' }} />
              <span className="hidden sm:inline">Guided</span> Demo Tour
            </button>
          )}

          {/* User Auth or Sign In Button */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl bg-surface-elevated hover:bg-surface-highlight border border-white/10 transition-colors"
              >
                <div className="w-6 h-6 rounded-lg bg-primary/30 border border-primary/50 flex items-center justify-center text-[10px] font-bold text-white">
                  {user?.avatar || 'AR'}
                </div>
                <span className="text-xs font-semibold text-slate-200 hidden md:inline truncate max-w-[100px]">
                  {user?.name || 'Alex'}
                </span>
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-2xl glass-panel-elevated border border-white/10 shadow-2xl p-2 z-50 text-xs text-slate-200 animate-scale-in"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="p-2.5 border-b border-white/8 mb-1">
                    <p className="font-bold text-white text-sm truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-ai font-mono">
                      <Shield className="w-3 h-3" /> {user?.role || 'Host Lead'}
                    </div>
                  </div>

                  <button
                    onClick={() => handleNav('voice-onboarding')}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-white/5 flex items-center gap-2"
                  >
                    <Mic className="w-3.5 h-3.5 text-ai" />
                    <span>Manage Voice Profile</span>
                  </button>

                  <button
                    onClick={() => handleNav('settings')}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-white/5 flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>System Settings</span>
                  </button>

                  <div className="my-1 border-t border-white/8" />

                  <button
                    onClick={logout}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-rose-500/10 text-rose-300 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('auth')}
            >
              Sign In
            </Button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden p-4 border-t border-white/8 bg-[#080B16]/95 backdrop-blur-2xl space-y-2">
          {isAuthenticated ? (
            <>
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.id}
                    onClick={() => handleNav(link.id)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-200 hover:bg-white/5 text-left"
                  >
                    <Icon className="w-4 h-4 text-ai" />
                    <span>{link.label}</span>
                  </button>
                );
              })}
              <button
                onClick={() => handleNav('voice-onboarding')}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 text-left"
              >
                <Mic className="w-4 h-4" />
                <span>Voice Profile: {hasVoiceProfile ? 'Active' : 'Setup Required'}</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => handleNav('auth')}
              className="w-full py-2.5 text-center text-xs font-semibold rounded-xl bg-primary text-white"
            >
              Sign In to G13
            </button>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;

import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { 
  Zap, 
  Lock, 
  Mail, 
  User, 
  Building, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  UserPlus, 
  CheckCircle2 
} from 'lucide-react';

export const AuthPage = ({ onNavigate }) => {
  const { user, login, signup } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState({ message: '', isNotFound: false, isWrongPass: false });
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organization: ''
  });

  // If user is already authenticated, transition directly to dashboard
  React.useEffect(() => {
    if (user) {
      if (onNavigate) {
        onNavigate('dashboard');
      } else {
        window.location.hash = 'dashboard';
      }
    }
  }, [user, onNavigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorInfo({ message: '', isNotFound: false, isWrongPass: false });
    setSuccessMsg('');
    setLoading(true);

    try {
      if (tab === 'login') {
        const cleanEmail = (formData.email || '').trim();
        const cleanPass = formData.password || '';

        if (!cleanEmail || !cleanPass) {
          setErrorInfo({
            message: 'Please enter both your email address and password.',
            isNotFound: false,
            isWrongPass: false
          });
          setLoading(false);
          return;
        }

        await login(cleanEmail, cleanPass);
        if (onNavigate) {
          onNavigate('dashboard');
        } else {
          window.location.hash = 'dashboard';
        }
      } else if (tab === 'signup') {
        const cleanName = (formData.name || '').trim();
        const cleanEmail = (formData.email || '').trim();
        const cleanPass = formData.password || '';

        if (!cleanName || !cleanEmail || !cleanPass) {
          setErrorInfo({
            message: 'Please enter your full name, work email address, and password.',
            isNotFound: false,
            isWrongPass: false
          });
          setLoading(false);
          return;
        }

        if (cleanPass.length < 6) {
          setErrorInfo({
            message: 'Password must be at least 6 characters long.',
            isNotFound: false,
            isWrongPass: false
          });
          setLoading(false);
          return;
        }

        await signup(cleanName, cleanEmail, cleanPass, formData.organization || 'General');
        if (onNavigate) {
          onNavigate('dashboard');
        } else {
          window.location.hash = 'dashboard';
        }
      } else {
        setSuccessMsg('Password reset instructions sent to your email.');
        setTimeout(() => setTab('login'), 2000);
      }
    } catch (err) {
      const isNotFound = !!(
        err.notRegistered ||
        err.code === 'USER_NOT_FOUND' ||
        err.status === 404 ||
        err.message?.toLowerCase().includes('no account') ||
        err.message?.toLowerCase().includes('not found') ||
        err.message?.toLowerCase().includes('generate')
      );
      const isWrongPass = !!(
        err.code === 'WRONG_PASSWORD' ||
        err.message?.toLowerCase().includes('wrong') ||
        err.message?.toLowerCase().includes('incorrect password')
      );

      let message = err.message || 'Authentication failed. Please check credentials.';
      if (isNotFound) {
        message = 'No account found with this email ID. Please create an account to generate your User ID and password.';
      } else if (isWrongPass) {
        message = 'Wrong User ID or Password. Please check your credentials and try again.';
      }

      setErrorInfo({
        message,
        isNotFound,
        isWrongPass
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B16] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-ai/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-primary-hover to-accent text-white shadow-glow-md mb-2">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
            G13 Intelligence Platform
          </h2>
          <p className="text-xs text-slate-400">
            Secure enterprise workspace for executive meeting accountability
          </p>
        </div>

        {/* Auth Glass Card */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel-elevated border border-white/10 shadow-2xl space-y-6">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-black/40 border border-white/8 text-xs font-semibold">
            <button
              onClick={() => { setTab('login'); setErrorInfo({ message: '', isNotFound: false, isWrongPass: false }); }}
              className={`py-2 rounded-lg transition-all ${
                tab === 'login' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('signup'); setErrorInfo({ message: '', isNotFound: false, isWrongPass: false }); }}
              className={`py-2 rounded-lg transition-all ${
                tab === 'signup' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Success Message */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Message & Guided Recovery */}
          {errorInfo.message && (
            <div className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2.5 transition-all ${
              errorInfo.isNotFound 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              <div className="flex items-start gap-2.5">
                <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  errorInfo.isNotFound ? 'text-amber-400' : 'text-rose-400'
                }`} />
                <div className="flex-1 space-y-2">
                  <p className="font-semibold leading-normal">{errorInfo.message}</p>
                  
                  {/* If user is not present in DB, invite them to generate credentials */}
                  {errorInfo.isNotFound && (
                    <button
                      type="button"
                      onClick={() => {
                        setTab('signup');
                        setErrorInfo({ message: '', isNotFound: false, isWrongPass: false });
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[11px] font-bold tracking-wide transition-all shadow-sm"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Create Account (Generate ID & Password) →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Rivera"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#080B16] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Organization / Company <span className="text-[10px] text-slate-500 font-normal lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Acme Technologies"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#080B16] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#080B16] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                {tab === 'login' && (
                  <button
                    type="button"
                    onClick={() => setTab('forgot')}
                    className="text-[11px] text-ai hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#080B16] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 mt-2 text-sm shadow-glow-sm font-semibold"
              loading={loading}
              icon={ArrowRight}
            >
              {tab === 'login' ? 'Sign In to Workspace' : 'Create Account & Generate Credentials'}
            </Button>
          </form>

          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-400">
              New accounts automatically proceed to Voice Memory Onboarding to calibrate speaker recognition.
            </p>
          </div>
        </div>

        {/* Back to landing */}
        <div className="text-center">
          <button
            onClick={() => onNavigate('landing')}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            ← Back to Overview
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

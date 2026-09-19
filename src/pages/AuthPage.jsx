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
  CheckCircle2,
  Shield,
  KeyRound,
  ArrowLeftRight
} from 'lucide-react';

export const AuthPage = ({ onNavigate }) => {
  const { login, signup, loginDemo } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [portal, setPortal] = useState('user'); // 'user' | 'admin'
  const [signupRole, setSignupRole] = useState('user'); // 'user' | 'admin'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState({ 
    message: '', 
    isNotFound: false, 
    isWrongPass: false,
    isRoleMismatch: false,
    targetPortal: null
  });
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organization: ''
  });

  const handlePortalSwitch = (newPortal) => {
    setPortal(newPortal);
    setErrorInfo({ 
      message: '', 
      isNotFound: false, 
      isWrongPass: false,
      isRoleMismatch: false,
      targetPortal: null 
    });
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorInfo({ 
      message: '', 
      isNotFound: false, 
      isWrongPass: false,
      isRoleMismatch: false,
      targetPortal: null 
    });
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
            isWrongPass: false,
            isRoleMismatch: false,
            targetPortal: null
          });
          setLoading(false);
          return;
        }

        await login(cleanEmail, cleanPass, portal);
      } else if (tab === 'signup') {
        const cleanName = (formData.name || '').trim();
        const cleanEmail = (formData.email || '').trim();
        const cleanPass = formData.password || '';

        if (!cleanName || !cleanEmail || !cleanPass) {
          setErrorInfo({
            message: 'Please enter your full name, work email address, and password.',
            isNotFound: false,
            isWrongPass: false,
            isRoleMismatch: false,
            targetPortal: null
          });
          setLoading(false);
          return;
        }

        if (cleanPass.length < 6) {
          setErrorInfo({
            message: 'Password must be at least 6 characters long.',
            isNotFound: false,
            isWrongPass: false,
            isRoleMismatch: false,
            targetPortal: null
          });
          setLoading(false);
          return;
        }

        await signup(cleanName, cleanEmail, cleanPass, formData.organization || 'General', signupRole);
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
        err.message?.toLowerCase().includes('wrong user id') ||
        err.message?.toLowerCase().includes('incorrect password')
      );
      const isRoleMismatch = !!(
        err.roleMismatch ||
        err.code === 'ROLE_MISMATCH' ||
        err.status === 403 ||
        err.message?.toLowerCase().includes('access denied') ||
        err.message?.toLowerCase().includes('registered as')
      );

      let message = err.message || 'Authentication failed. Please check credentials.';
      let targetPortal = null;

      if (isRoleMismatch) {
        targetPortal = portal === 'admin' ? 'user' : 'admin';
        if (portal === 'admin') {
          message = 'Access Denied: This email is registered as a standard User. You cannot log into the Admin portal with a User account.';
        } else {
          message = 'Access Denied: This email is registered as an Administrator. You cannot log into the User portal with an Admin account.';
        }
      } else if (isNotFound) {
        message = 'No account found with this email ID. Please create an account to generate your User ID and password.';
      } else if (isWrongPass) {
        message = 'Wrong User ID or Password. Please check your credentials and try again.';
      }

      setErrorInfo({
        message,
        isNotFound,
        isWrongPass,
        isRoleMismatch,
        targetPortal
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setErrorInfo({ 
      message: '', 
      isNotFound: false, 
      isWrongPass: false,
      isRoleMismatch: false,
      targetPortal: null 
    });
    setSuccessMsg('');
    setLoading(true);
    try {
      await loginDemo(portal);
    } catch (err) {
      setErrorInfo({
        message: err.message || 'Demo login error. Please verify backend connection.',
        isNotFound: false,
        isWrongPass: false,
        isRoleMismatch: false,
        targetPortal: null
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B16] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Dynamic Background Ambient Glows */}
      <div 
        className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] blur-[120px] pointer-events-none transition-colors duration-700 ${
          portal === 'admin' ? 'bg-purple-600/15' : 'bg-primary/15'
        }`} 
      />
      <div 
        className={`absolute bottom-10 right-10 w-[350px] h-[350px] blur-[100px] pointer-events-none transition-colors duration-700 ${
          portal === 'admin' ? 'bg-amber-500/10' : 'bg-ai/10'
        }`} 
      />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl text-white shadow-glow-md mb-2 transition-all duration-500 ${
            portal === 'admin' 
              ? 'bg-gradient-to-br from-purple-600 via-indigo-600 to-amber-500 shadow-purple-500/20' 
              : 'bg-gradient-to-br from-primary via-primary-hover to-accent shadow-primary/20'
          }`}>
            {portal === 'admin' ? <ShieldCheck className="w-6 h-6 animate-pulse" /> : <Zap className="w-6 h-6 animate-pulse" />}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
            G13 Intelligence Platform
          </h2>
          <p className="text-xs text-slate-400">
            Secure enterprise workspace for executive meeting intelligence & accountability
          </p>
        </div>

        {/* Auth Glass Card */}
        <div className={`p-6 sm:p-8 rounded-3xl glass-panel-elevated border shadow-2xl space-y-6 transition-all duration-500 ${
          portal === 'admin' ? 'border-purple-500/30' : 'border-white/10'
        }`}>
          {/* Main View Mode: Sign In vs Create Account */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-black/40 border border-white/8 text-xs font-semibold">
            <button
              onClick={() => { 
                setTab('login'); 
                setErrorInfo({ message: '', isNotFound: false, isWrongPass: false, isRoleMismatch: false, targetPortal: null }); 
              }}
              className={`py-2 rounded-lg transition-all ${
                tab === 'login' 
                  ? (portal === 'admin' ? 'bg-purple-600 text-white shadow-sm' : 'bg-primary text-white shadow-sm')
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { 
                setTab('signup'); 
                setErrorInfo({ message: '', isNotFound: false, isWrongPass: false, isRoleMismatch: false, targetPortal: null }); 
              }}
              className={`py-2 rounded-lg transition-all ${
                tab === 'signup' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* TWO SEPARATE LOGINS: Admin vs User Role Segmented Switcher (Visible on Sign In) */}
          {tab === 'login' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold px-0.5">
                <span className="text-slate-400 uppercase tracking-wider">Select Login Portal</span>
                <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${
                  portal === 'admin' 
                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' 
                    : 'bg-primary/10 text-primary-soft border-primary/30'
                }`}>
                  {portal === 'admin' ? 'Elevated Clearance' : 'Standard Access'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/50 border border-white/10">
                {/* 1. User Login Tab */}
                <button
                  type="button"
                  onClick={() => handlePortalSwitch('user')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                    portal === 'user'
                      ? 'bg-gradient-to-b from-primary/30 to-primary/10 border border-primary/50 text-white shadow-md'
                      : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <User className={`w-4 h-4 ${portal === 'user' ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>User Login</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Team & Attendee
                  </span>
                </button>

                {/* 2. Admin Login Tab */}
                <button
                  type="button"
                  onClick={() => handlePortalSwitch('admin')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                    portal === 'admin'
                      ? 'bg-gradient-to-b from-purple-600/30 to-purple-800/10 border border-purple-500/50 text-white shadow-md'
                      : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Shield className={`w-4 h-4 ${portal === 'admin' ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span>Admin Login</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    Executive / System
                  </span>
                </button>
              </div>

              {/* Portal Information Banner */}
              <div className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${
                portal === 'admin'
                  ? 'bg-purple-950/30 border-purple-500/30 text-purple-200'
                  : 'bg-primary/10 border-primary/20 text-cyan-200'
              }`}>
                <KeyRound className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  {portal === 'admin' 
                    ? 'Admin Portal: Requires an email registered as Administrator. Standard user emails will be rejected.' 
                    : 'User Portal: For team members. Administrator emails must use the Admin Login portal.'}
                </span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Message & Guided Recovery (Including Role Authorization Mismatch) */}
          {errorInfo.message && (
            <div className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2.5 transition-all ${
              errorInfo.isRoleMismatch
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                : errorInfo.isNotFound 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              <div className="flex items-start gap-2.5">
                <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  errorInfo.isRoleMismatch 
                    ? 'text-rose-400' 
                    : errorInfo.isNotFound ? 'text-amber-400' : 'text-rose-400'
                }`} />
                <div className="flex-1 space-y-2">
                  <p className="font-semibold leading-normal">{errorInfo.message}</p>
                  
                  {/* Role Mismatch One-Click Portal Switch Action */}
                  {errorInfo.isRoleMismatch && errorInfo.targetPortal && (
                    <button
                      type="button"
                      onClick={() => handlePortalSwitch(errorInfo.targetPortal)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 text-[11px] font-bold tracking-wide transition-all shadow-sm"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
                      Switch to {errorInfo.targetPortal === 'admin' ? 'Admin Login' : 'User Login'} Portal →
                    </button>
                  )}

                  {/* If user is not present in DB, invite them to create credentials */}
                  {errorInfo.isNotFound && (
                    <button
                      type="button"
                      onClick={() => {
                        setTab('signup');
                        setErrorInfo({ message: '', isNotFound: false, isWrongPass: false, isRoleMismatch: false, targetPortal: null });
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
                {/* Account Type Selection on Signup */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Select Account Role <span className="text-ai font-normal">(Strict 1:1 Email Binding)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-black/40 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setSignupRole('user')}
                      className={`p-2.5 rounded-lg text-left transition-all border ${
                        signupRole === 'user'
                          ? 'bg-primary/20 border-primary text-white'
                          : 'border-transparent text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-xs font-bold">
                        <User className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Standard User</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Attendee & Meetings</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSignupRole('admin')}
                      className={`p-2.5 rounded-lg text-left transition-all border ${
                        signupRole === 'admin'
                          ? 'bg-purple-600/20 border-purple-500 text-white'
                          : 'border-transparent text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-xs font-bold">
                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                        <span>Administrator</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">System & Executive</p>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 px-1">
                    * Policy: An email cannot be registered for both roles. Each email address is strictly bound to one role.
                  </p>
                </div>

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
                {tab === 'login' && portal === 'admin' ? 'Administrator Email Address' : 'Work Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder={tab === 'login' && portal === 'admin' ? 'admin@company.com' : 'name@company.com'}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#080B16] border text-white placeholder-slate-500 focus:outline-none text-sm ${
                    portal === 'admin' && tab === 'login' 
                      ? 'border-purple-500/30 focus:border-purple-500' 
                      : 'border-white/10 focus:border-primary'
                  }`}
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
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#080B16] border text-white placeholder-slate-500 focus:outline-none text-sm ${
                    portal === 'admin' && tab === 'login' 
                      ? 'border-purple-500/30 focus:border-purple-500' 
                      : 'border-white/10 focus:border-primary'
                  }`}
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
              variant={tab === 'login' && portal === 'admin' ? 'secondary' : 'primary'}
              className={`w-full py-3 mt-2 text-sm font-semibold shadow-glow-sm ${
                tab === 'login' && portal === 'admin'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0'
                  : ''
              }`}
              loading={loading}
              icon={tab === 'login' && portal === 'admin' ? ShieldCheck : ArrowRight}
            >
              {tab === 'login'
                ? (portal === 'admin' ? 'Authenticate as Administrator' : 'Sign In as User')
                : `Create ${signupRole === 'admin' ? 'Administrator' : 'User'} Account`}
            </Button>
          </form>

          {/* Quick Demo Access Divider */}
          <div className="relative flex items-center justify-center pt-2">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#101526] px-3 text-[11px] text-slate-400 font-mono uppercase tracking-wider absolute">
              1-Click Demo Access
            </span>
          </div>

          {/* Portal-Specific 1-Click Demo Button */}
          {portal === 'admin' ? (
            <Button
              type="button"
              variant="secondary"
              className="w-full py-3 text-xs bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/40 text-purple-200"
              onClick={handleDemoSignIn}
              loading={loading}
              icon={Shield}
            >
              1-Click Admin Demo Login as Elena Rostova (Admin)
            </Button>
          ) : (
            <Button
              type="button"
              variant="ai"
              className="w-full py-3 text-xs"
              onClick={handleDemoSignIn}
              loading={loading}
              icon={Sparkles}
            >
              1-Click User Demo Login as Alex Rivera (Lead)
            </Button>
          )}

          <div className="text-center">
            <p className="text-[11px] text-slate-400">
              {portal === 'admin'
                ? 'Administrators have global visibility across meetings, system audio, and governance policies.'
                : 'New user accounts proceed to Voice Memory Onboarding to calibrate personalized speaker recognition.'}
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

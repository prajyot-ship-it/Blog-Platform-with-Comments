import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { 
  X, 
  LogIn, 
  UserPlus, 
  KeyRound, 
  Mail, 
  User as UserIcon, 
  Sparkles, 
  CheckCircle2,
  Lock
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { login, register, availableUsers, switchUser } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername.trim() || !password) return;

    try {
      setSubmitting(true);
      await login(emailOrUsername.trim(), password);
      toast('Signed in successfully', 'success');
      onClose();
    } catch (err: any) {
      toast(err.message || 'Failed to sign in', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !email.trim() || !password) return;

    try {
      setSubmitting(true);
      await register({
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        bio: bio.trim(),
      });
      toast('Account registered and signed in', 'success');
      onClose();
    } catch (err: any) {
      toast(err.message || 'Registration failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickPersona = async (userId: string, nameStr: string) => {
    try {
      await switchUser(userId);
      toast(`Signed in as ${nameStr}`, 'success');
      onClose();
    } catch {
      toast('Could not sign in with demo user', 'error');
    }
  };

  return (
    <div id="auth-modal-overlay" className="fixed inset-0 z-50 bg-[#1A1A17]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-[#DCDCD2] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[#DCDCD2] flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#1A1A17]">
              {mode === 'login' ? 'Sign In to Chronicle' : 'Create an Account'}
            </h3>
            <p className="text-xs text-[#5A5A4A] mt-0.5">
              {mode === 'login' ? 'Access your authored articles, drafts, and responses' : 'Start publishing your engineering and design insights'}
            </p>
          </div>
          <button
            id="close-auth-modal-btn"
            onClick={onClose}
            className="text-[#8C8C7A] hover:text-[#1A1A17] p-1.5 rounded-full hover:bg-[#F5F5F0] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Fast Test Personas */}
        <div className="px-6 py-3.5 bg-[#F5F5F0] border-b border-[#DCDCD2]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#5A5A40]" />
            <span>1-Click Demo Profiles (Instant Test)</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            {availableUsers.slice(0, 3).map((u) => (
              <button
                key={u.id}
                id={`quick-login-${u.id}`}
                type="button"
                onClick={() => handleQuickPersona(u.id, u.name)}
                className="p-2.5 rounded-2xl bg-white hover:bg-[#E5E5DE] border border-[#DCDCD2] text-center transition-all cursor-pointer shadow-2xs group"
              >
                <img
                  src={u.avatarUrl}
                  alt={u.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover mx-auto mb-1 border border-[#DCDCD2]"
                />
                <p className="text-[11px] font-bold text-[#3A3A2C] truncate group-hover:text-[#1A1A17]">{u.name.split(' ')[0]}</p>
                <p className="text-[9px] text-[#8C8C7A] uppercase font-semibold tracking-wider truncate">{u.role}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Auth Mode Tabs */}
        <div className="flex border-b border-[#DCDCD2]">
          <button
            id="auth-tab-login"
            onClick={() => setMode('login')}
            className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer text-center ${
              mode === 'login'
                ? 'border-b-2 border-[#3A3A2C] text-[#1A1A17] bg-white'
                : 'text-[#8C8C7A] hover:text-[#33332D] bg-[#FDFCFB]'
            }`}
          >
            Sign In
          </button>
          <button
            id="auth-tab-register"
            onClick={() => setMode('register')}
            className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer text-center ${
              mode === 'register'
                ? 'border-b-2 border-[#3A3A2C] text-[#1A1A17] bg-white'
                : 'text-[#8C8C7A] hover:text-[#33332D] bg-[#FDFCFB]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Forms */}
        <div className="p-6">
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#3A3A2C]">Email or Username</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8C8C7A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-email-input"
                    type="text"
                    required
                    placeholder="alex@example.com or alex_rivera"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DCDCD2] focus:border-[#5A5A40] focus:ring-2 focus:ring-[#E5E5DE] outline-hidden placeholder:text-[#8C8C7A] text-[#1A1A17]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#3A3A2C]">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8C8C7A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-password-input"
                    type="password"
                    required
                    placeholder="password123"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DCDCD2] focus:border-[#5A5A40] focus:ring-2 focus:ring-[#E5E5DE] outline-hidden placeholder:text-[#8C8C7A] text-[#1A1A17]"
                  />
                </div>
              </div>

              <button
                id="submit-login-btn"
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 mt-2 bg-[#3A3A2C] hover:bg-[#1A1A17] disabled:opacity-50 text-white text-[11px] font-bold uppercase tracking-wider rounded-full shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{submitting ? 'Signing in...' : 'Sign In'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#3A3A2C]">Full Name</label>
                <input
                  id="register-name-input"
                  type="text"
                  required
                  placeholder="Elena Rostova"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-[#DCDCD2] focus:border-[#5A5A40] outline-hidden placeholder:text-[#8C8C7A] text-[#1A1A17]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#3A3A2C]">Username</label>
                  <input
                    id="register-username-input"
                    type="text"
                    required
                    placeholder="elena_dev"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-[#DCDCD2] focus:border-[#5A5A40] outline-hidden placeholder:text-[#8C8C7A] text-[#1A1A17]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-[#3A3A2C]">Password</label>
                  <input
                    id="register-password-input"
                    type="password"
                    required
                    placeholder="Create password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-sm px-3.5 py-2 rounded-xl border border-[#DCDCD2] focus:border-[#5A5A40] outline-hidden placeholder:text-[#8C8C7A] text-[#1A1A17]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#3A3A2C]">Email Address</label>
                <input
                  id="register-email-input"
                  type="email"
                  required
                  placeholder="elena@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-[#DCDCD2] focus:border-[#5A5A40] outline-hidden placeholder:text-[#8C8C7A] text-[#1A1A17]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#3A3A2C]">Bio / Headline</label>
                <input
                  id="register-bio-input"
                  type="text"
                  placeholder="Software Engineer, interested in compilers & distributed web."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full text-sm px-3.5 py-2 rounded-xl border border-[#DCDCD2] focus:border-[#5A5A40] outline-hidden placeholder:text-[#8C8C7A] text-[#1A1A17]"
                />
              </div>

              <button
                id="submit-register-btn"
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 mt-2 bg-[#3A3A2C] hover:bg-[#1A1A17] disabled:opacity-50 text-white text-[11px] font-bold uppercase tracking-wider rounded-full shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{submitting ? 'Creating account...' : 'Create Account'}</span>
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, UserCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/authService.js';

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState('Operator');
  const [email, setEmail] = useState('operator@resq.local');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authService.login(email, password);
      // We also need to map the backend 'role' to what the frontend expects ('Operator', 'User', etc)
      // The frontend uses 'localStorage.setItem('resq_role', role)' for routing.
      let frontendRole = 'User';
      if (['operator', 'admin', 'coordinator', 'resource_manager', 'analyst'].includes(data.user.role)) {
        frontendRole = 'Operator';
      }
      localStorage.setItem('resq_role', frontendRole);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-textPrimary">Sign in to workspace</h2>
        <p className="text-sm text-textSecondary mt-1">Enter your credentials to access the operations center.</p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-critical/10 border border-critical/20 rounded-lg flex items-start gap-3">
          <AlertCircle size={18} className="text-critical shrink-0 mt-0.5" />
          <p className="text-sm text-critical">{error}</p>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-textSecondary mb-1.5">
            Login Type (Role)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserCircle size={18} className="text-textSecondary" />
            </div>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setError('');
                if (e.target.value === 'User') {
                  setEmail('user@resq.local');
                  setPassword('password123');
                }
                if (e.target.value === 'Operator') {
                  setEmail('operator@resq.local');
                  setPassword('password123');
                }
                if (e.target.value === 'Admin') {
                  setEmail('admin@resq.local');
                  setPassword('password123');
                }
              }}
              className="block w-full pl-10 pr-3 py-2.5 border border-borderSubtle rounded-lg bg-surfaceSecondary text-textPrimary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all sm:text-sm appearance-none"
            >
              <option value="Operator">Operator</option>
              <option value="User">Standard User</option>
              <option value="Admin">Admin / Manager</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-textSecondary mb-1.5">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail size={18} className="text-textSecondary" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-borderSubtle rounded-lg bg-surfaceSecondary text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all sm:text-sm"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-textSecondary mb-1.5">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock size={18} className="text-textSecondary" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-10 py-2.5 border border-borderSubtle rounded-lg bg-surfaceSecondary text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all sm:text-sm"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-textSecondary hover:text-textPrimary transition-colors focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-borderSubtle bg-surfaceSecondary text-primary focus:ring-primary focus:ring-offset-background"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-textSecondary">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <a href="#" className="font-medium text-primary hover:text-blue-400 transition-colors">
              Forgot password?
            </a>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary transition-all shadow-[0_0_20px_rgba(79,125,243,0.3)] disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </div>
      </form>
      
      <div className="mt-6 border-t border-borderSubtle pt-6">
        <div className="rounded-md bg-primary/10 p-4 border border-primary/20">
          <div className="text-sm text-primary font-medium">Backend Connected</div>
          <div className="mt-1 text-xs text-primary/80">
            Authentication is now running through the real backend API. Use admin@resq.local or operator@resq.local with password: password123.
          </div>
        </div>
      </div>
    </div>
  );
}

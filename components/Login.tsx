import React, { useState } from 'react';
import { Icons } from './Icon';
import { AuthService } from '../services/authService';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Mock password
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (isSignup) {
      const user = AuthService.signup(email);
      if (user) {
        onLogin(user);
      } else {
        setError('User already exists');
      }
    } else {
      const user = AuthService.login(email);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid credentials (try signing up if you are new)');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Icons.Wand2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">EcomLens AI</h1>
          <p className="text-indigo-100 mt-2">Professional Product Photography</p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 text-center">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Icons.User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Icons.Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
                <Icons.AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-lg shadow-indigo-200"
            >
              {isSignup ? 'Sign Up' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setIsSignup(!isSignup);
                setError('');
              }}
              className="text-indigo-600 font-medium hover:text-indigo-700"
            >
              {isSignup ? 'Login' : 'Sign up'}
            </button>
          </div>
          
          {!isSignup && (
             <div className="mt-4 text-xs text-center text-slate-400">
               Demo Admin: admin@admin.com / admin
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { GraduationCap, Lock, Mail, User as UserIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      if (fullName.trim().length < 2) {
        setError('Please enter your full name');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName.trim());
      if (error) setError(error);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Saint image — side panel on desktop, banner on mobile */}
      <div className="relative flex flex-col justify-end bg-primary-950 overflow-hidden h-64 lg:h-auto lg:w-1/2 flex-shrink-0">
        <img
          src="https://images.pexels.com/photos/24238428/pexels-photo-24238428.jpeg?auto=compress&cs=tinysrgb&h=1200&w=900"
          alt="St. Martin de Porres"
          className="absolute inset-0 w-full h-full object-cover object-center"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-950 via-primary-950/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-950/40 to-transparent" />
        <div className="relative z-10 text-center px-6 py-5 lg:px-12 lg:pb-10">
          <p className="font-serif text-white text-xl lg:text-2xl font-semibold mb-1 lg:mb-2 drop-shadow-lg">St. Martin de Porres</p>
          <p className="text-primary-100 text-xs lg:text-sm leading-relaxed max-w-sm mx-auto hidden lg:block drop-shadow">
            "Compassion is the fullness of charity. Everything, even sin, can become a path of love if it is met with compassion."
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 flex items-center justify-center p-4 relative flex-1">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-md animate-slide-up">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur rounded-2xl mb-4 ring-1 ring-white/20">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-serif text-3xl text-white font-bold">Rubya Seminary</h1>
            <p className="text-primary-200 mt-1 text-sm">Class of 2025 — Reconnect & Chat</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'signin' ? 'bg-white shadow text-primary-700' : 'text-gray-500'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'signup' ? 'bg-white shadow text-primary-700' : 'text-gray-500'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 border border-red-100 animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            For graduates of Rubya Seminary, Class of 2025
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}

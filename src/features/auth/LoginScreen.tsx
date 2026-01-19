import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-base-300 font-inter">
      <div className="card w-full max-w-sm bg-base-200 shadow-xl border border-base-content/10">
        <div className="card-body">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-primary mb-1">
              reIS <span className="text-base-content font-normal opacity-70">Admin</span>
            </h1>
            <p className="text-sm opacity-50">Správa notifikací pro spolky</p>
          </div>

          {error && (
            <div className="alert alert-error text-sm shadow-lg mb-4 flex items-center gap-2 p-3">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@spolek.cz"
                  className="input input-bordered w-full pl-10"
                  required
                  autoComplete="email"
                />
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Heslo</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input input-bordered w-full pl-10"
                  required
                  autoComplete="current-password"
                />
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
              </div>
            </div>

            <div className="form-control mt-6">
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Přihlašování...
                  </>
                ) : (
                  'Vstoupit'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

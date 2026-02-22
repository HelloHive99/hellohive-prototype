'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function DemoAccessPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/demo-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Invalid access code.');
        setLoading(false);
        return;
      }
      router.push('/login');
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #4B0082 0%, #1a0040 100%)' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Hello<span style={{ color: '#FFD700' }}>Hive</span>
          </h1>
          <p className="text-purple-200 mt-2 text-sm">Facilities Operations Platform</p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <h2 className="text-xl font-semibold text-white mb-1">Demo Access</h2>
          <p className="text-sm text-purple-300 mb-6">Access code provided by HelloHive</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-100 mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full px-4 py-2.5 rounded-lg text-white placeholder-purple-300 transition-colors focus:outline-none"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
                placeholder="Username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-100 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-2.5 rounded-lg text-white placeholder-purple-300 transition-colors focus:outline-none"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-red-300 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-semibold text-neutral-900 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ backgroundColor: '#FFD700' }}
            >
              {loading ? 'Verifying…' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

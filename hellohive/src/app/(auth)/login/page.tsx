'use client';

import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const DEMO_ACCOUNTS = [
  { name: 'Marcus Reyes', email: 'marcus@hellohive.io', role: 'Team-Admin', desc: 'Full platform access' },
  { name: 'Sarah Chen', email: 'sarah@hellohive.io', role: 'Team-OpsCoordinator', desc: 'Operations command center' },
  { name: 'James Whitfield', email: 'james@hellohive.io', role: 'Team-Viewer', desc: 'Executive read-only view' },
  { name: 'Derek Morales', email: 'derek@morales-hvac.com', role: 'Vendor-Tech', desc: 'Field technician portal' },
  { name: 'Johnson Controls', email: 'dispatch@johnsoncontrols.com', role: 'Vendor-Admin', desc: 'Company dispatch view' },
  { name: 'Michael Torres', email: 'm.torres@johnsoncontrols.com', role: 'Vendor-Tech', desc: 'CRAC unit repair — WO-2026-0044' },
  { name: 'Angela Martinez', email: 'a.martinez@johnsoncontrols.com', role: 'Vendor-Tech', desc: 'HVAC zone repair — WO-2026-0040' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Invalid email or password.');
      return;
    }

    router.push('/?welcome=1');
    router.refresh();
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('HelloHive2025!');
    setError('');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #4B0082 0%, #1a0040 100%)' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Hello<span style={{ color: '#FFD700' }}>Hive</span>
          </h1>
          <p className="text-purple-200 mt-2 text-sm">Facilities Operations Platform</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.07)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <h2 className="text-xl font-semibold text-white mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-100 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-lg text-white placeholder-purple-300 transition-colors focus:outline-none"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
                placeholder="you@example.com"
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
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.15)' }} />
              <span className="text-xs text-purple-300 uppercase tracking-wider font-medium">Demo accounts</span>
              <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.15)' }} />
            </div>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillDemo(account.email)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-left transition-colors group"
                  style={{
                    background: email === account.email ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.04)',
                    border: email === account.email ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div>
                    <p className="text-sm font-medium text-white">{account.name}</p>
                    <p className="text-xs text-purple-300 mt-0.5">{account.desc}</p>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-3"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {account.role}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-purple-400 text-center mt-3">
              Click a row to auto-fill — all accounts share the same password.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

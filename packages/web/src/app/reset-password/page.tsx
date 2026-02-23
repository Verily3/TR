'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Missing or invalid reset link. Please request a new one.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Invalid or expired reset link. Please request a new one.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {done ? (
        <div className="text-center space-y-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              Your password has been updated. Redirecting you to sign in...
            </p>
          </div>
          <Link href="/login" className="block text-sm text-red-600 hover:text-red-700 font-medium">
            Sign in now
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              New password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={!token}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 disabled:text-gray-400"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-gray-700">
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              disabled={!token}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-50 disabled:text-gray-400"
              placeholder="Re-enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !token}
            className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Updating...' : 'Set new password'}
          </button>

          <div className="text-center">
            <Link href="/forgot-password" className="text-sm text-gray-500 hover:text-gray-700">
              Request a new link
            </Link>
          </div>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-center text-gray-900">Results Tracking System</h1>
          <p className="mt-2 text-center text-gray-600">Set your new password</p>
        </div>
        <Suspense fallback={<div className="text-center text-sm text-gray-500">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}

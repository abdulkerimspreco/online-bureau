import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import TextInput from '../components/ui/TextInput';
import { resetPassword } from '../api/auth/auth.api';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const hasToken = Boolean(token);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordHint = useMemo(
    () =>
      'Use at least 8 characters with one uppercase letter, one number, and one special character.',
    [],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!hasToken) {
      setError('Missing password reset token.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await resetPassword({ token, password });
      setMessage(response.message);
      setPassword('');
      setConfirmPassword('');
      window.setTimeout(() => {
        navigate('/login');
      }, 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Create a new password for your account."
    >
      <div className="space-y-5 text-sm leading-6 text-slate-600">
        <div
          className={`rounded-2xl border px-4 py-4 ${
            hasToken
              ? 'border-sky-200 bg-sky-50 text-sky-900'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {hasToken
            ? 'Your reset token was detected. Set a new password below.'
            : 'Missing password reset token.'}
        </div>

        {hasToken ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <TextInput
              label="New password"
              type="password"
              placeholder="Password1!"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <TextInput
              label="Confirm new password"
              type="password"
              placeholder="Repeat your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <p className="text-xs text-slate-500">{passwordHint}</p>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {message}
              </div>
            ) : null}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Resetting password...' : 'Reset password'}
            </Button>
          </form>
        ) : null}

        <p>
          <Link
            to="/forgot-password"
            className="font-medium text-slate-900 underline underline-offset-4"
          >
            Request another reset link
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

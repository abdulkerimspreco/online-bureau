import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout';
import Button from '../components/ui/Button';
import TextInput from '../components/ui/TextInput';
import { requestPasswordReset } from '../api/auth/auth.api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resetPreviewUrl, setResetPreviewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setResetPreviewUrl('');
    setIsSubmitting(true);

    try {
      const response = await requestPasswordReset({ email });
      setMessage(response.message);
      setResetPreviewUrl(response.resetPreviewUrl ?? '');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to request a password reset.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we’ll generate a time-limited password reset link."
    >
      <div className="space-y-5 text-sm leading-6 text-slate-600">
        <form onSubmit={handleSubmit} className="space-y-5">
          <TextInput
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

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
            {isSubmitting ? 'Generating link...' : 'Send reset link'}
          </Button>
        </form>

        {resetPreviewUrl ? (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4">
            <p className="font-medium text-sky-900">Development preview link</p>
            <p className="mt-2 text-sky-800">
              This milestone build shows the generated reset link directly
              instead of sending a real email.
            </p>
            <a
              href={resetPreviewUrl}
              className="mt-3 inline-flex text-sm font-medium text-slate-900 underline underline-offset-4"
            >
              Open reset link
            </a>
          </div>
        ) : null}

        <p>
          Remembered your password?{' '}
          <Link
            to="/login"
            className="font-medium text-slate-900 underline underline-offset-4"
          >
            Return to login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
